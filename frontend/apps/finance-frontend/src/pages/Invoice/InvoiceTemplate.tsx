import React from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

/**
 * ====================================
 * INVOICE TEMPLATE GENERATOR
 * ====================================
 * 
 * Auto-generate template invoice profesional seperti struk Shell
 * dengan format:
 * - Company header & logo
 * - Invoice info (Invoice #, Date, Due Date)
 * - Customer billing info
 * - Line items table
 * - Subtotal, Tax (PPN 12%), PPh 23 (2%)
 * - Grand Total
 * - Terms & Conditions
 */

interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface InvoiceTemplateData {
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_address: string;
  customer_npwp?: string;
  wo_po_number: string;
  items: InvoiceLineItem[];
  subtotal: number;
  ppn_rate: number; // 11% or 12%
  ppn_amount: number;
  pph23_rate: number; // 2%
  pph23_amount: number;
  grand_total: number;
}

interface InvoiceTemplateProps {
  data: InvoiceTemplateData;
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const generatePDF = () => {
    // Trigger print yang akan generate PDF
    window.print();
  };

  return (
    <div className="bg-white">
      {/* Print Button - Hidden saat print */}
      <div className="print:hidden mb-4 flex justify-end">
        <button
          onClick={generatePDF}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-light to-accent-gold text-white font-bold rounded-xl hover:from-accent-gold hover:to-primary-dark transition-all shadow-lg"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Download PDF
        </button>
      </div>

      {/* Invoice Template - Printable */}
      <div className="bg-white p-12 border-2 border-gray-200 rounded-xl print:border-0" id="invoice-template">
        {/* Company Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-primary-dark">
          <div>
            <h1 className="text-4xl font-bold text-primary-dark mb-2">MINILINK ERP</h1>
            <p className="text-sm text-gray-600">
              Jl. Industri Raya No. 123<br />
              Jakarta Selatan 12345<br />
              Tel: (021) 1234-5678 | Email: finance@minilink.co.id<br />
              NPWP: 01.234.567.8-901.000
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold text-primary-dark mb-2">INVOICE</h2>
            <div className="bg-gradient-to-r from-primary-light to-accent-gold text-white px-4 py-2 rounded-lg font-bold">
              {data.invoice_number}
            </div>
          </div>
        </div>

        {/* Invoice Info & Customer */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Left: Bill To */}
          <div>
            <h3 className="text-sm font-bold text-gray-600 uppercase mb-3 border-b border-gray-300 pb-1">Bill To</h3>
            <div className="space-y-1">
              <p className="font-bold text-lg text-gray-900">{data.customer_name}</p>
              <p className="text-sm text-gray-700">{data.customer_address}</p>
              {data.customer_npwp && (
                <p className="text-sm text-gray-600">NPWP: {data.customer_npwp}</p>
              )}
            </div>
          </div>

          {/* Right: Invoice Details */}
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-end gap-3">
                <span className="text-sm font-semibold text-gray-600">Invoice Date:</span>
                <span className="text-sm font-bold text-gray-900">{formatDate(data.invoice_date)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-sm font-semibold text-gray-600">Due Date:</span>
                <span className="text-sm font-bold text-red-600">{formatDate(data.due_date)}</span>
              </div>
              <div className="flex justify-end gap-3">
                <span className="text-sm font-semibold text-gray-600">Reference:</span>
                <span className="text-sm font-bold text-gray-900">{data.wo_po_number}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="bg-gradient-to-r from-primary-dark to-primary-light text-white">
              <th className="px-4 py-3 text-left text-sm font-bold uppercase">Description</th>
              <th className="px-4 py-3 text-center text-sm font-bold uppercase w-24">QTY</th>
              <th className="px-4 py-3 text-right text-sm font-bold uppercase w-32">Unit Price</th>
              <th className="px-4 py-3 text-right text-sm font-bold uppercase w-40">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-900">{item.quantity}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-96">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Subtotal:</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(data.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">PPN ({data.ppn_rate}%):</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(data.ppn_amount)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-sm font-semibold text-gray-700">PPh 23 ({data.pph23_rate}%):</span>
                <span className="text-sm font-bold text-red-600">- {formatCurrency(data.pph23_amount)}</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-primary-dark to-primary-light text-white px-4 py-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold uppercase">Grand Total:</span>
                <span className="text-2xl font-bold">{formatCurrency(data.grand_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h4 className="font-bold text-sm text-gray-800 mb-3 uppercase">Payment Terms & Bank Details</h4>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-700 mb-2">
                <strong>Payment Terms:</strong> Net 14 days from invoice date
              </p>
              <p className="text-gray-700">
                <strong>Late Payment:</strong> 2% penalty per month applies after due date
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-800 mb-2">Bank Transfer Details:</p>
              <p className="text-gray-700">
                <strong>Bank:</strong> Bank Mandiri<br />
                <strong>Account Name:</strong> PT. MiniLink Indonesia<br />
                <strong>Account Number:</strong> 1234567890<br />
                <strong>Swift Code:</strong> BMRIIDJA
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This is a computer-generated invoice and does not require a signature.</p>
          <p className="mt-1">For inquiries, please contact our Finance Department at finance@minilink.co.id</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-template, #invoice-template * {
            visibility: visible;
          }
          #invoice-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-0 {
            border: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceTemplate;

// Helper function untuk generate invoice data dari imported CSV
export const generateInvoiceFromCSV = (csvData: any): InvoiceTemplateData => {
  // Parse CSV data dan convert ke format invoice template
  const items: InvoiceLineItem[] = [
    {
      description: csvData.description || 'Service',
      quantity: 1,
      unit_price: csvData.service_value || csvData.goods_value || 0,
      amount: csvData.total_invoice_value || 0,
    }
  ];

  const subtotal = csvData.total_invoice_value || 0;
  const ppn_rate = 11; // Default 11%, bisa disesuaikan
  const ppn_amount = csvData.ppn || (subtotal * ppn_rate / 100);
  const pph23_rate = 2;
  const pph23_amount = csvData.pph_pasal_23 || (subtotal * pph23_rate / 100);
  const grand_total = subtotal + ppn_amount - pph23_amount;

  return {
    invoice_number: csvData.invoice_code || 'INV-DRAFT',
    invoice_date: csvData.created_date || new Date().toISOString(),
    due_date: csvData.due_date || new Date().toISOString(),
    customer_name: csvData.customer || 'Customer',
    customer_address: 'Jakarta, Indonesia', // Bisa diambil dari master customer
    wo_po_number: csvData.wo_po_number || '-',
    items,
    subtotal,
    ppn_rate,
    ppn_amount,
    pph23_rate,
    pph23_amount,
    grand_total,
  };
};
