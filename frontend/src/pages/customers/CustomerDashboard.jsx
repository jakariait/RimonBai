import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/Table';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../lib/utils';
import logoSrc from '../../assets/sr-medical.png';
import {
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Activity,
  Wallet,
  Calendar,
  ShoppingBag,
  ArrowLeft,
  Printer,
} from 'lucide-react';

function CustomerDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data, isLoading } = useFetch(`/customers/${id}/dashboard`);
  const { data: ledgerData } = useFetch(`/customers/${id}/ledger`, { limit: 100 });
  const { data: businessData } = useFetch('/settings/business');

  const dashboard = data?.data;
  const ledger = ledgerData?.data;
  const customer = dashboard?.customer;
  const summary = dashboard?.summary;

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="outline" onClick={() => navigate('/customers')} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Customers
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'ledger', label: 'Ledger' },
  ];

  const renderStatusBadge = (status) => {
    if (status === 'paid') return <Badge variant="success">Paid</Badge>;
    if (status === 'partial') return <Badge variant="warning">Partial</Badge>;
    return <Badge variant="destructive">Due</Badge>;
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

  const printInvoice = (sale) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const biz = businessData?.data || {};

    const itemsHtml = (sale.items || [])
      .map(
        (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${item.product?.productName || item.productName || 'N/A'}</td>
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
          .top-bar { background: linear-gradient(135deg, #0ea5e9, #0284c7); height: 4px; border-radius: 4px 4px 0 0; margin-bottom: 14px; }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
          .header-left { display: flex; align-items: center; gap: 10px; }
          .company-name { font-size: 16px; font-weight: 700; color: #0f172a; }
          .company-tagline { font-size: 9px; color: #64748b; margin-top: 1px; }
          .header-right { text-align: right; }
          .header-right p { font-size: 10px; color: #475569; margin: 1px 0; }
          .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 14px; }
          .invoice-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; }
          .invoice-title span { color: #0ea5e9; }
          .invoice-meta { text-align: right; }
          .invoice-meta .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .invoice-meta .value { font-size: 12px; font-weight: 700; color: #0f172a; }
          .parties { display: flex; justify-content: space-between; margin-bottom: 14px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .party h4 { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .party p { font-size: 11px; color: #1e293b; margin: 1px 0; }
          .party .name { font-weight: 700; font-size: 12px; }
          table.items { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          table.items thead th { background: linear-gradient(135deg, #0ea5e9, #0284c7); color: white; padding: 7px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
          table.items tbody td { padding: 5px 10px; font-size: 11px; border-bottom: 1px solid #f1f5f9; }
          table.items thead th:first-child { border-radius: 6px 0 0 6px; }
          table.items thead th:last-child { border-radius: 0 6px 6px 0; }
          .totals-section { display: flex; justify-content: flex-end; margin-bottom: 12px; }
          .totals-table { width: 280px; }
          .totals-table tr td { padding: 3px 10px; font-size: 11px; }
          .totals-table tr td:first-child { color: #64748b; }
          .totals-table tr td:last-child { text-align: right; font-weight: 600; }
          .totals-table .grand-total td { font-size: 14px; font-weight: 800; color: #0f172a; border-top: 1px solid #0ea5e9; padding-top: 6px; }
          .totals-table .due td { color: #dc2626; }
          .amount-in-words { padding: 8px 14px; background: #f0f9ff; border-left: 3px solid #0ea5e9; border-radius: 0 6px 6px 0; margin-bottom: 12px; font-size: 10px; color: #475569; }
          .amount-in-words strong { color: #0f172a; }
          .payment-info { display: flex; gap: 16px; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 12px; }
          .payment-info div { flex: 1; }
          .payment-info .label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .payment-info .value { font-size: 11px; font-weight: 600; color: #1e293b; }
          .due-summary { padding: 10px 14px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin-bottom: 12px; font-size: 10px; }
          .due-summary .label { color: #991b1b; font-weight: 600; }
          .due-summary .value { color: #dc2626; font-weight: 700; font-size: 12px; }
          .footer { text-align: center; padding-top: 12px; border-top: 1px solid #e5e7eb; }
          .footer .thank-you { font-size: 12px; font-weight: 700; color: #0ea5e9; margin-bottom: 4px; }
          .footer .contact-info { font-size: 9px; color: #94a3b8; margin: 1px 0; }
          .footer-divider { margin: 8px auto 0; width: 60px; height: 2px; background: linear-gradient(90deg, #0ea5e9, #38bdf8); border-radius: 2px; }
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
              ${(biz.phones || []).filter(Boolean).length > 0 ? `<p>${biz.phones.filter(Boolean).join('  |  ')}</p>` : biz.phone ? `<p>${biz.phone}</p>` : ''}
              ${(biz.emails || []).filter(Boolean).length > 0 ? `<p>${biz.emails.filter(Boolean).join('  |  ')}</p>` : biz.email ? `<p>${biz.email}</p>` : ''}
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
              <p class="name">${sale.customer?.name || customer?.name || 'N/A'}</p>
              ${sale.customer?.phone || customer?.phone ? `<p>${sale.customer?.phone || customer?.phone}</p>` : ''}
            </div>
            <div class="party" style="text-align:right">
              <h4>Payment Method</h4>
              <p class="name">${sale.paymentMethod || 'N/A'}</p>
            </div>
          </div>
          ${sale.previousDue > 0 ? `<div class="due-summary"><span class="label">⚠ Previous Outstanding Due: </span><span class="value">${formatCurrency(sale.previousDue)}</span></div>` : ''}
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
              <tr><td>Previous Due</td><td>${formatCurrency(sale.previousDue || 0)}</td></tr>
              <tr><td>Current Purchase</td><td>${formatCurrency(sale.grandTotal)}</td></tr>
              ${sale.advanceUsed > 0 ? `<tr><td>Advance Used</td><td>-${formatCurrency(sale.advanceUsed)}</td></tr>` : ''}
              <tr><td>Subtotal</td><td>${formatCurrency(sale.subtotal)}</td></tr>
              ${sale.discount > 0 ? `<tr><td>Discount</td><td>-${formatCurrency(sale.discount)}</td></tr>` : ''}
              ${sale.taxAmount > 0 ? `<tr><td>Tax (${sale.taxRate}%)</td><td>${formatCurrency(sale.taxAmount)}</td></tr>` : ''}
              ${sale.deliveryCharge > 0 ? `<tr><td>Delivery Charge</td><td>${formatCurrency(sale.deliveryCharge)}</td></tr>` : ''}
              <tr class="grand-total"><td>Grand Total</td><td>${formatCurrency(sale.grandTotal)}</td></tr>
              <tr><td>Payment Received</td><td>${formatCurrency(sale.paymentReceivedAtInvoice || sale.paidAmount)}</td></tr>
              <tr class="due"><td>Remaining Due</td><td>${formatCurrency(sale.remainingDueAfterInvoice || sale.dueAmount)}</td></tr>
            </table>
          </div>
          <div class="amount-in-words">
            <strong>Amount in words:</strong> ${numberToWords(sale.grandTotal)} ${biz.currency || 'Taka'} only
          </div>
          ${sale.notes ? `<div style="padding:12px 16px;background:#fef9c3;border-radius:8px;margin-bottom:12px;font-size:10px;color:#92400e;border:1px solid #fde68a"><strong>Notes:</strong> ${sale.notes}</div>` : ''}
          <div class="payment-info">
            <div>
              <div class="label">Payment Status</div>
              <div class="value" style="margin-top:4px">
                <span class="${(sale.remainingDueAfterInvoice || sale.dueAmount) === 0 ? 'badge-paid' : (sale.paymentReceivedAtInvoice || sale.paidAmount) > 0 ? 'badge-partial' : 'badge-due'}">
                  ${(sale.remainingDueAfterInvoice || sale.dueAmount) === 0 ? 'Paid in Full' : (sale.paymentReceivedAtInvoice || sale.paidAmount) > 0 ? 'Partially Paid' : 'Unpaid'}
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

  const printPaymentReceipt = (payment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const biz = businessData?.data || {};

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
              <p class="name">${payment.customer?.name || customer?.name || 'N/A'}</p>
              ${payment.customer?.phone || customer?.phone ? `<p>${payment.customer?.phone || customer?.phone}</p>` : ''}
            </div>
            <div class="party" style="text-align:right">
              <h4>Payment Method</h4>
              <p class="name">${payment.paymentMethod || 'N/A'}</p>
              ${payment.transactionId ? `<p>TX: ${payment.transactionId}</p>` : ''}
            </div>
          </div>
          <div class="amount-section">
            <div class="label">Amount Received</div>
            <div class="amount">${formatCurrency(payment.amount)}</div>
            <div class="method">via ${payment.paymentMethod}</div>
          </div>
          <div class="details">
            <table>
              ${payment.note ? `<tr><td>Notes</td><td>${payment.note}</td></tr>` : ''}
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

  return (
    <div className="space-y-6">
      <PageHeader title={customer.name} action={false} />

      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Customer Info
              </p>
              <p className="text-sm">
                {customer.company ? `${customer.company} - ` : ''}
                {customer.phone}
              </p>
              {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
              {customer.address && (
                <p className="text-xs text-muted-foreground">{customer.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <StatCard
          title="Opening Due"
          value={formatCurrency(summary?.openingDue || 0)}
          icon={Wallet}
        />
        <StatCard
          title="Opening Advance"
          value={formatCurrency(summary?.openingAdvance || 0)}
          icon={CreditCard}
        />
        <StatCard
          title="Outstanding Due"
          value={formatCurrency(summary?.outstandingDue || 0)}
          icon={DollarSign}
          className="border-red-200"
        />
        <StatCard
          title="Advance Balance"
          value={formatCurrency(summary?.advanceBalance || 0)}
          icon={ArrowDownLeft}
          className="border-green-200"
        />
        <StatCard
          title="Lifetime Sales"
          value={formatCurrency(summary?.lifetimeSales || 0)}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Paid"
          value={formatCurrency(summary?.totalPaid || 0)}
          icon={ArrowUpRight}
        />
        <StatCard title="Invoices" value={summary?.numberOfInvoices || 0} icon={FileText} />
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.outstandingInvoices?.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.outstandingInvoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv._id}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">{inv.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(inv.saleDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-destructive">
                          {formatCurrency(inv.outstandingDue)}
                        </p>
                        {renderStatusBadge(inv.invStatus)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No outstanding invoices</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.payments?.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.payments.slice(0, 5).map((p) => (
                    <div
                      key={p._id}
                      className="flex justify-between items-center p-2 bg-muted/50 rounded"
                    >
                      <div>
                        <p className="text-sm font-medium">{p.paymentNumber}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.paymentDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatCurrency(p.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">{p.paymentMethod}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payments yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'invoices' && (
        <DataTable
          columns={[
            { header: 'Invoice #', accessor: 'invoiceNumber' },
            { header: 'Date', accessor: 'saleDate', cell: (row) => formatDate(row.saleDate) },
            {
              header: 'Total',
              accessor: 'grandTotal',
              cell: (row) => formatCurrency(row.grandTotal),
            },
            {
              header: 'Paid',
              accessor: 'paidAmount',
              cell: (row) => formatCurrency(row.paidAmount || 0),
            },
            {
              header: 'Outstanding',
              accessor: 'outstandingDue',
              cell: (row) => formatCurrency(row.outstandingDue),
            },
            {
              header: 'Status',
              accessor: 'invStatus',
              cell: (row) => renderStatusBadge(row.invStatus),
            },
            {
              header: 'Action',
              accessor: '_id',
              sortable: false,
              cell: (row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    printInvoice(row);
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              ),
            },
          ]}
          data={dashboard?.invoices || []}
          loading={isLoading}
        />
      )}

      {activeTab === 'payments' && (
        <DataTable
          columns={[
            { header: 'Receipt #', accessor: 'paymentNumber' },
            { header: 'Date', accessor: 'paymentDate', cell: (row) => formatDate(row.paymentDate) },
            {
              header: 'Amount',
              accessor: 'amount',
              cell: (row) => (
                <span className="text-green-600 font-medium">{formatCurrency(row.amount)}</span>
              ),
            },
            { header: 'Method', accessor: 'paymentMethod' },
            { header: 'Reference', accessor: 'reference' },
            {
              header: 'Action',
              accessor: '_id',
              sortable: false,
              cell: (row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    printPaymentReceipt(row);
                  }}
                >
                  <Printer className="h-4 w-4" />
                </Button>
              ),
            },
          ]}
          data={dashboard?.payments || []}
          loading={isLoading}
        />
      )}

      {activeTab === 'ledger' && (
        <DataTable
          columns={[
            { header: 'Date', accessor: 'date', cell: (row) => formatDate(row.date) },
            { header: 'Type', accessor: 'typeLabel' },
            { header: 'Reference', accessor: 'reference' },
            {
              header: 'Debit',
              accessor: 'debit',
              cell: (row) => (row.debit > 0 ? formatCurrency(row.debit) : '-'),
            },
            {
              header: 'Credit',
              accessor: 'credit',
              cell: (row) =>
                row.credit > 0 ? (
                  <span className="text-green-600">{formatCurrency(row.credit)}</span>
                ) : (
                  '-'
                ),
            },
            {
              header: 'Balance',
              accessor: 'balance',
              cell: (row) => (
                <span
                  className={
                    row.balance > 0 ? 'text-destructive font-medium' : 'text-green-600 font-medium'
                  }
                >
                  {formatCurrency(row.balance)}
                </span>
              ),
            },
          ]}
          data={ledger?.entries || []}
          loading={isLoading}
        />
      )}
    </div>
  );
}

export default CustomerDashboard;
