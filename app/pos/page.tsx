'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Button,
  Input,
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
  Autocomplete,
  AutocompleteItem,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
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
  const { isOpen: isOutOfStockOpen, onOpen: onOutOfStockOpen, onClose: onOutOfStockClose } = useDisclosure();
  const [outOfStockProduct, setOutOfStockProduct] = useState<string>('');
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

  // Add product to cart - returns true if added, false if out of stock
  const addToCart = useCallback((product: Product): boolean => {
    // Check if product has no stock
    if (product.current_stock <= 0) {
      setOutOfStockProduct(product.name);
      onOutOfStockOpen();
      return false;
    }
    
    // Check if already in cart and at max quantity
    const existingItem = cart.find(item => item.product === product.id);
    if (existingItem && existingItem.quantity >= product.current_stock) {
      setOutOfStockProduct(product.name);
      onOutOfStockOpen();
      return false;
    }
    
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
    return true;
  }, [cart, onOutOfStockOpen]);

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
      
      const response = await api.get<{ results: Product[] }>('/inventory/products/', { params });
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

  // Handle Enter key for barcode scanner
  const handleBarcodeEnter = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      
      // Immediately search for exact barcode match
      try {
        const params: Record<string, string> = { search: searchQuery };
        if (effectiveStoreId) {
          params.store_id = effectiveStoreId.toString();
        }
        
        const response = await api.get<{ results: Product[] }>('/inventory/products/', { params });
        const products = response.data.results;
        
        // Check for exact barcode match
        const exactMatch = products.find(p => p.barcode === searchQuery);
        if (exactMatch) {
          addToCart(exactMatch);
        } else if (products.length === 1) {
          // If only one result, add it
          addToCart(products[0]);
        }
      } catch (error) {
        console.error('Barcode search failed:', error);
      }
    }
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
  const handleSubmitSale = useCallback(async () => {
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
      
      // Store total before clearing cart
      const saleTotal = response.data.total_amount || total.toFixed(2);
      
      setLastSale({
        sale_number: response.data.sale_number,
        total: saleTotal,
      });
      
      // Clear cart after setting last sale
      setCart([]);
      setDiscount('0');
      setCustomerName('');
      setAmountPaid('');
      
      onSuccessOpen();
    } catch (error) {
      console.error('Sale failed:', error);
      alert('Failed to process sale. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, paymentMethod, change, customerName, discountAmount, effectiveStoreId, total, onSuccessOpen]);

  // F9 keyboard shortcut for completing sale
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0 && !(paymentMethod === 'CASH' && change < 0)) {
          handleSubmitSale();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmitSale, cart.length, paymentMethod, change]);

  // Check if POS is accessible - store admins have effectiveStoreId from assigned_store
  const canUsePOS = !!effectiveStoreId;

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
    <div className="min-h-screen bg-gray-50">
      {/* Custom Header for Cashiers */}
      {isCashier ? (
        <div className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">POS System</h1>
            <Chip color="primary" variant="flat">
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
            <Autocomplete
              ref={searchInputRef}
              placeholder="Search products or scan barcode..."
              inputValue={searchQuery}
              onInputChange={setSearchQuery}
              onKeyDown={handleBarcodeEnter}
              onSelectionChange={(key) => {
                if (key) {
                  const product = searchResults.find(p => p.id.toString() === key);
                  if (product) addToCart(product);
                }
              }}
              items={searchResults}
              isLoading={searching}
              size="lg"
              startContent={<span>🔍</span>}
              className="text-lg"
              listboxProps={{
                emptyContent: searching ? "Searching..." : "No products found"
              }}
            >
              {(product) => {
                const cartItem = cart.find(item => item.product === product.id);
                const availableStock = product.current_stock - (cartItem?.quantity || 0);
                const isOutOfStock = product.current_stock <= 0;
                const isMaxedOut = cartItem && cartItem.quantity >= product.current_stock;
                
                return (
                  <AutocompleteItem 
                    key={product.id.toString()} 
                    textValue={product.name}
                    className={isOutOfStock || isMaxedOut ? 'opacity-50' : ''}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                          {product.name}
                          {isOutOfStock && (
                            <Chip size="sm" color="danger" variant="flat">Out of Stock</Chip>
                          )}
                          {isMaxedOut && !isOutOfStock && (
                            <Chip size="sm" color="warning" variant="flat">Max in Cart</Chip>
                          )}
                        </div>
                        <div className="text-sm text-default-500">
                          SKU: {product.sku} | Stock: {product.current_stock}
                          {cartItem && ` | In Cart: ${cartItem.quantity}`}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-primary ml-4">
                        ₱{parseFloat(product.display_price).toFixed(2)}
                      </div>
                    </div>
                  </AutocompleteItem>
                );
              }}
            </Autocomplete>
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
                    <div key={item.product} className="p-4 flex  items-center gap-4">
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
        <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col">
          <div className="p-5 flex-1 flex flex-col overflow-y-auto">
            <h2 className="text-xl font-semibold mb-3 pb-2 border-b border-gray-200">Payment</h2>
            
            {/* Customer */}
            <Input
              label="Customer Name (Optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mb-3"
              placeholder="Walk-in customer"
              size="sm"
            />
            
            {/* Payment Method */}
            <Select
              label="Payment Method"
              selectedKeys={new Set([paymentMethod])}
              onSelectionChange={(keys) => setPaymentMethod(Array.from(keys)[0] as string)}
              className="mb-3"
              size="sm"
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
              className="mb-3"
              min={0}
              max={subtotal}
              size="sm"
            />
            
            <Divider className="my-3" />
            
            {/* Totals */}
            <div className="space-y-2 mb-3">
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
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Amount Received</label>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => setAmountPaid('')}
                      className="h-6 min-w-12"
                    >
                      Clear
                    </Button>
                  </div>
                  
                  <Input
                    type="text"
                    placeholder="Enter amount"
                    value={amountPaid}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow non-negative numbers
                      if (value === '' || parseFloat(value) >= 0) {
                        setAmountPaid(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent minus sign
                      if (e.key === '-' || e.key === 'e') {
                        e.preventDefault();
                      }
                    }}
                    min={0}
                    size="lg"
                    startContent={<span className="text-gray-400">₱</span>}
                    className="mb-2"
                    classNames={{
                      input: "text-2xl font-bold",
                      inputWrapper: "border border-gray-300"
                    }}
                  />
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 uppercase font-medium mb-1">Quick Add</div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[20, 50, 100, 200, 500, 1000].map(amount => (
                        <Button
                          key={amount}
                          size="sm"
                          variant="bordered"
                          color="primary"
                          onPress={() => {
                            const current = parseFloat(amountPaid) || 0;
                            setAmountPaid((current + amount).toString());
                          }}
                          className="font-semibold h-10"
                        >
                          +₱{amount}
                        </Button>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="flat"
                      color="success"
                      onPress={() => setAmountPaid(total.toFixed(2))}
                      className="w-full font-semibold h-10"
                    >
                      Exact (₱{total.toFixed(2)})
                    </Button>
                  </div>
                </div>
                {amountPaid && (
                  <div className={`flex justify-between items-center text-lg font-semibold mb-3 p-3 rounded-lg border ${change >= 0 ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
                    <span className={change >= 0 ? 'text-success-700' : 'text-danger-700'}>Change</span>
                    <span className={`text-2xl font-bold ${change >= 0 ? 'text-success-700' : 'text-danger-700'}`}>₱{Math.abs(change).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="mt-auto pt-2">
              <Button
                color="primary"
                size="lg"
                className="w-full text-lg font-semibold h-14"
                onPress={handleSubmitSale}
                isLoading={isSubmitting}
                isDisabled={cart.length === 0 || (paymentMethod === 'CASH' && change < 0)}
              >
                <div className="flex flex-col items-center">
                  <span>Complete Sale - ₱{total.toFixed(2)}</span>
                  <span className="text-xs opacity-80">Press F9</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Modal 
        isOpen={isSuccessOpen} 
        onClose={onSuccessClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSuccessClose();
            searchInputRef.current?.focus();
          }
        }}
      >
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

      {/* Out of Stock Modal */}
      <Modal isOpen={isOutOfStockOpen} onClose={onOutOfStockClose} size="sm">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <span>Insufficient Stock</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-600">
              <span className="font-semibold">{outOfStockProduct}</span> cannot be added to cart.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Please add stock to this item first before selling.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="primary"
              variant="flat"
              onPress={() => {
                onOutOfStockClose();
                searchInputRef.current?.focus();
              }}
            >
              OK
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
