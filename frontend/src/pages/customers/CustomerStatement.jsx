import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFetch } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { formatCurrency, formatDate } from '../../lib/utils';
import { ArrowLeft, Printer, Search } from 'lucide-react';

function CustomerStatement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [fromDate, setFromDate] = useState(firstOfMonth);
  const [toDate, setToDate] = useState(today);

  const { data, isLoading } = useFetch(`/customers/${id}/statement`, {
    from: fromDate,
    to: toDate,
  });

  const { data: businessData } = useFetch('/settings/business');

  const statement = data?.data;
  const customer = statement?.customer;
  const biz = businessData?.data || {};

  const printStatement = () => {
    if (!statement) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = statement.entries
      .map(
        (e) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px">${e.type === 'opening' ? '-' : formatDate(e.date)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-transform:capitalize">${e.type === 'opening' ? '' : e.type}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px">${e.reference}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">${e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right">${e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:right;font-weight:600">${formatCurrency(e.balance)}</td>
      </tr>
    `
      )
      .join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Customer Statement - ${customer?.name}</title>
        <style>
          @page { margin: 12mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; font-size: 11px; }
          .container { max-width: 210mm; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #1f2937; }
          .company-name { font-size: 16px; font-weight: 700; }
          .title { font-size: 20px; font-weight: 800; text-align: center; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 2px; }
          .info { display: flex; justify-content: space-between; margin-bottom: 12px; padding: 10px 14px; background: #f8fafc; border-radius: 6px; }
          .info div { font-size: 11px; }
          .info .label { color: #64748b; font-size: 9px; text-transform: uppercase; }
          .info .value { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          thead th { background: #1f2937; color: white; padding: 8px 10px; font-size: 10px; text-transform: uppercase; text-align: left; }
          thead th:last-child { text-align: right; }
          thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
          .total-row td { font-weight: 700; font-size: 12px; padding: 8px 10px; border-top: 2px solid #1f2937; }
          .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              <div class="company-name">${biz.businessName || 'Rimon Medical Equipment'}</div>
              <p style="font-size:10px;color:#64748b">${biz.address || ''}</p>
              <p style="font-size:10px;color:#64748b">${biz.phone || ''} | ${biz.email || ''}</p>
            </div>
          </div>
          <div class="title">Customer Statement</div>
          <div class="info">
            <div>
              <div class="label">Customer</div>
              <div class="value">${customer?.name || ''}</div>
              <div style="font-size:10px;color:#64748b;margin-top:2px">${customer?.phone || ''}${customer?.email ? ' | ' + customer.email : ''}</div>
            </div>
            <div style="text-align:right">
              <div class="label">Period</div>
              <div class="value">${formatDate(fromDate)} - ${formatDate(toDate)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Reference</th>
                <th style="text-align:right">Debit (৳)</th>
                <th style="text-align:right">Credit (৳)</th>
                <th style="text-align:right">Balance (৳)</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="3" style="text-align:right">Closing Balance</td>
                <td style="text-align:right">${formatCurrency(statement.totalInvoiced || 0)}</td>
                <td style="text-align:right">${formatCurrency(statement.totalPaid || 0)}</td>
                <td style="text-align:right">${formatCurrency(statement.closingBalance || 0)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            <p>Generated on ${formatDate(new Date())} | ${biz.businessName || 'Rimon Medical Equipment'}</p>
          </div>
        </div>
        <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Customer Statement" description={customer?.name || ''} action={false} />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/customers/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-end gap-4">
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">From Date</label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">To Date</label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <Button variant="outline" onClick={() => {}}>
              <Search className="h-4 w-4 mr-2" /> Refresh
            </Button>
            <Button onClick={printStatement} disabled={!statement}>
              <Printer className="h-4 w-4 mr-2" /> Print Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      {statement && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Statement {formatDate(fromDate)} - {formatDate(toDate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto" ref={printRef}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-2 px-3">Date</th>
                    <th className="text-left py-2 px-3">Type</th>
                    <th className="text-left py-2 px-3">Reference</th>
                    <th className="text-right py-2 px-3">Debit</th>
                    <th className="text-right py-2 px-3">Credit</th>
                    <th className="text-right py-2 px-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-blue-50">
                    <td className="py-2 px-3 font-medium" colSpan={2}>
                      Opening Balance
                    </td>
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3" />
                    <td className="py-2 px-3 text-right font-medium">
                      {formatCurrency(statement.openingBalance)}
                    </td>
                  </tr>
                  {statement.entries
                    ?.filter((e) => e.type !== 'opening')
                    .map((entry, i) => (
                      <tr key={i} className="border-b">
                        <td className="py-2 px-3">{formatDate(entry.date)}</td>
                        <td className="py-2 px-3 capitalize">{entry.type}</td>
                        <td className="py-2 px-3">{entry.reference}</td>
                        <td className="py-2 px-3 text-right text-destructive">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-green-600">
                          {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-medium ${entry.balance > 0 ? 'text-destructive' : 'text-green-600'}`}
                        >
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-muted/50 font-bold">
                    <td className="py-3 px-3" colSpan={3}>
                      Closing Balance
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(statement.totalInvoiced || 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(statement.totalPaid || 0)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {formatCurrency(statement.closingBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CustomerStatement;
