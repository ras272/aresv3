'use client'

import { Button } from '@/components/ui/button'
import { X, Download, Printer, Share2 } from 'lucide-react'

interface StockItem {
  id: string
  codigo_item: string
  nombre: string
  marca: string
  modelo: string
  numero_serie?: string
  cantidad_actual: number
}

interface QRModalProps {
  item: StockItem | null
  isOpen: boolean
  onClose: () => void
}

export function QRModal({ item, isOpen, onClose }: QRModalProps) {
  if (!item || !isOpen) return null

  // Generar URL del QR (usando un servicio gratuito)
  const qrData = `ARES-${item.codigo_item}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `QR_${item.codigo_item}.png`
    link.click()
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${item.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              .qr-container { margin: 20px auto; }
              .item-info { margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="item-info">
              <h2>${item.nombre}</h2>
              <p>Código: ${item.codigo_item}</p>
              <p>Marca: ${item.marca} ${item.modelo}</p>
              ${item.numero_serie ? `<p>Serie: ${item.numero_serie}</p>` : ''}
            </div>
            <div class="qr-container">
              <img src="${qrUrl}" alt="QR Code" />
            </div>
            <p>Stock actual: ${item.cantidad_actual} unidades</p>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${item.nombre}`,
          text: `Código QR para ${item.nombre} (${item.codigo_item})`,
          url: qrUrl
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(qrUrl).then(() => {
        alert('✅ URL del QR copiada al portapapeles')
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Código QR</h3>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Item Info */}
        <div className="text-center mb-6">
          <h4 className="font-semibold text-lg mb-2">{item.nombre}</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Código:</strong> {item.codigo_item}</p>
            <p><strong>Marca:</strong> {item.marca} {item.modelo}</p>
            {item.numero_serie && (
              <p><strong>Serie:</strong> {item.numero_serie}</p>
            )}
            <p><strong>Stock:</strong> {item.cantidad_actual} unidades</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 border-2 border-gray-200 rounded-lg bg-white">
            <img 
              src={qrUrl} 
              alt={`QR Code for ${item.nombre}`}
              className="w-64 h-64"
            />
          </div>
        </div>

        {/* Data */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
            {qrData}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir
          </Button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            🔍 Escanea este código para acceder rápidamente a la información del producto
          </p>
        </div>
      </div>
    </div>
  )
} 