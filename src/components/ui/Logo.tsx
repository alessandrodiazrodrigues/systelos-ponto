// ============================================================================
// SYSTELOS PONTO — Logo Component
// Adaptado do TUR: texto alterado para "SYSTELOS PONTO"
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
      {/* Ícone [S] dourado — mesmo do TUR */}
      <div
        className={`${sizes[size].icon} rounded-xl flex items-center justify-center text-white font-bold mb-3`}
        style={{ background: 'linear-gradient(135deg, #E8B84B 0%, #c9a03a 100%)', fontSize: size === 'lg' ? '1.75rem' : size === 'md' ? '1.5rem' : '1rem' }}
      >
        [S]
      </div>

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
