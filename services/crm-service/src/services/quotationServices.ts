import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuotationData {
  quotationNumber: string;
  quotationDate: string;
  validUntil: string;
  quotationUrl?: string; // PDF URL for download
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
    const projectResult = await prisma.project.findUnique({
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
            items: true,
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
        items: Array<{
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
      estimation.items.map(async item => {
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

  /*
   * Generate quotation with discount
   */
  async generateQuotationWithDiscount(
    estimationId: string,
    discountPercentage: number,
    userId?: string
  ): Promise<QuotationData> {
    // Get estimation first
    const estimation = await prisma.estimations.findUnique({
      where: { id: estimationId },
      include: {
        items: true,
        project: {
          include: {
            customer: {
              include: {
                customer_contacts: {
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!estimation) {
      throw new Error('Estimation not found');
    }

    // Get project with customer
    const projectResult = await prisma.project.findUnique({
      where: { id: estimation.project_id },
      include: {
        customer: {
          include: {
            customer_contacts: {
              take: 1,
            },
          },
        },
        estimations: {
          where: {
            status: {
              in: ['APPROVED', 'DISCOUNT_APPROVED'],
            },
          },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            items: true,
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
    };

    // Validate estimation status (use the estimation from first query)
    if (estimation.status === 'DISCOUNT_APPROVED') {
      // Use approved discount
      discountPercentage = Number(estimation.approved_discount || 0);
    } else if (estimation.status === 'APPROVED') {
      // Validate discount is within user's authority
      // Get user role to check appropriate discount policy
      let userRole = 'SALES'; // Default
      if (userId) {
        const user = await prisma.users.findUnique({
          where: { id: userId },
        });
        // user.roles is an array, get the first role
        userRole = (user?.roles?.[0] as string) || 'SALES';
        console.log('[generateQuotationWithDiscount] User found:', {
          userId,
          userRoles: user?.roles,
          userRole,
          userEmail: user?.email,
        });
      } else {
        console.warn('[generateQuotationWithDiscount] No userId provided, using default role SALES');
      }

      const discountPolicy = await prisma.discount_policies.findUnique({
        where: { role: userRole },
      });

      console.log('[generateQuotationWithDiscount] Discount validation:', {
        userRole,
        discountPercentage,
        authorityLimit: discountPolicy?.authority_limit,
        maxDiscountLimit: discountPolicy?.max_discount_limit,
      });

      if (discountPolicy && discountPercentage > Number(discountPolicy.authority_limit || discountPolicy.max_discount_limit)) {
        throw new Error(
          `Discount ${discountPercentage}% exceeds your authority limit. Please request approval.`
        );
      }
    } else {
      throw new Error('Estimation is not approved for quotation generation');
    }

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
      estimation.items.map(async item => {
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

    // Calculate pricing with discount
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
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

    // TODO: Generate actual PDF here using pdfkit or puppeteer
    // For now, create a quotation record in database
    const quotationData = {
      quotation_number: quotationNumber,
      project_id: estimation.project_id,
      estimation_id: estimation.id,
      customer_id: project.customer.id,
      quotation_date: new Date(quotationDate),
      valid_until: new Date(validUntil),
      subtotal: subtotal,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      tax_percentage: taxPercentage,
      tax_amount: taxAmount,
      grand_total: grandTotal,
      status: 'SENT',
      created_by: project.sales_user_id,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Save quotation to database (if table exists)
    // TODO: Uncomment when quotations table is created
    // const savedQuotation = await prisma.quotations.create({ data: quotationData });

    // Update project status to "Proposal Delivered"
    await prisma.project.update({
      where: { id: estimation.project_id },
      data: {
        status: 'PROPOSAL_DELIVERED',
        updated_at: new Date(),
      },
    });

    // Generate PDF URL (mock for now, TODO: implement actual PDF generation)
    const pdfUrl = `/api/v1/quotations/${quotationNumber}/pdf`;

    return {
      quotationNumber,
      quotationDate,
      validUntil,
      quotationUrl: pdfUrl, // PDF URL for download
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
        status: 'PROPOSAL_DELIVERED',
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
    const project = await prisma.project.findUnique({
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

  /**
   * Get all quotations for a specific project
   * TODO: Uncomment when quotations table is created
   */
  async getQuotationsByProject(_projectId: string) {
    // const quotations = await prisma.quotations.findMany({
    //   where: { project_id: projectId },
    //   orderBy: { created_at: 'desc' },
    //   select: {
    //     id: true,
    //     quotation_number: true,
    //     discount_percentage: true,
    //     total_amount: true,
    //     created_at: true,
    //     valid_until: true,
    //   },
    // });

    // return quotations;
    return []; // Return empty array until quotations table is created
  }
}

export default new QuotationServices();


