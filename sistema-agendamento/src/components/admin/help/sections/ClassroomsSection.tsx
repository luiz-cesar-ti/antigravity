import React from 'react';
import { Building, TrendingUp, MessageSquareQuote } from 'lucide-react';

export const ClassroomsSection: React.FC = () => {
    return (
        <section id="classrooms" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 p-6 md:p-10 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Building className="h-32 w-32" />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <Building className="h-6 w-6 md:h-10 md:w-10" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black tracking-tight">Salas de Aula</h2>
                            <p className="text-cyan-50/80 text-sm md:text-base font-medium mt-1">Adicione e organize seus espaços pedagógicos.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-10 space-y-12">
                    <div className="flex flex-col gap-8">
                        {/* Card Principal de Criação - Full Width with Internal Grid */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-8 md:p-10 shadow-sm hover:shadow-lg transition-all border-l-8 border-l-cyan-500">
                            <div className="mb-8">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-4">Crie salas de aula para permitir agendamentos</h3>
                                <p className="text-cyan-600 font-bold text-sm uppercase tracking-wider mb-8">CRIAÇÃO, EDIÇÃO E ORDENAÇÃO PERSONALIZADA</p>

                                <div className="bg-cyan-50 p-6 rounded-2xl border border-cyan-100 flex gap-4 items-start w-full">
                                    <div className="shrink-0 mt-1 bg-white p-2 rounded-lg shadow-sm">
                                        <Building className="h-6 w-6 text-cyan-600" />
                                    </div>
                                    <p className="text-sm md:text-base font-medium text-cyan-900">
                                        A criação de salas é fundamental, pois define exatamente quais espaços estarão disponíveis para os professores realizarem agendamentos.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl">
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1.5 h-3 w-3 rounded-full bg-cyan-500 shrink-0 shadow-sm shadow-cyan-200"></div>
                                        <span className="text-gray-700 text-sm md:text-base"><strong>Criar e Editar:</strong> Adicione novos laboratórios, salas de vídeo ou auditórios conforme a necessidade da escola.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1.5 h-3 w-3 rounded-full bg-cyan-500 shrink-0 shadow-sm shadow-cyan-200"></div>
                                        <span className="text-gray-700 text-sm md:text-base"><strong>Excluir:</strong> Remova espaços que deixaram de existir.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1.5 h-3 w-3 rounded-full bg-cyan-500 shrink-0 shadow-sm shadow-cyan-200"></div>
                                        <span className="text-gray-700 text-sm md:text-base"><strong>Posicionar (Reordenar):</strong> A ordem definida nesta tela é <strong className="text-gray-900 bg-cyan-100 px-1.5 py-0.5 rounded">exatamente a mesma</strong> que aparecerá para os professores.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div className="mt-1.5 h-3 w-3 rounded-full bg-cyan-500 shrink-0 shadow-sm shadow-cyan-200"></div>
                                        <span className="text-gray-700 text-sm md:text-base">Arraste e solte os cards das salas para definir prioridades. Coloque as salas mais importantes no topo da lista.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Card de Impacto Visual - Full Width below */}
                        <div className="bg-gradient-to-br from-cyan-50 to-white border border-cyan-100 rounded-[2rem] p-8 md:p-12 relative overflow-hidden text-center group">
                            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                                <TrendingUp className="h-96 w-96 text-cyan-800" />
                            </div>

                            <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto">
                                <div className="flex items-center gap-3 mb-8 text-cyan-900 font-bold text-2xl bg-white/50 px-6 py-2 rounded-full backdrop-blur-sm border border-cyan-100 shadow-sm">
                                    <TrendingUp className="h-6 w-6" />
                                    <span>Impacto no Dashboard</span>
                                </div>

                                <div className="relative">
                                    <MessageSquareQuote className="h-12 w-12 text-cyan-200 absolute -top-8 -left-8 -rotate-12" />
                                    <p className="text-xl md:text-2xl text-cyan-900 italic font-medium leading-relaxed">
                                        "A organização correta das salas aprimora a visualização das informações no Dashboard. Isso facilita a análise dos agendamentos de equipamentos por ambiente, permitindo identificar quais salas possuem o maior número de reservas e garantindo uma leitura mais clara e profissional dos dados."
                                    </p>
                                    <MessageSquareQuote className="h-12 w-12 text-cyan-200 absolute -bottom-8 -right-8 rotate-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
