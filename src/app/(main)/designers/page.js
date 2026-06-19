"use client";
import { useState, useEffect, useCallback, useRef, useMemo} from "react";
import { createClient } from "@/lib/supabase/client";
import UserAvatar from "@/components/ui/UserAvatar";
import FollowButton from "@/components/ui/FollowButton";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import { optimizeImage } from "@/lib/utils";
import { formatMemberSince, isNewMember } from "@/lib/memberSince";
import { CREATIVE_TOOLS } from "@/lib/constants";
import {
  Search,
  MapPin,
  TrendingUp,
  Clock,
  Star,
  BadgeCheck,
  Sparkles,
  Award,
  Users2,
  Link as LinkIcon,
  Briefcase,
  Plus,
  Filter,
  SortDesc,
  ChevronDown
} from "lucide-react";

import "../../App.css";
import "./designers.css";
import HorizontalFeatureScroll from "@/components/marketing/HorizontalFeatureScroll";
import DesignerCard from "@/components/profile/DesignerCard";
export const runtime = 'edge';

const CATEGORIES = [
  "All",
  "Graphic Design",
  "UI/UX",
  "Branding",
  "Illustration",
  "Photography",
  "Motion Graphics",
];

const SORT_OPTIONS = [
  { value: "followers", label: "Most Followed", icon: TrendingUp },
  { value: "newest", label: "Newest", icon: Clock },
  { value: "projects", label: "Most Projects", icon: Star },
];

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VirtualDesignerChunk({ designersChunk, currentUserId }) {
  const [isVisible, setIsVisible] = useState(true);
  const [height, setHeight] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current) setHeight(containerRef.current.offsetHeight);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, designersChunk.length]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Keep the last chunk visible if height isn't calculated yet
        if (height > 0) setIsVisible(entries[0].isIntersecting);
      },
      { rootMargin: '3000px 0px' }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [height]);

  if (!isVisible && height > 0) {
    return <div style={{ height: `${height}px`, width: '100%', marginBottom: '2rem' }} />;
  }

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", gap: "2rem", marginBottom: "2rem" }}>
      {designersChunk.map((designer) => (
        <DesignerCard
          key={designer.id}
          designer={designer}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

function DesignersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";
  const initialSort = searchParams.get("sort") || "projects";
  const [data, setData] = useState({
    heroDesigner: null,
    featuredDesigners: [],
    risingDesigners: [],
    designers: [],
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const PAGE_SIZE = 24;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // Sync search, category & sort to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category !== "All") params.set("category", category);
      if (sort !== "projects") params.set("sort", sort);
      router.replace(`/designers?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, sort, router]);

  const loadDesigners = useCallback(
    async (
      pageNum = 1,
      currentCat = "All",
      currentSort = "followers",
      append = false,
    ) => {
      if (pageNum === 1) setLoading(true);

      try {
        const res = await fetch(
          `/api/designers?category=${encodeURIComponent(currentCat)}&sort=${currentSort}&page=${pageNum}`,
        );
        if (!res.ok) throw new Error("Failed to fetch designers");
        const payload = await res.json();

        const newDesigners = (payload.designers || []).filter(
          (c) => c.id !== currentUserId,
        );
        setHasMore(payload.designers?.length === PAGE_SIZE);

        setData((prev) => {
          if (!append) {
            return {
              heroDesigner: payload.heroDesigner || prev.heroDesigner,
              featuredDesigners:
                payload.featuredDesigners || prev.featuredDesigners,
              risingDesigners: payload.risingDesigners || prev.risingDesigners,
              designers: newDesigners,
            };
          }

          const existingIds = new Set(prev.designers.map((c) => c.id));
          const added = newDesigners.filter((c) => !existingIds.has(c.id));
          return {
            ...prev,
            designers: [...prev.designers, ...added],
          };
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  // Load initial data and handle filter/sort changes
  useEffect(() => {
    async function init() {
      setPage(1);
      await loadDesigners(1, category, sort, false);
    }
    init();
  }, [category, sort, loadDesigners]);

  // Handle pagination
  useEffect(() => {
    async function fetchPage() {
      if (page > 1) await loadDesigners(page, category, sort, true);
    }
    fetchPage();
  }, [page, category, sort, loadDesigners]);

  // Use featured designers if available in DB, otherwise fallback to rising designers
  let displayDesigners = [];
  if (
    data.heroDesigner ||
    (data.featuredDesigners && data.featuredDesigners.length > 0)
  ) {
    const allFeatured = [];
    if (data.heroDesigner) allFeatured.push(data.heroDesigner);
    if (data.featuredDesigners) allFeatured.push(...data.featuredDesigners);

    displayDesigners = allFeatured
      .map((f) => ({
        ...f.profiles,
        id: f.id,
        is_featured: true,
        bio: f.featured_description || f.profiles?.bio,
        banner_url: f.banner_url,
      }))
      .slice(0, 4);
  } else {
    displayDesigners = (data.risingDesigners || [])
      .map((r) => ({
        ...r,
        is_featured: false,
        banner_url:
          r.sampleProjects?.[0]?.thumbnail_url ||
          r.sampleProjects?.[0]?.cover_url,
      }))
      .slice(0, 4);
  }

  // Handle search (client-side filtering for simplicity, or we could add to API)
  const filteredDesigners = search.trim()
    ? data.designers.filter(
        (c) =>
          c.username.toLowerCase().includes(search.toLowerCase()) ||
          (c.full_name &&
            c.full_name.toLowerCase().includes(search.toLowerCase())),
      )
    : data.designers;

  return (
    <>
      {/* 1. EDITORIAL HEADER & PREMIUM CAROUSEL */}
      {!loading &&
        displayDesigners.length > 0 &&
        page === 1 &&
        category === "All" && (
          <div style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
            <div className="page-content">

              {/* ── Section header ── */}
              <div style={{ marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2d43e8', margin: '0 0 0.3rem' }}>
                  Trending this week
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    Rising Designers
                  </h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.4 }}>
                    The fastest-growing creatives on Desayner right now.
                  </p>
                </div>
              </div>

              {/* ── 4-column grid ── */}
              <div className="trending-grid" style={{ paddingBottom: '0.5rem' }}>
                {displayDesigners.map((creator) => (
                  <div key={creator.id} className="td-card">

                    {/* Cover image */}
                    <Link href={`/profile/${creator.username}`} className="td-card__cover-link">
                      {creator.banner_url ? (
                        <img
                          src={optimizeImage(creator.banner_url, 800)}
                          alt=""
                          className="td-card__cover-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="td-card__cover-placeholder" />
                      )}

                      {/* Label badge */}
                      <span className={creator.is_featured ? 'td-card__badge td-card__badge--featured' : 'td-card__badge td-card__badge--rising'}>
                        {creator.is_featured ? 'Featured' : 'Rising'}
                      </span>
                    </Link>

                    {/* Body */}
                    <div className="td-card__body">

                      {/* Avatar row */}
                      <Link href={`/profile/${creator.username}`} className="td-card__avatar-wrap">
                        <UserAvatar src={creator.avatar_url} name={creator.full_name || creator.username} size={48} />
                      </Link>

                      {/* Name */}
                      <Link href={`/profile/${creator.username}`} className="td-card__name-link">
                        <span className="td-card__name">{creator.full_name || creator.username}</span>
                      </Link>

                      {/* Bio */}
                      <p className="td-card__bio">
                        {creator.bio || 'Creative professional on Desayner.'}
                      </p>

                      {/* Footer */}
                      <div className="td-card__footer">
                        <div className="td-card__stats">
                          <span className="td-card__stat">
                            <strong>{creator.followers_count || 0}</strong>
                            <span>Followers</span>
                          </span>
                          <span className="td-card__sep" />
                          <span className="td-card__stat">
                            <strong>{creator.projects_count || 0}</strong>
                            <span>Works</span>
                          </span>
                        </div>
                        <FollowButton targetUserId={creator.id} currentUserId={currentUserId} compact={true} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>


            </div>
          </div>

        )}

      <div className="page-content">
        <HorizontalFeatureScroll />
        {/* 3. Main Explore Section */}
        <div style={{ marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
            Explore Designers
          </h2>
        </div>

        {/* Filters and Search Bar Container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          {/* Category Filters */}
          <div
            className="category-scroll-container"
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.5rem",
              scrollbarWidth: "none",
              flex: 1,
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  borderRadius: "30px",
                  border: "1px solid",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  background: category === cat ? "#231f20" : "white",
                  color: category === cat ? "white" : "#4b5563",
                  borderColor: category === cat ? "#231f20" : "#e2e8f0",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  if (category !== cat)
                    e.currentTarget.style.borderColor = "#9b9b9b";
                }}
                onMouseOut={(e) => {
                  if (category !== cat)
                    e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", width: "300px", flexShrink: 0 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1.2rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#64748b",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search designers..."
              style={{
                width: "100%",
                padding: "0.85rem 1rem 0.85rem 3rem",
                borderRadius: "30px",
                border: "1px solid #cbd5e1",
                background: "white",
                fontSize: "0.95rem",
                color: "#0f172a",
                outline: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                transition: "all 0.2s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#231f20";
                e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e1";
                e.target.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            />
          </div>
        </div>

        {/* Sort Controls */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.4rem 0.75rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: sort === opt.value ? "#000" : "#9b9b9b",
              }}
            >
              <opt.icon
                size={14}
                color={sort === opt.value ? "#000" : "#9b9b9b"}
              />{" "}
              {opt.label}
            </button>
          ))}
        </div>
        
        {/* Main Grid */}
        {loading && page === 1 ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  height: "360px",
                  overflow: "hidden",
                  border: "1px solid #f0f0f0",
                }}
              >
                <div style={{ height: "180px", background: "#f5f5f5" }} />
                <div
                  style={{ padding: "1.5rem", display: "flex", gap: "1rem" }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      background: "#f0f0f0",
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        width: "60%",
                        height: "14px",
                        background: "#f0f0f0",
                        borderRadius: "4px",
                      }}
                    />
                    <div
                      style={{
                        width: "40%",
                        height: "12px",
                        background: "#f5f5f5",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDesigners.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No professionals found"
            description={
              search
                ? `No results match "${search}". Try a different name or clear your filters.`
                : `No professionals found in ${category} yet.`
            }
            actionLabel={search || category !== "All" ? "Clear filters" : undefined}
            onAction={
              search || category !== "All"
                ? () => {
                    setSearch("");
                    setCategory("All");
                  }
                : undefined
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {Array.from({ length: Math.ceil(filteredDesigners.length / 12) }).map((_, i) => (
              <VirtualDesignerChunk
                key={i}
                designersChunk={filteredDesigners.slice(i * 12, (i + 1) * 12)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && search === "" && (
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="btn btn-outline"
              style={{
                padding: "0.85rem 3rem",
                fontSize: "1rem",
                borderRadius: "30px",
                fontWeight: 700,
              }}
            >
              Discover More Designers
            </button>
          </div>
        )}

        {loading && page > 1 && (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 0",
              color: "#9b9b9b",
              fontWeight: 600,
            }}
          >
            Loading more...
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------



function RisingCreatorRow({ creator, rank }) {
  return (
    <Link
      href={`/profile/${creator.username}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        textDecoration: "none",
        color: "inherit",
        padding: "0.5rem",
        borderRadius: "8px",
        transition: "background 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = "#f8fafc")}
      onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div
        style={{
          width: "24px",
          fontWeight: 800,
          color: rank <= 3 ? "#111827" : "#9ca3af",
          fontSize: "1.1rem",
          textAlign: "center",
        }}
      >
        #{rank}
      </div>
      <UserAvatar
        src={creator.avatar_url}
        name={creator.full_name || creator.username}
        size={40}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {creator.full_name || creator.username}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
          {creator.followers_count} followers
        </div>
      </div>
      <div
        style={{
          color: "#10b981",
          fontWeight: 700,
          fontSize: "0.85rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        <TrendingUp size={12} />
      </div>
    </Link>
  );
}

export default function DesignersPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "4rem", textAlign: "center", color: "#9b9b9b" }}>
          Loading...
        </div>
      }
    >
      <DesignersContent />
    </Suspense>
  );
}
