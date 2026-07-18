import { useState } from "react";
import { useFetch } from "../../hooks/useQueries";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/Table";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCurrency, formatDate } from "../../lib/utils";
import { BarChart3, TrendingUp, Download } from "lucide-react";

function Reports() {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: salesData, isLoading: salesLoading } = useFetch("/sales", {
    page: 1,
    limit: 500,
    ...(dateRange.start && dateRange.end ? {
      saleDate: { $gte: dateRange.start, $lte: dateRange.end }
    } : {}),
  });

  const { data: purchasesData, isLoading: purchasesLoading } = useFetch("/purchases", {
    page: 1,
    limit: 500,
  });

  const { data: expensesData, isLoading: expensesLoading } = useFetch("/expenses", {
    page: 1,
    limit: 500,
    ...(dateRange.start ? { startDate: dateRange.start } : {}),
    ...(dateRange.end ? { endDate: dateRange.end } : {}),
  });

  const { data: productsData } = useFetch("/products", { page: 1, limit: 500 });
  const { data: customersData } = useFetch("/customers", { page: 1, limit: 500 });
  const { data: suppliersData } = useFetch("/suppliers", { page: 1, limit: 500 });

  const sales = salesData?.data || [];
  const purchases = purchasesData?.data || [];
  const expenses = expensesData?.data || [];
  const products = productsData?.data || [];
  const customers = customersData?.data || [];
  const suppliers = suppliersData?.data || [];

  const totalRevenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCost = purchases.reduce((sum, p) => sum + p.grandTotal, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);

  const reportTabs = [
    { id: "sales", label: "Sales Report" },
    { id: "purchases", label: "Purchase Report" },
    { id: "inventory", label: "Inventory Report" },
    { id: "customers", label: "Customer Report" },
    { id: "suppliers", label: "Supplier Report" },
    { id: "expenses", label: "Expense Report" },
    { id: "profit", label: "Profit Report" },
  ];

  const exportTable = (data, filename) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((v) => `"${v || ""}"`)
        .join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderReport = () => {
    switch (reportType) {
      case "sales":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">{sales.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl font-bold">{formatCurrency(totalRevenue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average per Sale</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(sales.length > 0 ? totalRevenue / sales.length : 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <DataTable
              columns={[
                { header: "Invoice", accessor: "invoiceNumber" },
                { header: "Customer", accessor: "customer", cell: (r) => r.customer?.name || "N/A" },
                { header: "Amount", accessor: "grandTotal", cell: (r) => formatCurrency(r.grandTotal) },
                { header: "Paid", accessor: "paidAmount", cell: (r) => formatCurrency(r.paidAmount) },
                { header: "Due", accessor: "dueAmount", cell: (r) => formatCurrency(r.dueAmount) },
                { header: "Date", accessor: "saleDate", cell: (r) => formatDate(r.saleDate) },
              ]}
              data={sales}
              loading={salesLoading}
            />
          </div>
        );

      case "purchases":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-xl font-bold">{purchases.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Average per Purchase</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(purchases.length > 0 ? totalCost / purchases.length : 0)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <DataTable
              columns={[
                { header: "Purchase #", accessor: "purchaseNumber" },
                { header: "Supplier", accessor: "supplier", cell: (r) => r.supplier?.companyName || "N/A" },
                { header: "Amount", accessor: "grandTotal", cell: (r) => formatCurrency(r.grandTotal) },
                { header: "Paid", accessor: "paidAmount", cell: (r) => formatCurrency(r.paidAmount) },
                { header: "Due", accessor: "dueAmount", cell: (r) => formatCurrency(r.dueAmount) },
                { header: "Date", accessor: "purchaseDate", cell: (r) => formatDate(r.purchaseDate) },
              ]}
              data={purchases}
              loading={purchasesLoading}
            />
          </div>
        );

      case "inventory":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-xl font-bold">{products.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Inventory Value</p>
                  <p className="text-xl font-bold">{formatCurrency(inventoryValue)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Low Stock Items</p>
                  <p className="text-xl font-bold">
                    {products.filter((p) => p.currentStock <= p.minimumStock).length}
                  </p>
                </CardContent>
              </Card>
            </div>
            <DataTable
              columns={[
                { header: "Product", accessor: "productName" },
                { header: "SKU", accessor: "sku" },
                { header: "Stock", accessor: "currentStock" },
                { header: "Purchase Price", accessor: "purchasePrice", cell: (r) => formatCurrency(r.purchasePrice) },
                { header: "Selling Price", accessor: "sellingPrice", cell: (r) => formatCurrency(r.sellingPrice) },
                {
                  header: "Status",
                  accessor: "currentStock",
                  cell: (r) => {
                    if (r.currentStock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
                    if (r.currentStock <= r.minimumStock) return <Badge variant="warning">Low Stock</Badge>;
                    return <Badge variant="success">In Stock</Badge>;
                  },
                },
              ]}
              data={products}
            />
          </div>
        );

      case "customers":
        return (
          <DataTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Company", accessor: "company" },
              { header: "Phone", accessor: "phone" },
              { header: "Total Sales", accessor: "totalSales", cell: (r) => formatCurrency(r.totalSales) },
              { header: "Total Paid", accessor: "totalPaid", cell: (r) => formatCurrency(r.totalPaid) },
              { header: "Due Balance", accessor: "dueBalance", cell: (r) => formatCurrency(r.dueBalance) },
            ]}
            data={customers}
          />
        );

      case "suppliers":
        return (
          <DataTable
            columns={[
              { header: "Company", accessor: "companyName" },
              { header: "Contact", accessor: "contactPerson" },
              { header: "Phone", accessor: "phone" },
              { header: "Total Purchases", accessor: "totalPurchases", cell: (r) => formatCurrency(r.totalPurchases) },
              { header: "Total Paid", accessor: "totalPaid", cell: (r) => formatCurrency(r.totalPaid) },
              { header: "Balance", accessor: "outstandingBalance", cell: (r) => formatCurrency(r.outstandingBalance) },
            ]}
            data={suppliers}
          />
        );

      case "expenses":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold">{formatCurrency(totalExpenses)}</p>
                </CardContent>
              </Card>
            </div>
            <DataTable
              columns={[
                { header: "Category", accessor: "category" },
                { header: "Amount", accessor: "amount", cell: (r) => formatCurrency(r.amount) },
                { header: "Description", accessor: "description" },
                { header: "Date", accessor: "expenseDate", cell: (r) => formatDate(r.expenseDate) },
              ]}
              data={expenses}
              loading={expensesLoading}
            />
          </div>
        );

      case "profit":
        const grossProfit = totalRevenue - totalCost;
        const netProfit = grossProfit - totalExpenses;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Revenue", value: totalRevenue, color: "text-green-600" },
                { label: "COGS", value: totalCost, color: "text-red-600" },
                { label: "Gross Profit", value: grossProfit, color: "text-blue-600" },
                { label: "Net Profit", value: netProfit, color: netProfit >= 0 ? "text-green-600" : "text-red-600" },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export business reports</p>
        </div>
        <Button variant="outline" onClick={() => exportTable(sales, `${reportType}-report`)}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {reportTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={reportType === tab.id ? "default" : "outline"}
            size="sm"
            onClick={() => setReportType(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {dateRange.start && dateRange.end && (
        <div className="text-sm text-muted-foreground">
          Report from {formatDate(dateRange.start)} to {formatDate(dateRange.end)}
        </div>
      )}

      {renderReport()}
    </div>
  );
}

export default Reports;
