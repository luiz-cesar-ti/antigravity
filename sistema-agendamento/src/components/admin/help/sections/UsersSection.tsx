import React from 'react';
import { Users, Search, Settings, FileText, LayoutGrid, Calendar } from 'lucide-react';

export const UsersSection: React.FC = () => {
    return (
        <section id="users" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Users className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Gestão de Usuários</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* Coluna Esquerda: Funções Admin */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 text-lg">Funções do Administrador</h3>

                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white p-2 rounded-lg text-orange-600 shadow-sm border border-orange-100">
                                        <Search className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-bold text-orange-900">Reset de Senha</h4>
                                </div>
                                <p className="text-sm text-orange-800 leading-relaxed">
                                    O Admin <strong>NÃO</strong> redefine senhas manualmente. O próprio usuário deve clicar em "Esqueci a Senha" na tela de login.
                                </p>
                            </div>

                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="bg-white p-2 rounded-lg text-indigo-600 shadow-sm border border-indigo-100">
                                        <Settings className="h-5 w-5" />
                                    </div>
                                    <h4 className="font-bold text-indigo-900">Edição de Dados Cadastrais</h4>
                                </div>
                                <p className="text-sm text-indigo-800 leading-relaxed mb-4">
                                    O Administrador possui controle total para corrigir dados sensíveis do professor caso haja erros no cadastro inicial:
                                </p>

                                <div className="space-y-3">
                                    {/* TOTVS & Nome */}
                                    <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <strong className="text-indigo-900 text-xs block mb-0.5">Correção de Identidade</strong>
                                            <p className="text-xs text-indigo-700 leading-snug">
                                                É possível alterar o <strong className="text-indigo-950">Nome Completo</strong> e o <strong className="text-indigo-950">Número de Matrícula (TOTVS)</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Cargo */}
                                    <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <strong className="text-indigo-900 text-xs block mb-0.5">Alteração de Cargo</strong>
                                            <p className="text-xs text-indigo-700 leading-snug">
                                                Permite atualizar a função do usuário (ex: de Professor para Coordenador) para refletir corretamente nos documentos.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Unidades */}
                                    <div className="bg-white p-3 rounded-xl border border-indigo-100 flex items-start gap-3">
                                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 mt-0.5">
                                            <LayoutGrid className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <strong className="text-indigo-900 text-xs block mb-0.5">Gestão de Unidades</strong>
                                            <p className="text-xs text-indigo-700 leading-snug">
                                                Inclua ou remova o acesso a escolas específicas instantaneamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Hierarquia */}
                        <div className="bg-purple-50/50 p-6 rounded-[2.5rem] border border-purple-100">
                            <h3 className="font-bold text-purple-900 mb-6 text-sm uppercase tracking-widest">HIERARQUIA</h3>

                            <div className="space-y-4">
                                <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                                    <h4 className="font-bold text-purple-900 mb-1">Administrator</h4>
                                    <p className="text-sm text-purple-800">Acesso total à unidade: dashboards, agendamentos e inventário.</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-1">Super Admin</h4>
                                    <p className="text-sm text-blue-800">Visão global de todas as unidades e gestão de administradores.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agendamento Recorrente */}
                    <div className="bg-purple-50 rounded-[2.5rem] p-6 md:p-8 border border-purple-100">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-white p-2 rounded-xl text-purple-600 shadow-sm">
                                <Calendar className="h-6 w-6" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-purple-900">Agendamento Recorrente</h3>
                        </div>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            Permite que um professor tenha um agendamento fixo semanal (ex: Toda Quinta às 08:00).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-gray-900 mb-3 text-lg">Renovação Mensal</h4>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    O sistema gera os agendamentos automáticos <strong className="text-gray-900">apenas até o final do mês atual</strong>. No início de cada mês, o professor deve realizar um novo agendamento.
                                </p>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Isso garante que um <strong>novo Termo de Responsabilidade</strong>, com as datas atualizadas, seja assinado mensalmente, aumentando a segurança jurídica.
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                                <span className="absolute top-0 right-0 bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">Regra de Ouro</span>
                                <h4 className="font-bold text-gray-900 mb-3 text-lg pr-20">Permissão de Acesso</h4>
                                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                    <strong className="text-gray-900">Exclusivo de Admins:</strong> Apenas um Administrador pode liberar essa função para um professor. Para ativar, vá na lista de usuários e clique no botão de <strong>Opções (três pontos)</strong> ou <strong>Editar</strong> no card do professor.
                                </p>
                                <p className="text-xs text-purple-600 italic bg-purple-50 p-3 rounded-xl border border-purple-100 leading-relaxed">
                                    "Um Admin de uma unidade só pode conceder permissão de recorrência para professores daquela mesma unidade. Se o professor atua em outra escola, o Admin de lá é quem deve liberar."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
