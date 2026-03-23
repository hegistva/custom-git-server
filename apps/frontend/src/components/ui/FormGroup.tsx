import React from 'react';
import { Input, type InputProps } from './Input';

interface FormGroupProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children?: React.ReactNode;
  inputProps?: InputProps;
  htmlFor?: string;
}

export const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ label, required = false, error, helperText, children, inputProps, htmlFor }, ref) => {
    const inputId = htmlFor || `form-group-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div ref={ref} className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
          >
            {label}
            {required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
          </label>
        )}
        {children ? (
          children
        ) : (
          <Input id={inputId} error={error} helperText={helperText} {...inputProps} />
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  },
);

FormGroup.displayName = 'FormGroup';
