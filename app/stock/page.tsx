'use client';

import { useState, useMemo } from 'react';
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
  Textarea,
  addToast,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';

type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';
type ReasonType = 'PURCHASE' | 'SALE' | 'DAMAGED' | 'LOST' | 'RECONCILIATION' | 'RETURN' | 'MANUAL';

function StockContent() {
  const { transactions, loading, error, createAdjustment } = useStock();
  const { products } = useProducts();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    product: '',
    transaction_type: 'IN' as TransactionType,
    reason: 'MANUAL' as ReasonType,
    quantity: '',
    reference_number: '',
    notes: '',
  });

  // Get reasons based on transaction type
  const reasonOptions = useMemo(() => {
    switch (formData.transaction_type) {
      case 'IN':
        return [
          { key: 'PURCHASE', label: 'Purchase Order Receipt' },
          { key: 'RETURN', label: 'Customer Return' },
          { key: 'MANUAL', label: 'Manual Adjustment' },
        ];
      case 'OUT':
        return [
          { key: 'SALE', label: 'Sale' },
          { key: 'DAMAGED', label: 'Damaged' },
          { key: 'LOST', label: 'Lost' },
          { key: 'RETURN', label: 'Return to Supplier' },
          { key: 'MANUAL', label: 'Manual Adjustment' },
        ];
      case 'ADJUSTMENT':
        return [
          { key: 'RECONCILIATION', label: 'Stock Reconciliation' },
          { key: 'MANUAL', label: 'Manual Adjustment' },
        ];
      default:
        return [{ key: 'MANUAL', label: 'Manual Adjustment' }];
    }
  }, [formData.transaction_type]);

  // Reset reason when transaction type changes
  const handleTransactionTypeChange = (type: TransactionType) => {
    const defaultReason = type === 'IN' ? 'PURCHASE' : type === 'OUT' ? 'SALE' : 'RECONCILIATION';
    setFormData({
      ...formData,
      transaction_type: type,
      reason: defaultReason as ReasonType,
    });
  };

  // Get selected product name for display
  const selectedProduct = useMemo(() => {
    if (!formData.product || !products) return null;
    return products.find(p => p.id.toString() === formData.product);
  }, [formData.product, products]);

  const handleSubmit = async () => {
    if (!formData.product || !formData.quantity) {
      addToast({
        title: 'Validation Error',
        description: 'Please select a product and enter quantity',
        color: 'warning',
      });
      return;
    }
    
    const data = {
      product_id: parseInt(formData.product),
      adjustment_type: formData.transaction_type,
      reason: formData.reason,
      quantity: parseInt(formData.quantity),
      reference_number: formData.reference_number || undefined,
      notes: formData.notes || undefined,
    };

    try {
      await createAdjustment(data);
      addToast({
        title: 'Transaction Created',
        description: 'Stock adjustment has been recorded successfully',
        color: 'success',
      });
      setFormData({
        product: '',
        transaction_type: 'IN',
        reason: 'MANUAL',
        quantity: '',
        reference_number: '',
        notes: '',
      });
      onClose();
    } catch (err) {
      console.error('Stock adjustment error:', err);
      const error = err as { response?: { data?: { error?: string; message?: string; detail?: string } } };
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message || 
                          error.response?.data?.detail ||
                          'Failed to create stock transaction';
      addToast({
        title: 'Transaction Failed',
        description: errorMessage,
        color: 'danger',
      });
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'success';
      case 'OUT':
        return 'warning';
      case 'ADJUSTMENT':
        return 'primary';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Spinner size="lg" color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6 xl:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground">Stock Management</h1>
            <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">Track inventory movements and adjustments</p>
          </div>
          <Button color="primary" onPress={onOpen} className="w-full sm:w-auto">
            + New Transaction
          </Button>
        </div>

        {error && (
          <div className="bg-danger-50 text-danger p-4 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 xl:gap-6">
          <Card className="border-l-4 border-success">
            <CardBody className="p-6">
              <p className="text-sm text-default-500 mb-1">Stock In</p>
              <h3 className="text-3xl font-bold text-foreground">
                {transactions?.filter(t => t.transaction_type === 'IN').length || 0}
              </h3>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-warning">
            <CardBody className="p-6">
              <p className="text-sm text-default-500 mb-1">Stock Out</p>
              <h3 className="text-3xl font-bold text-foreground">
                {transactions?.filter(t => t.transaction_type === 'OUT').length || 0}
              </h3>
            </CardBody>
          </Card>
          <Card className="border-l-4 border-primary">
            <CardBody className="p-6">
              <p className="text-sm text-default-500 mb-1">Adjustments</p>
              <h3 className="text-3xl font-bold text-foreground">
                {transactions?.filter(t => t.transaction_type === 'ADJUSTMENT').length || 0}
              </h3>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardBody className="p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {transactions && transactions.length === 0 ? (
                <p className="text-center py-8 text-default-400">No transactions yet</p>
              ) : (
                transactions?.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-default-50 rounded-lg hover:bg-default-100 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Chip
                        color={getTransactionColor(transaction.transaction_type)}
                        variant="flat"
                        size="sm"
                      >
                        {transaction.transaction_type}
                      </Chip>
                      <div>
                        <p className="font-medium">{transaction.product_name}</p>
                        <p className="text-xs text-default-500">
                          {transaction.performed_by_username} • {formatDate(transaction.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {transaction.transaction_type === 'OUT' ? '-' : '+'}
                        {transaction.quantity}
                      </p>
                      {transaction.reference_number && (
                        <p className="text-xs text-default-500">Ref: {transaction.reference_number}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>

        <Modal isOpen={isOpen} onClose={onClose} size="lg">
          <ModalContent>
            <ModalHeader>New Stock Transaction</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Select
                  label="Product"
                  placeholder="Select a product"
                  selectedKeys={formData.product ? [formData.product] : []}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  isRequired
                  renderValue={() => {
                    if (selectedProduct) {
                      return `${selectedProduct.name} (${selectedProduct.sku})`;
                    }
                    return null;
                  }}
                >
                  {products?.map((product) => (
                    <SelectItem key={product.id.toString()} textValue={`${product.name} (${product.sku})`}>
                      <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-default-500">{product.sku} • Stock: {product.current_stock}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Transaction Type"
                  selectedKeys={[formData.transaction_type]}
                  onChange={(e) => handleTransactionTypeChange(e.target.value as TransactionType)}
                  isRequired
                >
                  <SelectItem key="IN">Stock In</SelectItem>
                  <SelectItem key="OUT">Stock Out</SelectItem>
                  <SelectItem key="ADJUSTMENT">Adjustment (Set Exact Quantity)</SelectItem>
                </Select>

                <Select
                  label="Reason"
                  selectedKeys={[formData.reason]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value as ReasonType,
                    })
                  }
                  isRequired
                >
                  {reasonOptions.map((option) => (
                    <SelectItem key={option.key}>{option.label}</SelectItem>
                  ))}
                </Select>

                <Input
                  label={formData.transaction_type === 'ADJUSTMENT' ? 'New Stock Quantity' : 'Quantity'}
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  isRequired
                  description={formData.transaction_type === 'ADJUSTMENT' ? 'This will set the stock to this exact amount' : undefined}
                />

                <Input
                  label="Reference Number"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="PO#, Invoice#, etc."
                />

                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder="Additional information..."
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                Create Transaction
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <ProtectedRoute>
      <StockContent />
    </ProtectedRoute>
  );
}
