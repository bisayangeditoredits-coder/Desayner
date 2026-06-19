import { Download } from 'lucide-react';

const DEFAULT_PREVIEW = 'The quick brown fox';

const CAT_COLORS = {
  'serif':       { bg: '#fef3c7', color: '#92400e' },
  'sans-serif':  { bg: '#e0f2fe', color: '#0369a1' },
  'display':     { bg: '#ede9fe', color: '#6d28d9' },
  'handwriting': { bg: '#fce7f3', color: '#9d174d' },
  'monospace':   { bg: '#d1fae5', color: '#065f46' },
};

export default function FontCard({ font, previewText, loaded }) {
  const displayText = previewText.trim() || DEFAULT_PREVIEW;
  const downloadUrl = `https://fonts.google.com/download?family=${encodeURIComponent(font.name)}`;
  const catStyle = CAT_COLORS[font.category] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div
      className="font-card-item"
      style={{
        background: 'white',
        border: '1px solid #f0f0f0',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, border-color 0.18s, transform 0.2s ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem 0.5rem',
        gap: '0.75rem',
      }}>
        {/* Left: name + meta */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            margin: '0 0 0.25rem',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#231f20',
            fontFamily: 'var(--font-grotesk, inherit)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {font.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: catStyle.color,
              background: catStyle.bg,
              padding: '0.1rem 0.45rem',
              borderRadius: 4,
            }}>
              {font.category}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#9b9b9b', fontWeight: 500 }}>
              {font.styles.length} style{font.styles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Right: download button */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noreferrer noopener"
          title={`Download ${font.name}`}
          onClick={e => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.45rem 0.85rem',
            background: 'rgba(45, 67, 232, 0.08)',
            color: '#2d43e8',
            borderRadius: 100,
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            fontFamily: 'var(--font-grotesk, inherit)',
            transition: 'all 0.15s',
          }}
          onMouseOver={e => {
            e.currentTarget.style.background = '#2d43e8';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={e => {
            e.currentTarget.style.background = 'rgba(45, 67, 232, 0.08)';
            e.currentTarget.style.color = '#2d43e8';
          }}
        >
          <Download size={11} />
          Download
        </a>
      </div>

      {/* Preview text */}
      <div
        style={{
          padding: '0.25rem 1rem 1rem',
          fontSize: '1.55rem',
          color: '#0f172a',
          lineHeight: 1.35,
          wordBreak: 'break-word',
          minHeight: 68,
          display: 'flex',
          alignItems: 'center',
          fontFamily: loaded ? `'${font.name}', sans-serif` : 'inherit',
          transition: 'font-family 0.2s ease',
          borderTop: '1px solid #f3f4f6',
        }}
        aria-label={`${font.name} preview`}
      >
        {displayText}
      </div>
    </div>
  );
}
