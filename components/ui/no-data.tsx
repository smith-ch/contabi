import type React from "react"
import { FileBarChart } from "lucide-react"

interface NoDataProps {
  message?: string
  icon?: React.ReactNode
  height?: number
}

export function NoData({ message = "No hay datos disponibles", icon, height = 300 }: NoDataProps) {
  return (
    <div
      className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700"
      style={{ height: `${height}px` }}
    >
      <div className="text-gray-400 dark:text-gray-500">{icon || <FileBarChart className="h-12 w-12 mb-2" />}</div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}
