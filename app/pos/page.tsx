'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Input,
  Spinner,
  Divider,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import BarcodeInput from '@/components/BarcodeInput';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { Product, SaleItem } from '@/types';

interface CartItem extends SaleItem {
  product_name: string;
  available_stock: number;
  max_quantity: number;
}

interface ProductSearchResult extends Product {
  display_price: string;
}

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash' },
  { key: 'CARD', label: 'Card' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { key: 'CHECK', label: 'Check' },
];

function POSContent() {
  const { user, effectiveStoreId, isCashier, isImpersonatingStore } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [discount, setDiscount] = useState<string>('0');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState<{ sale_number: string; total: string } | null>(null);
  
  const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);
  const change = (parseFloat(amountPaid) || 0) - total;

  // Search products
  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const params: Record<string, string> = { search: query };
      if (effectiveStoreId) {
        params.store_id = effectiveStoreId.toString();
      }
      
      const response = await api.get<{ results: Product[] }>('/products/', { params });
      const products = response.data.results.map(p => ({
        ...p,
        display_price: p.selling_price,
      }));
      setSearchResults(products.slice(0, 10));
    } catch (error) {
      console.error('Product search failed:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [effectiveStoreId]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product === product.id);
      
      if (existing) {
        // Increase quantity if stock allows
        if (existing.quantity < product.current_stock) {
          return prev.map(item =>
            item.product === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev;
      }
      
      // Add new item
      return [...prev, {
        product: product.id,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1,
        unit_price: product.selling_price,
        available_stock: product.current_stock,
        max_quantity: product.current_stock,
        barcode: product.barcode,
      }];
    });
    
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  // Update cart item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product === productId
          ? { ...item, quantity: Math.max(1, Math.min(quantity, item.max_quantity)) }
          : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setCustomerName('');
    setAmountPaid('');
    searchInputRef.current?.focus();
  };

  // Submit sale
  const handleSubmitSale = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    if (paymentMethod === 'CASH' && change < 0) {
      alert('Insufficient amount paid');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const saleData = {
        customer_name: customerName || null,
        payment_method: paymentMethod,
        discount: discountAmount.toFixed(2),
        store: effectiveStoreId,
        items: cart.map(item => ({
          product: item.product,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const response = await api.post<{ sale_number: string; total_amount: string }>('/sales/', saleData);
      
      setLastSale({
        sale_number: response.data.sale_number,
        total: response.data.total_amount,
      });
      
      clearCart();
      onSuccessOpen();
    } catch (error) {
      console.error('Sale failed:', error);
      alert('Failed to process sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if POS is accessible
  const canUsePOS = effectiveStoreId || isImpersonatingStore;

  if (!canUsePOS) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-800 mb-2">Store Required</h2>
            <p className="text-amber-700">
              POS requires a store context. Please select or impersonate a store to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Minimal navbar for cashiers */}
      {isCashier ? (
        <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#049AE0] to-[#0B7FBF] rounded-lg flex items-center justify-center text-white font-bold">
              P
            </div>
            <span className="font-semibold text-lg">POS Terminal</span>
          </div>
          <div className="flex items-center gap-4">
            <Chip size="sm" color="success" variant="flat">
              {user?.assigned_store?.name || 'Store'}
            </Chip>
            <span className="text-sm text-gray-600">{user?.username}</span>
          </div>
        </div>
      ) : (
        <Navbar />
      )}

      <div className="flex h-[calc(100vh-64px)]">
        {/* Left Panel - Product Search & Cart */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  ref={searchInputRef}
                  placeholder="Search products or scan barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="lg"
                  startContent={<span>🔍</span>}
                  className="text-lg"
                />
              </div>
              <div className="w-64">
                <BarcodeInput 
                  onProductFound={addToCart} 
                  label=""
                  placeholder="Scan barcode..."
                  autoFocus={false}
                />
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute z-50 mt-2 w-[calc(100%-2rem)] max-w-2xl bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 border-b last:border-b-0"
                    onClick={() => addToCart(product)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku} | Stock: {product.current_stock}
                      </div>
                    </div>
                    <div className="text-lg font-semibold text-primary">
                      ₱{parseFloat(product.display_price).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg p-4 text-center">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-semibold text-lg">Cart ({cart.length} items)</h2>
              {cart.length > 0 && (
                <Button size="sm" variant="flat" color="danger" onPress={clearCart}>
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-4xl mb-2">🛒</span>
                  <p>Cart is empty</p>
                  <p className="text-sm">Search or scan products to add</p>
                </div>
              ) : (
                <div className="divide-y">
                  {cart.map((item) => (
                    <div key={item.product} className="p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          ₱{parseFloat(item.unit_price).toFixed(2)} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          onPress={() => updateQuantity(item.product, item.quantity - 1)}
                          isDisabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity.toString()}
                          onChange={(e) => updateQuantity(item.product, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                          size="sm"
                          min={1}
                          max={item.max_quantity}
                        />
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          onPress={() => updateQuantity(item.product, item.quantity + 1)}
                          isDisabled={item.quantity >= item.max_quantity}
                        >
                          +
                        </Button>
                      </div>
                      <div className="w-24 text-right font-semibold">
                        ₱{(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                      </div>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="light"
                        color="danger"
                        onPress={() => removeFromCart(item.product)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Payment */}
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="p-6 flex-1 flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Payment</h2>
            
            {/* Customer */}
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mb-4"
              placeholder="Walk-in customer"
            />
            
            {/* Payment Method */}
            <Select
              label="Payment Method"
              selectedKeys={new Set([paymentMethod])}
              onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
              className="mb-4"
            >
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method.key}>{method.label}</SelectItem>
              ))}
            </Select>
            
            {/* Discount */}
            <Input
              type="number"
              label="Discount (₱)"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="mb-4"
              min={0}
              max={subtotal}
            />
            
            <Divider className="my-4" />
            
            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-danger">
                  <span>Discount</span>
                  <span>-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Amount Paid (for cash) */}
            {paymentMethod === 'CASH' && (
              <>
                <Input
                  type="number"
                  label="Amount Paid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="mb-2"
                  size="lg"
                  startContent={<span className="text-gray-400">₱</span>}
                />
                {amountPaid && (
                  <div className={`flex justify-between text-lg font-semibold mb-4 ${change >= 0 ? 'text-success' : 'text-danger'}`}>
                    <span>Change</span>
                    <span>₱{change.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="mt-auto">
              <Button
                color="primary"
                size="lg"
                className="w-full text-lg font-semibold h-14"
                onPress={handleSubmitSale}
                isLoading={isSubmitting}
                isDisabled={cart.length === 0 || (paymentMethod === 'CASH' && change < 0)}
              >
                Complete Sale - ₱{total.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal isOpen={isSuccessOpen} onClose={onSuccessClose}>
        <ModalContent>
          <ModalHeader className="text-center">
            <span className="text-4xl">✓</span>
          </ModalHeader>
          <ModalBody className="text-center py-8">
            <h2 className="text-2xl font-bold text-success mb-2">Sale Complete!</h2>
            <p className="text-gray-600">Receipt: {lastSale?.sale_number}</p>
            <p className="text-3xl font-bold mt-4">₱{lastSale?.total}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              size="lg"
              className="w-full"
              onPress={() => {
                onSuccessClose();
                searchInputRef.current?.focus();
              }}
            >
              New Transaction
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

export default function POSPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'STORE_ADMIN', 'CASHIER']}>
      <POSContent />
    </ProtectedRoute>
  );
}
