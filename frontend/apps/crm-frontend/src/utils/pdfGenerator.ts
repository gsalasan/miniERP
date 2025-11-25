/**
 * PDF Generator Utility
 * Generate quotation PDF using jsPDF and autoTable
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { QuotationData } from "../types/quotation";

export interface QuotationGenerateOptions {
  includeCompanyLogo?: boolean;
  includeSignature?: boolean;
  language?: "id" | "en";
  paperSize?: "a4" | "letter";
}

/**
 * Format currency to Indonesian Rupiah
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Indonesian format
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

/**
 * Generate Quotation PDF
 */
export const generateQuotationPDF = (
  data: QuotationData,
  options: QuotationGenerateOptions = {},
): void => {
  const { language = "id", paperSize = "a4" } = options;

  // Create new PDF document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: paperSize,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // ===== HEADER SECTION =====
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(data.quotationNumber, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // ===== COMPANY & CUSTOMER INFO SECTION =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PT. Unais Creaasindo Multiverse", 14, yPosition);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  yPosition += 5;
  doc.text("Jl. ", 14, yPosition);
  yPosition += 4;
  doc.text("Email:  | Phone: +62 ", 14, yPosition);

  yPosition += 10;

  // Customer Information (Right side)
  const customerX = pageWidth - 14;
  let customerY = 45;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Kepada:", customerX, customerY, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  customerY += 5;
  doc.text(data.customer.name, customerX, customerY, { align: "right" });

  if (data.customer.address) {
    customerY += 4;
    const fullAddress = `${data.customer.address}, ${data.customer.city}`;
    const addressLines = doc.splitTextToSize(fullAddress, 80);
    addressLines.forEach((line: string) => {
      doc.text(line, customerX, customerY, { align: "right" });
      customerY += 4;
    });
  }

  if (data.customer.picName) {
    customerY += 4;
    doc.text(`PIC: ${data.customer.picName}`, customerX, customerY, { align: "right" });
  }

  yPosition = Math.max(yPosition, customerY + 10);

  // ===== QUOTATION DETAILS =====
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const detailsY = yPosition;
  doc.text(`Tanggal: ${formatDate(data.quotationDate)}`, 14, detailsY);
  doc.text(`Berlaku Hingga: ${formatDate(data.validUntil)}`, 14, detailsY + 5);
  doc.text(`Proyek: ${data.opportunity.projectName}`, 14, detailsY + 10);
  doc.text(`Sales: ${data.salesPerson.name}`, 14, detailsY + 15);

  yPosition = detailsY + 25;

  // ===== ITEMS TABLE =====
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    item.itemName,
    item.description || "-",
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.unitPrice),
    formatCurrency(item.totalPrice),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [["No", "Item", "Deskripsi", "Qty", "Unit", "Harga Satuan", "Total"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontSize: 9,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 45 },
      3: { halign: "center", cellWidth: 15 },
      4: { halign: "center", cellWidth: 15 },
      5: { halign: "right", cellWidth: 30 },
      6: { halign: "right", cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  // Get Y position after table
  yPosition = (doc as any).lastAutoTable.finalY + 10;

  // ===== SUMMARY SECTION =====
  const summaryX = pageWidth - 14;
  const summaryLabelX = summaryX - 60;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text("Subtotal:", summaryLabelX, yPosition);
  doc.text(formatCurrency(data.pricing.subtotal), summaryX, yPosition, { align: "right" });

  yPosition += 5;
  const discountLabel = data.pricing.discountPercentage
    ? `Diskon (${data.pricing.discountPercentage}%):`
    : "Diskon:";
  doc.text(discountLabel, summaryLabelX, yPosition);
  doc.text(`- ${formatCurrency(data.pricing.discountAmount)}`, summaryX, yPosition, {
    align: "right",
  });

  yPosition += 5;
  const taxLabel = data.pricing.taxPercentage ? `PPN (${data.pricing.taxPercentage}%):` : "PPN:";
  doc.text(taxLabel, summaryLabelX, yPosition);
  doc.text(formatCurrency(data.pricing.taxAmount), summaryX, yPosition, { align: "right" });

  yPosition += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", summaryLabelX, yPosition);
  doc.text(formatCurrency(data.pricing.grandTotal), summaryX, yPosition, { align: "right" });

  yPosition += 15;

  // ===== NOTES SECTION =====
  if (data.terms?.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Catatan:", 14, yPosition);

    yPosition += 5;
    doc.setFont("helvetica", "normal");
    const notesLines = doc.splitTextToSize(data.terms.notes, pageWidth - 28);
    doc.text(notesLines, 14, yPosition);
    yPosition += notesLines.length * 4 + 10;
  }

  // ===== TERMS & CONDITIONS =====
  if (data.terms?.paymentTerms || data.terms?.deliveryTerms) {
    // Add new page if needed
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Syarat dan Ketentuan:", 14, yPosition);

    yPosition += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    if (data.terms.paymentTerms) {
      doc.text(`Pembayaran: ${data.terms.paymentTerms}`, 14, yPosition);
      yPosition += 5;
    }
    if (data.terms.deliveryTerms) {
      doc.text(`Pengiriman: ${data.terms.deliveryTerms}`, 14, yPosition);
      yPosition += 5;
    }
    if (data.terms.warranty) {
      doc.text(`Garansi: ${data.terms.warranty}`, 14, yPosition);
      yPosition += 5;
    }
    yPosition += 5;
  } else {
    // Default Terms
    if (yPosition > pageHeight - 50) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Syarat dan Ketentuan:", 14, yPosition);

    yPosition += 6;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

    const defaultTerms = [
      "1. Harga berlaku sesuai dengan periode validitas yang tertera.",
      "2. Pembayaran dilakukan sesuai dengan termin yang disepakati.",
      "3. Quotation ini tidak mengikat hingga Purchase Order diterbitkan.",
      "4. Perubahan scope akan mengubah harga dan timeline.",
    ];

    defaultTerms.forEach((term) => {
      doc.text(term, 14, yPosition);
      yPosition += 5;
    });
  }

  // ===== SIGNATURE SECTION =====
  yPosition += 10;
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  const signatureY = yPosition;
  doc.text("Hormat kami,", 14, signatureY);
  doc.text("Menyetujui,", pageWidth - 60, signatureY);

  yPosition += 20;
  doc.setFont("helvetica", "bold");
  doc.text(data.salesPerson.name, 14, yPosition);
  doc.text("(................................)", pageWidth - 60, yPosition);

  yPosition += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("PT. MiniERP Indonesia", 14, yPosition);

  const customerContactName = data.customer.picName || data.customer.name;
  doc.text(customerContactName, pageWidth - 60, yPosition);

  // ===== FOOTER =====
  const footerY = pageHeight - 10;
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text("Document generated by MiniERP CRM System", pageWidth / 2, footerY, { align: "center" });

  // ===== SAVE PDF =====
  const fileName = `Quotation_${data.quotationNumber}_${data.customer.name.replace(/\s+/g, "_")}.pdf`;
  doc.save(fileName);
};

export default generateQuotationPDF;
