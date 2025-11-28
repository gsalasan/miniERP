import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customer: {
    name: string;
    address: string;
    city: string;
    district?: string;
    picName?: string;
    picEmail?: string;
    picPhone?: string;
  };
  opportunity: {
    projectName: string;
    description: string;
  };
  salesPerson: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    itemName: string;
    description?: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
  pricing: {
    subtotal: number;
    discountPercentage: number;
    discountAmount: number;
    subtotalAfterDiscount: number;
    taxPercentage: number;
    taxAmount: number;
    grandTotal: number;
    currency: string;
  };
  terms?: {
    paymentTerms?: string;
    deliveryTerms?: string;
    warranty?: string;
    notes?: string;
  };
}

export const generateQuotationPDF = (data: QuotationData) => {
  const doc = new jsPDF();

  // Page setup
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = pageWidth - 15;

  // ============ HEADER ============
  // Company name and address centered at the top
  let yPos = 12;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PT. Unais Creaasindo Multiverse", pageWidth / 2, yPos, { align: "center", });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Contoh No. 123, Jakarta Selatan", pageWidth / 2, yPos + 6, { align: "center", });
  doc.text("Telp: (021) 1234-5678 | info@unais.co.id", pageWidth / 2, yPos + 11, { align: "center", });

  // horizontal separator under company info
  yPos += 18;
  doc.setLineWidth(0.6);
  doc.line(marginLeft, yPos, marginRight, yPos);

  // Title below the separator
  yPos += 8;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("PENAWARAN HARGA", pageWidth / 2, yPos, { align: "center", });

  // Move cursor below header
  yPos += 8;

  // ============ QUOTATION INFO BOX ============
  yPos += 10;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("No. Quotation", marginLeft, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${data.quotationNumber}`, marginLeft + 35, yPos);

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Tanggal", marginLeft, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(
    `: ${new Date(data.quotationDate).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    marginLeft + 35,
    yPos,
  );

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Berlaku Hingga", marginLeft, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(
    `: ${new Date(data.validUntil).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}`,
    marginLeft + 35,
    yPos,
  );

  // ============ CUSTOMER & PROJECT INFO ============
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("KEPADA YTH", marginLeft, yPos);
  doc.setFont("helvetica", "normal");

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.text(data.customer.name, marginLeft, yPos);
  doc.setFont("helvetica", "normal");

  const customerAddress = [
    data.customer.address,
    `${data.customer.city}${data.customer.district ? ", " + data.customer.district : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
  const custLines = doc.splitTextToSize(customerAddress, pageWidth - marginLeft - 30);
  doc.text(custLines, marginLeft, yPos + 5);

  let rightY = yPos - 5;
  const rightX = marginLeft + 110;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("PERIHAL", rightX, rightY);
  doc.setFont("helvetica", "normal");

  const projLines = doc.splitTextToSize(data.opportunity.projectName, marginRight - rightX);
  doc.text(projLines, rightX, rightY + 5);
  if (data.opportunity.description) {
    const descLines = doc.splitTextToSize(data.opportunity.description, marginRight - rightX);
    doc.setFontSize(8);
    doc.text(descLines, rightX, rightY + 10 + projLines.length * 4);
    doc.setFontSize(9);
  }

  // ============ INTRODUCTION ============
  // Compute bottom of customer block and project block so intro isn't cut
  const custBlockBottom = yPos + 5 + (custLines ? custLines.length * 4 : 0);
  const projBlockBottom = rightY + 10 + (projLines ? projLines.length * 4 : 0);
  yPos = Math.max(custBlockBottom, projBlockBottom) + 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dengan hormat,", marginLeft, yPos);
  yPos += 5;
  doc.text("Bersama ini kami mengajukan penawaran harga untuk:", marginLeft, yPos);
  yPos += 8;

  // Items Table
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    `${item.itemName}${item.description ? "\n" + item.description : ""}`,
    item.quantity.toString(),
    item.unit,
    `Rp ${item.unitPrice.toLocaleString("id-ID")}`,
    `Rp ${item.totalPrice.toLocaleString("id-ID")}`,
  ]);

  // ============ ITEMS TABLE (only item names in blue) ============
  const blue: [number, number, number] = [0, 71, 171];
  autoTable(doc, {
    startY: yPos,
    head: [["No", "Deskripsi Item", "Qty", "Satuan", "Harga Satuan", "Total"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    alternateRowStyles: undefined,
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: 70 },
      2: { cellWidth: 15, halign: "center" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 35, halign: "right" },
      5: { cellWidth: 35, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.dataKey === 1) {
        dataCell.cell.styles.textColor = blue;
      }
    },
  });

  // ============ PRICING SUMMARY ============
  yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;

  const summaryX = marginLeft + 90;
  const summaryValueX = marginRight;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", summaryX, yPos);
  doc.text(`Rp ${data.pricing.subtotal.toLocaleString("id-ID")}`, summaryValueX, yPos, {
    align: "right",
  });

  yPos += 5;
  if (data.pricing.discountPercentage > 0) {
    doc.text(`Diskon (${data.pricing.discountPercentage}%):`, summaryX, yPos);
    doc.text(`- Rp ${data.pricing.discountAmount.toLocaleString("id-ID")}`, summaryValueX, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Subtotal setelah diskon:", summaryX, yPos);
    doc.text(
      `Rp ${data.pricing.subtotalAfterDiscount.toLocaleString("id-ID")}`,
      summaryValueX,
      yPos,
      { align: "right" },
    );
    yPos += 5;
  }

  doc.text(`PPN (${data.pricing.taxPercentage}%):`, summaryX, yPos);
  doc.text(`Rp ${data.pricing.taxAmount.toLocaleString("id-ID")}`, summaryValueX, yPos, {
    align: "right",
  });

  // Total (bold, no background)
  yPos += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL:", summaryX, yPos);
  doc.text(`Rp ${data.pricing.grandTotal.toLocaleString("id-ID")}`, summaryValueX, yPos, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");

  yPos += 8;

  // ============ TERMS AND CONDITIONS ============
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("SYARAT & KETENTUAN", marginLeft, yPos);

  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (data.terms?.paymentTerms) {
    doc.text(`• Pembayaran: ${data.terms.paymentTerms}`, marginLeft, yPos);
    yPos += 5;
  }
  if (data.terms?.deliveryTerms) {
    doc.text(`• Pengiriman: ${data.terms.deliveryTerms}`, marginLeft, yPos);
    yPos += 5;
  }
  if (data.terms?.warranty) {
    doc.text(`• Garansi: ${data.terms.warranty}`, marginLeft, yPos);
    yPos += 5;
  }

  // ============ CLOSING ============
  yPos += 8;
  doc.setFontSize(9);
  const closing = doc.splitTextToSize(
    "Demikian penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.",
    pageWidth - marginLeft - 20,
  );
  doc.text(closing, marginLeft, yPos);

  // ============ SIGNATURE ============
  yPos += 12;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text("Hormat kami,", marginLeft, yPos);

  yPos += 15; // Space for signature
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(data.salesPerson.name, marginLeft, yPos);

  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.salesPerson.email, marginLeft, yPos);

  if (data.salesPerson.phone) {
    yPos += 4;
    doc.text(data.salesPerson.phone, marginLeft, yPos);
  }

  // ============ FOOTER ============
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(
    "Quotation ini dibuat secara elektronik dan sah tanpa tanda tangan basah",
    pageWidth / 2,
    pageHeight - 10,
    { align: "center" },
  );
  doc.text(
    `Halaman 1 | Dicetak pada: ${new Date().toLocaleString("id-ID")}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: "center" },
  );

  // Save PDF
  const safeCustomer = data.customer.name.replace(/[^a-z0-9_-]/gi, "_").replace(/_+/g, "_");
  const fileName = `Quotation_${data.quotationNumber}_${safeCustomer}.pdf`;
  doc.save(fileName);
};
