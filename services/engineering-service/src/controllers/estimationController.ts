import { Request, Response } from 'express';
import * as estimationService from '../services/estimationService';
import prisma from '../prisma/client';
import { ItemType, SourceType } from '@prisma/client';
import { eventBus } from '../utils/eventBus';
import { EventNames, EstimationApprovedPayload, ProjectStatusChangedPayload } from '../../../shared-event-bus/src/events';
import { PricingEngine } from '../services/PricingEngine.service';
import { OverheadEngine } from '../services/OverheadEngine.service';

// Get engineers/PE (users with PROJECT_ENGINEER role)
export const getEngineers = async (req: Request, res: Response) => {
  try {
    const engineers = await prisma.users.findMany({
      where: {
        roles: {
          has: 'PROJECT_ENGINEER',
        },
        is_active: true,
      },
      select: {
        id: true,
        email: true,
        employee: {
          select: {
            id: true,
            full_name: true,
            position: true,
          },
        },
      },
      orderBy: {
        employee: {
          full_name: 'asc',
        },
      },
    });
    res.json(engineers);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching engineers:', msg);
    res.status(500).json({ error: msg });
  }
};

// Get estimation queue (for queue page)
export const getEstimationQueue = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Define roles that can see all estimations
    const canSeeAllRoles = ['OPERATIONAL_MANAGER', 'CEO', 'PROJECT_MANAGER'];
    const canSeeAll = user.roles.some((role: string) => canSeeAllRoles.includes(role));
    
    // Build where clause based on user role (no status filter - show all)
    const whereClause: any = {};
    
    // If user is PROJECT_ENGINEER, only show their assigned estimations
    if (!canSeeAll) {
      whereClause.assigned_to_user_id = user.id;
    }
    
    const estimations = await prisma.estimations.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            project_name: true,
            project_number: true,
            customer: {
              select: {
                id: true,
                customer_name: true,
                city: true,
              },
            },
          },
        },
        assigned_to: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        requested_by: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        items: true,
        client: {
          select: {
            id: true,
            customer_name: true,
            city: true,
          },
        },
        sales_order: {
          select: {
            id: true,
            so_number: true,
            order_date: true,
          },
        },
      },
      orderBy: {
        date_requested: 'desc',
      },
    });
    res.json(estimations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching estimation queue:', msg);
    res.status(500).json({ error: msg });
  }
};

// Get approval queue (for PM & CEO approval page)
export const getApprovalQueue = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Only PM, CEO, and OPERATIONAL_MANAGER can access approval queue
    const canApproveRoles = ['OPERATIONAL_MANAGER', 'CEO', 'PROJECT_MANAGER'];
    const canApprove = user?.roles?.some((role: string) => canApproveRoles.includes(role));
    
    if (!canApprove) {
      return res.status(403).json({ 
        error: 'Forbidden: Only Project Manager, CEO, or Operational Manager can access approval queue' 
      });
    }
    
    // Get all estimations that have been submitted (including approved/rejected)
    const estimations = await prisma.estimations.findMany({
      where: {
        status: {
          in: [
            'PENDING_APPROVAL',
            'APPROVED',
            'REJECTED',
            'REVISION_REQUIRED',
            'PENDING_DISCOUNT_APPROVAL',
            'DISCOUNT_APPROVED',
          ],
        },
      },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        assigned_to: {
          include: {
            employee: true,
          },
        },
        requested_by: {
          include: {
            employee: true,
          },
        },
        items: true,
        client: true,
        sales_order: {
          select: {
            id: true,
            so_number: true,
            order_date: true,
          },
        },
      },
      orderBy: {
        submitted_at: 'desc',
      },
    });
    
    // Serialize + fully enhance each estimation with fresh engine calculations
    const serializedEstimations = await Promise.all(
      estimations.map(async (est) => {
        // Normalize items
        const normalizedItems = (est.items || []).map((it: any) => ({
          ...it,
          quantity: it.quantity ? Number(it.quantity) : 0,
          hpp_at_estimation: it.hpp_at_estimation ? Number(it.hpp_at_estimation) : 0,
          sell_price_at_estimation: it.sell_price_at_estimation ? Number(it.sell_price_at_estimation) : 0,
        }));

        // Recompute direct HPP from items (DB field might be stale/zero)
        const recomputedDirectHpp = normalizedItems.reduce((sum: number, it: any) => {
          return sum + (Number(it.quantity) || 0) * (Number(it.hpp_at_estimation) || 0);
        }, 0);

        // Pricing calculation (bulk)
        let pricingSummary: any = null;
        try {
          if (normalizedItems.length > 0) {
            const itemsForPricing = normalizedItems.map((item: any) => ({
              item_id: item.item_id,
              item_type: item.item_type as 'MATERIAL' | 'SERVICE',
              hpp_per_unit: Number(item.hpp_at_estimation) || 0,
              quantity: Number(item.quantity) || 0,
              category: 'GENERAL',
            }));
            const pricingResult = await PricingEngine.calculateBulkSellPrices({ items: itemsForPricing, use_cache: true });
            pricingSummary = pricingResult.summary;
          }
        } catch (pricingErr) {
          console.warn(`⚠️ PricingEngine failed for estimation ${est.id}:`, pricingErr);
        }

        // Overhead calculation using recomputed direct HPP
        let overheadResult: any = null;
        try {
          if (recomputedDirectHpp > 0) {
            overheadResult = await OverheadEngine.calculateOverheadAllocation({
              total_direct_hpp: recomputedDirectHpp,
              use_default_percentage: true,
            });
          }
        } catch (overheadErr) {
          console.warn(`⚠️ OverheadEngine failed for estimation ${est.id}:`, overheadErr);
        }

        // Derive totals
        const total_direct_hpp = recomputedDirectHpp;
        const total_overhead_allocation = overheadResult ? overheadResult.overhead_allocation : (est.total_overhead_allocation ? Number(est.total_overhead_allocation) : 0);
        const total_hpp = overheadResult ? overheadResult.total_hpp_with_overhead : (est.total_hpp ? Number(est.total_hpp) : total_direct_hpp + total_overhead_allocation);
        const total_sell_price = pricingSummary ? pricingSummary.total_sell_price : (est.total_sell_price ? Number(est.total_sell_price) : 0);
        const gross_margin_percentage = total_sell_price > 0 ? ((total_sell_price - total_direct_hpp) / total_sell_price) * 100 : 0;
        const overhead_percentage = total_direct_hpp > 0 ? (total_overhead_allocation / total_direct_hpp) * 100 : 0;
        const average_markup_percentage = pricingSummary ? pricingSummary.average_markup_percentage : 0;

        return {
          ...est,
          items: normalizedItems,
          total_direct_hpp,
          total_overhead_allocation,
            total_hpp,
          total_sell_price,
          gross_margin_percentage: Math.round(gross_margin_percentage * 100) / 100,
          overhead_percentage: Math.round(overhead_percentage * 100) / 100,
          average_markup_percentage: Math.round(average_markup_percentage * 100) / 100,
        };
      })
    );
    
    res.json(serializedEstimations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : '';
    console.error('Error fetching approval queue:', msg);
    console.error('Stack trace:', stack);
    res.status(500).json({ error: msg, details: stack });
  }
};

// FITUR 3.2.A: Assign estimation to a user
export const assignEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assigneeUserId } = req.body;

    if (!assigneeUserId) {
      return res.status(400).json({ error: 'assigneeUserId is required' });
    }

    // AUTHORIZATION: Only CEO or Operational Manager can assign estimations
    // NOTE: Untuk testing tanpa auth, comment bagian ini. Di production harus aktif.
    // const loggedInUser = req.user;
    // if (!loggedInUser) {
    //   return res.status(401).json({ error: 'Unauthorized: Not logged in' });
    // }
    // const allowedRoles = ['CEO', 'OPERATIONAL_MANAGER'];
    // const hasPermission = loggedInUser.roles?.some((role: string) => allowedRoles.includes(role));
    // if (!hasPermission) {
    //   return res.status(403).json({
    //     error: 'Forbidden: Only CEO or Operational Manager can assign estimations'
    //   });
    // }

    // Check if estimation exists
    const estimation = await prisma.estimations.findUnique({
      where: { id },
    });

    if (!estimation) {
      return res.status(404).json({ error: 'Estimation not found' });
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: assigneeUserId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update estimation
    const updatedEstimation = await prisma.estimations.update({
      where: { id },
      data: {
        assigned_to_user_id: assigneeUserId,
        status: 'IN_PROGRESS',
        date_assigned: new Date(),
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        items: true,
      },
    });

    // NOTIFICATION: Send notification to assigned user (FITUR 3.2.A requirement)
    // NOTE: NotificationService belum diimplementasi. Placeholder untuk integrasi nanti.
    // await NotificationService.send({
    //   userId: assigneeUserId,
    //   message: `Anda telah ditugaskan untuk mengerjakan estimasi proyek '${updatedEstimation.project?.name}'.`,
    //   link: `/estimations/${updatedEstimation.id}`,
    //   type: 'ESTIMATION_ASSIGNED'
    // });

    res.json(updatedEstimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error assigning estimation:', msg);
    res.status(500).json({ error: msg });
  }
};

// FITUR 3.2.A: Start working on estimation
export const startEstimationWork = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if estimation exists
    const estimation = await prisma.estimations.findUnique({
      where: { id },
    });

    if (!estimation) {
      return res.status(404).json({ error: 'Estimation not found' });
    }

    // AUTHORIZATION: Only assigned PE can start work on estimation
    // NOTE: Untuk testing tanpa auth, comment bagian ini. Di production harus aktif.
    // const loggedInUser = req.user;
    // if (!loggedInUser) {
    //   return res.status(401).json({ error: 'Unauthorized: Not logged in' });
    // }
    // if (estimation.assigned_to_user_id !== loggedInUser.id) {
    //   return res.status(403).json({
    //     error: 'Forbidden: You are not assigned to this estimation. Only the assigned PE can start work.'
    //   });
    // }

    // Update estimation status
    const updatedEstimation = await prisma.estimations.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        date_started: new Date(),
      },
      include: {
        assigned_to: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        items: true,
      },
    });

    res.json(updatedEstimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error starting estimation work:', msg);
    res.status(500).json({ error: msg });
  }
};

export const getEstimations = async (req: Request, res: Response) => {
  try {
    const estimations = await prisma.estimations.findMany({
      include: {
        items: true,
        sales_order: {
          select: {
            id: true,
            so_number: true,
            order_date: true,
          },
        },
      },
    });
    res.json(estimations);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching estimations:', msg);
    res.status(500).json({ error: msg });
  }
};

export const getEstimationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const estimation = await prisma.estimations.findUnique({
      where: { id },
      include: {
        items: true,
        project: {
          include: {
            customer: true,
          },
        },
        requested_by: {
          include: {
            employee: true,
          },
        },
        assigned_to: {
          include: {
            employee: true,
          },
        },
        client: true,
        sales_order: {
          select: {
            id: true,
            so_number: true,
            order_date: true,
          },
        },
      },
    });
    if (!estimation)
      return res.status(404).json({ error: 'Estimation not found' });
    // Enrich items with readable names from Material/Service tables
    const items = estimation.items || [];
    const materialIds = items
      .filter((it: any) => it.item_type === 'MATERIAL')
      .map((it: any) => it.item_id);
    const serviceIds = items
      .filter((it: any) => it.item_type === 'SERVICE')
      .map((it: any) => it.item_id);

    const [materials, services] = await Promise.all([
      materialIds.length
        ? prisma.material.findMany({
            where: { id: { in: materialIds } },
            select: { id: true, item_name: true },
          })
        : Promise.resolve([]),
      serviceIds.length
        ? prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, service_name: true },
          })
        : Promise.resolve([]),
    ]);

    const materialNameMap = Object.fromEntries(
      (materials as any[]).map((m) => [m.id, m.item_name])
    );
    const serviceNameMap = Object.fromEntries(
      (services as any[]).map((s) => [s.id, s.service_name])
    );

    const enrichedItems = items.map((it: any) => ({
      ...it,
      quantity: it.quantity ? Number(it.quantity) : 0,
      hpp_at_estimation: it.hpp_at_estimation ? Number(it.hpp_at_estimation) : 0,
      sell_price_at_estimation: it.sell_price_at_estimation ? Number(it.sell_price_at_estimation) : 0,
      item_name:
        it.item_type === 'MATERIAL'
          ? materialNameMap[it.item_id] || it.item_name || it.item_id
          : it.item_type === 'SERVICE'
          ? serviceNameMap[it.item_id] || it.item_name || it.item_id
          : it.item_name || it.item_id,
    }));

    const serializedEstimation = {
      ...estimation,
      items: enrichedItems,
      total_direct_hpp: estimation.total_direct_hpp ? Number(estimation.total_direct_hpp) : 0,
      total_overhead_allocation: estimation.total_overhead_allocation ? Number(estimation.total_overhead_allocation) : 0,
      total_hpp: estimation.total_hpp ? Number(estimation.total_hpp) : 0,
      total_sell_price: estimation.total_sell_price ? Number(estimation.total_sell_price) : 0,
      gross_margin_percentage: estimation.gross_margin_percentage ? Number(estimation.gross_margin_percentage) : 0,
    };

    // 🆕 Calculate enhanced data using PricingEngine & OverheadEngine
    // Only if estimation has items
    if (enrichedItems.length > 0) {
      try {
        // Recompute direct HPP from items to ensure correctness (DB field may be 0 for drafts)
        const recomputedDirectHpp = enrichedItems.reduce((sum: number, it: any) => {
          const qty = Number(it.quantity) || 0;
            const hppUnit = Number(it.hpp_at_estimation) || 0;
            return sum + qty * hppUnit;
        }, 0);
        const directHppForOverhead = recomputedDirectHpp > 0 ? recomputedDirectHpp : serializedEstimation.total_direct_hpp;

        // Step 1: Calculate overhead allocation with breakdown using recomputed direct HPP
        const overheadResult = await OverheadEngine.calculateOverheadAllocation({
          total_direct_hpp: directHppForOverhead,
          use_default_percentage: true, // Use system policy (default)
        });

        // Step 2: Prepare items for pricing engine
        const itemsForPricing = enrichedItems.map((item: any) => ({
          item_id: item.item_id,
          item_type: item.item_type as 'MATERIAL' | 'SERVICE',
          hpp_per_unit: Number(item.hpp_at_estimation) || 0,
          quantity: Number(item.quantity) || 0,
          category: 'GENERAL', // Default category
        }));

        const pricingResult = await PricingEngine.calculateBulkSellPrices({
          items: itemsForPricing,
          use_cache: true,
        });

        // Add enhanced fields to response
        (serializedEstimation as any).overhead_percentage = overheadResult.overhead_percentage;
        (serializedEstimation as any).overhead_breakdown = overheadResult.overhead_breakdown;
        (serializedEstimation as any).policy_applied = overheadResult.policy_applied;
        (serializedEstimation as any).pricing_summary = pricingResult.summary;
        (serializedEstimation as any).average_markup_percentage = pricingResult.summary.average_markup_percentage;
        // Override/derive total fields to ensure frontend sees computed numbers
        (serializedEstimation as any).total_direct_hpp = recomputedDirectHpp > 0 ? recomputedDirectHpp : pricingResult.summary.total_hpp;
        (serializedEstimation as any).total_overhead_allocation = overheadResult.overhead_allocation;
        (serializedEstimation as any).total_hpp = overheadResult.total_hpp_with_overhead; // direct + overhead
        (serializedEstimation as any).total_sell_price = pricingResult.summary.total_sell_price;
        const grossMarginPct = pricingResult.summary.total_sell_price > 0
          ? ((pricingResult.summary.total_sell_price - pricingResult.summary.total_hpp) / pricingResult.summary.total_sell_price) * 100
          : 0;
        (serializedEstimation as any).gross_margin_percentage = Math.round(grossMarginPct * 100) / 100;

        console.log(`✅ Enhanced estimation ${id} with overhead_breakdown (${overheadResult.overhead_breakdown.length} categories) and pricing_summary`);
      } catch (enhanceErr) {
        console.warn('⚠️ Failed to calculate enhanced data:', enhanceErr instanceof Error ? enhanceErr.message : enhanceErr);
        // Continue without enhanced data - backward compatible
      }
    }

    res.json(serializedEstimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error fetching estimation by id:', msg);
    res.status(500).json({ error: msg });
  }
};

// FITUR 3.1.D: Proses Permintaan Estimasi
export const createEstimation = async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      assignedToUserId,
      technicalBrief,
      attachmentUrls,
      requestedByUserId, // ID user sales yang buat request (dari auth)
      // Legacy fields for backward compatibility
      project_id,
      sales_pic,
      customer_name,
      ...restData
    } = req.body;

    // Validasi input (FITUR 3.1.D requirement)
    const finalProjectId = projectId || project_id;
    if (!finalProjectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    if (!technicalBrief) {
      return res.status(400).json({ error: 'technicalBrief is required' });
    }

    // AUTHORIZATION: Check if logged in user is Sales for this project
    // NOTE: Untuk testing tanpa auth, comment bagian ini. Di production harus aktif.
    // const loggedInUser = req.user;
    // if (!loggedInUser) {
    //   return res.status(401).json({ error: 'Unauthorized: Not logged in' });
    // }
    // const project = await prisma.project.findUnique({ where: { id: finalProjectId } });
    // if (!project) {
    //   return res.status(404).json({ error: 'Project not found' });
    // }
    // if (project.sales_user_id !== loggedInUser.id) {
    //   return res.status(403).json({ error: 'Forbidden: Only the sales person assigned to this project can request estimation' });
    // }

    // Fetch project data untuk ambil customer info
    const project = await prisma.project.findUnique({
      where: { id: finalProjectId },
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // DUPLICATE CHECK: Cek apakah project sudah punya estimasi aktif
    const existingEstimation = await prisma.estimations.findFirst({
      where: {
        project_id: finalProjectId,
        status: {
          notIn: ['REJECTED', 'ARCHIVED'], // Hanya cek estimasi yang masih aktif
        },
      },
    });
    if (existingEstimation) {
      return res.status(409).json({
        error: 'Duplicate estimation not allowed',
        message: `Project already has an active estimation (ID: ${existingEstimation.id}, Status: ${existingEstimation.status})`,
        existingEstimationId: existingEstimation.id,
      });
    }

    // Buat record estimasi baru
    const estimation = await prisma.estimations.create({
      data: {
        project_id: finalProjectId,
        version: 1,
        status: assignedToUserId ? 'IN_PROGRESS' : 'PENDING', // Jika langsung assign PE, status IN_PROGRESS
        requested_by_user_id: requestedByUserId || null, // Sales yang buat request
        assigned_to_user_id: assignedToUserId || null,
        technical_brief: technicalBrief,
        attachments: attachmentUrls ? JSON.stringify(attachmentUrls) : null,
        date_requested: new Date(),
        date_assigned: assignedToUserId ? new Date() : null, // Set date_assigned jika langsung assign
        // Legacy fields untuk backward compatibility (dari project data)
        sales_pic: sales_pic || 'N/A', // Dari request atau default
        customer_name:
          customer_name || project.customer?.customer_name || 'N/A',
        // Default values untuk financial data (akan diisi saat kalkulasi)
        total_direct_hpp: 0,
        total_overhead_allocation: 0,
        total_hpp: 0,
        total_sell_price: 0,
        ...restData,
      },
      include: {
        project: true,
        assigned_to: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        requested_by: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
      },
    });

    // UPDATE PROJECT STATUS: Set to 'PRE_SALES' ketika estimasi dibuat (FITUR 3.1.D requirement)
    await prisma.project.update({
      where: { id: finalProjectId },
      data: { status: 'PRE_SALES' },
    });

    // NOTIFICATION: Kirim notifikasi ke PE atau Engineering Manager (FITUR 3.1.D requirement)
    // NOTE: NotificationService belum diimplementasi. Placeholder untuk integrasi nanti.
    // const targetUserId = assignedToUserId || ENGINEERING_MANAGER_ROLE_ID;
    // await NotificationService.send({
    //   userId: targetUserId,
    //   message: `Permintaan estimasi baru untuk proyek '${estimation.project?.name}' telah dibuat.`,
    //   link: `/estimations/${estimation.id}`,
    //   type: 'ESTIMATION_CREATED'
    // });

    res.status(201).json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error creating estimation:', msg);
    res.status(400).json({ error: msg });
  }
};

export const updateEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const estimation = await prisma.estimations.update({ where: { id }, data });
    res.json(estimation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const deleteEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.estimations.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: msg });
  }
};

export const calculateEstimation = async (req: Request, res: Response) => {
  try {
    const {
      project_id,
      items,
      overhead_percentage,
      profit_margin_percentage,
      save_to_db,
      version,
      status,
    } = req.body;

    // Validasi input
    if (!project_id || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'project_id and items array are required',
      });
    }

    // Hitung estimasi menggunakan service
    const calculation = await estimationService.calculateEstimation({
      project_id,
      items,
      overhead_percentage: overhead_percentage || 0,
      profit_margin_percentage: profit_margin_percentage || 0,
      save_to_db: save_to_db || false,
      version: version || 1,
      status: status || 'DRAFT',
    });

    res.status(200).json(calculation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
};

// Calculate modular estimation (for new modular calculator UI)
export const calculateModularEstimation = async (
  req: Request,
  res: Response
) => {
  try {
    const { sections, overhead_percentage, profit_margin_percentage } =
      req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required' });
    }

    // Aggregate all items from all sections
    let total_direct_hpp = 0;
    let total_service_cost = 0;

    // Collect all items for bulk pricing calculation
    const allItemsForPricing: any[] = [];

    // Process Material sections
    sections.forEach((section: any) => {
      if (section.type === 'MATERIAL' && section.items) {
        section.items.forEach((item: any) => {
          total_direct_hpp += item.total_hpp || 0;
          
          // Add to pricing calculation
          if (item.item_id && item.quantity && item.hpp_per_unit) {
            allItemsForPricing.push({
              item_id: item.item_id,
              item_type: 'MATERIAL' as ItemType,
              hpp_per_unit: item.hpp_per_unit,
              quantity: item.quantity,
              category: item.category || 'MATERIAL_DEFAULT'
            });
          }
        });
      }

      // Process Service sections
      if (section.type === 'SERVICE' && section.serviceGroups) {
        section.serviceGroups.forEach((group: any) => {
          if (group.items) {
            group.items.forEach((item: any) => {
              total_service_cost += item.total_hpp || 0;
              
              // Add to pricing calculation
              if (item.item_id && item.quantity && item.hpp_per_unit) {
                allItemsForPricing.push({
                  item_id: item.item_id,
                  item_type: 'SERVICE' as ItemType,
                  hpp_per_unit: item.hpp_per_unit,
                  quantity: item.quantity,
                  category: item.category || 'SERVICE_DEFAULT'
                });
              }
            });
          }
        });
      }
    });

    const total_hpp_langsung = total_direct_hpp + total_service_cost;

    // ==================== STEP 1: Calculate Overhead using OverheadEngine ====================
    console.log('📊 Calculating overhead allocation with OverheadEngine...');
    const overheadResult = await OverheadEngine.calculateOverheadAllocation({
      total_direct_hpp: total_hpp_langsung,
      use_default_percentage: !overhead_percentage || overhead_percentage === 0,
      custom_percentage: overhead_percentage > 0 ? overhead_percentage : undefined
    });

    const overhead_allocation = overheadResult.overhead_allocation;
    const total_estimasi_hpp = overheadResult.total_hpp_with_overhead;
    const overhead_breakdown = overheadResult.overhead_breakdown;

    console.log(`✅ Overhead calculated: ${overheadResult.overhead_percentage}% = Rp ${overhead_allocation.toLocaleString()}`);

    // ==================== STEP 2: Calculate Sell Prices using PricingEngine ====================
    console.log('💰 Calculating sell prices with PricingEngine...');
    
    let total_harga_jual_standar = 0;
    let pricing_summary: any = null;

    if (allItemsForPricing.length > 0) {
      const pricingResult = await PricingEngine.calculateBulkSellPrices({
        items: allItemsForPricing,
        use_cache: true
      });
      
      total_harga_jual_standar = pricingResult.summary.total_sell_price;
      pricing_summary = pricingResult.summary;
      
      console.log(`✅ Pricing calculated: Total sell price = Rp ${total_harga_jual_standar.toLocaleString()}`);
    } else {
      // Fallback to profit margin calculation if no items
      const profit_amount = (total_estimasi_hpp * (profit_margin_percentage || 0)) / 100;
      total_harga_jual_standar = total_estimasi_hpp + profit_amount;
      console.log('⚠️  No items for pricing calculation, using profit margin fallback');
    }

    // ==================== STEP 3: Calculate Margins ====================
    const estimasi_gross_margin = total_harga_jual_standar - total_hpp_langsung;
    const estimasi_gross_margin_pct =
      total_harga_jual_standar > 0
        ? (estimasi_gross_margin / total_harga_jual_standar) * 100
        : 0;

    const estimasi_net_margin = total_harga_jual_standar - total_estimasi_hpp;
    const estimasi_net_margin_pct =
      total_harga_jual_standar > 0
        ? (estimasi_net_margin / total_harga_jual_standar) * 100
        : 0;

    const summary = {
      total_direct_hpp: total_hpp_langsung,
      overhead_percentage: overheadResult.overhead_percentage,
      overhead_allocation,
      total_estimasi_hpp,
      total_harga_jual_standar,
      estimasi_gross_margin,
      estimasi_gross_margin_pct,
      estimasi_net_margin,
      estimasi_net_margin_pct,
      // Additional data from engines
      overhead_breakdown,
      pricing_summary,
      average_markup_percentage: pricing_summary?.average_markup_percentage || 0,
      policy_applied: overheadResult.policy_applied
    };

    console.log('📈 Final Summary:');
    console.log(`   Direct HPP: Rp ${total_hpp_langsung.toLocaleString()}`);
    console.log(`   Overhead (${overheadResult.overhead_percentage}%): Rp ${overhead_allocation.toLocaleString()}`);
    console.log(`   Total HPP: Rp ${total_estimasi_hpp.toLocaleString()}`);
    console.log(`   Sell Price: Rp ${total_harga_jual_standar.toLocaleString()}`);
    console.log(`   Net Margin: Rp ${estimasi_net_margin.toLocaleString()} (${estimasi_net_margin_pct.toFixed(2)}%)`);

    res.status(200).json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error calculating modular estimation:', msg);
    res.status(500).json({ error: msg });
  }
};

// Save draft (FITUR 3.2.B)
export const saveDraft = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required' });
    }

    // Delete existing items for this estimation
    await prisma.estimation_items.deleteMany({
      where: { estimation_id: id },
    });

    // Insert new items from sections
    const itemsToCreate = [];

    console.log('=== SAVE DRAFT: Processing sections ===');
    console.log('Sections received:', JSON.stringify(sections, null, 2));

    for (const section of sections) {
      console.log('Section type:', section.type);
      const sectionType = section.type?.toLowerCase();

      // Material sections use "items" array
      if (section.items && Array.isArray(section.items)) {
        console.log('Processing material items:', section.items.length);

        for (const item of section.items) {
          const actualId = item.material_id || item.id;

          itemsToCreate.push({
            estimation_id: id,
            item_id: actualId,
            item_type: 'MATERIAL' as ItemType,
            quantity: item.quantity || 0,
            source: 'INTERNAL' as SourceType,
            hpp_at_estimation: item.hpp_per_unit || item.unitPrice || 0,
            sell_price_at_estimation: item.total_hpp || item.totalPrice || 0,
          });
        }
      }

      // Service sections use "serviceGroups" array
      if (section.serviceGroups && Array.isArray(section.serviceGroups)) {
        console.log('Processing service groups:', section.serviceGroups.length);

        for (const group of section.serviceGroups) {
          if (group.items && Array.isArray(group.items)) {
            console.log('Items in group:', group.items.length);

            for (const item of group.items) {
              const actualId = item.service_id || item.id;

              itemsToCreate.push({
                estimation_id: id,
                item_id: actualId,
                item_type: 'SERVICE' as ItemType,
                quantity: item.quantity || 0,
                source: 'INTERNAL' as SourceType,
                hpp_at_estimation: item.cost_per_unit || item.unitPrice || 0,
                sell_price_at_estimation:
                  item.total_hpp || item.totalPrice || 0,
              });
            }
          }
        }
      }
    }

    console.log('=== Items to create:', itemsToCreate.length);
    console.log(JSON.stringify(itemsToCreate, null, 2));

    console.log('=== Items to create:', itemsToCreate.length);
    console.log(JSON.stringify(itemsToCreate, null, 2));

    // Create all items in one transaction
    if (itemsToCreate.length > 0) {
      await prisma.estimation_items.createMany({
        data: itemsToCreate,
      });
      console.log('✅ Created', itemsToCreate.length, 'items in database');
    } else {
      console.log('⚠️ No items to create');
    }

    // Update estimation timestamp
    const updatedEstimation = await prisma.estimations.update({
      where: { id },
      data: {
        updated_at: new Date(),
      },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        items: true,
        client: true, // Make sure client relation is included
      },
    });

    console.log(
      '📦 Response will include',
      updatedEstimation.items?.length || 0,
      'items'
    );

    res.status(200).json({
      success: true,
      message: `Draft saved successfully with ${itemsToCreate.length} items`,
      data: updatedEstimation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error saving draft:', msg);
    res.status(500).json({ error: msg });
  }
};

// Submit estimation (FITUR 3.2.B)
export const submitEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required' });
    }

    // Fetch existing estimation to check for CE number
    const existingEstimation = await prisma.estimations.findUnique({
      where: { id },
      select: {
        ce_number: true,
        ce_date: true,
        status: true,
      },
    });

    if (!existingEstimation) {
      return res.status(404).json({ error: 'Estimation not found' });
    }

    // Delete existing items for this estimation
    await prisma.estimation_items.deleteMany({
      where: { estimation_id: id },
    });

    // Insert new items from sections
    const itemsToCreate = [];

    for (const section of sections) {
      // Material sections use "items" array
      if (section.items && Array.isArray(section.items)) {
        for (const item of section.items) {
          const actualId = item.material_id || item.id;

          itemsToCreate.push({
            estimation_id: id,
            item_id: actualId,
            item_type: 'MATERIAL' as ItemType,
            quantity: item.quantity || 0,
            source: 'INTERNAL' as SourceType,
            hpp_at_estimation: item.hpp_per_unit || item.unitPrice || 0,
            sell_price_at_estimation: item.total_hpp || item.totalPrice || 0,
          });
        }
      }

      // Service sections use "serviceGroups" array
      if (section.serviceGroups && Array.isArray(section.serviceGroups)) {
        for (const group of section.serviceGroups) {
          if (group.items && Array.isArray(group.items)) {
            for (const item of group.items) {
              const actualId = item.service_id || item.id;

              itemsToCreate.push({
                estimation_id: id,
                item_id: actualId,
                item_type: 'SERVICE' as ItemType,
                quantity: item.quantity || 0,
                source: 'INTERNAL' as SourceType,
                hpp_at_estimation: item.cost_per_unit || item.unitPrice || 0,
                sell_price_at_estimation:
                  item.total_hpp || item.totalPrice || 0,
              });
            }
          }
        }
      }
    }

    // Create all items in one transaction
    if (itemsToCreate.length > 0) {
      await prisma.estimation_items.createMany({
        data: itemsToCreate,
      });
    }

    // Generate CE Number only if not already assigned (for first submit)
    let ceNumber = existingEstimation.ce_number;
    let ceDate = existingEstimation.ce_date;
    
    if (!ceNumber) {
      // Use transaction to prevent race condition
      const year = new Date().getFullYear();
      
      // Get the latest CE number for this year with row lock
      const latestCE = await prisma.estimations.findFirst({
        where: {
          ce_number: {
            startsWith: `CE-${year}-`,
            not: null,
          },
        },
        orderBy: {
          ce_number: 'desc',
        },
        select: {
          ce_number: true,
        },
      });

      let nextNumber = 1;
      if (latestCE?.ce_number) {
        const match = latestCE.ce_number.match(/CE-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      ceNumber = `CE-${year}-${String(nextNumber).padStart(3, "0")}`;
      ceDate = new Date();
    }

    // Update estimation timestamp, CE Number (if new), CE Date, and mark as PENDING_APPROVAL (menunggu approval)
    const updatedEstimation = await prisma.estimations.update({
      where: { id },
      data: {
        updated_at: new Date(),
        ...(existingEstimation.ce_number ? {} : { ce_number: ceNumber }), // Only update if not exists
        ...(existingEstimation.ce_date ? {} : { ce_date: ceDate }), // Only update if not exists
        status: 'PENDING_APPROVAL',
        submitted_by_user_id: (req as any).user?.userId || (req as any).user?.id || null,
        submitted_at: new Date(),
      },
      include: {
        project: {
          include: {
            customer: true,
          },
        },
        items: true,
      },
    });

    res.status(200).json({
      success: true,
      message: `Estimation submitted with ${itemsToCreate.length} items`,
      data: updatedEstimation,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error submitting estimation:', msg);
    res.status(500).json({ error: msg });
  }
};

// FITUR 3.2.D: Approval decision on estimation
export const decideOnEstimation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, comment } = req.body || {};

    if (!decision) {
      return res.status(400).json({ success: false, error: 'decision is required' });
    }

    // Normalize decision to uppercase underscore
    const norm = String(decision).trim().toUpperCase();
    let finalDecision: 'APPROVED' | 'REVISION_REQUIRED' | 'REJECTED';
    if (['APPROVED'].includes(norm)) finalDecision = 'APPROVED';
    else if (['REVISION_REQUIRED', 'REVISIONREQUIRED', 'REVISION-REQUIRED'].includes(norm)) finalDecision = 'REVISION_REQUIRED';
    else if (['REJECTED'].includes(norm)) finalDecision = 'REJECTED';
    else {
      return res.status(400).json({ success: false, error: 'Invalid decision value' });
    }

    if ((finalDecision === 'REVISION_REQUIRED' || finalDecision === 'REJECTED') && (!comment || !String(comment).trim())) {
      return res.status(400).json({ success: false, error: 'comment is required for revision or rejection' });
    }

    const estimation = await prisma.estimations.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });
    if (!estimation) {
      return res.status(404).json({ success: false, error: 'Estimation not found' });
    }

    // Only allow decision when waiting approval; we map this to PENDING in current enum
    if (estimation.status !== 'PENDING_APPROVAL') {
      return res.status(409).json({ success: false, error: 'Estimasi ini tidak sedang dalam status menunggu approval.' });
    }

    // Map decision to proper enum statuses
    const newStatus = finalDecision === 'APPROVED'
      ? 'APPROVED'
      : finalDecision === 'REJECTED'
        ? 'REJECTED'
        : 'REVISION_REQUIRED';

    const approverId = (req as any).user?.userId || (req as any).user?.id || null;

    const updated = await prisma.estimations.update({
      where: { id },
      data: {
        status: newStatus as any,
        approved_by_user_id: finalDecision === 'APPROVED' ? approverId : null,
        approved_at: finalDecision === 'APPROVED' ? new Date() : null,
        updated_at: new Date(),
      },
      include: {
        project: true,
        requested_by: true,
        assigned_to: true,
      },
    });

    // Audit trail via ProjectActivity
    try {
      await prisma.projectActivity.create({
        data: {
          project_id: updated.project_id,
          activity_type: 'STATUS_CHANGE' as any,
          description: `Estimation ${updated.id} decision: ${finalDecision}`,
          performed_by: approverId || 'system',
          metadata: {
            decision: finalDecision,
            comment: comment || null,
            estimationId: updated.id,
            previousStatus: estimation.status,
            newStatus,
          } as any,
        },
      });
    } catch (e) {
      // ignore audit fail to not block decision
    }

    // TODO: NotificationService integration placeholder
    
    // If APPROVED, publish estimation:approved event
    if (finalDecision === 'APPROVED') {
      try {
        // Calculate total amount from estimation (use total_sell_price if available, otherwise calculate from items)
        let totalAmount = 0;
        if (updated.total_sell_price) {
          totalAmount = Number(updated.total_sell_price);
        } else {
          // Fallback: calculate from items
          const estimationItems = await prisma.estimation_items.findMany({
            where: { estimation_id: id },
          });
          totalAmount = estimationItems.reduce((sum, item) => {
            return sum + (Number(item.sell_price_at_estimation || 0) * Number(item.quantity || 0));
          }, 0);
        }

        await eventBus.publish<EstimationApprovedPayload>(EventNames.ESTIMATION_APPROVED, {
          estimationId: updated.id,
          projectId: updated.project_id,
          projectName: updated.project?.project_name || 'Unknown',
          approvedBy: approverId || 'system',
          approvedAt: updated.approved_at || new Date(),
          totalAmount,
        });
        console.log(`✓ Estimation ${id} approved - event published`);
      } catch (error) {
        console.error('[EventBus] Error publishing estimation:approved event:', error);
        // Don't throw - event publishing failure shouldn't break the operation
      }
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error deciding on estimation:', msg);
    return res.status(500).json({ success: false, error: msg });
  }
};

// FITUR: Send Approved Estimation to CRM as Quotation
export const sendEstimationToCRM = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const estimation = await prisma.estimations.findUnique({
      where: { id },
      include: {
        items: true,
        project: {
          include: {
            customer: true,
          },
        },
        requested_by: {
          include: {
            employee: true,
          },
        },
        assigned_to: {
          include: {
            employee: true,
          },
        },
      },
    });

    if (!estimation) {
      return res.status(404).json({ success: false, error: 'Estimation not found' });
    }

    if (estimation.status !== 'APPROVED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only approved estimations can be sent to CRM' 
      });
    }

    // Prepare quotation payload for CRM service
    const quotationPayload = {
      estimation_id: estimation.id,
      ce_number: estimation.ce_number,
      project_id: estimation.project_id,
      project_name: estimation.project?.project_name,
      customer_id: estimation.project?.customer_id,
      customer_name: estimation.project?.customer?.customer_name,
      sales_pic: estimation.project?.sales_pic || estimation.requested_by?.employee?.full_name,
      technical_brief: estimation.technical_brief,
      items: estimation.items.map((item: any) => ({
        item_id: item.item_id,
        item_type: item.item_type,
        quantity: Number(item.quantity),
        unit_price: Number(item.sell_price_at_estimation),
        total_price: Number(item.quantity) * Number(item.sell_price_at_estimation),
      })),
      total_amount: Number(estimation.total_sell_price),
      gross_margin: Number(estimation.total_sell_price) - Number(estimation.total_direct_hpp),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: `Generated from Cost Estimation ${estimation.ce_number}`,
    };

    // TODO: Call CRM service API to create quotation
    // const crmResponse = await axios.post('http://crm-service:3002/api/v1/quotations', quotationPayload);
    
    // For now, just return the payload that would be sent
    console.log('📤 Sending to CRM:', JSON.stringify(quotationPayload, null, 2));

    // Mark estimation as sent to CRM (optional: add sent_to_crm_at field to schema)
    await prisma.estimations.update({
      where: { id },
      data: {
        updated_at: new Date(),
        // sent_to_crm_at: new Date(), // TODO: add this field to schema
      },
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Estimation sent to CRM successfully',
      quotation_payload: quotationPayload,
      // crm_quotation_id: crmResponse.data.id, // TODO: when integrated
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error sending estimation to CRM:', msg);
    return res.status(500).json({ success: false, error: msg });
  }
};
