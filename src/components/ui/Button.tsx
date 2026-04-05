// ============================================================================
// SYSTELOS - Button Component
// ============================================================================

import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false, 
    isLoading = false, 
    className = '', 
    children, 
    disabled,
    ...props 
  }, ref) => {
    
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-semibold rounded-xl
      transition-all duration-200
      disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
    `
    
    const variants = {
      primary: `
        bg-gradient-to-r from-[#0F1B3D] to-[#1a2d5a]
        text-white
        hover:shadow-lg hover:shadow-[#0F1B3D]/30 hover:-translate-y-0.5
      `,
      secondary: `
        bg-[#FFB800]
        text-[#0F1B3D]
        hover:bg-[#E5A600] hover:-translate-y-0.5
      `,
      outline: `
        border-2 border-gray-200
        bg-white text-gray-700
        hover:border-[#FFB800] hover:bg-[#FFFBEB]
      `,
      ghost: `
        bg-transparent
        text-[#0F1B3D]
        hover:bg-gray-100
      `,
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    }
    
    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg 
              className="animate-spin w-5 h-5" 
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
            <span>Aguarde...</span>
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
