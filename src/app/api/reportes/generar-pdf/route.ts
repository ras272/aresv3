import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { mantenimiento, equipo, cliente } = await request.json();
    
    console.log('📄 Generando PDF del reporte técnico...');
    
    // Importar jsPDF
    const { jsPDF } = require('jspdf');
    
    // Crear nuevo documento PDF
    const doc = new jsPDF();
    
    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = 30;
    
    // Función para agregar texto con salto de línea automático
    const addText = (text: string, fontSize = 12, isBold = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }
      
      const lines = doc.splitTextToSize(text, pageWidth - (margin * 2));
      doc.text(lines, margin, yPosition);
      yPosition += (lines.length * fontSize * 0.5) + 5;
    };
    
    // Función para agregar línea separadora
    const addLine = () => {
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
    };
    
    // ENCABEZADO CON LOGO
    try {
      // Intentar cargar el logo (en producción necesitarías la imagen en base64)
      // Por ahora, solo agregamos el texto del encabezado con mejor formato
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('ARES PARAGUAY', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 8;
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('REPORTE DE SERVICIO TÉCNICO', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Servicio Técnico Especializado', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    } catch (logoError) {
      console.log('⚠️ No se pudo cargar el logo, usando encabezado de texto');
      addText('ARES PARAGUAY', 18, true);
      addText('REPORTE DE SERVICIO TÉCNICO', 16, true);
      addText('Servicio Técnico Especializado', 12);
      yPosition += 10;
    }
    
    addLine();
    
    // INFORMACIÓN DEL CLIENTE
    addText('INFORMACIÓN DEL CLIENTE', 14, true);
    addText(`Cliente: ${cliente.nombre}`);
    if (cliente.telefono) {
      addText(`Teléfono: ${cliente.telefono}`);
    }
    if (cliente.contactoPrincipal) {
      addText(`Contacto Principal: ${cliente.contactoPrincipal}`);
    }
    yPosition += 5;
    addLine();
    
    // INFORMACIÓN DEL EQUIPO
    addText('INFORMACIÓN DEL EQUIPO', 14, true);
    addText(`Equipo: ${equipo?.nombreEquipo || 'No especificado'}`);
    addText(`Marca: ${equipo?.marca || 'No especificada'}`);
    addText(`Modelo: ${equipo?.modelo || 'No especificado'}`);
    if (equipo?.numeroSerie) {
      addText(`Número de Serie: ${equipo.numeroSerie}`);
    }
    if (equipo?.ubicacion) {
      addText(`Ubicación: ${equipo.ubicacion}`);
    }
    if (equipo?.cliente) {
      addText(`Cliente Propietario: ${equipo.cliente}`);
    }
    yPosition += 5;
    addLine();
    
    // DETALLES DEL SERVICIO
    addText('DETALLES DEL SERVICIO', 14, true);
    addText(`Fecha: ${new Date(mantenimiento.fecha).toLocaleDateString('es-PY')}`);
    addText(`Estado: ${mantenimiento.estado}`);
    
    if (mantenimiento.precioServicio) {
      addText(`Precio del Servicio: ₲ ${mantenimiento.precioServicio.toLocaleString('es-PY')}`);
    }
    
    yPosition += 5;
    addLine();
    
    // DESCRIPCIÓN DEL TRABAJO
    addText('DESCRIPCIÓN DEL TRABAJO REALIZADO', 14, true);
    addText(mantenimiento.descripcion || 'No especificada');
    
    if (mantenimiento.comentarios) {
      yPosition += 5;
      addText('COMENTARIOS TÉCNICOS', 14, true);
      addText(mantenimiento.comentarios);
    }
    
    yPosition += 10;
    addLine();
    
    // PIE DE PÁGINA
    addText('Este reporte fue generado automáticamente por el sistema de gestión de Ares Paraguay.', 10);
    addText(`Fecha de generación: ${new Date().toLocaleString('es-PY')}`, 10);
    
    // Generar el PDF como buffer
    const pdfBuffer = doc.output('arraybuffer');
    const base64Data = Buffer.from(pdfBuffer).toString('base64');
    
    // Generar nombre del archivo
    const fecha = new Date(mantenimiento.fecha).toISOString().split('T')[0];
    const filename = `Reporte_${equipo.nombreEquipo || 'Equipo'}_${fecha}.pdf`;
    
    console.log('✅ PDF del reporte generado exitosamente:', {
      filename,
      size: pdfBuffer.byteLength,
      cliente: cliente.nombre
    });
    
    return NextResponse.json({
      success: true,
      data: base64Data,
      filename: filename,
      mimetype: 'application/pdf',
      size: pdfBuffer.byteLength
    });
    
  } catch (error) {
    console.error('❌ Error generando PDF del reporte:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido generando PDF'
    }, { status: 500 });
  }
}