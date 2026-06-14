import Link from 'next/link';

export default function AdBanner({ className = '', style = {}, variant = 'horizontal' }) {
  // A clean, Carbon-Ads style placeholder
  const isVertical = variant === 'vertical';

  return (
    <div 
      className={`ad-banner-container ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: isVertical ? '0' : '0.85rem',
        background: '#f9f9f9',
        border: '1px solid #e8e8e8',
        borderRadius: '8px',
        maxWidth: isVertical ? '100%' : '300px',
        margin: '0 auto',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        ...style
      }}
    >
      <Link href="https://carbonads.net/" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: isVertical ? '0' : '0.85rem', textDecoration: 'none', width: '100%', height: isVertical ? '100%' : 'auto' }}>
        <div style={{ flexShrink: 0, width: isVertical ? '100%' : '130px', height: isVertical ? '400px' : '100px', background: '#e0e0e0', borderRadius: isVertical ? '0' : '4px', overflow: 'hidden' }}>
          <img 
            src={isVertical ? "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&h=800&auto=format&fit=crop" : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=260&h=200&auto=format&fit=crop"} 
            alt="Ad image" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isVertical ? '1rem' : '0' }}>
          <p style={{ fontSize: '0.75rem', color: '#4a4a4a', lineHeight: 1.4, margin: '0 0 0.5rem 0', fontWeight: 500, textAlign: isVertical ? 'center' : 'left' }}>
            Reach 100k+ designers daily. Advertise your design tool or service here.
          </p>
          <span style={{ fontSize: '0.65rem', color: '#9b9b9b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: isVertical ? 'center' : 'left' }}>
            Ads via Carbon
          </span>
        </div>
      </Link>
    </div>
  );
}
