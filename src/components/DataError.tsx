import React from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface DataErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const DataError: React.FC<DataErrorProps> = ({
  title = "Connection Error",
  message = "We couldn't load the content. Please check your internet connection and try again.",
  onRetry,
  className = "my-8",
}) => {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>{message}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-2 bg-background hover:bg-destructive/10 text-destructive border-destructive/20"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default DataError;
