import FixDatabase from "@/components/debug/fix-database"

export default function FixDatabasePage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Corregir Base de Datos</h2>
      <p className="text-muted-foreground">
        Utilice esta herramienta para corregir problemas con las políticas de seguridad en la base de datos.
      </p>

      <FixDatabase />
    </div>
  )
}
