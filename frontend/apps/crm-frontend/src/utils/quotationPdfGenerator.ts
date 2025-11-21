import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Company Header
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 15;
  const marginRight = 195;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PT. NAMA PERUSAHAAN', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const companyLines = doc.splitTextToSize('Alamat Perusahaan, Kota - Jalan Contoh No. 123, Kelurahan, Kecamatan, Kota', pageWidth - marginLeft - 20);
  doc.text(companyLines, pageWidth / 2, 27, { align: 'center' });
  doc.text('Telp: (021) 1234-5678 | Email: info@perusahaan.com', pageWidth / 2, 34, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(15, 37, 195, 37);
  
  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PENAWARAN HARGA', 105, 45, { align: 'center' });
  
  // Quotation Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. Quotation: ${data.quotationNumber}`, marginLeft, 55);
  doc.text(`Tanggal: ${new Date(data.quotationDate).toLocaleDateString('id-ID')}`, marginLeft, 60);
  doc.text(`Berlaku hingga: ${new Date(data.validUntil).toLocaleDateString('id-ID')}`, marginLeft, 65);
  
  // Customer Info (wrapped)
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada Yth:', marginLeft, 75);
  doc.setFont('helvetica', 'normal');
  const customerAddress = [
    data.customer.name,
    data.customer.address,
    `${data.customer.city}${data.customer.district ? ', ' + data.customer.district : ''}`,
    data.customer.picName ? `Att: ${data.customer.picName}` : undefined,
  ].filter(Boolean).join('\n');
  const custLines = doc.splitTextToSize(customerAddress, 80);
  doc.text(custLines, marginLeft, 80);
  
  // Project Info
  doc.setFont('helvetica', 'bold');
  doc.text('Perihal:', pageWidth - 80, 75);
  doc.setFont('helvetica', 'normal');
  const projLines = doc.splitTextToSize(data.opportunity.projectName, 65);
  doc.text(projLines, pageWidth - 80, 80);
  
  // Introduction
  // Calculate vertical position after customer and project blocks so table won't overlap
  const introStartY = 105;
  // estimate line height using text dimensions if available
  let estimatedLineHeight = 7; // fallback
  try {
    // getTextDimensions may accept a string; use capital M as typical height
    // @ts-expect-error: method may not exist on older jspdf types
    const dims = doc.getTextDimensions('M');
    if (dims && (dims as any).h) estimatedLineHeight = (dims as any).h + 2;
  } catch {
    // ignore, use fallback
  }

  const custBlockHeight = custLines.length * estimatedLineHeight;
  const projBlockHeight = projLines.length * estimatedLineHeight;
  // y position where intro should start, leaving a 14pt gap after the tallest block
  let yPos = Math.max(introStartY, 80 + Math.max(custBlockHeight, projBlockHeight) + 14);
  doc.text('Dengan hormat,', 15, yPos);
  yPos += estimatedLineHeight;
  doc.text('Bersama ini kami mengajukan penawaran harga untuk:', 15, yPos);
  yPos += estimatedLineHeight;
  
  // Items Table
  const tableData = data.items.map((item, index) => [
    (index + 1).toString(),
    `${item.itemName}${item.description ? '\n' + item.description : ''}`,
    item.quantity.toString(),
    item.unit,
    `Rp ${item.unitPrice.toLocaleString('id-ID')}`,
    `Rp ${item.totalPrice.toLocaleString('id-ID')}`,
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: [['No', 'Deskripsi Item', 'Qty', 'Satuan', 'Harga Satuan', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 35, halign: 'right' },
      5: { cellWidth: 35, halign: 'right' },
    },
  });
  
  // Get Y position after table
  yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : yPos + 10;
  
  // Pricing Summary
  const summaryX = 120;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, yPos);
  doc.text(`Rp ${data.pricing.subtotal.toLocaleString('id-ID')}`, 195, yPos, { align: 'right' });
  
  yPos += 6;
  if (data.pricing.discountPercentage > 0) {
    doc.text(`Diskon (${data.pricing.discountPercentage}%):`, summaryX, yPos);
    doc.text(`Rp ${data.pricing.discountAmount.toLocaleString('id-ID')}`, 195, yPos, { align: 'right' });
    yPos += 6;
    
    doc.text('Subtotal setelah diskon:', summaryX, yPos);
    doc.text(`Rp ${data.pricing.subtotalAfterDiscount.toLocaleString('id-ID')}`, 195, yPos, { align: 'right' });
    yPos += 6;
  }
  
  doc.text(`PPN (${data.pricing.taxPercentage}%):`, summaryX, yPos);
  doc.text(`Rp ${data.pricing.taxAmount.toLocaleString('id-ID')}`, 195, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', summaryX, yPos);
  doc.text(`Rp ${data.pricing.grandTotal.toLocaleString('id-ID')}`, 195, yPos, { align: 'right' });
  
  // Terms and Conditions
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Syarat & Ketentuan:', marginLeft, yPos);
  
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  if (data.terms?.paymentTerms) {
    doc.text(`• Pembayaran: ${data.terms.paymentTerms}`, 15, yPos);
    yPos += 5;
  }
  if (data.terms?.deliveryTerms) {
    doc.text(`• Pengiriman: ${data.terms.deliveryTerms}`, 15, yPos);
    yPos += 5;
  }
  if (data.terms?.warranty) {
    doc.text(`• Garansi: ${data.terms.warranty}`, 15, yPos);
    yPos += 5;
  }
  
  // Closing
  yPos += 10;
  const closing = doc.splitTextToSize('Demikian penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.', pageWidth - marginLeft - 20);
  doc.text(closing, marginLeft, yPos);
  
  // Signature
  yPos += 15;
  doc.text('Hormat kami,', 15, yPos);
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text(data.salesPerson.name, 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(data.salesPerson.email, 15, yPos + 5);
  if (data.salesPerson.phone) {
    doc.text(data.salesPerson.phone, 15, yPos + 10);
  }
  
  // Save PDF
  const safeCustomer = data.customer.name.replace(/[^a-z0-9_-]/gi, '_').replace(/_+/g, '_');
  const fileName = `Quotation_${data.quotationNumber}_${safeCustomer}.pdf`;
  doc.save(fileName);
};
