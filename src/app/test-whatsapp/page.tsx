"use client";

import { useState } from "react";

export default function TestWhatsApp() {
  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("Mensaje de prueba desde test page");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus(
        `Archivo seleccionado: ${selectedFile.name} (${(
          selectedFile.size / 1024
        ).toFixed(2)} KB)`
      );
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remover el prefijo data:type/subtype;base64,
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const testSendMessage = async () => {
    if (!phone.trim()) {
      setStatus("❌ Ingresa un número de teléfono");
      return;
    }

    setLoading(true);
    setStatus("📱 Enviando mensaje de prueba...");

    try {
      // Enviar solo mensaje de texto primero
      const textResponse = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message: message,
          type: "text",
        }),
      });

      const textResult = await textResponse.json();

      if (textResult.success) {
        setStatus("✅ Mensaje de texto enviado exitosamente");
      } else {
        setStatus(`❌ Error enviando texto: ${textResult.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSendFile = async () => {
    if (!phone.trim()) {
      setStatus("❌ Ingresa un número de teléfono");
      return;
    }

    if (!file) {
      setStatus("❌ Selecciona un archivo");
      return;
    }

    setLoading(true);
    setStatus("📎 Convirtiendo archivo a base64...");

    try {
      // Convertir archivo a base64
      const base64Data = await convertFileToBase64(file);

      setStatus("📱 Enviando archivo...");

      // Enviar archivo
      const fileResponse = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message: `📎 Enviando archivo: ${file.name}`,
          type: "file",
          filename: file.name,
          data: base64Data,
          mimetype: file.type || "application/octet-stream",
        }),
      });

      const fileResult = await fileResponse.json();

      if (fileResult.success) {
        setStatus(`✅ Archivo enviado exitosamente: ${file.name}`);
      } else {
        setStatus(`❌ Error enviando archivo: ${fileResult.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSendBoth = async () => {
    if (!phone.trim()) {
      setStatus("❌ Ingresa un número de teléfono");
      return;
    }

    if (!file) {
      setStatus("❌ Selecciona un archivo");
      return;
    }

    setLoading(true);
    setStatus("📱 Enviando mensaje + archivo...");

    try {
      // Convertir archivo a base64
      const base64Data = await convertFileToBase64(file);

      // Enviar mensaje y archivo juntos
      const response = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: phone,
          message: message,
          type: "both",
          filename: file.name,
          data: base64Data,
          mimetype: file.type || "application/octet-stream",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus(`✅ Mensaje y archivo enviados exitosamente`);
      } else {
        setStatus(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 Test WhatsApp-Web.js</h1>

      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <strong>Objetivo:</strong> Probar si el problema está en el modal de
        reportes o en la API de WhatsApp
      </div>

      {/* Configuración */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            📱 Número de teléfono (ej: 0981123456):
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0981123456"
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            💬 Mensaje de prueba:
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            📎 Archivo (PDF, imagen, documento):
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.png,.txt"
            className="w-full p-3 border rounded-lg"
          />
        </div>
      </div>

      {/* Botones de prueba */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testSendMessage}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-3 rounded-lg disabled:opacity-50 hover:bg-blue-600"
        >
          {loading ? "⏳" : "💬"} Solo Mensaje
        </button>

        <button
          onClick={testSendFile}
          disabled={loading || !file}
          className="bg-green-500 text-white px-4 py-3 rounded-lg disabled:opacity-50 hover:bg-green-600"
        >
          {loading ? "⏳" : "📎"} Solo Archivo
        </button>

        <button
          onClick={testSendBoth}
          disabled={loading || !file}
          className="bg-purple-500 text-white px-4 py-3 rounded-lg disabled:opacity-50 hover:bg-purple-600"
        >
          {loading ? "⏳" : "🚀"} Mensaje + Archivo
        </button>
      </div>

      {/* Botón de debug separado */}
      <div className="mb-6">
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }
            if (!file) {
              setStatus('❌ Selecciona un archivo');
              return;
            }

            setLoading(true);
            setStatus('🔍 Ejecutando diagnóstico profundo...');

            try {
              const base64Data = await convertFileToBase64(file);
              
              const response = await fetch('/api/whatsapp/debug-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone,
                  filename: file.name,
                  data: base64Data,
                  mimetype: file.type || 'application/octet-stream'
                })
              });

              const result = await response.json();
              setStatus(`🔍 Debug completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error en debug: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !file}
          className="bg-orange-500 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-orange-600 text-lg font-bold w-full"
        >
          {loading ? '⏳ Diagnosticando...' : '🔍 DIAGNÓSTICO PROFUNDO'}
        </button>
        
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }

            setLoading(true);
            setStatus('🔍 Ejecutando debug específico de archivos...');

            try {
              const response = await fetch('/api/whatsapp/debug-files', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone
                })
              });

              const result = await response.json();
              setStatus(`🔍 Debug de archivos completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error en debug de archivos: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="bg-red-500 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-red-600 text-lg font-bold w-full mt-4"
        >
          {loading ? '⏳ Debuggeando archivos...' : '🐛 DEBUG ESPECÍFICO DE ARCHIVOS'}
        </button>
        
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }
            if (!file) {
              setStatus('❌ Selecciona un archivo');
              return;
            }

            setLoading(true);
            setStatus('🧪 Probando código exacto del Discord...');

            try {
              const base64Data = await convertFileToBase64(file);
              
              const response = await fetch('/api/whatsapp/test-simple', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone,
                  filename: file.name,
                  data: base64Data
                })
              });

              const result = await response.json();
              setStatus(`🧪 Test simple completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error en test simple: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !file}
          className="bg-yellow-500 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-yellow-600 text-lg font-bold w-full mt-4"
        >
          {loading ? '⏳ Probando...' : '💬 CÓDIGO EXACTO DEL DISCORD'}
        </button>
        
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }
            if (!file) {
              setStatus('❌ Selecciona un archivo');
              return;
            }

            setLoading(true);
            setStatus('🔵 Probando con WPPConnect...');

            try {
              const base64Data = await convertFileToBase64(file);
              
              const response = await fetch('/api/whatsapp/send-wpp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone,
                  message: `🔵 Prueba con WPPConnect - ${file.name}`,
                  filename: file.name,
                  data: base64Data,
                  mimetype: file.type || 'application/octet-stream'
                })
              });

              const result = await response.json();
              setStatus(`🔵 WPPConnect completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error con WPPConnect: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !file}
          className="bg-blue-600 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-blue-700 text-lg font-bold w-full mt-4"
        >
          {loading ? '⏳ Probando WPP...' : '🔵 PROBAR CON WPPCONNECT'}
        </button>
        
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }

            setLoading(true);
            setStatus('📁 Probando PDF desde sistema de archivos...');

            try {
              const response = await fetch('/api/whatsapp/test-file-system', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone
                })
              });

              const result = await response.json();
              setStatus(`📁 Test file system completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error con file system: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="bg-orange-600 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-orange-700 text-lg font-bold w-full mt-4"
        >
          {loading ? '⏳ Probando archivo...' : '📁 PDF DESDE SERVIDOR'}
        </button>
        
        <button
          onClick={async () => {
            if (!phone.trim()) {
              setStatus('❌ Ingresa un número de teléfono');
              return;
            }

            setLoading(true);
            setStatus('🧪 Probando código EXACTO de Claude con archivo local...');

            try {
              const response = await fetch('/api/whatsapp/test-claude', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: phone
                })
              });

              const result = await response.json();
              setStatus(`🧪 Test Claude completado:\n${JSON.stringify(result, null, 2)}`);
            } catch (error) {
              setStatus(`❌ Error con Claude: ${error}`);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-4 rounded-lg disabled:opacity-50 hover:bg-purple-700 text-lg font-bold w-full mt-4"
        >
          {loading ? '⏳ Probando Claude...' : '🤖 CÓDIGO EXACTO DE CLAUDE'}
        </button>
      </div>

      {/* Estado */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Estado:</h3>
        <pre className="text-sm whitespace-pre-wrap">
          {status ||
            "Listo para probar. Configura los datos arriba y haz clic en un botón."}
        </pre>
      </div>

      {/* Información del archivo */}
      {file && (
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">📎 Archivo seleccionado:</h3>
          <ul className="text-sm space-y-1">
            <li>
              <strong>Nombre:</strong> {file.name}
            </li>
            <li>
              <strong>Tamaño:</strong> {(file.size / 1024).toFixed(2)} KB
            </li>
            <li>
              <strong>Tipo:</strong> {file.type || "Desconocido"}
            </li>
            <li>
              <strong>Última modificación:</strong>{" "}
              {new Date(file.lastModified).toLocaleString()}
            </li>
          </ul>
        </div>
      )}

      {/* Instrucciones */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">📋 Instrucciones:</h3>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Asegúrate de que WhatsApp esté inicializado y conectado</li>
          <li>Ingresa tu número de teléfono</li>
          <li>Selecciona un archivo de prueba</li>
          <li>Prueba cada botón por separado</li>
          <li>Verifica en tu WhatsApp qué llega y qué no</li>
        </ol>
      </div>
    </div>
  );
}
