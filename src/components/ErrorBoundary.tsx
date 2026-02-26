'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Card } from './ui';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='flex items-center justify-center min-h-[400px] p-6'>
          <Card className='max-w-md w-full text-center'>
            <div className='flex justify-center mb-4'>
              <div className='p-3 bg-red-100 rounded-full'>
                <AlertCircle className='text-red-600' size={32} />
              </div>
            </div>
            <h2 className='text-xl font-bold mb-2 text-foreground'>Something went wrong</h2>
            <p className='text-gray-500 mb-6'>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === 'development' && (
                <div className='mb-6 p-4 bg-gray-100 rounded text-left overflow-auto max-h-40'>
                    <code className='text-xs text-red-600'>{this.state.error?.toString()}</code>
                </div>
            )}
            <Button 
                onClick={this.handleReset}
                startIcon={<RefreshCw size={18} />}
                fullWidth
            >
              Refresh Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
