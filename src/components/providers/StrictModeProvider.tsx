'use client';

import React, { ReactNode } from 'react';

interface ConditionalStrictModeProps {
  children: ReactNode;
  disabled?: boolean;
}

/**
 * Conditional StrictMode wrapper that can be disabled for components
 * that don't work well with React's double mounting behavior
 */
export function ConditionalStrictMode({ children, disabled = false }: ConditionalStrictModeProps) {
  // In production or when disabled, just return children without StrictMode
  if (process.env.NODE_ENV === 'production' || disabled) {
    return <>{children}</>;
  }
  
  // In development, use StrictMode unless disabled
  return (
    <React.StrictMode>
      {children}
    </React.StrictMode>
  );
}

// Alternative: Simple wrapper that never uses StrictMode
export function NoStrictMode({ children }: { children: ReactNode }) {
  return <>{children}</>;
}