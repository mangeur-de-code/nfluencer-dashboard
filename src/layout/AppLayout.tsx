import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { AdminDateRangeProvider } from "../context/AdminDateRangeContext";
import { Outlet, Navigate } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@clerk/react";

const LayoutContent: React.FC = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/signin" replace />;

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <AdminDateRangeProvider>
        <LayoutContent />
      </AdminDateRangeProvider>
    </SidebarProvider>
  );
};

export default AppLayout;
