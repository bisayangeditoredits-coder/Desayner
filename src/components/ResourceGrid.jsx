'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ExternalLink, X, Heart, Share2, ShieldCheck, Eye, TrendingUp, Sparkles } from 'lucide-react';

const resources = [
  { 
    id: 1, 
    title: "E-sports Mascot Logo", 
    category: "Illustrations", 
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    description: "A high-quality e-sports mascot logo featuring a stylized wolf. Perfect for gaming teams and streamers.",
    hashtags: ["#gaming", "#mascot", "#logo", "#vector"],
    stats: { downloads: "1.2k", views: "5.4k", license: "Free for Personal Use" }
  },
  { 
    id: 2, 
    title: "Modern Character Pack", 
    category: "AI-generated", 
    image: "https://images.unsplash.com/photo-1578632738981-43c0ad3ce9e1?auto=format&fit=crop&w=800&q=80",
    description: "Versatile 3D character illustrations generated with AI, optimized for modern UI/UX designs.",
    hashtags: ["#3d", "#character", "#ai", "#design"],
    stats: { downloads: "850", views: "3.1k", license: "Commercial License" }
  },
  { 
    id: 3, 
    title: "Dabbing Kid Illustration", 
    category: "Illustrations", 
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "Fun and vibrant flat illustration of a kid dabbing. Ideal for children's apps or playful branding.",
    hashtags: ["#vibrant", "#kid", "#illustration"],
    stats: { downloads: "2.1k", views: "10k", license: "Free for All Use" }
  },
  { 
    id: 4, 
    title: "Geometric Mandalas", 
    category: "Vectors", 
    image: "https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?auto=format&fit=crop&w=800&q=80",
    description: "Intricate geometric mandala patterns in vector format. Scaleable to any size without quality loss.",
    hashtags: ["#mandala", "#vector", "#pattern"],
    stats: { downloads: "4.5k", views: "15k", license: "Attribution Required" }
  },
  { 
    id: 5, 
    title: "Abstract Flourishes", 
    category: "Vectors", 
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80",
    description: "Elegant abstract design flourishes. Perfect for wedding invitations or luxury branding.",
    hashtags: ["#abstract", "#wedding", "#luxury"],
    stats: { downloads: "1.8k", views: "6.2k", license: "Free for Personal Use" }
  },
  { 
    id: 6, 
    title: "Fantasy Wolf Sketches", 
    category: "Illustrations", 
    image: "https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80",
    description: "Hand-drawn style wolf sketches for fantasy-themed projects or tattoos.",
    hashtags: ["#fantasy", "#sketch", "#wolf"],
    stats: { downloads: "920", views: "4.8k", license: "Free for All Use" }
  },
  { 
    id: 9, 
    title: "Neural Network Visualization", 
    category: "AI-generated", 
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    description: "Abstract representation of a neural network, perfect for tech blogs and AI startups.",
    hashtags: ["#ai", "#neural", "#network", "#tech"],
    stats: { downloads: "5.2k", views: "20k", license: "Commercial License" }
  },
  { 
    id: 10, 
    title: "Organic Liquid Shapes", 
    category: "Vectors", 
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "Modern organic liquid shapes for vibrant UI backgrounds.",
    hashtags: ["#liquid", "#shapes", "#modern"],
    stats: { downloads: "3.1k", views: "11k", license: "Free for All Use" }
  },
];

const ResourceGrid = () => {
  const [filter, setFilter] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const categories = ['All', 'Illustrations', 'Vectors', 'AI-generated', 'Templates'];

  const filtered = filter === 'All' ? resources : resources.filter(r => r.category === filter);

  return (
    <div className="resource-section">
      <div className="discovery-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div className="filter-tags">
          {categories.map(cat => (
            <button 
              key={cat} 
              className={`tag-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="sort-dropdown" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>Sort by:</span>
          <select style={{ border: '1px solid var(--glass-border)', padding: '0.5rem 1rem', borderRadius: '0', background: 'white', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none' }}>
            <option>Trending</option>
            <option>Newest</option>
            <option>Most Downloaded</option>
          </select>
        </div>
      </div>

      <div className="resource-grid">
        <AnimatePresence mode='popLayout'>
          {filtered.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="resource-card"
              onClick={() => setSelectedAsset(item)}
              style={{ cursor: 'pointer' }}
            >
              <div className="resource-img-container">
                <img src={item.image} alt={item.title} />
                <div className="resource-overlay">
                  <div className="overlay-top">
                    <div className="action-btn" style={{ width: '32px', height: '32px' }}><Heart size={16} /></div>
                  </div>
                  <div className="overlay-bottom">
                    <div style={{ display: 'flex', gap: '0.8rem', color: 'white', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Eye size={14} /> {item.stats.views}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={14} /> {item.stats.downloads}</span>
                    </div>
                    <div className="action-btn" style={{ width: '32px', height: '32px' }}><Download size={16} /></div>
                  </div>
                </div>
              </div>
              <div className="resource-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontWeight: 600 }}>{item.title}</h4>
                  {item.stats.downloads > '3k' && <span style={{ background: '#fef3f2', color: '#b91c1c', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}><TrendingUp size={10} style={{ display: 'inline', marginRight: '2px' }} /> Hot</span>}
                </div>
                <div className="tag-hashtags">
                  {item.hashtags.map(tag => <span key={tag} className="hashtag">{tag}</span>)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            className="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div 
              className="asset-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => setSelectedAsset(null)}>
                <X size={24} />
              </button>

              <div className="modal-content">
                <div className="modal-image">
                  <img src={selectedAsset.image} alt={selectedAsset.title} />
                </div>
                
                <div className="modal-details">
                  <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className="modal-category">{selectedAsset.category}</span>
                      <span style={{ width: '4px', height: '4px', background: 'var(--text-dim)', borderRadius: '50%' }}></span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>Premium Asset</span>
                    </div>
                    <h2>{selectedAsset.title}</h2>
                  </div>

                  <p className="modal-desc">{selectedAsset.description}</p>

                  <div className="tag-hashtags" style={{ marginBottom: '2rem' }}>
                    {selectedAsset.hashtags.map(tag => <span key={tag} className="hashtag" style={{ fontSize: '0.9rem' }}>{tag}</span>)}
                  </div>

                  <div className="asset-stats">
                    <div className="stat">
                      <span>Downloads</span>
                      <strong>{selectedAsset.stats.downloads}</strong>
                    </div>
                    <div className="stat">
                      <span>Views</span>
                      <strong>{selectedAsset.stats.views}</strong>
                    </div>
                    <div className="stat license-stat">
                      <ShieldCheck size={16} className="accent-icon" />
                      <span>{selectedAsset.stats.license}</span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-primary btn-full" style={{ gap: '1rem' }}>
                      <Download size={20} /> Download Asset
                    </button>
                    <div className="secondary-actions">
                      <button className="btn btn-outline" style={{ flex: 1 }}><Heart size={20} /> Save</button>
                      <button className="btn btn-outline" style={{ flex: 1 }}><Share2 size={20} /> Share</button>
                    </div>
                  </div>

                  <div className="creator-card" style={{ marginTop: 'auto', padding: '1.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--accent-red)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>C</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>Creldesk Creator</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Verified Asset Provider</p>
                    </div>
                    <button className="btn btn-outline" style={{ marginLeft: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>Follow</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceGrid;
