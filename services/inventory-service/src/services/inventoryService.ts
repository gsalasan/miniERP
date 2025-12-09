import prisma from '../utils/prisma';

export interface AllocateParams {
  projectId: string;
  materialId: string;
  quantity: number | string;
  userId?: string;
  need?: number | string;
}

export interface IssueParams {
  projectId: string;
  materialId: string;
  quantity: number | string;
  userId?: string;
}

class InventoryService {
  async getProjectMaterials(projectId: string) {
    if (!projectId) throw { status: 400, message: 'projectId required' };

    // fetch all BOM entries for project
    const boms = await prisma.projectBOM.findMany({ where: { project_id: projectId } });

    const result = await Promise.all(
      boms.map(async (b) => {
        const materialId = b.item_id;

        // If BOM entry is not a MATERIAL type, return a stub with zero availability
        if (b.item_type !== 'MATERIAL') {
          return {
            materialId,
            materialName: null,
            needQty: Number(b.quantity ?? 0),
            physicalQty: 0,
            allocatedTotal: 0,
            allocatedForProject: 0,
            available: 0,
          };
        }

        const material = await prisma.material.findUnique({ where: { id: materialId }, select: { id: true, item_name: true } });

        const stock = await prisma.inventoryStock.findUnique({ where: { material_id: materialId } });

        const totalAllocated = await prisma.inventoryAllocation.aggregate({ where: { material_id: materialId }, _sum: { quantity: true } });
        const projectAllocated = await prisma.inventoryAllocation.aggregate({ where: { material_id: materialId, project_id: projectId }, _sum: { quantity: true } });

        const physical = Number(stock?.physical_qty ?? 0);
        const allocatedTotal = Number(totalAllocated._sum.quantity ?? 0);
        const allocatedForProject = Number(projectAllocated._sum.quantity ?? 0);
        const otherAllocated = Math.max(0, allocatedTotal - allocatedForProject);
        const available = Math.max(0, physical - otherAllocated);

        return {
          materialId,
          materialName: material?.item_name ?? null,
          needQty: Number(b.quantity ?? 0),
          physicalQty: physical,
          allocatedTotal,
          allocatedForProject,
          available,
        };
      })
    );

    return result;
  }

  /**
   * Reserve (allocate) stock for a project.
   * Uses row-level locking (SELECT ... FOR UPDATE) to prevent race conditions.
   */
  async allocateStock(params: AllocateParams) {
    const { projectId, materialId, quantity, userId, need } = params;
    const qty = typeof quantity === 'string' ? Number(quantity) : quantity;
    if (!projectId || !materialId || !qty || qty <= 0) throw { status: 400, message: 'Invalid parameters' };

    return await prisma.$transaction(async (tx) => {
      // ensure the referenced material exists
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (!material) throw { status: 404, message: 'Material not found' };

      // lock the inventory_stock row for this material (cast uuid to text for safe comparison)
      const rows: any[] = await tx.$queryRaw`
        SELECT * FROM inventory_stocks WHERE material_id::text = ${materialId} FOR UPDATE
      `;
      const stock = rows[0];
      if (!stock) throw { status: 404, message: 'Inventory stock not found for material' };

      const physical = Number(stock.physical_qty ?? 0);
      // get aggregated allocation sums
      const allocTotalAgg = await tx.inventoryAllocation.aggregate({ where: { material_id: materialId }, _sum: { quantity: true } });
      const allocProjectAgg = await tx.inventoryAllocation.aggregate({ where: { material_id: materialId, project_id: projectId }, _sum: { quantity: true } });

      const allocatedTotal = Number(allocTotalAgg._sum.quantity ?? 0);
      const allocatedForProject = Number(allocProjectAgg._sum.quantity ?? 0);
      const otherAllocated = Math.max(0, allocatedTotal - allocatedForProject);
      const available = Math.max(0, physical - otherAllocated);

      if (qty > available) throw { status: 400, message: 'Requested quantity exceeds available stock' };

      if (need !== undefined) {
        const needNum = typeof need === 'string' ? Number(need) : need;
        if (qty > needNum) throw { status: 400, message: 'Requested quantity exceeds project need' };
      }

      const allocation = await tx.inventoryAllocation.create({
        data: {
          project_id: projectId,
          material_id: materialId,
          quantity: qty,
          created_by: userId || null,
        },
      });

      const updatedStock = await tx.inventoryStock.update({ where: { material_id: materialId }, data: { allocated_qty: { increment: qty } } });

      return { allocation, updatedStock };
    });
  }

  /**
   * Issue (consume) material that was previously allocated for a project.
   * - Ensures issuance quantity <= allocated for project
   * - Locks inventory_stock row with FOR UPDATE
   * - Decrements allocated_qty and physical_qty
   * - Records an InventoryIssue with last_buy_price and total cost
   */
  async issueMaterial(params: IssueParams) {
    const { projectId, materialId, quantity, userId } = params;
    const qty = typeof quantity === 'string' ? Number(quantity) : quantity;
    if (!projectId || !materialId || !qty || qty <= 0) throw { status: 400, message: 'Invalid parameters' };

    return await prisma.$transaction(async (tx) => {
      // ensure material exists
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (!material) throw { status: 404, message: 'Material not found' };

      // lock stock row
      const rows: any[] = await tx.$queryRaw`
        SELECT * FROM inventory_stocks WHERE material_id::text = ${materialId} FOR UPDATE
      `;
      const stock = rows[0];
      if (!stock) throw { status: 404, message: 'Inventory stock not found for material' };

      const physical = Number(stock.physical_qty ?? 0);

      // compute allocated for project
      const allocProjectAgg = await tx.inventoryAllocation.aggregate({ where: { material_id: materialId, project_id: projectId }, _sum: { quantity: true } });
      let allocatedForProject = Number(allocProjectAgg._sum.quantity ?? 0);

      if (qty > allocatedForProject) throw { status: 400, message: 'Requested issuance exceeds allocated quantity for this project' };

      // consume allocations for this project (FIFO) by decrementing allocation rows
      let remaining = qty;
      const allocations = await tx.inventoryAllocation.findMany({ where: { material_id: materialId, project_id: projectId }, orderBy: { created_at: 'asc' } });
      for (const a of allocations) {
        if (remaining <= 0) break;
        const aQty = Number(a.quantity ?? 0);
        const take = Math.min(aQty, remaining);
        // decrement allocation quantity
        await tx.inventoryAllocation.update({ where: { id: a.id }, data: { quantity: { decrement: take } } });
        remaining = Number((remaining - take).toFixed(6));
      }

      // remove any allocation rows that are zero or negative (cleanup)
      await tx.$executeRaw`
        DELETE FROM inventory_allocations WHERE material_id::text = ${materialId} AND project_id = ${projectId} AND quantity <= 0
      `;

      // recompute allocated total after consumption
      const allocTotalAggAfter = await tx.inventoryAllocation.aggregate({ where: { material_id: materialId }, _sum: { quantity: true } });
      const allocatedTotalAfter = Number(allocTotalAggAfter._sum.quantity ?? 0);

      // determine last buy price from latest purchase order item using raw SQL (safe ordering)
      let lastBuyPrice = 0;
      try {
        const lastRow: any = await tx.$queryRaw`
          SELECT poi.unit_price FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.po_id = po.id
          WHERE poi.material_id::text = ${materialId}
          ORDER BY po.order_date DESC NULLS LAST
          LIMIT 1
        `;
        if (lastRow && lastRow[0] && lastRow[0].unit_price) lastBuyPrice = Number(lastRow[0].unit_price);
      } catch (e) {
        lastBuyPrice = 0;
      }

      const totalCost = lastBuyPrice * qty;

      // create issue record
      const issue = await tx.inventoryIssue.create({
        data: {
          project_id: projectId,
          material_id: materialId,
          quantity: qty,
          last_buy_price: lastBuyPrice || undefined,
          total_cost: totalCost || undefined,
          issued_by: userId || null,
        },
      });

      // update inventory stock: set allocated_qty to current sum and decrement physical_qty by qty
      const updatedStock = await tx.inventoryStock.update({ where: { material_id: materialId }, data: { allocated_qty: allocatedTotalAfter, physical_qty: { decrement: qty } } });

      return { issue, updatedStock };
    });
  }
}

export const inventoryService = new InventoryService();
