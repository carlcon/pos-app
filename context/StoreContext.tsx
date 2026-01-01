'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';
import type { Store } from '@/types';

interface StoreContextValue {
  stores: Store[];
  loading: boolean;
  selectedStoreId: number | null;
  selectedStore: Store | null;
  setSelectedStoreId: (storeId: number | null) => void;
  refreshStores: () => Promise<void>;
  partnerId: number | null;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, effectivePartnerId, effectiveStoreId, isImpersonatingStore } = useAuth();
  const partnerId = effectivePartnerId;
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const storageKey = partnerId ? `selected_store_${partnerId}` : null;

  const refreshStores = async () => {
    if (!partnerId) {
      setStores([]);
      setSelectedStoreId(null);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get<Store[] | { results?: Store[] }>('/stores/');
      const fetchedStores: Store[] = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];
      setStores(fetchedStores);

      // If impersonating a store, always use that store
      if (isImpersonatingStore && effectiveStoreId) {
        setSelectedStoreId(effectiveStoreId);
        return;
      }

      // Apply persisted selection when available
      const persistedId = storageKey ? localStorage.getItem(storageKey) : null;
      const parsedPersisted = persistedId ? Number.parseInt(persistedId, 10) : null;
      const hasPersisted = parsedPersisted && fetchedStores.some((store: Store) => store.id === parsedPersisted);

      const defaultStoreId = user?.default_store?.id;
      const hasDefault = defaultStoreId && fetchedStores.some((store: Store) => store.id === defaultStoreId);

      if (hasPersisted) {
        setSelectedStoreId(parsedPersisted);
      } else if (hasDefault) {
        setSelectedStoreId(defaultStoreId!);
        if (storageKey) localStorage.setItem(storageKey, defaultStoreId!.toString());
      } else if (fetchedStores.length > 0) {
        // Default to the first store to keep UX predictable
        setSelectedStoreId(fetchedStores[0].id);
        if (storageKey) localStorage.setItem(storageKey, fetchedStores[0].id.toString());
      } else {
        setSelectedStoreId(null);
        if (storageKey) localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Failed to load stores', error);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  // Load stores whenever the partner context changes
  useEffect(() => {
    setStores([]);
    setSelectedStoreId(null);

    if (!partnerId) return;

    // If impersonating a store, set it immediately
    if (isImpersonatingStore && effectiveStoreId) {
      setSelectedStoreId(effectiveStoreId);
    } else {
      const persistedId = storageKey ? localStorage.getItem(storageKey) : null;
      if (persistedId) {
        setSelectedStoreId(Number.parseInt(persistedId, 10));
      }
    }

    refreshStores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, isImpersonatingStore, effectiveStoreId]);

  const handleSetSelectedStore = (storeId: number | null) => {
    // Don't allow changing store when impersonating
    if (isImpersonatingStore) return;
    
    setSelectedStoreId(storeId);
    if (storageKey) {
      if (storeId === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, storeId.toString());
      }
    }
  };

  const selectedStore = selectedStoreId ? stores.find(store => store.id === selectedStoreId) || null : null;

  const value: StoreContextValue = {
    stores,
    loading,
    selectedStoreId,
    selectedStore,
    setSelectedStoreId: handleSetSelectedStore,
    refreshStores,
    partnerId,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
