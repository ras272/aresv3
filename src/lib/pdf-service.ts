// ===============================================
// SERVICIO DE CONVERSIÓN WORD A PDF
// ===============================================

import { WordReporteService } from './word-service';

interface ReporteData {
  fecha: string;
  cliente: string;
  numeroReporte: string;
  descripcionProblema: string;
  formularioAsistencia: string;
  trabajoRealizado: string;
  costo: string;
  ingeniero: string;
}

export class PDFReporteService {
  /**
   * Generar reporte directamente en PDF usando HTML y CSS
   */
  static async generarReportePDF(data: ReporteData): Promise<Blob> {
    try {
      // Formatear la fecha en español
      const fechaFormateada = this.formatearFecha(data.fecha);
      
      // Crear HTML del reporte con estilos
      const htmlContent = this.generarHTMLReporte(data, fechaFormateada);
      
      // Convertir HTML a PDF usando la API del navegador
      const pdfBlob = await this.convertirHTMLaPDF(htmlContent, `Reporte_${data.numeroReporte}.pdf`);
      
      return pdfBlob;
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new Error('No se pudo generar el reporte en PDF');
    }
  }

  /**
   * Generar HTML del reporte con estilos CSS
   */
  private static generarHTMLReporte(data: ReporteData, fechaFormateada: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Servicio Técnico</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        
        body {
            font-family: 'Calibri', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.15;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .company-name {
            font-size: 18pt;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .company-subtitle {
            font-size: 12pt;
            color: #666;
        }
        
        .info-section {
            margin-bottom: 20px;
        }
        
        .info-row {
            display: flex;
            margin-bottom: 8px;
            align-items: baseline;
        }
        
        .info-label {
            font-weight: bold;
            min-width: 120px;
            display: inline-block;
        }
        
        .info-value {
            flex: 1;
        }
        
        .section-title {
            font-size: 12pt;
            font-weight: bold;
            margin: 25px 0 15px 0;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        
        .trabajo-realizado {
            text-align: justify;
            line-height: 1.4;
            margin: 15px 0 30px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #2563eb;
        }
        
        .costo-section {
            margin: 30px 0;
            padding: 20px;
            background-color: #f0f9ff;
            border: 2px solid #2563eb;
            border-radius: 8px;
        }
        
        .costo-item {
            font-size: 12pt;
            font-weight: bold;
            margin: 8px 0;
            color: #1e40af;
        }
        
        .firma-section {
            margin-top: 60px;
            text-align: center;
        }
        
        .firma-linea {
            border-bottom: 2px solid #333;
            width: 200px;
            margin: 40px auto 10px auto;
        }
        
        .firma-nombre {
            font-weight: bold;
            font-size: 12pt;
        }
        
        .footer {
            position: fixed;
            bottom: 1cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">ARES PARAGUAY</div>
        <div class="company-subtitle">Servicio Técnico Especializado</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <span class="info-label">Lugar y Fecha:</span>
            <span class="info-value">${fechaFormateada}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${data.cliente}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Nro. Rep.:</span>
            <span class="info-value">${data.numeroReporte}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Reporte:</span>
            <span class="info-value">${data.descripcionProblema}</span>
        </div>
    </div>

    <div class="section-title">
        Formulario de Asistencia Nº: ${data.formularioAsistencia}
    </div>

    <div class="section-title">Trabajo Realizado:</div>
    <div class="trabajo-realizado">
        ${data.trabajoRealizado}
    </div>

    <div class="costo-section">
        <div class="costo-item">COSTO DEL SERVICIO: ${data.costo} – IVA INCLUIDO</div>
        <div class="costo-item">COSTO TOTAL: ${data.costo} – IVA INCLUIDO</div>
    </div>

    <div class="firma-section">
        <div class="firma-linea"></div>
        <div class="firma-nombre">${data.ingeniero}</div>
        <div style="font-size: 10pt; color: #666; margin-top: 5px;">Técnico Responsable</div>
    </div>

    <div class="footer">
        <div>Ares Paraguay - Servicio Técnico Especializado</div>
        <div>Reporte generado el ${new Date().toLocaleDateString('es-PY')}</div>
    </div>
</body>
</html>`;
  }

  /**
   * Convertir HTML a PDF usando la API del navegador
   */
  private static async convertirHTMLaPDF(htmlContent: string, filename: string): Promise<Blob> {
    try {
      // Crear un iframe oculto para renderizar el HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '297mm'; // A4 height
      document.body.appendChild(iframe);

      // Escribir el contenido HTML en el iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('No se pudo acceder al documento del iframe');
      }

      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Esperar a que se cargue completamente
      await new Promise(resolve => {
        if (iframe.contentWindow) {
          iframe.contentWindow.onload = resolve;
        } else {
          setTimeout(resolve, 1000);
        }
      });

      // Usar window.print() para generar PDF
      const printWindow = iframe.contentWindow;
      if (!printWindow) {
        throw new Error('No se pudo acceder a la ventana del iframe');
      }

      // Configurar para imprimir como PDF
      const printPromise = new Promise<Blob>((resolve, reject) => {
        // Simular la generación de PDF
        // En un entorno real, esto requeriría una librería como Puppeteer o jsPDF
        // Por ahora, crearemos un PDF básico usando jsPDF
        this.generarPDFConJsPDF(htmlContent, filename)
          .then(resolve)
          .catch(reject);
      });

      // Limpiar el iframe
      document.body.removeChild(iframe);

      return await printPromise;
    } catch (error) {
      console.error('Error convirtiendo HTML a PDF:', error);
      throw error;
    }
  }

  /**
   * Generar PDF usando jsPDF (fallback)
   */
  private static async generarPDFConJsPDF(htmlContent: string, filename: string): Promise<Blob> {
    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('jspdf');
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configurar fuente
    doc.setFont('helvetica');
    doc.setFontSize(11);

    // Extraer datos del HTML (parsing básico)
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlContent, 'text/html');
    
    let yPosition = 20;
    const lineHeight = 6;
    const pageWidth = 210;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ARES PARAGUAY', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Servicio Técnico Especializado', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Línea separadora
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Información básica
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const infoRows = htmlDoc.querySelectorAll('.info-row');
    infoRows.forEach(row => {
      const label = row.querySelector('.info-label')?.textContent || '';
      const value = row.querySelector('.info-value')?.textContent || '';
      
      doc.setFont('helvetica', 'bold');
      doc.text(label, margin, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 40, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 10;

    // Trabajo realizado
    doc.setFont('helvetica', 'bold');
    doc.text('Trabajo Realizado:', margin, yPosition);
    yPosition += 8;

    const trabajoRealizado = htmlDoc.querySelector('.trabajo-realizado')?.textContent || '';
    doc.setFont('helvetica', 'normal');
    const trabajoLines = doc.splitTextToSize(trabajoRealizado, maxWidth);
    doc.text(trabajoLines, margin, yPosition);
    yPosition += trabajoLines.length * lineHeight + 10;

    // Costo
    const costoItems = htmlDoc.querySelectorAll('.costo-item');
    costoItems.forEach(item => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.textContent || '', margin, yPosition);
      yPosition += lineHeight;
    });

    yPosition += 20;

    // Firma
    doc.line(margin + 50, yPosition, margin + 100, yPosition);
    yPosition += 8;
    
    const firmaName = htmlDoc.querySelector('.firma-nombre')?.textContent || '';
    doc.setFont('helvetica', 'bold');
    doc.text(firmaName, margin + 75, yPosition, { align: 'center' });
    yPosition += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Técnico Responsable', margin + 75, yPosition, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.text('Ares Paraguay - Servicio Técnico Especializado', pageWidth / 2, 280, { align: 'center' });
    doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-PY')}`, pageWidth / 2, 285, { align: 'center' });

    // Convertir a blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  /**
   * Formatear fecha en español
   */
  private static formatearFecha(fechaISO: string): string {
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const fecha = new Date(fechaISO);
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();

    return `Asunción, ${dia.toString().padStart(2, '0')} de ${mes} del ${año}`;
  }

  /**
   * Generar datos del reporte desde un mantenimiento
   */
  static generarDatosReporte(mantenimiento: any, equipo: any, cliente: any): ReporteData {
    // Usar el número de reporte del mantenimiento si existe, sino generar uno nuevo
    const numeroReporte = mantenimiento.numeroReporte || WordReporteService.generarNumeroReporte(
      equipo.nombreEquipo, 
      mantenimiento.fecha
    );
    
    const numeroFormulario = WordReporteService.generarNumeroFormulario();
    
    const costo = mantenimiento.precioServicio 
      ? `₲ ${mantenimiento.precioServicio.toLocaleString('es-PY')}`
      : 'A CONVENIR';

    return {
      fecha: mantenimiento.fecha,
      cliente: cliente.nombre,
      numeroReporte,
      descripcionProblema: mantenimiento.descripcion,
      formularioAsistencia: numeroFormulario,
      trabajoRealizado: mantenimiento.comentarios || mantenimiento.descripcion,
      costo,
      ingeniero: 'Técnico Ares Paraguay'
    };
  }
}