// TDD-015 Extended - Gantt Export Utilities (PDF)
// src/utils/ganttExport.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportGanttOptions {
  filename?: string;
  format?: 'pdf' | 'png';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0-1
  projectInfo?: {
    projectName?: string;
    projectNumber?: string;
    customerName?: string;
  };
}

export async function exportGanttToPDF(
  container: HTMLElement | string,
  options: ExportGanttOptions = {}
): Promise<void> {
  const {
    filename = `gantt-chart-${new Date().toISOString().split('T')[0]}.pdf`,
    format = 'pdf',
    orientation = 'landscape',
    quality = 0.95,
    projectInfo,
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

    // Store original scroll position
    const originalScrollLeft = element.scrollLeft;
    const originalScrollTop = element.scrollTop;
    
    // Temporarily remove scroll and ensure full content is visible
    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;
    const originalWidth = element.style.width;
    const originalMaxHeight = element.style.maxHeight;
    
    element.style.overflow = 'visible';
    element.style.height = 'auto';
    element.style.width = 'auto';
    element.style.maxHeight = 'none';

    // Capture the entire Gantt container (including headers and all tasks/milestones)
    const canvas = await html2canvas(element as HTMLElement, {
      scale: 2, // Higher quality (2x resolution)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: Math.max(element.scrollWidth, element.offsetWidth), // Capture full width
      windowHeight: Math.max(element.scrollHeight, element.offsetHeight), // Capture full height
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: Math.max(element.scrollWidth, element.offsetWidth),
      height: Math.max(element.scrollHeight, element.offsetHeight),
    });

    // Restore original styles
    element.style.overflow = originalOverflow;
    element.style.height = originalHeight;
    element.style.width = originalWidth;
    element.style.maxHeight = originalMaxHeight;
    element.scrollLeft = originalScrollLeft;
    element.scrollTop = originalScrollTop;

    if (format === 'png') {
      // Export as PNG
      const link = document.createElement('a');
      link.download = filename.replace('.pdf', '.png');
      link.href = canvas.toDataURL('image/png', quality);
      link.click();
      console.log('[Gantt Export] PNG exported successfully');
      return;
    }

    // Export as PDF (A4 landscape or multiple pages if needed)
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
    
    // Reserve space for header (30mm) and footer (10mm)
    const headerHeight = projectInfo ? 45 : 15;
    const footerHeight = 10;
    const availableHeight = pdfHeight - headerHeight - footerHeight;
    
    // Calculate how many pages we need
    const contentWidth = canvasWidth;
    const contentHeight = canvasHeight;
    const pageWidth = pdfWidth - 20; // 10mm margin on each side
    
    // Calculate scale to fit width
    const scale = pageWidth / contentWidth;
    const scaledHeight = contentHeight * scale;
    
    // Add project info header on first page
    if (projectInfo) {
      // Title with background
      pdf.setFillColor(0, 51, 102); // Dark blue
      pdf.rect(10, 8, pdfWidth - 20, 12, 'F');
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255); // White text
      pdf.text('PROJECT GANTT CHART', pdfWidth / 2, 16, { align: 'center' });
      
      // Project info box with light background
      pdf.setFillColor(245, 250, 255); // Very light blue
      pdf.rect(10, 22, pdfWidth - 20, 20, 'F');
      
      // Border for info box
      pdf.setDrawColor(0, 51, 102);
      pdf.setLineWidth(0.5);
      pdf.rect(10, 22, pdfWidth - 20, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      let yPos = 28;
      const leftCol = 15;
      const midCol = pdfWidth / 2 - 5;
      const labelWidth = 28;
      
      // Row 1: Project Number and Customer
      if (projectInfo.projectNumber) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('No. Proyek:', leftCol, yPos);
        pdf.setFont('helvetica', 'normal');
        pdf.text(projectInfo.projectNumber, leftCol + labelWidth, yPos);
      }
      
      if (projectInfo.customerName) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Customer:', midCol, yPos);
        pdf.setFont('helvetica', 'normal');
        const customerText = projectInfo.customerName.length > 35 
          ? projectInfo.customerName.substring(0, 32) + '...' 
          : projectInfo.customerName;
        pdf.text(customerText, midCol + 22, yPos);
      }
      
      yPos += 7;
      
      // Row 2: Project Name (full width if long)
      if (projectInfo.projectName) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Nama Proyek:', leftCol, yPos);
        pdf.setFont('helvetica', 'normal');
        const maxWidth = pdfWidth - leftCol - labelWidth - 15;
        const projectNameLines = pdf.splitTextToSize(projectInfo.projectName, maxWidth);
        pdf.text(projectNameLines[0], leftCol + labelWidth, yPos);
        if (projectNameLines.length > 1) {
          pdf.setFontSize(8);
          pdf.text(projectNameLines[1], leftCol + labelWidth, yPos + 4);
        }
      }
    }
    
    // If content fits in one page
    if (scaledHeight <= availableHeight) {
      const imgX = 10; // 10mm left margin
      const imgY = headerHeight; // After header
      
      pdf.addImage(
        imgData,
        'PNG',
        imgX,
        imgY,
        pageWidth,
        scaledHeight
      );
    } else {
      // Content needs multiple pages
      let remainingHeight = scaledHeight;
      let sourceY = 0;
      let pageNumber = 1;
      
      while (remainingHeight > 0) {
        const heightForThisPage = Math.min(availableHeight, remainingHeight);
        const sourceHeight = (heightForThisPage / scale);
        
        // Create a temporary canvas for this page slice
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = contentWidth;
        tempCanvas.height = sourceHeight;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Draw slice of original canvas
          tempCtx.drawImage(
            canvas,
            0, sourceY,
            contentWidth, sourceHeight,
            0, 0,
            contentWidth, sourceHeight
          );
          
          const sliceData = tempCanvas.toDataURL('image/png', quality);
          
          if (pageNumber > 1) {
            pdf.addPage();
            
            // Add header on subsequent pages
            if (projectInfo) {
              // Header bar
              pdf.setFillColor(0, 51, 102);
              pdf.rect(10, 8, pdfWidth - 20, 10, 'F');
              
              pdf.setFontSize(12);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(255, 255, 255);
              pdf.text('PROJECT GANTT CHART (Continued)', pdfWidth / 2, 14, { align: 'center' });
              
              // Info line
              pdf.setFillColor(245, 250, 255);
              pdf.rect(10, 19, pdfWidth - 20, 6, 'F');
              
              pdf.setDrawColor(0, 51, 102);
              pdf.setLineWidth(0.5);
              pdf.rect(10, 19, pdfWidth - 20, 6);
              
              pdf.setFontSize(8);
              pdf.setFont('helvetica', 'normal');
              pdf.setTextColor(0, 0, 0);
              
              let infoText = '';
              if (projectInfo.projectNumber) infoText += `No: ${projectInfo.projectNumber}`;
              if (projectInfo.projectName) {
                if (infoText) infoText += ' | ';
                const shortName = projectInfo.projectName.length > 60 
                  ? projectInfo.projectName.substring(0, 57) + '...' 
                  : projectInfo.projectName;
                infoText += shortName;
              }
              if (projectInfo.customerName) {
                if (infoText) infoText += ' | ';
                const shortCustomer = projectInfo.customerName.length > 30 
                  ? projectInfo.customerName.substring(0, 27) + '...' 
                  : projectInfo.customerName;
                infoText += `Customer: ${shortCustomer}`;
              }
              
              pdf.text(infoText, pdfWidth / 2, 23, { align: 'center' });
            }
          }
          
          pdf.addImage(
            sliceData,
            'PNG',
            10,
            headerHeight,
            pageWidth,
            heightForThisPage
          );
        }
        
        sourceY += sourceHeight;
        remainingHeight -= heightForThisPage;
        pageNumber++;
      }
    }

    // Add footer to all pages
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      
      // Footer background
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, pdfHeight - 8, pdfWidth, 8, 'F');
      
      // Footer line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(10, pdfHeight - 8, pdfWidth - 10, pdfHeight - 8);
      
      // Footer text
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      
      const dateStr = new Date().toLocaleDateString('id-ID', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const timeStr = new Date().toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      pdf.text(
        `Generated: ${dateStr} ${timeStr}`,
        15,
        pdfHeight - 3.5
      );
      
      pdf.text(
        `Page ${i} of ${totalPages}`,
        pdfWidth - 15,
        pdfHeight - 3.5,
        { align: 'right' }
      );
    }

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
