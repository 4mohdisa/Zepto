'use client'

import { useState, useCallback } from 'react'
import { Upload, X, FileText, Loader2, Check, AlertCircle, Sparkles, Table, Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSupabaseClient } from '@/utils/supabase/client'
import { 
  parseCSV, 
  categorizeTransactionsWithAI, 
  categorizeWithRules,
  isAIAvailable,
  type CategorizedTransaction,
  type ParsedCSVResult
} from '@/app/services/csv-import-service'

import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'

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
  const supabase = useSupabaseClient()

  const resetState = useCallback(() => {
    setFile(null)
    setStep('upload')
    setParsedData(null)
    setCategorizedTransactions([])
    setCurrentIndex(0)
    setImportStats({ success: 0, failed: 0 })
    setIsProcessing(false)
    setError(null)
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
      
      // Categorize transactions
      let categorized: CategorizedTransaction[]
      
      if (useAI && isAIAvailable()) {
        try {
          toast.info('Using AI to categorize transactions...')
          categorized = await categorizeTransactionsWithAI(result.transactions)
        } catch (aiErr: any) {
          // If AI fails (e.g., quota exceeded), fall back to rule-based
          if (aiErr.message?.includes('quota') || aiErr.message?.includes('429')) {
            toast.warning('AI quota exceeded. Falling back to rule-based categorization...')
            categorized = categorizeWithRules(result.transactions)
          } else {
            throw aiErr
          }
        }
      } else {
        toast.info('Using rule-based categorization...')
        categorized = categorizeWithRules(result.transactions)
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

    setStep('processing')
    setIsProcessing(true)
    setCurrentIndex(0)
    setImportStats({ success: 0, failed: 0 })

    const BATCH_SIZE = 50 // Much larger batch for Supabase bulk insert
    
    let successCount = 0
    let failedCount = 0

    try {
      // Process in batches using Supabase bulk insert (much faster!)
      for (let i = 0; i < categorizedTransactions.length; i += BATCH_SIZE) {
        const batch = categorizedTransactions.slice(i, i + BATCH_SIZE)
        
        // Prepare transactions for bulk insert
        const transactionsToInsert = batch.map(t => ({
          user_id: user.id,
          name: t.name || t.description.substring(0, 50), // Use extracted merchant name
          amount: t.amount,
          type: t.suggestedType,
          account_type: t.account_type || 'Checking',
          category_name: t.suggestedCategory,
          date: t.date,
          description: t.description, // Full description
          recurring_frequency: 'Never',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))

        try {
          // Bulk insert for speed
          const { error } = await supabase
            .from('transactions')
            .insert(transactionsToInsert)

          if (error) {
            console.error('Batch insert error:', error)
            failedCount += batch.length
          } else {
            successCount += batch.length
          }
        } catch (err) {
          console.error('Failed to insert batch:', err)
          failedCount += batch.length
        }
        
        setCurrentIndex(Math.min(i + BATCH_SIZE, categorizedTransactions.length))
        setImportStats({ success: successCount, failed: failedCount })
      }
      
      setStep('complete')
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} transactions`)
        onSuccess?.()
      }
      
      if (failedCount > 0) {
        toast.error(`Failed to import ${failedCount} transactions`)
      }
    } catch (err) {
      console.error('Import error:', err)
      setError('Import failed. Please try again.')
      setStep('error')
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
      {/* AI Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">AI Categorization</p>
            <p className="text-sm text-gray-500">
              {isAIAvailable() 
                ? 'Use AI to automatically categorize transactions' 
                : 'AI not available - using rule-based categorization'}
            </p>
          </div>
        </div>
        <Button
          variant={useAI ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseAI(!useAI)}
          disabled={!isAIAvailable()}
          className={cn(
            "transition-all",
            useAI && "bg-gradient-to-r from-purple-600 to-blue-600"
          )}
        >
          {useAI ? 'On' : 'Off'}
        </Button>
      </div>

      {/* File Upload Area */}
      {!file ? (
        <div className="flex items-center justify-center w-full">
          <label 
            htmlFor="dropzone-file" 
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-all hover:border-purple-400"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
              <div className="p-4 bg-purple-100 rounded-full mb-4">
                <Upload className="w-8 h-8 text-purple-600" />
              </div>
              <p className="mb-2 text-lg font-medium text-gray-900">
                <span className="text-purple-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-sm text-gray-500 max-w-xs">
                Upload your bank statement CSV file. We support formats from most major banks.
              </p>
              <p className="text-xs text-gray-400 mt-2">CSV files only (MAX. 10MB)</p>
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
          <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <Button 
            onClick={handleParseCSV}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
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
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-blue-900">Need a template?</p>
            <p className="text-sm text-blue-700 mt-1">
              Download our CSV template to see the expected format. Your bank's CSV export should work too!
            </p>
            <a 
              href="/templates/transaction_template.csv" 
              download
              className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
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
          <h3 className="font-semibold text-gray-900">Preview Transactions</h3>
          <p className="text-sm text-gray-500">
            {categorizedTransactions.length} transactions found • 
            AI categorized {categorizedTransactions.filter(t => t.confidence > 70).length} with high confidence
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep('upload')}>
            Back
          </Button>
          <Button 
            onClick={handleImport}
            disabled={isProcessing}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Import All
          </Button>
        </div>
      </div>

      {/* Transaction Preview Table */}
      <div className="border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Merchant</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Category</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categorizedTransactions.slice(0, 50).map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{transaction.date}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900" title={transaction.description}>
                    {transaction.name || transaction.description.substring(0, 30)}
                  </div>
                  <div className="text-xs text-gray-500 max-w-[180px] truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  ${transaction.amount.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={transaction.suggestedCategory}
                    onChange={(e) => handleUpdateCategory(index, e.target.value)}
                    className="text-sm border rounded px-2 py-1 bg-white"
                  >
                    {/* Group categories by type */}
                    <optgroup label="Income">
                      <option value="Salary">Salary</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Investments">Investments</option>
                      <option value="Other Income">Other Income</option>
                    </optgroup>
                    <optgroup label="Housing">
                      <option value="Housing">Housing</option>
                      <option value="Rent">Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Bills">Bills</option>
                    </optgroup>
                    <optgroup label="Daily">
                      <option value="Food">Food</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Restaurant">Restaurant</option>
                      <option value="Coffee">Coffee</option>
                    </optgroup>
                    <optgroup label="Transport">
                      <option value="Transport">Transport</option>
                      <option value="Gas">Gas</option>
                      <option value="Parking">Parking</option>
                      <option value="Taxi">Taxi</option>
                    </optgroup>
                    <optgroup label="Lifestyle">
                      <option value="Entertainment">Entertainment</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Subscriptions">Subscriptions</option>
                      <option value="Health">Health</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="Savings">Savings</option>
                      <option value="Charity">Charity</option>
                      <option value="Education">Education</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </optgroup>
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
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
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
        <p className="text-sm text-gray-500 text-center">
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
          <div className="w-20 h-20 rounded-full border-4 border-purple-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center">
            {Math.round(progress)}%
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Importing Transactions...</h3>
          <p className="text-gray-500">
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
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Import Complete!</h3>
        <p className="text-gray-500">
          {importStats.success} transactions imported successfully
        </p>
        {importStats.failed > 0 && (
          <p className="text-sm text-red-500">
            {importStats.failed} transactions failed to import
          </p>
        )}
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        <Button 
          onClick={() => {
            resetState()
            setStep('upload')
          }}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Import Another File
        </Button>
      </div>
    </div>
  )

  // Render error step
  const renderErrorStep = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="w-10 h-10 text-red-600" />
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Import Failed</h3>
        <p className="text-gray-500 max-w-sm">{error}</p>
      </div>
      
      <div className="flex gap-3">
        <Button variant="outline" onClick={handleClose}>
          Close
        </Button>
        <Button 
          onClick={() => setStep('upload')}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          Try Again
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Table className="w-6 h-6 text-purple-600" />
            Import Transactions from CSV
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Upload your bank statement or transaction history CSV file. 
            Our AI will automatically categorize each transaction for you.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
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
