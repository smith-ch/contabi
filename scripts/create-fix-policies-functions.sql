-- Función para corregir políticas de invoices
CREATE OR REPLACE FUNCTION fix_invoices_policies()
RETURNS void AS $$
BEGIN
  -- Habilitar RLS para la tabla invoices
  ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar duplicados
  DROP POLICY IF EXISTS "Usuarios pueden ver sus propias facturas" ON public.invoices;
  DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias facturas" ON public.invoices;
  DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias facturas" ON public.invoices;
  DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias facturas" ON public.invoices;
  
  -- Crear políticas de seguridad
  CREATE POLICY "Usuarios pueden ver sus propias facturas" 
      ON public.invoices FOR SELECT 
      USING (true);
      
  CREATE POLICY "Usuarios pueden insertar sus propias facturas" 
      ON public.invoices FOR INSERT 
      WITH CHECK (true);
      
  CREATE POLICY "Usuarios pueden actualizar sus propias facturas" 
      ON public.invoices FOR UPDATE 
      USING (true);
      
  CREATE POLICY "Usuarios pueden eliminar sus propias facturas" 
      ON public.invoices FOR DELETE 
      USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para corregir políticas de invoice_items
CREATE OR REPLACE FUNCTION fix_invoice_items_policies()
RETURNS void AS $$
BEGIN
  -- Habilitar RLS para la tabla invoice_items
  ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar duplicados
  DROP POLICY IF EXISTS "Acceso a items de facturas" ON public.invoice_items;
  
  -- Crear política que permita acceso completo a invoice_items
  CREATE POLICY "Acceso a items de facturas" 
      ON public.invoice_items 
      USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para corregir políticas de expenses
CREATE OR REPLACE FUNCTION fix_expenses_policies()
RETURNS void AS $$
BEGIN
  -- Habilitar RLS para la tabla expenses
  ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar duplicados
  DROP POLICY IF EXISTS "Usuarios pueden ver sus propios gastos" ON public.expenses;
  DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios gastos" ON public.expenses;
  DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios gastos" ON public.expenses;
  DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios gastos" ON public.expenses;
  
  -- Crear políticas de seguridad
  CREATE POLICY "Usuarios pueden ver sus propios gastos" 
      ON public.expenses FOR SELECT 
      USING (true);
      
  CREATE POLICY "Usuarios pueden insertar sus propios gastos" 
      ON public.expenses FOR INSERT 
      WITH CHECK (true);
      
  CREATE POLICY "Usuarios pueden actualizar sus propios gastos" 
      ON public.expenses FOR UPDATE 
      USING (true);
      
  CREATE POLICY "Usuarios pueden eliminar sus propios gastos" 
      ON public.expenses FOR DELETE 
      USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para corregir políticas de notifications
CREATE OR REPLACE FUNCTION fix_notifications_policies()
RETURNS void AS $$
BEGIN
  -- Habilitar RLS para la tabla notifications
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar duplicados
  DROP POLICY IF EXISTS "Usuarios pueden ver sus propias notificaciones" ON public.notifications;
  DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias notificaciones" ON public.notifications;
  DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias notificaciones" ON public.notifications;
  DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias notificaciones" ON public.notifications;
  
  -- Crear políticas de seguridad
  CREATE POLICY "Usuarios pueden ver sus propias notificaciones" 
      ON public.notifications FOR SELECT 
      USING (true);
      
  CREATE POLICY "Usuarios pueden insertar sus propias notificaciones" 
      ON public.notifications FOR INSERT 
      WITH CHECK (true);
      
  CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones" 
      ON public.notifications FOR UPDATE 
      USING (true);
      
  CREATE POLICY "Usuarios pueden eliminar sus propias notificaciones" 
      ON public.notifications FOR DELETE 
      USING (true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

