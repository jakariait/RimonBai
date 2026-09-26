import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFetch, useCreate, useUpdate, useDelete } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { FormField } from '../../components/ui/FormField';
import { Card, CardContent } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { paymentSchema } from '../../lib/validations';
import logoSrc from '../../assets/sr-medical.png';
import { Eye, Trash2, Printer } from 'lucide-react';

const paymentMethods = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Cheque', label: 'Cheque' },
  { value: 'Card', label: 'Card' },
  { value: 'Mobile Banking', label: 'Mobile Banking' },
  { value: 'On Condition', label: 'On Condition' },
];

function Payments() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  const { data, isLoading } = useFetch('/customer-payments', { page: 1, limit: 100 });
  const { data: customersData } = useFetch('/customers', { page: 1, limit: 500 });
  const { data: businessData } = useFetch('/settings/business');
  const createMutation = useCreate('/customer-payments', {
    invalidate: ['/customer-payments', '/analytics/dashboard', '/customers'],
  });
  const deleteMutation = useDelete('/customer-payments', {
    invalidate: ['/customer-payments', '/analytics/dashboard', '/customers'],
  });

  const customers = customersData?.data || [];
  const customerOptions = customers.map((c) => ({ value: c._id, label: `${c.name} (${c.phone})` }));

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(paymentSchema) });

  const watchedCustomer = watch('customer');
  const watchedAmount = watch('amount');

  const { data: dueData } = useFetch(
    `/customers/${watchedCustomer}/due`,
    {},
    { enabled: !!watchedCustomer }
  );

  const dueSummary = dueData?.data || null;
  const previousDue = dueSummary?.outstandingDue || 0;
  const amountReceived = parseFloat(watchedAmount) || 0;
  const netDueAfter = dueSummary ? dueSummary.netDue - amountReceived : 0;
  const newDue = Math.max(0, netDueAfter);
  const newAdvance = netDueAfter < 0 ? Math.abs(netDueAfter) : 0;

  const openCreate = () => {
    reset({
      customer: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      transactionId: '',
      reference: '',
      note: '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    const result = await createMutation.mutateAsync({ ...data, amount: parseFloat(data.amount) });
    setModalOpen(false);
    setPaymentSuccess(result?.data || null);
  };

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const printReceipt = (payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const biz = businessData?.data || {};
    const previousDue = payment.previousDue ?? 0;
    const newDue = payment.newDue ?? 0;

    printWindow.document.write(`
      <html>
      <head>
        <title>Payment Receipt ${payment.paymentNumber}</title>
        <style>
          @page { margin: 8mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 11px; line-height: 1.4; }
          .receipt-container { max-width: 210mm; margin: 0 auto; padding: 0; }
          .top-bar { background: linear-gradient(135deg, #059669, #10b981); height: 4px; border-radius: 4px 4px 0 0; margin-bottom: 14px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
          .header-left { display: flex; align-items: center; gap: 10px; }
          .company-name { font-size: 16px; font-weight: 700; color: #0f172a; }
          .company-tagline { font-size: 9px; color: #64748b; margin-top: 1px; }
          .header-right { text-align: right; font-size: 10px; color: #475569; }
          .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
          .receipt-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; }
          .receipt-title span { color: #059669; }
          .receipt-meta { text-align: right; }
          .receipt-meta .label { font-size: 9px; color: #64748b; text-transform: uppercase; }
          .receipt-meta .value { font-size: 12px; font-weight: 700; color: #0f172a; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 14px; padding: 12px 16px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; }
          .party h4 { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .party p { font-size: 11px; color: #1e293b; margin: 1px 0; }
          .party .name { font-weight: 700; font-size: 12px; }
          .amount-section { text-align: center; padding: 20px; margin-bottom: 14px; background: #f0fdf4; border-radius: 12px; border: 2px dashed #059669; }
          .amount-section .label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .amount-section .amount { font-size: 32px; font-weight: 800; color: #059669; margin: 8px 0; }
          .amount-section .method { font-size: 11px; color: #475569; }
          .due-section { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px; }
          .due-box { padding: 10px 8px; text-align: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
          .due-box .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .due-box .value { font-size: 15px; font-weight: 700; color: #0f172a; margin-top: 4px; }
          .due-box.due-red .value { color: #dc2626; }
          .due-box.due-green .value { color: #059669; }
          .details { margin-bottom: 14px; }
          .details table { width: 100%; }
          .details td { padding: 4px 10px; font-size: 11px; }
          .details td:first-child { color: #64748b; width: 40%; }
          .details td:last-child { font-weight: 600; color: #1e293b; }
          .signature { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 14px; border-top: 1px solid #e5e7eb; }
          .signature div { text-align: center; }
          .signature .line { width: 160px; height: 1px; background: #94a3b8; margin: 30px auto 4px; }
          .signature .label { font-size: 9px; color: #94a3b8; }
          .footer { text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb; margin-top: 14px; }
          .footer .thank-you { font-size: 12px; font-weight: 700; color: #059669; margin-bottom: 4px; }
          .footer .contact-info { font-size: 9px; color: #94a3b8; margin: 1px 0; }
          .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); font-size: 80px; font-weight: 900; color: rgba(5, 150, 105, 0.04); pointer-events: none; z-index: -1; text-transform: uppercase; letter-spacing: 10px; }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="watermark">PAID</div>
          <div class="top-bar"></div>
          <div class="header">
            <div class="header-left">
              <img src="${logoSrc}" alt="Logo" style="height:48px;width:auto;border-radius:8px" />
              <div>
                <div class="company-name">${biz.businessName || 'Rimon Medical Equipment'}</div>
                <div class="company-tagline">Innovative & Reliable Laboratory Diagnostic System Solution</div>
              </div>
            </div>
            <div class="header-right">
              ${biz.address ? `<p>${biz.address}</p>` : ''}
              ${biz.phone ? `<p>${biz.phone}</p>` : ''}
              ${biz.email ? `<p>${biz.email}</p>` : ''}
            </div>
          </div>
          <div class="title-section">
            <div class="receipt-title"><span>PAYMENT</span> RECEIPT</div>
            <div class="receipt-meta">
              <div class="label">Receipt No</div>
              <div class="value">${payment.paymentNumber}</div>
              <div class="label" style="margin-top:6px">Date</div>
              <div class="value">${formatDate(payment.paymentDate)}</div>
            </div>
          </div>
          <div class="parties">
            <div class="party">
              <h4>Received From</h4>
              <p class="name">${payment.customer?.name || 'N/A'}</p>
              ${payment.customer?.phone ? `<p>${payment.customer.phone}</p>` : ''}
              ${payment.customer?.email ? `<p>${payment.customer.email}</p>` : ''}
              ${payment.customer?.address ? `<p>${payment.customer.address}</p>` : ''}
            </div>
            <div class="party" style="text-align:right">
              <h4>Payment Method</h4>
              <p class="name">${payment.paymentMethod || 'N/A'}</p>
              ${payment.transactionId ? `<p>TX: ${payment.transactionId}</p>` : ''}
              ${payment.reference ? `<p>Ref: ${payment.reference}</p>` : ''}
            </div>
          </div>
          <div class="amount-section">
            <div class="label">Amount Received</div>
            <div class="amount">${formatCurrency(payment.amount)}</div>
            <div class="method">via ${payment.paymentMethod}</div>
          </div>
          <div class="due-section">
            <div class="due-box ${previousDue > 0 ? 'due-red' : 'due-green'}">
              <div class="label">Previous Due</div>
              <div class="value">${formatCurrency(previousDue)}</div>
            </div>
            <div class="due-box ${newDue > 0 ? 'due-red' : 'due-green'}">
              <div class="label">New Due</div>
              <div class="value">${formatCurrency(newDue)}</div>
            </div>
          </div>
          <div class="details">
            <table>
              ${payment.note ? `<tr><td>Notes</td><td>${payment.note}</td></tr>` : ''}
              <tr>
                <td>Received By</td>
                <td>${payment.receivedBy?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td>Transaction ID</td>
                <td>${payment.transactionId || 'N/A'}</td>
              </tr>
            </table>
          </div>
          <div class="signature">
            <div>
              <div class="line"></div>
              <div class="label">Authorized Signature</div>
            </div>
            <div>
              <div class="line"></div>
              <div class="label">Receiver&apos;s Signature</div>
            </div>
          </div>
          <div class="footer">
            <div class="thank-you">Thank you for your payment!</div>
            <p class="contact-info">${biz.businessName || 'Rimon Medical Equipment'}</p>
            ${biz.website ? `<p class="contact-info">${biz.website}</p>` : ''}
          </div>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const payments = data?.data || [];

  return (
    <div>
      <PageHeader title="Payments" onAction={openCreate} actionLabel="New Payment" />

      <DataTable
        columns={[
          { header: 'Receipt #', accessor: 'paymentNumber' },
          { header: 'Customer', accessor: 'customer', cell: (row) => row.customer?.name || 'N/A' },
          {
            header: 'Amount',
            accessor: 'amount',
            cell: (row) => formatCurrency(row.amount),
          },
          { header: 'Method', accessor: 'paymentMethod' },
          { header: 'Reference', accessor: 'reference' },
          { header: 'Date', accessor: 'paymentDate', cell: (row) => formatDate(row.paymentDate) },
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
                    printReceipt(row);
                  }}
                >
                  <Printer className="h-4 w-4" />
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
        data={payments}
        loading={isLoading}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Payment" size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Customer" name="customer" error={errors.customer?.message} required>
              <Select
                {...register('customer')}
                options={customerOptions}
                placeholder="Select customer"
              />
            </FormField>
            <FormField label="Amount" name="amount" error={errors.amount?.message} required>
              <Input {...register('amount')} type="number" step="0.01" placeholder="0.00" />
            </FormField>
            <FormField label="Date" name="paymentDate" error={errors.paymentDate?.message}>
              <Input {...register('paymentDate')} type="date" />
            </FormField>
            <FormField label="Payment Method" name="paymentMethod">
              <Select {...register('paymentMethod')} options={paymentMethods} />
            </FormField>
            <FormField label="Transaction ID" name="transactionId">
              <Input {...register('transactionId')} placeholder="Transaction ID" />
            </FormField>
            <FormField label="Reference" name="reference">
              <Input {...register('reference')} placeholder="Reference" />
            </FormField>
          </div>
          {watchedCustomer && dueSummary && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2">Due Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Previous Due</p>
                    <p className="font-semibold text-destructive">{formatCurrency(previousDue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Amount Received</p>
                    <p className="font-semibold text-green-600">{formatCurrency(amountReceived)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">New Due</p>
                    <p
                      className={`font-semibold ${newDue > 0 ? 'text-destructive' : 'text-green-600'}`}
                    >
                      {formatCurrency(newDue)}
                    </p>
                  </div>
                </div>
                {newAdvance > 0 && (
                  <p className="mt-2 text-xs text-green-600">
                    Advance Balance after payment: {formatCurrency(newAdvance)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          <FormField label="Note" name="note">
            <Input {...register('note')} placeholder="Notes" />
          </FormField>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Payment
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!paymentSuccess}
        onClose={() => setPaymentSuccess(null)}
        title="Payment Received"
        size="sm"
      >
        {paymentSuccess && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">Amount Received</p>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(paymentSuccess.amount)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Receipt # {paymentSuccess.paymentNumber}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Previous Due</p>
                <p className="font-semibold text-destructive">
                  {formatCurrency(paymentSuccess.previousDue ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Due</p>
                <p
                  className={`font-semibold ${(paymentSuccess.newDue || 0) > 0 ? 'text-destructive' : 'text-green-600'}`}
                >
                  {formatCurrency(paymentSuccess.newDue ?? 0)}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setPaymentSuccess(null)}>
                Close
              </Button>
              <Button type="button" onClick={() => printReceipt(paymentSuccess)}>
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Payment Details"
        size="md"
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt #</p>
                <p className="font-medium">{detailModal.paymentNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{detailModal.customer?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{formatDate(detailModal.paymentDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="font-medium text-lg text-green-600">
                  {formatCurrency(detailModal.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Previous Due</p>
                <p className="font-medium text-destructive">
                  {detailModal.previousDue != null
                    ? formatCurrency(detailModal.previousDue)
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Due</p>
                <p
                  className={`font-medium ${
                    (detailModal.newDue || 0) > 0 ? 'text-destructive' : 'text-green-600'
                  }`}
                >
                  {detailModal.newDue != null ? formatCurrency(detailModal.newDue) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium">{detailModal.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transaction ID</p>
                <p className="font-medium">{detailModal.transactionId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference</p>
                <p className="font-medium">{detailModal.reference || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Received By</p>
                <p className="font-medium">{detailModal.receivedBy?.name || 'N/A'}</p>
              </div>
            </div>
            {detailModal.note && (
              <div>
                <p className="text-sm text-muted-foreground">Note</p>
                <p>{detailModal.note}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button type="button" onClick={() => printReceipt(detailModal)}>
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Delete Payment"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this payment? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              isLoading={deleteMutation.isPending}
              onClick={() => handleDelete(deleteConfirm._id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Payments;
