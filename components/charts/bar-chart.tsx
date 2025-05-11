"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, type ChartData, type ChartOptions, registerables } from "chart.js"
import { useTheme } from "next-themes"

Chart.register(...registerables)

interface BarChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
    }[]
  }
  title?: string
  height?: number
  options?: Partial<ChartOptions>
}

export function BarChart({ data, title, height = 300, options = {} }: BarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [isClient, setIsClient] = useState(false)

  // Asegurarse de que el componente solo se renderice en el cliente
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !chartRef.current) return

    // Destruir el gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Ajustar colores para modo oscuro
    const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
    const textColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"

    // Clonar los datos para no modificar los originales
    const modifiedData: ChartData = {
      labels: [...data.labels],
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        // Si backgroundColor es un array, ajustar cada color
        backgroundColor: Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor.map((color: string) =>
              isDark && color.includes("rgba")
                ? color.replace(/rgba$$(\d+,\s*\d+,\s*\d+,\s*)[\d.]+$$/, "rgba($1 0.7)")
                : color,
            )
          : dataset.backgroundColor,
        // Si borderColor es un array, ajustar cada color
        borderColor: dataset.borderColor
          ? Array.isArray(dataset.borderColor)
            ? dataset.borderColor.map((color: string) =>
                isDark && color.includes("rgba")
                  ? color.replace(/rgba$$(\d+,\s*\d+,\s*\d+,\s*)[\d.]+$$/, "rgba($1 0.9)")
                  : color,
              )
            : dataset.borderColor
          : undefined,
      })),
    }

    const defaultOptions: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title || "",
          font: {
            size: 16,
          },
          padding: {
            top: 10,
            bottom: 20,
          },
          color: textColor,
        },
        legend: {
          position: "top",
          labels: {
            usePointStyle: true,
            padding: 15,
            color: textColor,
          },
        },
        tooltip: {
          backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
          titleColor: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
          bodyColor: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
          borderColor: gridColor,
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
          },
        },
      },
      animation: {
        duration: 1000,
      },
    }

    try {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: modifiedData,
        options: { ...defaultOptions, ...options },
      })
    } catch (error) {
      console.error("Error al crear gráfico de barras:", error)
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, title, isDark, options, isClient])

  if (!isClient) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md animate-pulse"
      >
        <span className="text-gray-500 dark:text-gray-400">Cargando gráfico...</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {data.labels.length === 0 || data.datasets.some((ds) => ds.data.length === 0) ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-md">
          <span className="text-gray-500 dark:text-gray-400">No hay datos disponibles</span>
        </div>
      ) : null}
      <canvas ref={chartRef} height={height} />
    </div>
  )
}
