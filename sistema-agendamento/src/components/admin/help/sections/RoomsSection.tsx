import React from 'react';
import { LayoutGrid, Settings, CheckCircle2, Power, AlertTriangle, Info, TrendingUp, Plus, ClipboardCheck, Trash2, Timer } from 'lucide-react';

export const RoomsSection: React.FC = () => {
    return (
        <section id="rooms" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-teal-600 to-teal-800 p-6 md:p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <LayoutGrid className="h-32 w-32" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <LayoutGrid className="h-6 w-6 md:h-10 md:w-10" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Gestão de Salas e Espaços</h2>
                            <p className="text-teal-50/80 text-sm md:text-base font-medium mt-1">Controle total da sua infraestrutura na palma da mão.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-12">
                    <div className="max-w-4xl">
                        <p className="text-gray-600 leading-relaxed text-sm md:text-base font-medium">
                            A função de Gestão de Salas permite que o administrador transforme espaços físicos em recursos inteligentes de agendamento. Esta ferramenta concede controle absoluto sobre a disponibilidade de salas , permitindo que os professores explorem novas possibilidades pedagógicas em ambientes otimizados e organizados.
                        </p>
                    </div>

                    {/* Activation Flow */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        <div className="bg-teal-50/50 rounded-[2rem] p-8 border border-teal-100 flex flex-col">
                            <h3 className="text-lg md:text-xl font-bold text-teal-900 mb-6 flex items-center gap-3">
                                <div className="p-2 bg-teal-600 rounded-xl text-white">
                                    <Settings className="h-5 w-5" />
                                </div>
                                Ativação da Função
                            </h3>
                            <div className="space-y-6 flex-1 text-teal-900/80 group">
                                <p className="text-sm leading-relaxed">
                                    Para ativar a função de <strong>Agendamento de salas</strong> é necessário ir até a página <strong>Salas</strong>, <strong>Gerenciar salas</strong> e ativar a função <strong>Sistema de Reservas de Salas</strong>.
                                </p>
                                <div className="bg-white/80 border-2 border-dashed border-teal-200 p-5 rounded-2xl transition-all group-hover:border-teal-400 group-hover:bg-white">
                                    <div className="flex gap-4 items-center mb-3">
                                        <CheckCircle2 className="h-6 w-6 text-teal-500" />
                                        <span className="font-bold text-teal-900 uppercase text-xs tracking-widest">Efeito Imediato</span>
                                    </div>
                                    <p className="text-xs leading-relaxed text-gray-600">
                                        Ao ativar, o link <strong className="text-teal-700">"Salas"</strong> aparecerá instantaneamente no menu superior de todos os professores vinculados à sua unidade. Isso abre o acesso ao portal de reservas específico para espaços físicos.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 rounded-[2rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-red-200/50 animate-in fade-in zoom-in duration-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse" />

                            <h3 className="text-lg md:text-xl font-bold mb-8 flex items-center gap-4 relative z-10">
                                <div className="p-3.5 bg-white/20 rounded-2xl text-white backdrop-blur-md border border-white/30 shadow-xl animate-pulse">
                                    <Power className="h-6 w-6" />
                                </div>
                                Disponibilidade de Sala
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <p className="text-red-50/90 text-sm md:text-base leading-relaxed font-medium">
                                    Agora você pode desativar uma sala temporariamente (para manutenção ou eventos externos) sem precisar excluí-la do sistema.
                                </p>
                                <ul className="grid grid-cols-1 gap-3">
                                    <li className="flex items-center gap-4 text-xs md:text-sm bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all hover:translate-x-2 group/item">
                                        <div className="p-2 bg-white/10 rounded-xl group-hover/item:scale-110 transition-transform"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                                        <span className="font-bold tracking-tight">Preserva o histórico e dados da sala</span>
                                    </li>
                                    <li className="flex items-center gap-4 text-xs md:text-sm bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all hover:translate-x-2 group/item">
                                        <div className="p-2 bg-white/10 rounded-xl group-hover/item:scale-110 transition-transform"><AlertTriangle className="h-4 w-4 text-white" /></div>
                                        <span className="font-bold tracking-tight">Bloqueia novos agendamentos imediatamente</span>
                                    </li>
                                    <li className="flex items-center gap-4 text-xs md:text-sm bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all hover:translate-x-2 group/item">
                                        <div className="p-2 bg-white/10 rounded-xl group-hover/item:scale-110 transition-transform"><Info className="h-4 w-4 text-white" /></div>
                                        <span className="font-bold tracking-tight">Aparece como "Indisponível" para o professor</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Reservations and Monitoring */}
                    <div className="space-y-6">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-3 ml-2">
                            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-200">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            Monitoramento e Ciclo de Reservas
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100">
                                    <Plus className="h-6 w-6 text-blue-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Criação Dinâmica</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    Toda reserva cria um registro em tempo real. O sistema valida automaticamente se a sala está livre no horário escolhido, evitando <strong>conflitos de agenda</strong>.
                                </p>
                            </div>

                            <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100">
                                    <ClipboardCheck className="h-6 w-6 text-emerald-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Visão do Admin</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    Através da aba <strong>"Ver Agendamentos"</strong>, o admin monitora quem reservou, em qual unidade e o período exato.
                                </p>
                            </div>

                            <div className="p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-4 border border-red-100">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <h4 className="font-bold text-gray-900 mb-2">Gestão de Conflitos</h4>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                    Em situações urgentes, o administrador pode cancelar qualquer agendamento de sala diretamente através do card do professor, utilizando o botão de exclusão disponível em cada reserva.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 group shadow-2xl shadow-indigo-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <Timer className="h-48 w-48 text-white rotate-12" />
                        </div>

                        <div className="bg-white/10 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/20 relative w-64 h-40 flex flex-col items-center justify-center gap-4 transition-transform group-hover:scale-105 duration-500 shrink-0">
                            <div className="absolute top-4 left-4 flex gap-1.5 font-black text-[8px] uppercase tracking-tighter text-indigo-100">
                                <div className="h-2 w-2 rounded-full bg-indigo-300 animate-pulse" /> Novo Recurso
                            </div>
                            <Timer className="h-12 w-12 text-white/90" />
                            <span className="block text-xl md:text-2xl font-black text-white tracking-tight">Antecedência</span>
                        </div>

                        <div className="flex-1 relative z-10">
                            <h4 className="text-xl md:text-2xl font-black text-white mb-2">Controle de Antecedência</h4>
                            <p className="text-sm text-indigo-50 leading-relaxed mb-6 font-medium">
                                Agora você dita o ritmo. Configure um tempo mínimo de antecedência para reservas ou desative a regra para permitir agendamentos de última hora. Flexibilidade total para coordenar sua unidade.
                            </p>

                            <div className="bg-indigo-900/30 p-3 rounded-xl border border-indigo-400/30 flex gap-3 text-xs text-indigo-100 italic">
                                <div className="shrink-0 p-1 bg-indigo-500 rounded-full h-fit mt-0.5">
                                    <CheckCircle2 className="h-3 w-3 text-white" />
                                </div>
                                <p>
                                    <strong>Feedback Inteligente:</strong> Quando ativo, o sistema avisa o professor sobre o tempo mínimo exigido diretamente no card da sala, evitando frustrações.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
