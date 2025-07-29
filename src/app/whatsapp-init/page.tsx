'use client';

import { useState } from 'react';

export default function WhatsAppInit() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const initWhatsApp = async () => {
    setLoading(true);
    setStatus('Inicializando WhatsApp...');
    
    try {
      const response = await fetch('/api/whatsapp/init', {
        method: 'POST'
      });
      
      const result = await response.json();
      setStatus(JSON.stringify(result, null, 2));
    } catch (error) {
      setStatus('Error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🚀 Inicializar WhatsApp</h1>
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
        <strong>Paso 1:</strong> Inicializa WhatsApp aquí primero, luego ve a la página de pruebas
      </div>
      
      <div className="mb-6">
        <button 
          onClick={async () => {
            setLoading(true);
            setStatus('INICIALIZANDO WHATSAPP-WEB.JS ÚLTIMA VERSIÓN...');
            try {
              const response = await fetch('/api/whatsapp/init-final', { method: 'POST' });
              const result = await response.json();
              setStatus(JSON.stringify(result, null, 2));
            } catch (error) {
              setStatus('Error: ' + error);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg disabled:opacity-50 text-xl font-bold w-full"
        >
          {loading ? '⏳ INICIALIZANDO...' : '🚀 INICIALIZAR WHATSAPP'}
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Estado:</h3>
        <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
          {status || 'Listo para inicializar. Haz clic en el botón de arriba.'}
        </pre>
      </div>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        <h3 className="font-bold">Instrucciones:</h3>
        <ol className="list-decimal list-inside mt-2 space-y-1">
          <li>Haz clic en "Inicializar WhatsApp"</li>
          <li>Mira la consola del servidor para ver el QR code</li>
          <li>Escanea el QR con tu WhatsApp</li>
          <li>Espera a que diga "WhatsApp listo para pruebas"</li>
          <li>Ve a <a href="/test-whatsapp" className="underline font-bold">/test-whatsapp</a> para probar</li>
        </ol>
      </div>
    </div>
  );
}