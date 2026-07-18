import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFetch, useCreate, useUpdate, useDelete } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { FormModal } from '../../components/ui/FormModal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getInitials } from '../../lib/utils';
import { Edit, Trash2 } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().optional().default(''),
});

const roleOptions = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales', label: 'Sales' },
  { value: 'accountant', label: 'Accountant' },
];

function Users() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data, isLoading } = useFetch('/users', { page: 1, limit: 100 });
  const createMutation = useCreate('/users', { invalidate: '/users' });
  const updateMutation = useUpdate('/users', { invalidate: '/users' });
  const deleteMutation = useDelete('/users', { invalidate: '/users' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(userSchema) });

  const openCreate = () => {
    setEditingUser(null);
    reset({ name: '', email: '', password: '', role: 'sales', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    reset({ ...user, password: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (editingUser) {
      const updateData = { ...data };
      if (!updateData.password) delete updateData.password;
      delete updateData.email;
      await updateMutation.mutateAsync({ id: editingUser._id, body: updateData });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const users = data?.data || [];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage system users and their roles"
        onAction={openCreate}
      />

      <DataTable
        columns={[
          {
            header: 'User',
            accessor: 'name',
            cell: (row) => (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {getInitials(row.name)}
                </div>
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </div>
              </div>
            ),
          },
          { header: 'Phone', accessor: 'phone' },
          {
            header: 'Role',
            accessor: 'role',
            cell: (row) => (
              <Badge variant={row.role === 'super_admin' ? 'default' : 'secondary'}>
                {row.role?.replace('_', ' ')}
              </Badge>
            ),
          },
          {
            header: 'Status',
            accessor: 'isActive',
            cell: (row) => (
              <Badge variant={row.isActive ? 'success' : 'destructive'}>
                {row.isActive ? 'Active' : 'Inactive'}
              </Badge>
            ),
          },
          {
            header: 'Joined',
            accessor: 'createdAt',
            cell: (row) => new Date(row.createdAt).toLocaleDateString(),
          },
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
        data={users}
        loading={isLoading}
      />

      <FormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingUser(null);
        }}
        title={editingUser ? 'Edit User' : 'Add User'}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <FormField label="Name" name="name" error={errors.name?.message} required>
          <Input {...register('name')} placeholder="Full name" />
        </FormField>
        <FormField label="Email" name="email" error={errors.email?.message} required>
          <Input
            {...register('email')}
            type="email"
            placeholder="Email address"
            disabled={!!editingUser}
          />
        </FormField>
        <FormField
          label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
          name="password"
          error={errors.password?.message}
          required={!editingUser}
        >
          <Input {...register('password')} type="password" placeholder="Password" />
        </FormField>
        <FormField label="Role" name="role" error={errors.role?.message} required>
          <Select {...register('role')} options={roleOptions} placeholder="Select role" />
        </FormField>
        <FormField label="Phone" name="phone" error={errors.phone?.message}>
          <Input {...register('phone')} placeholder="Phone number" />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Users;
