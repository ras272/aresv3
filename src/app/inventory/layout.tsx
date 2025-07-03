import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ARES - Sistema de Inventario',
  description: 'Sistema de gestión de inventario tipo Sortly para ARES Paraguay',
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 