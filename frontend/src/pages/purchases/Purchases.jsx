import { useState, useMemo } from 'react';
import { useFetch, useCreate, useUpdate, useDelete } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Plus, Trash2, Eye, Pencil } from 'lucide-react';
import { toast } from 'sonner';

function Purchases() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [items, setItems] = useState([{ product: '', quantity: 1, unitCost: 0 }]);

  const { data: purchasesData, isLoading } = useFetch('/purchases', { page: 1, limit: 100 });
  const { data: suppliersData } = useFetch('/suppliers', { page: 1, limit: 200 });
  const { data: productsData } = useFetch('/products', { page: 1, limit: 500 });
  const createMutation = useCreate('/purchases', { invalidate: '/purchases' });
  const updateMutation = useUpdate('/purchases', { invalidate: '/purchases' });
  const deleteMutation = useDelete('/purchases', { invalidate: '/purchases' });

  const suppliers = suppliersData?.data || [];
  const products = productsData?.data || [];

  const supplierOptions = suppliers.map((s) => ({ value: s._id, label: s.companyName }));

  const extraProducts = useMemo(() => {
    if (!editingPurchase?.items) return [];
    return editingPurchase.items
      .filter((i) => i.product && typeof i.product === 'object')
      .filter((i) => !products.find((p) => p._id === i.product._id))
      .map((i) => ({
        _id: i.product._id,
        productName: i.product.productName || 'Unknown',
        sku: i.product.sku || '',
        purchasePrice: i.unitCost || 0,
      }));
  }, [editingPurchase, products]);

  const allProducts = [...products, ...extraProducts];
  const productOptions = allProducts.map((p) => ({
    value: p._id,
    label: `${p.productName} (${p.sku}) - ${formatCurrency(p.purchasePrice)}`,
  }));

  const addItem = () => setItems([...items, { product: '', quantity: 1, unitCost: 0 }]);
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === 'product') {
      const product = products.find((p) => p._id === value);
      if (product) {
        newItems[index].unitCost = product.purchasePrice;
      }
    }

    setItems(newItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  };

  const openCreateModal = () => {
    setEditingPurchase(null);
    setItems([{ product: '', quantity: 1, unitCost: 0 }]);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingPurchase(row);
    setItems(
      row.items?.map((i) => ({
        product: String(
          i.product && typeof i.product === 'object' ? i.product._id || '' : i.product || ''
        ),
        quantity: i.quantity,
        unitCost: i.unitCost,
      })) || [{ product: '', quantity: 1, unitCost: 0 }]
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPurchase(null);
    setItems([{ product: '', quantity: 1, unitCost: 0 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      supplier: form.supplier.value,
      discount: parseFloat(form.discount.value) || 0,
      taxRate: parseFloat(form.taxRate.value) || 0,
      shipping: parseFloat(form.shipping.value) || 0,
      otherCosts: parseFloat(form.otherCosts.value) || 0,
      paidAmount: parseFloat(form.paidAmount.value) || 0,
      notes: form.notes.value,
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
    };

    if (!data.supplier) return toast.error('Please select a supplier');
    if (items.some((i) => !i.product)) return toast.error('Please select products');

    try {
      if (editingPurchase) {
        await updateMutation.mutateAsync({ id: editingPurchase._id, body: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeModal();
    } catch {}
  };

  const formKey = editingPurchase?._id || 'new';

  return (
    <div>
      <PageHeader title="Purchases" onAction={openCreateModal} />

      <DataTable
        columns={[
          { header: 'Purchase #', accessor: 'purchaseNumber' },
          {
            header: 'Supplier',
            accessor: 'supplier',
            cell: (row) => row.supplier?.companyName || 'N/A',
          },
          {
            header: 'Total',
            accessor: 'grandTotal',
            cell: (row) => formatCurrency(row.grandTotal),
          },
          {
            header: 'Paid',
            accessor: 'paidAmount',
            cell: (row) => formatCurrency(row.paidAmount),
          },
          {
            header: 'Due',
            accessor: 'dueAmount',
            cell: (row) => formatCurrency(row.dueAmount),
          },
          {
            header: 'Status',
            accessor: 'status',
            cell: (row) => {
              if (row.dueAmount === 0) return <Badge variant="success">Paid</Badge>;
              if (row.dueAmount > 0 && row.paidAmount > 0)
                return <Badge variant="warning">Partial</Badge>;
              return <Badge variant="destructive">Unpaid</Badge>;
            },
          },
          { header: 'Date', accessor: 'purchaseDate', cell: (row) => formatDate(row.purchaseDate) },
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
                    openEditModal(row);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailModal(row);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(row);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]}
        data={purchasesData?.data || []}
        loading={isLoading}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingPurchase ? 'Edit Purchase' : 'New Purchase'}
        size="xl"
      >
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Supplier" required>
              <Select
                name="supplier"
                options={supplierOptions}
                placeholder="Select supplier"
                defaultValue={editingPurchase?.supplier?._id || ''}
              />
            </FormField>
            <FormField label="Discount">
              <Input
                name="discount"
                type="number"
                step="0.01"
                defaultValue={editingPurchase?.discount ?? '0'}
              />
            </FormField>
            <FormField label="Tax Rate (%)">
              <Input
                name="taxRate"
                type="number"
                step="0.1"
                defaultValue={editingPurchase?.taxRate ?? '0'}
              />
            </FormField>
            <FormField label="Shipping">
              <Input
                name="shipping"
                type="number"
                step="0.01"
                defaultValue={editingPurchase?.shipping ?? '0'}
              />
            </FormField>
            <FormField label="Other Costs">
              <Input
                name="otherCosts"
                type="number"
                step="0.01"
                defaultValue={editingPurchase?.otherCosts ?? '0'}
              />
            </FormField>
            <FormField label="Paid Amount">
              <Input
                name="paidAmount"
                type="number"
                step="0.01"
                defaultValue={editingPurchase?.paidAmount ?? '0'}
              />
            </FormField>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Items</h4>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Select
                      value={item.product}
                      onChange={(e) => updateItem(i, 'product', e.target.value)}
                      options={productOptions}
                      placeholder="Select product"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitCost}
                      onChange={(e) => updateItem(i, 'unitCost', parseFloat(e.target.value) || 0)}
                      placeholder="Cost"
                    />
                  </div>
                  <div className="w-32 pt-2 text-sm font-medium">
                    {formatCurrency(item.quantity * item.unitCost)}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-2 border-t">
                <span className="font-bold text-lg">Total: {formatCurrency(getTotal())}</span>
              </div>
            </CardContent>
          </Card>

          <FormField label="Notes">
            <Input name="notes" placeholder="Notes" defaultValue={editingPurchase?.notes || ''} />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingPurchase ? 'Update Purchase' : 'Create Purchase'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Purchase Details"
        size="lg"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Purchase #</p>
                <p className="font-medium">{detailModal.purchaseNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supplier</p>
                <p className="font-medium">{detailModal.supplier?.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(detailModal.purchaseDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge>{detailModal.status}</Badge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Cost</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.items?.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.product?.productName || 'N/A'}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.unitCost)}</td>
                      <td className="text-right py-2">{formatCurrency(item.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(detailModal.subtotal)}</span>
              </div>
              {detailModal.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span>-{formatCurrency(detailModal.discount)}</span>
                </div>
              )}
              {detailModal.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(detailModal.taxAmount)}</span>
                </div>
              )}
              {detailModal.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{formatCurrency(detailModal.shipping)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Grand Total</span>
                <span>{formatCurrency(detailModal.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Paid</span>
                <span>{formatCurrency(detailModal.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Due</span>
                <span className="text-destructive">{formatCurrency(detailModal.dueAmount)}</span>
              </div>
            </div>

            {detailModal.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p>{detailModal.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this purchase? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => {
                deleteMutation.mutate(deleteConfirm._id);
                setDeleteConfirm(null);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Purchases;
