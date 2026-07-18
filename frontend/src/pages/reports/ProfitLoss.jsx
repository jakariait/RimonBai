import { useState } from 'react';
import { useFetch } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatCurrency } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];

function ProfitLoss() {
  const [period, setPeriod] = useState('monthly');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });

  const params = { period };
  if (period === 'custom' && customRange.start && customRange.end) {
    params.startDate = customRange.start;
    params.endDate = customRange.end;
  }

  const { data, isLoading } = useFetch('/analytics/profit-loss', params);

  const pl = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const pieData =
    pl?.expenses?.map((e) => ({
      name: e._id,
      value: e.amount,
    })) || [];

  const summaryCards = [
    { label: 'Revenue', value: pl?.revenue || 0, color: 'text-green-600' },
    { label: 'COGS', value: pl?.cogs || 0, color: 'text-red-600' },
    { label: 'Gross Profit', value: pl?.grossProfit || 0, color: 'text-blue-600' },
    { label: 'Total Expenses', value: pl?.totalExpenses || 0, color: 'text-orange-600' },
    {
      label: 'Net Profit',
      value: pl?.netProfit || 0,
      color: pl?.isLoss ? 'text-red-600' : 'text-green-600',
    },
    { label: 'Margin', value: `${pl?.netProfitMargin || 0}%`, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profit & Loss</h1>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
          {period === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
              />
              <input
                type="date"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.label === 'Margin' ? card.value : formatCurrency(card.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs COGS vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Summary',
                      Revenue: pl?.revenue || 0,
                      COGS: pl?.cogs || 0,
                      Expenses: pl?.totalExpenses || 0,
                      'Net Profit': pl?.netProfit || 0,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Revenue" fill="#10b981" />
                  <Bar dataKey="COGS" fill="#ef4444" />
                  <Bar dataKey="Expenses" fill="#f59e0b" />
                  <Bar dataKey="Net Profit" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {pl?.expenses?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {pl.expenses.map((e, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{e._id}</td>
                      <td className="text-right py-2">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-2">Total</td>
                    <td className="text-right py-2">{formatCurrency(pl.totalExpenses)}</td>
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

export default ProfitLoss;
