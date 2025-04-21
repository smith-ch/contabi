-- Habilitar la extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar y corregir políticas para la tabla invoices
DO $$
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
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden insertar sus propias facturas" 
      ON public.invoices FOR INSERT 
      WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden actualizar sus propias facturas" 
      ON public.invoices FOR UPDATE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden eliminar sus propias facturas" 
      ON public.invoices FOR DELETE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
END $$;

-- Verificar y corregir políticas para la tabla invoice_items
DO $$
BEGIN
  -- Habilitar RLS para la tabla invoice_items
  ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
  
  -- Eliminar políticas existentes para evitar duplicados
  DROP POLICY IF EXISTS "Acceso a items de facturas" ON public.invoice_items;
  
  -- Crear política que permita acceso completo a invoice_items
  CREATE POLICY "Acceso a items de facturas" 
      ON public.invoice_items 
      USING (true);
END $$;

-- Verificar y corregir políticas para la tabla expenses
DO $$
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
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden insertar sus propios gastos" 
      ON public.expenses FOR INSERT 
      WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden actualizar sus propios gastos" 
      ON public.expenses FOR UPDATE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden eliminar sus propios gastos" 
      ON public.expenses FOR DELETE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
END $$;

-- Verificar y corregir políticas para la tabla notifications
DO $$
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
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden insertar sus propias notificaciones" 
      ON public.notifications FOR INSERT 
      WITH CHECK (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden actualizar sus propias notificaciones" 
      ON public.notifications FOR UPDATE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
      
  CREATE POLICY "Usuarios pueden eliminar sus propias notificaciones" 
      ON public.notifications FOR DELETE 
      USING (auth.uid()::text = user_id OR auth.uid() IS NULL);
END $$;
