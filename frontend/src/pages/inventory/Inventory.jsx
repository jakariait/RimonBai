import { useFetch } from '../../hooks/useQueries';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/Table';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../lib/utils';
import { Package, AlertTriangle, XCircle, DollarSign } from 'lucide-react';

function Inventory() {
  const { data: summaryData, isLoading: summaryLoading } = useFetch('/inventory/summary');
  const { data: productsData, isLoading: productsLoading } = useFetch('/products', {
    page: 1,
    limit: 500,
  });
  const { data: movementsData } = useFetch('/inventory/movements', { page: 1, limit: 100 });

  const summary = summaryData?.data;
  const products = productsData?.data || [];
  const movements = movementsData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" action={false} />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <StatCard title="Total Products" value={summary?.totalProducts || 0} icon={Package} />
        <StatCard title="Total Stock" value={summary?.totalStock || 0} icon={Package} />
        <StatCard
          title="Inventory Value"
          value={formatCurrency(summary?.inventoryValue || 0)}
          icon={DollarSign}
        />
        <StatCard
          title="Low Stock Items"
          value={summary?.lowStockCount || 0}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              searchable={false}
              exportable={false}
              columns={[
                { header: 'Product', accessor: 'productName' },
                { header: 'SKU', accessor: 'sku' },
                { header: 'Stock', accessor: 'currentStock' },
                { header: 'Min', accessor: 'minimumStock' },
                {
                  header: 'Status',
                  accessor: 'currentStock',
                  cell: (row) =>
                    row.currentStock === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : (
                      <Badge variant="warning">Low Stock</Badge>
                    ),
                },
              ]}
              data={products.filter((p) => p.currentStock <= p.minimumStock && p.currentStock >= 0)}
              loading={productsLoading}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Out of Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              searchable={false}
              exportable={false}
              columns={[
                { header: 'Product', accessor: 'productName' },
                { header: 'SKU', accessor: 'sku' },
                {
                  header: 'Category',
                  accessor: 'category',
                  cell: (row) => row.category?.name || 'N/A',
                },
              ]}
              data={products.filter((p) => p.currentStock === 0)}
              loading={productsLoading}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                header: 'Product',
                accessor: 'product',
                cell: (row) => row.product?.productName || 'N/A',
              },
              {
                header: 'Type',
                accessor: 'type',
                cell: (row) => (
                  <Badge
                    variant={
                      row.type === 'purchase' ? 'success' : row.type === 'sale' ? 'info' : 'warning'
                    }
                  >
                    {row.type}
                  </Badge>
                ),
              },
              { header: 'Quantity', accessor: 'quantity' },
              { header: 'Previous Stock', accessor: 'previousStock' },
              { header: 'New Stock', accessor: 'newStock' },
              { header: 'Notes', accessor: 'notes' },
            ]}
            data={movements}
            loading={summaryLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Inventory;
