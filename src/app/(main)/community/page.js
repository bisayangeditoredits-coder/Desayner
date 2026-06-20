'use client';
import { useState } from 'react';
import PostFeed from '@/components/community/PostFeed';
import CommunityLeftSidebar from '@/components/community/CommunityLeftSidebar';
import CommunityRightSidebar from '@/components/community/CommunityRightSidebar';
import styles from './community.module.css';

export default function CommunityPage() {
  const [sort,  setSort]  = useState('hot');
  const [flair, setFlair] = useState('all');

  return (
    <div className={styles.container}>
      <CommunityLeftSidebar sort={sort} setSort={setSort} flair={flair} setFlair={setFlair} />
      
      <main className={styles.mainFeed}>
        {/* We moved the header and filters to the left sidebar, so this is just the feed now */}
        <PostFeed key={`${sort}-${flair}`} sort={sort} flair={flair} />
      </main>

      <CommunityRightSidebar />
    </div>
  );
}
