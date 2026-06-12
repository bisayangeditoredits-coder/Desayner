'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import FeedbackCard from '@/components/FeedbackCard';
import FeedbackUploadModal from '@/components/FeedbackUploadModal';
import useSWRInfinite from 'swr/infinite';
import './Feedback.css';

const STATUS_FILTERS = ['All', 'Open', 'Closed', 'Implemented'];
const LIMIT = 20;

export default function FeedbackPage() {
  const [activeStatus, setActiveStatus] = useState('All');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const sentinelRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // SWR Data Fetching (cursor-based)
  const getKey = (pageIndex, previousPageData) => {
    if (previousPageData && !previousPageData.hasMore) return null;
    let url = `/api/feedback?limit=${LIMIT}`;
    if (activeStatus !== 'All') {
      url += `&status=${activeStatus.toLowerCase()}`;
    }
    if (pageIndex > 0 && previousPageData?.nextCursor) {
      url += `&cursor=${encodeURIComponent(previousPageData.nextCursor)}`;
    }
    return url;
  };

  const fetcher = url => fetch(url).then(res => res.json());

  const { data, size, setSize, isValidating, mutate, error } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
  });

  const feedbacks = data
    ? data
        .filter(page => page && page.feedback)
        .flatMap(page => page.feedback || [])
        .filter(item => item)
    : [];
  const isLoadingInitialData = !data && !error;
  const isLoadingMore = isLoadingInitialData || (size > 0 && data && typeof data[size - 1] === 'undefined');
  const isEmpty = data?.[0]?.feedback?.length === 0;
  const hasMore = data ? data[data.length - 1]?.hasMore : false;

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoadingInitialData || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isValidating && !isLoadingMore) {
        setSize(size + 1);
      }
    }, { threshold: 0.1 });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [isLoadingInitialData, isLoadingMore, isValidating, hasMore, size, setSize]);

  const handleStatusChange = useCallback((status) => {
    setActiveStatus(status);
    // Reset to first page when filter changes
    setSize(1);
  }, [setSize]);

  const handleUploadSuccess = useCallback((newItem) => {
    mutate((currentData) => {
      if (!currentData) return currentData;
      const newData = [...currentData];
      newData[0] = { ...newData[0], feedback: [newItem, ...(newData[0].feedback || [])] };
      return newData;
    }, false);
    setUploadOpen(false);
  }, [mutate]);

  return (
    <div className="page-content" style={{ padding: '1.5rem' }}>
      <div className="feedback-container">
        {/* Header */}
        <div className="feedback-header" style={{
          position: 'sticky',
          top: '56px',
          zIndex: 100,
          background: 'var(--primary-bg, #f1f5f9)',
          padding: '0.5rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h1 className="feedback-title" style={{ fontSize: '1.5rem' }}>
              <MessageSquare size={20} /> Design Feedback
            </h1>
            <p className="feedback-desc">Share your designs and get constructive feedback from the community.</p>
          </div>

          {currentUserId && (
            <button className="feedback-share-btn" onClick={() => setUploadOpen(true)}>
              <Plus size={16} /> Request Feedback
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="feedback-status-tabs" style={{
          position: 'sticky',
          top: '112px',
          zIndex: 99,
          background: 'var(--primary-bg, #f1f5f9)',
        }}>
          {STATUS_FILTERS.map(status => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`feedback-status-tab ${activeStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Feedback Grid */}
        {isLoadingInitialData ? (
          <div className="feedback-grid">
            {[1,2,3,4,5,6,7,8].map((_, idx) => (
              <div key={idx} className="feedback-skeleton-card">
                <div className="feedback-skeleton-image" />
                <div className="feedback-skeleton-body">
                  <div className="feedback-skeleton-title" />
                  <div className="feedback-skeleton-text" />
                  <div className="feedback-skeleton-row" />
                </div>
              </div>
            ))}
          </div>
        ) : isEmpty ? (
          <div className="feedback-empty">
            <div className="feedback-empty__icon">
              <MessageSquare size={24} />
            </div>
            <h3 className="feedback-empty__title">No feedback requests yet</h3>
            <p className="feedback-empty__desc">
              Be the first to share your design and ask for feedback!
            </p>
            {currentUserId ? (
              <button className="feedback-empty__btn" onClick={() => setUploadOpen(true)}>
                Share Design
              </button>
            ) : (
              <a href="/login" className="feedback-empty__btn">Sign In to Share</a>
            )}
          </div>
        ) : (
          <>
            <div className="feedback-grid">
              {feedbacks.map(item => (
                <FeedbackCard
                  key={item.id}
                  feedback={item}
                  currentUserId={currentUserId}
                />
              ))}
            </div>

            {hasMore && (
              <div ref={sentinelRef} style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isLoadingMore && <div className="chat-messages__spinner" />}
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        {uploadOpen && (
          <FeedbackUploadModal
            onClose={() => setUploadOpen(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </div>
    </div>
  );
}