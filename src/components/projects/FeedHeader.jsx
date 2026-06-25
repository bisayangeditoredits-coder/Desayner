import React from 'react';
import Image from 'next/image';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import HorizontalFeatureScroll from '@/components/marketing/HorizontalFeatureScroll';

const WelcomeModal = dynamic(() => import('@/components/onboarding/WelcomeModal'), { ssr: false });
const BANNERS = ['/featured-contest-cover.jpeg'];

export default function FeedHeader({ searchInput, setSearchInput, goToSearch }) {
  return (
    <>
      <WelcomeModal />
      
      {/* Banner Section */}
      {BANNERS.length > 0 && (
        <div className="event-banner-wrapper feed-header__banner">
          <Image
            src={BANNERS[0]}
            alt="Desayner featured banner"
            className="event-banner-img"
            width={1200}
            height={300}
            priority
            sizes="100vw"
            unoptimized={true}
          />
        </div>
      )}

      {/* Dribbble-style Search Hero */}
      <div className="feed-header__search-hero">
        <div className="feed-header__search-wrapper">
          <input
            type="text"
            placeholder="What type of design are you interested in?"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') goToSearch(); }}
            className="feed-header__search-input"
            onFocus={(e) => e.target.classList.add('focused')}
            onBlur={(e) => e.target.classList.remove('focused')}
          />
          <button
            type="button"
            onClick={goToSearch}
            className="feed-header__search-btn"
            aria-label="Search"
          >
            <Search size={20} />
          </button>
        </div>
      </div>
    </>
  );
}
