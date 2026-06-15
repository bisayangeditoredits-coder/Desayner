"use client";
import { useState, useEffect, useCallback, useRef, useMemo} from "react";
import { createClient } from "@/lib/supabase/client";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import { stripCloudinaryProxy } from "@/lib/utils";
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

function DesignersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";
  const [data, setData] = useState({
    heroDesigner: null,
    featuredDesigners: [],
    risingDesigners: [],
    designers: [],
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("projects");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const PAGE_SIZE = 24;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Sync search & category to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (category !== "All") params.set("category", category);
      router.replace(`/designers?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category, router]);

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
        category === "All" &&
        search === "" && (
          <section style={{ marginBottom: "1.5rem", paddingTop: "1rem" }}>
            <div className="page-content">
              <div
                style={{
                  textAlign: "center",
                  maxWidth: "700px",
                  margin: "0 auto 1.5rem",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(0,0,0,0.04)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "30px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  <Sparkles size={12} /> Rising Stars
                </div>
                <h1
                  style={{
                    fontSize: "2rem",
                    fontWeight: 900,
                    marginBottom: "0.35rem",
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    color: "#111827",
                  }}
                >
                  Trending Designers
                </h1>
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#4b5563",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  Discover the fastest-growing creative professionals this week.
                </p>
              </div>

              {/* 4-Column Responsive Grid (Fills container completely) */}
              <div
                className="trending-grid"
                style={{ paddingBottom: "0.5rem" }}
              >
                {displayDesigners.map((creator) => (
                  <Link
                    key={creator.id}
                    href={`/profile/${creator.username}`}
                    className="featured-card"
                    style={{
                      background: "white",
                      borderRadius: "20px",
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      transition:
                        "transform 0.2s ease-out, box-shadow 0.2s ease-out",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                      cursor: "pointer",
                      color: "#111827",
                      textDecoration: "none",
                      aspectRatio: "3 / 4", // Keeps the portrait shape even when it stretches
                    }}
                  >
                    {/* Full Background Image */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        background: "#e5e7eb",
                        zIndex: 0,
                      }}
                    >
                      {creator.banner_url && (
                        <img
                          src={stripCloudinaryProxy(creator.banner_url)}
                          alt=""
                          className="featured-banner-img"
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease-out",
                          }}
                        />
                      )}
                    </div>

                    {/* Glassmorphism Top Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(255,255,255,0.7)",
                        backdropFilter: "blur(4px)",
                        WebkitBackdropFilter: "blur(4px)",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        color: "#111827",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        border: "1px solid rgba(255,255,255,0.5)",
                        zIndex: 2,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {creator.is_featured ? (
                        <>
                          <Star size={12} color="#eab308" fill="#eab308" />{" "}
                          Featured Designer
                        </>
                      ) : (
                        <>
                          <TrendingUp size={12} color="#8b5cf6" /> Rising
                          Designer
                        </>
                      )}
                    </div>

                    {/* Gradient Overlay for Bottom Text */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,1) 100%)",
                        zIndex: 1,
                      }}
                      className="gradient-overlay"
                    />

                    {/* Content Container Floating at Bottom */}
                    <div
                      style={{
                        padding: "1.25rem",
                        display: "flex",
                        flexDirection: "column",
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 2,
                        color: "#111827",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: 800,
                          margin: "0 0 0.25rem 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          color: "#000",
                        }}
                      >
                        <span
                          style={{
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {creator.full_name || creator.username}
                        </span>
                        <BadgeCheck
                          size={16}
                          color="#8b5cf6"
                          fill="#f3e8ff"
                          style={{ flexShrink: 0 }}
                        />
                      </h2>

                      {/* Bio */}
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "#4b5563",
                          lineHeight: 1.4,
                          margin: "0 0 1rem 0",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontWeight: 500,
                        }}
                      >
                        {creator.bio || "New talented creative on Desayner."}
                      </p>

                      {/* Footer Stats & Actions */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "0.5rem",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              color: "#8b5cf6",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            <Users2 size={14} />
                            {creator.followers_count || 0}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.2rem",
                              color: "#8b5cf6",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            <Star size={14} />
                            {creator.projects_count || 0}
                          </div>
                        </div>

                        <FollowButton
                          targetUserId={creator.id}
                          currentUserId={currentUserId}
                          compact={true}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <style jsx>{`
                .trending-grid {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 1.5rem;
                }
                @media (max-width: 1024px) {
                  .trending-grid {
                    grid-template-columns: repeat(2, 1fr);
                  }
                }
                @media (max-width: 640px) {
                  .trending-grid {
                    grid-template-columns: 1fr;
                  }
                }
                .featured-card:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
                }
                .featured-card:hover .featured-banner-img {
                  transform: scale(1.05);
                }
              `}</style>
            </div>
          </section>
        )}

      <div className="page-content">
        {/* 3. Main Explore Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800 }}>
            Explore Designers
          </h2>

          <div style={{ position: "relative", width: "300px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9b9b9b",
              }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search designers..."
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                borderRadius: "30px",
                border: "1px solid #e2e8f0",
                background: "white",
                fontSize: "0.9rem",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#231f20")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div
          className="category-scroll-container"
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
            marginBottom: "1rem",
            scrollbarWidth: "none",
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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {filteredDesigners.map((designer) => (
              <DesignerCard
                key={designer.id}
                designer={designer}
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

function getDesignerSkills(designer) {
  const fromProjects = (designer.sampleProjects || [])
    .map((p) => p.category)
    .filter(Boolean);
  const fromSkills = designer.skills || [];
  const fromTools = (designer.tools || [])
    .map((id) => CREATIVE_TOOLS.find((t) => t.id === id)?.name)
    .filter(Boolean);

  return Array.from(new Set([...fromProjects, ...fromSkills, ...fromTools])).slice(0, 6);
}

function DesignerCard({ designer, currentUserId }) {
  const skills = getDesignerSkills(designer);
  const projects = designer.sampleProjects || [];
  const isNew = isNewMember(designer.created_at);



  const memberLabel = formatMemberSince(designer.created_at);

  return (
    <div
      className="designer-card"
      style={{
        background: "white",
        borderRadius: "24px",
        border: "1px solid rgba(0,0,0,0.05)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.06)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.02)";
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Left: Avatar and Info */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href={`/profile/${designer.username}`}>
            <UserAvatar
              src={designer.avatar_url}
              name={designer.full_name || designer.username}
              size={56}
            />
          </Link>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Line 1: Name & Highlights */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <Link
                href={`/profile/${designer.username}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: "1.25rem",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontFamily: "var(--font-jakarta)",
                    letterSpacing: "-0.02em"
                  }}
                >
                  {designer.username || designer.full_name}
                </div>
              </Link>

              {isNew && (
                <span className="designer-card__new-badge">New</span>
              )}

              {designer.available_for_work && (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#dcfce7',
                  color: '#166534',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#16a34a' }} />
                  Available
                </span>
              )}

              {designer.followers_count > 100 ? (
                <span
                  style={{
                    background: "#231f20",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  PRO+
                </span>
              ) : (
                <span
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  PRO
                </span>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "13px",
                  color: "#0f172a",
                  fontWeight: 600,
                  marginLeft: "4px",
                }}
              >
                <BadgeCheck size={14} color="#10b981" />
                {designer.projects_count || 0} projects published
              </div>
            </div>

            {/* Line 2: Stats */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                fontSize: "13px",
                color: "#64748b",
                fontWeight: 500,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9' }}>
                  <Users2 size={12} color="#64748b" /> 
                </div>
                {designer.followers_count || 0} Followers
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9' }}>
                  <MapPin size={12} color="#64748b" /> 
                </div>
                {designer.location || "Remote"}
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9' }}>
                  <Clock size={12} color="#64748b" /> 
                </div>
                {memberLabel}
              </span>
              {designer.following_count > 0 && (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: '#f1f5f9' }}>
                    <Star size={12} color="#64748b" /> 
                  </div>
                  Following {designer.following_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FollowButton
            targetUserId={designer.id}
            currentUserId={currentUserId}
            compact
          />
          {designer.website && (
            <a
              href={designer.website.startsWith('http') ? designer.website : `https://${designer.website}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 24px",
                height: "44px",
                fontSize: "14px",
                borderRadius: "12px",
                fontWeight: 800,
                background: "#231f20",
                color: "white",
                textDecoration: "none",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "#27272a";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "#231f20";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get in touch
            </a>
          )}
        </div>
      </div>

      {/* Middle Projects */}
      {projects.length === 0 ? (
        <div className="designer-card__no-work">No work published yet</div>
      ) : (
        <div className="designer-card__projects-grid">
          {projects.slice(0, 4).map((proj) => (
            <div key={proj.id} className="designer-card__project-tile">
              <Link
                href={`/projects/${proj.id}`}
                style={{ display: "block", width: "100%", height: "100%" }}
              >
                <img
                  src={stripCloudinaryProxy(proj.thumbnail_url || proj.cover_url)}
                  alt={proj.title || ""}
                  loading="lazy"
                  className="img-fade-in"
                  onLoad={(e) => e.currentTarget.classList.add("loaded")}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Skills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {skills.length === 0 ? (
          <span className="designer-card__skills-empty">Skills not listed yet</span>
        ) : (
          skills.map((skill) => (
            <span
              key={skill}
              style={{
                padding: "6px 16px",
                background: "rgba(0,0,0,0.03)",
                color: "#334155",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "capitalize",
              }}
            >
              {skill}
            </span>
          ))
        )}
        {skills.length > 6 && (
          <span
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              fontWeight: 500,
              marginLeft: "4px",
            }}
          >
            +{skills.length - 6} skills
          </span>
        )}
      </div>
      <style jsx>{`
        .designer-card__projects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          min-height: 180px;
          width: 100%;
        }
        .designer-card__project-tile {
          border-radius: 16px;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
          border: 1px solid rgba(0,0,0,0.04);
          aspect-ratio: 4/3;
          width: 100%;
        }
        .designer-card__project-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s ease, opacity 0.35s ease;
        }
        .designer-card__no-work {
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px dashed #e2e8f0;
          color: #94a3b8;
          font-size: 0.875rem;
          font-weight: 600;
          width: 100%;
        }
        .designer-card__new-badge {
          background: #dcfce7;
          color: #166534;
          font-size: 10px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 6px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .designer-card__skills-empty {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 500;
          font-style: italic;
        }
        @media (max-width: 900px) {
          .designer-card__projects-grid {
            grid-template-columns: repeat(2, 1fr);
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
}

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
