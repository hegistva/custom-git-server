import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string;
  href?: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { to, href, external = false, children, className = '', ...rest } = props;

  const baseStyles =
    'text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors duration-200';
  const combinedClassName = `${baseStyles} ${className}`;

  // Internal router link
  if (to && !external) {
    return (
      <RouterLink to={to} className={combinedClassName} {...rest}>
        {children}
      </RouterLink>
    );
  }

  // External or regular anchor link
  const finalRest = Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'to'));

  return (
    <a
      ref={ref}
      href={href || to}
      className={combinedClassName}
      {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      {...finalRest}
    >
      {children}
    </a>
  );
});

Link.displayName = 'Link';
