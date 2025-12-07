'use client';

import { ReactNode } from 'react';

interface NoStrictModeProps {
  children: ReactNode;
}

/**
 * Component that bypasses React.StrictMode for video components
 * This is necessary because Twilio Video SDK doesn't handle
 * the double mounting/cleanup that StrictMode causes in development
 */
export function NoStrictMode({ children }: NoStrictModeProps) {
  return <>{children}</>;
}