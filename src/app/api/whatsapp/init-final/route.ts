import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 WHATSAPP-WEB.JS ÚLTIMA VERSIÓN - INICIALIZACIÓN');

    // Limpiar cliente anterior
    if ((global as any).whatsappClient) {
      try {
        await (global as any).whatsappClient.destroy();
        console.log('🧹 Cliente anterior destruido');
      } catch (e) {
        console.log('⚠️ Error destruyendo cliente anterior');
      }
      (global as any).whatsappClient = null;
    }

    // Esperar después de limpiar
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { Client, LocalAuth } = require('whatsapp-web.js');
    
    // Cliente con configuración para ÚLTIMA VERSIÓN
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'ares-latest',
        dataPath: './.wwebjs_auth_latest'
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      }
    });

    console.log('✅ Cliente ÚLTIMA VERSIÓN creado');

    return new Promise((resolve) => {
      let resolved = false;
      let authenticated = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(NextResponse.json({
            success: false,
            message: 'TIMEOUT - No se conectó en 3 minutos'
          }));
        }
      }, 180000); // 3 minutos

      client.on('qr', (qr: string) => {
        console.log('📱 ==========================================');
        console.log('📱 QR FINAL - ESCANEA YA:');
        console.log('📱 ==========================================');
        console.log(qr);
        console.log('📱 ==========================================');
      });

      client.on('authenticated', () => {
        console.log('✅ AUTENTICADO FINAL');
        authenticated = true;
        
        // Forzar verificación después de autenticado
        setTimeout(() => {
          forceCheck();
        }, 3000);
      });

      client.on('ready', () => {
        console.log('🎉 READY FINAL - ÉXITO');
        handleSuccess();
      });

      // Verificación FORZADA cada 3 segundos
      const forceCheck = () => {
        console.log('🔍 VERIFICACIÓN FORZADA INICIADA');
        
        const interval = setInterval(async () => {
          if (resolved) {
            clearInterval(interval);
            return;
          }
          
          try {
            console.log('🔍 Verificando...');
            
            // Método 1: Info
            if (client.info && client.info.wid) {
              console.log('✅ CONECTADO POR INFO');
              clearInterval(interval);
              handleSuccess();
              return;
            }
            
            // Método 2: Estado
            const state = await client.getState();
            console.log('📱 Estado:', state);
            
            if (state === 'CONNECTED') {
              console.log('✅ CONECTADO POR ESTADO');
              clearInterval(interval);
              handleSuccess();
              return;
            }
            
            // Método 3: Intentar obtener chats
            try {
              const chats = await client.getChats();
              if (chats && chats.length >= 0) {
                console.log('✅ CONECTADO POR CHATS');
                clearInterval(interval);
                handleSuccess();
                return;
              }
            } catch (e) {
              // Ignorar error de chats
            }
            
          } catch (error) {
            console.log('⚠️ Error verificando:', error.message);
          }
        }, 3000);
        
        // Detener después de 2 minutos
        setTimeout(() => {
          clearInterval(interval);
        }, 120000);
      };

      const handleSuccess = () => {
        if (resolved) return;
        
        console.log('🎉 MANEJANDO ÉXITO FINAL');
        
        // Guardar cliente INMEDIATAMENTE
        (global as any).whatsappClient = client;
        console.log('✅ Cliente FINAL guardado');
        
        clearTimeout(timeout);
        resolved = true;
        
        resolve(NextResponse.json({
          success: true,
          message: 'WHATSAPP CONECTADO EXITOSAMENTE',
          numeroConectado: client.info?.wid?.user || 'Conectado'
        }));
      };

      client.on('auth_failure', () => {
        console.log('❌ FALLO AUTH FINAL');
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(NextResponse.json({
            success: false,
            message: 'FALLO DE AUTENTICACIÓN'
          }));
        }
      });

      console.log('🚀 INICIALIZANDO CLIENTE FINAL...');
      client.initialize();
    });

  } catch (error) {
    console.error('❌ ERROR FINAL:', error);
    return NextResponse.json({
      success: false,
      message: 'ERROR: ' + error.message
    });
  }
}