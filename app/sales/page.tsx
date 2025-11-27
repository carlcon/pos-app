'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Select,
  SelectItem,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import type { Product } from '@/types';

interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

function POSContent() {
  const { lookupBarcode } = useProducts();
  const { createSale, loading: saleLoading } = useSales();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER'>('CASH');
  const [searching, setSearching] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [lastSaleNumber, setLastSaleNumber] = useState('');

  // Auto-focus barcode input
  useEffect(() => {
    barcodeRef.current?.focus();
  }, [cart]);

  const handleBarcodeSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      setSearching(true);
      try {
        const product = await lookupBarcode(barcodeInput.trim());
        if (product) {
          addToCart(product);
          setBarcodeInput('');
        } else {
          alert('Product not found');
        }
      } catch {
        alert('Error looking up product');
      } finally {
        setSearching(false);
      }
    }
  };

  const addToCart = (product: Product, qty: number = 1) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + qty,
                subtotal: (item.quantity + qty) * parseFloat(product.selling_price),
              }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product,
          quantity: qty,
          subtotal: qty * parseFloat(product.selling_price),
        },
      ]);
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * parseFloat(item.product.selling_price),
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return;
    }

    const saleData = {
      customer_name: customerName || undefined,
      payment_method: paymentMethod,
      items: cart.map((item) => ({
        product: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
      })),
    };

    try {
      const sale = await createSale(saleData);
      if (sale) {
        setLastSaleNumber(sale.sale_number);
        onOpen();
        // Clear cart and reset
        setCart([]);
        setCustomerName('');
        setPaymentMethod('CASH');
      }
    } catch {
      alert('Error processing sale');
    }
  };

  const handleNewSale = () => {
    onClose();
    barcodeRef.current?.focus();
  };

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 xl:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground">Point of Sale</h1>
            <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">Scan products or search to add to cart</p>
          </div>
          <Chip color="success" variant="flat" size="lg" className="w-fit">
            Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </Chip>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
          {/* Left: Barcode Scanner & Products */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardBody className="p-4">
                <Input
                  ref={barcodeRef}
                  label="Scan Barcode or SKU"
                  placeholder="Position cursor here and scan..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeSearch}
                  size="lg"
                  autoFocus
                  endContent={
                    searching ? <Spinner size="sm" /> : <span className="text-default-400">🔍</span>
                  }
                />
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <h3 className="text-lg font-semibold mb-4">Cart Items</h3>
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-default-400">
                    <p className="text-xl">Cart is empty</p>
                    <p className="text-sm mt-2">Scan a barcode to add products</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 p-3 bg-default-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-default-500">
                            {item.product.sku} • ${parseFloat(item.product.selling_price).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center font-semibold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="flat"
                            onPress={() => updateQuantity(item.product.id, item.quantity + 1)}
                            isDisabled={item.quantity >= item.product.current_stock}
                          >
                            +
                          </Button>
                        </div>
                        <div className="w-24 text-right font-semibold">
                          ${item.subtotal.toFixed(2)}
                        </div>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          onPress={() => removeFromCart(item.product.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Right: Checkout Panel */}
          <div className="space-y-4">
            <Card className="border-2 border-primary">
              <CardBody className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Checkout</h3>
                  <Input
                    label="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                <Select
                  label="Payment Method"
                  selectedKeys={[paymentMethod]}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER')}
                  isRequired
                >
                  <SelectItem key="CASH">Cash</SelectItem>
                  <SelectItem key="CARD">Card</SelectItem>
                  <SelectItem key="BANK_TRANSFER">Bank Transfer</SelectItem>
                </Select>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    color="primary"
                    size="lg"
                    className="w-full"
                    onPress={handleCheckout}
                    isDisabled={cart.length === 0 || saleLoading}
                    isLoading={saleLoading}
                  >
                    Complete Sale
                  </Button>
                  <Button
                    variant="flat"
                    size="lg"
                    className="w-full"
                    onPress={() => setCart([])}
                    isDisabled={cart.length === 0}
                  >
                    Clear Cart
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="p-4">
                <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                <div className="text-sm text-default-600 space-y-1">
                  <p>• Scan: Focus input and scan barcode</p>
                  <p>• Enter: Add product to cart</p>
                  <p>• F9: Complete Sale</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Success Modal */}
        <Modal isOpen={isOpen} onClose={handleNewSale} size="md">
          <ModalContent>
            <ModalHeader className="text-success">Sale Completed!</ModalHeader>
            <ModalBody className="text-center py-8">
              <div className="text-6xl mb-4">✓</div>
              <h3 className="text-2xl font-bold mb-2">Transaction Successful</h3>
              <p className="text-default-500">Sale Number: {lastSaleNumber}</p>
              <p className="text-3xl font-bold text-primary mt-4">${total.toFixed(2)}</p>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={handleNewSale} className="w-full">
                New Sale
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default function POSPage() {
  return (
    <ProtectedRoute>
      <POSContent />
    </ProtectedRoute>
  );
}
