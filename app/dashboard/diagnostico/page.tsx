import VerifyTables from "@/components/debug/verify-tables"

export default function DiagnosticoPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Diagnóstico del Sistema</h2>
      <p className="text-muted-foreground">
        Utilice estas herramientas para diagnosticar problemas con la base de datos y el sistema.
      </p>

      <VerifyTables />
    </div>
  )
}

