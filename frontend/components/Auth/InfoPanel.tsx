'use client';

import React from 'react';
import { Shield } from 'lucide-react';

interface InfoPanelProps {
  isSignUp: boolean;
}

export function InfoPanel({ isSignUp }: InfoPanelProps) {
  return (
    <div
      style={{
        width: '45%',
        background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 100%)',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
      }}
    >
      {/* Top Brand Logo & Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E3A8A',
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            <path d="M11 7h2v2h2v2h-2v2h-2v-2H9V9h2V7z" fill="#E0F2FE" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1E3A8A', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
            Sri Venkateshwara Hospital
          </h2>
          <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700, letterSpacing: '0.4px' }}>
            Compassion • Care • Cure
          </span>
        </div>
      </div>

      {/* Middle text & hospital photo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '24px 0' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E3A8A', lineHeight: '1.2', margin: '0 0 8px 0', fontFamily: "'Outfit', sans-serif" }}>
            Welcome to <br /> Sri Venkateshwara Hospital
          </h1>
          <p style={{ fontSize: '13px', color: '#475569', fontWeight: 500, margin: 0, lineHeight: 1.4 }}>
            {isSignUp ? 'Create your account to access our secure hospital portal' : 'Sign in to access your secure hospital portal'}
          </p>
        </div>

        {/* Hospital Building photo card */}
        <div
          style={{
            flex: 1,
            minHeight: '260px',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.08)',
            position: 'relative',
            backgroundImage: 'url("/hospital.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60px',
              background: 'linear-gradient(180deg, rgba(30, 64, 175, 0) 0%, rgba(30, 64, 175, 0.7) 100%)',
            }}
          />
        </div>
      </div>

      {/* Bottom Features Info Bar */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF',
          boxShadow: '0 4px 12px rgba(30, 64, 175, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Shield size={12} strokeWidth={3} />
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Secure & Reliable</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px' }}>👥</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Trusted by Patients</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px' }}>❤️</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Quality Healthcare</span>
        </div>
      </div>
    </div>
  );
}