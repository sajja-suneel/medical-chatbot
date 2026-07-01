'use client';

import React, { useState } from 'react';
import { Briefcase, ChevronDown } from 'lucide-react';

interface RoleSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export function RoleSelect({ value, onChange }: RoleSelectProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Hospital Role
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Briefcase size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px' }} />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 40px 11px 40px',
            borderRadius: '10px',
            border: `1px solid ${isFocused ? '#3B82F6' : '#E2E8F0'}`,
            fontSize: '13.5px',
            outline: 'none',
            color: '#0F172A',
            backgroundColor: '#FFFFFF',
            cursor: 'pointer',
            appearance: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <option value="Medical Assistant">Medical Assistant</option>
          <option value="Physician / Doctor">Physician / Doctor</option>
          <option value="Nurse Practitioner">Nurse Practitioner</option>
          <option value="Administrator,Patient">Administrator</option>
          <option value="User">User</option>
        </select>
        <ChevronDown size={16} color="#94A3B8" style={{ position: 'absolute', right: '14px', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}