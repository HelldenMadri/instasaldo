import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Budget, BudgetItem, ServiceType, BudgetStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const BudgetsView: React.FC = () => {
  const { budgets, clients, addBudget, updateBudget, convertBudgetToOrder } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('instalacao');
  const [items, setItems] = useState<BudgetItem[]>([
    {
      id: 'it-1',
      description: 'Mão de obra técnica de instalação e fixação',
      quantity: 1,
      unitPrice: 800,
      total: 800,
      type: 'mao_de_obra',
    },
    {
      id: 'it-2',
      description: 'Kit de tubulação de cobre e isolamento térmico',
      quantity: 1,
      unitPrice: 350,
      total: 350,
      type: 'material',
    },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [suggestedDepositPercent, setSuggestedDepositPercent] = useState<number>(50);
  const [validUntil, setValidUntil] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');

  // Item helpers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `it-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
        type: 'mao_de_obra',
      },
    ]);
  };

  const handleUpdateItem = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice' | 'type',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === id) {
          const updated = { ...it, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
          }
          return updated;
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = items.reduce((acc, it) => acc + it.total, 0);
  const totalValue = Math.max(0, subtotal - discount);
  const suggestedDeposit = Math.round((totalValue * suggestedDepositPercent) / 100);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedClient = clients.find((c) => c.id === clientId) || clients[0];

    addBudget({
      clientId: selectedClient?.id || clientId,
      clientName: selectedClient?.name || 'Cliente',
      title,
      serviceType,
      items,
      subtotal,
      discount,
      totalValue,
      suggestedDeposit,
      status: 'enviado',
      validUntil,
      notes,
    });

    setIsModalOpen(false);
  };

  const filteredBudgets = budgets.filter(
    (b) =>
      b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Orçamentos Comerciais
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Crie cotações detalhadas de mão de obra e peças, envie ao cliente e converta em Ordem de Serviço com 1 clique.
          </p>
        </div>

        <button
          onClick={() => {
            setClientId(clients[0]?.id || '');
            setTitle('');
            setIsModalOpen(true);
          }}
          className="h-11 px-5 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Novo Orçamento</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (ORC-...), cliente ou título..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredBudgets.length} orçamentos
        </span>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredBudgets.map((budget) => (
          <div
            key={budget.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-[#04122e]">
                      {budget.code}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        budget.status === 'aprovado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : budget.status === 'enviado'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {budget.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800 mt-1">{budget.title}</h3>
                  <span className="text-xs text-slate-500">Cliente: {budget.clientName}</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Validade</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {formatDate(budget.validUntil)}
                  </span>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px]">
                    <tr>
                      <th className="p-2.5">Item / Serviço</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Unitário</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {budget.items.map((it) => (
                      <tr key={it.id}>
                        <td className="p-2.5 font-medium">{it.description}</td>
                        <td className="p-2.5 text-center">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(it.unitPrice)}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Strip */}
              <div className="bg-slate-50 p-3.5 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Sinal Sugerido (Entrada):</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatCurrency(budget.suggestedDeposit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block">Valor Total:</span>
                  <span className="font-headline font-bold text-slate-900 text-base">
                    {formatCurrency(budget.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <select
                  value={budget.status}
                  onChange={(e) => updateBudget(budget.id, { status: e.target.value as BudgetStatus })}
                  className="text-xs px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-semibold"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="recusado">Recusado</option>
                </select>
              </div>

              {budget.convertedToOrderId ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  OS Gerada ({budget.convertedToOrderId})
                </span>
              ) : (
                <button
                  onClick={() => {
                    convertBudgetToOrder(budget.id);
                    alert(`Orçamento aprovado com sucesso! Ordem de Serviço gerada na aba de Ordens.`);
                  }}
                  className="px-4 py-2 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">transform</span>
                  <span>Converter em OS</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar Orçamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
              <h3 className="font-headline font-bold text-base">Novo Orçamento Comercial</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Serviço
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value as ServiceType)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none"
                  >
                    <option value="instalacao">Instalação</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título do Orçamento *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Instalação de 2 Splits 12.000 BTUs Inverter"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Itens e Mão de Obra
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-[#006c49] flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Adicionar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it) => (
                    <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          value={it.description}
                          onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                          placeholder="Descrição do item ou serviço"
                          className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded text-xs text-slate-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleUpdateItem(it.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-xs text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="0.01"
                          value={it.unitPrice}
                          onChange={(e) => handleUpdateItem(it.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Unitário R$"
                          className="w-full h-9 px-2 bg-white border border-slate-200 rounded text-xs text-right font-mono"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {formatCurrency(it.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="w-6 h-6 text-red-400 hover:text-red-600 flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-[#1a2744] text-white p-4 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-300 block">Sinal de Entrada Sugerido (50%):</span>
                  <span className="font-bold text-[#6ffbbe] text-base">
                    {formatCurrency(suggestedDeposit)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-300 block">Valor Total do Orçamento:</span>
                  <span className="font-headline font-bold text-xl text-white">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Salvar e Emitir Orçamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
