'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { getProjects, getStock, removeProject, rollbackStock } from '@/lib/store';
import { Project, StockItem } from '@/lib/types';
import Link from 'next/link';
import { Plus, Package, Scissors, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [projectsData, stockData] = await Promise.all([getProjects(), getStock()]);
        setProjects(projectsData);
        setStock(stockData);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este projeto? O estoque consumido será devolvido.')) {
      await rollbackStock(id);
      await removeProject(id);
      setProjects(await getProjects());
      setStock(await getStock());
      toast.success('Projeto excluído e estoque revertido com sucesso.');
    }
  };

  const totalScrap = stock.filter(s => s.isScrap).reduce((acc, s) => acc + s.quantity, 0);
  const totalBars = stock.filter(s => !s.isScrap).reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64 border-2 border-[var(--color-ink)] border-dashed">
            <div className="font-mono text-[var(--color-ink)] animate-pulse">CARREGANDO DADOS DO SISTEMA...</div>
          </div>
        ) : (
          <div className="space-y-12">

            {/* KPI Cards (Industrial Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Card 1 */}
              <div className="border-4 border-[var(--color-ink)] bg-[var(--color-bg)] transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col">
                <div className="p-6 border-b-4 border-[var(--color-ink)] flex items-start justify-between bg-white/50">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-opacity-70 mb-2">Inventário Físico</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-mono text-6xl font-black">{totalBars}</span>
                      <span className="font-mono text-xl font-bold uppercase">Barras</span>
                    </div>
                    <div className="flex items-baseline space-x-2 mt-1 opacity-70">
                      <span className="font-mono text-2xl font-black">{totalScrap}</span>
                      <span className="font-mono text-sm font-bold uppercase">Retalhos Disp.</span>
                    </div>
                  </div>
                  <Package className="h-10 w-10 text-[var(--color-ink)]" strokeWidth={1.5} />
                </div>
                <Link href="/inventory" className="p-4 bg-[var(--color-ink)] text-[var(--color-bg)] font-mono uppercase font-bold text-sm tracking-wider flex justify-between items-center group cursor-pointer transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)] mt-auto">
                  Gerenciar Estoque
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Card 2 */}
              <div className="border-4 border-[var(--color-ink)] bg-[var(--color-bg)] transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col">
                <div className="p-6 border-b-4 border-[var(--color-ink)] flex items-start justify-between bg-[var(--color-ink)] text-[var(--color-bg)]">
                  <div>
                    <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-opacity-70 mb-2">Planos de Corte</h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="font-mono text-6xl font-black">{projects.length}</span>
                      <span className="font-mono text-xl font-bold uppercase">Projetos</span>
                    </div>
                  </div>
                  <Scissors className="h-10 w-10 text-[var(--color-bg)]" strokeWidth={1.5} />
                </div>
                <Link href="/optimize" className="p-4 bg-white font-mono uppercase font-bold text-sm tracking-wider text-[var(--color-ink)] flex justify-between items-center group cursor-pointer transition-colors hover:bg-[var(--color-bg)] mt-auto">
                  Iniciar Novo Corte
                  <Plus className="w-5 h-5 transform group-hover:rotate-90 transition-transform text-[var(--color-accent)]" />
                </Link>
              </div>

            </div>

            {/* Projetos Recentes */}
            <div>
              <div className="flex items-center justify-between mb-6 border-b-4 border-[var(--color-ink)] pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-8 bg-[var(--color-accent)] animate-pulse"></div>
                  <h2 className="text-2xl font-black text-[var(--color-ink)] font-mono uppercase tracking-widest">
                    Últimas Execuções
                  </h2>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="border-4 border-[var(--color-ink)] border-dashed p-12 text-center flex flex-col items-center justify-center">
                  <Scissors className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-mono uppercase font-bold text-lg">Sem registros de corte.</p>
                  <p className="font-mono text-sm opacity-70 mt-2">Inicie um novo projeto para popular esta base.</p>
                </div>
              ) : (
                <div className="border-4 border-[var(--color-ink)] bg-white overflow-hidden">
                  <div className="grid grid-cols-12 border-b-4 border-[var(--color-ink)] bg-[var(--color-bg)]">
                    <div className="col-span-5 p-4 font-mono font-bold text-xs tracking-widest uppercase">ID / Referência</div>
                    <div className="col-span-3 p-4 font-mono font-bold text-xs tracking-widest uppercase border-l-4 border-[var(--color-ink)]">Status</div>
                    <div className="col-span-3 p-4 font-mono font-bold text-xs tracking-widest uppercase border-l-4 border-[var(--color-ink)]">Volume</div>
                    <div className="col-span-1 p-4 border-l-4 border-[var(--color-ink)]"></div>
                  </div>

                  {projects.map((project, index) => (
                    <Link href={`/optimize?id=${project.id}`} key={project.id} className="grid grid-cols-12 border-b last:border-b-0 border-[var(--color-ink)] border-opacity-30 hover:bg-[var(--color-ink)] hover:text-white transition-colors group cursor-pointer items-stretch">
                      <div className="col-span-5 p-4 flex flex-col justify-center">
                        <span className="font-mono font-bold truncate text-lg group-hover:text-[var(--color-bg)]">{project.name}</span>
                        <span className="font-mono text-xs opacity-50 group-hover:opacity-100 group-hover:text-gray-400">
                          {new Date(project.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="col-span-3 p-4 border-l border-[var(--color-ink)] border-opacity-30 group-hover:border-[var(--color-bg)] group-hover:border-opacity-30 flex items-center">
                        {project.result ? (
                          <span className="inline-flex items-center px-2 py-1 bg-[var(--color-ink)] text-[var(--color-bg)] group-hover:bg-white group-hover:text-[var(--color-ink)] font-mono text-xs font-bold uppercase border border-[var(--color-ink)] group-hover:border-white">
                            Finalizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 bg-transparent text-[var(--color-ink)] group-hover:text-white font-mono text-xs font-bold uppercase border border-[var(--color-ink)] border-dashed group-hover:border-white">
                            Em Progresso
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 p-4 border-l border-[var(--color-ink)] border-opacity-30 group-hover:border-[var(--color-bg)] group-hover:border-opacity-30 flex items-center">
                        <span className="font-mono font-black text-xl group-hover:text-[var(--color-accent)]">{project.requests.length}</span>
                        <span className="font-mono text-xs ml-2 opacity-50 group-hover:opacity-100 uppercase">Peças</span>
                      </div>
                      <div className="col-span-1 border-l border-[var(--color-ink)] border-opacity-30 group-hover:border-[var(--color-bg)] group-hover:border-opacity-30 flex items-center justify-center">
                        <button
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="p-3 text-[var(--color-ink)] group-hover:text-white hover:bg-[var(--color-accent)] transition-colors active:scale-95"
                          title="Excluir projeto"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

