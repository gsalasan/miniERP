import prisma from '../utils/prisma';
import PDFDocument from 'pdfkit';

/**
 * Generate Purchase Order PDF document
 */
export async function generatePurchaseOrderPDF(poId: string): Promise<Buffer> {
  // Fetch PO data with all relations
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: {
      items: {
        include: {
          material: {
            select: {
              item_name: true,
              brand: true,
              owner_pn: true,
            },
          },
          service: {
            select: {
              service_name: true,
              service_code: true,
              category: true,
            },
          },
        },
      },
      rfp: {
        select: {
          rfp_number: true,
          project_name: true,
        },
      },
      creator: {
        select: {
          email: true,
          employee: {
            select: {
              full_name: true,
            },
          },
        },
      },
      approver: {
        select: {
          email: true,
          employee: {
            select: {
              full_name: true,
            },
          },
        },
      },
      approval_logs: {
        include: {
          approver: {
            select: {
              email: true,
              employee: {
                select: {
                  full_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      },
    },
  });

  if (!po) {
    throw new Error('Purchase Order not found');
  }

  if (po.approval_status !== 'APPROVED') {
    throw new Error('Only approved PO can generate PDF');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('PURCHASE ORDER', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(po.po_number, { align: 'center' });
      doc.moveDown(1);

      // Company Info (left side)
      doc.fontSize(12).font('Helvetica-Bold').text('FROM:', 50, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text('PT Unais Multiverse', 50, 170);
      doc.text('Jl. Contoh No. 123', 50, 185);
      doc.text('Jakarta, Indonesia', 50, 200);
      doc.text('Phone: (021) 1234-5678', 50, 215);

      // Vendor Info (right side)
      doc.fontSize(12).font('Helvetica-Bold').text('TO:', 350, 150);
      doc.fontSize(10).font('Helvetica');
      doc.text(po.vendor_name, 350, 170);

      // PO Details
      doc.fontSize(12).font('Helvetica-Bold').text('PO DETAILS', 50, 250);
      doc.fontSize(10).font('Helvetica');
      
      const detailY = 270;
      doc.text('PO Number:', 50, detailY);
      doc.text(po.po_number, 150, detailY);
      
      doc.text('Order Date:', 50, detailY + 15);
      doc.text(new Date(po.order_date).toLocaleDateString('id-ID'), 150, detailY + 15);
      
      if (po.expected_delivery) {
        doc.text('Expected Delivery:', 50, detailY + 30);
        doc.text(new Date(po.expected_delivery).toLocaleDateString('id-ID'), 150, detailY + 30);
      }
      
      if (po.payment_terms) {
        doc.text('Payment Terms:', 50, detailY + 45);
        doc.text(po.payment_terms, 150, detailY + 45);
      }

      if (po.rfp?.project_name) {
        doc.text('Project:', 50, detailY + 60);
        doc.text(po.rfp.project_name, 150, detailY + 60);
      }

      // Items table
      doc.fontSize(12).font('Helvetica-Bold').text('ITEMS', 50, 370);
      
      const tableTop = 395;
      const itemHeight = 20;
      
      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      doc.rect(50, tableTop, 495, itemHeight).stroke();
      doc.text('No', 55, tableTop + 5, { width: 30 });
      doc.text('Item Name', 90, tableTop + 5, { width: 180 });
      doc.text('Qty', 275, tableTop + 5, { width: 40, align: 'right' });
      doc.text('Unit', 320, tableTop + 5, { width: 50 });
      doc.text('Unit Price', 375, tableTop + 5, { width: 70, align: 'right' });
      doc.text('Total', 450, tableTop + 5, { width: 85, align: 'right' });

      // Table rows
      doc.font('Helvetica');
      let currentY = tableTop + itemHeight;
      
      po.items.forEach((item: any, index: number) => {
        const itemName = item.material?.item_name || item.service?.service_name || item.item_name;
        
        doc.rect(50, currentY, 495, itemHeight).stroke();
        doc.text((index + 1).toString(), 55, currentY + 5, { width: 30 });
        doc.text(itemName, 90, currentY + 5, { width: 180 });
        doc.text(Number(item.quantity).toString(), 275, currentY + 5, { width: 40, align: 'right' });
        doc.text(item.unit, 320, currentY + 5, { width: 50 });
        doc.text(
          new Intl.NumberFormat('id-ID').format(Number(item.unit_price)),
          375,
          currentY + 5,
          { width: 70, align: 'right' }
        );
        doc.text(
          new Intl.NumberFormat('id-ID').format(Number(item.total_price)),
          450,
          currentY + 5,
          { width: 85, align: 'right' }
        );
        
        currentY += itemHeight;
      });

      // Total
      currentY += 10;
      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('TOTAL AMOUNT:', 350, currentY);
      doc.text(
        'Rp ' + new Intl.NumberFormat('id-ID').format(Number(po.total_amount)),
        450,
        currentY,
        { width: 85, align: 'right' }
      );

      // Notes
      if (po.notes) {
        currentY += 30;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('NOTES:', 50, currentY);
        doc.font('Helvetica');
        doc.text(po.notes, 50, currentY + 15, { width: 495 });
        currentY += 50;
      } else {
        currentY += 30;
      }

      // Approval signatures
      currentY += 20;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('APPROVALS:', 50, currentY);
      
      currentY += 20;
      doc.font('Helvetica');
      
      // Prepared by
      doc.text('Prepared by:', 50, currentY);
      doc.text('Approved by:', 350, currentY);
      
      currentY += 50;
      doc.text('_____________________', 50, currentY);
      doc.text('_____________________', 350, currentY);
      
      currentY += 15;
      const creatorName = po.creator.employee?.full_name || po.creator.email;
      const approverName = po.approver?.employee?.full_name || po.approver?.email || '-';
      
      doc.text(creatorName, 50, currentY);
      doc.text(approverName, 350, currentY);
      
      currentY += 15;
      doc.fontSize(8);
      doc.text('Procurement Admin', 50, currentY);
      doc.text('Authorized Approver', 350, currentY);
      
      if (po.approved_at) {
        currentY += 12;
        doc.text(
          'Date: ' + new Date(po.approved_at).toLocaleDateString('id-ID'),
          350,
          currentY
        );
      }

      // Footer
      doc.fontSize(8).font('Helvetica');
      doc.text(
        'This is a computer-generated document and does not require a physical signature.',
        50,
        doc.page.height - 80,
        { align: 'center', width: 495 }
      );
      doc.text(
        `Generated on: ${new Date().toLocaleString('id-ID')}`,
        50,
        doc.page.height - 65,
        { align: 'center', width: 495 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
