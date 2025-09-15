-- ===============================================
-- CREAR ENUMS PARA SISTEMA DE STOCK
-- ===============================================

DO $$ BEGIN
    CREATE TYPE tipo_ubicacion AS ENUM ('Almacen', 'Estante', 'Contenedor', 'Area', 'Equipo', 'Taller');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_ubicacion AS ENUM ('Activa', 'Inactiva', 'Mantenimiento');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_stock AS ENUM ('Disponible', 'Reservado', 'En_uso', 'Dañado', 'Vencido');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_movimiento_stock AS ENUM ('Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Asignacion');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;;
