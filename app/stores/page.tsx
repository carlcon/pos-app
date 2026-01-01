'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Card,
  CardBody,
  Textarea,
  Switch,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { Store, StoreUser } from '@/types';

interface StoreFormData {
  code: string;
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  is_active: boolean;
  auto_print_receipt: boolean;
  printer_name: string;
}

interface StoreUserFormData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  is_active: boolean;
  sms_phone: string;
}

const initialStoreForm: StoreFormData = {
  code: '',
  name: '',
  description: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  is_active: true,
  auto_print_receipt: false,
  printer_name: '',
};

const initialUserForm: StoreUserFormData = {
  email: '',
  first_name: '',
  last_name: '',
  password: 'Admin1234@',
  is_active: true,
  sms_phone: '',
};

function StoresContent() {
  const { 
    impersonateStore, 
    effectivePartnerId,
  } = useAuth();
  
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeForm, setStoreForm] = useState<StoreFormData>(initialStoreForm);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Store users state
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [storeUsers, setStoreUsers] = useState<StoreUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userForm, setUserForm] = useState<StoreUserFormData>(initialUserForm);
  const [creatingUserType, setCreatingUserType] = useState<'admin' | 'cashier' | null>(null);
  
  // Created admin info (from store creation)
  const [createdAdminInfo, setCreatedAdminInfo] = useState<{ username: string; password: string } | null>(null);
  
  // Track if we've already fetched on mount
  const hasFetchedRef = useRef(false);

  const { isOpen: isStoreModalOpen, onOpen: onStoreModalOpen, onClose: onStoreModalClose } = useDisclosure();
  const { isOpen: isUsersModalOpen, onOpen: onUsersModalOpen, onClose: onUsersModalClose } = useDisclosure();
  const { isOpen: isUserFormOpen, onOpen: onUserFormOpen, onClose: onUserFormClose } = useDisclosure();
  const { isOpen: isCreatedAdminOpen, onOpen: onCreatedAdminOpen, onClose: onCreatedAdminClose } = useDisclosure();

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<Store[] | { results: Store[] }>('/stores/');
      const data = Array.isArray(response.data) ? response.data : response.data.results;
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (effectivePartnerId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchStores();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePartnerId]);

  const fetchStoreUsers = async (store: Store) => {
    try {
      setLoadingUsers(true);
      const response = await api.get<StoreUser[]>(`/stores/${store.id}/users/`);
      setStoreUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch store users:', error);
      setStoreUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleOpenStoreModal = (store?: Store) => {
    if (store) {
      setEditingStore(store);
      setStoreForm({
        code: store.code,
        name: store.name,
        description: store.description || '',
        contact_email: store.contact_email || '',
        contact_phone: store.contact_phone || '',
        address: store.address || '',
        is_active: store.is_active,
        auto_print_receipt: store.auto_print_receipt || false,
        printer_name: store.printer_name || '',
      });
    } else {
      setEditingStore(null);
      setStoreForm(initialStoreForm);
    }
    onStoreModalOpen();
  };

  const handleCloseStoreModal = () => {
    setEditingStore(null);
    setStoreForm(initialStoreForm);
    onStoreModalClose();
  };

  const handleOpenUsersModal = (store: Store) => {
    setSelectedStore(store);
    fetchStoreUsers(store);
    onUsersModalOpen();
  };

  const handleCloseUsersModal = () => {
    setSelectedStore(null);
    setStoreUsers([]);
    onUsersModalClose();
  };

  const handleOpenUserForm = (userType: 'admin' | 'cashier') => {
    setCreatingUserType(userType);
    setUserForm(initialUserForm);
    onUserFormOpen();
  };

  const handleSubmitStore = async () => {
    try {
      setIsSubmitting(true);
      
      if (editingStore) {
        await api.patch(`/stores/${editingStore.id}/`, storeForm);
      } else {
        const response = await api.post<Store & { created_admin?: { username: string; default_password: string } }>('/stores/', storeForm);
        
        // Show created admin info if a new store was created
        if (response.data.created_admin) {
          setCreatedAdminInfo({
            username: response.data.created_admin.username,
            password: response.data.created_admin.default_password,
          });
          onCreatedAdminOpen();
        }
      }
      
      fetchStores();
      handleCloseStoreModal();
    } catch (error) {
      console.error('Failed to save store:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitUser = async () => {
    if (!selectedStore || !creatingUserType) return;
    
    try {
      setIsSubmitting(true);
      const endpoint = creatingUserType === 'admin' 
        ? `/stores/${selectedStore.id}/users/admin/`
        : `/stores/${selectedStore.id}/users/cashier/`;
      
      const response = await api.post<StoreUser & { default_password: string }>(endpoint, userForm);
      
      // Show created user info
      setCreatedAdminInfo({
        username: response.data.username,
        password: response.data.default_password,
      });
      
      fetchStoreUsers(selectedStore);
      onUserFormClose();
      onCreatedAdminOpen();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonateStore = async (store: Store) => {
    if (!effectivePartnerId) return;
    try {
      await impersonateStore(effectivePartnerId, store.id);
    } catch (error) {
      console.error('Failed to impersonate store:', error);
    }
  };

  const handleToggleUserStatus = async (user: StoreUser) => {
    if (!selectedStore) return;
    try {
      await api.patch(`/stores/${selectedStore.id}/users/${user.id}/`, {
        is_active: !user.is_active,
      });
      fetchStoreUsers(selectedStore);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleResetPassword = async (user: StoreUser) => {
    if (!selectedStore) return;
    const newPassword = prompt('Enter new password (min 8 characters):');
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    try {
      await api.post(`/stores/${selectedStore.id}/users/${user.id}/reset-password/`, {
        new_password: newPassword,
      });
      alert('Password reset successfully');
    } catch (error) {
      console.error('Failed to reset password:', error);
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!effectivePartnerId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <p className="text-amber-800">
              Please impersonate a partner to manage stores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
            <p className="text-gray-600 mt-1">Manage your store locations and their staff</p>
          </div>
          <Button color="primary" onPress={() => handleOpenStoreModal()}>
            + Add Store
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search stores..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
          isClearable
          onClear={() => setSearchQuery('')}
        />

        {/* Stores Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? 'No stores match your search' : 'No stores yet. Create your first store!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => (
              <Card key={store.id} className="shadow-sm">
                <CardBody className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{store.name}</h3>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{store.code}</code>
                    </div>
                    <Chip 
                      color={store.is_active ? 'success' : 'danger'} 
                      size="sm" 
                      variant="flat"
                    >
                      {store.is_active ? 'Active' : 'Inactive'}
                    </Chip>
                  </div>
                  
                  {store.address && (
                    <p className="text-sm text-gray-600 line-clamp-2">{store.address}</p>
                  )}
                  
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>👤 {store.admin_count || 0} Admins</span>
                    <span>🛒 {store.cashier_count || 0} Cashiers</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      color="primary"
                      onPress={() => handleImpersonateStore(store)}
                      isDisabled={!store.is_active}
                    >
                      Enter Store
                    </Button>
                    <Button 
                      size="sm" 
                      variant="flat"
                      onPress={() => handleOpenUsersModal(store)}
                    >
                      Manage Users
                    </Button>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button size="sm" variant="light" isIconOnly>⋯</Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key="edit" onPress={() => handleOpenStoreModal(store)}>
                          Edit Store
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Store Form Modal */}
        <Modal isOpen={isStoreModalOpen} onClose={handleCloseStoreModal} size="2xl">
          <ModalContent>
            <ModalHeader>{editingStore ? 'Edit Store' : 'Create Store'}</ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Store Code"
                  value={storeForm.code}
                  onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value })}
                  placeholder="e.g., STORE-001"
                  isDisabled={!!editingStore}
                />
                <Input
                  label="Store Name"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  placeholder="Main Street Store"
                  isRequired
                />
              </div>
              <Textarea
                label="Description"
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                placeholder="Store description..."
              />
              <Textarea
                label="Address"
                value={storeForm.address}
                onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                placeholder="Full address..."
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Contact Email"
                  type="email"
                  value={storeForm.contact_email}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_email: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={storeForm.contact_phone}
                  onChange={(e) => setStoreForm({ ...storeForm, contact_phone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Switch
                  isSelected={storeForm.is_active}
                  onValueChange={(val) => setStoreForm({ ...storeForm, is_active: val })}
                >
                  Store Active
                </Switch>
                <Switch
                  isSelected={storeForm.auto_print_receipt}
                  onValueChange={(val) => setStoreForm({ ...storeForm, auto_print_receipt: val })}
                >
                  Auto-print Receipts
                </Switch>
              </div>
              {storeForm.auto_print_receipt && (
                <Input
                  label="Printer Name"
                  value={storeForm.printer_name}
                  onChange={(e) => setStoreForm({ ...storeForm, printer_name: e.target.value })}
                  placeholder="Printer device name"
                />
              )}
              {!editingStore && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> A Store Admin account will be automatically created for this store with default password <code className="bg-blue-100 px-1 rounded">Admin1234@</code>
                  </p>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleCloseStoreModal}>Cancel</Button>
              <Button color="primary" onPress={handleSubmitStore} isLoading={isSubmitting}>
                {editingStore ? 'Update' : 'Create Store'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Store Users Modal */}
        <Modal isOpen={isUsersModalOpen} onClose={handleCloseUsersModal} size="3xl">
          <ModalContent>
            <ModalHeader>
              {selectedStore?.name} - Users
            </ModalHeader>
            <ModalBody>
              <div className="flex gap-2 mb-4">
                <Button size="sm" color="primary" onPress={() => handleOpenUserForm('admin')}>
                  + Add Admin
                </Button>
                <Button size="sm" color="secondary" onPress={() => handleOpenUserForm('cashier')}>
                  + Add Cashier
                </Button>
              </div>
              
              {loadingUsers ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : storeUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No users found for this store</p>
              ) : (
                <Table aria-label="Store users">
                  <TableHeader>
                    <TableColumn>USERNAME</TableColumn>
                    <TableColumn>NAME</TableColumn>
                    <TableColumn>ROLE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {storeUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.username}</TableCell>
                        <TableCell>
                          {user.first_name || user.last_name 
                            ? `${user.first_name} ${user.last_name}`.trim() 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="sm" 
                            color={user.role === 'STORE_ADMIN' ? 'primary' : 'success'}
                            variant="flat"
                          >
                            {user.role === 'STORE_ADMIN' ? 'Admin' : 'Cashier'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            size="sm" 
                            color={user.is_active ? 'success' : 'danger'}
                            variant="flat"
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button size="sm" variant="light">Actions</Button>
                            </DropdownTrigger>
                            <DropdownMenu>
                              <DropdownItem 
                                key="toggle"
                                onPress={() => handleToggleUserStatus(user)}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </DropdownItem>
                              <DropdownItem 
                                key="reset"
                                onPress={() => handleResetPassword(user)}
                              >
                                Reset Password
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleCloseUsersModal}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* User Form Modal */}
        <Modal isOpen={isUserFormOpen} onClose={onUserFormClose}>
          <ModalContent>
            <ModalHeader>
              Create {creatingUserType === 'admin' ? 'Store Admin' : 'Cashier'}
            </ModalHeader>
            <ModalBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={userForm.first_name}
                  onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                />
                <Input
                  label="Last Name"
                  value={userForm.last_name}
                  onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
              <Input
                label="SMS Phone"
                value={userForm.sms_phone}
                onChange={(e) => setUserForm({ ...userForm, sms_phone: e.target.value })}
                placeholder="+1234567890"
              />
              <Input
                label="Password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                description="Default: Admin1234@"
              />
              <Switch
                isSelected={userForm.is_active}
                onValueChange={(val) => setUserForm({ ...userForm, is_active: val })}
              >
                User Active
              </Switch>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onUserFormClose}>Cancel</Button>
              <Button color="primary" onPress={handleSubmitUser} isLoading={isSubmitting}>
                Create User
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Created Admin Info Modal */}
        <Modal isOpen={isCreatedAdminOpen} onClose={onCreatedAdminClose}>
          <ModalContent>
            <ModalHeader>User Created Successfully</ModalHeader>
            <ModalBody>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <p className="text-green-800 font-medium">Save these credentials:</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Username:</span>
                    <code className="ml-2 bg-green-100 px-2 py-1 rounded font-mono">
                      {createdAdminInfo?.username}
                    </code>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Password:</span>
                    <code className="ml-2 bg-green-100 px-2 py-1 rounded font-mono">
                      {createdAdminInfo?.password}
                    </code>
                  </div>
                </div>
                <p className="text-sm text-green-700 mt-4">
                  ⚠️ Please share these credentials securely with the user and ask them to change their password.
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={onCreatedAdminClose}>
                Got it
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}

export default function StoresPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StoresContent />
    </ProtectedRoute>
  );
}
