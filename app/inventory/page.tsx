'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { getStock, saveStock, deleteStockItem } from '@/lib/store';
import { StockItem } from '@/lib/types';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStock = async () => {
      setLoading(true);
      try {
        const data = await getStock();
        setStock(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadStock();
  }, []);

  const handleSave = async () => {
    await saveStock(stock);
    toast.success('Estoque salvo e sincronizado na nuvem!');
  };

  const addItem = () => {
    const newItem: StockItem = {
      id: crypto.randomUUID(),
      material: 'Aço Carbono',
      length: 6000,
      quantity: 1,
      isScrap: false,
    };
    setStock([...stock, newItem]);
  };

  const removeItem = async (id: string) => {
    await deleteStockItem(id);
    setStock(stock.filter((item) => item.id !== id));
    toast.success('Item removido com sucesso!');
  };

  const updateItem = (id: string, field: keyof StockItem, value: any) => {
    setStock(
      stock.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen bg-[var(--color-bg)]">
      <div className="border-2 border-[var(--color-ink)] border-dashed p-12">
        <div className="font-mono text-[var(--color-ink)] animate-pulse">CARREGANDO BASE DE ESTOQUE...</div>
      </div>
    </div>
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
                  Inventário
                </h1>
                <p className="font-mono text-sm opacity-70 uppercase tracking-widest mt-1">Controle Físico de Material</p>
              </div>
            </div>
            <div className="flex space-x-4 w-full sm:w-auto">
              <button
                onClick={addItem}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 border-2 border-[var(--color-ink)] text-sm font-bold uppercase tracking-widest text-[var(--color-ink)] bg-transparent hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)] transition-colors active:scale-95 group font-mono"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Novo Lote
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 border-2 border-[var(--color-ink)] text-sm font-bold uppercase tracking-widest bg-[var(--color-ink)] text-[var(--color-bg)] hover:bg-[var(--color-accent)] hover:border-[var(--color-accent)] hover:text-white transition-colors active:scale-95 group font-mono"
              >
                <Save className="h-4 w-4 mr-2" />
                Gravar
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="border-4 border-[var(--color-ink)] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-none">
                <thead className="bg-[var(--color-ink)] text-[var(--color-bg)]">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20">Material</th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20">Comprimento <span className="opacity-50">(mm)</span></th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20">Volume</th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20">R$/metro</th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20">Classificação</th>
                    <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest font-mono">CMD</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-4 divide-[var(--color-ink)] divide-opacity-10">
                  {stock.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center border-b-2 border-dashed border-[var(--color-ink)] bg-[var(--color-bg)]">
                        <div className="flex flex-col items-center justify-center opacity-60">
                          <span className="font-mono font-black text-2xl uppercase tracking-widest mb-2 text-[var(--color-ink)]">ESTOQUE VAZIO</span>
                          <span className="font-mono text-sm font-bold uppercase tracking-widest max-w-md text-[var(--color-ink)]">NENHUMA MATÉRIA-PRIMA REGISTRADA. CLIQUE EM "NOVO LOTE" PARA INICIAR.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    stock.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--color-bg)] transition-colors group">
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <input
                            type="text"
                            value={item.material}
                            onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                            className="block w-full bg-transparent border-2 border-transparent hover:border-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-0 sm:text-base font-mono font-black uppercase text-[var(--color-ink)] transition-colors p-2"
                          />
                        </td>
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={item.length}
                              onChange={(e) => updateItem(item.id, 'length', Number(e.target.value))}
                              className="block w-full bg-transparent border-2 border-transparent hover:border-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-0 sm:text-xl font-black font-mono text-[var(--color-ink)] transition-colors p-2 text-right"
                            />
                            <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 ml-2">MM</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <div className="flex items-center">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                              className="block w-full bg-transparent border-2 border-transparent hover:border-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-0 sm:text-xl font-black font-mono text-[var(--color-ink)] transition-colors p-2 text-right"
                            />
                            <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 ml-2">UN</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <div className="flex items-center">
                            <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 mr-2">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={item.pricePerMeter || ''}
                              placeholder="0.00"
                              onChange={(e) => updateItem(item.id, 'pricePerMeter', Number(e.target.value))}
                              className="block w-full bg-transparent border-2 border-transparent hover:border-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none focus:ring-0 sm:text-base font-black font-mono text-[var(--color-ink)] transition-colors p-2 text-right"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <div className="relative">
                            <select
                              value={item.isScrap ? 'scrap' : 'bar'}
                              onChange={(e) => updateItem(item.id, 'isScrap', e.target.value === 'scrap')}
                              className="block w-full bg-transparent border-2 border-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-0 sm:text-sm font-mono font-black uppercase tracking-widest p-3 cursor-pointer appearance-none hover:bg-[var(--color-ink)] hover:text-white transition-colors"
                            >
                              <option value="bar" className="bg-white text-[var(--color-ink)]">BARRA BRUTA</option>
                              <option value="scrap" className="bg-white text-[var(--color-ink)]">RETALHO</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[var(--color-ink)] group-hover:text-white">
                              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center border-b-2 border-[var(--color-ink)] relative bg-red-50 sm:bg-transparent">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-3 text-red-600 sm:text-[var(--color-ink)] sm:opacity-50 hover:opacity-100 hover:bg-red-600 hover:text-white transition-all active:scale-95 inline-flex justify-center items-center w-full sm:w-auto h-full absolute inset-0 sm:relative"
                            title="REMOVER REGISTRO"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
