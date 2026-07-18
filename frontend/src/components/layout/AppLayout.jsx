import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import useAppStore from "../../store/useAppStore";
import { cn } from "../../lib/utils";

function AppLayout({ children }) {
  const { sidebarOpen } = useAppStore();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn("transition-all duration-300", sidebarOpen ? "ml-64" : "ml-16")}>
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;
