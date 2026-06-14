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
    </div>
  );
}
