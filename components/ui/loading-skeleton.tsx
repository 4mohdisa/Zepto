"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Chart loading skeleton
export const ChartSkeleton = ({ className }: { className?: string }) => (
  <Card className={cn("w-full", className)}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Chart area */}
        <div className="h-[250px] w-full flex items-end justify-center space-x-2">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="bg-gray-300 dark:bg-gray-700"
              style={{
                height: `${Math.random() * 150 + 50}px`,
                width: '20px',
              }}
            />
          ))}
        </div>
        {/* Chart legend */}
        <div className="flex justify-center space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
)

// Table loading skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) => (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {/* Table header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Table rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className="h-8 w-full" 
                style={{ 
                  width: colIndex === 0 ? '60%' : colIndex === columns - 1 ? '40%' : '80%' 
                }} 
              />
            ))}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// Page loading skeleton
export const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-8">
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <Skeleton className="h-8 w-48" />
      <div className="flex space-x-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>

    {/* KPI Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="relative overflow-hidden border-0 bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <Skeleton className="h-4 w-20 bg-gray-700" />
                <Skeleton className="h-8 w-28 bg-gray-700" />
                <Skeleton className="h-3 w-24 bg-gray-700" />
              </div>
              <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
            </div>
            {/* Mini chart skeleton */}
            <div className="mt-4 flex items-end space-x-1">
              {[...Array(8)].map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="bg-gray-700" 
                  style={{ 
                    height: `${Math.random() * 20 + 10}px`, 
                    width: '4px' 
                  }} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <ChartSkeleton />
      </div>
      <div>
        <ChartSkeleton />
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <ChartSkeleton />
    </div>

    {/* Table */}
    <TableSkeleton />
  </div>
)

// Generic loading state
export const LoadingSpinner = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className="flex items-center justify-center">
      <div className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size]
      )} />
    </div>
  )
}

// Full page loading
export const FullPageLoading = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-400 text-lg">{message}</p>
    </div>
  </div>
)