-- ======================================================
-- FUNCIONES: Sistema de Fraccionamiento de Productos
-- Fecha: 2025-01-21
-- Descripción: Funciones para manejar el fraccionamiento
-- ======================================================

-- 1. Función para calcular stock disponible con fraccionamiento
CREATE OR REPLACE FUNCTION calcular_stock_disponible(
    p_stock_item_id UUID
) RETURNS TABLE (
    cajas_completas INTEGER,
    unidades_sueltas INTEGER,
    unidades_totales INTEGER,
    permite_fraccionamiento BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.cajas_completas,
        si.unidades_sueltas,
        (si.cajas_completas * si.unidades_por_paquete) + si.unidades_sueltas AS unidades_totales,
        si.permite_fraccionamiento
    FROM stock_items si
    WHERE si.id = p_stock_item_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Función para abrir una caja y convertirla en unidades sueltas
CREATE OR REPLACE FUNCTION abrir_caja_para_fraccionamiento(
    p_stock_item_id UUID,
    p_usuario VARCHAR(255),
    p_motivo TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_stock_item RECORD;
    v_resultado JSONB;
BEGIN
    -- Obtener información del item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id
    FOR UPDATE;
    
    -- Validaciones
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item de stock no encontrado'
        );
    END IF;
    
    IF NOT v_stock_item.permite_fraccionamiento THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Este producto no permite fraccionamiento'
        );
    END IF;
    
    IF v_stock_item.cajas_completas <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'No hay cajas completas disponibles para abrir'
        );
    END IF;
    
    -- Actualizar stock: reducir cajas y aumentar unidades sueltas
    UPDATE stock_items
    SET 
        cajas_completas = cajas_completas - 1,
        unidades_sueltas = unidades_sueltas + unidades_por_paquete,
        updated_at = NOW()
    WHERE id = p_stock_item_id;
    
    -- Registrar en stock_cajas_abiertas
    INSERT INTO stock_cajas_abiertas (
        stock_item_id,
        unidades_restantes,
        factor_original,
        presentacion_nombre,
        abierto_por,
        motivo_apertura,
        numero_caja_original
    ) VALUES (
        p_stock_item_id,
        v_stock_item.unidades_por_paquete,
        v_stock_item.unidades_por_paquete,
        'Caja',
        p_usuario,
        p_motivo,
        v_stock_item.cajas_completas
    );
    
    -- Registrar movimiento
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        descripcion,
        usuario_responsable,
        tipo_unidad_movimiento,
        cajas_afectadas,
        unidades_sueltas_afectadas,
        producto_nombre,
        producto_marca,
        producto_modelo,
        codigo_item
    ) VALUES (
        p_stock_item_id,
        'Ajuste',
        v_stock_item.unidades_por_paquete,
        v_stock_item.cantidad_actual,
        v_stock_item.cantidad_actual,
        'Fraccionamiento',
        'Apertura de caja para venta fraccionada',
        p_usuario,
        'caja',
        -1,
        v_stock_item.unidades_por_paquete,
        v_stock_item.nombre,
        v_stock_item.marca,
        v_stock_item.modelo,
        v_stock_item.codigo_item
    );
    
    v_resultado := jsonb_build_object(
        'success', true,
        'message', 'Caja abierta exitosamente',
        'cajas_restantes', v_stock_item.cajas_completas - 1,
        'unidades_disponibles', v_stock_item.unidades_sueltas + v_stock_item.unidades_por_paquete
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 3. Función para procesar venta con fraccionamiento
CREATE OR REPLACE FUNCTION procesar_venta_fraccionada(
    p_stock_item_id UUID,
    p_cantidad_solicitada INTEGER,
    p_tipo_venta VARCHAR(50), -- 'caja' o 'unidad'
    p_usuario VARCHAR(255),
    p_referencia VARCHAR(255) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_stock_item RECORD;
    v_unidades_a_descontar INTEGER;
    v_cajas_a_descontar INTEGER := 0;
    v_unidades_sueltas_a_descontar INTEGER := 0;
    v_resultado JSONB;
BEGIN
    -- Obtener información del item
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id
    FOR UPDATE;
    
    -- Validaciones básicas
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Item de stock no encontrado'
        );
    END IF;
    
    -- Calcular unidades totales a descontar
    IF p_tipo_venta = 'caja' THEN
        v_unidades_a_descontar := p_cantidad_solicitada * v_stock_item.unidades_por_paquete;
        v_cajas_a_descontar := p_cantidad_solicitada;
        
        -- Verificar disponibilidad de cajas
        IF v_stock_item.cajas_completas < p_cantidad_solicitada THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Solo hay %s caja(s) disponible(s)', v_stock_item.cajas_completas)
            );
        END IF;
    ELSE -- venta por unidades
        v_unidades_a_descontar := p_cantidad_solicitada;
        
        -- Verificar disponibilidad total
        IF ((v_stock_item.cajas_completas * v_stock_item.unidades_por_paquete) + 
            v_stock_item.unidades_sueltas) < p_cantidad_solicitada THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', format('Stock insuficiente. Disponible: %s unidades totales',
                    (v_stock_item.cajas_completas * v_stock_item.unidades_por_paquete) + v_stock_item.unidades_sueltas)
            );
        END IF;
        
        -- Calcular de dónde sacar las unidades
        IF v_stock_item.unidades_sueltas >= p_cantidad_solicitada THEN
            -- Alcanza con las unidades sueltas
            v_unidades_sueltas_a_descontar := p_cantidad_solicitada;
        ELSE
            -- Necesitamos abrir cajas
            v_unidades_sueltas_a_descontar := v_stock_item.unidades_sueltas;
            v_unidades_a_descontar := p_cantidad_solicitada - v_stock_item.unidades_sueltas;
            
            -- Calcular cuántas cajas abrir
            v_cajas_a_descontar := CEIL(v_unidades_a_descontar::NUMERIC / v_stock_item.unidades_por_paquete);
            
            -- Las unidades sobrantes se agregan a unidades sueltas
            v_unidades_sueltas_a_descontar := p_cantidad_solicitada - 
                (v_cajas_a_descontar * v_stock_item.unidades_por_paquete - v_stock_item.unidades_sueltas);
        END IF;
    END IF;
    
    -- Actualizar stock
    UPDATE stock_items
    SET 
        cajas_completas = cajas_completas - v_cajas_a_descontar,
        unidades_sueltas = CASE 
            WHEN p_tipo_venta = 'caja' THEN unidades_sueltas
            ELSE unidades_sueltas - v_unidades_sueltas_a_descontar + 
                 (v_cajas_a_descontar * unidades_por_paquete - 
                  (p_cantidad_solicitada - v_stock_item.unidades_sueltas))
        END,
        cantidad_actual = cantidad_actual - 
            (v_cajas_a_descontar * unidades_por_paquete + 
             CASE WHEN p_tipo_venta = 'unidad' THEN v_unidades_sueltas_a_descontar ELSE 0 END),
        updated_at = NOW()
    WHERE id = p_stock_item_id;
    
    -- Registrar movimiento
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        descripcion,
        usuario_responsable,
        referencia_externa,
        tipo_unidad_movimiento,
        cajas_afectadas,
        unidades_sueltas_afectadas,
        producto_nombre,
        producto_marca,
        producto_modelo,
        codigo_item
    ) VALUES (
        p_stock_item_id,
        'Salida',
        CASE 
            WHEN p_tipo_venta = 'caja' THEN p_cantidad_solicitada 
            ELSE p_cantidad_solicitada 
        END,
        v_stock_item.cantidad_actual,
        v_stock_item.cantidad_actual - v_unidades_a_descontar,
        'Venta',
        format('Venta de %s %s', p_cantidad_solicitada, p_tipo_venta),
        p_usuario,
        p_referencia,
        p_tipo_venta,
        v_cajas_a_descontar,
        v_unidades_sueltas_a_descontar,
        v_stock_item.nombre,
        v_stock_item.marca,
        v_stock_item.modelo,
        v_stock_item.codigo_item
    );
    
    -- Preparar resultado
    SELECT * INTO v_stock_item
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'message', format('Venta procesada: %s %s', p_cantidad_solicitada, p_tipo_venta),
        'stock_restante', jsonb_build_object(
            'cajas_completas', v_stock_item.cajas_completas,
            'unidades_sueltas', v_stock_item.unidades_sueltas,
            'unidades_totales', (v_stock_item.cajas_completas * v_stock_item.unidades_por_paquete) + v_stock_item.unidades_sueltas
        ),
        'movimiento', jsonb_build_object(
            'cajas_vendidas', v_cajas_a_descontar,
            'unidades_sueltas_vendidas', v_unidades_sueltas_a_descontar
        )
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 4. Función para procesar ingreso de mercadería con fraccionamiento
CREATE OR REPLACE FUNCTION procesar_ingreso_fraccionado(
    p_producto_carga_id UUID,
    p_cantidad_cajas INTEGER,
    p_unidades_por_caja INTEGER,
    p_permite_fraccionamiento BOOLEAN,
    p_usuario VARCHAR(255) DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_producto_carga RECORD;
    v_stock_item_id UUID;
    v_resultado JSONB;
BEGIN
    -- Obtener información del producto de carga
    SELECT * INTO v_producto_carga
    FROM productos_carga
    WHERE id = p_producto_carga_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Producto de carga no encontrado'
        );
    END IF;
    
    -- Actualizar producto_carga con información de fraccionamiento
    UPDATE productos_carga
    SET 
        unidades_por_paquete = p_unidades_por_caja,
        permite_fraccionamiento = p_permite_fraccionamiento,
        updated_at = NOW()
    WHERE id = p_producto_carga_id;
    
    -- Verificar si ya existe un stock_item para este producto
    SELECT id INTO v_stock_item_id
    FROM stock_items
    WHERE producto_carga_id = p_producto_carga_id
    LIMIT 1;
    
    IF v_stock_item_id IS NULL THEN
        -- Crear nuevo stock_item
        INSERT INTO stock_items (
            producto_carga_id,
            codigo_item,
            nombre,
            marca,
            modelo,
            numero_serie,
            cajas_completas,
            unidades_sueltas,
            cantidad_actual,
            unidades_por_paquete,
            permite_fraccionamiento,
            estado,
            fecha_ingreso,
            codigo_carga_origen
        ) VALUES (
            p_producto_carga_id,
            'STK-' || substring(gen_random_uuid()::text from 1 for 8),
            v_producto_carga.producto,
            v_producto_carga.marca,
            v_producto_carga.modelo,
            v_producto_carga.numero_serie,
            p_cantidad_cajas,
            0,
            p_cantidad_cajas * p_unidades_por_caja,
            p_unidades_por_caja,
            p_permite_fraccionamiento,
            'Disponible',
            CURRENT_DATE,
            (SELECT codigo_carga FROM cargas_mercaderia WHERE id = v_producto_carga.carga_id)
        ) RETURNING id INTO v_stock_item_id;
    ELSE
        -- Actualizar stock_item existente
        UPDATE stock_items
        SET 
            cajas_completas = cajas_completas + p_cantidad_cajas,
            cantidad_actual = cantidad_actual + (p_cantidad_cajas * p_unidades_por_caja),
            unidades_por_paquete = p_unidades_por_caja,
            permite_fraccionamiento = p_permite_fraccionamiento,
            updated_at = NOW()
        WHERE id = v_stock_item_id;
    END IF;
    
    -- Registrar movimiento de entrada
    INSERT INTO movimientos_stock (
        stock_item_id,
        tipo_movimiento,
        cantidad,
        cantidad_anterior,
        cantidad_nueva,
        motivo,
        descripcion,
        usuario_responsable,
        tipo_unidad_movimiento,
        cajas_afectadas,
        producto_nombre,
        producto_marca,
        producto_modelo
    ) VALUES (
        v_stock_item_id,
        'Entrada',
        p_cantidad_cajas * p_unidades_por_caja,
        COALESCE((SELECT cantidad_actual FROM stock_items WHERE id = v_stock_item_id) - (p_cantidad_cajas * p_unidades_por_caja), 0),
        (SELECT cantidad_actual FROM stock_items WHERE id = v_stock_item_id),
        'Ingreso de mercadería',
        format('Ingreso de %s cajas de %s unidades c/u', p_cantidad_cajas, p_unidades_por_caja),
        p_usuario,
        'caja',
        p_cantidad_cajas,
        v_producto_carga.producto,
        v_producto_carga.marca,
        v_producto_carga.modelo
    );
    
    -- Si permite fraccionamiento, crear presentaciones
    IF p_permite_fraccionamiento THEN
        -- Verificar si ya existen presentaciones
        IF NOT EXISTS (
            SELECT 1 FROM producto_presentaciones 
            WHERE stock_item_id = v_stock_item_id
        ) THEN
            -- Crear presentación por caja
            INSERT INTO producto_presentaciones (
                stock_item_id,
                nombre,
                factor_conversion,
                es_default
            ) VALUES (
                v_stock_item_id,
                'Caja',
                p_unidades_por_caja,
                true
            );
            
            -- Crear presentación por unidad
            INSERT INTO producto_presentaciones (
                stock_item_id,
                nombre,
                factor_conversion,
                es_default
            ) VALUES (
                v_stock_item_id,
                'Unidad',
                1,
                false
            );
        END IF;
    END IF;
    
    v_resultado := jsonb_build_object(
        'success', true,
        'message', format('Ingreso procesado: %s cajas de %s unidades', p_cantidad_cajas, p_unidades_por_caja),
        'stock_item_id', v_stock_item_id,
        'stock_actual', jsonb_build_object(
            'cajas_completas', (SELECT cajas_completas FROM stock_items WHERE id = v_stock_item_id),
            'unidades_totales', (SELECT cantidad_actual FROM stock_items WHERE id = v_stock_item_id)
        )
    );
    
    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;

-- 5. Función helper para obtener stock formateado
CREATE OR REPLACE FUNCTION obtener_stock_formateado(
    p_stock_item_id UUID
) RETURNS TEXT AS $$
DECLARE
    v_stock RECORD;
    v_formato TEXT;
BEGIN
    SELECT * INTO v_stock
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RETURN 'Item no encontrado';
    END IF;
    
    IF v_stock.permite_fraccionamiento THEN
        IF v_stock.cajas_completas > 0 AND v_stock.unidades_sueltas > 0 THEN
            v_formato := format('%s caja(s) + %s unidad(es) [Total: %s u]', 
                v_stock.cajas_completas, 
                v_stock.unidades_sueltas,
                (v_stock.cajas_completas * v_stock.unidades_por_paquete) + v_stock.unidades_sueltas);
        ELSIF v_stock.cajas_completas > 0 THEN
            v_formato := format('%s caja(s) [%s unidades]', 
                v_stock.cajas_completas,
                v_stock.cajas_completas * v_stock.unidades_por_paquete);
        ELSIF v_stock.unidades_sueltas > 0 THEN
            v_formato := format('%s unidad(es) suelta(s)', v_stock.unidades_sueltas);
        ELSE
            v_formato := 'Sin stock';
        END IF;
    ELSE
        v_formato := format('%s unidad(es)', v_stock.cantidad_actual);
    END IF;
    
    RETURN v_formato;
END;
$$ LANGUAGE plpgsql;

-- 6. Función para validar disponibilidad antes de venta
CREATE OR REPLACE FUNCTION validar_disponibilidad_venta(
    p_stock_item_id UUID,
    p_cantidad INTEGER,
    p_tipo_venta VARCHAR(50) -- 'caja' o 'unidad'
) RETURNS JSONB AS $$
DECLARE
    v_stock RECORD;
    v_disponible BOOLEAN := false;
    v_unidades_necesarias INTEGER;
    v_unidades_disponibles INTEGER;
BEGIN
    SELECT * INTO v_stock
    FROM stock_items
    WHERE id = p_stock_item_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'disponible', false,
            'error', 'Producto no encontrado'
        );
    END IF;
    
    -- Calcular unidades disponibles
    v_unidades_disponibles := (v_stock.cajas_completas * v_stock.unidades_por_paquete) + v_stock.unidades_sueltas;
    
    IF p_tipo_venta = 'caja' THEN
        v_unidades_necesarias := p_cantidad * v_stock.unidades_por_paquete;
        v_disponible := v_stock.cajas_completas >= p_cantidad;
        
        IF NOT v_disponible THEN
            RETURN jsonb_build_object(
                'disponible', false,
                'error', format('Solo hay %s caja(s) disponible(s)', v_stock.cajas_completas),
                'stock_actual', jsonb_build_object(
                    'cajas', v_stock.cajas_completas,
                    'unidades_sueltas', v_stock.unidades_sueltas,
                    'unidades_totales', v_unidades_disponibles
                )
            );
        END IF;
    ELSE -- unidad
        v_unidades_necesarias := p_cantidad;
        v_disponible := v_unidades_disponibles >= p_cantidad;
        
        IF NOT v_disponible THEN
            RETURN jsonb_build_object(
                'disponible', false,
                'error', format('Solo hay %s unidad(es) disponible(s)', v_unidades_disponibles),
                'stock_actual', jsonb_build_object(
                    'cajas', v_stock.cajas_completas,
                    'unidades_sueltas', v_stock.unidades_sueltas,
                    'unidades_totales', v_unidades_disponibles
                )
            );
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'disponible', true,
        'mensaje', 'Stock suficiente',
        'stock_actual', jsonb_build_object(
            'cajas', v_stock.cajas_completas,
            'unidades_sueltas', v_stock.unidades_sueltas,
            'unidades_totales', v_unidades_disponibles
        ),
        'despues_venta', jsonb_build_object(
            'unidades_restantes', v_unidades_disponibles - v_unidades_necesarias
        )
    );
END;
$$ LANGUAGE plpgsql;
