'use client';

import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';

interface FileItem {
  filename: string;
  size?: number;
}

interface FileListItemProps {
  file: FileItem;
  onDelete: (filename: string) => void;
}

export function FileListItem({ file, onDelete }: FileListItemProps) {
  const getFileIconStyles = (filename: string) => {
    const lowerName = filename.toLowerCase();
    const isBlue = lowerName === 'wcr-6.pdf' || lowerName.endsWith('.txt') || lowerName.endsWith('.docx');
    return {
      bgColor: isBlue ? 'rgba(59, 130, 246, 0.1)' : '#FFF5F5',
      iconColor: isBlue ? '#3B82F6' : '#EF4444',
      textColor: isBlue ? '#3B82F6' : '#EF4444',
      label: isBlue ? 'TXT' : 'PDF'
    };
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '1.2 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const styles = getFileIconStyles(file.filename);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'var(--bubble)', border: '1px solid var(--border-color)',
        borderRadius: '12px', padding: '12px 14px', fontSize: '12px',
        color: 'var(--text-primary)', boxShadow: '0 2px 6px rgba(15, 23, 42, 0.01)', transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px', backgroundColor: styles.bgColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: styles.iconColor,
          flexShrink: 0, position: 'relative'
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ position: 'absolute', bottom: '2px', left: '0', right: '0', textAlign: 'center', fontSize: '6px', color: styles.textColor, fontWeight: 800 }}>{styles.label}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.filename}>
            {file.filename}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {formatSize(file.size)} • {styles.label}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', flexShrink: 0 }}>
        <div style={{ color: '#10B981', display: 'flex', alignItems: 'center' }} title="Indexed">
          <CheckCircle2 size={14} />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.filename);
          }}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
            padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#EF4444';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Delete document"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}