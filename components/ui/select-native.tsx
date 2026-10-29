"use client"

import { ChevronDown } from "lucide-react"
import type { ComponentProps } from "react"

type NativeSelectProps = ComponentProps<"select"> & {
  wrapperClassName?: string
}

export function SelectNative({ children, className = "", wrapperClassName = "", ...props }: NativeSelectProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <select {...props} className={`${className} appearance-none pr-10`}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={14}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-brand-dark"
      />
    </div>
  )
}
