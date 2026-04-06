// ============================================================================
// SYSTELOS PONTO — Logo Component
// Usa a mesma imagem S.png do TUR
// ============================================================================

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8',  text: 'text-lg' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <img
        src="/S.png"
        alt="SYSTELOS"
        className={`${sizes[size].icon} rounded-xl mb-3`}
      />
      {showText && (
        <>
          <h1
            className={`${sizes[size].text} font-bold`}
            style={{ color: '#0F1B3D', fontFamily: 'Poppins, sans-serif' }}
          >
            SYSTELOS PONTO
          </h1>
          <p className="text-gray-500 text-sm mt-1">Portal do funcionário</p>
        </>
      )}
    </div>
  )
}

export default Logo
