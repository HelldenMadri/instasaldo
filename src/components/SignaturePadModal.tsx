import React, { useRef, useState, useEffect } from 'react';
import { WorkOrder } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SignaturePadModalProps {
  order: WorkOrder;
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  order,
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#04122e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasDrawn(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">draw</span>
            <div>
              <h3 className="font-headline font-bold text-base leading-tight">
                Assinatura do Cliente
              </h3>
              <p className="text-xs text-slate-300">
                Ordem de Serviço: <span className="font-semibold">{order.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Info Strip */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Cliente:</span>
            <span className="font-semibold text-slate-900">{order.clientName}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Saldo Quitado / Total:</span>
            <span className="font-bold text-emerald-700">{formatCurrency(order.totalValue)}</span>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4 flex flex-col items-center">
          <p className="text-xs text-slate-500 mb-2 text-center">
            Peça para o cliente assinar abaixo com o dedo ou caneta touch:
          </p>

          <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white w-full touch-none relative shadow-inner">
            <canvas
              ref={canvasRef}
              width={460}
              height={200}
              className="w-full h-48 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Guide line */}
            <div className="absolute bottom-8 inset-x-8 border-b border-slate-200 pointer-events-none flex justify-center">
              <span className="text-[10px] text-slate-300 uppercase tracking-widest -mt-4 bg-white px-2">
                Linha de Assinatura
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full mt-2 text-xs">
            <span className="text-slate-400">
              {hasDrawn ? 'Assinatura capturada' : 'Aguardando traço...'}
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-1 py-1 px-2 rounded hover:bg-amber-50"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Limpar Campo
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!hasDrawn}
            onClick={handleSave}
            className={`px-5 py-2.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all ${
              hasDrawn
                ? 'bg-[#006c49] text-white hover:bg-[#005236] active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Confirmar e Concluir OS
          </button>
        </div>
      </div>
    </div>
  );
};
