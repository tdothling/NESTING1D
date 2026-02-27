'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { getProjects, getStock, removeProject, rollbackStock } from '@/lib/store';
import { Project, StockItem } from '@/lib/types';
import Link from 'next/link';
import { Plus, ArrowRight, Package, Scissors, Trash2 } from 'lucide-react';
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
      setStock(await getStock()); // Atualiza UI de peças ao excluir o projeto
      toast.success('Projeto excluído e estoque revertido com sucesso.');
    }
  };

  const totalScrap = stock.filter(s => s.isScrap).reduce((acc, s) => acc + s.quantity, 0);
  const totalBars = stock.filter(s => !s.isScrap).reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-ink)]"></div>
          </div>
        ) : (
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* KPI Cards */}
              <div className="bg-white overflow-hidden shadow rounded-lg border border-[var(--color-line)]">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Retalhos</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{totalScrap} peças</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/inventory" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)]">
                      Ver estoque
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg border border-[var(--color-line)]">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Scissors className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Projetos Recentes</dt>
                        <dd>
                          <div className="text-lg font-medium text-gray-900">{projects.length}</div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <Link href="/optimize" className="font-medium text-[var(--color-accent)] hover:text-[var(--color-ink)]">
                      Novo projeto
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects List */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg leading-6 font-medium text-gray-900 font-mono">Projetos Recentes</h2>
                <Link href="/optimize" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-ink)] hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Link>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md border border-[var(--color-line)]">
                <ul className="divide-y divide-gray-200">
                  {projects.length === 0 ? (
                    <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                      Nenhum projeto encontrado. Comece um novo!
                    </li>
                  ) : (
                    projects.map((project) => (
                      <li key={project.id}>
                        <Link href={`/optimize?id=${project.id}`} className="block hover:bg-gray-50">
                          <div className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[var(--color-accent)] truncate font-mono">
                                {project.name}
                              </p>
                              <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {project.result ? 'Concluído' : 'Rascunho'}
                                </p>
                                <button
                                  onClick={(e) => handleDeleteProject(project.id, e)}
                                  className="text-gray-400 hover:text-red-600 p-1"
                                  title="Excluir projeto"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  <Scissors className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                  {project.requests.length} itens
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  Criado em <time dateTime={project.createdAt}>{new Date(project.createdAt).toLocaleDateString()}</time>
                                </p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
