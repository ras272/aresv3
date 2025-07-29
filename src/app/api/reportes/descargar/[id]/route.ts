import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`📄 Solicitud de descarga de reporte: ${id}`);

    // Buscar el archivo temporal
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    const tempDir = path.join(os.tmpdir(), 'whatsapp_files');
    const files = fs.readdirSync(tempDir).filter((file: string) => file.includes(id));
    
    if (files.length === 0) {
      return NextResponse.json({
        error: 'Archivo no encontrado o expirado'
      }, { status: 404 });
    }
    
    const filePath = path.join(tempDir, files[0]);
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log(`✅ Archivo encontrado: ${files[0]}`);
    
    // Retornar el archivo PDF
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${files[0]}"`,
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('❌ Error descargando reporte:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}