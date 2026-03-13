'use client'

import { useState, useCallback, useMemo } from 'react'
import { Upload, X, FileText, Loader2, Check, AlertCircle, Sparkles, Table, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { primaryButton, secondaryButton } from "@/lib/styles"
import { 
  parseCSV, 
  categorizeTransactionsWithAI, 
  categorizeWithRules,
  isAIAvailable,
  type CategorizedTransaction,
  type ParsedCSVResult
} from '@/features/csv-import/services'

import { useAuth } from '@/providers'
import { toast } from 'sonner'
import { invalidateMerchantsCache } from '@/hooks/use-merchants'
import { useCategories } from '@/hooks/use-categories'
import { 
  trackEvent, 
  trackResult,
  EVENT_CSV_IMPORT_STARTED, 
  EVENT_CSV_IMPORT_COMPLETED, 
  EVENT_CSV_IMPORT_FAILED 
} from '@/lib/analytics'

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

type ImportStep = 'upload' | 'preview' | 'processing' | 'complete' | 'error';

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<ImportStep>('upload')
  const [parsedData, setParsedData] = useState<ParsedCSVResult | null>(null)
  const [categorizedTransactions, setCategorizedTransactions] = useState<CategorizedTransaction[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [useAI, setUseAI] = useState(true)
  
  const { user } = useAuth()
  const { categories, loading: categoriesLoading } = useCategories()
  
  // Memoize category options for the preview table
  const categoryOptions = useMemo(() => {
    if (!categories) return []
    return categories.map(c => ({ value: c.name, label: c.name, id: c.id }))
  }, [categories])

  const resetState = useCallback(() => {
    setFile(null)
    setStep('upload')
    setParsedData(null)
    setCategorizedTransactions([])
    setCurrentIndex(0)
    setImportStats({ success: 0, failed: 0 })
    setIsProcessing(false)
    setError(null)
    setUseAI(true)
  }, [])

  const handleClose = useCallback(() => {
    resetState()
    onOpenChange(false)
  }, [resetState, onOpenChange])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
  }

  const handleParseCSV = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const text = await file.text()
      const result = parseCSV(text)
      
      if (result.transactions.length === 0) {
        throw new Error('No valid transactions found in CSV file')
      }

      setParsedData(result)
      
      // Categorize transactions using user's real categories
      let categorized: CategorizedTransaction[]
      
      // Prepare user categories for the categorization functions
      const userCategoriesForAI = categories?.map(c => ({ id: c.id, name: c.name }))
      
      if (useAI && isAIAvailable()) {
        try {
          toast.info('Using AI to categorize transactions...')
          categorized = await categorizeTransactionsWithAI(result.transactions, userCategoriesForAI)
        } catch (aiErr: any) {
          // If AI fails (e.g. quota exceeded), fall back to rule-based
          if (aiErr.message?.includes('quota') || aiErr.message?.includes('429')) {
            toast.warning('AI quota exceeded. Falling back to rule-based categorization...')
            categorized = categorizeWithRules(result.transactions, userCategoriesForAI)
          } else {
            throw aiErr
          }
        }
      } else {
        toast.info('Using rule-based categorization...')
        categorized = categorizeWithRules(result.transactions, userCategoriesForAI)
      }
      
      setCategorizedTransactions(categorized)
      setStep('preview')
    } catch (err) {
      console.error('Parse error:', err)
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
      setStep('error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!user?.id || categorizedTransactions.length === 0) return

    const startTime = Date.now()
    const transactionCount = categorizedTransactions.length
    
    // Track import started
    trackEvent(EVENT_CSV_IMPORT_STARTED, {
      transaction_count: transactionCount,
      use_ai: useAI,
    })

    setStep('processing')
    setIsProcessing(true)
    setCurrentIndex(0)
    setImportStats({ success: 0, failed: 0 })

    let successCount = 0
    let failedCount = 0
    let duplicateCount = 0

    try {
      // Use API endpoint for proper duplicate detection and validation
      // Process in batches to show progress
      const BATCH_SIZE = 50
      
      for (let i = 0; i < categorizedTransactions.length; i += BATCH_SIZE) {
        const batch = categorizedTransactions.slice(i, i + BATCH_SIZE)
        
        // Prepare transactions for API
        const transactionsForApi = batch.map(t => ({
          name: t.name || t.description.substring(0, 50),
          amount: t.amount,
          type: t.suggestedType,
          account_type: t.account_type || 'Checking',
          category: t.suggestedCategory,
          categoryId: t.categoryId, // Pass the resolved category ID if available
          date: t.date,
          description: t.description,
        }))

        try {
          const response = await fetch('/api/csv-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: transactionsForApi }),
          })

          const result = await response.json()

          if (!response.ok) {
            console.error('Import API error:', result)
            failedCount += batch.length
          } else {
            successCount += result.imported || 0
            duplicateCount += result.duplicates || 0
          }
        } catch (err) {
          console.error('Failed to import batch:', err)
          failedCount += batch.length
        }
        
        setCurrentIndex(Math.min(i + BATCH_SIZE, categorizedTransactions.length))
        setImportStats({ success: successCount, failed: failedCount })
      }
      
      setStep('complete')
      const durationMs = Date.now() - startTime
      
      // Track import completed
      trackResult(EVENT_CSV_IMPORT_COMPLETED, failedCount === 0, {
        transaction_count: transactionCount,
        imported_count: successCount,
        duplicate_count: duplicateCount,
        failed_count: failedCount,
        duration_ms: durationMs,
        use_ai: useAI,
      })
      
      // Show appropriate toast messages
      if (successCount > 0 && duplicateCount > 0) {
        toast.success(`Imported ${successCount} transactions (${duplicateCount} duplicates skipped)`)
      } else if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} transactions`)
      } else if (duplicateCount > 0 && failedCount === 0) {
        toast.info(`All ${duplicateCount} transactions already exist (duplicates)`)
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} transactions`)
      }
      
      if (successCount > 0) {
        // Invalidate merchants cache since we added new transactions
        invalidateMerchantsCache(user.id)
        onSuccess?.()
      }
    } catch (err) {
      console.error('Import error:', err)
      setError('Import failed. Please try again.')
      setStep('error')
      
      // Track import failed
      trackEvent(EVENT_CSV_IMPORT_FAILED, {
        transaction_count: transactionCount,
        error: err instanceof Error ? err.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpdateCategory = (index: number, newCategory: string) => {
    setCategorizedTransactions(prev => 
      prev.map((t, i) => i === index ? { ...t, suggestedCategory: newCategory } : t)
    )
  }

  const handleUpdateType = (index: number, newType: 'Income' | 'Expense') => {
    setCategorizedTransactions(prev => 
      prev.map((t, i) => i === index ? { ...t, suggestedType: newType } : t)
    )
  }

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* AI Toggle - Using proper Switch component */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            useAI && isAIAvailable() ? "bg-primary/10" : "bg-muted"
          )}>
            <Sparkles className={cn(
              "h-5 w-5",
              useAI && isAIAvailable() ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <p className="font-medium text-foreground">AI Categorization</p>
            <p className="text-sm text-muted-foreground">
              {isAIAvailable() 
                ? 'Use AI to automatically categorize transactions' 
                : 'AI not available - using rule-based categorization'}
            </p>
          </div>
        </div>
        <Switch
          checked={useAI && isAIAvailable()}
          onCheckedChange={setUseAI}
          disabled={!isAIAvailable()}
          aria-label="Toggle AI categorization"
        />
      </div>

      {/* File Upload Area */}
      {!file ? (
        <div className="flex items-center justify-center w-full">
          <label 
            htmlFor="dropzone-file" 
            className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer bg-muted/30 hover:bg-muted/50 border-muted-foreground/25 hover:border-muted-foreground/40 transition-all"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                <Upload className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="mb-2 text-base font-medium text-foreground">
                <span className="text-primary">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload your bank statement CSV file. We support formats from most major banks.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-2">CSV files only (MAX. 10MB)</p>
            </div>
            <input 
              id="dropzone-file" 
              type="file" 
              className="hidden" 
              onChange={handleFileChange} 
              accept=".csv"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-background border rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Button 
            onClick={handleParseCSV}
            disabled={isProcessing}
            className={cn(primaryButton, "w-full")}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Parsing CSV...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Preview & Categorize
              </>
            )}
          </Button>
        </div>
      )}

      {/* CSV Template Download */}
      <div className="p-4 bg-muted/50 rounded-lg border">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-background rounded-lg shrink-0 shadow-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Need a template?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Download our CSV template to see the expected format. Your bank&apos;s CSV export should work too!
            </p>
            <a 
              href="/templates/transaction_template.csv" 
              download
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-primary hover:underline"
            >
              <Download className="h-3.5 w-3.5" />
              Download Template
            </a>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Preview Transactions</h3>
          <p className="text-sm text-muted-foreground">
            {categorizedTransactions.length} transactions found • 
            AI categorized {categorizedTransactions.filter(t => t.confidence > 70).length} with high confidence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('upload')} className={secondaryButton}>
            Back
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isProcessing}
            className={primaryButton}
          >
            Import All
          </Button>
        </div>
      </div>

      <Separator />

      {/* Transaction Preview Table */}
      <div className="border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Merchant</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categorizedTransactions.slice(0, 50).map((transaction, index) => (
              <tr key={index} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{transaction.date}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground" title={transaction.description}>
                    {transaction.name || transaction.description.substring(0, 30)}
                  </div>
                  <div className="text-xs text-muted-foreground max-w-[180px] truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium font-mono">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={transaction.suggestedCategory}
                    onChange={(e) => handleUpdateCategory(index, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-background"
                    disabled={categoriesLoading}
                  >
                    {categoriesLoading ? (
                      <option>Loading categories...</option>
                    ) : (
                      categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.value}>{cat.label}</option>
                      ))
                    )}
                  </select>
                  {transaction.confidence < 50 && (
                    <span className="ml-2 text-xs text-yellow-600" title="Low confidence">
                      ⚠️
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleUpdateType(index, transaction.suggestedType === 'Income' ? 'Expense' : 'Income')}
                    className={cn(
                      "px-2 py-1 rounded text-xs font-medium transition-colors",
                      transaction.suggestedType === 'Income' 
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {transaction.suggestedType}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categorizedTransactions.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing first 50 of {categorizedTransactions.length} transactions
        </p>
      )}
    </div>
  )

  // Render processing step
  const renderProcessingStep = () => {
    const total = categorizedTransactions.length
    const progress = total > 0 ? (currentIndex / total) * 100 : 0
    
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-muted flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground">Importing Transactions...</h3>
          <p className="text-muted-foreground">
            {currentIndex} of {total} transactions processed
          </p>
        </div>
        
        <div className="w-full max-w-md space-y-3">
          <Progress value={progress} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">{importStats.success} imported</span>
            {importStats.failed > 0 && (
              <span className="text-red-600 font-medium">{importStats.failed} failed</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render complete step
  const renderCompleteStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Import Complete!</h3>
        <p className="text-muted-foreground">
          {importStats.success} transactions imported successfully
        </p>
        {importStats.failed > 0 && (
          <p className="text-sm text-red-600">
            {importStats.failed} transactions failed to import
          </p>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className={secondaryButton}>
          Close
        </Button>
        <Button 
          onClick={() => {
            resetState()
            setStep('upload')
          }}
          className={primaryButton}
        >
          Import Another File
        </Button>
      </div>
    </div>
  )

  // Render error step
  const renderErrorStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-foreground">Import Failed</h3>
        <p className="text-muted-foreground max-w-sm">{error}</p>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose} className={secondaryButton}>
          Close
        </Button>
        <Button 
          onClick={() => setStep('upload')}
          className={primaryButton}
        >
          Try Again
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-1rem)] sm:max-w-[900px] max-h-[95vh] overflow-y-auto p-4 sm:p-6 gap-0">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <Table className="w-5 h-5 text-primary" />
            Import Transactions
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload your bank statement or transaction history CSV file. 
            Our AI will automatically categorize each transaction for you.
          </DialogDescription>
        </DialogHeader>

        <Separator className="mb-6" />

        <div>
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'complete' && renderCompleteStep()}
          {step === 'error' && renderErrorStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
