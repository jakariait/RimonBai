import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

function StatCard({ title, value, icon: Icon, trend, trendValue, className }) {
  const isPositive = trend === 'up' || (trendValue && trendValue >= 0);

  return (
    <Card className={cn('', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trendValue !== undefined && (
              <div className="flex items-center gap-1">
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={cn('text-xs', isPositive ? 'text-green-500' : 'text-red-500')}>
                  {trendValue}%
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export { StatCard };
