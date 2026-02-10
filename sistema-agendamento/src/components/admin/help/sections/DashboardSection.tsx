import React from 'react';
import { Monitor, TrendingUp, PieChart, Filter, Users, Trophy, Building } from 'lucide-react';

export const DashboardSection: React.FC = () => {
    return (
        <section id="dashboard" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Monitor className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Dashboard</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-6">
                    <p className="text-gray-600 leading-relaxed">
                        O Dashboard é a central de inteligência da sua unidade. Utilize os gráficos para entender o comportamento de uso e otimizar a distribuição de recursos.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-blue-100 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base md:text-lg">Indicadores de Pico</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Gráficos de barras e linhas mostram os dias de maior demanda nos agendamentos.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-green-100 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                    <PieChart className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base md:text-lg">Equipamentos Mais Utilizados</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                Ranking dinâmico dos itens com maior volume de reservas.
                            </p>
                            <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-xs text-green-800">
                                <strong>Legenda:</strong> Quanto maior a fatia no gráfico, maior foi a frequência de agendamento daquele equipamento no período.
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-indigo-100 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Filter className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base md:text-lg">Status dos Agendamentos</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-2">
                                Visão geral da situação das reservas.
                            </p>
                            <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-xs text-indigo-800">
                                <strong>Legenda:</strong> Diferencia agendamentos ativos, concluídos, recorrentes ou cancelados.
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-purple-100 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                    <Users className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base md:text-lg">Busca Inteligente</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Pesquise docentes pelo Nome ou TOTVS para visualizar um relatório individual de analytics.
                            </p>
                        </div>

                        <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-amber-100 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Trophy className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-base md:text-lg">Top Docentes</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Ranking dos professores que mais utilizam os recursos da unidade no período selecionado.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-teal-100 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                <Building className="h-5 w-5" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-base md:text-lg">Top 3 Salas de Aula</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-3">
                            O gráfico destaca as 3 salas com maior volume de agendamentos de equipamentos, mas também permite selecionar qualquer outro ambiente para uma análise completa. Essa ferramenta centraliza a gestão por sala, detalhando com precisão <strong>quem</strong> reservou, <strong>quando</strong> e <strong>o que</strong> será utilizado.
                        </p>
                        <div className="bg-teal-50 p-2 rounded-lg border border-teal-100 text-xs text-teal-800">
                            <strong>Exportação CSV:</strong> Ao clicar em uma sala, o administrador pode exportar um arquivo exclusivo daquele ambiente. Isso garante acesso rápido ao histórico de responsáveis, facilitando auditorias.
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
