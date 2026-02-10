import React from 'react';
import { Globe, LayoutDashboard, Shield, FileText } from 'lucide-react';

export const SuperAdminSection: React.FC = () => {
    return (
        <section id="super_admin" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-indigo-950 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Globe className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Super Admin (Global)</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        O Super Admin (Administrador Global) possui o nível mais alto de autoridade no sistema. Sua visão não se restringe a uma única unidade, permitindo o gerenciamento completo de toda a rede de ensino.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 mb-3 flex items-center gap-2 text-lg">
                                <LayoutDashboard className="h-5 w-5" /> Visão Panorâmica e Irrestrita
                            </h3>
                            <p className="text-sm text-indigo-800 leading-relaxed">
                                O Super Admin pode visualizar os <strong className="text-indigo-900">Dashboards</strong>, monitorar <strong className="text-indigo-900">agendamento de professores</strong>, e acessar a lista completa de <strong className="text-indigo-900">Professores e Administradores</strong> de todas as unidades cadastradas no sistema, sem restrições.
                            </p>
                        </div>
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                            <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-lg">
                                <Shield className="h-5 w-5" /> Controle Total de Segurança
                            </h3>
                            <p className="text-sm text-red-800 leading-relaxed">
                                Autonomia total para gerenciamento de acessos. O Super Admin tem a capacidade exclusiva de <strong className="text-red-900">redefinir a senha de qualquer Administrador do sistema</strong>. Além disso, o Super Admin pode gerenciar suas <strong className="text-red-900">próprias credenciais</strong>, assim como todos os outros administradores também possuem autonomia para alterar suas próprias senhas individualmente.
                            </p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-2">Edição de Docentes</h4>
                        <p className="text-xs text-gray-500">Pode alterar nomes, gerenciar unidades e excluir cadastros permanentemente.</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-slate-600" /> Logs de Auditoria (Visão Técnica)
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed mb-4">
                            Ferramenta exclusiva para <strong>Análise Forense</strong>. O sistema grava logs apenas de usuários admin e o <strong>Super Admin é o único que pode visualizá-los</strong>. Oferece acesso ao histórico bruto de operações do banco de dados (JSON), permitindo investigar incidentes de segurança, rastrear alterações de dados e identificar a origem exata de qualquer modificação no sistema.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Viewer JSON Raw</span>
                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Rastreio de IP</span>
                            <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">Diff (Antes/Depois)</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
