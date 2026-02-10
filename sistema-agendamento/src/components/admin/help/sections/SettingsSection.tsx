import React from 'react';
import { Settings, Clock, KeyRound } from 'lucide-react';

export const SettingsSection: React.FC = () => {
    return (
        <section id="settings" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Settings className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Configurações do Sistema</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-6">
                    <p className="text-gray-600 leading-relaxed">
                        Área destinada à personalização de parâmetros operacionais da unidade, garantindo que o sistema se adapte às necessidades logísticas da escola.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Regra de Antecedência */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg md:text-xl">Regra de Antecedência de Agendamentos</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                Define o tempo mínimo (em horas) que o professor deve respeitar para realizar um agendamento.
                            </p>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                                    <strong className="text-blue-900">Por que usar?</strong> Esta trava é estratégica para garantir que a equipe de <strong className="text-blue-900">Educação Digital</strong> tenha tempo hábil para organizar e preparar os equipamentos ou salas antes do início da aula.
                                </p>
                            </div>
                        </div>

                        {/* Segurança e Senha */}
                        <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-purple-50 p-2 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                    <KeyRound className="h-6 w-6" />
                                </div>
                                <h4 className="font-bold text-gray-900 text-lg md:text-xl">Segurança de Acesso</h4>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                O Administrador possui total autonomia para gerenciar suas próprias credenciais.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2 text-xs text-gray-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                                    <p>O administrador consegue redefinir a sua própria senha <strong className="text-gray-700">diretamente nas configurações do painel admin</strong>.</p>
                                </div>
                                <div className="flex items-start gap-2 text-xs text-gray-500">
                                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></div>
                                    <p>Caso perca o acesso total, é necessário <strong className="text-gray-700">solicitar ao Super Admin</strong> o reset imediato da senha.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
