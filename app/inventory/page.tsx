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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Material</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Comp. (mm)</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Qtd</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">R$/metro</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Tipo</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-mono">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stock.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        O estoque está vazio. Adicione itens para começar.
                      </td>
                    </tr>
                  ) : (
                    stock.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={item.material}
                            onChange={(e) => updateItem(item.id, 'material', e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.length}
                            onChange={(e) => updateItem(item.id, 'length', Number(e.target.value))}
                            className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                            className="block w-20 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step="0.01"
                            value={item.pricePerMeter || ''}
                            placeholder="0.00"
                            onChange={(e) => updateItem(item.id, 'pricePerMeter', Number(e.target.value))}
                            className="block w-24 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.isScrap ? 'scrap' : 'bar'}
                            onChange={(e) => updateItem(item.id, 'isScrap', e.target.value === 'scrap')}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          >
                            <option value="bar">Barra Nova</option>
                            <option value="scrap">Retalho</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-900"
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
