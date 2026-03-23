import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  className?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = false, className = '', children, ...props }, ref) => {
    const baseStyles =
      'bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 transition-all duration-200';
    const interactiveStyle = interactive
      ? 'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 cursor-pointer'
      : '';
    const combinedClassName = `${baseStyles} ${interactiveStyle} ${className}`;

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
