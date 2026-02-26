'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Navbar } from '@/components/Navbar';
import { extractTableData } from '@/lib/gemini';
import { optimizeCuts } from '@/lib/optimizer';
import { getStock, addProject, updateStockFromOptimization } from '@/lib/store';
import { CutRequest, StockItem, OptimizationResult, Project } from '@/lib/types';
import { Upload, Check, AlertCircle, ArrowRight, Save, Trash2, Plus, RefreshCw, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function OptimizePage() {
  const router = useRouter();
  const [step, setStep] = useState<'upload' | 'review' | 'results'>('upload');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<CutRequest[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [projectName, setProjectName] = useState('');
  const [standardBarLengths, setStandardBarLengths] = useState<Record<string, number>>({});
  const [uniqueMaterials, setUniqueMaterials] = useState<string[]>([]);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);

  useEffect(() => {
    // Wrap in setTimeout to avoid synchronous state update warning
    const timer = setTimeout(() => {
      setStock(getStock());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Update unique materials when requests change
  useEffect(() => {
    const materials = Array.from(new Set(requests.map(r => r.material.trim()))).sort();
    setUniqueMaterials(materials);
    
    // Initialize standard lengths if not set
    setStandardBarLengths(prev => {
      const next = { ...prev };
      materials.forEach(mat => {
        if (!next[mat]) next[mat] = 6000;
      });
      return next;
    });
  }, [requests]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setLoading(true);
    try {
      const data = await extractTableData(acceptedFiles[0]);
      setRequests(data);
      setStep('review');
      toast.success('Dados extraídos com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao extrair dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
  });

  const handleOptimize = () => {
    if (requests.length === 0) {
      toast.error('Adicione itens para cortar.');
      return;
    }
    
    setLoading(true);
    // Simulate slight delay for UX
    setTimeout(() => {
      try {
        const optimization = optimizeCuts(requests, stock, { 
          standardBarLengths, 
          defaultStandardLength: 6000,
          kerf: 3 
        });
        setResult({
            bars: optimization.results,
            totalWaste: optimization.results.reduce((acc, bar) => acc + bar.waste, 0),
            totalStockUsed: optimization.results.length,
            itemsNotFit: optimization.itemsNotFit,
            purchaseList: optimization.purchaseList
        });
        setStep('results');
        toast.success('Otimização concluída!');
      } catch (error) {
        console.error(error);
        toast.error('Erro na otimização.');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSaveProject = () => {
    if (!result) return;
    
    const project: Project = {
      id: crypto.randomUUID(),
      name: projectName || `Projeto ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      requests,
      result
    };
    
    addProject(project);
    
    if (autoUpdateStock) {
      updateStockFromOptimization(result);
      toast.success('Projeto salvo e estoque atualizado!');
    } else {
      toast.success('Projeto salvo!');
    }
    
    router.push('/');
  };

  const updateRequest = (id: string, field: keyof CutRequest, value: any) => {
    setRequests(requests.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRequest = (id: string) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const addRequest = () => {
    setRequests([...requests, {
      id: crypto.randomUUID(),
      material: 'Novo Item',
      length: 1000,
      quantity: 1,
      description: ''
    }]);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4 font-mono text-sm">
              <div className={`flex items-center ${step === 'upload' ? 'text-[var(--color-accent)] font-bold' : 'text-gray-500'}`}>
                <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mr-2">1</span>
                Upload
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${step === 'review' ? 'text-[var(--color-accent)] font-bold' : 'text-gray-500'}`}>
                <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mr-2">2</span>
                Revisão
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${step === 'results' ? 'text-[var(--color-accent)] font-bold' : 'text-gray-500'}`}>
                <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center mr-2">3</span>
                Resultados
              </div>
            </div>
          </div>

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="max-w-xl mx-auto">
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-[var(--color-accent)] bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <input {...getInputProps()} />
                {loading ? (
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-10 h-10 text-[var(--color-accent)] animate-spin mb-4" />
                    <p className="text-gray-500 font-mono">Analisando imagem com Gemini AI...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-10 h-10 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900">Arraste uma imagem da tabela aqui</p>
                    <p className="text-sm text-gray-500 mt-2">ou clique para selecionar</p>
                    <p className="text-xs text-gray-400 mt-4 font-mono">Suporta PNG, JPG, WEBP</p>
                  </div>
                )}
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-4">- OU -</p>
                <button
                  onClick={() => {
                    setRequests([]);
                    setStep('review');
                  }}
                  className="text-[var(--color-accent)] hover:text-[var(--color-ink)] font-medium text-sm"
                >
                  Inserir dados manualmente &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50 border-b border-[var(--color-line)]">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 font-mono">Itens para Corte</h3>
                  <button onClick={addRequest} className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-[var(--color-ink)] hover:bg-gray-800">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Material</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Comprimento (mm)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Qtd</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Descrição</th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {requests.map((req) => (
                        <tr key={req.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="text" 
                              value={req.material} 
                              onChange={(e) => updateRequest(req.id, 'material', e.target.value)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="number" 
                              value={req.length} 
                              onChange={(e) => updateRequest(req.id, 'length', Number(e.target.value))}
                              className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="number" 
                              value={req.quantity} 
                              onChange={(e) => updateRequest(req.id, 'quantity', Number(e.target.value))}
                              className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="text" 
                              value={req.description || ''} 
                              onChange={(e) => updateRequest(req.id, 'description', e.target.value)}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => removeRequest(req.id)} className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Optimization Settings */}
              <div className="bg-white shadow rounded-lg border border-[var(--color-line)] p-6">
                <h3 className="text-lg font-medium text-gray-900 font-mono mb-4">Configurações de Otimização</h3>
                <p className="text-sm text-gray-500 mb-4">Defina o comprimento padrão da barra de compra para cada material.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniqueMaterials.map(material => (
                    <div key={material} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                      <label htmlFor={`len-${material}`} className="block text-xs font-medium text-gray-700 font-mono truncate mb-1" title={material}>
                        {material}
                      </label>
                      <div className="relative rounded-md shadow-sm">
                        <input
                          type="number"
                          id={`len-${material}`}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="6000"
                          value={standardBarLengths[material] || 6000}
                          onChange={(e) => setStandardBarLengths(prev => ({ ...prev, [material]: Number(e.target.value) }))}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-xs">mm</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Voltar
                </button>
                <button
                  onClick={handleOptimize}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[var(--color-accent)] hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      Otimizar Cortes <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && result && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-white shadow rounded-lg border border-[var(--color-line)] p-6">
                <h2 className="text-lg font-medium text-gray-900 font-mono mb-4">Resumo da Otimização</h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Barras Usadas</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{result.totalStockUsed}</dd>
                  </div>
                  <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                    <dt className="text-sm font-medium text-gray-500 truncate">Desperdício Total</dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">{result.totalWaste} mm</dd>
                  </div>
                  <div className="bg-gray-50 overflow-hidden rounded-lg p-4 border border-gray-200">
                    <dt className="text-sm font-medium text-gray-500 truncate">Aproveitamento</dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      {Math.round((1 - (result.totalWaste / (result.bars.reduce((acc, b) => acc + b.length, 0) || 1))) * 100)}%
                    </dd>
                  </div>
                </div>
              </div>

              {/* Purchase List */}
              <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-indigo-50 border-b border-[var(--color-line)] flex items-center">
                  <ShoppingCart className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg leading-6 font-medium text-indigo-900 font-mono">Lista de Compra</h3>
                </div>
                <div className="p-6">
                  {result.purchaseList && result.purchaseList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Material</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Comprimento (mm)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Quantidade</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {result.purchaseList.map((item, idx) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.material}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.length}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma compra necessária. Todo o material foi retirado do estoque.</p>
                  )}
                </div>
              </div>

              {/* Cut Plan Visualization */}
              <div className="bg-white shadow rounded-lg border border-[var(--color-line)] overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-[var(--color-line)]">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 font-mono">Plano de Corte Detalhado</h3>
                </div>
                <div className="p-6 space-y-8">
                  {result.bars.map((bar, index) => (
                    <div key={bar.id} className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500 font-mono">
                        <span className="font-bold text-gray-900">{bar.material}</span>
                        <span>Barra #{index + 1} ({bar.length}mm) {bar.isScrapUsed ? '(Retalho)' : '(Nova)'}</span>
                        <span>Sobra: {bar.waste}mm</span>
                      </div>
                      <div className="h-12 bg-gray-200 rounded-md flex overflow-hidden border border-gray-300 relative">
                        {bar.cuts.map((cut, idx) => (
                          <div
                            key={idx}
                            style={{ width: `${(cut.length / bar.length) * 100}%` }}
                            className="h-full bg-[var(--color-ink)] border-r border-white flex items-center justify-center text-white text-xs font-mono relative group"
                          >
                            <span className="truncate px-1">{cut.length}</span>
                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap z-10">
                              {cut.description || `Peça ${idx + 1}`} - {cut.length}mm
                            </div>
                          </div>
                        ))}
                        {/* Waste */}
                        <div 
                           style={{ width: `${(bar.waste / bar.length) * 100}%` }}
                           className="h-full bg-red-100 flex items-center justify-center text-red-800 text-xs font-mono"
                        >
                           <span className="truncate px-1">{bar.waste}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Not Fit */}
              {result.itemsNotFit.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Itens não otimizados</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                          {result.itemsNotFit.map((item, idx) => (
                            <li key={idx}>
                              {item.material} - {item.length}mm (Muito grande para as barras disponíveis)
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Project */}
              <div className="flex flex-col bg-gray-50 p-4 rounded-lg border border-[var(--color-line)]">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex-1 mr-4">
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700">Nome do Projeto</label>
                    <input
                      type="text"
                      id="project-name"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Ex: Estrutura Galpão A"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end h-full pb-1">
                    <div className="flex items-center">
                      <input
                        id="auto-update-stock"
                        name="auto-update-stock"
                        type="checkbox"
                        checked={autoUpdateStock}
                        onChange={(e) => setAutoUpdateStock(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto-update-stock" className="ml-2 block text-sm text-gray-900">
                        Atualizar estoque automaticamente
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setStep('review')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={handleSaveProject}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Projeto
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
