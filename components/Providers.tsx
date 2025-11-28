'use client';

import { ReactNode } from 'react';
import { HeroUIProvider, ToastProvider } from '@heroui/react';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      <ToastProvider placement="top-right" />
      <AuthProvider>
        {children}
      </AuthProvider>
    </HeroUIProvider>
  );
}
