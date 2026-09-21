import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

/**
 * Direct PDF Download using html2canvas-pro and jsPDF
 * Fully supports modern CSS color functions including OKLCH from Tailwind CSS v4.
 * Generates a clean A4 PDF file directly to the user's downloads folder.
 */
export async function downloadElementAsPDF(element: HTMLElement, filename: string): Promise<void> {
  // Capture with html2canvas-pro (with full oklch / lab / lch color space support)
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = (canvas.height * contentWidth) / canvas.width;
  const availablePageHeight = pageHeight - margin * 2;

  // If content fits comfortably on one page (or slightly more, fit nicely on 1 page)
  if (contentHeight <= availablePageHeight * 1.12) {
    const finalHeight = Math.min(contentHeight, availablePageHeight);
    const imgData = canvas.toDataURL('image/jpeg', 0.96);
    pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, finalHeight, undefined, 'FAST');
  } else {
    // Multi-page rendering using canvas slicing
    const pageCanvasHeight = (availablePageHeight * canvas.width) / contentWidth;
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = pageCanvasHeight;
    const pageCtx = pageCanvas.getContext('2d');

    let renderedHeight = 0;
    let pageIndex = 0;

    while (renderedHeight < canvas.height) {
      if (pageIndex > 0) {
        pdf.addPage();
      }

      const sourceY = renderedHeight;
      const sourceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );
      }

      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.96);
      const renderH = (sourceHeight * contentWidth) / canvas.width;
      pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, renderH, undefined, 'FAST');

      renderedHeight += sourceHeight;
      pageIndex++;
    }
  }

  const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  pdf.save(finalName);
}

/**
 * Reliable isolated printing function
 * Uses a dedicated hidden iframe to avoid modal overflow clipping and iframe sandbox issues.
 */
export function printElementIsolated(element: HTMLElement): void {
  try {
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.top = '-9999px';
    printIframe.style.left = '-9999px';
    printIframe.style.width = '210mm';
    printIframe.style.height = '297mm';
    printIframe.style.border = 'none';
    printIframe.id = 'print-isolated-iframe';

    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Clone all existing style and link tags so fonts and Tailwind v4 apply identically
    const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(tag => tag.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>طباعة بطاقة موقوف - قوى الأمن الداخلي</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          ${existingStyles}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Cairo', system-ui, sans-serif;
              direction: rtl;
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-size: 11pt;
            }
            .no-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          <div style="width: 100%; padding: 0;">
            ${element.outerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Wait for images and fonts to render
    setTimeout(() => {
      try {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print fallback to window.print():', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 2000);
      }
    }, 450);
  } catch (err) {
    console.error('Isolated print error:', err);
    window.print();
  }
}
