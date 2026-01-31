import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '../../lib/utils';

interface InputProps extends TextInputProps {
  className?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          'h-12 rounded-md border border-input bg-background px-3 text-base text-foreground',
          'placeholder:text-muted-foreground',
          props.editable === false && 'opacity-50',
          className
        )}
        placeholderTextColor={placeholderTextColor ?? '#9ca3af'}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, type InputProps };
