"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"
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
}

export function BarChart({ data, title, height = 300 }: BarChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    if (!chartRef.current) return

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
    const modifiedData = JSON.parse(JSON.stringify(data))

    // Ajustar opacidad para modo oscuro si es necesario
    modifiedData.datasets = modifiedData.datasets.map((dataset: any) => {
      // Si backgroundColor es un array, ajustar cada color
      if (Array.isArray(dataset.backgroundColor)) {
        dataset.backgroundColor = dataset.backgroundColor.map((color: string) =>
          isDark && color.includes("rgba")
            ? color.replace(/rgba$$(\d+,\s*\d+,\s*\d+,\s*)[\d.]+$$/, "rgba($1 0.7)")
            : color,
        )
      }
      // Si borderColor es un array, ajustar cada color
      if (Array.isArray(dataset.borderColor)) {
        dataset.borderColor = dataset.borderColor.map((color: string) =>
          isDark && color.includes("rgba")
            ? color.replace(/rgba$$(\d+,\s*\d+,\s*\d+,\s*)[\d.]+$$/, "rgba($1 0.9)")
            : color,
        )
      }
      return dataset
    })

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: modifiedData,
      options: {
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
              // Eliminamos la propiedad drawBorder que causa el error
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
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data, title, isDark])

  return <canvas ref={chartRef} height={height} />
}
