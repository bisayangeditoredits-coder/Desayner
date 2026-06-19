import { Lock, Unlock } from 'lucide-react';
import { getLum, hexToRgb } from '@/lib/colorUtils';

export default function ColorSlot({ index, hex, isPinned, isActive, onTogglePin, onColorChange, onActivate, allowAI, isFirst, isLast }) {
  const lum = getLum(hexToRgb(hex));
  const textColor = lum > 140 ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)';
  const activeTextColor = lum > 140 ? 'rgba(0,0,0,1)' : 'rgba(255,255,255,1)';

  return (
    <div
      className="hero-color-slot"
      onClick={() => onActivate(index)}
      style={{
        position: 'relative',
        flex: isActive ? 1.6 : 1,
        height: '100%',
        background: hex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease',
      }}
    >
      <div 
        className="slot-content"
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1.25rem', 
          transition: 'all 0.3s ease',
        }}
      >
        {allowAI && (
          <button
            onClick={e=>{ e.stopPropagation(); onTogglePin(index); }}
            className="slot-pin-btn"
            style={{ 
              background: 'transparent', 
              border: 'none', 
              cursor: 'pointer',
              opacity: isPinned ? 1 : (isActive ? 0.8 : 0),
              transition: 'all 0.2s ease',
              padding: '0.5rem',
              transform: isPinned || isActive ? 'scale(1)' : 'scale(0.8)'
            }}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            {isPinned ? <Lock size={26} color={activeTextColor} /> : <Unlock size={26} color={textColor} />}
          </button>
        )}

        <span 
          className="slot-hex-text"
          style={{ 
            fontSize: isActive ? '1.75rem' : '1.15rem', 
            fontWeight: 900, 
            color: isPinned || isActive ? activeTextColor : textColor, 
            letterSpacing: '0.08em', 
            fontFamily: 'var(--font-mono, monospace)',
            textTransform: 'uppercase',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {(!allowAI) ? hex.replace('#', '') : (isPinned || isActive ? hex.replace('#', '') : 'AI')}
        </span>
      </div>
    </div>
  );
}
