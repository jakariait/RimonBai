import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Select = forwardRef(({ className, options, placeholder, error, ...props }, ref) => {
  return (
    <div className="w-full">
      <select
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive',
          className
        )}
        ref={ref}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';

export { Select };
