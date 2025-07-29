import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Verificando estado del cliente WhatsApp...');

    const client = (global as any).whatsappClient;
    
    if (!client) {
      console.log('❌ No hay cliente WhatsApp');
      return NextResponse.json({
        conectado: false,
        error: 'Cliente no inicializado'
      });
    }

    console.log('✅ Cliente existe, verificando detalles...');

    try {
      // Verificar estado
      const state = await client.getState();
      console.log('📱 Estado:', state);

      // Verificar info
      const info = client.info;
      console.log('📱 Info:', info);

      // Verificar si la página de Puppeteer está activa
      let pageStatus = 'unknown';
      try {
        if (client.pupPage && !client.pupPage.isClosed()) {
          const title = await client.pupPage.title();
          pageStatus = `Activa - ${title}`;
        } else {
          pageStatus = 'Cerrada o no disponible';
        }
      } catch (pageError) {
        pageStatus = `Error: ${pageError.message}`;
      }

      return NextResponse.json({
        conectado: state === 'CONNECTED',
        estado: state,
        numeroConectado: info?.wid?.user || 'No disponible',
        nombreUsuario: info?.pushname || 'No disponible',
        paginaStatus: pageStatus,
        clienteExiste: !!client,
        infoDisponible: !!info
      });

    } catch (error) {
      console.error('❌ Error verificando estado:', error);
      return NextResponse.json({
        conectado: false,
        error: 'Error verificando estado: ' + error.message,
        clienteExiste: !!client
      });
    }

  } catch (error) {
    console.error('❌ Error en status:', error);
    return NextResponse.json({
      conectado: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}