import { Request, Response } from 'express';
import { generatePurchaseOrderPDF } from '../services/pdfServices';

/**
 * Generate PO PDF for download
 * GET /api/procurement/po/:id/generate-pdf
 */
export async function generatePOPDF(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const pdfBuffer = await generatePurchaseOrderPDF(id);

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO-${id}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error generating PO PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PO PDF',
      error: error.message,
    });
  }
}
