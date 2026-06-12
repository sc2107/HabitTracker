import { Link, useLocation } from "wouter";
import { Home, Calendar, BarChart2 } from "lucide-react";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full bg-gray-50 flex justify-center text-gray-900 font-sans">
      <div className="w-full max-w-[640px] bg-gray-50 flex flex-col relative shadow-sm h-[100dvh]">
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>
        
        <nav className="absolute bottom-0 w-full max-w-[640px] bg-white border-t border-gray-200 h-16 flex items-center justify-around px-4 z-50">
          <Link href="/" className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${location === "/" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"} transition-colors`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Today</span>
          </Link>
          
          <Link href="/history" className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${location === "/history" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"} transition-colors`}>
            <Calendar className="w-6 h-6" />
            <span className="text-[10px] font-medium">History</span>
          </Link>
          
          <Link href="/dashboard" className={`flex flex-col items-center justify-center w-16 h-full gap-1 ${location === "/dashboard" ? "text-indigo-600" : "text-gray-500 hover:text-gray-900"} transition-colors`}>
            <BarChart2 className="w-6 h-6" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
