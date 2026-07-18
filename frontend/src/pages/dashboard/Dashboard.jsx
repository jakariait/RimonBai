import { useFetch } from "../../hooks/useQueries";
import { StatCard } from "../../components/ui/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/Table";
import { formatCurrency, formatDate } from "../../lib/utils";
import {
  DollarSign,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Package,
  AlertTriangle,
  Users,
  Building2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Dashboard() {
  const { data, isLoading } = useFetch("/analytics/dashboard", { period: "monthly" });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.data;

  const chartData = stats?.salesChart?.map((d) => ({
    date: d._id,
    Sales: d.total,
    label: new Date(d._id).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  }));

  const purchaseChartData = stats?.purchaseChart?.map((d) => ({
    date: d._id,
    Purchases: d.total,
    label: new Date(d._id).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your business overview for this month</p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Today's Sales" value={formatCurrency(stats?.revenue)} icon={DollarSign} />
        <StatCard title="Monthly Revenue" value={formatCurrency(stats?.revenue)} icon={TrendingUp} />
        <StatCard title="Total Cost" value={formatCurrency(stats?.totalCost)} icon={ShoppingBag} />
        <StatCard title="Gross Profit" value={formatCurrency(stats?.grossProfit)} icon={TrendingUp} />
        <StatCard title="Net Profit" value={formatCurrency(stats?.netProfit)} icon={DollarSign} />
        <StatCard title="Total Expenses" value={formatCurrency(stats?.totalExpenses)} icon={TrendingDown} />
        <StatCard title="Receivable" value={formatCurrency(stats?.outstandingReceivable)} icon={Users} />
        <StatCard title="Payable" value={formatCurrency(stats?.outstandingPayable)} icon={Building2} />
        <StatCard title="Inventory Value" value={formatCurrency(stats?.inventoryValue)} icon={Package} />
        <StatCard title="Low Stock Items" value={stats?.lowStockCount || 0} icon={AlertTriangle} />
        <StatCard title="Total Sales" value={stats?.totalSales || 0} icon={ShoppingCart} />
        <StatCard title="Total Purchases" value={stats?.totalPurchases || 0} icon={ShoppingBag} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="Sales" stroke="hsl(var(--primary))" fill="url(#salesGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Purchase Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={purchaseChartData}>
                  <defs>
                    <linearGradient id="purchaseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                  <Area type="monotone" dataKey="Purchases" stroke="#f59e0b" fill="url(#purchaseGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              searchable={false}
              exportable={false}
              columns={[
                { header: "Invoice", accessor: "invoiceNumber" },
                { header: "Customer", accessor: "customer", cell: (row) => row.customer?.name || "N/A" },
                { header: "Amount", accessor: "grandTotal", cell: (row) => formatCurrency(row.grandTotal) },
                { header: "Date", accessor: "createdAt", cell: (row) => formatDate(row.createdAt) },
              ]}
              data={stats?.recentSales || []}
              loading={isLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              searchable={false}
              exportable={false}
              columns={[
                { header: "Purchase #", accessor: "purchaseNumber" },
                { header: "Supplier", accessor: "supplier", cell: (row) => row.supplier?.companyName || "N/A" },
                { header: "Amount", accessor: "grandTotal", cell: (row) => formatCurrency(row.grandTotal) },
                { header: "Date", accessor: "createdAt", cell: (row) => formatDate(row.createdAt) },
              ]}
              data={stats?.recentPurchases || []}
              loading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {stats?.lowStockProducts?.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              searchable={false}
              exportable={false}
              columns={[
                { header: "Product", accessor: "productName" },
                { header: "SKU", accessor: "sku" },
                { header: "Current Stock", accessor: "currentStock" },
                { header: "Min Stock", accessor: "minimumStock" },
              ]}
              data={stats?.lowStockProducts || []}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;
