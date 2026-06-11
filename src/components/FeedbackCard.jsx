'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, MessageCircle, ThumbsUp } from 'lucide-react';
import UserAvatar from './UserAvatar';

const STATUS_STYLES = {
  open: { label: 'Open', bg: '#e0f2fe', color: '#0369a1' },
  closed: { label: 'Closed', bg: '#f1f5f9', color: '#64748b' },
  implemented: { label: 'Implemented', bg: '#d1fae5', color: '#059669' },
};

const FEEDBACK_TYPE_LABELS = {
  typography: 'Typography',
  colors: 'Colors',
  layout: 'Layout',
  general: 'General',
  'ui/ux': 'UI/UX',
  branding: 'Branding',
  illustration: 'Illustration',
};

export default function FeedbackCard({ feedback, currentUserId }) {
  const author = feedback.profiles;
  const status = STATUS_STYLES[feedback.status] || STATUS_STYLES.open;
  const feedbackTypes = feedback.feedback_type || [];

  return (
    <div className="feedback-card-wrapper">
      <motion.div
        className="feedback-card"
        whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
      >
        {/* Image */}
        <Link
          href={`/feedback/${feedback.id}`}
          className="feedback-card__image-link"
          prefetch={true}
        >
          <div className="feedback-card__image-wrapper">
            {feedback.image_url ? (
              <img
                src={feedback.thumbnail_url || feedback.image_url}
                alt={feedback.title || 'Feedback design'}
                className="feedback-card__img"
                loading="lazy"
              />
            ) : (
              <div className="feedback-card__no-image">No Design</div>
            )}

            {/* Status badge */}
            <div
              className="feedback-card__status-badge"
              style={{ background: status.bg, color: status.color }}
            >
              {status.label}
            </div>
          </div>
        </Link>

        {/* Content */}
        <div className="feedback-card__content">
          <Link href={`/feedback/${feedback.id}`} className="feedback-card__title-link">
            <h3 className="feedback-card__title">{feedback.title}</h3>
          </Link>

          {feedback.description && (
            <p className="feedback-card__desc">{feedback.description.length > 80
              ? feedback.description.slice(0, 80) + '…'
              : feedback.description}
            </p>
          )}

          {/* Tags */}
          {feedbackTypes.length > 0 && (
            <div className="feedback-card__tags">
              {feedbackTypes.slice(0, 3).map(type => (
                <span key={type} className="feedback-card__tag">
                  {FEEDBACK_TYPE_LABELS[type] || type}
                </span>
              ))}
              {feedbackTypes.length > 3 && (
                <span className="feedback-card__tag feedback-card__tag--more">
                  +{feedbackTypes.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="feedback-card__footer">
            {author ? (
              <Link
                href={author.username ? `/profile/${author.username}` : '#'}
                className="feedback-card__author"
              >
                <UserAvatar
                  src={author.avatar_url}
                  name={author.full_name || author.username || 'Unknown'}
                  size={22}
                />
                <span className="feedback-card__author-name">
                  {author.full_name || author.username || 'Unknown'}
                </span>
              </Link>
            ) : (
              <div />
            )}

            <div className="feedback-card__stats">
              <div className="feedback-card__stat" title="Views">
                <Eye size={13} />
                <span>{feedback.views_count || 0}</span>
              </div>
              <div className="feedback-card__stat" title="Comments">
                <MessageCircle size={13} />
                <span>{feedback.comments_count || 0}</span>
              </div>
              <div className="feedback-card__stat" title="Helpful">
                <ThumbsUp size={13} />
                <span>{feedback.helpful_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}