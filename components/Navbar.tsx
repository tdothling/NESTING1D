import Link from 'next/link';
import { LayoutDashboard, Package, Scissors, Settings } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="border-b-4 border-[var(--color-ink)] bg-[var(--color-bg)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16">
          <div className="flex">

            {/* Logo area */}
            <div className="flex-shrink-0 flex items-center border-r-4 border-[var(--color-ink)] pr-6 mr-6">
              <span className="font-mono text-2xl font-black tracking-tighter uppercase text-[var(--color-ink)]">
                NESTING<span className="text-[var(--color-accent)] bg-[var(--color-ink)] px-1 ml-0.5">1D</span>
              </span>
            </div>

            {/* Navigation links */}
            <div className="hidden sm:flex space-x-0 h-full">
              <Link href="/" className="group h-full flex items-center px-6 border-r border-[var(--color-ink)] border-opacity-30 hover:bg-[var(--color-ink)] transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3 text-[var(--color-ink)] group-hover:text-[var(--color-bg)]" />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-[var(--color-bg)]">Dashboard</span>
              </Link>
              <Link href="/inventory" className="group h-full flex items-center px-6 border-r border-[var(--color-ink)] border-opacity-30 hover:bg-[var(--color-ink)] transition-colors">
                <Package className="w-5 h-5 mr-3 text-[var(--color-ink)] group-hover:text-[var(--color-bg)]" />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-[var(--color-bg)]">Estoque</span>
              </Link>
              <Link href="/optimize" className="group h-full flex items-center px-6 border-r border-[var(--color-ink)] border-opacity-30 hover:bg-[var(--color-ink)] transition-colors">
                <Scissors className="w-5 h-5 mr-3 text-[var(--color-ink)] group-hover:text-[var(--color-bg)]" />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-[var(--color-bg)]">Otimizar</span>
              </Link>
              <Link href="/projects" className="group h-full flex items-center px-6 border-r border-[var(--color-ink)] border-opacity-30 hover:bg-[var(--color-ink)] transition-colors">
                <LayoutDashboard className="w-5 h-5 mr-3 text-[var(--color-ink)] group-hover:text-[var(--color-bg)]" />
                <span className="font-mono text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-[var(--color-bg)]">Projetos</span>
              </Link>
            </div>
          </div>

          {/* Right side settings */}
          <div className="flex items-center border-l-4 border-[var(--color-ink)] px-2">
            <button className="h-full px-4 flex justify-center items-center text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-white transition-colors group">
              <Settings className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Absolute industrial accent block */}
        <div className="absolute bottom-0 right-0 w-32 h-2 bg-[var(--color-accent)] hidden sm:block"></div>
      </div>
    </nav>
  );
}
