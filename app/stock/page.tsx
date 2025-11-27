'use client';

import { useState } from 'react';
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
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useStock } from '@/hooks/useStock';
import { useProducts } from '@/hooks/useProducts';

function StockContent() {
  const { transactions, loading, error, createAdjustment } = useStock();
  const { products } = useProducts();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [formData, setFormData] = useState({
    product: '',
    transaction_type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    reason: 'MANUAL' as 'PURCHASE' | 'SALE' | 'DAMAGED' | 'LOST' | 'RECONCILIATION' | 'RETURN' | 'MANUAL',
    quantity: '',
    reference_number: '',
    notes: '',
  });

  const handleSubmit = async () => {
    const data = {
      product: parseInt(formData.product),
      transaction_type: formData.transaction_type,
      reason: formData.reason,
      quantity: parseInt(formData.quantity),
      reference_number: formData.reference_number || undefined,
      notes: formData.notes || undefined,
    };

    await createAdjustment(data);
    setFormData({
      product: '',
      transaction_type: 'IN',
      reason: 'MANUAL',
      quantity: '',
      reference_number: '',
      notes: '',
    });
    onClose();
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
                  selectedKeys={formData.product ? [formData.product] : []}
                  onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                  isRequired
                >
                  {products?.map((product) => (
                    <SelectItem key={product.id.toString()}>
                      {product.name} ({product.sku})
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Transaction Type"
                  selectedKeys={[formData.transaction_type]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transaction_type: e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT',
                    })
                  }
                  isRequired
                >
                  <SelectItem key="IN">Stock In</SelectItem>
                  <SelectItem key="OUT">Stock Out</SelectItem>
                  <SelectItem key="ADJUSTMENT">Adjustment</SelectItem>
                </Select>

                <Select
                  label="Reason"
                  selectedKeys={[formData.reason]}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reason: e.target.value as typeof formData.reason,
                    })
                  }
                  isRequired
                >
                  <SelectItem key="PURCHASE">Purchase</SelectItem>
                  <SelectItem key="SALE">Sale</SelectItem>
                  <SelectItem key="DAMAGED">Damaged</SelectItem>
                  <SelectItem key="LOST">Lost</SelectItem>
                  <SelectItem key="RECONCILIATION">Reconciliation</SelectItem>
                  <SelectItem key="RETURN">Return</SelectItem>
                  <SelectItem key="MANUAL">Manual Adjustment</SelectItem>
                </Select>

                <Input
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  isRequired
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
