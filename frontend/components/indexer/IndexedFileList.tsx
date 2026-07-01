'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { FileListItem } from './FileListItem';

interface FileItem {
  filename: string;
  size: number;
}

interface IndexedFileListProps {
  files: FileItem[];
  onDeleteFile: (filename: string) => void;
  onClearAll: () => void;
}

export function IndexedFileList({ files, onDeleteFile, onClearAll }: IndexedFileListProps) {
  return (
    <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <FileText size={14} style={{ color: 'var(--primary)' }} />
          Indexed Documents ({files.length})
        </h4>
        {files.length > 0 && (
          <button
            onClick={onClearAll}
            style={{
              background: 'none', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            Clear All
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {files.length === 0 ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No documents indexed yet.
          </p>
        ) : (
          files.map((file, index) => (
            <FileListItem key={index} file={file} onDelete={onDeleteFile} />
          ))
        )}
      </div>
    </div>
  );
}