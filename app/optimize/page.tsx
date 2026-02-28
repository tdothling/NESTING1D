'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { Navbar } from '@/components/Navbar';
import { extractTableData } from '@/lib/gemini';
import { parseSpreadsheet } from '@/lib/spreadsheet';
import { getStock, addProject, updateProject, updateStockFromOptimization, getProjects, rollbackStock } from '@/lib/store';
import { CutRequest, StockItem, OptimizationResult, Project } from '@/lib/types';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { StepUploader } from '@/components/optimize/StepUploader';
import { StepReview } from '@/components/optimize/StepReview';
import { StepResults } from '@/components/optimize/StepResults';

function OptimizeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('id');
  const [step, setStep] = useState<'upload' | 'review' | 'results'>('upload');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<CutRequest[]>([]);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [projectName, setProjectName] = useState('');
  const [standardBarLengths, setStandardBarLengths] = useState<Record<string, number>>({});
  const [uniqueMaterials, setUniqueMaterials] = useState<string[]>([]);
  const [autoUpdateStock, setAutoUpdateStock] = useState(true);
  const [maxScrapLength, setMaxScrapLength] = useState(1000);
  const [globalMultiplier, setGlobalMultiplier] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      try {
        setStock(await getStock());

        if (projectId) {
          const projects = await getProjects();
          const loadedProject = projects.find((p: Project) => p.id === projectId);
          if (loadedProject) {
            setProjectName(loadedProject.name);
            setRequests(loadedProject.requests);
            // Restore saved optimization settings
            if (loadedProject.settings) {
              setStandardBarLengths(loadedProject.settings.standardBarLengths);
              setMaxScrapLength(loadedProject.settings.maxScrapLength);
            }
            if (loadedProject.result) {
              setResult(loadedProject.result);
              setStep('results');
            } else {
              setStep('review');
            }
          } else {
            toast.error('Projeto não encontrado');
          }
        }
      } catch (error) {
        console.error("Error loading project/stock data", error);
      }
    };
    loadData();
  }, [projectId]);

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

  const handleDrop = async (acceptedFiles: File[]) => {
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
  };

  const handleSpreadsheet = async (file: File) => {
    setLoading(true);
    try {
      const data = await parseSpreadsheet(file);
      setRequests(data);
      setStep('review');
      toast.success(`${data.length} itens importados da planilha!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao ler a planilha.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (requests.length === 0) {
      toast.error('Adicione itens para cortar.');
      return;
    }

    setLoading(true);
    try {
      let currentStock = stock;
      if (projectId) {
        await rollbackStock(projectId);
        currentStock = await getStock();
        setStock(currentStock);
      }

      const settings = {
        standardBarLengths,
        defaultStandardLength: 6000,
        kerf: 3,
        maxScrapLength: maxScrapLength
      };

      // Instancia o Web Worker (a partir da pasta public/ ou empacotado pelo Webpack)
      // Como estamos no Next.js (App Router), uma forma de importar o Worker nativamente é:
      const worker = new Worker(new URL('../../lib/worker.ts', import.meta.url));

      worker.onmessage = (e) => {
        const { type, payload, error } = e.data;

        if (type === 'SUCCESS') {
          const optimization = payload;
          setResult({
            bars: optimization.results,
            totalWaste: optimization.results.reduce((acc: any, bar: any) => acc + bar.waste, 0),
            totalTrueWaste: optimization.totalTrueWaste,
            totalTrueWasteKg: optimization.totalTrueWasteKg,
            totalReusableScrap: optimization.totalReusableScrap,
            totalStockUsed: optimization.results.length,
            itemsNotFit: optimization.itemsNotFit,
            purchaseList: optimization.purchaseList
          });
          setStep('results');
          toast.success('Otimização concluída!');
        } else {
          toast.error(error || 'Erro na otimização.');
        }

        setLoading(false);
        worker.terminate();
      };

      worker.onerror = (err) => {
        console.error("Worker error:", err);
        toast.error('Erro catastrófico no Worker.');
        setLoading(false);
        worker.terminate();
      };

      // Dispara o algoritmo pesado no background
      worker.postMessage({
        requests,
        currentStock,
        settings
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro na otimização.');
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!result) return;
    setLoading(true);

    try {
      const project: Project = {
        id: projectId || crypto.randomUUID(),
        name: projectName || `Projeto ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        requests,
        result,
        settings: {
          standardBarLengths,
          maxScrapLength
        }
      };

      if (projectId) {
        await updateProject(project);
      } else {
        await addProject(project);
      }

      if (autoUpdateStock) {
        await updateStockFromOptimization(result, project.id);
        toast.success(projectId ? 'Projeto atualizado e estoque modificado!' : 'Projeto salvo e estoque atualizado!');
      } else {
        toast.success(projectId ? 'Projeto atualizado!' : 'Projeto salvo!');
      }

      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar o projeto.');
      setLoading(false);
    }
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

  const applyMultiplier = () => {
    if (globalMultiplier <= 1) return;
    setRequests(requests.map(req => ({
      ...req,
      quantity: req.quantity * globalMultiplier
    })));
    toast.success(`Quantidades multiplicadas por ${globalMultiplier}!`);
    setGlobalMultiplier(1);
  };

  const handleDownloadPDF = () => {
    if (!result || !result.purchaseList) return;

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Lista de Compras - NESTING1D', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Projeto: ${projectName || 'Novo Projeto'}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 14, 35);

    if (result.purchaseList.length === 0) {
      doc.text('Nenhuma compra necessária para este projeto.', 14, 45);
    } else {
      const tableColumn = ["Material", "Comprimento (mm)", "Quantidade"];
      const tableRows = result.purchaseList.map(item => [
        item.material,
        item.length.toString(),
        item.quantity.toString()
      ]);

      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });
    }

    doc.save(`Lista_Compras_${projectName || 'Projeto'}.pdf`);
  };

  const handleSendWhatsApp = () => {
    if (!result || !result.purchaseList) return;

    let message = `🛒 *Lista de Compras - NESTING1D*\n`;
    message += `📁 Projeto: ${projectName || 'Novo Projeto'}\n\n`;

    if (result.purchaseList.length === 0) {
      message += `Tudo certo! Nenhuma compra necessária.\n`;
    } else {
      result.purchaseList.forEach((item, index) => {
        message += `*${index + 1}. ${item.material}*\n`;
        message += `📏 Comp: ${item.length}mm | 📦 Qtd: ${item.quantity}\n\n`;
      });
    }

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
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

          {step === 'upload' && (
            <StepUploader
              onDrop={handleDrop}
              onSpreadsheet={handleSpreadsheet}
              loading={loading}
              onManualEntry={() => {
                setRequests([]);
                setStep('review');
              }}
            />
          )}

          {step === 'review' && (
            <StepReview
              requests={requests}
              globalMultiplier={globalMultiplier}
              setGlobalMultiplier={setGlobalMultiplier}
              applyMultiplier={applyMultiplier}
              updateRequest={updateRequest}
              addRequest={addRequest}
              removeRequest={removeRequest}
              uniqueMaterials={uniqueMaterials}
              standardBarLengths={standardBarLengths}
              setStandardBarLengths={setStandardBarLengths}
              maxScrapLength={maxScrapLength}
              setMaxScrapLength={setMaxScrapLength}
              onBack={() => setStep('upload')}
              onOptimize={handleOptimize}
              loading={loading}
            />
          )}

          {step === 'results' && result && (
            <StepResults
              result={result}
              projectName={projectName}
              projectId={projectId}
              setProjectName={setProjectName}
              autoUpdateStock={autoUpdateStock}
              setAutoUpdateStock={setAutoUpdateStock}
              stock={stock}
              onBack={() => setStep('review')}
              onSave={handleSaveProject}
              onDownloadPDF={handleDownloadPDF}
              onWhatsApp={handleSendWhatsApp}
              loading={loading}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default function OptimizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center p-4">Carregando...</div>}>
      <OptimizeContent />
    </Suspense>
  );
}
