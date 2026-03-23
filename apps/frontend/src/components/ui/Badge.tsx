import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'info', className = '', children, ...props }, ref) => {
    const baseStyles = 'inline-block rounded-full px-3 py-1 text-sm font-medium';
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    );
  },
);

Badge.displayName = 'Badge';
