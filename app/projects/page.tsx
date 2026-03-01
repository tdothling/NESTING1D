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
        <div className="min-h-screen bg-[var(--color-bg)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]">
            <Navbar />

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-4 border-[var(--color-ink)] pb-6 gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-3 h-10 bg-[var(--color-ink)]"></div>
                            <div>
                                <h1 className="text-3xl font-black text-[var(--color-ink)] font-mono uppercase tracking-widest">
                                    Projetos
                                </h1>
                                <p className="font-mono text-sm opacity-70 uppercase tracking-widest mt-1">Histórico de Otimizações</p>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-80 border-2 border-[var(--color-ink)] bg-white group focus-within:border-[var(--color-accent)] transition-colors">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-[var(--color-ink)] group-focus-within:text-[var(--color-accent)] transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 bg-transparent border-none focus:outline-none focus:ring-0 font-mono font-bold uppercase placeholder-[var(--color-ink)] placeholder-opacity-50 text-[var(--color-ink)]"
                                placeholder="BUSCAR PROJETO..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="border-4 border-[var(--color-ink)] bg-white shadow-[8px_8px_0px_0px_var(--color-ink)]">
                        {loading ? (
                            <div className="p-16 text-center border-b-2 border-dashed border-[var(--color-ink)] bg-[var(--color-bg)]">
                                <span className="font-mono font-black text-xl uppercase tracking-widest animate-pulse text-[var(--color-ink)]">CARREGANDO PROJETOS...</span>
                            </div>
                        ) : filteredProjects.length === 0 ? (
                            <div className="p-16 text-center border-b-2 border-dashed border-[var(--color-ink)] bg-[var(--color-bg)]">
                                <div className="flex flex-col items-center justify-center opacity-60">
                                    <span className="font-mono font-black text-2xl uppercase tracking-widest mb-2 text-[var(--color-ink)]">NENHUM PROJETO</span>
                                    {searchTerm ? (
                                        <span className="font-mono text-sm font-bold uppercase tracking-widest max-w-md text-[var(--color-ink)]">A BUSCA NÃO RETORNOU RESULTADOS.</span>
                                    ) : (
                                        <>
                                            <span className="font-mono text-sm font-bold uppercase tracking-widest max-w-md text-[var(--color-ink)] mb-6">NÃO HÁ PROJETOS REGISTRADOS NO SISTEMA.</span>
                                            <Link href="/optimize" className="inline-flex items-center justify-center px-6 py-3 border-2 border-[var(--color-ink)] text-sm font-black uppercase tracking-widest text-[var(--color-bg)] bg-[var(--color-ink)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition-all active:scale-95 shadow-[4px_4px_0px_0px_var(--color-ink)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px]">
                                                CRIAR NOVO PROJETO
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <ul className="divide-y-4 divide-[var(--color-ink)]">
                                {filteredProjects.map((project) => {
                                    const hasResult = !!project.result;
                                    const totalBars = hasResult ? project.result?.totalStockUsed : 0;
                                    const dateFormated = new Date(project.createdAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    });

                                    return (
                                        <li key={project.id} className="group flex flex-col sm:flex-row relative hover:bg-[var(--color-bg)] transition-colors">
                                            {/* Status Indicator Bar */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-2 ${hasResult ? 'bg-[var(--color-ink)]' : 'bg-amber-400'}`}></div>

                                            <div className="flex-1 p-6 pl-8">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <Link href={`/optimize?id=${project.id}`} className="hover:text-[var(--color-accent)] transition-colors inline-block">
                                                            <h3 className="text-xl font-black text-[var(--color-ink)] uppercase tracking-widest mb-1 underline decoration-2 underline-offset-4 decoration-transparent hover:decoration-[var(--color-accent)] transition-all">
                                                                {project.name || 'PROJETO SEM NOME'}
                                                            </h3>
                                                        </Link>
                                                        <p className="font-mono text-xs font-bold uppercase tracking-widest opacity-60 flex items-center">
                                                            <span>CRIADO EM {dateFormated}</span>
                                                        </p>
                                                    </div>

                                                    <div className="hidden sm:block">
                                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 ${hasResult ? 'border-[var(--color-ink)] text-[var(--color-ink)] bg-transparent' : 'border-amber-500 text-amber-600 bg-amber-50'}`}>
                                                            {hasResult ? 'OTIMIZADO' : 'RASCUNHO'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 font-mono text-sm max-w-md">
                                                    <div className="bg-white border-2 border-[var(--color-ink)] border-opacity-20 p-2">
                                                        <span className="block text-[10px] font-black text-[var(--color-ink)] uppercase tracking-widest opacity-50 mb-1">PEÇAS SOLICITADAS</span>
                                                        <span className="font-black text-lg text-[var(--color-ink)]">{project.requests?.length || 0}</span>
                                                    </div>

                                                    <div className={`bg-white border-2 border-[var(--color-ink)] border-opacity-20 p-2 ${!hasResult && 'opacity-30'}`}>
                                                        <span className="block text-[10px] font-black text-[var(--color-ink)] uppercase tracking-widest opacity-50 mb-1">BARRAS UTILIZADAS</span>
                                                        <span className="font-black text-lg text-[var(--color-ink)]">{hasResult ? totalBars : '-'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions Panel */}
                                            <div className="flex sm:flex-col border-t-2 sm:border-t-0 sm:border-l-2 border-dashed border-[var(--color-ink)] border-opacity-30 bg-white">
                                                {hasResult && (
                                                    <Link
                                                        href={`/print/${project.id}`}
                                                        target="_blank"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex-1 sm:flex-none flex justify-center items-center p-4 sm:p-5 text-[var(--color-ink)] hover:text-white hover:bg-[var(--color-ink)] transition-colors border-r-2 sm:border-r-0 border-dashed border-[var(--color-ink)] border-opacity-30"
                                                        title="IMPRIMIR FICHA DE CORTE"
                                                    >
                                                        <Printer className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </Link>
                                                )}

                                                <Link
                                                    href={`/optimize?id=${project.id}`}
                                                    className="flex-1 sm:flex-none flex justify-center items-center p-4 sm:p-5 text-[var(--color-ink)] hover:text-white hover:bg-[var(--color-accent)] transition-colors border-r-2 sm:border-r-0 sm:border-t-2 border-dashed border-[var(--color-ink)] border-opacity-30"
                                                    title="ABRIR PROJETO"
                                                >
                                                    <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </Link>

                                                <button
                                                    onClick={(e) => handleDelete(project.id, e)}
                                                    className="flex-1 sm:flex-none flex justify-center items-center p-4 sm:p-5 text-red-600 hover:text-white hover:bg-red-600 transition-colors sm:border-t-2 border-dashed border-red-600 border-opacity-30"
                                                    title="EXCLUIR PROJETO"
                                                >
                                                    <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                                </button>
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
