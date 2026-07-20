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
