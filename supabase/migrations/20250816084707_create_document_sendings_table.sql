-- Tabla para registrar envíos de documentos por WhatsApp
CREATE TABLE IF NOT EXISTS document_sendings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES mantenimientos(id) ON DELETE CASCADE,
  client_phone VARCHAR(20) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  sent_documents JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_document_sendings_ticket_id ON document_sendings(ticket_id);
CREATE INDEX IF NOT EXISTS idx_document_sendings_sent_at ON document_sendings(sent_at);
CREATE INDEX IF NOT EXISTS idx_document_sendings_success ON document_sendings(success);

-- Comentarios para documentación
COMMENT ON TABLE document_sendings IS 'Registro de envíos de documentos por WhatsApp a clientes';
COMMENT ON COLUMN document_sendings.ticket_id IS 'ID del ticket asociado';
COMMENT ON COLUMN document_sendings.client_phone IS 'Número de teléfono del cliente (formato internacional)';
COMMENT ON COLUMN document_sendings.sent_at IS 'Fecha y hora del envío';
COMMENT ON COLUMN document_sendings.success IS 'Indica si el envío fue exitoso';
COMMENT ON COLUMN document_sendings.error_message IS 'Mensaje de error en caso de fallo';
COMMENT ON COLUMN document_sendings.sent_documents IS 'Lista de documentos enviados (JSON)';;
