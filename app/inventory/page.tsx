'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { getStock, saveStock } from '@/lib/store';
import { StockItem } from '@/lib/types';
import { Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wrap in setTimeout to avoid synchronous state update warning
    const timer = setTimeout(() => {
      setStock(getStock());
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    saveStock(stock);
    toast.success('Estoque salvo com sucesso!');
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

  const removeItem = (id: string) => {
    setStock(stock.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof StockItem, value: any) => {
    setStock(
      stock.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  if (loading) return <div className="p-10 text-center font-mono">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--color-ink)] font-mono">
              Gerenciamento de Estoque
            </h1>
            <div className="flex space-x-4">
              <button
                onClick={addItem}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-ink)] hover:bg-gray-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[var(--color-accent)] hover:bg-orange-600"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </button>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden border border-[var(--color-line)] sm:rounded-lg">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-line)] bg-gray-50 font-mono text-xs uppercase tracking-wider text-gray-500">
              <div className="col-span-4">Material</div>
              <div className="col-span-2">Comprimento (mm)</div>
              <div className="col-span-2">Quantidade</div>
              <div className="col-span-2">Tipo</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {stock.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  O estoque está vazio. Adicione itens para começar.
                </div>
              ) : (
                stock.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.material}
                        onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.length}
                        onChange={(e) => updateItem(item.id, 'length', Number(e.target.value))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.isScrap ? 'scrap' : 'bar'}
                        onChange={(e) => updateItem(item.id, 'isScrap', e.target.value === 'scrap')}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="bar">Barra Nova</option>
                        <option value="scrap">Retalho</option>
                      </select>
                    </div>
                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
