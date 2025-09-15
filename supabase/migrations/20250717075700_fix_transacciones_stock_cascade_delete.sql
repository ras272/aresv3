-- Drop the existing foreign key constraint
ALTER TABLE transacciones_stock 
DROP CONSTRAINT IF EXISTS transacciones_stock_componente_id_fkey;

-- Add the foreign key constraint with CASCADE DELETE
ALTER TABLE transacciones_stock 
ADD CONSTRAINT transacciones_stock_componente_id_fkey 
FOREIGN KEY (componente_id) 
REFERENCES componentes_disponibles(id) 
ON DELETE CASCADE;;
