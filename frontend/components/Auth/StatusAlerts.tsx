'use client';

import React from 'react';

interface StatusAlertsProps {
  error?: string;
  successMsg?: string;
}

export function StatusAlerts({ error, successMsg }: StatusAlertsProps) {
  return (
    <>
      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '10px', borderRadius: '8px', fontSize: '12.5px', textAlign: 'center', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)', color: '#22C55E', padding: '10px', borderRadius: '8px', fontSize: '12.5px', textAlign: 'center', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}
    </>
  );
}