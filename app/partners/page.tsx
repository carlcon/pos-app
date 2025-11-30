'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Textarea,
  addToast,
} from '@heroui/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import type { Partner } from '@/types';

interface PartnerFormData {
  name: string;
  code: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  is_active: boolean;
}

const initialFormData: PartnerFormData = {
  name: '',
  code: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  is_active: true,
};

export default function PartnersPage() {
  const { isSuperAdmin, impersonatePartner, isImpersonating } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<PartnerFormData>(initialFormData);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const fetchPartners = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await api.get<Partner[] | { results: Partner[] }>(`/auth/partners/?${params.toString()}`);
      // Handle both array response and paginated response
      const data = response.data;
      setPartners(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      addToast({
        title: 'Error',
        description: 'Failed to fetch partners',
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPartners();
    }
  }, [fetchPartners, isSuperAdmin]);

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingPartner(partner);
      setFormData({
        name: partner.name,
        code: partner.code,
        contact_email: partner.contact_email || '',
        contact_phone: partner.contact_phone || '',
        address: partner.address || '',
        is_active: partner.is_active,
      });
    } else {
      setEditingPartner(null);
      setFormData(initialFormData);
    }
    onOpen();
  };

  const handleCloseModal = () => {
    setEditingPartner(null);
    setFormData(initialFormData);
    onClose();
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      addToast({
        title: 'Validation Error',
        description: 'Name and Code are required',
        color: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPartner) {
        await api.patch(`/auth/partners/${editingPartner.id}/`, formData);
        addToast({
          title: 'Success',
          description: 'Partner updated successfully',
          color: 'success',
        });
      } else {
        await api.post('/auth/partners/', formData);
        addToast({
          title: 'Success',
          description: 'Partner created successfully',
          color: 'success',
        });
      }
      handleCloseModal();
      fetchPartners();
    } catch (error) {
      console.error('Failed to save partner:', error);
      addToast({
        title: 'Error',
        description: 'Failed to save partner',
        color: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImpersonate = async (partner: Partner) => {
    try {
      await impersonatePartner(partner.id);
      addToast({
        title: 'Success',
        description: `Now viewing as ${partner.name}`,
        color: 'success',
      });
    } catch (error: unknown) {
      console.error('Impersonation failed:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Failed to impersonate partner';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string; detail?: string }; status?: number } };
        const responseData = axiosError.response?.data;
        const statusCode = axiosError.response?.status;
        
        if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (responseData?.detail) {
          errorMessage = responseData.detail;
        } else if (statusCode === 403) {
          errorMessage = 'You do not have permission to impersonate this partner';
        } else if (statusCode === 404) {
          errorMessage = 'Partner not found';
        } else if (statusCode === 400) {
          errorMessage = 'Cannot impersonate this partner (may be inactive)';
        }
      }
      
      addToast({
        title: 'Impersonation Failed',
        description: errorMessage,
        color: 'danger',
      });
    }
  };

  // Access control - only super admins can see this page
  if (!isSuperAdmin) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <h2 className="text-red-800 font-semibold">Access Denied</h2>
            <p className="text-red-600 mt-2">Only Super Admins can access partner management.</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Partner Management</h1>
            <p className="text-gray-500">Manage partners/tenants in the system</p>
          </div>
          <Button color="primary" onPress={() => handleOpenModal()}>
            Add Partner
          </Button>
        </div>

        {/* Impersonation Notice */}
        {isImpersonating && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800">
              <strong>Note:</strong> You are currently impersonating a partner. Exit impersonation to manage partners.
            </p>
          </div>
        )}

        {/* Search */}
        <div className="flex gap-4">
          <Input
            placeholder="Search by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
            isClearable
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Partners Table */}
        <Table aria-label="Partners table">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>CODE</TableColumn>
            <TableColumn>EMAIL</TableColumn>
            <TableColumn>PHONE</TableColumn>
            <TableColumn>USERS</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            isLoading={loading}
            loadingContent={<Spinner label="Loading partners..." />}
            emptyContent="No partners found"
          >
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell className="font-medium">{partner.name}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{partner.code}</code>
                </TableCell>
                <TableCell>{partner.contact_email || '-'}</TableCell>
                <TableCell>{partner.contact_phone || '-'}</TableCell>
                <TableCell>{partner.user_count || 0}</TableCell>
                <TableCell>
                  <Chip
                    color={partner.is_active ? 'success' : 'danger'}
                    size="sm"
                    variant="flat"
                  >
                    {partner.is_active ? 'Active' : 'Inactive'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleImpersonate(partner)}
                      isDisabled={!partner.is_active || isImpersonating}
                    >
                      Login As
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleOpenModal(partner)}
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add/Edit Partner Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
          <ModalContent>
            <ModalHeader>
              {editingPartner ? 'Edit Partner' : 'Add New Partner'}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label="Partner Name"
                placeholder="Enter partner name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                isRequired
              />
              <Input
                label="Partner Code"
                placeholder="Enter unique code (e.g., PARTNER001)"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                isRequired
                isDisabled={!!editingPartner}
                description={editingPartner ? "Code cannot be changed after creation" : ""}
              />
              <Input
                label="Contact Email"
                placeholder="Enter contact email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
              <Input
                label="Contact Phone"
                placeholder="Enter contact phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
              <Textarea
                label="Address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm">Active</label>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={handleCloseModal}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
              >
                {editingPartner ? 'Update' : 'Create'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
