"use client"

import { useEffect, useRef, useState } from "react"
import { Chart, type ChartData, type ChartOptions, registerables } from "chart.js"
import { useTheme } from "next-themes"

Chart.register(...registerables)

interface DoughnutChartProps {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      backgroundColor: string[]
      borderColor?: string[]
      borderWidth?: number
      cutout?: string | number
    }[]
  }
  title?: string
  height?: number
  options?: Partial<ChartOptions>
}

export function DoughnutChart({ data, title, height = 300, options = {} }: DoughnutChartProps) {
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
    const textColor = isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"

    // Clonar los datos para no modificar los originales
    const modifiedData: ChartData = {
      labels: [...data.labels],
      datasets: data.datasets.map((dataset) => ({
        ...dataset,
        // Ajustar borderColor para modo oscuro
        borderColor: dataset.borderColor || (isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.8)"),
        // Aumentar la opacidad de los colores en modo oscuro
        backgroundColor: isDark
          ? dataset.backgroundColor.map((color) => {
              if (color.includes("rgba")) {
                return color.replace(/rgba$$(\d+,\s*\d+,\s*\d+,\s*)[\d.]+$$/, "rgba($1 0.8)")
              }
              return color
            })
          : dataset.backgroundColor,
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
          borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
        },
      },
      animation: {
        duration: 1000,
        animateRotate: true,
        animateScale: true,
      },
    }

    try {
      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: modifiedData,
        options: { ...defaultOptions, ...options },
      })
    } catch (error) {
      console.error("Error al crear gráfico de dona:", error)
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
