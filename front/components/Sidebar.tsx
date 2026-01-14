"use client"

import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard,
  GraduationCap,
  School,
  CalendarCheck,
  FileText,
  ClipboardList,
  MessageSquare,
  User,
  Users,
  LogOut,
  CreditCard,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"

import { ThemeToggle } from "@/components/ThemeToggle"

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student", "parent"] },
    { href: "/students", label: "Students", icon: GraduationCap, roles: ["admin", "teacher"] },
    { href: "/classes", label: "Classes", icon: School, roles: ["admin", "teacher"] },
    { href: "/courses", label: "Courses", icon: BookOpen, roles: ["admin", "teacher"] },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ["admin", "teacher"] },
    { href: "/grades", label: "Grades", icon: FileText, roles: ["admin", "teacher", "student"] },
    { href: "/assignments", label: "Assignments", icon: ClipboardList, roles: ["admin", "teacher", "student"] },
    { href: "/fees", label: "Fees", icon: CreditCard, roles: ["admin", "accountant"] },
    { href: "/communication", label: "Messages", icon: MessageSquare, roles: ["admin", "teacher", "student", "parent"] },
    { href: "/users", label: "Users", icon: Users, roles: ["admin"] },
    { href: "/profile", label: "Profile", icon: User, roles: ["admin", "teacher", "student", "parent"] },
  ]

  return (
    <aside className="w-64 bg-sidebar/95 backdrop-blur-md text-sidebar-foreground h-screen flex flex-col fixed left-0 top-0 border-r border-sidebar-border shadow-2xl z-50 transition-all duration-300">
      <div className="p-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-30 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative bg-white rounded-full p-1">
              <Image
                src="/school-logo.jpg"
                alt="School Logo"
                width={40}
                height={40}
                className="object-contain rounded-full"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">SMS</h1>
        </div>
        <p className="text-xs text-sidebar-foreground/70 mt-2 capitalize font-medium tracking-wide">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
          {user?.role} Portal
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {menuItems
          .filter((item) => item.roles.includes(user?.role || ""))
          .map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 scale-[1.02]"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-1"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></span>
                )}
                <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                <span className="font-medium tracking-tight">{item.label}</span>
              </Link>
            )
          })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/30 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4 px-2 py-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/10 group-hover:ring-primary/50 transition-all">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-sidebar-foreground truncate group-hover:text-primary transition-colors">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate group-hover:text-sidebar-foreground/80">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full bg-sidebar-accent/50 text-sidebar-foreground py-2.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all border border-sidebar-border hover:border-red-500/30 group"
          >
            <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
