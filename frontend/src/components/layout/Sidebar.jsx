import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import useAppStore from "../../store/useAppStore";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  Package,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  BarChart3,
  LineChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Suppliers", path: "/suppliers" },
  { icon: UserCircle, label: "Customers", path: "/customers" },
  { icon: Package, label: "Products", path: "/products" },
  { icon: ShoppingCart, label: "Purchases", path: "/purchases" },
  { icon: ShoppingBag, label: "Sales", path: "/sales" },
  { icon: Wallet, label: "Expenses", path: "/expenses" },
  { icon: Boxes, label: "Inventory", path: "/inventory" },
  { icon: BarChart3, label: "Profit & Loss", path: "/profit-loss" },
  { icon: LineChart, label: "Reports", path: "/reports" },
  { icon: Building2, label: "Users", path: "/users" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        <div className={cn("flex h-14 items-center border-b px-4", sidebarOpen ? "justify-between" : "justify-center")}>
          {sidebarOpen && (
            <span className="font-bold text-lg truncate">Rimon Medi</span>
          )}
          <button
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground",
                  !sidebarOpen && "justify-center px-2"
                )
              }
              title={item.label}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
}

export { Sidebar };
