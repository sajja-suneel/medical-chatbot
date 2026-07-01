'use client';

import React from 'react';
import { SidebarLogo } from './SidebarLogo';
import { NewChatButton } from './NewChatButton';
import { SessionList } from './SessionList';
import { UserProfileFooter } from './UserProfileFooter';

interface UserData {
  name: string;
  email: string;
  role: string;
}

interface SidebarProps {
  activeSessionId: string;
  sessions: { id: string; domain: string; date: string; title?: string }[];
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onLogout: () => void;
  currentUser: UserData | null;
}

export default function Sidebar({
  activeSessionId,
  sessions,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLogout,
  currentUser,
}: SidebarProps) {
  return (
    <div
      style={{
        width: '280px',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 10,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <SidebarLogo />

      <NewChatButton onClick={onNewChat} />

      <SessionList
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
      />

      <UserProfileFooter 
        currentUser={currentUser} 
        onLogout={onLogout} 
      />
    </div>
  );
}