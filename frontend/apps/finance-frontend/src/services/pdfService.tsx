import { pdf } from '@react-pdf/renderer';
import ModernTemplate from '../components/Invoice/Templates/ModernTemplate';
import ClassicTemplate from '../components/Invoice/Templates/ClassicTemplate';
import MinimalTemplate from '../components/Invoice/Templates/MinimalTemplate';

export type TemplateType = 'modern' | 'classic' | 'minimal';

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
}

/**
 * Generate PDF Blob from invoice data and selected template
 */
export const generateInvoicePDF = async (
  invoiceData: InvoiceData,
  template: TemplateType = 'modern'
): Promise<Blob> => {
  let TemplateComponent;

  switch (template) {
    case 'classic':
      TemplateComponent = ClassicTemplate;
      break;
    case 'minimal':
      TemplateComponent = MinimalTemplate;
      break;
    case 'modern':
    default:
      TemplateComponent = ModernTemplate;
      break;
  }

  const doc = <TemplateComponent {...invoiceData} />;
  const blob = await pdf(doc).toBlob();
  return blob;
};

/**
 * Download PDF to user's device
 */
export const downloadInvoicePDF = async (
  invoiceData: InvoiceData,
  template: TemplateType = 'modern',
  filename?: string
): Promise<void> => {
  const blob = await generateInvoicePDF(invoiceData, template);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${invoiceData.invoiceNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Open PDF in new browser tab
 */
export const previewInvoicePDF = async (
  invoiceData: InvoiceData,
  template: TemplateType = 'modern'
): Promise<void> => {
  const blob = await generateInvoicePDF(invoiceData, template);
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Note: Don't revoke URL immediately as the new tab needs it
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Get PDF as Base64 string (useful for sending via email API)
 */
export const getInvoicePDFBase64 = async (
  invoiceData: InvoiceData,
  template: TemplateType = 'modern'
): Promise<string> => {
  const blob = await generateInvoicePDF(invoiceData, template);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:application/pdf;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Send invoice via email (mock implementation - replace with actual email API)
 */
export const sendInvoiceEmail = async (
  invoiceData: InvoiceData,
  recipientEmail: string,
  template: TemplateType = 'modern',
  subject?: string,
  message?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const pdfBase64 = await getInvoicePDFBase64(invoiceData, template);

    // TODO: Replace with actual email API endpoint
    const response = await fetch('http://localhost:3001/api/invoices/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: subject || `Invoice ${invoiceData.invoiceNumber}`,
        message: message || `Please find attached invoice ${invoiceData.invoiceNumber}`,
        pdfBase64,
        filename: `${invoiceData.invoiceNumber}.pdf`,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return {
      success: true,
      message: 'Invoice sent successfully',
    };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send invoice',
    };
  }
};

/**
 * Get template preview URL (for displaying in UI)
 */
export const getTemplatePreviewURL = async (
  invoiceData: InvoiceData,
  template: TemplateType
): Promise<string> => {
  const blob = await generateInvoicePDF(invoiceData, template);
  return URL.createObjectURL(blob);
};
