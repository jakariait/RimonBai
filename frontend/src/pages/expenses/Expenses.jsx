import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { expenseSchema } from '../../lib/validations';
import { useFetch, useCreate, useUpdate, useDelete } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { FormModal } from '../../components/ui/FormModal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Edit, Trash2 } from 'lucide-react';

const categories = [
  { value: 'Office', label: 'Office' },
  { value: 'Salary', label: 'Salary' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Electricity', label: 'Electricity' },
  { value: 'Internet', label: 'Internet' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Others', label: 'Others' },
];

function Expenses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const { data, isLoading } = useFetch('/expenses', { page: 1, limit: 100 });
  const createMutation = useCreate('/expenses', { invalidate: '/expenses' });
  const updateMutation = useUpdate('/expenses', { invalidate: '/expenses' });
  const deleteMutation = useDelete('/expenses', { invalidate: '/expenses' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(expenseSchema) });

  const openCreate = () => {
    setEditingExpense(null);
    reset({
      category: '',
      amount: 0,
      description: '',
      expenseDate: '',
      paymentMethod: 'Cash',
      reference: '',
    });
    setModalOpen(true);
  };

  const openEdit = (expense) => {
    setEditingExpense(expense);
    reset(expense);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (editingExpense) {
      await updateMutation.mutateAsync({ id: editingExpense._id, body: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingExpense(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const expenses = data?.data || [];

  return (
    <div>
      <PageHeader title="Expenses" onAction={openCreate} />

      <DataTable
        columns={[
          { header: 'Category', accessor: 'category' },
          { header: 'Amount', accessor: 'amount', cell: (row) => formatCurrency(row.amount) },
          { header: 'Description', accessor: 'description' },
          { header: 'Payment', accessor: 'paymentMethod' },
          { header: 'Reference', accessor: 'reference' },
          { header: 'Date', accessor: 'expenseDate', cell: (row) => formatDate(row.expenseDate) },
          {
            header: 'Actions',
            accessor: '_id',
            sortable: false,
            cell: (row) => (
              <div className="flex gap-2">
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
        data={expenses}
        loading={isLoading}
      />

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <FormField label="Category" name="category" error={errors.category?.message} required>
          <Select {...register('category')} options={categories} placeholder="Select category" />
        </FormField>
        <FormField label="Amount" name="amount" error={errors.amount?.message} required>
          <Input
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0"
          />
        </FormField>
        <FormField label="Description" name="description" error={errors.description?.message}>
          <Input {...register('description')} placeholder="Description" />
        </FormField>
        <FormField label="Payment Method" name="paymentMethod">
          <Select
            {...register('paymentMethod')}
            options={[
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Cheque', label: 'Cheque' },
              { value: 'Card', label: 'Card' },
            ]}
          />
        </FormField>
        <FormField label="Reference" name="reference">
          <Input {...register('reference')} placeholder="Reference number" />
        </FormField>
        <FormField label="Date" name="expenseDate">
          <Input type="date" {...register('expenseDate')} />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Expenses;
