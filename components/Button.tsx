import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-accent-gold text-white hover:bg-opacity-90 hover:shadow-lg hover:-translate-y-0.5',
        secondary:
          'bg-transparent border-2 border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-white',
        ghost:
          'bg-transparent text-primary hover:bg-gray-100',
        outline:
          'bg-white border-2 border-gray-300 text-primary hover:border-accent-gold hover:text-accent-gold',
        danger:
          'bg-red-500 text-white hover:bg-red-600 hover:shadow-lg',
      },
      size: {
        sm: 'px-4 py-2 text-sm rounded-md',
        md: 'px-6 py-3 text-base rounded-md',
        lg: 'px-8 py-4 text-lg rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

