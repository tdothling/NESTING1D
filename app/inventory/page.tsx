'use client';

import { useState, useEffect, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { getStock, saveStock, deleteStockItem } from '@/lib/store';
import { StockItem } from '@/lib/types';
import { Plus, Trash2, Save, ArrowUpDown, ArrowDown, ArrowUp, Weight, CircleDollarSign, Shapes } from 'lucide-react';
import { toast } from 'sonner';
import { ProfileAutocomplete } from '@/components/ProfileAutocomplete';
import { SteelProfile } from '@/lib/steel-catalog';

export default function InventoryPage() {
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof StockItem; direction: 'asc' | 'desc' } | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'bars' | 'scraps'>('all');

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

  const requestSort = (key: keyof StockItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStock = useMemo(() => {
    let sortableItems = [...stock];

    // 1. Filter by Tab
    if (filterTab === 'bars') {
      sortableItems = sortableItems.filter(item => !item.isScrap);
    } else if (filterTab === 'scraps') {
      sortableItems = sortableItems.filter(item => item.isScrap);
    }

    // 2. Sort
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Custom sort logic for 'weight' which isn't a direct key on StockItem
        if (sortConfig.key === 'weightKgM') {
          aValue = a.quantity * (a.length / 1000) * (a.weightKgM || 0);
          bValue = b.quantity * (b.length / 1000) * (b.weightKgM || 0);
        }

        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stock, sortConfig]);

  const stats = useMemo(() => {
    let totalWeightKg = 0;
    let totalValueRt = 0;
    let scrapWeightKg = 0;

    stock.forEach(item => {
      // Calculate weight based on quantity, length(mm) to (m), and weightKgM
      const itemWeight = (item.quantity * (item.length / 1000) * (item.weightKgM || 0));
      totalWeightKg += itemWeight;

      if (item.isScrap) {
        scrapWeightKg += itemWeight;
      }

      // Calculate value
      if (item.pricePerMeter && item.pricePerMeter > 0) {
        totalValueRt += (item.quantity * (item.length / 1000) * item.pricePerMeter);
      }
    });

    return {
      totalTonnes: (totalWeightKg / 1000).toFixed(2),
      totalValue: totalValueRt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      scrapRatio: totalWeightKg > 0 ? ((scrapWeightKg / totalWeightKg) * 100).toFixed(1) : '0.0'
    };
  }, [stock]);

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

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="border-4 border-[var(--color-ink)] bg-white p-6 space-y-2 group hover:bg-[var(--color-ink)] transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-white opacity-70">Peso Total</span>
                <Weight className="text-[var(--color-accent)] h-5 w-5" />
              </div>
              <p className="font-mono text-4xl font-black text-[var(--color-ink)] group-hover:text-white">{stats.totalTonnes} <span className="text-xl">TON</span></p>
            </div>

            <div className="border-4 border-[var(--color-ink)] bg-white p-6 space-y-2 group hover:bg-[var(--color-ink)] transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-white opacity-70">Valor Imobilizado</span>
                <CircleDollarSign className="text-[var(--color-accent)] h-5 w-5" />
              </div>
              <p className="font-mono text-3xl font-black text-[var(--color-ink)] group-hover:text-white pt-1">{stats.totalValue}</p>
            </div>

            <div className="border-4 border-[var(--color-ink)] bg-white p-6 space-y-2 group hover:bg-[var(--color-ink)] transition-colors">
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] group-hover:text-white opacity-70">Índice de Retalhos / Sucata</span>
                <Shapes className="text-[var(--color-accent)] h-5 w-5" />
              </div>
              <div className="flex items-end gap-3 pt-1">
                <p className="font-mono text-4xl font-black text-[var(--color-ink)] group-hover:text-white">{stats.scrapRatio}%</p>
                <div className="w-full bg-[var(--color-bg)] h-2 mb-2">
                  <div className="bg-[var(--color-accent)] h-2" style={{ width: `${stats.scrapRatio}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section & Filter Tabs */}
          <div className="border-4 border-[var(--color-ink)] bg-white">

            {/* Tabs */}
            <div className="flex border-b-4 border-[var(--color-ink)] bg-[var(--color-bg)]">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-4 font-mono font-black uppercase tracking-widest text-sm border-r-4 border-[var(--color-ink)] transition-colors ${filterTab === 'all' ? 'bg-[var(--color-ink)] text-[var(--color-bg)]' : 'hover:bg-[var(--color-ink)] hover:bg-opacity-10 text-[var(--color-ink)]'}`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setFilterTab('bars')}
                className={`flex-1 py-4 font-mono font-black uppercase tracking-widest text-sm border-r-4 border-[var(--color-ink)] transition-colors ${filterTab === 'bars' ? 'bg-[var(--color-ink)] text-[var(--color-bg)]' : 'hover:bg-[var(--color-ink)] hover:bg-opacity-10 text-[var(--color-ink)]'}`}
              >
                Barras Novas
              </button>
              <button
                onClick={() => setFilterTab('scraps')}
                className={`flex-1 py-4 font-mono font-black uppercase tracking-widest text-sm transition-colors ${filterTab === 'scraps' ? 'bg-[var(--color-ink)] text-[var(--color-bg)]' : 'hover:bg-[var(--color-ink)] hover:bg-opacity-10 text-[var(--color-ink)]'}`}
              >
                Retalhos (Otimizador)
              </button>
            </div>

            <div className="overflow-x-auto pb-4">
              <table className="min-w-full divide-y divide-none">
                <thead className="bg-[var(--color-ink)] text-[var(--color-bg)]">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[30%] min-w-[250px]" onClick={() => requestSort('material')}>
                      Material
                      {sortConfig?.key === 'material' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[15%] min-w-[150px]" onClick={() => requestSort('length')}>
                      Comp. <span className="opacity-50">(mm)</span>
                      {sortConfig?.key === 'length' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[15%] min-w-[150px]" onClick={() => requestSort('quantity')}>
                      Volume
                      {sortConfig?.key === 'quantity' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[15%] min-w-[150px]" onClick={() => requestSort('pricePerMeter')}>
                      R$/metro
                      {sortConfig?.key === 'pricePerMeter' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[15%] min-w-[150px]" onClick={() => requestSort('weightKgM')}>
                      Peso KG
                      {sortConfig?.key === 'weightKgM' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-bold uppercase tracking-widest font-mono border-r border-white border-opacity-20 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors w-[20%] min-w-[180px]" onClick={() => requestSort('isScrap')}>
                      Classificação
                      {sortConfig?.key === 'isScrap' ? (sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" /> : <ArrowDown className="w-4 h-4 inline-block ml-2 text-[var(--color-accent)]" />) : <ArrowUpDown className="w-4 h-4 inline-block ml-2 opacity-30" />}
                    </th>
                    <th scope="col" className="px-4 py-4 text-center text-xs font-bold uppercase tracking-widest font-mono w-[5%] min-w-[80px]">CMD</th>
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
                    sortedStock.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--color-bg)] transition-colors group">
                        <td className="px-4 py-3 border-r-2 border-[var(--color-ink)] border-b-2">
                          <ProfileAutocomplete
                            value={item.material}
                            onChange={(val) => updateItem(item.id, 'material', val)}
                            onSelect={(profile: SteelProfile) => {
                              setStock(current =>
                                current.map(i => i.id === item.id ? {
                                  ...i,
                                  material: profile.name,
                                  profileId: profile.id,
                                  weightKgM: profile.weightKgM
                                } : i)
                              );
                            }}
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
                          <div className="flex items-center">
                            <span className="block w-full bg-transparent border-2 border-transparent sm:text-lg font-black font-mono text-[var(--color-ink)] p-2 text-right">
                              {(item.quantity * (item.length / 1000) * (item.weightKgM || 0)).toFixed(2)}
                            </span>
                            <span className="font-mono text-xs font-bold uppercase tracking-widest opacity-70 ml-2">KG</span>
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
