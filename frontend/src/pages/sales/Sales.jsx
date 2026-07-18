import { useState } from "react";
import { useFetch, useCreate } from "../../hooks/useQueries";
import { PageHeader } from "../../components/ui/PageHeader";
import { DataTable } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { FormField } from "../../components/ui/FormField";
import { Badge } from "../../components/ui/Badge";
import { Card, CardContent } from "../../components/ui/Card";
import { formatCurrency, formatDate } from "../../lib/utils";
import { Plus, Trash2, Eye, FileText } from "lucide-react";
import { toast } from "sonner";

const paymentMethods = [
  { value: "Cash", label: "Cash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "Card", label: "Card" },
  { value: "Mobile Banking", label: "Mobile Banking" },
];

function Sales() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [items, setItems] = useState([{ product: "", quantity: 1, unitPrice: 0 }]);

  const { data: salesData, isLoading } = useFetch("/sales", { page: 1, limit: 100 });
  const { data: customersData } = useFetch("/customers", { page: 1, limit: 200 });
  const { data: productsData } = useFetch("/products", { page: 1, limit: 500 });
  const createMutation = useCreate("/sales", { invalidate: "/sales" });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  const customerOptions = customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone})` }));
  const productOptions = products.map((p) => ({ value: p._id, label: `${p.productName} (${p.sku}) - ${formatCurrency(p.sellingPrice)}` }));

  const addItem = () => setItems([...items, { product: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "product") {
      const product = products.find((p) => p._id === value);
      if (product) {
        newItems[index].unitPrice = product.sellingPrice;
      }
    }

    setItems(newItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      customer: form.customer.value,
      discount: parseFloat(form.discount.value) || 0,
      taxRate: parseFloat(form.taxRate.value) || 0,
      deliveryCharge: parseFloat(form.deliveryCharge.value) || 0,
      paidAmount: parseFloat(form.paidAmount.value) || 0,
      paymentMethod: form.paymentMethod.value,
      notes: form.notes.value,
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    if (!data.customer) return toast.error("Please select a customer");
    if (items.some((i) => !i.product)) return toast.error("Please select products");

    try {
      await createMutation.mutateAsync(data);
      setModalOpen(false);
      setItems([{ product: "", quantity: 1, unitPrice: 0 }]);
    } catch {}
  };

  const printInvoice = (sale) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = sale.items.map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.product?.productName || "N/A"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html><head><title>Invoice ${sale.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .details { margin-bottom: 20px; }
        .details td { padding: 4px 8px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px 8px; text-align: left; border-bottom: 2px solid #ddd; }
        .totals { margin-top: 20px; text-align: right; }
        .totals p { margin: 4px 0; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
      </style></head><body>
        <div class="header">
          <h1>INVOICE</h1>
          <p>Invoice #: ${sale.invoiceNumber}</p>
        </div>
        <table class="details">
          <tr><td><strong>Customer:</strong> ${sale.customer?.name || "N/A"}</td></tr>
          <tr><td><strong>Date:</strong> ${formatDate(sale.saleDate)}</td></tr>
          ${sale.customer?.phone ? `<tr><td><strong>Phone:</strong> ${sale.customer.phone}</td></tr>` : ""}
          ${sale.customer?.address ? `<tr><td><strong>Address:</strong> ${sale.customer.address}</td></tr>` : ""}
        </table>
        <table>
          <thead><tr><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <p><strong>Subtotal:</strong> ${formatCurrency(sale.subtotal)}</p>
          ${sale.discount > 0 ? `<p><strong>Discount:</strong> -${formatCurrency(sale.discount)}</p>` : ""}
          ${sale.taxAmount > 0 ? `<p><strong>Tax:</strong> ${formatCurrency(sale.taxAmount)}</p>` : ""}
          ${sale.deliveryCharge > 0 ? `<p><strong>Delivery:</strong> ${formatCurrency(sale.deliveryCharge)}</p>` : ""}
          <p style="font-size:18px;font-weight:bold;border-top:2px solid #333;padding-top:8px">
            <strong>Grand Total:</strong> ${formatCurrency(sale.grandTotal)}
          </p>
          <p><strong>Paid:</strong> ${formatCurrency(sale.paidAmount)}</p>
          <p><strong>Due:</strong> ${formatCurrency(sale.dueAmount)}</p>
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <PageHeader title="Sales" onAction={() => setModalOpen(true)} />

      <DataTable
        columns={[
          { header: "Invoice #", accessor: "invoiceNumber" },
          { header: "Customer", accessor: "customer", cell: (row) => row.customer?.name || "N/A" },
          { header: "Total", accessor: "grandTotal", cell: (row) => formatCurrency(row.grandTotal) },
          { header: "Paid", accessor: "paidAmount", cell: (row) => formatCurrency(row.paidAmount) },
          { header: "Due", accessor: "dueAmount", cell: (row) => formatCurrency(row.dueAmount) },
          { header: "Method", accessor: "paymentMethod" },
          {
            header: "Status",
            accessor: "status",
            cell: (row) => {
              if (row.dueAmount === 0) return <Badge variant="success">Paid</Badge>;
              return <Badge variant="warning">Due</Badge>;
            },
          },
          { header: "Date", accessor: "saleDate", cell: (row) => formatDate(row.saleDate) },
          {
            header: "Actions",
            accessor: "_id",
            sortable: false,
            cell: (row) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDetailModal(row); }}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); printInvoice(row); }}>
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]}
        data={salesData?.data || []}
        loading={isLoading}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Sale" size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Customer" required>
              <Select name="customer" options={customerOptions} placeholder="Select customer" />
            </FormField>
            <FormField label="Payment Method">
              <Select name="paymentMethod" options={paymentMethods} />
            </FormField>
            <FormField label="Discount">
              <Input name="discount" type="number" step="0.01" defaultValue="0" />
            </FormField>
            <FormField label="Tax Rate (%)">
              <Input name="taxRate" type="number" step="0.1" defaultValue="0" />
            </FormField>
            <FormField label="Delivery Charge">
              <Input name="deliveryCharge" type="number" step="0.01" defaultValue="0" />
            </FormField>
            <FormField label="Paid Amount">
              <Input name="paidAmount" type="number" step="0.01" defaultValue="0" />
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
                      onChange={(e) => updateItem(i, "product", e.target.value)}
                      options={productOptions}
                      placeholder="Select product"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                    />
                  </div>
                  <div className="w-32 pt-2 text-sm font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
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
            <Input name="notes" placeholder="Notes" />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>Create Sale</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Sale Details" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice #</p>
                <p className="font-medium">{detailModal.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{detailModal.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(detailModal.saleDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment</p>
                <p className="font-medium">{detailModal.paymentMethod}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModal.items?.map((item, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{item.product?.productName || "N/A"}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-2">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t pt-4">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(detailModal.subtotal)}</span></div>
              {detailModal.discount > 0 && <div className="flex justify-between text-sm"><span>Discount</span><span>-{formatCurrency(detailModal.discount)}</span></div>}
              {detailModal.taxAmount > 0 && <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(detailModal.taxAmount)}</span></div>}
              {detailModal.deliveryCharge > 0 && <div className="flex justify-between text-sm"><span>Delivery</span><span>{formatCurrency(detailModal.deliveryCharge)}</span></div>}
              <div className="flex justify-between font-bold text-lg"><span>Grand Total</span><span>{formatCurrency(detailModal.grandTotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Paid</span><span>{formatCurrency(detailModal.paidAmount)}</span></div>
              <div className="flex justify-between text-sm"><span>Due</span><span className="text-destructive">{formatCurrency(detailModal.dueAmount)}</span></div>
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
    </div>
  );
}

export default Sales;
