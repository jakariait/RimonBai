import { Button } from "./Button";
import { Plus } from "lucide-react";

function PageHeader({ title, description, action, onAction, actionLabel }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action !== false && (
        <Button onClick={onAction}>
          <Plus className="h-4 w-4 mr-2" />
          {actionLabel || `Add ${title}`}
        </Button>
      )}
    </div>
  );
}

export { PageHeader };
