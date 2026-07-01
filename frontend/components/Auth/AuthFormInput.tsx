'use client';

import React, { useState } from 'react';

interface AuthFormInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  icon: React.ReactNode;
}

export function AuthFormInput({ label, type, value, onChange, placeholder, icon }: AuthFormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: '14px', display: 'flex', alignItems: 'center' }}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
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
      </div>
    </div>
  );
}