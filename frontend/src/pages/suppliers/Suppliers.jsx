import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplierSchema } from "../../lib/validations";
import { useFetch, useCreate, useUpdate, useDelete } from "../../hooks/useQueries";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/Table";
import { FormModal } from "../../components/ui/FormModal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { formatCurrency } from "../../lib/utils";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

function Suppliers() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useFetch("/suppliers", { page: 1, limit: 100 });
  const createMutation = useCreate("/suppliers", { invalidate: "/suppliers" });
  const updateMutation = useUpdate("/suppliers", { invalidate: "/suppliers" });
  const deleteMutation = useDelete("/suppliers", { invalidate: "/suppliers" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(supplierSchema),
    defaultValues: { status: "Active" },
  });

  const openCreate = () => {
    setEditingSupplier(null);
    reset({ status: "Active", companyName: "", contactPerson: "", phone: "", email: "", address: "", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    setEditingSupplier(supplier);
    reset(supplier);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (editingSupplier) {
      await updateMutation.mutateAsync({ id: editingSupplier._id, body: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingSupplier(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const suppliers = data?.data || [];

  return (
    <div>
      <PageHeader title="Suppliers" onAction={openCreate} />

      <DataTable
        columns={[
          { header: "Company", accessor: "companyName" },
          { header: "Contact", accessor: "contactPerson" },
          { header: "Phone", accessor: "phone" },
          { header: "Email", accessor: "email" },
          {
            header: "Balance",
            accessor: "outstandingBalance",
            cell: (row) => formatCurrency(row.outstandingBalance),
          },
          {
            header: "Status",
            accessor: "status",
            cell: (row) => (
              <Badge variant={row.status === "Active" ? "success" : "secondary"}>{row.status}</Badge>
            ),
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
        data={suppliers}
        loading={isLoading}
      />

      <FormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSupplier(null); }}
        title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
      >
        <FormField label="Company Name" name="companyName" error={errors.companyName?.message} required>
          <Input {...register("companyName")} placeholder="Company name" />
        </FormField>
        <FormField label="Contact Person" name="contactPerson" error={errors.contactPerson?.message}>
          <Input {...register("contactPerson")} placeholder="Contact person name" />
        </FormField>
        <FormField label="Phone" name="phone" error={errors.phone?.message} required>
          <Input {...register("phone")} placeholder="Phone number" />
        </FormField>
        <FormField label="Email" name="email" error={errors.email?.message}>
          <Input {...register("email")} type="email" placeholder="Email address" />
        </FormField>
        <FormField label="Address" name="address" error={errors.address?.message}>
          <Input {...register("address")} placeholder="Address" />
        </FormField>
        <FormField label="Status" name="status" error={errors.status?.message}>
          <Select {...register("status")} options={statusOptions} />
        </FormField>
        <FormField label="Notes" name="notes" error={errors.notes?.message}>
          <Input {...register("notes")} placeholder="Notes" />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Suppliers;
