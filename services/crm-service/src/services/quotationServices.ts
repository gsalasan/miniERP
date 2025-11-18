import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  customer: {
    id: string;
    name: string;
    address: string;
    city: string;
    district?: string;
    picName?: string;
    picEmail?: string;
    picPhone?: string;
  };
  opportunity: {
    id: string;
    projectName: string;
    description: string;
    status: string;
  };
  salesPerson: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    id: string;
    itemName: string;
    description?: string;
    itemType: string;
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

class QuotationServices {
  /**
   * Get quotation data for a specific opportunity/project
   * Combines data from project, customer, estimation, and items
   */
  async getQuotationData(opportunityId: string): Promise<QuotationData> {
    // Get project with customer and estimation
    const projectResult = await prisma.projects.findUnique({
      where: { id: opportunityId },
      include: {
        customer: {
          include: {
            customer_contacts: {
              take: 1,
            },
          },
        },
        estimations: {
          // TEMPORARILY allow any status for testing (change back to APPROVED in production)
          // where: { status: 'APPROVED' },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            estimation_items: true,
          },
        },
      },
    });

    if (!projectResult) {
      throw new Error('Project not found');
    }

    // Type assertion for included relations
    const project = projectResult as typeof projectResult & {
      customer: typeof projectResult.customer & {
        customer_contacts: Array<{
          id: string;
          name: string;
          email: string;
          phone: string;
        }>;
      };
      estimations: Array<{
        id: string;
        version: number;
        status: string;
        estimation_items: Array<{
          id: string;
          item_id: string;
          item_type: string;
          quantity: number | { toString: () => string };
          sell_price_at_estimation: number | { toString: () => string };
        }>;
      }>;
    };

    if (!project.estimations || project.estimations.length === 0) {
      throw new Error(
        'No estimation found for this project. Please create an estimation first.'
      );
    }

    const estimation = project.estimations[0];
    const primaryContact = project.customer.customer_contacts?.[0];

    // Get sales person details
    const salesUser = await prisma.users.findUnique({
      where: { id: project.sales_user_id },
      include: {
        employee: true,
      },
    });

    if (!salesUser) {
      throw new Error('Sales person not found');
    }

    // Generate quotation number
    const quotationNumber = await this.generateQuotationNumber(project.id);

    // Get estimation items with details
    const items = await Promise.all(
      estimation.estimation_items.map(async item => {
        let itemDetails: {
          name: string;
          description?: string;
          unit: string;
        } = {
          name: 'Unknown Item',
          description: undefined,
          unit: 'pcs',
        };

        // Fetch item details based on type
        if (item.item_type === 'MATERIAL') {
          const material = await prisma.material.findUnique({
            where: { id: item.item_id },
          });
          if (material) {
            itemDetails = {
              name: material.item_name,
              description: [material.brand, material.owner_pn]
                .filter(Boolean)
                .join(' - '),
              unit: material.satuan || 'pcs',
            };
          }
        } else if (item.item_type === 'SERVICE') {
          const service = await prisma.service.findUnique({
            where: { id: item.item_id },
          });
          if (service) {
            itemDetails = {
              name: service.service_name,
              description: service.service_code,
              unit: service.unit || 'Jam',
            };
          }
        }

        return {
          id: item.id,
          itemName: itemDetails.name,
          description: itemDetails.description,
          itemType: item.item_type,
          quantity: Number(item.quantity),
          unit: itemDetails.unit,
          unitPrice: Number(item.sell_price_at_estimation),
          totalPrice:
            Number(item.quantity) * Number(item.sell_price_at_estimation),
        };
      })
    );

    // Calculate pricing
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountPercentage = 0; // TODO: Add discount field to estimation if needed
    const discountAmount = (subtotal * discountPercentage) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxPercentage = 11; // PPN 11%
    const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100;
    const grandTotal = subtotalAfterDiscount + taxAmount;

    // Format dates
    const quotationDate = new Date().toISOString().split('T')[0];
    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]; // Valid for 30 days

    return {
      quotationNumber,
      quotationDate,
      validUntil,
      customer: {
        id: project.customer.id,
        name: project.customer.customer_name,
        address: project.customer.alamat || '',
        city: project.customer.city || '',
        district: project.customer.district || undefined,
        picName: primaryContact?.name || undefined,
        picEmail: primaryContact?.email || undefined,
        picPhone: primaryContact?.phone || undefined,
      },
      opportunity: {
        id: project.id,
        projectName: project.project_name,
        description: project.description || '',
        status: project.status,
      },
      salesPerson: {
        id: salesUser.id,
        name: salesUser.employee?.full_name || salesUser.email,
        email: salesUser.email,
        phone: salesUser.employee?.phone || undefined,
      },
      items,
      pricing: {
        subtotal,
        discountPercentage,
        discountAmount,
        subtotalAfterDiscount,
        taxPercentage,
        taxAmount,
        grandTotal,
        currency: 'IDR',
      },
      terms: {
        paymentTerms: 'Net 30 days',
        deliveryTerms: 'FOB Destination',
        warranty: '1 Year Warranty',
        notes: project.notes || undefined,
      },
    };
  }

  /**
   * Generate unique quotation number
   * Format: QT-YYYYMM-XXXXX
   */
  private async generateQuotationNumber(projectId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `QT-${year}${month}`;

    // Use project_number if available, otherwise generate random
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { project_number: true },
    });

    if (project?.project_number) {
      // Convert PRJ-XXXXXX to QT-XXXXXX
      const suffix = project.project_number.replace('PRJ-', '');
      return `${prefix}-${suffix}`;
    }

    // Fallback: random number
    const random = Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, '0');
    return `${prefix}-${random}`;
  }
}

export default new QuotationServices();
