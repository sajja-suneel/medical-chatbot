'use client';

import React from 'react';

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.5px', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
          Document Indexer
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', transition: 'all 0.2s', fontSize: '18px', lineHeight: 1
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          title="Close panel"
        >
          &times;
        </button>
      </div>
      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.4', fontWeight: 500 }}>
        Index PDF and text documents to add them to your medical knowledge base.
      </p>
    </>
  );
}