'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { getProjects, removeProject } from '@/lib/store';
import { Project } from '@/lib/types';
import { Trash2, ExternalLink, Printer, Search } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const data = await getProjects();
            // Sort by newest first
            setProjects(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar projetos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if wrapped in a link
        if (!confirm('Tem certeza que deseja excluir pste projeto? Esta ação não pode ser desfeita.')) return;

        try {
            await removeProject(id);
            setProjects(projects.filter(p => p.id !== id));
            toast.success('Projeto excluído com sucesso');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao excluir projeto');
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <h1 className="text-2xl font-bold text-[var(--color-ink)] font-mono">
                            Meus Projetos Salvos
                        </h1>

                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Buscar projeto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="bg-white shadow overflow-hidden border border-[var(--color-line)] sm:rounded-lg">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 font-mono">Carregando projetos...</div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-gray-500 text-lg">Nenhum projeto encontrado.</p>
                                <Link href="/optimize" className="mt-4 inline-flex items-center text-[var(--color-accent)] hover:text-orange-600 font-medium">
                                    Criar um novo projeto →
                                </Link>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredProjects.map((project) => {
                                    const hasResult = !!project.result;
                                    const totalBars = hasResult ? project.result?.totalStockUsed : 0;
                                    const dateFormated = new Date(project.createdAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    });

                                    return (
                                        <li key={project.id}>
                                            <div className="block hover:bg-gray-50 transition-colors">
                                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                                    <div className="flex-1 min-w-0 pr-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-lg font-medium text-indigo-600 truncate">
                                                                {project.name || 'Projeto sem nome'}
                                                            </p>
                                                            <div className="ml-2 flex-shrink-0 flex">
                                                                <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${hasResult ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                    {hasResult ? 'Otimizado' : 'Rascunho'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 sm:flex sm:justify-between">
                                                            <div className="sm:flex">
                                                                <p className="flex items-center text-sm text-gray-500">
                                                                    {project.requests?.length || 0} peças solicitadas
                                                                </p>
                                                                {hasResult && (
                                                                    <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                                        {totalBars} barras de estoque utilizadas
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                                                <p>Criado em: {dateFormated}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        {hasResult && (
                                                            <Link
                                                                href={`/print/${project.id}`}
                                                                target="_blank"
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="p-2 text-gray-400 hover:text-gray-900 bg-white rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                                                                title="Imprimir Ficha de Corte"
                                                            >
                                                                <Printer className="w-5 h-5" />
                                                            </Link>
                                                        )}
                                                        <Link
                                                            href={`/optimize?id=${project.id}`}
                                                            className="p-2 text-indigo-500 hover:text-indigo-900 bg-indigo-50 rounded-md border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                                            title="Abrir Projeto"
                                                        >
                                                            <ExternalLink className="w-5 h-5" />
                                                        </Link>
                                                        <button
                                                            onClick={(e) => handleDelete(project.id, e)}
                                                            className="p-2 text-red-500 hover:text-red-900 bg-red-50 rounded-md border border-red-200 hover:bg-red-100 transition-colors"
                                                            title="Excluir Projeto"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
