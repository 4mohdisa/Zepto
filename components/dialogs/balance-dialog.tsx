'use client';

import { useState, useCallback, useEffect } from 'react';
import { Wallet, Loader2, History, Plus, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/providers';
import { toast } from 'sonner';
import { accountTypes } from '@/constants/account-types';
import { debugLogger } from '@/lib/utils/debug-logger';
import { useBalanceHistory } from '@/hooks/use-balance-history';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils/format';

interface BalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BalanceDialog({ open, onOpenChange, onSuccess }: BalanceDialogProps) {
  const [activeTab, setActiveTab] = useState('set');
  const [accountType, setAccountType] = useState('Checking');
  const [balance, setBalance] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyAccountFilter, setHistoryAccountFilter] = useState('all');
  
  const { user } = useAuth();
  const supabase = useSupabaseClient();
  const { history, loading: historyLoading, refetch: refetchHistory, addHistoryRecord } = useBalanceHistory({
    accountType: historyAccountFilter === 'all' ? undefined : historyAccountFilter,
    limit: 50,
  });

  // Refresh history when dialog opens
  useEffect(() => {
    if (open && activeTab === 'history') {
      refetchHistory();
    }
  }, [open, activeTab, refetchHistory]);

  const handleClose = useCallback(() => {
    setAccountType('Checking');
    setBalance('');
    setNote('');
    setActiveTab('set');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error('You must be logged in');
      return;
    }

    const balanceValue = parseFloat(balance);
    if (isNaN(balanceValue)) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    debugLogger.info('balance', 'Setting current balance', { 
      accountType, 
      balance: balanceValue 
    });

    try {
      // 1. Update current snapshot in account_balances
      const today = new Date().toISOString().split('T')[0]
      const { error: upsertError } = await supabase
        .from('account_balances')
        .upsert({
          user_id: user.id,
          account_type: accountType,
          current_balance: balanceValue,
          effective_date: today,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,account_type',
        });

      if (upsertError) throw upsertError;

      // 2. Insert immutable history record via API
      await addHistoryRecord(accountType, balanceValue, note);

      debugLogger.info('balance', 'Balance updated and history recorded', {
        accountType,
        balance: balanceValue,
      });

      toast.success(`Balance updated for ${accountType}`);
      onSuccess?.();
      handleClose();
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error'
      const errorCode = err?.code
      
      debugLogger.error('balance', 'Failed to update balance', {
        accountType,
        balance: balanceValue,
        error: errorMessage,
        code: errorCode,
      });
      
      // Show helpful message for specific errors
      if (errorCode === 'TABLE_MISSING') {
        toast.error('Balance history table not set up. Please run the database migration.')
      } else {
        toast.error(`Failed to update balance: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Account Balance
          </DialogTitle>
          <DialogDescription>
            Manage your account balances and view update history.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="set" className="flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Set Balance
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Set Balance Tab */}
          <TabsContent value="set" className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-type">Account Type</Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger id="account-type">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="balance">Current Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your actual bank account balance.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">
                  Note <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="note"
                  placeholder="e.g. After payday, reconciliation, etc."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || !balance}
                className="bg-[#635BFF] hover:bg-[#5851EA]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Balance'
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 flex flex-col min-h-0 mt-4">
            {/* Filter */}
            <div className="mb-3">
              <Select value={historyAccountFilter} onValueChange={setHistoryAccountFilter}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Filter by account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accountTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* History List */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No balance history yet</p>
                  <p className="text-xs mt-1">Set a balance to start tracking history</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-[#635BFF]/10 flex items-center justify-center flex-shrink-0">
                        <Wallet className="h-4 w-4 text-[#635BFF]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {record.account_type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDateTime(record.created_at)}</span>
                          {record.note && (
                            <span className="truncate max-w-[150px]">• {record.note}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-sm">
                          {formatCurrency(record.balance_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default BalanceDialog;
