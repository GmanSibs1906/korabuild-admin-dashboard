import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    disabled, 
    className, 
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          // Variant styles
          variant === 'primary' && "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-500",
          variant === 'secondary' && "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500",
          variant === 'outline' && "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
          variant === 'ghost' && "text-gray-700 hover:bg-gray-100 focus-visible:ring-gray-500",
          variant === 'destructive' && "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
          // Size styles
          size === 'sm' && "h-8 px-3 text-sm",
          size === 'md' && "h-10 px-4 text-base",
          size === 'lg' && "h-12 px-6 text-lg",
          // Loading state
          loading && "cursor-wait",
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg 
            className="mr-2 h-4 w-4 animate-spin" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button"; 