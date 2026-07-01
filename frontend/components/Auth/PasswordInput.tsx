'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (val: string) => void;
  isSignUp: boolean;
  strength: string;
  percentage: number;
  color: string;
}

export function PasswordInput({ value, onChange, isSignUp, strength, percentage, color }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Portal Password
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px' }} />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          style={{
            width: '100%',
            padding: '11px 14px 11px 40px',
            borderRadius: '10px',
            border: `1px solid ${isFocused ? '#3B82F6' : '#E2E8F0'}`,
            fontSize: '13.5px',
            outline: 'none',
            color: '#0F172A',
            backgroundColor: '#FFFFFF',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: 'absolute',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            color: '#94A3B8',
          }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {isSignUp && value && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-4px' }}>
          <div style={{ width: '130px', height: '4px', backgroundColor: '#E2E8F0', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: color,
                transition: 'all 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: color }}>
            {strength}
          </span>
        </div>
      )}
    </div>
  );
}