'use client'

import { FieldErrors } from "react-hook-form"

interface FormErrorSummaryProps {
  errors: FieldErrors
}

export function FormErrorSummary({ errors }: FormErrorSummaryProps) {
  const errorEntries = Object.entries(errors)
  
  if (errorEntries.length === 0) return null

  return (
    <div className="rounded-md bg-destructive/15 p-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-destructive">
            Please correct the following errors:
          </h3>
          <div className="mt-2 text-sm text-destructive">
            <ul className="list-disc space-y-1 pl-5">
              {errorEntries.map(([key, value]) => (
                <li key={key}>{value?.message?.toString() || 'Invalid field'}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
