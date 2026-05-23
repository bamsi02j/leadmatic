import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import MobileNav from "./MobileNav";

export default function AppLayout({ unreadCount = 0 }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          unreadCount={unreadCount}
        />
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-200 md:ml-0"
        style={{ marginLeft: 0 }}
      >
        {/* Navbar */}
        <div className="hidden md:block">
          <Navbar sidebarWidth={sidebarWidth} />
        </div>

        {/* Page content */}
        <main
          className="flex-1 transition-all duration-200 pb-20 md:pb-6 pt-0 md:pt-16"
          style={{ marginLeft: sidebarWidth, transition: "margin-left 0.2s" }}
        >
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav unreadCount={unreadCount} />
    </div>
  );
}