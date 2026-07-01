'use client';

import React from 'react';

interface StatsDashboardProps {
  sessionCount: number;
  documentCount: number;
}

export function StatsDashboard({ sessionCount, documentCount }: StatsDashboardProps) {
  const statCardStyle: React.CSSProperties = {
    backgroundColor: 'var(--bubble)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  };

  const statTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 800,
    marginTop: '6px',
    lineHeight: 1,
  };

  const statSubtitleStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--text-muted)',
    marginTop: '4px',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
      {/* Chat History stats */}
      <div style={statCardStyle}>
        <span style={statTitleStyle}>Chat History</span>
        <span style={{ ...statValueStyle, color: '#A855F7' }}>{sessionCount}</span>
        <span style={statSubtitleStyle}>Total Conversations</span>
      </div>

      {/* Documents stats */}
      <div style={statCardStyle}>
        <span style={statTitleStyle}>Documents Indexed</span>
        <span style={{ ...statValueStyle, color: '#10B981' }}>{documentCount}</span>
        <span style={statSubtitleStyle}>Total Files</span>
      </div>
    </div>
  );
}