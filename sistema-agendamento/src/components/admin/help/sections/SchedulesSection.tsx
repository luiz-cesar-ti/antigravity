import React from 'react';
import { Clock, Search, TrendingUp } from 'lucide-react';

export const SchedulesSection: React.FC = () => {
    return (
        <section id="schedules" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-700 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Clock className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Horário de Aulas</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                    <p className="text-gray-600 leading-relaxed text-lg">
                        O preenchimento do <strong>Horário de Aulas</strong> pelo administrador é uma ferramenta estratégica de gestão que vai além do simples registro.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                            <h4 className="font-bold text-indigo-900 text-base md:text-lg mb-3 flex items-center gap-2">
                                <Search className="h-5 w-5" /> Localização em Tempo Real
                            </h4>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                Ao manter os horários atualizados por unidade, a Educação Digital consegue identificar instantaneamente onde o professor está lecionando (sala, laboratório ou ambiente externo).
                            </p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                            <h4 className="font-bold text-emerald-900 text-base md:text-lg mb-3 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" /> Agilidade no Suporte
                            </h4>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                Facilita a entrega e o recolhimento de equipamentos. Sabendo exatamente onde o recurso será utilizado, a Educação Digital ganha eficiência e evita atrasos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
