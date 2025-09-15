import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { ProductoRemision } from "@/types";

interface ProductoRandomFormProps {
  onAgregarProducto: (producto: any) => void;
  productosExistentes: ProductoRemision[];
}

export function ProductoRandomForm({ onAgregarProducto, productosExistentes }: ProductoRandomFormProps) {
  const [nombre, setNombre] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      toast.error("El nombre del producto es requerido");
      return;
    }
    
    // Verificar si el producto ya existe
    const yaExiste = productosExistentes.some(
      p => p.nombre === nombre && p.marca === marca && p.modelo === modelo
    );
    
    if (yaExiste) {
      toast.error("Este producto ya está agregado a la remisión");
      return;
    }
    
    const nuevoProducto = {
      id: Date.now().toString(),
      componenteId: null, // Asegurar que siempre tenga componenteId
      stockItemId: null, // Asegurar que siempre tenga stockItemId
      origen: "stock", // Especificar origen para productos random
      nombre: nombre.trim() || "Producto sin nombre",
      marca: marca.trim() || "",
      modelo: modelo.trim() || "",
      numeroSerie: numeroSerie.trim() || undefined,
      cantidadSolicitada: Math.max(1, cantidad), // Asegurar que sea al menos 1
      cantidadDisponible: 0,
      observaciones: observaciones.trim() || undefined,
    };
    
    onAgregarProducto(nuevoProducto);
    
    // Limpiar formulario
    setNombre("");
    setMarca("");
    setModelo("");
    setNumeroSerie("");
    setCantidad(1);
    setObservaciones("");
    
    toast.success("Producto agregado exitosamente");
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre del Producto</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: item 123"
            required
          />
        </div>
        <div>
          <Label htmlFor="marca">Marca</Label>
          <Input
            id="marca"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Ej: Ares"
          />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input
            id="modelo"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Ej: 123"
          />
        </div>
        <div>
          <Label htmlFor="numeroSerie">Número de Serie</Label>
          <Input
            id="numeroSerie"
            value={numeroSerie}
            onChange={(e) => setNumeroSerie(e.target.value)}
            placeholder="12345"
          />
        </div>
        <div>
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="observaciones">Observaciones</Label>
        <Textarea
          id="observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          placeholder="Detalles adicionales del producto o servicio..."
          rows={2}
        />
      </div>
      <Button type="submit" className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Agregar a la Remisión
      </Button>
    </form>
  );
}