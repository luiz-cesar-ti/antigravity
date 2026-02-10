import React from 'react';
import { Monitor, CheckCircle2, Clock } from 'lucide-react';

export const EquipmentsSection: React.FC = () => {
    return (
        <section id="equipments" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Monitor className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Cadastro de Equipamentos</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8">
                    <p className="text-gray-600 mb-6 text-base md:text-lg">Módulo para controle de inventário disponível para reserva.</p>
                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                        <h3 className="font-bold text-emerald-900 mb-4">Boas Práticas de Cadastro</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-900">
                                    <strong>Nome Simples:</strong> Use nomes genéricos claros (ex: "Notebook", "Projetor").
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-900">
                                    <strong>Marca/Modelo:</strong> Detalhe a especificação técnica aqui para diferenciar itens (ex: "Dell Inspiron 15", "Epson X41").
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-900">
                                    <strong>Quantidade Total:</strong> Define o limite de reservas simultâneas ("Estoque Virtual"). Se zerar, o item para de aparecer para os professores.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 mt-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700">
                                <Clock className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-emerald-900 text-lg md:text-xl">Coluna "EM USO AGORA" (Monitoramento Real)</h4>
                        </div>
                        <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                            Esta coluna oferece uma visão de <strong>patrimônio em tempo real</strong>. O número exibido indica exatamente quantos equipamentos estão fisicamente ocupados (em aula ou emprestados) <strong>neste exato momento</strong>.
                        </p>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <p className="text-xs md:text-sm text-emerald-800">
                                <strong>Entenda o cálculo:</strong> O sistema verifica o relógio do servidor e cruza com os agendamentos ativos. <br />
                                <span className="italic block mt-1 opacity-80">Exemplo: Se um professor reservou um Notebook das 08:00 às 10:00 e agora são 09:30, o equipamento constará automaticamente como "Em Uso". Às 10:01, ele volta a ficar "Disponível".</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
