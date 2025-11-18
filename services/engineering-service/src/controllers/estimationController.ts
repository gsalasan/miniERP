import { Request, Response } from 'express';
import * as estimationService from '../services/estimationService';
import prisma from '../prisma/client';
import { ItemType, SourceType } from '@prisma/client';

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
            department: true,
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
    const estimations = await prisma.estimations.findMany({
      where: {
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
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
      },
    });
    if (!estimation) return res.status(404).json({ error: 'Estimation not found' });
    res.json(estimation);
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

    // Process Material sections
    sections.forEach((section: any) => {
      if (section.type === 'MATERIAL' && section.items) {
        section.items.forEach((item: any) => {
          total_direct_hpp += item.total_hpp || 0;
        });
      }

      // Process Service sections
      if (section.type === 'SERVICE' && section.serviceGroups) {
        section.serviceGroups.forEach((group: any) => {
          if (group.items) {
            group.items.forEach((item: any) => {
              total_service_cost += item.total_hpp || 0;
            });
          }
        });
      }
    });

    const total_hpp_langsung = total_direct_hpp + total_service_cost;
    const overhead_allocation =
      (total_hpp_langsung * (overhead_percentage || 0)) / 100;
    const total_estimasi_hpp = total_hpp_langsung + overhead_allocation;

    // Apply profit margin
    const profit_amount =
      (total_estimasi_hpp * (profit_margin_percentage || 0)) / 100;
    const total_harga_jual_standar = total_estimasi_hpp + profit_amount;

    // Calculate margins
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
      overhead_allocation,
      total_estimasi_hpp,
      total_harga_jual_standar,
      estimasi_gross_margin,
      estimasi_gross_margin_pct,
      estimasi_net_margin,
      estimasi_net_margin_pct,
    };

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

    // Generate CE Number (format: CE-YYYY-XXX)
    const year = new Date().getFullYear();
    // Hitung jumlah estimasi yang sudah punya CE Number di tahun ini
    const countThisYear = await prisma.estimations.count({
      where: {
        ce_number: {
          startsWith: `CE-${year}-`,
        },
      },
    });
    const ceNumber = `CE-${year}-${String(countThisYear + 1).padStart(3, "0")}`;

    // Update estimation timestamp, CE Number, CE Date
    const updatedEstimation = await prisma.estimations.update({
      where: { id },
      data: {
        updated_at: new Date(),
        ce_number: ceNumber,
        ce_date: new Date(), // This already uses actual time, but ensure frontend displays time part
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
