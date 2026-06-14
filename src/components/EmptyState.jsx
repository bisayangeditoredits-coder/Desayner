import Link from 'next/link';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryLabel,
  secondaryHref,
}) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state__icon">
          <Icon size={28} />
        </div>
      )}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      <div className="empty-state__actions">
        {actionLabel && (actionHref ? (
          <Link href={actionHref} className="btn btn-dark empty-state__btn">
            {actionLabel}
          </Link>
        ) : (
          <button type="button" className="btn btn-dark empty-state__btn" onClick={onAction}>
            {actionLabel}
          </button>
        ))}
        {secondaryLabel && secondaryHref && (
          <Link href={secondaryHref} className="empty-state__link">
            {secondaryLabel}
          </Link>
        )}
      </div>
      <style jsx>{`
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border: 1px solid #e8eaed;
          border-radius: 16px;
          max-width: 520px;
          margin: 0 auto;
        }
        .empty-state__icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 1.25rem;
          border-radius: 50%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }
        .empty-state__title {
          font-weight: 800;
          font-size: 1.15rem;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
          color: #0f172a;
        }
        .empty-state__desc {
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.55;
          margin: 0 auto 1.5rem;
          max-width: 360px;
        }
        .empty-state__actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .empty-state__btn {
          border-radius: 20px !important;
          font-size: 0.85rem !important;
        }
        .empty-state__link {
          font-size: 0.8rem;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
}
