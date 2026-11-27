import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-[#CBD5E1] bg-white text-[#0F172A] file:text-[#0F172A] placeholder:text-[#64748B] selection:bg-[#FEF9C3] selection:text-[#0F172A] flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#E2A829] focus-visible:ring-[#E2A829]/35 focus-visible:ring-[3px]",
        "aria-invalid:ring-[#BE123C]/20 aria-invalid:border-[#BE123C]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
