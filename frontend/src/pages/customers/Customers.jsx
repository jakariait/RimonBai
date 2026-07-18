import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../../lib/validations";
import { useFetch, useCreate, useUpdate, useDelete } from "../../hooks/useQueries";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/Table";
import { FormModal } from "../../components/ui/FormModal";
import { Input } from "../../components/ui/Input";
import { FormField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import { formatCurrency } from "../../lib/utils";
import { Edit, Trash2 } from "lucide-react";

function Customers() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const { data, isLoading } = useFetch("/customers", { page: 1, limit: 100 });
  const createMutation = useCreate("/customers", { invalidate: "/customers" });
  const updateMutation = useUpdate("/customers", { invalidate: "/customers" });
  const deleteMutation = useDelete("/customers", { invalidate: "/customers" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(customerSchema) });

  const openCreate = () => {
    setEditingCustomer(null);
    reset({ name: "", company: "", phone: "", email: "", address: "", notes: "" });
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
    if (window.confirm("Are you sure?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const customers = data?.data || [];

  return (
    <div>
      <PageHeader title="Customers" onAction={openCreate} />

      <DataTable
        columns={[
          { header: "Name", accessor: "name" },
          { header: "Company", accessor: "company" },
          { header: "Phone", accessor: "phone" },
          { header: "Email", accessor: "email" },
          {
            header: "Due Balance",
            accessor: "dueBalance",
            cell: (row) => formatCurrency(row.dueBalance),
          },
          {
            header: "Actions",
            accessor: "_id",
            sortable: false,
            cell: (row) => (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(row._id); }}>
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
        onClose={() => { setModalOpen(false); setEditingCustomer(null); }}
        title={editingCustomer ? "Edit Customer" : "Add Customer"}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <FormField label="Name" name="name" error={errors.name?.message} required>
          <Input {...register("name")} placeholder="Customer name" />
        </FormField>
        <FormField label="Company" name="company" error={errors.company?.message}>
          <Input {...register("company")} placeholder="Company" />
        </FormField>
        <FormField label="Phone" name="phone" error={errors.phone?.message} required>
          <Input {...register("phone")} placeholder="Phone" />
        </FormField>
        <FormField label="Email" name="email" error={errors.email?.message}>
          <Input {...register("email")} type="email" placeholder="Email" />
        </FormField>
        <FormField label="Address" name="address" error={errors.address?.message}>
          <Input {...register("address")} placeholder="Address" />
        </FormField>
        <FormField label="Notes" name="notes" error={errors.notes?.message}>
          <Input {...register("notes")} placeholder="Notes" />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Customers;
