"use client"

import { Field } from "@base-ui/react/field"
import { Input as InputPrimitive } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type InputProps = {
  label?: string
  hint?: string
  error?: string
} & React.ComponentProps<"input">

function Input({ label, hint, error, id, className, ...props }: InputProps) {
  return (
    <Field.Root className="flex flex-col gap-1" invalid={!!error}>
      {label && (
        <Field.Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Field.Label>
      )}
      <InputPrimitive
        id={id}
        className={cn(className)}
        aria-invalid={!!error || undefined}
        {...props}
      />
      {hint && !error && (
        <Field.Description className="text-xs text-muted-foreground">
          {hint}
        </Field.Description>
      )}
      {error && (
        <Field.Error className="text-xs text-destructive">
          {error}
        </Field.Error>
      )}
    </Field.Root>
  )
}

export { Input }
