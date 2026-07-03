// frontend/components/indexer/DocumentUpload.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SidebarHeader } from './SidebarHeader';
import { IndexedFileList } from './IndexedFileList';
import { DragDropZone } from './DragDropZone';
import { StatusDisplay } from './StatusDisplay';
import { QuickActionsGrid } from './QuickActionsGrid';
import { StatsDashboard } from './StatsDashboard';
import { Globe, FileText, CheckSquare, Square } from 'lucide-react';

interface DocumentUploadProps {
  onClose: () => void;
  onNewChat?: () => void;
  sessionCount?: number;
  token?: string; 
}

export default function DocumentUpload({ onClose, onNewChat, sessionCount, token }: DocumentUploadProps) {
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [isDynamic, setIsDynamic] = useState(false);

  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'indexing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [existingFiles, setExistingFiles] = useState<{ filename: string; size: number }[]>([]);
  
  const [showFileList, setShowFileList] = useState(false);
  const [localSessionCount, setLocalSessionCount] = useState(0);

  const fetchExistingFiles = async () => {
    if (!token) return; 
    try {
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
    }
  };

  useEffect(() => {
    if (sessionCount !== undefined) return;

    const updateSessionCount = () => {
      const savedUser = localStorage.getItem('clinic_logged_in_user');
      let email = '';
      if (savedUser) {
        try {
          const userObj = JSON.parse(savedUser);
          email = userObj.email;
        } catch (e) {
          console.error('Error parsing logged-in user:', e);
        }
      }

      const userKey = email ? `rag_chatbot_sessions_${email}` : 'rag_chatbot_sessions';
      const stored = localStorage.getItem(userKey);
      if (stored) {
        try {
          setLocalSessionCount(JSON.parse(stored).length);
        } catch (e) {
          setLocalSessionCount(0);
        }
      } else {
        setLocalSessionCount(0);
      }
    };

    updateSessionCount();
    window.addEventListener('storage', updateSessionCount);
    window.addEventListener('app:new-chat', updateSessionCount);
    return () => {
      window.removeEventListener('storage', updateSessionCount);
      window.removeEventListener('app:new-chat', updateSessionCount);
    };
  }, [sessionCount]);

  useEffect(() => {
    fetchExistingFiles();
  }, [uploadState, token]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const processFiles = async (files: File[]) => {
    if (!token) {
      setUploadState('error');
      setErrorMessage('Authentication token is missing. Please sign in again.');
      return;
    }

    const allowedExtensions = ['.pdf', '.docx', '.csv', '.xlsx', '.xls', '.txt'];
    const validFiles = files.filter((file) => {
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      return allowedExtensions.includes(ext);
    });

    if (validFiles.length === 0) {
      setUploadState('error');
      setErrorMessage('Invalid file types. Please select PDF, DOCX, CSV, XLSX, XLS, or TXT.');
      return;
    }

    setUploadState('uploading'); setErrorMessage('');
    const formData = new FormData();
    validFiles.forEach((file) => formData.append('files', file));

    try {
      const response = await fetch('/api/upload-files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      setUploadState('indexing');
      
      setTimeout(() => {
        setUploadState('success');
        fetchExistingFiles();
      }, 3000);

    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'An error occurred during file upload');
    }
  };

  // URL Scraping API Handler
  const handleScrapeURL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput) return;

    if (!token) {
      setUploadState('error');
      setErrorMessage('Authentication token is missing. Please sign in again.');
      return;
    }

    setUploadState('uploading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          url: urlInput,
          is_dynamic: isDynamic
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Web scraping failed');
      }

      setUploadState('indexing');
      
      setTimeout(() => {
        setUploadState('success');
        setUrlInput('');
        fetchExistingFiles();
      }, 3000);

    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Error occurred during scraping');
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!token) return;
    try {
      setUploadState('uploading');
      const response = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.ok) {
        setUploadState('idle');
        fetchExistingFiles();
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Error deleting file');
    }
  };

  const handleClearAll = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete all indexed documents? This cannot be undone.')) return;
    try {
      setUploadState('uploading');
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.ok) {
        setUploadState('idle');
        fetchExistingFiles();
      } else {
        throw new Error('Failed to clear documents');
      }
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Error clearing documents');
    }
  };

  const handleNewChatClick = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      window.dispatchEvent(new CustomEvent('app:new-chat'));
    }
  };

  const activeSessionCount = sessionCount !== undefined ? sessionCount : localSessionCount;

  return (
    <div style={{ width: '320px', backgroundColor: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px', zIndex: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      <SidebarHeader onClose={onClose} />

      {/* Tabs Header */}
      {!showFileList && (
        <div style={{ display: 'flex', backgroundColor: 'rgba(0, 0, 0, 0.05)', padding: '4px', borderRadius: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('file')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', backgroundColor: activeTab === 'file' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'file' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'file' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={14} />
            <span>Files</span>
          </button>
          <button
            onClick={() => setActiveTab('url')}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', backgroundColor: activeTab === 'url' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'url' ? '#0F172A' : '#64748B',
              boxShadow: activeTab === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={14} />
            <span>Web URL</span>
          </button>
        </div>
      )}

      {showFileList ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <button 
            onClick={() => setShowFileList(false)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: 'none', border: 'none', color: 'var(--primary)', 
              fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '14px',
              padding: '4px 0', alignSelf: 'flex-start'
            }}
          >
            ← Back to Dashboard
          </button>
          <IndexedFileList files={existingFiles} onDeleteFile={handleDeleteFile} onClearAll={handleClearAll} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {activeTab === 'file' ? (
            <DragDropZone dragActive={dragActive} onDrag={handleDrag} onDrop={handleDrop} onChange={handleChange} />
          ) : (
            /* Scrape URL Form */
            <form onSubmit={handleScrapeURL} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.4)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Website Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://wikipedia.org/wiki/Diabetes"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)',
                    fontSize: '13px', backgroundColor: '#FFFFFF', color: '#0F172A', outline: 'none'
                  }}
                />
              </div>

              <div 
                onClick={() => setIsDynamic(!isDynamic)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0' }}
              >
                {isDynamic ? (
                  <CheckSquare size={16} color="#3B82F6" style={{ flexShrink: 0 }} />
                ) : (
                  <Square size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
                )}
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#475569', userSelect: 'none' }}>
                  Execute JavaScript (Dynamic Sites)
                </span>
              </div>

              <button
                type="submit"
                disabled={uploadState === 'uploading' || !urlInput}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                  backgroundColor: !urlInput ? '#CBD5E1' : '#3B82F6',
                  color: '#FFFFFF', fontWeight: 700, fontSize: '12.5px', cursor: !urlInput ? 'default' : 'pointer',
                  transition: 'background-color 0.2s', marginTop: '4px',
                  boxShadow: urlInput ? '0 4px 10px rgba(59, 130, 246, 0.2)' : 'none'
                }}
              >
                {uploadState === 'uploading' ? 'Scraping...' : 'Scrape & Index'}
              </button>
            </form>
          )}

          <StatusDisplay uploadState={uploadState} errorMessage={errorMessage} onReset={() => setUploadState('idle')} />

          <QuickActionsGrid onNewChat={handleNewChatClick} onViewDocuments={() => setShowFileList(true)} />
          <StatsDashboard sessionCount={activeSessionCount} documentCount={existingFiles.length} />
        </div>
      )}
      
      <style jsx global>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}