"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";
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
} from "lucide-react";
import "../../App.css";

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
  const [sort, setSort] = useState("followers");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const supabase = createClient();
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
          <section style={{ marginBottom: "1.5rem", paddingTop: "2rem" }}>
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
                    gap: "0.5rem",
                    background: "rgba(0,0,0,0.05)",
                    padding: "0.4rem 1rem",
                    borderRadius: "30px",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginBottom: "0.75rem",
                    color: "#8b5cf6",
                  }}
                >
                  <Sparkles size={14} /> Rising Stars
                </div>
                <h1
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 900,
                    marginBottom: "0.5rem",
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
                          src={creator.banner_url}
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
            marginBottom: "2rem",
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
              onFocus={(e) => (e.target.style.borderColor = "#0a0a0a")}
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
            paddingBottom: "1rem",
            marginBottom: "2rem",
            scrollbarWidth: "none",
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "0.6rem 1.25rem",
                fontSize: "0.9rem",
                fontWeight: 600,
                borderRadius: "30px",
                border: "1px solid",
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: category === cat ? "#0a0a0a" : "white",
                color: category === cat ? "white" : "#4b5563",
                borderColor: category === cat ? "#0a0a0a" : "#e2e8f0",
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
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                fontSize: "0.85rem",
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
          <div
            style={{
              textAlign: "center",
              padding: "6rem 2rem",
              background: "white",
              borderRadius: "24px",
              border: "1px dashed #d1d5db",
            }}
          >
            <Sparkles
              size={48}
              color="#d1d5db"
              style={{ marginBottom: "1.5rem", margin: "0 auto" }}
            />
            <p
              style={{
                fontWeight: 800,
                fontSize: "1.25rem",
                marginBottom: "0.5rem",
              }}
            >
              No professionals found
            </p>
            <p style={{ fontSize: "1rem", color: "#6b7280" }}>
              {search
                ? `No results match "${search}"`
                : `No professionals found in ${category}`}
            </p>
            <div style={{ marginTop: "1.5rem" }}>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="btn"
                style={{
                  padding: "0.6rem 1.5rem",
                  fontSize: "0.9rem",
                  background: "#0a0a0a",
                  color: "white",
                  fontWeight: 700,
                  borderRadius: "30px",
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
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

function DesignerCard({ designer, currentUserId }) {
  const skills = Array.from(
    new Set(
      (designer.sampleProjects || []).map((p) => p.category).filter(Boolean),
    ),
  );
  if (skills.length === 0) skills.push("ui design", "branding", "web design");

  const handleMessage = (e) => {
    e.preventDefault();
    if (!currentUserId) {
      window.location.href = `/login?redirect=/designers`;
      return;
    }
    window.location.href = `/messages?open=${designer.id}`;
  };

  const joinedYear = designer.created_at
    ? new Date(designer.created_at).getFullYear()
    : "2023";

  return (
    <div
      className="designer-card"
      style={{
        background: "white",
        borderRadius: "16px",
        border: "1px solid #f0f0f0",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
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
                    fontWeight: 800,
                    fontSize: "1.15rem",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {designer.username || designer.full_name}
                </div>
              </Link>

              {designer.followers_count > 100 ? (
                <span
                  style={{
                    background: "#1e293b",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px",
                  }}
                >
                  PRO+
                </span>
              ) : (
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    fontSize: "10px",
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: "4px",
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
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Users2 size={14} /> {designer.followers_count || 0} Followers
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <MapPin size={14} /> {designer.location || "Remote"}
              </span>
              <span
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Clock size={14} /> Member since {joinedYear}
              </span>
              {designer.following_count > 0 && (
                <span
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <Star size={14} /> Following {designer.following_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#0f172a",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#0f172a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <Star size={18} />
          </div>
          <button
            onClick={handleMessage}
            style={{
              padding: "0 20px",
              height: "40px",
              fontSize: "14px",
              borderRadius: "24px",
              fontWeight: 700,
              background: "#0f172a",
              color: "white",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#0f172a")}
          >
            Get in touch
          </button>
        </div>
      </div>

      {/* Middle Projects (up to 4, larger) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          height: "220px",
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const proj = designer.sampleProjects && designer.sampleProjects[i];
          return (
            <div
              key={i}
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                background: "#f8fafc",
                position: "relative",
              }}
            >
              {proj ? (
                <Link
                  href={`/projects/${proj.id}`}
                  style={{ display: "block", width: "100%", height: "100%" }}
                >
                  <img
                    src={proj.thumbnail_url || proj.cover_url}
                    alt={proj.title || ""}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.4s ease",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                </Link>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#e2e8f0",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                    }}
                  >
                    <Star size={14} opacity={0.5} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Skills */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {skills.slice(0, 6).map((skill) => (
          <span
            key={skill}
            style={{
              padding: "6px 14px",
              background: "#f8fafc",
              color: "#64748b",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "lowercase",
              border: "1px solid #f1f5f9",
            }}
          >
            {skill}
          </span>
        ))}
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
