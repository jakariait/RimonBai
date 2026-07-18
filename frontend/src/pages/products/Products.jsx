import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../../lib/validations";
import { useFetch, useCreate, useUpdate, useDelete } from "../../hooks/useQueries";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/Table";
import { FormModal } from "../../components/ui/FormModal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCurrency } from "../../lib/utils";
import { Edit, Trash2 } from "lucide-react";

const units = [
  { value: "Piece", label: "Piece" },
  { value: "Box", label: "Box" },
  { value: "Pack", label: "Pack" },
  { value: "Set", label: "Set" },
  { value: "Pair", label: "Pair" },
  { value: "Dozen", label: "Dozen" },
  { value: "Roll", label: "Roll" },
  { value: "Bottle", label: "Bottle" },
  { value: "Kit", label: "Kit" },
];

function Products() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const { data: productsData, isLoading } = useFetch("/products", { page: 1, limit: 200 });
  const createMutation = useCreate("/products", { invalidate: "/products" });
  const updateMutation = useUpdate("/products", { invalidate: "/products" });
  const deleteMutation = useDelete("/products", { invalidate: "/products" });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(productSchema) });

  const openCreate = () => {
    setEditingProduct(null);
    reset({ productName: "", sku: "", brand: "", modelNumber: "", serialNumber: "", purchasePrice: 0, sellingPrice: 0, currentStock: 0, minimumStock: 5, warranty: "", barcode: "", unit: "Piece", description: "" });
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    reset(product);
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    if (editingProduct) {
      await updateMutation.mutateAsync({ id: editingProduct._id, body: data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const products = productsData?.data || [];

  return (
    <div>
      <PageHeader title="Products" onAction={openCreate} />

      <DataTable
        columns={[
          { header: "Name", accessor: "productName" },
          { header: "SKU", accessor: "sku" },
          { header: "Brand", accessor: "brand" },
          {
            header: "Purchase Price",
            accessor: "purchasePrice",
            cell: (row) => formatCurrency(row.purchasePrice),
          },
          {
            header: "Selling Price",
            accessor: "sellingPrice",
            cell: (row) => formatCurrency(row.sellingPrice),
          },
          { header: "Stock", accessor: "currentStock" },
          { header: "Min Stock", accessor: "minimumStock" },
          {
            header: "Status",
            accessor: "currentStock",
            cell: (row) => {
              if (row.currentStock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
              if (row.currentStock <= row.minimumStock) return <Badge variant="warning">Low Stock</Badge>;
              return <Badge variant="success">In Stock</Badge>;
            },
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
        data={products}
        loading={isLoading}
      />

      <FormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? "Edit Product" : "Add Product"}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={createMutation.isPending || updateMutation.isPending}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Product Name" name="productName" error={errors.productName?.message} required>
            <Input {...register("productName")} placeholder="Product name" />
          </FormField>
          <FormField label="SKU" name="sku" error={errors.sku?.message}>
            <Input {...register("sku")} placeholder="Auto-generated if empty" />
          </FormField>
          <FormField label="Brand" name="brand" error={errors.brand?.message}>
            <Input {...register("brand")} placeholder="Brand" />
          </FormField>
          <FormField label="Model Number" name="modelNumber" error={errors.modelNumber?.message}>
            <Input {...register("modelNumber")} placeholder="Model number" />
          </FormField>
          <FormField label="Serial Number" name="serialNumber" error={errors.serialNumber?.message}>
            <Input {...register("serialNumber")} placeholder="Serial number" />
          </FormField>
          <FormField label="Purchase Price" name="purchasePrice" error={errors.purchasePrice?.message} required>
            <Input type="number" step="0.01" {...register("purchasePrice", { valueAsNumber: true })} placeholder="0" />
          </FormField>
          <FormField label="Selling Price" name="sellingPrice" error={errors.sellingPrice?.message} required>
            <Input type="number" step="0.01" {...register("sellingPrice", { valueAsNumber: true })} placeholder="0" />
          </FormField>
          <FormField label="Current Stock" name="currentStock" error={errors.currentStock?.message}>
            <Input type="number" {...register("currentStock", { valueAsNumber: true })} placeholder="0" />
          </FormField>
          <FormField label="Min Stock Level" name="minimumStock" error={errors.minimumStock?.message}>
            <Input type="number" {...register("minimumStock", { valueAsNumber: true })} placeholder="5" />
          </FormField>
          <FormField label="Unit" name="unit" error={errors.unit?.message}>
            <Select {...register("unit")} options={units} />
          </FormField>
          <FormField label="Barcode" name="barcode" error={errors.barcode?.message}>
            <Input {...register("barcode")} placeholder="Barcode" />
          </FormField>
        </div>
        <FormField label="Warranty" name="warranty" error={errors.warranty?.message}>
          <Input {...register("warranty")} placeholder="Warranty info" />
        </FormField>
        <FormField label="Description" name="description" error={errors.description?.message}>
          <Input {...register("description")} placeholder="Description" />
        </FormField>
      </FormModal>
    </div>
  );
}

export default Products;
