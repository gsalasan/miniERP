import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  EnvelopeIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { PaymentModal } from '../../components/Invoice/PaymentModal';
import { ReminderModal } from '../../components/Invoice/ReminderModal';
import { PDFViewer } from '@react-pdf/renderer';
import ModernTemplate from '../../components/Invoice/Templates/ModernTemplate';
import ClassicTemplate from '../../components/Invoice/Templates/ClassicTemplate';
import MinimalTemplate from '../../components/Invoice/Templates/MinimalTemplate';
import { downloadInvoicePDF, previewInvoicePDF, sendInvoiceEmail, type TemplateType, type InvoiceData as PDFInvoiceData } from '../../services/pdfService';

/**
 * ====================================
 * INVOICE MANAGEMENT - COMPLETE
 * ====================================
 * 
 * Halaman Invoice dengan 4 TABS dalam 1 halaman:
 * 1. Penawaran (Sales) - Data quotation dari CRM yang masuk
 * 2. Daftar Invoice - Semua invoice yang sudah dibuat (includes monitoring statistics)
 * 3. Faktur Pajak - e-Faktur untuk CoreTax
 * 4. Template Invoice - Struk invoice
 */

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  customer_address: string;
  customer_npwp: string;
  customer_contact: string;
  wo_po_number: string;
  quotation_id?: string; // Track which quotation this invoice was created from
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  ppn_rate: number;
  ppn_amount: number;
  pph23_rate: number;
  pph23_amount: number;
  grand_total: number;
  paid_amount?: number;
  remaining_amount?: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  notes: string;
}

interface QuotationData {
  id: string;
  quotation_number: string;
  quotation_date: string;
  valid_until: string;
  customer_name: string;
  customer_address?: string;
  customer_npwp?: string;
  customer_contact?: string;
  customer_email?: string;
  customer_phone?: string;
  wo_po_number?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  subtotal: number;
  ppn_rate?: number;
  ppn_amount: number;
  pph23_rate?: number;
  pph23_amount?: number;
  grand_total: number;
  status: 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'INVOICED';
  notes?: string;
}

type TabType = 'quotation' | 'list' | 'faktur' | 'template';

interface ReadyMilestone {
  milestone_id: string;
  project_id: string;
  milestone_name: string;
  milestone_value: number;
  end_date: string;
  project_name: string;
  project_number: string;
  customer_name: string;
}

const InvoiceManagementComplete: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('quotation');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<InvoiceData | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [invoiceForReminder, setInvoiceForReminder] = useState<InvoiceData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [invoiceForDetail, setInvoiceForDetail] = useState<InvoiceData | null>(null);
  
  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInvoiceData, setPreviewInvoiceData] = useState<InvoiceData | null>(null);
  const [previewPDFBlob, setPreviewPDFBlob] = useState<Blob | null>(null);
  
  // Faktur Pajak preview modal states
  const [showFakturPreviewModal, setShowFakturPreviewModal] = useState(false);
  const [fakturPreviewData, setFakturPreviewData] = useState<InvoiceData | null>(null);
  
  // Template selection states
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('modern');
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  
  // Template preview modal states
  const [showTemplatePreviewModal, setShowTemplatePreviewModal] = useState(false);
  const [templatePreviewInvoice, setTemplatePreviewInvoice] = useState<InvoiceData | null>(null);

  // Form manual input state
  const [manualFormData, setManualFormData] = useState({
    customer_name: '',
    customer_npwp: '',
    customer_address: '',
    customer_email: '',
    customer_phone: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    wo_po_number: '',
    notes: ''
  });
  
  const [manualItems, setManualItems] = useState<Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);

  // Auto-calculate totals
  const calculateTotals = () => {
    const subtotal = manualItems.reduce((sum, item) => sum + item.total, 0);
    const ppn_amount = subtotal * 0.11; // PPN 11%
    const pph23_amount = subtotal * 0.02; // PPh23 2%
    const grand_total = subtotal + ppn_amount - pph23_amount;
    return { subtotal, ppn_amount, pph23_amount, grand_total };
  };

  const totals = calculateTotals();

  // DATA INVOICE dari DATABASE saja - NO HARDCODED DATA
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);

  // DATA QUOTATIONS - Dummy data untuk simulasi (nanti akan diganti dengan real CRM data)
  const [quotations, setQuotations] = useState<QuotationData[]>([
    {
      id: 'QT-001',
      quotation_number: 'QT-202511-001',
      quotation_date: '2025-11-15',
      valid_until: '2025-12-15',
      customer_name: 'PT. Maju Jaya Teknologi',
      customer_address: 'Jl. Sudirman No. 123, Jakarta Selatan',
      customer_npwp: '01.234.567.8-901.000',
      customer_contact: 'Bp. Agus Santoso',
      customer_phone: '021-12345678',
      customer_email: 'agus@majujaya.co.id',
      wo_po_number: 'PO-MJT-2025-001',
      items: [
        { description: 'Jasa Konsultasi IT Infrastructure 6 Bulan', quantity: 1, unit_price: 75000000, total: 75000000 }
      ],
      subtotal: 75000000,
      ppn_rate: 11,
      ppn_amount: 8250000,
      pph23_rate: 2,
      pph23_amount: 1500000,
      grand_total: 81750000,
      status: 'APPROVED',
      notes: 'Pembayaran NET 30 hari'
    },
    {
      id: 'QT-002',
      quotation_number: 'QT-202511-002',
      quotation_date: '2025-11-18',
      valid_until: '2025-12-18',
      customer_name: 'PT. Global Sentosa Abadi',
      customer_address: 'Gedung Menara Global, Jl. MH Thamrin No. 88, Jakarta Pusat',
      customer_npwp: '02.345.678.9-012.000',
      customer_contact: 'Ibu Diana Putri',
      customer_phone: '021-98765432',
      customer_email: 'diana@globalsentosa.com',
      wo_po_number: 'PO-GSA-2025-042',
      items: [
        { description: 'Software Development & Implementation', quantity: 1, unit_price: 125000000, total: 125000000 }
      ],
      subtotal: 125000000,
      ppn_rate: 11,
      ppn_amount: 13750000,
      pph23_rate: 2,
      pph23_amount: 2500000,
      grand_total: 136250000,
      status: 'APPROVED',
      notes: 'TOP 45 hari setelah invoice'
    },
    {
      id: 'QT-003',
      quotation_number: 'QT-202511-003',
      quotation_date: '2025-11-20',
      valid_until: '2025-12-20',
      customer_name: 'CV. Karya Mandiri',
      customer_address: 'Jl. Gatot Subroto Kav. 45, Tangerang',
      customer_npwp: '03.456.789.0-123.000',
      customer_contact: 'Bp. Budi Setiawan',
      customer_phone: '021-55667788',
      customer_email: 'budi@karyamandiri.id',
      wo_po_number: 'PO-KM-2025-015',
      items: [
        { description: 'Network Infrastructure Upgrade', quantity: 1, unit_price: 50000000, total: 50000000 }
      ],
      subtotal: 50000000,
      ppn_rate: 11,
      ppn_amount: 5500000,
      pph23_rate: 2,
      pph23_amount: 1000000,
      grand_total: 54500000,
      status: 'APPROVED',
      notes: 'Pembayaran via transfer bank, NET 30'
    }
  ]);

  // Debug: Log quotations di console
  React.useEffect(() => {
    console.log('🎯 DUMMY QUOTATIONS LOADED:', quotations.length, 'items');
    console.log('📋 Quotation data:', quotations);
  }, []);

  // DATA MILESTONES READY FOR INVOICING - Auto-generate feature
  const [readyMilestones, setReadyMilestones] = useState<ReadyMilestone[]>([]);

  // AR SUMMARY DATA - Real-time dari backend
  const [arSummary, setArSummary] = useState({
    total_receivable: 0,
    total_outstanding: 0,
    overdue_amount: 0,
    avg_dso: 0,
  });

  const exportFakturPajakToXLS = (invoice: InvoiceData) => {
    const today = new Date().toISOString().split('T')[0];
    const invoiceDate = invoice.invoice_date;
    
    // Check if this is today's invoice or old invoice
    const isToday = invoiceDate === today;
    
    // Sheet 1: Faktur (Main Invoice Info) - Sesuai screenshot
    const fakturData = [
      [
        'Keterangan Tambahan',
        'Dokumen Pendukung Referensi',
        'Cap Fasilitas',
        'ID TKU Penjual',
        'NPWP/NIK Pembeli',
        'Jenis ID e-Negara Pembeli',
        'ID De Negara Pembeli',
        'Nomor Dokumen Pembeli',
        'Nama Pembeli',
        'Alamat Pembeli',
        'Email Pembeli',
        'ID TKU Pembeli'
      ],
      [
        invoice.wo_po_number, // WO/SHELL reference
        `${invoice.wo_po_number}/${new Date(invoice.invoice_date).toLocaleDateString('id-ID', { month: '2-digit', year: 'numeric' }).replace('/', '')}`,
        invoice.customer_npwp.substring(0, 16),
        '094067545742300000000',
        invoice.customer_npwp,
        'TIN',
        'IDN',
        invoice.wo_po_number,
        invoice.customer_name,
        invoice.customer_address,
        `Gd. The CEO, Lt. 12, Jl. TB. Simatupang No. 18C, Cilandak, Jakarta Selatan, DKI Jakarta, 12430`,
        invoice.customer_npwp.substring(0, 16)
      ],
      // Add more rows based on number of items
      ...Array(invoice.items.length - 1).fill(null).map(() => [
        invoice.wo_po_number,
        '',
        invoice.customer_npwp.substring(0, 16),
        '094067545742300000000',
        invoice.customer_npwp,
        'TIN',
        'IDN',
        '',
        invoice.customer_name,
        '',
        '',
        invoice.customer_npwp.substring(0, 16)
      ])
    ];

    // Sheet 2: DetailFaktur (Line Items Detail) - Sesuai screenshot
    const detailFakturData = [
      [
        'Baris',
        'Kode Barang/Jasa',
        'Nama Barang/Jasa',
        'Nama Satuan Ukur',
        'Harga Satuan',
        'Jumlah Total',
        'Diskor',
        'DPP',
        'DPP Nilai Lain',
        'Tarif PPN',
        'PPN',
        'Tarif PPnBM',
        'PPnBM'
      ],
      ...invoice.items.map((item, idx) => [
        idx + 1, // Baris
        '', // Kode Barang
        item.description, // Nama Barang/Jasa
        '', // Nama Satuan
        item.unit_price, // Harga Satuan
        item.quantity, // Jumlah
        item.total, // Total
        0, // Diskon
        item.total, // DPP
        'Rp -', // DPP Nilai Lain
        invoice.ppn_rate, // Tarif PPN
        `Rp ${Math.round(item.total * invoice.ppn_rate / 100).toLocaleString('id-ID')}`, // PPN
        0, // Tarif PPnBM
        '0,00' // PPnBM
      ]),
      // Summary row
      [],
      [
        'END',
        '',
        '',
        '',
        '',
        '',
        '',
        `Rp ${invoice.subtotal.toLocaleString('id-ID')}`, // Total DPP
        'Rp -',
        invoice.ppn_rate,
        `Rp ${invoice.ppn_amount.toLocaleString('id-ID')}`, // Total PPN
        0,
        '0,00'
      ]
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Add Sheet 1: Faktur
    const ws1 = XLSX.utils.aoa_to_sheet(fakturData);
    ws1['!cols'] = [
      { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
      { wch: 30 }, { wch: 25 }, { wch: 30 }, { wch: 40 }, { wch: 50 }, { wch: 40 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, ws1, 'Faktur');
    
    // Add Sheet 2: DetailFaktur
    const ws2 = XLSX.utils.aoa_to_sheet(detailFakturData);
    ws2['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'DetailFaktur');
    
    // Add Sheet 3: REF (Reference - empty template)
    const ws3 = XLSX.utils.aoa_to_sheet([['Reference Data']]);
    XLSX.utils.book_append_sheet(wb, ws3, 'REF');
    
    // Add Sheet 4: Keterangan (Notes)
    const ws4 = XLSX.utils.aoa_to_sheet([
      ['Keterangan'],
      [invoice.notes || 'No additional notes']
    ]);
    XLSX.utils.book_append_sheet(wb, ws4, 'Keterangan');
    
    // Filename with date marker
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    XLSX.writeFile(wb, `Faktur_Pajak_${invoice.invoice_number}_${dateStr}.xlsx`);
    
    // If this is not today, schedule for yearly recap
    if (!isToday) {
      console.log('📊 Old invoice - akan dimasukkan ke rekap yearly');
      // TODO: API call to move to yearly recap
    }
  };

  // Handle item changes untuk form manual
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...manualItems];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total for this item
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setManualItems(newItems);
  };

  const addItem = () => {
    setManualItems([...manualItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (manualItems.length > 1) {
      setManualItems(manualItems.filter((_, i) => i !== index));
    }
  };

  // Submit manual invoice
  const handleManualInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (manualItems.length === 0 || manualItems[0].description === '') {
      alert('Minimal 1 item harus diisi!');
      return;
    }
    
    setIsLoading(true);
    try {
      // Map frontend form structure to backend API format
      const invoiceData = {
        invoice_number: manualFormData.invoice_number,
        invoice_date: manualFormData.invoice_date,
        due_date: manualFormData.due_date,
        customer_name: manualFormData.customer_name,
        customer_address: manualFormData.customer_address,
        customer_phone: manualFormData.customer_phone,
        customer_email: manualFormData.customer_email,
        subtotal: totals.subtotal,
        tax_amount: totals.ppn_amount,
        discount_amount: 0,
        total_amount: totals.grand_total,
        currency: 'IDR',
        status: 'DRAFT',
        payment_terms: 'NET 30',
        notes: manualFormData.notes,
        created_by: 'admin',
      };
      
      console.log('📤 Sending invoice data to backend:', invoiceData);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });
      
      if (response.ok) {
        alert('✅ Invoice berhasil dibuat!');
        setShowInputForm(false);
        // Reset form
        setManualFormData({
          customer_name: '',
          customer_npwp: '',
          customer_address: '',
          customer_email: '',
          customer_phone: '',
          invoice_number: '',
          invoice_date: new Date().toISOString().split('T')[0],
          due_date: '',
          wo_po_number: '',
          notes: ''
        });
        setManualItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
        fetchInvoices(); // Refresh list
      } else {
        const error = await response.json();
        alert('❌ Gagal membuat invoice: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('❌ Error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch quotations - DUMMY DATA untuk demo (nanti bisa dari CRM API)
  const fetchQuotations = async () => {
    // Dummy data sudah ada di useState initialization
    // Function ini tidak perlu fetch karena data hardcoded
    console.log('✅ Using dummy quotations:', quotations.length, 'items');
  };

  // Fetch AR Summary dengan real data
  const fetchARSummary = async () => {
    try {
      console.log('📊 Fetching AR Summary...');
      const response = await fetch('/api/ar/summary');
      if (response.ok) {
        const result = await response.json();
        const data = result.data;
        console.log('✅ AR Summary loaded:', data);
        setArSummary({
          total_receivable: data.total_outstanding || 0,
          total_outstanding: data.total_outstanding || 0,
          overdue_amount: data.overdue_amount || 0,
          avg_dso: data.avg_dso || 0,
        });
      } else {
        console.error('❌ Failed to fetch AR summary:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching AR summary:', error);
    }
  };

  // Fetch Milestones ready for invoicing
  const fetchReadyMilestones = async () => {
    try {
      console.log('🎯 Fetching milestones ready for invoicing...');
      const response = await fetch('/api/milestone-invoices/ready');
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Ready milestones loaded:', result.data);
        setReadyMilestones(result.data || []);
      } else {
        console.error('❌ Failed to fetch ready milestones:', response.status);
        setReadyMilestones([]);
      }
    } catch (error) {
      console.error('❌ Error fetching ready milestones:', error);
      setReadyMilestones([]);
    }
  };

  // Fetch invoices dari DATABASE
  const fetchInvoices = async () => {
    try {
      console.log('📡 Fetching invoices from API...');
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        const invoiceArray = data.data || data || [];
        console.log('✅ Invoices loaded from DB:', invoiceArray.length);
        // Transform data dari database ke format UI
        const transformedInvoices = invoiceArray.map((inv: any) => {
          const subtotal = parseFloat(inv.subtotal) || 0;
          const taxAmount = parseFloat(inv.tax_amount) || 0;
          
          // Generate default item if no items exist (since DB doesn't have invoice_items table yet)
          const items = [{
            description: inv.notes || 'Services/Products',
            quantity: 1,
            unit_price: subtotal,
            total: subtotal,
          }];

          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date?.split('T')[0] || inv.invoice_date,
            due_date: inv.due_date?.split('T')[0] || inv.due_date,
            customer_name: inv.customer_name,
            customer_address: inv.customer_address || '-',
            customer_npwp: inv.customer_npwp || '-',
            customer_contact: inv.customer_phone || '-',
            wo_po_number: inv.payment_terms || '-',
            items: items,
            subtotal: subtotal,
            ppn_rate: 11,
            ppn_amount: taxAmount,
            pph23_rate: 2,
            pph23_amount: 0,
            grand_total: parseFloat(inv.total_amount) || 0,
            paid_amount: parseFloat(inv.paid_amount) || 0,
            remaining_amount: parseFloat(inv.remaining_amount) || parseFloat(inv.total_amount) || 0,
            status: inv.status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE',
            notes: inv.notes || '-',
          };
        });
        setInvoices(transformedInvoices);
      } else {
        console.error('❌ Failed to fetch invoices:', response.status);
        setInvoices([]);
      }
    } catch (error) {
      console.error('❌ Error fetching invoices:', error);
      setInvoices([]);
    }
  };

  // Load data saat component mount
  useEffect(() => {
    fetchQuotations();
    fetchInvoices();
    fetchARSummary();
    fetchReadyMilestones();
  }, []);

  const handleCreateInvoiceFromQuotation = async (quotation: QuotationData) => {
    console.log('🎯 Auto-generating invoice preview from quotation:', quotation.quotation_number);
    
    setIsLoading(true);
    
    try {
      // Generate invoice_number
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const invoice_number = `INV-${year}${month}-${randomNum}`;

      // Auto-generate invoice data from quotation
      const invoiceData: InvoiceData = {
        id: `TEMP-${Date.now()}`, // Temporary ID until saved
        invoice_number: invoice_number,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer_name: quotation.customer_name,
        customer_address: quotation.customer_address || 'Alamat belum tersedia',
        customer_npwp: quotation.customer_npwp || '-',
        customer_contact: quotation.customer_phone || quotation.customer_email || '-',
        wo_po_number: quotation.wo_po_number || '-',
        quotation_id: quotation.id, // Save quotation ID for tracking and status update
        items: quotation.items && quotation.items.length > 0 
          ? quotation.items 
          : [{
              description: `Proyek dari ${quotation.quotation_number}`,
              quantity: 1,
              unit_price: quotation.subtotal,
              total: quotation.subtotal
            }],
        subtotal: quotation.subtotal,
        ppn_rate: quotation.ppn_rate || 11,
        ppn_amount: quotation.ppn_amount,
        pph23_rate: quotation.pph23_rate || 2,
        pph23_amount: quotation.pph23_amount || 0,
        grand_total: quotation.grand_total,
        status: 'DRAFT',
        notes: `Dibuat dari Quotation ${quotation.quotation_number} - ${new Date().toLocaleDateString('id-ID')}`
      };

      // Convert to PDF format
      const pdfData = convertToPDFInvoiceData(invoiceData);
      
      // Generate PDF blob using selected template
      console.log('📄 Generating PDF preview...');
      await previewInvoicePDF(pdfData, selectedTemplate);
      
      // Store preview data
      setPreviewInvoiceData(invoiceData);
      // setPreviewPDFBlob(pdfBlob); // Commented out - causing type error
      
      // Show preview modal
      setShowPreviewModal(true);
      
      console.log('✅ Invoice preview generated successfully');
      
    } catch (error) {
      console.error('❌ Error generating invoice preview:', error);
      alert('❌ Gagal membuat preview invoice: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // DELETE invoice
  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('⚠️ Yakin hapus invoice ini? Data akan dihapus PERMANENT dari database!')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus invoice');
      }

      alert('✅ Invoice berhasil dihapus dari database');
      fetchInvoices(); // Reload dari database
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      alert('❌ Gagal menghapus invoice: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATE invoice
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdateInvoice = async (invoiceId: string, updates: Partial<InvoiceData>) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Gagal mengupdate invoice');
      }

      alert('✅ Invoice berhasil diupdate di database');
      fetchInvoices(); // Reload dari database
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      alert('❌ Gagal mengupdate invoice: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save invoice from preview modal
  const handleSaveInvoiceFromPreview = async () => {
    if (!previewInvoiceData) {
      alert('❌ Data invoice tidak ditemukan');
      return;
    }

    setIsLoading(true);
    try {
      // Map frontend form structure to backend API format
      const invoicePayload = {
        invoice_number: previewInvoiceData.invoice_number,
        invoice_date: previewInvoiceData.invoice_date,
        due_date: previewInvoiceData.due_date,
        customer_name: previewInvoiceData.customer_name,
        customer_address: previewInvoiceData.customer_address,
        customer_phone: previewInvoiceData.customer_contact,
        customer_email: '',
        subtotal: previewInvoiceData.subtotal,
        tax_amount: previewInvoiceData.ppn_amount,
        discount_amount: 0,
        total_amount: previewInvoiceData.grand_total,
        currency: 'IDR',
        status: 'DRAFT',
        payment_terms: 'NET 30',
        notes: previewInvoiceData.notes,
        created_by: 'admin',
      };
      
      console.log('💾 Saving invoice to database:', invoicePayload);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoicePayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Invoice saved successfully:', result);
        
        // If invoice was created from a quotation, update quotation status locally
        if (previewInvoiceData.quotation_id) {
          console.log('🔄 Updating quotation status to INVOICED:', previewInvoiceData.quotation_id);
          
          // Update quotation status in local state (mock data)
          setQuotations(prev => prev.map(q => 
            q.id === previewInvoiceData.quotation_id 
              ? { ...q, status: 'INVOICED' as const }
              : q
          ));
          
          console.log('✅ Quotation status updated to INVOICED');
        }
        
        alert(
          `✅ INVOICE BERHASIL DISIMPAN!\n\n` +
          `📄 Invoice: ${previewInvoiceData.invoice_number}\n` +
          `💼 Customer: ${previewInvoiceData.customer_name}\n` +
          `💰 Total: Rp ${previewInvoiceData.grand_total.toLocaleString('id-ID')}\n\n` +
          `Status: DRAFT - Siap untuk dikirim ke customer`
        );
        
        // Close preview modal
        setShowPreviewModal(false);
        setPreviewInvoiceData(null);
        setPreviewPDFBlob(null);
        
        // Switch to invoice list tab and refresh
        setActiveTab('list');
        fetchInvoices();
        fetchARSummary();
      } else {
        const error = await response.json();
        alert('❌ Gagal menyimpan invoice: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error saving invoice:', error);
      alert('❌ Error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate invoice from single milestone
  const handleGenerateInvoiceFromMilestone = async (milestoneId: string) => {
    console.log('🎯 Generating invoice from milestone:', milestoneId);
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/milestone-invoices/generate/${milestoneId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal generate invoice dari milestone');
      }

      const result = await response.json();
      console.log('✅ Invoice generated:', result.data);
      alert(`✅ Invoice ${result.data.invoice_number} berhasil dibuat dari milestone!`);
      
      fetchReadyMilestones(); // Refresh milestone list
      fetchInvoices(); // Refresh invoice list
      fetchARSummary(); // Refresh AR dashboard
    } catch (error: any) {
      console.error('❌ Error generating invoice from milestone:', error);
      alert('❌ Gagal membuat invoice: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate invoices from all ready milestones
  const handleGenerateAllMilestoneInvoices = async () => {
    if (!confirm(`Generate invoices untuk ${readyMilestones.length} milestone yang siap?`)) {
      return;
    }

    console.log('🎯 Generating invoices from all ready milestones...');
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/milestone-invoices/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal generate invoices dari milestones');
      }

      const result = await response.json();
      console.log('✅ Invoices generated:', result.data);
      alert(`✅ Berhasil membuat ${result.data.generated_count} invoice dari milestones!`);
      
      fetchReadyMilestones(); // Refresh milestone list
      fetchInvoices(); // Refresh invoice list
      fetchARSummary(); // Refresh AR dashboard
    } catch (error: any) {
      console.error('❌ Error generating invoices from milestones:', error);
      alert('❌ Gagal membuat invoices: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

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
      month: 'short',
      year: 'numeric',
    });
  };

  // Convert InvoiceData to PDFInvoiceData for PDF generation
  const convertToPDFInvoiceData = (invoice: InvoiceData): PDFInvoiceData => {
    // Ensure items is always an array with proper structure
    const items = (invoice.items || []).map(item => ({
      description: item.description || 'Item',
      quantity: item.quantity || 1,
      unit_price: item.unit_price || 0,
      total: item.total || (item.quantity * item.unit_price) || 0,
    }));

    return {
      invoiceNumber: invoice.invoice_number || 'N/A',
      invoiceDate: invoice.invoice_date || new Date().toISOString(),
      dueDate: invoice.due_date || new Date().toISOString(),
      customerName: invoice.customer_name || 'Customer',
      customerAddress: invoice.customer_address || 'Address not provided',
      customerPhone: invoice.customer_contact || '-',
      items: items,
      subtotal: invoice.subtotal || 0,
      taxRate: invoice.ppn_rate || 11,
      taxAmount: invoice.ppn_amount || 0,
      total: invoice.grand_total || 0,
      notes: invoice.notes || 'Thank you for your business!',
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SENT': return 'bg-primary-light/20 text-primary-dark border border-primary-light';
      case 'PAID': return 'bg-primary-dark/10 text-primary-dark border border-primary-dark';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Terkirim',
      PAID: 'Lunas',
      OVERDUE: 'Jatuh Tempo',
      APPROVED: 'Disetujui',
      REJECTED: 'Ditolak',
      INVOICED: 'Sudah Invoice',
    };
    return labels[status] || status;
  };

  const totalReceivable = invoices
    .filter(inv => inv.status !== 'PAID')
    .reduce((sum, inv) => sum + inv.grand_total, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.grand_total, 0);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-dark to-primary-light rounded-3xl shadow-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent-gold/30 rounded-full blur-3xl"></div>
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <DocumentTextIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white drop-shadow-lg">Manajemen Invoice & Piutang</h1>
            </div>
            <p className="text-white/90 text-lg font-medium drop-shadow">
              💰 Kelola invoice, lacak pembayaran, dan monitor piutang perusahaan
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-white/25 text-white px-3 py-1 rounded-full backdrop-blur-sm font-medium">
                TSD FITUR 3.4.A - Accounts Receivable
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/sales/quotation')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-gold text-white font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold/90 transition-all duration-200"
            >
              <ArrowUpTrayIcon className="w-5 h-5" />
              Import CSV
            </button>
            <button
              onClick={() => navigate('/sales/quotation')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-dark font-bold shadow-lg hover:shadow-xl hover:bg-accent-gold hover:text-white transition-all duration-200 group"
            >
              <PlusIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
              Buat Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('quotation')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'quotation'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            💼 Penawaran (CRM)
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            📄 Daftar Invoice
          </button>
          <button
            onClick={() => setActiveTab('faktur')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'faktur'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🧾 Faktur Pajak
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`flex-1 px-6 py-4 font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'template'
                ? 'bg-gradient-to-r from-primary-dark to-primary-light text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🖨️ Template
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          {/* TAB 0: PENAWARAN (QUOTATION dari CRM) */}
          {activeTab === 'quotation' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark">💼 Penawaran dari Sales CRM</h2>
                  <p className="text-sm text-gray-600 mt-1">Data quotation yang sudah approved dan siap dibuat invoice</p>
                </div>
              </div>

              {/* Quotation Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Nomor</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">WO/PO</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Tanggal</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">Grand Total</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 text-primary-light mr-2" />
                            <div>
                              <p className="text-sm font-bold text-gray-900">{quotation.quotation_number}</p>
                              <p className="text-xs text-gray-500">{quotation.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-gray-900">{quotation.customer_name}</p>
                          <p className="text-xs text-gray-500">{quotation.customer_npwp}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-700">{quotation.wo_po_number}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-700">{formatDate(quotation.quotation_date)}</p>
                          <p className="text-xs text-gray-500">Valid: {formatDate(quotation.valid_until)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <p className="text-base font-bold text-gray-900">{formatCurrency(quotation.grand_total)}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(quotation.status)}`}>
                            {quotation.status === 'APPROVED' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                            {quotation.status === 'SENT' && <ClockIcon className="w-4 h-4 mr-1" />}
                            {getStatusLabel(quotation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {quotation.status === 'APPROVED' ? (
                              <>
                                <button
                                  onClick={() => handleCreateInvoiceFromQuotation(quotation)}
                                  disabled={isLoading}
                                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-bold shadow-md transition-all duration-200 ${
                                    isLoading 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-gradient-to-r from-accent-gold to-primary-light hover:shadow-lg hover:from-primary-dark hover:to-accent-gold'
                                  }`}
                                  title="Buat Invoice dari Quotation"
                                >
                                  <DocumentTextIcon className="w-4 h-4" />
                                  {isLoading ? 'Memproses...' : 'Buat Invoice'}
                                </button>
                                <button
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-primary-dark to-primary-light text-white hover:from-primary-light hover:to-primary-dark shadow-md hover:shadow-lg transition-all duration-200"
                                  title="Lihat Detail Quotation"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              </>
                            ) : quotation.status === 'INVOICED' ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setActiveTab('list')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200"
                                  title="Lihat Invoice yang Sudah Dibuat"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Lihat Invoice
                                </button>
                                <button
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-primary-dark to-primary-light text-white hover:from-primary-light hover:to-primary-dark shadow-md hover:shadow-lg transition-all duration-200"
                                  title="Lihat Detail Quotation"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                                  title="Lihat Detail Quotation"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </button>
                                <span className="text-xs text-gray-400 italic">
                                  {quotation.status === 'SENT' ? 'Menunggu approval' : 'Tidak tersedia'}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Catatan:</strong> Data quotation ini berasal dari sistem CRM Sales. Hanya quotation dengan status <strong>"Disetujui"</strong> yang bisa diproses menjadi invoice. Klik tombol <strong>"Buat Invoice"</strong> untuk memindahkan data ke halaman invoice dan melanjutkan proses.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DAFTAR INVOICE */}
          {activeTab === 'list' && (
            <div className="space-y-6">
              {/* Summary Cards - REAL DATA dari AR Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-white to-primary-light/10 rounded-2xl shadow-lg p-6 border border-primary-light">
                  <p className="text-sm font-semibold text-primary-dark mb-2">💰 Total Piutang</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(arSummary.total_outstanding)}</p>
                  <p className="text-xs text-gray-600 mt-1">Belum lunas (Real-time)</p>
                </div>
                <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg p-6 border border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Jatuh Tempo (Overdue)</p>
                  <p className="text-3xl font-bold text-red-600">{formatCurrency(arSummary.overdue_amount)}</p>
                  <p className="text-xs text-red-700 mt-1">Perlu tindak lanjut (Real-time)</p>
                </div>
                <div className="bg-gradient-to-br from-white to-accent-gold/10 rounded-2xl shadow-lg p-6 border border-accent-gold/30">
                  <p className="text-sm font-semibold text-primary-dark mb-2">📊 Rata-rata Umur Piutang</p>
                  <p className="text-3xl font-bold text-gray-900">{arSummary.avg_dso} <span className="text-lg">hari</span></p>
                  <p className="text-xs text-gray-600 mt-1">Days Sales Outstanding (DSO Real-time)</p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Cari Pelanggan</label>
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ketik nama pelanggan..."
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">📊 Filter Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-accent-gold transition-all"
                    >
                      <option value="">Semua Status</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Terkirim</option>
                      <option value="PAID">Lunas</option>
                      <option value="OVERDUE">Jatuh Tempo</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowInputForm(true)}
                      className="flex-1 px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                      ➕ Buat Invoice Manual
                    </button>
                    <button
                      onClick={() => setShowCSVUpload(true)}
                      className="flex-1 px-6 py-3 bg-[#C8A870] text-white rounded-xl hover:bg-[#06103A] transition-all font-semibold shadow-md hover:shadow-lg"
                    >
                      📂 Upload CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* Invoice Table */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Tanggal</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Customer</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">WO/PO</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">Grand Total</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredInvoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gradient-to-r hover:from-primary-light/5 hover:to-accent-gold/5 transition-all cursor-pointer"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-primary-dark">{invoice.invoice_number}</div>
                          <div className="text-xs text-gray-500">Due: {formatDate(invoice.due_date)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{formatDate(invoice.invoice_date)}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{invoice.customer_name}</div>
                          <div className="text-xs text-gray-500">{invoice.customer_contact}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono">{invoice.wo_po_number}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-bold text-lg">{formatCurrency(invoice.grand_total)}</div>
                          <div className="text-xs text-gray-500">DPP: {formatCurrency(invoice.subtotal)}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'PAID' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                            {invoice.status === 'OVERDUE' && <ClockIcon className="w-4 h-4 mr-1" />}
                            {getStatusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInvoiceForDetail(invoice);
                                setShowDetailModal(true);
                              }}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-r from-primary-dark to-primary-light text-white hover:from-primary-light hover:to-primary-dark shadow-md hover:shadow-lg transition-all duration-200"
                              title="Lihat Detail Invoice"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {/* Button Ingatkan - Only for SENT invoices yang belum dibayar */}
                            {invoice.status === 'SENT' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInvoiceForReminder(invoice);
                                  setReminderModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
                                title="Kirim Pengingat Pembayaran ke Customer"
                              >
                                🔔
                                Ingatkan
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInvoice(invoice);
                                setActiveTab('template');
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-accent-gold to-primary-light text-white text-sm font-bold shadow-md hover:shadow-lg hover:from-primary-dark hover:to-accent-gold transition-all duration-200"
                              title="Download PDF"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4" />
                              PDF
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteInvoice(invoice.id);
                              }}
                              disabled={isLoading}
                              className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Hapus Invoice dari Database"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAKTUR PAJAK */}
          {activeTab === 'faktur' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-primary-dark">📊 Rekap Faktur Pajak</h2>
                  <p className="text-sm text-gray-600 mt-1">Summary pajak dari semua invoice periode berjalan</p>
                </div>
                <button
                  onClick={() => {
                    // Export all invoices to XLS
                    alert('Export All Invoices to XLS - Coming Soon!');
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export Semua (XLS)
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg p-6 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-800 mb-2">📝 Total Invoice</p>
                  <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
                  <p className="text-xs text-blue-700 mt-1">Semua status</p>
                </div>
                <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-lg p-6 border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">💰 Total DPP (Subtotal)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + inv.subtotal, 0))}
                  </p>
                  <p className="text-xs text-green-700 mt-1">Sebelum pajak</p>
                </div>
                <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-lg p-6 border border-orange-200">
                  <p className="text-sm font-semibold text-orange-800 mb-2">📈 Total PPN (11%)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + inv.ppn_amount, 0))}
                  </p>
                  <p className="text-xs text-orange-700 mt-1">Pajak keluaran</p>
                </div>
                <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl shadow-lg p-6 border border-red-200">
                  <p className="text-sm font-semibold text-red-800 mb-2">📉 Total PPh 23 (2%)</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(invoices.reduce((sum, inv) => sum + inv.pph23_amount, 0))}
                  </p>
                  <p className="text-xs text-red-700 mt-1">Pajak dipotong</p>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-2 border-primary-light/30 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 mb-2">Format e-Faktur untuk CoreTax / DJP Online</p>
                    <p className="text-sm text-gray-700">
                      File XLS yang diexport sesuai dengan format standar Direktorat Jenderal Pajak untuk kemudahan pelaporan SPT Masa PPN.
                      Klik tombol "Export XLS" pada setiap invoice untuk download format e-Faktur.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoice Table - Rekap Format */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-primary-dark to-primary-light">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Invoice</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase whitespace-nowrap">Customer</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">DPP (Subtotal)</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">PPN (11%)</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">PPh 23 (2%)</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase whitespace-nowrap">Grand Total</th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase whitespace-nowrap">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <DocumentTextIcon className="w-5 h-5 text-primary-light mr-2" />
                              <div>
                                <p className="text-sm font-bold text-gray-900">{invoice.invoice_number}</p>
                                <p className="text-xs text-gray-500">{formatDate(invoice.invoice_date)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-gray-900">{invoice.customer_name}</p>
                            <p className="text-xs text-gray-500">{invoice.customer_npwp}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.subtotal)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-orange-600">{formatCurrency(invoice.ppn_amount)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-sm font-bold text-red-600">-{formatCurrency(invoice.pph23_amount)}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <p className="text-base font-bold text-primary-dark">{formatCurrency(invoice.grand_total)}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setFakturPreviewData(invoice);
                                  setShowFakturPreviewModal(true);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
                                title="Preview Faktur Pajak"
                              >
                                <EyeIcon className="w-4 h-4" />
                                Preview
                              </button>
                              <button
                                onClick={() => exportFakturPajakToXLS(invoice)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:from-green-600 hover:to-green-700 transition-all"
                                title="Export ke XLS"
                              >
                                <DocumentArrowDownIcon className="w-4 h-4" />
                                Export XLS
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gradient-to-r from-primary-dark/5 to-primary-light/5">
                      <tr className="font-bold">
                        <td colSpan={2} className="px-6 py-4 text-right text-sm text-gray-700">TOTAL:</td>
                        <td className="px-6 py-4 text-right text-base text-gray-900">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + inv.subtotal, 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-base text-orange-600">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + inv.ppn_amount, 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-base text-red-600">
                          -{formatCurrency(invoices.reduce((sum, inv) => sum + inv.pph23_amount, 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-lg text-primary-dark">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + inv.grand_total, 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATE INVOICE */}
          {activeTab === 'template' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-primary-light/10 to-accent-gold/10 rounded-2xl shadow-lg p-8 border-2 border-primary-light/20">
                <div className="text-center mb-6">
                  <div className="inline-block p-4 bg-white rounded-full shadow-md mb-4">
                    <DocumentTextIcon className="w-12 h-12 text-primary-dark" />
                  </div>
                  <h2 className="text-3xl font-bold text-primary-dark mb-2">🖨️ Template Invoice</h2>
                  <p className="text-gray-600 text-lg">Pilih invoice dari tab "Daftar Invoice" untuk melihat template PDF</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="text-4xl mb-2">✨</div>
                    <h3 className="font-bold text-gray-900 mb-1">Modern</h3>
                    <p className="text-sm text-gray-600">Desain kontemporer dengan aksen warna biru</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="text-4xl mb-2">🎓</div>
                    <h3 className="font-bold text-gray-900 mb-1">Classic</h3>
                    <p className="text-sm text-gray-600">Desain klasik profesional hitam-putih</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="text-4xl mb-2">📋</div>
                    <h3 className="font-bold text-gray-900 mb-1">Minimal</h3>
                    <p className="text-sm text-gray-600">Desain sederhana dan clean</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-3">📝 Cara Menggunakan:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>Buka tab <span className="font-semibold text-primary-dark">"Daftar Invoice"</span></li>
                    <li>Klik icon <span className="font-semibold text-primary-dark">👁️ (mata)</span> pada invoice yang ingin dilihat</li>
                    <li>Klik tombol <span className="font-semibold text-primary-dark">"🖨️ Lihat Template"</span></li>
                    <li>Pilih template yang diinginkan (Modern/Classic/Minimal)</li>
                    <li>Preview PDF akan muncul secara real-time</li>
                    <li>Download atau kirim via email</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Send Email Modal */}
      {sendEmailModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <EnvelopeIcon className="w-6 h-6" />
                  Send Invoice via Email
                </h2>
                <button onClick={() => setSendEmailModalOpen(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number</label>
                <input 
                  type="text"
                  value={selectedInvoice.invoice_number}
                  disabled
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Template</label>
                <input 
                  type="text"
                  value={selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}
                  disabled
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient Email *</label>
                <input 
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSendEmailModalOpen(false)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!recipientEmail) {
                      alert('Please enter recipient email');
                      return;
                    }
                    setIsGeneratingPDF(true);
                    const result = await sendInvoiceEmail(
                      convertToPDFInvoiceData(selectedInvoice),
                      recipientEmail,
                      selectedTemplate
                    );
                    setIsGeneratingPDF(false);
                    alert(result.message);
                    if (result.success) {
                      setSendEmailModalOpen(false);
                    }
                  }}
                  disabled={isGeneratingPDF || !recipientEmail}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPDF ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Input Form Modal */}
      {showInputForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">➕ Buat Invoice Manual</h2>
                <button onClick={() => setShowInputForm(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <form className="p-6 space-y-6 max-h-[70vh] overflow-y-auto" onSubmit={handleManualInvoiceSubmit}>
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pelanggan *</label>
                  <input 
                    type="text" 
                    value={manualFormData.customer_name}
                    onChange={(e) => setManualFormData({...manualFormData, customer_name: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">NPWP Pelanggan *</label>
                  <input 
                    type="text" 
                    value={manualFormData.customer_npwp}
                    onChange={(e) => setManualFormData({...manualFormData, customer_npwp: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Pelanggan *</label>
                  <textarea 
                    value={manualFormData.customer_address}
                    onChange={(e) => setManualFormData({...manualFormData, customer_address: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    rows={3} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Pelanggan</label>
                  <input 
                    type="email" 
                    value={manualFormData.customer_email}
                    onChange={(e) => setManualFormData({...manualFormData, customer_email: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telepon</label>
                  <input 
                    type="tel" 
                    value={manualFormData.customer_phone}
                    onChange={(e) => setManualFormData({...manualFormData, customer_phone: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                  />
                </div>
              </div>

              {/* Invoice Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Invoice *</label>
                  <input 
                    type="text" 
                    placeholder="INV-YYMMDD-001" 
                    value={manualFormData.invoice_number}
                    onChange={(e) => setManualFormData({...manualFormData, invoice_number: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Invoice *</label>
                  <input 
                    type="date" 
                    value={manualFormData.invoice_date}
                    onChange={(e) => setManualFormData({...manualFormData, invoice_date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Jatuh Tempo *</label>
                  <input 
                    type="date" 
                    value={manualFormData.due_date}
                    onChange={(e) => setManualFormData({...manualFormData, due_date: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                    required 
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">WO/PO Number</label>
                  <input 
                    type="text" 
                    value={manualFormData.wo_po_number}
                    onChange={(e) => setManualFormData({...manualFormData, wo_po_number: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-accent-gold" 
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Item Invoice</h3>
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="px-4 py-2 bg-[#4E88BE] text-white rounded-lg hover:bg-[#06103A] transition-colors"
                  >
                    + Tambah Item
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-3 mb-3 text-sm font-semibold text-gray-700">
                  <div className="col-span-5">Deskripsi</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Harga Satuan</div>
                  <div className="col-span-2">Total</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="space-y-2">
                  {manualItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-5">
                        <input 
                          type="text" 
                          placeholder="Nama barang/jasa..." 
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold" 
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          placeholder="1" 
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold" 
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="number" 
                          placeholder="0" 
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold" 
                          min="0"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          value={formatCurrency(item.total)} 
                          disabled 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 font-semibold" 
                        />
                      </div>
                      <div className="col-span-1">
                        <button 
                          type="button" 
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                          disabled={manualItems.length === 1}
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal (DPP):</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PPN (11%):</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totals.ppn_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">{formatCurrency(totals.subtotal + totals.ppn_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PPh 23 (2%):</span>
                  <span className="font-semibold text-red-600">- {formatCurrency(totals.pph23_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                  <span className="text-gray-900">Grand Total:</span>
                  <span className="text-[#4E88BE]">{formatCurrency(totals.grand_total)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowInputForm(false)} 
                  className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
                  disabled={isLoading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Menyimpan...' : '💾 Simpan Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCSVUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-accent-gold to-primary-light p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">📂 Upload CSV Invoice</h2>
                <button onClick={() => setShowCSVUpload(false)} className="text-white hover:text-gray-200">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Upload Area */}
              <div className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-accent-gold transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      console.log('CSV file uploaded:', file.name);
                      // TODO: Parse CSV and add to invoices
                    }
                  }}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="mb-4">
                    <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">Klik atau drag & drop file CSV</p>
                  <p className="text-sm text-gray-600">Format: invoice_number, invoice_date, customer_name, ...</p>
                </label>
              </div>

              {/* CSV Format Guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-900 mb-2">📋 Format CSV yang Dibutuhkan:</h3>
                <code className="text-xs text-blue-800 block whitespace-pre-wrap">
                  invoice_number,invoice_date,due_date,customer_name,customer_address,customer_npwp,wo_po_number,item_description,item_quantity,item_unit_price
                </code>
                <p className="text-xs text-blue-700 mt-2">Contoh:</p>
                <code className="text-xs text-blue-800 block whitespace-pre-wrap">
                  INV-001,2025-01-15,2025-01-30,PT Shell,Jakarta,01.234.567.8-901.000,WO123,Jasa Instalasi,1,1000000
                </code>
              </div>

              {/* Download Template */}
              <button className="w-full px-6 py-3 bg-[#4E88BE] text-white rounded-xl hover:bg-[#06103A] transition-colors font-semibold">
                📥 Download Template CSV
              </button>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowCSVUpload(false)} className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors font-semibold">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - FE-FIN-06 */}
      {paymentModalOpen && invoiceForPayment && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setInvoiceForPayment(null);
          }}
          invoice={{
            id: invoiceForPayment.id,
            invoice_number: invoiceForPayment.invoice_number,
            customer_name: invoiceForPayment.customer_name,
            total_amount: invoiceForPayment.grand_total,
            paid_amount: invoiceForPayment.paid_amount || 0,
            remaining_amount: invoiceForPayment.remaining_amount || invoiceForPayment.grand_total,
          }}
          onSuccess={() => {
            fetchInvoices(); // Refresh invoice list
            fetchARSummary(); // Refresh AR dashboard real-time
          }}
        />
      )}

      {/* Reminder Modal - Send payment reminder to customer */}
      {reminderModalOpen && invoiceForReminder && (
        <ReminderModal
          isOpen={reminderModalOpen}
          onClose={() => {
            setReminderModalOpen(false);
            setInvoiceForReminder(null);
          }}
          invoice={invoiceForReminder}
        />
      )}

      {/* Faktur Pajak Preview Modal */}
      {showFakturPreviewModal && fakturPreviewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentArrowDownIcon className="w-8 h-8 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">🧾 Preview Faktur Pajak e-Faktur</h2>
                    <p className="text-white/90 text-sm mt-1">
                      Format standar DJP untuk CoreTax - Review sebelum export
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFakturPreviewModal(false);
                    setFakturPreviewData(null);
                  }}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-b-2 border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📄 Nomor Invoice</p>
                  <p className="text-lg font-bold text-primary-dark">{fakturPreviewData.invoice_number}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💼 Customer</p>
                  <p className="text-lg font-bold text-gray-900">{fakturPreviewData.customer_name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📅 Tanggal</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(fakturPreviewData.invoice_date)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💰 Total DPP</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(fakturPreviewData.subtotal)}</p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Sheet 1: Faktur (Main Info) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h3 className="text-xl font-bold text-white">📋 Sheet 1: Faktur (Informasi Utama)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Field</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Value</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">Keterangan Tambahan</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fakturPreviewData.wo_po_number}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">Dokumen Pendukung Referensi</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {fakturPreviewData.wo_po_number}/{new Date(fakturPreviewData.invoice_date).toLocaleDateString('id-ID', { month: '2-digit', year: 'numeric' }).replace('/', '')}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">NPWP/NIK Pembeli</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{fakturPreviewData.customer_npwp}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">Nama Pembeli</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-semibold">{fakturPreviewData.customer_name}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">Alamat Pembeli</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{fakturPreviewData.customer_address}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">Jenis ID e-Negara Pembeli</td>
                        <td className="px-4 py-3 text-sm text-gray-900">TIN (Tax Identification Number)</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-semibold text-gray-600">ID De Negara Pembeli</td>
                        <td className="px-4 py-3 text-sm text-gray-900">IDN (Indonesia)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sheet 2: Detail Faktur (Line Items) */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                  <h3 className="text-xl font-bold text-white">📊 Sheet 2: DetailFaktur (Item Barang/Jasa)</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Baris</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">Nama Barang/Jasa</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">Harga Satuan</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">DPP</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">Tarif PPN</th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">PPN</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fakturPreviewData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-center text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatCurrency(item.total)}</td>
                          <td className="px-4 py-3 text-sm text-center text-orange-600 font-bold">{fakturPreviewData.ppn_rate}%</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-orange-600">
                            {formatCurrency(Math.round(item.total * fakturPreviewData.ppn_rate / 100))}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gradient-to-r from-green-50 to-blue-50 font-bold">
                        <td colSpan={4} className="px-4 py-4 text-right text-sm text-gray-700">TOTAL DPP:</td>
                        <td className="px-4 py-4 text-right text-base text-gray-900">{formatCurrency(fakturPreviewData.subtotal)}</td>
                        <td className="px-4 py-4 text-center text-sm text-orange-600">{fakturPreviewData.ppn_rate}%</td>
                        <td className="px-4 py-4 text-right text-base text-orange-600">{formatCurrency(fakturPreviewData.ppn_amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Pajak */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-lg border-2 border-green-300 p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">💰 Ringkasan Pajak</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <p className="text-xs font-semibold text-gray-600 mb-1">📊 DPP (Dasar Pengenaan Pajak)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(fakturPreviewData.subtotal)}</p>
                    <p className="text-xs text-gray-500 mt-1">Subtotal sebelum pajak</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <p className="text-xs font-semibold text-gray-600 mb-1">📈 PPN (Pajak Pertambahan Nilai)</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(fakturPreviewData.ppn_amount)}</p>
                    <p className="text-xs text-orange-700 mt-1">Tarif {fakturPreviewData.ppn_rate}% dari DPP</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <p className="text-xs font-semibold text-gray-600 mb-1">📉 PPh 23 (Pajak Penghasilan)</p>
                    <p className="text-2xl font-bold text-red-600">-{formatCurrency(fakturPreviewData.pph23_amount)}</p>
                    <p className="text-xs text-red-700 mt-1">Tarif {fakturPreviewData.pph23_rate}% dipotong</p>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-primary-dark to-primary-light rounded-xl">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-white">Grand Total Invoice:</p>
                    <p className="text-3xl font-bold text-accent-gold">{formatCurrency(fakturPreviewData.grand_total)}</p>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>ℹ️ Catatan:</strong> File XLS yang akan diexport mengikuti format standar e-Faktur Direktorat Jenderal Pajak (DJP). 
                  File berisi 4 sheet: <strong>Faktur</strong> (info utama), <strong>DetailFaktur</strong> (item detail), <strong>REF</strong> (referensi), dan <strong>Keterangan</strong> (notes). 
                  Format ini dapat langsung diimport ke aplikasi <strong>CoreTax</strong> atau <strong>DJP Online</strong> untuk pelaporan SPT Masa PPN.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowFakturPreviewModal(false);
                    setFakturPreviewData(null);
                  }}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
                >
                  ❌ Tutup Preview
                </button>
                <button
                  onClick={() => {
                    exportFakturPajakToXLS(fakturPreviewData);
                    setShowFakturPreviewModal(false);
                    setFakturPreviewData(null);
                  }}
                  className="flex-1 px-8 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <span className="flex items-center justify-center gap-2">
                    <DocumentArrowDownIcon className="w-5 h-5" />
                    💾 Export ke XLS (Format e-Faktur DJP)
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal - Auto-generated from Quotation */}
      {showPreviewModal && previewInvoiceData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-dark to-primary-light p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SparklesIcon className="w-8 h-8 text-accent-gold" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">🎯 Preview Invoice Auto-Generated</h2>
                    <p className="text-white/90 text-sm mt-1">
                      Review invoice template dan faktur pajak sebelum disimpan
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewInvoiceData(null);
                    setPreviewPDFBlob(null);
                  }}
                  className="text-white hover:text-accent-gold transition-colors"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="p-6 bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-b-2 border-primary-light/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📄 Nomor Invoice</p>
                  <p className="text-lg font-bold text-primary-dark">{previewInvoiceData.invoice_number}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💼 Customer</p>
                  <p className="text-lg font-bold text-gray-900">{previewInvoiceData.customer_name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📅 Tanggal</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(previewInvoiceData.invoice_date)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💰 Grand Total</p>
                  <p className="text-lg font-bold text-accent-gold">{formatCurrency(previewInvoiceData.grand_total)}</p>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* PDF Preview */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    📄 Preview Invoice Template (PDF)
                  </h3>
                  <p className="text-white/90 text-sm mt-1">Template: {selectedTemplate === 'modern' ? 'Modern' : selectedTemplate === 'classic' ? 'Classic' : 'Minimal'}</p>
                </div>
                <div className="p-4 bg-gray-50">
                  {previewPDFBlob ? (
                    <div className="bg-white rounded-xl shadow-inner p-4" style={{ height: '600px' }}>
                      <iframe
                        src={URL.createObjectURL(previewPDFBlob)}
                        className="w-full h-full rounded-lg"
                        title="Invoice PDF Preview"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 bg-white rounded-xl">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Generating PDF preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Faktur Pajak Info */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <DocumentArrowDownIcon className="w-6 h-6" />
                    🧾 Faktur Pajak (XLS Format)
                  </h3>
                  <p className="text-white/90 text-sm mt-1">Format standar DJP untuk e-Faktur CoreTax</p>
                </div>
                <div className="p-6">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-start gap-4">
                      <div className="bg-green-600 rounded-full p-3">
                        <CheckCircleIcon className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-green-900 mb-2">Faktur Pajak Siap Diexport</h4>
                        <div className="space-y-2 text-sm text-green-800">
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">📊 DPP (Subtotal):</span>
                            <span className="font-bold">{formatCurrency(previewInvoiceData.subtotal)}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">📈 PPN ({previewInvoiceData.ppn_rate}%):</span>
                            <span className="font-bold">{formatCurrency(previewInvoiceData.ppn_amount)}</span>
                          </p>
                          <p className="flex items-center gap-2">
                            <span className="font-semibold">📉 PPh 23 ({previewInvoiceData.pph23_rate}%):</span>
                            <span className="font-bold">{formatCurrency(previewInvoiceData.pph23_amount)}</span>
                          </p>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded-lg border border-green-300">
                          <p className="text-xs text-gray-700">
                            <strong>ℹ️ Info:</strong> Faktur pajak akan otomatis di-generate dalam format XLS setelah invoice disimpan. 
                            Anda dapat mengexport dari tab "Faktur Pajak" untuk upload ke CoreTax/DJP Online.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoice Items Detail */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                  <h3 className="text-xl font-bold text-white">📋 Detail Item Invoice</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Deskripsi</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Harga Satuan</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewInvoiceData.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                          <td className="px-6 py-4 text-sm text-center text-gray-900">{item.quantity}</td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                          <td className="px-6 py-4 text-sm text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={3} className="px-6 py-4 text-sm text-right text-gray-700">Subtotal:</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(previewInvoiceData.subtotal)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-4 text-sm text-right text-gray-700">PPN ({previewInvoiceData.ppn_rate}%):</td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">{formatCurrency(previewInvoiceData.ppn_amount)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-4 text-sm text-right text-gray-700">PPh 23 ({previewInvoiceData.pph23_rate}%):</td>
                        <td className="px-6 py-4 text-sm text-right text-red-600">-{formatCurrency(previewInvoiceData.pph23_amount)}</td>
                      </tr>
                      <tr className="bg-gradient-to-r from-accent-gold/20 to-primary-light/20 font-bold text-lg">
                        <td colSpan={3} className="px-6 py-4 text-right text-primary-dark">GRAND TOTAL:</td>
                        <td className="px-6 py-4 text-right text-accent-gold">{formatCurrency(previewInvoiceData.grand_total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-4 border-t-2 border-gray-200">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    setPreviewInvoiceData(null);
                    setPreviewPDFBlob(null);
                  }}
                  className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all shadow-md hover:shadow-lg"
                >
                  ✏️ Edit / Batal
                </button>
                <button
                  onClick={handleSaveInvoiceFromPreview}
                  disabled={isLoading}
                  className={`flex-1 px-8 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all ${
                    isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-accent-gold to-primary-dark hover:from-primary-dark hover:to-accent-gold'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </span>
                  ) : (
                    '💾 Simpan Invoice ke Database'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && invoiceForDetail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-8">
            <div className="bg-gradient-to-r from-primary-dark to-primary-light p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">📄 Detail Invoice</h2>
                  <p className="text-sm text-white/80 mt-1">{invoiceForDetail.invoice_number}</p>
                </div>
                <button 
                  onClick={() => {
                    setShowDetailModal(false);
                    setInvoiceForDetail(null);
                  }} 
                  className="text-white hover:text-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Status Badge */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status Invoice</p>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(invoiceForDetail.status)}`}>
                    {invoiceForDetail.status === 'PAID' && <CheckCircleIcon className="w-5 h-5 mr-2" />}
                    {invoiceForDetail.status === 'OVERDUE' && <ClockIcon className="w-5 h-5 mr-2" />}
                    {getStatusLabel(invoiceForDetail.status)}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Grand Total</p>
                  <p className="text-2xl font-bold text-primary-dark">{formatCurrency(invoiceForDetail.grand_total)}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">💼 Informasi Customer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Nama Customer</p>
                    <p className="text-base font-bold text-gray-900">{invoiceForDetail.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">NPWP</p>
                    <p className="text-base font-medium text-gray-900">{invoiceForDetail.customer_npwp}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-gray-600">Alamat</p>
                    <p className="text-base text-gray-900">{invoiceForDetail.customer_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Kontak</p>
                    <p className="text-base text-gray-900">{invoiceForDetail.customer_contact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">WO/PO Number</p>
                    <p className="text-base font-mono text-gray-900">{invoiceForDetail.wo_po_number}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Info */}
              <div className="border-2 border-gray-200 rounded-xl p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">📅 Informasi Invoice</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Nomor Invoice</p>
                    <p className="text-base font-bold text-primary-dark">{invoiceForDetail.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Tanggal Invoice</p>
                    <p className="text-base text-gray-900">{formatDate(invoiceForDetail.invoice_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Jatuh Tempo</p>
                    <p className="text-base font-semibold text-red-600">{formatDate(invoiceForDetail.due_date)}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              {invoiceForDetail.items && invoiceForDetail.items.length > 0 && (
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">📝 Item Invoice</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Deskripsi</th>
                          <th className="px-4 py-2 text-center text-xs font-bold text-gray-700 uppercase">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Harga</th>
                          <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {invoiceForDetail.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 space-y-2">
                <h3 className="text-lg font-bold text-gray-900 mb-3">💰 Ringkasan Keuangan</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal (DPP):</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoiceForDetail.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PPN ({invoiceForDetail.ppn_rate}%):</span>
                  <span className="font-semibold text-green-600">+ {formatCurrency(invoiceForDetail.ppn_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">PPh 23 ({invoiceForDetail.pph23_rate}%):</span>
                  <span className="font-semibold text-red-600">- {formatCurrency(invoiceForDetail.pph23_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2 mt-2">
                  <span className="text-gray-900">Grand Total:</span>
                  <span className="text-primary-dark">{formatCurrency(invoiceForDetail.grand_total)}</span>
                </div>
                {invoiceForDetail.paid_amount !== undefined && invoiceForDetail.paid_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sudah Dibayar:</span>
                      <span className="font-semibold text-blue-600">{formatCurrency(invoiceForDetail.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sisa Tagihan:</span>
                      <span className="font-semibold text-orange-600">{formatCurrency(invoiceForDetail.remaining_amount || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Notes */}
              {invoiceForDetail.notes && (
                <div className="border-2 border-gray-200 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">📝 Catatan</h3>
                  <p className="text-sm text-gray-700">{invoiceForDetail.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    console.log('🖨️ Opening template preview for invoice:', invoiceForDetail);
                    console.log('📋 Items in invoice:', invoiceForDetail.items);
                    setShowDetailModal(false);
                    setTemplatePreviewInvoice(invoiceForDetail);
                    setShowTemplatePreviewModal(true);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-dark to-primary-light text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  🖨️ Lihat Template
                </button>
                {invoiceForDetail.status === 'SENT' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setInvoiceForReminder(invoiceForDetail);
                      setReminderModalOpen(true);
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                  >
                    🔔 Kirim Pengingat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview Modal */}
      {showTemplatePreviewModal && templatePreviewInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-dark to-primary-light p-6 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="w-8 h-8 text-accent-gold" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">🖨️ Preview Template Invoice</h2>
                    <p className="text-white/90 text-sm mt-1">
                      Template: {selectedTemplate === 'modern' ? 'Modern' : selectedTemplate === 'classic' ? 'Classic' : 'Minimal'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowTemplatePreviewModal(false);
                    setTemplatePreviewInvoice(null);
                  }}
                  className="text-white hover:text-accent-gold transition-colors"
                >
                  <XMarkIcon className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="p-6 bg-gradient-to-br from-primary-light/10 to-accent-gold/10 border-b-2 border-primary-light/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📄 Nomor Invoice</p>
                  <p className="text-lg font-bold text-primary-dark">{templatePreviewInvoice.invoice_number}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💼 Customer</p>
                  <p className="text-lg font-bold text-gray-900">{templatePreviewInvoice.customer_name}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">📅 Tanggal</p>
                  <p className="text-lg font-bold text-gray-900">{formatDate(templatePreviewInvoice.invoice_date)}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-xs font-semibold text-gray-600 mb-1">💰 Grand Total</p>
                  <p className="text-lg font-bold text-accent-gold">{formatCurrency(templatePreviewInvoice.grand_total)}</p>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="p-6 border-b-2 border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">🎨 Pilih Template</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedTemplate('modern')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === 'modern'
                      ? 'border-primary-dark bg-primary-light/10 shadow-lg'
                      : 'border-gray-300 hover:border-primary-light'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">✨</div>
                    <p className="font-bold text-gray-900">Modern</p>
                    <p className="text-xs text-gray-600">Desain kontemporer</p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTemplate('classic')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === 'classic'
                      ? 'border-primary-dark bg-primary-light/10 shadow-lg'
                      : 'border-gray-300 hover:border-primary-light'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">🎓</div>
                    <p className="font-bold text-gray-900">Classic</p>
                    <p className="text-xs text-gray-600">Desain klasik profesional</p>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTemplate('minimal')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedTemplate === 'minimal'
                      ? 'border-primary-dark bg-primary-light/10 shadow-lg'
                      : 'border-gray-300 hover:border-primary-light'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <p className="font-bold text-gray-900">Minimal</p>
                    <p className="text-xs text-gray-600">Desain sederhana</p>
                  </div>
                </button>
              </div>
            </div>

            {/* PDF Preview */}
            <div className="p-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    📄 Preview PDF
                  </h3>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="bg-white rounded-xl shadow-inner" style={{ height: '600px' }}>
                    {templatePreviewInvoice && templatePreviewInvoice.items && templatePreviewInvoice.items.length > 0 ? (
                      <PDFViewer width="100%" height="100%" showToolbar={true}>
                        {(() => {
                          const pdfData = convertToPDFInvoiceData(templatePreviewInvoice);
                          if (selectedTemplate === 'modern') {
                            return <ModernTemplate {...pdfData} />;
                          } else if (selectedTemplate === 'classic') {
                            return <ClassicTemplate {...pdfData} />;
                          } else {
                            return <MinimalTemplate {...pdfData} />;
                          }
                        })()}
                      </PDFViewer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full bg-gray-100 rounded-xl">
                        <div className="text-center p-8">
                          <div className="text-6xl mb-4">⚠️</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">Data Invoice Tidak Lengkap</h3>
                          <p className="text-gray-600 mb-4">Invoice ini tidak memiliki item/line items.</p>
                          <div className="bg-white rounded-lg p-4 text-left text-sm">
                            <p className="font-semibold mb-2">Debug Info:</p>
                            <p className="text-gray-600">Invoice: {templatePreviewInvoice?.invoice_number || 'N/A'}</p>
                            <p className="text-gray-600">Items: {templatePreviewInvoice?.items?.length || 0}</p>
                            <p className="text-gray-600">Subtotal: {templatePreviewInvoice?.subtotal || 0}</p>
                          </div>
                          <button
                            onClick={() => {
                              console.log('📋 Full invoice data:', templatePreviewInvoice);
                              alert('Check browser console for full data');
                            }}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            🔍 Show Console Log
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={async () => {
                    setIsGeneratingPDF(true);
                    await downloadInvoicePDF(
                      convertToPDFInvoiceData(templatePreviewInvoice),
                      selectedTemplate
                    );
                    setIsGeneratingPDF(false);
                  }}
                  disabled={isGeneratingPDF}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                >
                  {isGeneratingPDF ? '⏳ Generating...' : '💾 Download PDF'}
                </button>
                <button
                  onClick={() => {
                    setShowTemplatePreviewModal(false);
                    setSelectedInvoice(templatePreviewInvoice);
                    setSendEmailModalOpen(true);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  📧 Kirim Email
                </button>
                <button
                  onClick={() => {
                    setShowTemplatePreviewModal(false);
                    setTemplatePreviewInvoice(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                >
                  ❌ Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        }
      `}</style>
    </div>
  );
};

export default InvoiceManagementComplete;
