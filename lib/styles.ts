/**
 * Shared styling utilities for consistent UI across the app
 * Use these instead of repeating Tailwind classes
 */

// Page containers
export const pageContainer = "min-h-screen bg-gray-50"
export const pageContent = "container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-[1400px]"

// Typography
export const pageHeading = "text-xl sm:text-2xl font-bold text-gray-900"
export const sectionHeading = "text-base sm:text-lg font-semibold text-gray-900"
export const cardTitle = "text-sm sm:text-base font-semibold text-gray-900"
export const bodyText = "text-sm text-gray-600"
export const mutedText = "text-xs sm:text-sm text-muted-foreground"
export const helperText = "text-xs text-gray-500"

// Layout
export const flexBetween = "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
export const flexWrap = "flex flex-wrap items-center gap-2 sm:gap-3"
export const gridCols2 = "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
export const gridCols4 = "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"

// Buttons - Primary (Black)
export const primaryButton = "bg-black text-white hover:bg-gray-800 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
export const primaryButtonIcon = "h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2"

// Buttons - Secondary/Outline
export const secondaryButton = "border-gray-300 text-gray-700 hover:bg-gray-50 h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
export const ghostButton = "text-gray-600 hover:text-gray-900 hover:bg-gray-100"

// Form elements
export const inputBase = "h-9 sm:h-10 text-sm"
export const selectBase = "h-9 sm:h-10 text-sm"
export const labelBase = "text-sm font-medium text-gray-700"

// Cards
export const cardBase = "bg-white border border-gray-200 rounded-lg shadow-sm"
export const cardPadding = "p-3 sm:p-4"

// Table
export const tableContainer = "bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto"
export const tableCell = "px-3 py-3 text-sm"
export const tableHeader = "px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider"

// Dialog
export const dialogContent = "sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
export const dialogFullMobile = "w-[calc(100%-2rem)] sm:w-full max-w-lg"

// Spacing
export const sectionGap = "space-y-4 sm:space-y-6"
export const elementGap = "gap-2 sm:gap-3"
