"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(color)

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-md border cursor-pointer overflow-hidden" style={{ backgroundColor: color }}>
        <input type="color" value={color} onChange={handleColorChange} className="h-10 w-10 cursor-pointer opacity-0" />
      </div>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
            onChange(e.target.value)
          }
        }}
        onBlur={() => {
          if (!/^#([0-9A-F]{3}){1,2}$/i.test(inputValue)) {
            setInputValue(color)
          }
        }}
        className="font-mono"
      />
    </div>
  )
}
