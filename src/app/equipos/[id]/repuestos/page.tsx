'use client';

import { useParams } from 'next/navigation';
import { RepuestosEquipoSummary } from '@/components/repuestos/RepuestosEquipoSummary';

export default function EquipoRepuestosPage() {
  const params = useParams();
  const equipoId = params.id as string;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Repuestos del Equipo</h1>
      </div>
      
      <RepuestosEquipoSummary equipoId={equipoId} />
    </div>
  );
}