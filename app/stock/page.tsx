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
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';

type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT';
type ReasonType = 'PURCHASE' | 'SALE' | 'DAMAGED' | 'LOST' | 'RECONCILIATION' | 'RETURN' | 'MANUAL';

function StockContent() {
  const { transactions, loading, error, createAdjustment } = useStock();
  const { products } = useProducts();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isBarcodeOpen, onOpen: onBarcodeOpen, onClose: onBarcodeClose } = useDisclosure();
  const [formData, setFormData] = useState({
    product: '',
    transaction_type: 'IN' as TransactionType,
    reason: 'MANUAL' as ReasonType,
    quantity: '',
    unit_cost: '',
    reference_number: '',
    notes: '',
  });
  const [barcodeFormData, setBarcodeFormData] = useState<{
    products: { productId: string; quantity: string }[];
  }>({
    products: [{ productId: '', quantity: '1' }],
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Get selected products for barcode printing
  const getProductById = (productId: string) => {
    if (!productId || !products) return null;
    return products.find(p => p.id.toString() === productId);
  };

  // Add product to barcode list
  const addBarcodeProduct = () => {
    setBarcodeFormData({
      products: [...barcodeFormData.products, { productId: '', quantity: '1' }],
    });
  };

  // Remove product from barcode list
  const removeBarcodeProduct = (index: number) => {
    if (barcodeFormData.products.length > 1) {
      setBarcodeFormData({
        products: barcodeFormData.products.filter((_, i) => i !== index),
      });
    }
  };

  // Update product in barcode list
  const updateBarcodeProduct = (index: number, field: 'productId' | 'quantity', value: string) => {
    const updated = [...barcodeFormData.products];
    updated[index] = { ...updated[index], [field]: value };
    setBarcodeFormData({ products: updated });
  };

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

  // Generate barcode PDF for multiple products
  const generateBarcodePDF = async () => {
    // Validate products
    const validProducts = barcodeFormData.products.filter(p => {
      const product = getProductById(p.productId);
      return product && product.barcode && parseInt(p.quantity) > 0;
    });

    if (validProducts.length === 0) {
      addToast({
        title: 'Error',
        description: 'Please select at least one product with a barcode',
        color: 'danger',
      });
      return;
    }

    // Calculate total labels
    const totalLabels = validProducts.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);
    if (totalLabels > 500) {
      addToast({
        title: 'Error',
        description: 'Maximum 500 labels per PDF',
        color: 'danger',
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create PDF - A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Label dimensions (50mm x 30mm for better layout)
      const labelWidth = 60;
      const labelHeight = 30;
      const marginX = 10;
      const marginY = 10;
      const gapX = 5;
      const gapY = 5;
      const labelsPerRow = 3;
      const labelsPerCol = 8;
      const labelsPerPage = labelsPerRow * labelsPerCol;

      let labelIndex = 0;

      // Loop through each product and its quantity
      for (const item of validProducts) {
        const product = getProductById(item.productId);
        if (!product || !product.barcode) continue;

        const quantity = parseInt(item.quantity) || 1;

        for (let i = 0; i < quantity; i++) {
          // Calculate position
          const positionOnPage = labelIndex % labelsPerPage;
          const col = positionOnPage % labelsPerRow;
          const row = Math.floor(positionOnPage / labelsPerRow);

          // Add new page if needed
          if (labelIndex > 0 && positionOnPage === 0) {
            pdf.addPage();
          }

          const x = marginX + col * (labelWidth + gapX);
          const y = marginY + row * (labelHeight + gapY);

          // Create a canvas for barcode
          const canvas = document.createElement('canvas');
          JsBarcode(canvas, product.barcode, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
            fontSize: 14,
            margin: 2,
            textMargin: 2,
          });

          // Add barcode image to PDF
          const barcodeImage = canvas.toDataURL('image/png');
          pdf.addImage(barcodeImage, 'PNG', x + 2, y + 1, labelWidth - 4, 18);

          // Add product name (truncated if too long)
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          const productName = product.name.length > 30 
            ? product.name.substring(0, 30) + '...' 
            : product.name;
          pdf.text(productName, x + labelWidth / 2, y + 22, { align: 'center' });

          // Add SKU
          pdf.setFontSize(6);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`SKU: ${product.sku}`, x + labelWidth / 2, y + 25, { align: 'center' });

          // Add price with PHP symbol
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          const price = parseFloat(product.selling_price).toFixed(2);
          pdf.text(`PHP ${price}`, x + labelWidth / 2, y + 29, { align: 'center' });
          pdf.setFont('helvetica', 'normal');

          labelIndex++;
        }
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10);
      const productCount = validProducts.length;
      pdf.save(`barcodes-${productCount}products-${totalLabels}labels-${timestamp}.pdf`);

      addToast({
        title: 'Success',
        description: `Generated ${totalLabels} barcode label(s) for ${productCount} product(s)`,
        color: 'success',
      });

      // Reset form and close modal
      setBarcodeFormData({ products: [{ productId: '', quantity: '1' }] });
      onBarcodeClose();
    } catch (err) {
      console.error('Barcode generation error:', err);
      addToast({
        title: 'Error',
        description: 'Failed to generate barcode PDF',
        color: 'danger',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.product || !formData.quantity) {
      addToast({
        title: 'Validation Error',
        description: 'Please select a product and enter quantity',
        color: 'warning',
      });
      return;
    }
    
    const data: {
      product_id: number;
      adjustment_type: TransactionType;
      reason: ReasonType;
      quantity: number;
      unit_cost?: number;
      reference_number?: string;
      notes?: string;
    } = {
      product_id: parseInt(formData.product),
      adjustment_type: formData.transaction_type,
      reason: formData.reason,
      quantity: parseInt(formData.quantity),
      reference_number: formData.reference_number || undefined,
      notes: formData.notes || undefined,
    };

    // Only include unit_cost for IN transactions
    if (formData.transaction_type === 'IN' && formData.unit_cost) {
      data.unit_cost = parseFloat(formData.unit_cost);
    }

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
        unit_cost: '',
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
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="bordered" 
              onPress={onBarcodeOpen} 
              className="flex-1 sm:flex-none border-primary text-primary"
            >
              🏷️ Print Barcodes
            </Button>
            <Button color="primary" onPress={onOpen} className="flex-1 sm:flex-none">
              + New Transaction
            </Button>
          </div>
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
                      {transaction.transaction_type === 'IN' && transaction.unit_cost && (
                        <p className="text-xs text-default-500">
                          ₱{transaction.unit_cost}/unit • Total: ₱{transaction.total_cost}
                        </p>
                      )}
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
                  onChange={(e) => {
                    const productId = e.target.value;
                    const product = products?.find(p => p.id.toString() === productId);
                    setFormData({ 
                      ...formData, 
                      product: productId,
                      unit_cost: product?.cost_price || ''
                    });
                  }}
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

                {formData.transaction_type === 'IN' && (
                  <Input
                    label="Unit Cost"
                    type="number"
                    value={formData.unit_cost}
                    onChange={(e) => setFormData({ ...formData, unit_cost: e.target.value })}
                    placeholder={selectedProduct?.cost_price ? `Current: ₱${selectedProduct.cost_price}` : 'Enter cost per unit'}
                    startContent={<span className="text-default-400">₱</span>}
                    description={
                      formData.unit_cost && formData.quantity
                        ? `Total cost: ₱${(parseFloat(formData.unit_cost) * parseInt(formData.quantity || '0')).toFixed(2)}`
                        : 'Cost will update product\'s cost price if different'
                    }
                  />
                )}

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

        {/* Barcode Print Modal */}
        <Modal isOpen={isBarcodeOpen} onClose={onBarcodeClose} size="2xl" scrollBehavior="inside">
          <ModalContent>
            <ModalHeader>Print Barcode Labels</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-default-700">Select Products</p>
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={addBarcodeProduct}
                  >
                    + Add Product
                  </Button>
                </div>

                <div className="space-y-3">
                  {barcodeFormData.products.map((item, index) => {
                    const product = getProductById(item.productId);
                    return (
                      <Card key={index} className="bg-default-50">
                        <CardBody className="p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-3 items-start">
                              <div className="flex-1">
                                <Select
                                  label="Product"
                                  placeholder="Select a product"
                                  size="sm"
                                  selectedKeys={item.productId ? [item.productId] : []}
                                  onChange={(e) => updateBarcodeProduct(index, 'productId', e.target.value)}
                                  renderValue={() => {
                                    if (product) {
                                      return `${product.name}`;
                                    }
                                    return null;
                                  }}
                                >
                                  {products?.filter(p => p.barcode).map((p) => (
                                    <SelectItem key={p.id.toString()} textValue={`${p.name} (${p.sku})`}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{p.name}</span>
                                        <span className="text-xs text-default-500">
                                          {p.sku} • {p.barcode}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </Select>
                              </div>
                              <div className="w-24">
                                <Input
                                  label="Qty"
                                  type="number"
                                  size="sm"
                                  value={item.quantity}
                                  onChange={(e) => updateBarcodeProduct(index, 'quantity', e.target.value)}
                                  min={1}
                                  max={100}
                                />
                              </div>
                              {barcodeFormData.products.length > 1 && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="flat"
                                  color="danger"
                                  onPress={() => removeBarcodeProduct(index)}
                                  className="mt-6"
                                >
                                  ✕
                                </Button>
                              )}
                            </div>
                            {product && (
                              <div className="flex justify-between items-center text-sm bg-white p-2 rounded-lg">
                                <div className="flex gap-4">
                                  <span className="text-default-500">SKU: <span className="text-default-700">{product.sku}</span></span>
                                  <span className="text-default-500">Barcode: <span className="font-mono text-default-700">{product.barcode}</span></span>
                                </div>
                                <span className="font-semibold text-primary">PHP {parseFloat(product.selling_price).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    );
                  })}
                </div>

                {/* Summary */}
                {barcodeFormData.products.some(p => p.productId) && (
                  <Card className="bg-primary-50">
                    <CardBody className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-primary">Total Labels</p>
                          <p className="text-sm text-default-600">
                            {barcodeFormData.products.filter(p => getProductById(p.productId)?.barcode).length} product(s)
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {barcodeFormData.products.reduce((sum, p) => {
                            const product = getProductById(p.productId);
                            if (product?.barcode) {
                              return sum + (parseInt(p.quantity) || 0);
                            }
                            return sum;
                          }, 0)}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                )}

                <div className="bg-default-100 p-3 rounded-lg">
                  <p className="text-sm text-default-600">
                    <strong>Label Size:</strong> 60mm x 30mm (standard barcode label)
                  </p>
                  <p className="text-sm text-default-600">
                    <strong>Layout:</strong> 3 labels per row, 8 rows per page (A4)
                  </p>
                  <p className="text-sm text-default-600">
                    <strong>Includes:</strong> Barcode, product name, SKU, and price (PHP)
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onBarcodeClose}>
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={generateBarcodePDF}
                isLoading={isGenerating}
                isDisabled={!barcodeFormData.products.some(p => getProductById(p.productId)?.barcode && parseInt(p.quantity) > 0)}
              >
                Generate PDF
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
