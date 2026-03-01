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
                  <div className="w-3 h-8 bg-[var(--color-accent)]"></div>
                  <h2 className="text-2xl font-black text-[var(--color-ink)] font-mono uppercase tracking-widest">
                    Últimas Execuções
                  </h2>
                </div>
              </div>

              {projects.length === 0 ? (
                <div className="border-4 border-[var(--color-ink)] border-dashed p-12 text-center flex flex-col items-center justify-center bg-[var(--color-bg)]">
                  <Scissors className="w-12 h-12 mb-4 opacity-50 text-[var(--color-ink)]" />
                  <p className="font-mono uppercase font-black text-xl text-[var(--color-ink)]">SEM REGISTROS DE CORTE.</p>
                  <p className="font-mono text-sm opacity-70 mt-2 font-bold uppercase tracking-widest text-[var(--color-ink)]">INICIE UM NOVO PROJETO PARA POPULAR ESTA BASE.</p>
                </div>
              ) : (
                <div className="border-4 border-[var(--color-ink)] bg-white overflow-hidden shadow-[8px_8px_0px_0px_var(--color-ink)]">
                  <div className="hidden sm:grid grid-cols-12 border-b-4 border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-bg)]">
                    <div className="col-span-5 p-4 font-mono font-black text-xs tracking-widest uppercase border-r-2 border-white border-opacity-20">PROJETO / DATA</div>
                    <div className="col-span-3 p-4 font-mono font-black text-xs tracking-widest uppercase border-r-2 border-white border-opacity-20 flex justify-center">STATUS</div>
                    <div className="col-span-3 p-4 font-mono font-black text-xs tracking-widest uppercase border-r-2 border-white border-opacity-20 flex justify-center">PEÇAS / BARRAS</div>
                    <div className="col-span-1 p-4 font-mono font-black text-xs tracking-widest uppercase flex justify-center">AÇÕES</div>
                  </div>

                  <ul className="divide-y-4 divide-[var(--color-ink)]">
                    {projects.map((project, index) => {
                      const hasResult = !!project.result;
                      const dateFormated = new Date(project.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

                      return (
                        <li key={project.id} className="group flex flex-col sm:grid sm:grid-cols-12 relative hover:bg-[var(--color-bg)] transition-colors bg-white">

                          {/* Status Indicator Bar (Mobile) */}
                          <div className={`sm:hidden absolute left-0 top-0 bottom-0 w-2 ${hasResult ? 'bg-[var(--color-ink)]' : 'bg-amber-400'}`}></div>

                          <Link href={`/optimize?id=${project.id}`} className="col-span-5 p-4 pl-6 sm:pl-4 sm:flex sm:flex-col sm:justify-center border-b-2 sm:border-b-0 border-dashed border-[var(--color-ink)] border-opacity-20 sm:border-r-2 sm:border-solid decoration-transparent hover:decoration-[var(--color-accent)] underline decoration-2 underline-offset-4 transition-all">
                            <span className="font-mono font-black truncate text-lg text-[var(--color-ink)] uppercase tracking-widest block mb-1">{project.name || 'PROJETO SEM NOME'}</span>
                            <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-60 text-[var(--color-ink)]">
                              {dateFormated}
                            </span>
                          </Link>

                          <div className="col-span-3 p-4 flex sm:justify-center items-center border-b-2 sm:border-b-0 border-dashed border-[var(--color-ink)] border-opacity-20 sm:border-r-2 sm:border-solid">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 sm:hidden mr-2">STATUS:</span>
                            {hasResult ? (
                              <span className="inline-flex items-center px-3 py-1 bg-[var(--color-ink)] text-[var(--color-bg)] font-mono text-xs font-black uppercase tracking-widest border border-[var(--color-ink)]">
                                FINALIZADO
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 font-mono text-xs font-black uppercase tracking-widest border border-amber-500">
                                RASCUNHO
                              </span>
                            )}
                          </div>

                          <div className="col-span-3 p-4 flex sm:justify-center items-center border-b-2 sm:border-b-0 border-dashed border-[var(--color-ink)] border-opacity-20 sm:border-r-2 sm:border-solid">
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 sm:hidden mr-2">VOLUME:</span>
                            <div className="flex items-baseline space-x-1">
                              <span className="font-mono font-black text-xl text-[var(--color-ink)]">{project.requests.length}</span>
                              <span className="font-mono text-xs font-bold opacity-60 uppercase tracking-widest">PÇS</span>
                              {hasResult && (
                                <>
                                  <span className="font-mono text-xl text-[var(--color-ink)] opacity-30 mx-1">/</span>
                                  <span className="font-mono font-black text-xl text-[var(--color-ink)]">{project.result?.totalStockUsed}</span>
                                  <span className="font-mono text-xs font-bold opacity-60 uppercase tracking-widest">BRS</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="col-span-1 sm:border-l-0 border-[var(--color-ink)] border-opacity-30 group-hover:border-[var(--color-bg)] group-hover:border-opacity-30 flex items-stretch sm:justify-center bg-red-50 sm:bg-transparent absolute top-0 right-0 sm:relative sm:h-auto h-full w-16 sm:w-auto">
                            <button
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className="flex-1 w-full h-full flex justify-center items-center p-3 text-red-600 sm:text-[var(--color-ink)] sm:opacity-50 hover:opacity-100 hover:text-white hover:bg-red-600 transition-colors active:scale-95 sm:relative absolute inset-0 text-center"
                              title="EXCLUIR PROJETO"
                            >
                              <Trash2 className="h-5 w-5 mx-auto" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

