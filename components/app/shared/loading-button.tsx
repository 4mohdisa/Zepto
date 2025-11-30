'use client'

import { Button, ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading = false,
  loadingText = "Processing...",
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <Button 
      disabled={isLoading || disabled} 
      className={className}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
