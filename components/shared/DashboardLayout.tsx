"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ToastProvider } from "./Toast";
import {
  Home,
  FilePlus,
  FileText,
  CreditCard,
  PieChart,
  Wrench,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  User,
  Zap,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: <Home className="w-4 h-4" /> },
  { label: "New Invoice", href: "/invoices/new", icon: <FilePlus className="w-4 h-4" /> },
  { label: "Invoice History", href: "/invoices/history", icon: <FileText className="w-4 h-4" /> },
  { label: "Balance Confirmation", href: "/balance-confirmation", icon: <CreditCard className="w-4 h-4" /> },
  { label: "GST Summary", href: "/gst-summary", icon: <PieChart className="w-4 h-4" /> },
  { label: "Job-Work Ledger", href: "/job-work", icon: <Wrench className="w-4 h-4" /> },
  { label: "Attendance & Payroll", href: "/attendance", icon: <Users className="w-4 h-4" /> },
  { label: "Settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
];

export function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed", e);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-blueprint-canvas text-[#E9ECEF] flex">
      {/* ── Left Sidebar (Dark Charcoal #121317) ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#121317] text-[#E9ECEF] flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-[#2a2d38]",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Company Header */}
        <div className="p-5 border-b border-[#2a2d38] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FB5607]/15 border border-[#FB5607]/40 rounded-xl flex items-center justify-center text-[#FB5607] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-base text-[#E9ECEF] tracking-tight leading-tight flex items-center gap-1.5">
                SMI ERP
                <span className="text-[10px] bg-[#FB5607]/20 text-[#FB5607] px-1.5 py-0.5 rounded font-sans font-semibold border border-[#FB5607]/40">FINTECH</span>
              </h1>
              <p className="text-[11px] text-[#8b8fa3]">Industrial Operations</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-[#8b8fa3] hover:text-[#E9ECEF] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/home" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-[#FB5607] text-white font-semibold shadow-lg shadow-[#FB5607]/30"
                    : "text-[#8b8fa3] hover:bg-[#21232c] hover:text-[#E9ECEF]"
                )}
              >
                <span className={cn("transition-transform group-hover:scale-110", isActive ? "text-white" : "text-[#8b8fa3] group-hover:text-[#E9ECEF]")}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-[#2a2d38] bg-[#16181f] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
            <div className="w-8 h-8 rounded-full bg-[#FB5607]/20 border border-[#FB5607]/30 flex items-center justify-center text-[#FB5607] shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#E9ECEF] truncate">Administrator</p>
              <p className="text-[10px] text-[#8b8fa3] truncate">admin@smierp.local</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Log Out"
            className="p-1.5 rounded-lg text-[#8b8fa3] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors shrink-0 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#1a1c23] border-b border-[#2a2d38] px-4 md:px-8 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-[#8b8fa3] hover:text-[#E9ECEF] hover:bg-[#21232c]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-[#E9ECEF] flex items-center gap-2">
                SMI Management Dashboard
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FB5607]/15 text-[#FB5607] border border-[#FB5607]/30">
              <Zap className="w-3.5 h-3.5 text-[#FB5607]" />
              Demo Data Mode
            </span>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 md:p-8 bg-[#121317]">{children}</main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ToastProvider>
  );
}
