'use client';

import { useParams } from 'next/navigation';
import { RepuestoDetail } from '@/components/repuestos/RepuestoDetail';

export default function RepuestoDetailPage() {
  const params = useParams();
  const repuestoId = params.id as string;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Detalle del Repuesto</h1>
      </div>
      
      <RepuestoDetail repuestoId={repuestoId} />
    </div>
  );
}