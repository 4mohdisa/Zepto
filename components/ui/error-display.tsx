'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  title?: string;
  description?: string;
  details?: string;
  onRetry?: () => void;
  onRefresh?: () => void;
  /**
   * Display mode - 'overlay' creates a full-screen centered overlay,
   * while 'inline' positions the error card within the parent container
   */
  mode?: 'overlay' | 'inline';
}

export function ErrorDisplay({
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.",
  details,
  onRetry,
  onRefresh,
  mode = 'overlay'
}: ErrorDisplayProps): React.ReactElement {
  const containerClasses = mode === 'overlay' 
    ? "fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
    : "w-full h-full flex items-center justify-center py-8";

  return (
    <div className={containerClasses}>
      <Card className="w-full max-w-md shadow-lg border-destructive/30">
        <CardHeader className="flex flex-row items-center gap-2">
          <div className="bg-destructive/10 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-destructive">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </CardHeader>
        
        {details && (
          <CardContent>
            <div className="bg-muted p-3 rounded text-sm font-mono overflow-auto max-h-[150px] text-muted-foreground">
              {details}
            </div>
          </CardContent>
        )}
        
        <CardFooter className="flex justify-end gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onRefresh && (
            <Button onClick={onRefresh}>
              Refresh Page
            </Button>
          )}
          {!onRetry && !onRefresh && (
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
