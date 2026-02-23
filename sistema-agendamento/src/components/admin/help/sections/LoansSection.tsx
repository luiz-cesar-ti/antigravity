import React from 'react';
import { ClipboardCheck, FileText, AlertTriangle } from 'lucide-react';

export const LoansSection: React.FC = () => {
    return (
        <section id="loans" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <ClipboardCheck className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Central de Empréstimos</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-2">Propósito</h3>
                        <p className="text-gray-600 leading-relaxed text-base">
                            Diferente do agendamento, o Empréstimo foca na <strong className="text-gray-900">retirada física</strong> de equipamentos do estoque, geralmente para uso externo, eventos ou terceiros.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-3 text-amber-600">
                                <FileText className="h-5 w-5" />
                                <h4 className="font-bold text-gray-900">1. Geração de Termo</h4>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                O Admin preenche manualmente um pequeno formulário com as informações do solicitante. O sistema então gera um PDF formal onde o <strong className="text-gray-700">CPF deve ser preenchido à mão</strong> no ato da assinatura.
                            </p>
                        </div>
                        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
                            <div className="flex items-center gap-2 mb-3 text-amber-600">
                                <AlertTriangle className="h-5 w-5" />
                                <h4 className="font-bold text-gray-900">2. Baixa no Estoque</h4>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Itens emprestados são reduzidos no inventário. Ao devolver, o estoque é reposto automaticamente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
