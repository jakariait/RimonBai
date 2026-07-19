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
import { Plus, Trash2, Eye, Pencil, FileText, Activity } from 'lucide-react';
import logoSrc from '../../assets/sr-medical.png';
import { toast } from 'sonner';

const paymentMethods = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Card', label: 'Card' },
  { value: 'Mobile Banking', label: 'Mobile Banking' },
];

function Sales() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [detailModal, setDetailModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [items, setItems] = useState([{ product: '', quantity: 1, unitPrice: 0 }]);

  const { data: salesData, isLoading } = useFetch('/sales', { page: 1, limit: 100 });
  const { data: customersData } = useFetch('/customers', { page: 1, limit: 200 });
  const { data: productsData } = useFetch('/products', { page: 1, limit: 500 });
  const { data: businessData } = useFetch('/settings/business');
  const createMutation = useCreate('/sales', { invalidate: '/sales' });
  const updateMutation = useUpdate('/sales', { invalidate: '/sales' });
  const deleteMutation = useDelete('/sales', { invalidate: '/sales' });

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  const customerOptions = customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone})` }));

  const extraProducts = useMemo(() => {
    if (!editingSale?.items) return [];
    return editingSale.items
      .filter((i) => i.product && typeof i.product === 'object')
      .filter((i) => !products.find((p) => p._id === i.product._id))
      .map((i) => ({
        _id: i.product._id,
        productName: i.product.productName || 'Unknown',
        sku: i.product.sku || '',
        sellingPrice: i.unitPrice || 0,
      }));
  }, [editingSale, products]);

  const allProducts = [...products, ...extraProducts];
  const productOptions = allProducts.map((p) => ({
    value: p._id,
    label: `${p.productName} (${p.sku}) - ${formatCurrency(p.sellingPrice)}`,
  }));

  const addItem = () => setItems([...items, { product: '', quantity: 1, unitPrice: 0 }]);
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
        newItems[index].unitPrice = product.sellingPrice;
      }
    }

    setItems(newItems);
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const openCreateModal = () => {
    setEditingSale(null);
    setItems([{ product: '', quantity: 1, unitPrice: 0 }]);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    setEditingSale(row);
    setItems(
      row.items?.map((i) => ({
        product: String(
          i.product && typeof i.product === 'object' ? i.product._id || '' : i.product || ''
        ),
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })) || [{ product: '', quantity: 1, unitPrice: 0 }]
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSale(null);
    setItems([{ product: '', quantity: 1, unitPrice: 0 }]);
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

    if (!data.customer) return toast.error('Please select a customer');
    if (items.some((i) => !i.product)) return toast.error('Please select products');

    try {
      if (editingSale) {
        await updateMutation.mutateAsync({ id: editingSale._id, body: data });
      } else {
        await createMutation.mutateAsync(data);
      }
      closeModal();
    } catch {}
  };

  const printInvoice = (sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const biz = businessData?.data || {};

    const itemsHtml = sale.items
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${item.product?.productName || 'N/A'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.unitPrice)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.totalPrice)}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Invoice ${sale.invoiceNumber}</title>
        <style>
          @page { margin: 10mm 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.3; }
          .invoice-container { max-width: 210mm; margin: 0 auto; padding: 0; }

          .top-bar {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            height: 4px;
            border-radius: 4px 4px 0 0;
            margin-bottom: 14px;
          }

          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          .header-left { display: flex; align-items: center; gap: 10px; }
          .logo-icon {
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 18px; font-weight: bold;
          }
          .company-name { font-size: 16px; font-weight: 700; color: #0f172a; }
          .company-tagline { font-size: 9px; color: #64748b; margin-top: 1px; }
          .header-right { text-align: right; }
          .header-right p { font-size: 10px; color: #475569; margin: 1px 0; }

          .title-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 14px;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .invoice-title span { color: #0ea5e9; }
          .invoice-meta { text-align: right; }
          .invoice-meta .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .invoice-meta .value { font-size: 12px; font-weight: 700; color: #0f172a; }

          .parties {
            display: flex;
            justify-content: space-between;
            margin-bottom: 14px;
            padding: 12px 16px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .party h4 { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .party p { font-size: 11px; color: #1e293b; margin: 1px 0; }
          .party .name { font-weight: 700; font-size: 12px; }

          table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          table.items thead th {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            padding: 7px 10px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
          }
          table.items tbody td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
          table.items thead th:first-child { border-radius: 6px 0 0 6px; }
          table.items thead th:last-child { border-radius: 0 6px 6px 0; }

          .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 12px;
          }
          .totals-table { width: 280px; }
          .totals-table tr td { padding: 3px 10px; font-size: 11px; }
          .totals-table tr td:first-child { color: #64748b; }
          .totals-table tr td:last-child { text-align: right; font-weight: 600; }
          .totals-table .grand-total td {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            border-top: 1px solid #0ea5e9;
            padding-top: 6px;
          }
          .totals-table .due td { color: #dc2626; }

          .amount-in-words {
            padding: 8px 14px;
            background: #f0f9ff;
            border-left: 3px solid #0ea5e9;
            border-radius: 0 6px 6px 0;
            margin-bottom: 12px;
            font-size: 10px;
            color: #475569;
          }
          .amount-in-words strong { color: #0f172a; }

          .payment-info {
            display: flex;
            gap: 16px;
            padding: 10px 14px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            margin-bottom: 12px;
          }
          .payment-info div { flex: 1; }
          .payment-info .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .payment-info .value { font-size: 11px; font-weight: 600; color: #1e293b; }

          .footer {
            text-align: center;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .footer .thank-you {
            font-size: 12px;
            font-weight: 700;
            color: #0ea5e9;
            margin-bottom: 4px;
          }
          .footer .contact-info { font-size: 9px; color: #94a3b8; margin: 1px 0; }
          .footer-divider {
            margin: 8px auto 0;
            width: 60px;
            height: 2px;
            background: linear-gradient(90deg, #0ea5e9, #38bdf8);
            border-radius: 2px;
          }

          .badge-paid { color: #059669; font-weight: 700; }
          .badge-due { color: #dc2626; font-weight: 700; }
          .badge-partial { color: #d97706; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="top-bar"></div>

          <div class="invoice-header">
            <div class="header-left">
              <img src="${logoSrc}" alt="Logo" style="height:48px;width:auto;border-radius:8px" />
              <div>
                <div class="company-name">${biz.businessName || 'Rimon Medical Equipment'}</div>
                <div class="company-tagline">Innovative & Reliable Laboratory Diagnostic System Solution</div>
              </div>
            </div>
            <div class="header-right">
              ${biz.address ? `<p>${biz.address}</p>` : ''}
              ${
                (biz.phones || []).filter(Boolean).length > 0
                  ? `<p>${biz.phones.filter(Boolean).join('  |  ')}</p>`
                  : biz.phone
                    ? `<p>${biz.phone}</p>`
                    : ''
              }
              ${
                (biz.emails || []).filter(Boolean).length > 0
                  ? `<p>${biz.emails.filter(Boolean).join('  |  ')}</p>`
                  : biz.email
                    ? `<p>${biz.email}</p>`
                    : ''
              }
              ${biz.taxId ? `<p>Tax ID: ${biz.taxId}</p>` : ''}
            </div>
          </div>

          <div class="title-section">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-meta">
              <div class="label">Invoice No</div>
              <div class="value">${sale.invoiceNumber}</div>
              <div class="label" style="margin-top:6px">Date</div>
              <div class="value">${formatDate(sale.saleDate)}</div>
            </div>
          </div>

          <div class="parties">
            <div class="party">
              <h4>Bill To</h4>
              <p class="name">${sale.customer?.name || 'N/A'}</p>
              ${sale.customer?.phone ? `<p>${sale.customer.phone}</p>` : ''}
              ${sale.customer?.email ? `<p>${sale.customer.email}</p>` : ''}
              ${sale.customer?.address ? `<p>${sale.customer.address}</p>` : ''}
            </div>
            <div class="party" style="text-align:right">
              <h4>Payment Method</h4>
              <p class="name">${sale.paymentMethod || 'N/A'}</p>
              ${sale.status ? `<p style="margin-top:4px">Status: <span class="${sale.dueAmount === 0 ? 'badge-paid' : sale.paidAmount > 0 ? 'badge-partial' : 'badge-due'}">${sale.dueAmount === 0 ? 'Paid' : sale.paidAmount > 0 ? 'Partial' : 'Due'}</span></p>` : ''}
            </div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width:45%">Product</th>
                <th style="width:15%;text-align:center">Qty</th>
                <th style="width:20%;text-align:right">Price</th>
                <th style="width:20%;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals-section">
            <table class="totals-table">
              <tr><td>Subtotal</td><td>${formatCurrency(sale.subtotal)}</td></tr>
              ${sale.discount > 0 ? `<tr><td>Discount</td><td>-${formatCurrency(sale.discount)}</td></tr>` : ''}
              ${sale.taxAmount > 0 ? `<tr><td>Tax (${sale.taxRate}%)</td><td>${formatCurrency(sale.taxAmount)}</td></tr>` : ''}
              ${sale.deliveryCharge > 0 ? `<tr><td>Delivery Charge</td><td>${formatCurrency(sale.deliveryCharge)}</td></tr>` : ''}
              <tr class="grand-total"><td>Grand Total</td><td>${formatCurrency(sale.grandTotal)}</td></tr>
              <tr><td>Paid</td><td>${formatCurrency(sale.paidAmount)}</td></tr>
              <tr class="due"><td>Due</td><td>${formatCurrency(sale.dueAmount)}</td></tr>
            </table>
          </div>

          <div class="amount-in-words">
            <strong>Amount in words:</strong> ${numberToWords(sale.grandTotal)} ${biz.currency || 'Taka'} only
          </div>

          ${
            sale.notes
              ? `
          <div style="padding:12px 16px;background:#fef9c3;border-radius:8px;margin-bottom:12px;font-size:10px;color:#92400e;border:1px solid #fde68a">
            <strong>Notes:</strong> ${sale.notes}
          </div>`
              : ''
          }

          <div class="payment-info">
            <div>
              <div class="label">Payment Status</div>
              <div class="value" style="margin-top:4px">
                <span class="${sale.dueAmount === 0 ? 'badge-paid' : sale.paidAmount > 0 ? 'badge-partial' : 'badge-due'}">
                  ${sale.dueAmount === 0 ? 'Paid in Full' : sale.paidAmount > 0 ? 'Partially Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
            <div>
              <div class="label">Payment Method</div>
              <div class="value" style="margin-top:4px">${sale.paymentMethod || 'Cash'}</div>
            </div>
            <div>
              <div class="label">Invoice Date</div>
              <div class="value" style="margin-top:4px">${formatDate(sale.saleDate)}</div>
            </div>
          </div>

          <div class="footer">
            <div class="thank-you">Thank you for your trust!</div>
            <p class="contact-info">${biz.businessName || 'Rimon Medical Equipment'}</p>
            ${biz.website ? `<p class="contact-info">${biz.website}</p>` : ''}
            <div class="footer-divider"></div>
          </div>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = [
      '',
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
      'Nine',
      'Ten',
      'Eleven',
      'Twelve',
      'Thirteen',
      'Fourteen',
      'Fifteen',
      'Sixteen',
      'Seventeen',
      'Eighteen',
      'Nineteen',
    ];
    const b = [
      '',
      '',
      'Twenty',
      'Thirty',
      'Forty',
      'Fifty',
      'Sixty',
      'Seventy',
      'Eighty',
      'Ninety',
    ];
    const fn = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + fn(n % 100) : '');
      if (n < 100000)
        return fn(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + fn(n % 1000) : '');
      if (n < 10000000)
        return fn(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + fn(n % 100000) : '');
      return fn(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + fn(n % 10000000) : '');
    };
    const whole = Math.floor(num);
    const decimal = Math.round((num - whole) * 100);
    let result = fn(whole);
    if (decimal > 0) result += ' and ' + fn(decimal) + ' Paise';
    return result;
  };

  const formKey = editingSale?._id || 'new';

  return (
    <div>
      <PageHeader title="Sales" onAction={openCreateModal} />

      <DataTable
        columns={[
          { header: 'Invoice #', accessor: 'invoiceNumber' },
          { header: 'Customer', accessor: 'customer', cell: (row) => row.customer?.name || 'N/A' },
          {
            header: 'Total',
            accessor: 'grandTotal',
            cell: (row) => formatCurrency(row.grandTotal),
          },
          { header: 'Paid', accessor: 'paidAmount', cell: (row) => formatCurrency(row.paidAmount) },
          { header: 'Due', accessor: 'dueAmount', cell: (row) => formatCurrency(row.dueAmount) },
          { header: 'Method', accessor: 'paymentMethod' },
          {
            header: 'Status',
            accessor: 'status',
            cell: (row) => {
              if (row.dueAmount === 0) return <Badge variant="success">Paid</Badge>;
              if (row.dueAmount > 0 && row.paidAmount > 0)
                return <Badge variant="warning">Partial</Badge>;
              return <Badge variant="destructive">Due</Badge>;
            },
          },
          { header: 'Date', accessor: 'saleDate', cell: (row) => formatDate(row.saleDate) },
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
                    printInvoice(row);
                  }}
                >
                  <FileText className="h-4 w-4" />
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
        data={salesData?.data || []}
        loading={isLoading}
      />

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingSale ? 'Edit Sale' : 'New Sale'}
        size="xl"
      >
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Customer" required>
              <Select
                name="customer"
                options={customerOptions}
                placeholder="Select customer"
                defaultValue={editingSale?.customer?._id || ''}
              />
            </FormField>
            <FormField label="Payment Method">
              <Select
                name="paymentMethod"
                options={paymentMethods}
                defaultValue={editingSale?.paymentMethod || 'Cash'}
              />
            </FormField>
            <FormField label="Discount">
              <Input
                name="discount"
                type="number"
                step="0.01"
                defaultValue={editingSale?.discount ?? '0'}
              />
            </FormField>
            <FormField label="Tax Rate (%)">
              <Input
                name="taxRate"
                type="number"
                step="0.1"
                defaultValue={editingSale?.taxRate ?? '0'}
              />
            </FormField>
            <FormField label="Delivery Charge">
              <Input
                name="deliveryCharge"
                type="number"
                step="0.01"
                defaultValue={editingSale?.deliveryCharge ?? '0'}
              />
            </FormField>
            <FormField label="Paid Amount">
              <Input
                name="paidAmount"
                type="number"
                step="0.01"
                defaultValue={editingSale?.paidAmount ?? '0'}
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
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
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
            <Input name="notes" placeholder="Notes" defaultValue={editingSale?.notes || ''} />
          </FormField>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
              {editingSale ? 'Update Sale' : 'Create Sale'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Sale Details"
        size="lg"
      >
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
                      <td className="py-2">{item.product?.productName || 'N/A'}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-2">{formatCurrency(item.totalPrice)}</td>
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
              {detailModal.deliveryCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery</span>
                  <span>{formatCurrency(detailModal.deliveryCharge)}</span>
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
          <p>Are you sure you want to delete this sale? This action cannot be undone.</p>
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

export default Sales;
