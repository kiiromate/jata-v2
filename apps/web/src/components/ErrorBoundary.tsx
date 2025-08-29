import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorDisplay from './ErrorDisplay';
import { Button } from '@/components/ui/button';
import { captureException } from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureException(error, { extra: { componentStack: errorInfo.componentStack } });
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay
          title="Something Went Wrong"
          message="An unexpected error occurred. Please try refreshing the page. If the problem persists, please contact support."
          action={
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
