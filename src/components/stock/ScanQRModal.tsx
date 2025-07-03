'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Camera, Type, Search } from 'lucide-react'

interface ScanQRModalProps {
  isOpen: boolean
  onClose: () => void
  onCodeScanned: (code: string) => void
}

export function ScanQRModal({ isOpen, onClose, onCodeScanned }: ScanQRModalProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera')
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)

  if (!isOpen) return null

  const handleStartScan = () => {
    setScanning(true)
    
    // Simular escaneo (en una implementación real usarías una librería como QuaggaJS o ZXing)
    setTimeout(() => {
      const simulatedCodes = [
        'ARES-ULT-DS45-001',
        'ARES-CM-SLIM-002',
        'ARES-HYDRA-PRO-003',
        'ARES-VENUS-CART-004'
      ]
      
      const randomCode = simulatedCodes[Math.floor(Math.random() * simulatedCodes.length)]
      setScanning(false)
      onCodeScanned(randomCode)
      onClose()
    }, 3000)
  }

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      onCodeScanned(manualCode.trim())
      setManualCode('')
      onClose()
    }
  }

  const handleStopScan = () => {
    setScanning(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Escanear Código QR</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={mode === 'camera' ? 'default' : 'outline'}
            onClick={() => setMode('camera')}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Cámara
          </Button>
          <Button
            variant={mode === 'manual' ? 'default' : 'outline'}
            onClick={() => setMode('manual')}
            className="flex-1"
          >
            <Type className="h-4 w-4 mr-2" />
            Manual
          </Button>
        </div>

        {/* Camera Mode */}
        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              {scanning ? (
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg animate-pulse"></div>
                    <div className="absolute inset-2 border-2 border-blue-300 rounded-lg animate-pulse animation-delay-300"></div>
                    <div className="absolute inset-4 border-2 border-blue-200 rounded-lg animate-pulse animation-delay-600"></div>
                  </div>
                  <p className="text-sm text-gray-600">🔍 Escaneando...</p>
                  <p className="text-xs text-gray-500 mt-1">Apunta la cámara al código QR</p>
                </div>
              ) : (
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">📱 Listo para escanear</p>
                  <p className="text-xs text-gray-500 mt-1">Posiciona el QR en el centro</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!scanning ? (
                <Button onClick={handleStartScan} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Escaneo
                </Button>
              ) : (
                <Button onClick={handleStopScan} variant="outline" className="flex-1">
                  Detener
                </Button>
              )}
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                💡 En una implementación real, esto activaría la cámara del dispositivo
              </p>
            </div>
          </div>
        )}

        {/* Manual Mode */}
        {mode === 'manual' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Ingresa el código manualmente:
              </label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej: ARES-ULT-DS45-001"
                className="font-mono"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit()
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleManualSubmit} 
              className="w-full"
              disabled={!manualCode.trim()}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar Producto
            </Button>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">
                <strong>💡 Códigos de ejemplo:</strong>
              </p>
              <div className="space-y-1 text-xs text-blue-700 font-mono">
                <p>• ARES-ULT-DS45-001</p>
                <p>• ARES-CM-SLIM-002</p>
                <p>• ARES-HYDRA-PRO-003</p>
                <p>• ARES-VENUS-CART-004</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">📋 Instrucciones:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Los códigos QR contienen información del producto</li>
            <li>• Formato: ARES-[CÓDIGO-ITEM]</li>
            <li>• Una vez escaneado, se mostrará la información completa</li>
            {mode === 'camera' && (
              <li>• 📷 Asegúrate de tener buena iluminación</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
} 