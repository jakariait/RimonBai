import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { toast } from 'sonner';
import { useFetch } from '../../hooks/useQueries';
import useAuthStore from '../../store/useAuthStore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema } from '../../lib/validations';
import { Building2, FileText, Key, Save, Plus, X } from 'lucide-react';

function Settings() {
  const [activeTab, setActiveTab] = useState('business');
  const { loading } = useAuthStore();

  const { data: businessData, refetch: refetchBusiness } = useFetch('/settings/business');
  const { data: invoiceData, refetch: refetchInvoice } = useFetch('/settings/invoice');

  const [businessForm, setBusinessForm] = useState({ phones: [], emails: [] });
  const [invoiceForm, setInvoiceForm] = useState({});

  useEffect(() => {
    if (businessData?.data) {
      setBusinessForm({
        ...businessData.data,
        phones: businessData.data.phones || [],
        emails: businessData.data.emails || [],
      });
    }
  }, [businessData]);

  useEffect(() => {
    if (invoiceData?.data) setInvoiceForm(invoiceData.data);
  }, [invoiceData]);

  const updateBusiness = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/business', businessForm);
      toast.success('Business settings updated');
      refetchBusiness();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const updateInvoice = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings/invoice', invoiceForm);
      toast.success('Invoice settings updated');
      refetchInvoice();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const changePassword = async (data) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    }
  };

  const tabs = [
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'invoice', label: 'Invoice Settings', icon: FileText },
    { id: 'password', label: 'Change Password', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your business and system settings</p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === 'business' && (
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateBusiness} className="space-y-4 max-w-xl">
              <FormField label="Business Name">
                <Input
                  value={businessForm.businessName || ''}
                  onChange={(e) =>
                    setBusinessForm({ ...businessForm, businessName: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Address">
                <Input
                  value={businessForm.address || ''}
                  onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                />
              </FormField>
              <FormField label="Phone Numbers">
                <div className="space-y-2">
                  {(businessForm.phones || []).map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={p}
                        onChange={(e) => {
                          const updated = [...(businessForm.phones || [])];
                          updated[i] = e.target.value;
                          setBusinessForm({ ...businessForm, phones: updated });
                        }}
                        placeholder="Enter phone number"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = (businessForm.phones || []).filter((_, j) => j !== i);
                          setBusinessForm({ ...businessForm, phones: updated });
                        }}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setBusinessForm({
                        ...businessForm,
                        phones: [...(businessForm.phones || []), ''],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Phone
                  </Button>
                </div>
              </FormField>
              <FormField label="Email Addresses">
                <div className="space-y-2">
                  {(businessForm.emails || []).map((e, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        value={e}
                        onChange={(ev) => {
                          const updated = [...(businessForm.emails || [])];
                          updated[i] = ev.target.value;
                          setBusinessForm({ ...businessForm, emails: updated });
                        }}
                        placeholder="Enter email address"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = (businessForm.emails || []).filter((_, j) => j !== i);
                          setBusinessForm({ ...businessForm, emails: updated });
                        }}
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setBusinessForm({
                        ...businessForm,
                        emails: [...(businessForm.emails || []), ''],
                      })
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Email
                  </Button>
                </div>
              </FormField>
              <FormField label="Website">
                <Input
                  value={businessForm.website || ''}
                  onChange={(e) => setBusinessForm({ ...businessForm, website: e.target.value })}
                />
              </FormField>
              <FormField label="Tax ID">
                <Input
                  value={businessForm.taxId || ''}
                  onChange={(e) => setBusinessForm({ ...businessForm, taxId: e.target.value })}
                />
              </FormField>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'invoice' && (
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateInvoice} className="space-y-4 max-w-xl">
              <FormField label="Invoice Prefix">
                <Input
                  value={invoiceForm.prefix || ''}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, prefix: e.target.value })}
                />
              </FormField>
              <FormField label="Default Tax Rate (%)">
                <Input
                  type="number"
                  value={invoiceForm.defaultTaxRate || 0}
                  onChange={(e) =>
                    setInvoiceForm({
                      ...invoiceForm,
                      defaultTaxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </FormField>
              <FormField label="Default Payment Terms">
                <Input
                  value={invoiceForm.defaultPaymentTerms || ''}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, defaultPaymentTerms: e.target.value })
                  }
                />
              </FormField>
              <FormField label="Footer Text">
                <Input
                  value={invoiceForm.footerText || ''}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, footerText: e.target.value })}
                />
              </FormField>
              <FormField label="Terms & Conditions">
                <Input
                  value={invoiceForm.termsAndConditions || ''}
                  onChange={(e) =>
                    setInvoiceForm({ ...invoiceForm, termsAndConditions: e.target.value })
                  }
                />
              </FormField>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(changePassword)} className="space-y-4 max-w-xl">
              <FormField
                label="Current Password"
                name="currentPassword"
                error={errors.currentPassword?.message}
                required
              >
                <Input
                  type="password"
                  {...register('currentPassword')}
                  placeholder="Current password"
                />
              </FormField>
              <FormField
                label="New Password"
                name="newPassword"
                error={errors.newPassword?.message}
                required
              >
                <Input type="password" {...register('newPassword')} placeholder="New password" />
              </FormField>
              <FormField
                label="Confirm Password"
                name="confirmPassword"
                error={errors.confirmPassword?.message}
                required
              >
                <Input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                />
              </FormField>
              <Button type="submit" isLoading={loading}>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Settings;
