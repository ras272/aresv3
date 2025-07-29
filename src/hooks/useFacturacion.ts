import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Cliente, ProductoFactura, Factura } from '@/types/facturacion';

// Clientes de ejemplo
const clientesEjemplo: Cliente[] = [
    {
        id: '1',
        ruc: '80012345-1',
        razonSocial: 'Clínica San Rafael S.A.',
        nombreFantasia: 'Clínica San Rafael',
        direccion: 'Av. España 1234, Asunción',
        telefono: '021-123456',
        email: 'facturacion@sanrafael.com.py',
        tipoContribuyente: 'persona_juridica'
    },
    {
        id: '2',
        ruc: '12345678-9',
        razonSocial: 'Centro Médico Integral',
        nombreFantasia: 'CMI',
        direccion: 'Calle Palma 567, Asunción',
        telefono: '021-654321',
        email: 'admin@cmi.com.py',
        tipoContribuyente: 'persona_juridica'
    },
    {
        id: '3',
        ruc: '87654321-0',
        razonSocial: 'Dr. María González',
        direccion: 'Av. Mariscal López 890, Asunción',
        telefono: '021-987654',
        email: 'maria.gonzalez@email.com',
        tipoContribuyente: 'persona_fisica'
    }
];

export function useFacturacion() {
    const [loading, setLoading] = useState(false);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    // Cargar clientes
    const cargarClientes = useCallback(() => {
        setClientes(clientesEjemplo);
    }, []);

    // Calcular totales de productos
    const calcularTotales = useCallback((productos: ProductoFactura[]) => {
        const subtotal = productos.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
        const totalDescuentos = productos.reduce((sum, p) => sum + p.descuento, 0);

        let totalImpuestos = 0;
        productos.forEach(p => {
            const baseImponible = (p.cantidad * p.precioUnitario) - p.descuento;
            switch (p.impuesto) {
                case 'iva_5':
                    totalImpuestos += baseImponible * 0.05;
                    break;
                case 'iva_10':
                    totalImpuestos += baseImponible * 0.10;
                    break;
                default:
                    break;
            }
        });

        const total = subtotal - totalDescuentos + totalImpuestos;

        return {
            subtotal: subtotal - totalDescuentos,
            totalDescuentos,
            totalImpuestos,
            total
        };
    }, []);

    // Formatear moneda
    const formatearMoneda = useCallback((monto: number) => {
        return new Intl.NumberFormat('es-PY', {
            style: 'currency',
            currency: 'PYG',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monto);
    }, []);

    // Generar número de factura
    const generarNumeroFactura = useCallback(() => {
        const serie = '001-001';
        const numero = (facturas.length + 1).toString().padStart(7, '0');
        return `${serie}-${numero}`;
    }, [facturas.length]);

    // Crear factura
    const crearFactura = useCallback(async (
        cliente: Cliente,
        productos: ProductoFactura[],
        observaciones?: string
    ) => {
        setLoading(true);

        try {
            const totales = calcularTotales(productos);

            const nuevaFactura: Factura = {
                id: Date.now().toString(),
                numero: generarNumeroFactura(),
                serie: '001-001',
                fecha: new Date(),
                cliente,
                productos,
                subtotal: totales.subtotal,
                totalDescuentos: totales.totalDescuentos,
                totalImpuestos: totales.totalImpuestos,
                total: totales.total,
                estado: 'borrador',
                observaciones
            };

            setFacturas(prev => [...prev, nuevaFactura]);
            toast.success('Factura creada exitosamente');

            return nuevaFactura;
        } catch (error) {
            toast.error('Error al crear la factura');
            throw error;
        } finally {
            setLoading(false);
        }
    }, [calcularTotales, generarNumeroFactura]);

    // Emitir factura
    const emitirFactura = useCallback(async (factura: Factura) => {
        setLoading(true);

        try {
            // Simular proceso de emisión
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generar CDC simulado
            const cdc = 'DE' + Date.now().toString() + Math.random().toString(36).substr(2, 9).toUpperCase();

            const facturaEmitida: Factura = {
                ...factura,
                estado: 'emitida',
                cdc
            };

            setFacturas(prev =>
                prev.map(f => f.id === factura.id ? facturaEmitida : f)
            );

            toast.success('Factura emitida exitosamente');
            return facturaEmitida;
        } catch (error) {
            toast.error('Error al emitir la factura');
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        facturas,
        clientes,
        setFacturas,
        cargarClientes,
        calcularTotales,
        formatearMoneda,
        crearFactura,
        emitirFactura
    };
}