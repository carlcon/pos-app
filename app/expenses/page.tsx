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
  addToast,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
} from '@heroui/react';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useExpenses, useExpenseCategories, useExpenseStats, Expense } from '@/hooks/useExpenses';
import { useStore } from '@/context/StoreContext';

const PAYMENT_METHODS = [
  { key: 'CASH', label: 'Cash' },
  { key: 'GCASH', label: 'GCash' },
  { key: 'MAYA', label: 'Maya' },
  { key: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { key: 'CREDIT_CARD', label: 'Credit Card' },
  { key: 'CHECK', label: 'Check' },
  { key: 'OTHER', label: 'Other' },
];

function ExpensesContent() {
  const { selectedStoreId } = useStore();
  const { stats, loading: statsLoading } = useExpenseStats(true, selectedStoreId);
  const { 
    expenses, 
    loading, 
    error, 
    page, 
    setPage, 
    totalCount, 
    filters,
    setFilters,
    createExpense, 
    updateExpense,
    deleteExpense,
  } = useExpenses(selectedStoreId);
  const { categories } = useExpenseCategories(selectedStoreId);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: '',
    payment_method: 'CASH',
    expense_date: today(getLocalTimeZone()) as any,
    receipt_number: '',
    vendor: '',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: '',
      payment_method: 'CASH',
      expense_date: today(getLocalTimeZone()) as any,
      receipt_number: '',
      vendor: '',
      notes: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.amount || !formData.expense_date) {
      addToast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        color: 'warning',
      });
      return;
    }

    try {
      await createExpense({
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        category: formData.category ? parseInt(formData.category) : undefined,
        payment_method: formData.payment_method,
        expense_date: formData.expense_date.toString(),
        receipt_number: formData.receipt_number || undefined,
        vendor: formData.vendor || undefined,
        notes: formData.notes || undefined,
      });
      addToast({
        title: 'Success',
        description: 'Expense created successfully',
        color: 'success',
      });
      resetForm();
      onClose();
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Failed to create expense',
        color: 'danger',
      });
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      category: expense.category?.toString() || '',
      payment_method: expense.payment_method,
      expense_date: parseDate(expense.expense_date) as any,
      receipt_number: expense.receipt_number,
      vendor: expense.vendor,
      notes: expense.notes,
    });
    onEditOpen();
  };

  const handleUpdate = async () => {
    if (!editingExpense) return;

    try {
      await updateExpense(editingExpense.id, {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        category: formData.category ? parseInt(formData.category) : undefined,
        payment_method: formData.payment_method,
        expense_date: formData.expense_date.toString(),
        receipt_number: formData.receipt_number || undefined,
        vendor: formData.vendor || undefined,
        notes: formData.notes || undefined,
      });
      addToast({
        title: 'Success',
        description: 'Expense updated successfully',
        color: 'success',
      });
      resetForm();
      setEditingExpense(null);
      onEditClose();
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Failed to update expense',
        color: 'danger',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await deleteExpense(id);
      addToast({
        title: 'Success',
        description: 'Expense deleted successfully',
        color: 'success',
      });
    } catch (err) {
      console.error(err);
      addToast({
        title: 'Error',
        description: 'Failed to delete expense',
        color: 'danger',
      });
    }
  };

  const totalPages = Math.ceil(totalCount / 10);

  const monthChange = stats?.last_month_total 
    ? ((stats.this_month_total - stats.last_month_total) / stats.last_month_total * 100).toFixed(1)
    : '0';

  const ExpenseForm = (
    <div className="space-y-4">
      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        isRequired
        placeholder="e.g., Office Supplies"
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          isRequired
          startContent={<span className="text-default-400">₱</span>}
        />
        <DatePicker
          label="Date"
          value={formData.expense_date}
          onChange={(date) => setFormData({ ...formData, expense_date: date as any })}
          isRequired
          classNames={{
            base: "w-full",
            inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          selectedKeys={formData.category ? [formData.category] : []}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        >
          {categories.map((cat) => (
            <SelectItem key={cat.id.toString()}>{cat.name}</SelectItem>
          ))}
        </Select>
        <Select
          label="Payment Method"
          selectedKeys={[formData.payment_method]}
          onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
          isRequired
        >
          {PAYMENT_METHODS.map((pm) => (
            <SelectItem key={pm.key}>{pm.label}</SelectItem>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Vendor"
          value={formData.vendor}
          onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
          placeholder="e.g., Office Depot"
        />
        <Input
          label="Receipt Number"
          value={formData.receipt_number}
          onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
          placeholder="e.g., INV-001"
        />
      </div>
      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Brief description of the expense"
      />
      <Textarea
        label="Notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="Additional notes"
      />
    </div>
  );

  if (statsLoading && loading) {
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
      <div className="p-4 sm:p-6 lg:p-8 xl:p-12 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-foreground">Expenses</h1>
            <p className="text-sm sm:text-base xl:text-lg text-default-500 mt-1">Track and manage business expenses</p>
          </div>
          <Button color="primary" onPress={onOpen}>
            + Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardBody className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-default-500">Total Expenses</p>
              <h3 className="text-xl sm:text-2xl font-bold">₱{stats?.total_expenses.toLocaleString() || '0'}</h3>
              <p className="text-xs text-default-400 mt-1">{stats?.total_count || 0} transactions</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-default-500">This Month</p>
              <h3 className="text-xl sm:text-2xl font-bold">₱{stats?.this_month_total.toLocaleString() || '0'}</h3>
              <p className={`text-xs mt-1 ${parseFloat(monthChange) > 0 ? 'text-danger' : 'text-success'}`}>
                {parseFloat(monthChange) > 0 ? '↑' : '↓'} {Math.abs(parseFloat(monthChange))}% vs last month
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-default-500">Today</p>
              <h3 className="text-xl sm:text-2xl font-bold">₱{stats?.today_total.toLocaleString() || '0'}</h3>
              <p className="text-xs text-default-400 mt-1">{stats?.today_count || 0} expenses</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-default-500">Last Month</p>
              <h3 className="text-xl sm:text-2xl font-bold">₱{stats?.last_month_total.toLocaleString() || '0'}</h3>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-wrap gap-4 items-end">
              <Input
                label="Search"
                placeholder="Search expenses..."
                className="max-w-xs"
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Select
                label="Category"
                className="max-w-xs"
                selectedKeys={filters.category ? [filters.category.toString()] : []}
                onChange={(e) => setFilters({ ...filters, category: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </Select>
              <Select
                label="Payment Method"
                className="max-w-xs"
                selectedKeys={filters.payment_method ? [filters.payment_method] : []}
                onChange={(e) => setFilters({ ...filters, payment_method: e.target.value || undefined })}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <SelectItem key={pm.key}>{pm.label}</SelectItem>
                ))}
              </Select>
              <DatePicker
                label="From Date"
                className="max-w-xs"
                value={filters.start_date ? parseDate(filters.start_date) : null}
                onChange={(date) => setFilters({ ...filters, start_date: date ? date.toString() : undefined })}
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                }}
              />
              <DatePicker
                label="To Date"
                className="max-w-xs"
                value={filters.end_date ? parseDate(filters.end_date) : null}
                onChange={(date) => setFilters({ ...filters, end_date: date ? date.toString() : undefined })}
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-white border border-gray-200 hover:border-[#049AE0] data-[hover=true]:bg-white shadow-sm",
                }}
              />
              <Button 
                variant="flat" 
                onPress={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Error */}
        {error && (
          <div className="bg-danger-50 text-danger p-4 rounded-lg">{error}</div>
        )}

        {/* Table */}
        <Card>
          <CardBody className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                <Table aria-label="Expenses table" removeWrapper>
                  <TableHeader>
                    <TableColumn>DATE</TableColumn>
                    <TableColumn>TITLE</TableColumn>
                    <TableColumn>CATEGORY</TableColumn>
                    <TableColumn>VENDOR</TableColumn>
                    <TableColumn>PAYMENT</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent="No expenses found">
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          <span className="text-sm">{new Date(expense.expense_date).toLocaleDateString()}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{expense.title}</p>
                            {expense.description && (
                              <p className="text-xs text-default-400 truncate max-w-[200px]">{expense.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {expense.category_name ? (
                            <Chip 
                              size="sm" 
                              variant="flat"
                              style={{ backgroundColor: `${expense.category_color}20`, color: expense.category_color || undefined }}
                            >
                              {expense.category_name}
                            </Chip>
                          ) : (
                            <span className="text-default-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{expense.vendor || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{expense.payment_method_display}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold">₱{parseFloat(expense.amount).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button size="sm" variant="light" isIconOnly>
                                ⋮
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="Actions">
                              <DropdownItem key="edit" onPress={() => handleEdit(expense)}>
                                Edit
                              </DropdownItem>
                              <DropdownItem key="delete" className="text-danger" onPress={() => handleDelete(expense.id)}>
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {totalPages > 1 && (
                  <div className="flex justify-center py-4 border-t">
                    <Pagination 
                      total={totalPages} 
                      page={page} 
                      onChange={setPage}
                      showControls
                    />
                  </div>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* Create Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
          <ModalContent>
            <ModalHeader>Add New Expense</ModalHeader>
            <ModalBody>{ExpenseForm}</ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => { resetForm(); onClose(); }}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleCreate}>
                Create Expense
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Edit Modal */}
        <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl">
          <ModalContent>
            <ModalHeader>Edit Expense</ModalHeader>
            <ModalBody>{ExpenseForm}</ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => { resetForm(); setEditingExpense(null); onEditClose(); }}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleUpdate}>
                Update Expense
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <ProtectedRoute>
      <ExpensesContent />
    </ProtectedRoute>
  );
}
