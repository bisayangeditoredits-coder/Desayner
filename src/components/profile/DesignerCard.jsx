"use client";

import Link from "next/link";
import UserAvatar from "@/components/ui/UserAvatar";
import FollowButton from "@/components/ui/FollowButton";
import { optimizeImage } from "@/lib/utils";
import { formatMemberSince, isNewMember } from "@/lib/memberSince";
import { CREATIVE_TOOLS } from "@/lib/constants";
import {
  MapPin,
  Clock,
  Star,
  BadgeCheck,
  Users2
} from "lucide-react";

export function getDesignerSkills(designer) {
  const fromProjects = (designer.sampleProjects || [])
    .map((p) => p.category)
    .filter(Boolean);
  const fromSkills = designer.skills || [];
  const fromTools = (designer.tools || [])
    .map((id) => CREATIVE_TOOLS.find((t) => t.id === id)?.name)
    .filter(Boolean);

  return Array.from(new Set([...fromProjects, ...fromSkills, ...fromTools])).slice(0, 6);
}

export default function DesignerCard({ designer, currentUserId }) {
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
                  src={optimizeImage(proj.thumbnail_url || proj.cover_url, 600)}
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
