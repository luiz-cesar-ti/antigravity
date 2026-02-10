import React from 'react';
import { Bell, UserPlus, Monitor, Trash2, LayoutGrid, X, Clock as LucideHistory } from 'lucide-react';

export const NotificationsSection: React.FC = () => {
    return (
        <section id="notifications" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-600 to-cyan-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Bell className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Sistema de Notificações</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <p className="text-gray-600 text-lg leading-relaxed">
                        O sistema notifica os administradores instantaneamente sobre eventos importantes, como novos cadastros ou solicitações.
                    </p>

                    <div className="space-y-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            Alertas em Tempo Real
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Novos Pedidos */}
                            <div className="bg-pink-50 rounded-2xl p-5 border border-pink-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="bg-pink-100 p-3 rounded-xl text-pink-600">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-exrabold text-pink-900 text-sm mb-1">Novos Usuários</h4>
                                    <p className="text-xs text-pink-800 leading-snug">
                                        Notificação imediata quando um professor realiza o cadastro e aguarda aprovação.
                                    </p>
                                </div>
                            </div>

                            {/* Agendamentos Equipamento */}
                            <div className="bg-cyan-50 rounded-2xl p-5 border border-cyan-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="bg-cyan-100 p-3 rounded-xl text-cyan-600">
                                    <Monitor className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-cyan-900 text-sm mb-1">Reserva de Equipamento</h4>
                                    <p className="text-xs text-cyan-800 leading-snug">
                                        Avisa quando um professor agenda um recurso (Notebooks, Projetores, etc).
                                    </p>
                                </div>
                            </div>

                            {/* Cancelamento Equipamento */}
                            <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="bg-red-100 p-3 rounded-xl text-red-600">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-red-900 text-sm mb-1">Cancelamento (Equip.)</h4>
                                    <p className="text-xs text-red-800 leading-snug">
                                        Alerta quando um usuário desiste de um agendamento de equipamento.
                                    </p>
                                </div>
                            </div>

                            {/* Reserva Salas */}
                            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                                    <LayoutGrid className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-indigo-900 text-sm mb-1">Reserva de Salas</h4>
                                    <p className="text-xs text-indigo-800 leading-snug">
                                        Notificação de uso de espaços físicos (Laboratórios, Auditórios).
                                    </p>
                                </div>
                            </div>

                            {/* Cancelamento Salas */}
                            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 flex items-start gap-4 hover:shadow-md transition-shadow">
                                <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
                                    <X className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-orange-900 text-sm mb-1">Cancelamento (Salas)</h4>
                                    <p className="text-xs text-orange-800 leading-snug">
                                        Informa a liberação de uma sala previamente ocupada.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Política de Retenção - Highlight Card */}
                        <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 mt-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                <Trash2 className="h-32 w-32 text-amber-900 rotate-12" />
                            </div>

                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700 shadow-sm">
                                    <Trash2 className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-amber-900 text-lg">Política de Retenção Automática</h4>
                            </div>

                            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex items-center gap-4 shrink-0">
                                    <span className="text-4xl font-black text-amber-500 leading-none">
                                        7<br /><span className="text-xs tracking-wider">DIAS</span>
                                    </span>
                                    <div className="w-px h-10 bg-amber-100"></div>
                                    <LucideHistory className="h-6 w-6 text-amber-400" />
                                </div>

                                <p className="text-sm text-amber-900 leading-relaxed font-medium">
                                    Para garantir a performance do sistema, todas as notificações são armazenadas por um período de segurança de <strong>7 dias</strong>. Após este prazo, os registros são excluídos permanentemente do banco de dados de forma automática.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
