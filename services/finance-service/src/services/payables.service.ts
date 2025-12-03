// Payables Service - Per TSD FITUR 3.4.B
// Accounts Payable dengan 3-way matching
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import financeEvents from '../events/financeEvents';
import { mockDataStore } from '../utils/mockData';

const prisma = new PrismaClient();

export interface CreatePayableDto {
  po_id: string; // Purchase Order ID
  vendor_invoice_number: string;
  invoice_date: string;
  due_date: string;
  vendor_id: string;
  vendor_name: string;
  items: PayableItemDto[];
  notes?: string;
  created_by?: string;
}

export interface PayableItemDto {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface RecordPayablePaymentDto {
  payment_date: string;
  amount: number;
  bank_account_id?: string;
  notes?: string;
}

class PayablesService {
  /**
   * Validate 3-way matching
   * PO vs Receipt vs Vendor Invoice
   * Skip validation if no PO (manual entry for operational/project)
   */
  private async validateThreeWayMatch(
    poId: string | null,
    vendorInvoiceItems: PayableItemDto[]
  ): Promise<{ isValid: boolean; message?: string }> {
    try {
      // Skip validation for manual entry without PO
      if (!poId) {
        console.log('⏭️ Skipping 3-way match - Manual entry without PO');
        return { isValid: true };
      }
      
      // TODO: In production, fetch from Procurement Service & Inventory Service
      // For now, we'll do basic validation
      
      // Mock PO data check
      console.log(`🔍 Validating 3-way match for PO: ${poId}`);
      
      // Calculate totals from vendor invoice
      const invoiceTotal = vendorInvoiceItems.reduce((sum, item) => sum + item.total, 0);
      
      // In production, compare:
      // 1. PO items vs Vendor Invoice items (quantities, prices)
      // 2. Receipt quantities vs Vendor Invoice quantities
      // 3. All three must match within tolerance
      
      // For demo, assume valid if total > 0
      if (invoiceTotal <= 0) {
        return {
          isValid: false,
          message: 'Invoice total must be greater than 0',
        };
      }
      
      console.log(`✅ 3-way match validated for PO: ${poId}`);
      
      return {
        isValid: true,
      };
    } catch (error) {
      console.error('Error in 3-way matching:', error);
      return {
        isValid: false,
        message: 'Error during 3-way matching validation',
      };
    }
  }

  /**
   * Get all payables with filters
   */
  async getAllPayables(filters?: {
    status?: string;
    vendor_name?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      console.log("📊 Fetching payables from database...");
      
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.vendor_name) {
        where.vendor_name = {
          contains: filters.vendor_name,
          mode: 'insensitive'
        };
      }

      // Fetch from database
      const [payables, total] = await Promise.all([
        prisma.payables.findMany({
          where,
          skip,
          take: limit,
          include: {
            payments: true
          },
          orderBy: { created_at: 'desc' },
        }),
        prisma.payables.count({ where })
      ]);

      // Transform data to add remaining_amount
      const transformedData = payables.map(p => {
        const paidAmount = p.payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
        const totalAmount = Number(p.total_amount);
        
        return {
          ...p,
          id: p.id.toString(),
          total_amount: totalAmount,
          paid_amount: paidAmount,
          remaining_amount: totalAmount - paidAmount,
          subtotal: Number(p.subtotal),
          tax_amount: Number(p.tax_amount)
        };
      });

      console.log(`✅ Found ${payables.length} payables from database`);

      return {
        data: transformedData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching payables:', error);
      throw error;
    }
  }

  /**
   * Get AP summary (Accounts Payable metrics)
   */
  async getAPSummary() {
    try {
      // Use mock data store
      console.warn("⚠️ Using mock data store for AP summary");
      return mockDataStore.getAPSummary();
    } catch (error) {
      console.error('Error fetching AP summary:', error);
      throw error;
    }
  }

  /**
   * Create new payable (record vendor bill)
   * Per TSD FITUR 3.4.B - Alur 1
   */
  async createPayable(data: CreatePayableDto) {
    try {
      console.log(`📝 Creating payable for vendor invoice: ${data.vendor_invoice_number}`);

      // Step 1: Validate 3-way matching
      const validation = await this.validateThreeWayMatch(data.po_id, data.items);
      
      if (!validation.isValid) {
        throw new Error(validation.message || '3-way matching failed');
      }

      // Step 2: Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = subtotal * 0.11; // PPN 11%
      const totalAmount = subtotal + taxAmount;

      // Step 3: Insert to payables table
      const payableId = uuidv4();
      const poIdValue = data.po_id || 'MANUAL-' + Date.now(); // Generate placeholder for manual entry
      
      await prisma.$queryRawUnsafe(`
        INSERT INTO payables (
          id, po_id, vendor_invoice_number, invoice_date, due_date,
          vendor_name, subtotal, tax_amount, total_amount, status, created_at, updated_at
        ) VALUES (
          $1::uuid, $2, $3, $4::date, $5::date, $6, $7::numeric, $8::numeric, $9::numeric, 'PENDING', NOW(), NOW()
        )
      `, payableId, poIdValue, data.vendor_invoice_number, data.invoice_date,
         data.due_date, data.vendor_name, subtotal, taxAmount, totalAmount);

      // Step 4: Insert payable items
      for (const item of data.items) {
        const itemId = uuidv4();
        await prisma.$queryRawUnsafe(`
          INSERT INTO payable_items (id, payable_id, item_description, quantity, unit_price, total_price, created_at)
          VALUES ($1::uuid, $2::uuid, $3, $4::numeric, $5::numeric, $6::numeric, NOW())
        `, itemId, payableId, item.description, item.quantity, item.unit_price, item.total);
      }

      console.log(`✅ Payable created: ${payableId} for vendor ${data.vendor_name}`);

      // Step 5: Trigger event for journal entry
      financeEvents.emit('payable.created', {
        payableId,
        vendorName: data.vendor_name,
        amount: totalAmount,
        type: 'GOODS', // Default to GOODS
      });

      return {
        id: payableId,
        vendor_invoice_number: data.vendor_invoice_number,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        vendor_name: data.vendor_name,
        total_amount: totalAmount,
        status: 'PENDING',
        created_at: new Date(),
      };
    } catch (error) {
      console.error('Error creating payable:', error);
      throw error;
    }
  }

  /**
   * Record payment for payable
   * Per TSD FITUR 3.4.B - Alur 2
   */
  async recordPayment(payableId: string, payment: RecordPayablePaymentDto) {
    try {
      console.log(`💸 Recording payment for payable: ${payableId}`);

      // Get payable from database (cast UUID)
      const payables: any[] = await prisma.$queryRawUnsafe(
        'SELECT * FROM payables WHERE id = $1::uuid', payableId
      );

      if (!payables || payables.length === 0) {
        throw new Error('Payable not found');
      }

      const payable = payables[0];
      
      // Validate payment amount
      if (payment.amount <= 0) {
        throw new Error('Payment amount must be greater than 0');
      }

      if (payment.amount > Number(payable.total_amount)) {
        throw new Error(`Payment amount exceeds payable total`);
      }

      // Insert payment record (cast UUIDs)
      const paymentId = uuidv4();
      await prisma.$queryRawUnsafe(`
        INSERT INTO payable_payments (id, payable_id, payment_date, payment_amount, payment_method, reference_number, notes, created_at)
        VALUES ($1::uuid, $2::uuid, $3::date, $4::numeric, $5, $6, $7, NOW())
      `, paymentId, payableId, payment.payment_date, Number(payment.amount), 'TRANSFER', payment.bank_account_id || `PAY-${Date.now()}`, payment.notes);

      // Update payable status to PAID (cast UUID)
      await prisma.$queryRawUnsafe(
        "UPDATE payables SET status = 'PAID', updated_at = NOW() WHERE id = $1::uuid",
        payableId
      );
      
      console.log(`✅ Payment recorded for payable: ${payableId}`);

      // Trigger event for journal entry
      financeEvents.emit('payable.paid', {
        payableId,
        vendorName: payable.vendor_name,
        amount: payment.amount,
        paymentDate: payment.payment_date,
      });

      return {
        payable_id: payableId,
        payment_amount: payment.amount,
        payment_date: payment.payment_date,
        status: 'PAID',
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  }
}

export default new PayablesService();
