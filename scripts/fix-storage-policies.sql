-- Habilitar la extensión uuid-ossp si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para corregir políticas de almacenamiento
CREATE OR REPLACE FUNCTION fix_storage_policies()
RETURNS void AS $$
BEGIN
  -- Eliminar políticas existentes para evitar duplicados
  BEGIN
    DROP POLICY IF EXISTS "Acceso público a storage.objects" ON storage.objects;
    DROP POLICY IF EXISTS "Acceso público a storage.buckets" ON storage.buckets;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error al eliminar políticas existentes: %', SQLERRM;
  END;
  
  -- Crear políticas que permitan acceso completo a storage.objects
  BEGIN
    CREATE POLICY "Acceso público a storage.objects" 
        ON storage.objects
        FOR ALL
        USING (true)
        WITH CHECK (true);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error al crear política para storage.objects: %', SQLERRM;
  END;
  
  -- Crear políticas que permitan acceso completo a storage.buckets
  BEGIN
    CREATE POLICY "Acceso público a storage.buckets" 
        ON storage.buckets
        FOR ALL
        USING (true)
        WITH CHECK (true);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error al crear política para storage.buckets: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
