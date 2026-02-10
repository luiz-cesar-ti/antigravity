import React from 'react';
import { Calendar, Trash2 } from 'lucide-react';

export const BookingsSection: React.FC = () => {
    return (
        <section id="bookings" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Calendar className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Gerenciamento de Agendamentos</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4">Status do Card de Agendamento</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                <span className="text-[10px] md:text-sm font-black text-green-700 bg-green-100 px-2 py-1 rounded mb-2 inline-block">ATIVO</span>
                                <p className="text-xs md:text-sm text-green-800 leading-tight">Reserva válida e futura. Equipamento reservado.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                <span className="text-[10px] md:text-sm font-black text-blue-700 bg-blue-100 px-2 py-1 rounded mb-2 inline-block">CONCLUÍDO</span>
                                <p className="text-xs md:text-sm text-blue-800 leading-tight">Data/Hora já passaram. Encerramento automático.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                <span className="text-[10px] md:text-sm font-black text-red-700 bg-red-100 px-2 py-1 rounded mb-2 inline-block">EXCLUÍDO PELO DOCENTE</span>
                                <p className="text-xs md:text-sm text-red-800 leading-tight">Professor tirou da visão dele. Admin ainda vê.</p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                <span className="text-[10px] md:text-sm font-black text-amber-700 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">RECORRENTE</span>
                                <p className="text-xs md:text-sm text-amber-800 leading-tight">Fixo semanal. Criável até o final do mês corrente.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                            <Trash2 className="h-5 w-5 text-red-500" /> Fluxo de Exclusão
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2 text-sm">Pelo Professor</h4>
                                <p className="text-xs md:text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                    O professor pode cancelar um agendamento para sua organização, mas esse registro continuará visível para o administrador, identificado com o status <strong className="text-red-600 ml-1">Excluído pelo Professor</strong>.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2 text-sm">Pelo Administrador</h4>
                                <p className="text-xs md:text-sm text-red-900 leading-relaxed bg-red-50 p-4 rounded-xl">
                                    O administrador também pode excluir agendamentos se necessário. Por segurança, todos os registros (mesmo os excluídos) permanecem salvos no banco de dados por <strong>365 dias</strong> para fins de auditoria.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
