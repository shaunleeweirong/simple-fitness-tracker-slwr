import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '../../lib/utils';
import { Text, type TextProps } from './text';

// ── Card ─────────────────────────────────────────────────────────────

interface CardProps extends ViewProps {
  className?: string;
}

const Card = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-card shadow-sm',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// ── CardHeader ───────────────────────────────────────────────────────

const CardHeader = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('flex flex-col gap-1.5 p-4', className)}
        {...props}
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

// ── CardTitle ────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn('text-xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// ── CardDescription ──────────────────────────────────────────────────

const CardDescription = React.forwardRef<React.ElementRef<typeof Text>, TextProps>(
  ({ className, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
      />
    );
  }
);
CardDescription.displayName = 'CardDescription';

// ── CardContent ──────────────────────────────────────────────────────

const CardContent = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View ref={ref} className={cn('p-4 pt-0', className)} {...props} />
    );
  }
);
CardContent.displayName = 'CardContent';

// ── CardFooter ───────────────────────────────────────────────────────

const CardFooter = React.forwardRef<View, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn('flex flex-row items-center p-4 pt-0', className)}
        {...props}
      />
    );
  }
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
