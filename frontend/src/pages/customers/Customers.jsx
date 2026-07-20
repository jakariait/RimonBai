import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerSchema } from '../../lib/validations';
import { useFetch, useCreate, useUpdate, useDelete } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { FormModal } from '../../components/ui/FormModal';
import { Input } from '../../components/ui/Input';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { Edit, Trash2, Eye, CreditCard, FileText } from 'lucide-react';

function Customers() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { data, isLoading } = useFetch('/customers', { page: 1, limit: 100 });
  const createMutation = useCreate('/customers', { invalidate: '/customers' });
  const updateMutation = useUpdate('/customers', { invalidate: '/customers' });
  const deleteMutation = useDelete('/customers', { invalidate: '/customers' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(customerSchema) });

  const openCreate = () => {
    setEditingCustomer(null);
    reset({ name: '', company: '', phone: '', email: '', address: '', notes: '', openingDue: 0, openingAdvance: 0 });
    setModalOpen(true);
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    reset(customer);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (editingCustomer) {
      await updateMutation.mutateAsync({ id: editingCustomer._id, body: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingCustomer(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const customers = data?.data || [];

  return (
    <div>
      <PageHeader title="Customers" onAction={openCreate} />

      <DataTable
        columns={[
          { header: 'Name', accessor: 'name' },
          { header: 'Company', accessor: 'company' },
          { header: 'Phone', accessor: 'phone' },
          { header: 'Email', accessor: 'email' },
          {
            header: 'Due Balance',
            accessor: 'dueBalance',
            cell: (row) => (
              <span className={row.dueBalance > 0 ? 'text-destructive font-medium' : 'text-green-600'}>
                {formatCurrency(row.dueBalance)}
              </span>
            ),
          },
          {
            header: 'Advance',
            accessor: 'advanceBalance',
            cell: (row) =>
              row.advanceBalance > 0 ? (
                <Badge variant="success">{formatCurrency(row.advanceBalance)}</Badge>
              ) : (
                '-'
              ),
          },
          {
            header: 'Total Sales',
            accessor: 'totalSales',
            cell: (row) => formatCurrency(row.totalSales),
          },
          {
            header: 'Actions',
            accessor: '_id',
            sortable: false,
            cell: (row) => (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/customers/${row._id}`);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/customers/${row._id}/statement`);
                  }}
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(row);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(row._id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        data={customers}
        loading={isLoading}
      />

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCustomer(null);
        }}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <FormField label="Name" name="name" error={errors.name?.message} required>
          <Input {...register('name')} placeholder="Customer name" />
        </FormField>
        <FormField label="Company" name="company" error={errors.company?.message}>
          <Input {...register('company')} placeholder="Company" />
        </FormField>
        <FormField label="Phone" name="phone" error={errors.phone?.message} required>
          <Input {...register('phone')} placeholder="Phone" />
        </FormField>
        <FormField label="Email" name="email" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="Email" />
        </FormField>
        <FormField label="Address" name="address" error={errors.address?.message}>
          <Input {...register('address')} placeholder="Address" />
        </FormField>
        <FormField label="Opening Due" name="openingDue" error={errors.openingDue?.message}>
          <Input {...register('openingDue', { valueAsNumber: true })} type="number" step="0.01" placeholder="0" />
        </FormField>
        <FormField label="Opening Advance" name="openingAdvance" error={errors.openingAdvance?.message}>
          <Input {...register('openingAdvance', { valueAsNumber: true })} type="number" step="0.01" placeholder="0" />
        </FormField>
        <FormField label="Notes" name="notes" error={errors.notes?.message}>
          <Input {...register('notes')} placeholder="Notes" />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Customers;
