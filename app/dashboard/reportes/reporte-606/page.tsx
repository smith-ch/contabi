import {Report606} from "@/components/reports/report-606"

export default function Report606Page() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reporte 606</h2>
        <p className="text-muted-foreground">
          Reporte de compras y gastos para la Dirección General de Impuestos Internos (DGII)
        </p>
      </div>

      <Report606 />
    </div>
  )
}

