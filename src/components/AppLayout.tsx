import { useLocation } from "react-router-dom";
import {
  Users,
  CreditCard,
  Dumbbell,
  Settings,
  DollarSign,
  BarChart3,
  Trophy,
  Award,
  Menu,
  CalendarCheck,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { title: "Início", url: "/inicio", icon: LayoutDashboard },
  { title: "Alunos", url: "/alunos", icon: Users },
  { title: "Planos", url: "/planos", icon: CreditCard },
  { title: "Aulas", url: "/aulas", icon: Dumbbell },
  { title: "Graduações", url: "/graduacoes", icon: Award },
  { title: "Mensalidades", url: "/mensalidades", icon: CalendarCheck },
  { title: "Financeiro", url: "/financeiro", icon: DollarSign },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

function AppSidebar() {
  const location = useLocation();
  const { session, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-5 py-5 border-b border-sidebar-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
            <img
              src="/logo.jpg"
              alt="CT Germano Schaun"
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <span className="text-sm font-bold text-sidebar-foreground tracking-tight leading-tight block truncate">
                CT Germano Schaun
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40 font-medium">
                Gestão
              </span>
            </div>
          </div>
          <SidebarTrigger className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors" />
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5 transition-all text-sm font-medium"
                      activeClassName="!text-sidebar-foreground !bg-white/10 shadow-sm"
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Separator className="mb-4 bg-sidebar-border/30" />
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.jpg"
            alt="CT Germano Schaun"
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              Equipe Germano Schaun
            </span>
            <span className="text-[11px] text-sidebar-foreground/40 truncate">
              {session?.user?.email ?? "Painel de gestão"}
            </span>
          </div>
          <button
            onClick={signOut}
            title="Sair"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors shrink-0 group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileTopBar() {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <button
        onClick={toggleSidebar}
        aria-label="Abrir menu"
        className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>
      <img src="/logo.jpg" alt="CT Germano Schaun" className="w-7 h-7 rounded-full object-cover shrink-0" />
      <span className="font-semibold text-sm truncate">CT Germano Schaun</span>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileTopBar />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
