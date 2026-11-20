"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/format-price"

// ponytail: solo enteros (ARS). value/onValueChange manejan string de dígitos ("1500000"); se muestra "$1.500.000".

type PriceInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string
  onValueChange: (digits: string) => void
}

export const PriceInput = React.forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const innerRef = React.useRef<HTMLInputElement>(null)
    const pendingDigits = React.useRef<number | null>(null)

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement)

    // Mantiene el cursor tras reformatear: lo ubica después de la misma cantidad de dígitos.
    React.useLayoutEffect(() => {
      const el = innerRef.current
      if (!el || pendingDigits.current === null) return
      let seen = 0
      let pos = 0
      while (pos < el.value.length && seen < pendingDigits.current) {
        if (/\d/.test(el.value[pos])) seen++
        pos++
      }
      el.setSelectionRange(pos, pos)
      pendingDigits.current = null
    })

    return (
      <Input
        {...props}
        ref={innerRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatPrice(value)}
        onChange={(e) => {
          const raw = e.target.value
          const caret = e.target.selectionStart ?? raw.length
          pendingDigits.current = raw.slice(0, caret).replace(/\D/g, "").length
          onValueChange(raw.replace(/\D/g, "").replace(/^0+/, ""))
        }}
      />
    )
  }
)
PriceInput.displayName = "PriceInput"
