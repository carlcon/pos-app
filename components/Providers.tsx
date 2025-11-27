'use client';

import { ReactNode } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </HeroUIProvider>
  );
}
