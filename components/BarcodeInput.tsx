'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@heroui/react';
import api from '@/lib/api';
import type { Product } from '@/types';

interface BarcodeInputProps {
  onProductFound: (product: Product) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  label?: string;
  autoFocus?: boolean;
}

export default function BarcodeInput({
  onProductFound,
  onError,
  placeholder = 'Scan or enter barcode...',
  label = 'Barcode',
  autoFocus = true,
}: BarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleBarcodeSubmit = async (value: string) => {
    if (!value.trim()) return;

    setIsLoading(true);
    try {
      const response = await api.get<Product>(`/inventory/products/barcode/${value}/`);
      onProductFound(response.data);
      setBarcode(''); // Clear input after successful scan
    } catch (error) {
      const errorMessage = 'Product not found with this barcode';
      if (onError) {
        onError(errorMessage);
      }
      console.error('Barcode lookup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key triggers barcode lookup
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSubmit(barcode);
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      label={label}
      placeholder={placeholder}
      value={barcode}
      onChange={(e) => setBarcode(e.target.value)}
      onKeyPress={handleKeyPress}
      isDisabled={isLoading}
      classNames={{
        input: 'font-mono',
      }}
      endContent={
        isLoading && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
        )
      }
    />
  );
}
