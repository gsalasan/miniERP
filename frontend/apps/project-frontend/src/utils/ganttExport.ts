// TDD-015 Extended - Gantt Export Utilities (PDF)
// src/utils/ganttExport.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportGanttOptions {
  filename?: string;
  format?: 'pdf' | 'png';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0-1
}

/**
 * Export Gantt chart to PDF using jsPDF and html2canvas
 * TDD-015 Extended Section 9: Export & Print
 * 
 * @param container - HTMLElement or CSS selector for Gantt container
 * @param options - Export options
 */
export async function exportGanttToPDF(
  container: HTMLElement | string,
  options: ExportGanttOptions = {}
): Promise<void> {
  const {
    filename = `gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`,
    format = 'pdf',
    orientation = 'landscape',
    quality = 0.95,
  } = options;

  try {
    // Get element
    let element: HTMLElement | null = null;
    
    if (typeof container === 'string') {
      element = document.querySelector(container);
    } else {
      element = container;
    }
    
    if (!element) {
      throw new Error('Gantt container not found');
    }

    // Show loading indicator (optional)
    console.log('[Gantt Export] Generating PDF...');
    
    // Find the SVG element specifically
    const svgElement = element.querySelector('.gantt-container svg');
    
    if (!svgElement) {
      throw new Error('Gantt SVG not found. Make sure the chart is rendered.');
    }

    // Capture the entire Gantt container (including headers)
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2, // Higher quality (2x resolution)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth, // Capture full width including overflow
      windowHeight: element.scrollHeight,
    });

    if (format === 'png') {
      // Export as PNG
      const link = document.createElement('a');
      link.download = filename.replace('.pdf', '.png');
      link.href = canvas.toDataURL('image/png', quality);
      link.click();
      console.log('[Gantt Export] PNG exported successfully');
      return;
    }

    // Export as PDF (A4 landscape)
    const imgData = canvas.toDataURL('image/png', quality);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
    });

    // Calculate dimensions to fit A4
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate aspect ratio to fit within page
    const ratio = Math.min(
      (pdfWidth - 20) / canvasWidth, // 10mm margin on each side
      (pdfHeight - 20) / canvasHeight
    );
    
    const imgWidth = canvasWidth * ratio;
    const imgHeight = canvasHeight * ratio;
    const imgX = (pdfWidth - imgWidth) / 2; // Center horizontally
    const imgY = 10; // 10mm top margin

    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth,
      imgHeight
    );

    // Add footer
    const pageCount = pdf.internal.pages.length - 1;
    pdf.setFontSize(8);
    pdf.text(
      `Generated: ${new Date().toLocaleString()} | Page ${pageCount}`,
      pdfWidth / 2,
      pdfHeight - 5,
      { align: 'center' }
    );

    // Save PDF
    pdf.save(filename);
    console.log('[Gantt Export] PDF exported successfully:', filename);
  } catch (error) {
    console.error('[Gantt Export] Export failed:', error);
    throw error;
  }
}

/**
 * Export Gantt chart using SVG directly (alternative method)
 * Requires svg2pdf.js library
 * @param svgElement - SVG element to export
 * @param options - Export options
 */
export async function exportGanttSVGToPDF(
  svgElement: SVGElement,
  options: ExportGanttOptions = {}
): Promise<void> {
  const {
    filename = `gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`,
    orientation = 'landscape',
  } = options;

  try {
    const pdf = new jsPDF({
      orientation,
      unit: 'pt',
      format: 'a4',
    });

    // Clone SVG to avoid modifying original
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    
    // Get SVG dimensions
    const svgWidth = (svgElement as SVGSVGElement).viewBox?.baseVal?.width || svgElement.clientWidth;
    const svgHeight = (svgElement as SVGSVGElement).viewBox?.baseVal?.height || svgElement.clientHeight;

    // Calculate scale to fit PDF page
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const scale = Math.min(pdfWidth / svgWidth, pdfHeight / svgHeight);

    // TODO: Use svg2pdf.js library for direct SVG to PDF conversion
    // await pdf.svg(svgClone, {
    //   x: 0,
    //   y: 0,
    //   width: svgWidth * scale,
    //   height: svgHeight * scale,
    // });

    console.log('[Gantt Export] SVG to PDF - requires svg2pdf.js library');
    
    // Fallback: Convert SVG to image first
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const img = new Image();
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, svgWidth * scale, svgHeight * scale);
        pdf.save(filename);
      }
      
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error('[Gantt Export] SVG export failed:', error);
    throw error;
  }
}
