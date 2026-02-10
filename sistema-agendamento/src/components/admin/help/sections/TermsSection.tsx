import React from 'react';
import { FileText, Shield, ShieldCheck, AlertTriangle, Lock, Trash2 } from 'lucide-react';

export const TermsSection: React.FC = () => {
    return (
        <section id="terms" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-600 to-rose-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <FileText className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Termo de Responsabilidade</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                        Todo agendamento realizado no sistema gera automaticamente um <strong>Documento Jurídico Digital</strong> que vincula o professor aos equipamentos reservados.
                    </p>

                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                        <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                            <Shield className="h-5 w-5" /> Autenticidade e Segurança (ID Único)
                        </h3>
                        <p className="text-sm text-rose-800 mb-6">
                            Para garantir a segurança e a validade jurídica de cada operação, o sistema utiliza um mecanismo triplo de <strong>Rastreabilidade e Integridade</strong>.
                        </p>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">ID DO TERMO</span>
                                    <p className="text-xs font-bold text-gray-700 mt-1">Código UUID único impresso, vinculado permanentemente ao banco.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">VERSÃO DO TERMO</span>
                                    <p className="text-xs font-bold text-gray-700 mt-1">Identifica o contrato legal vigente no ato da assinatura.</p>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">HASH SHA-256</span>
                                    <p className="text-xs font-bold text-gray-700 mt-1">Impressão digital matemática que prova a integridade do conteúdo.</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-rose-900 bg-rose-100/50 p-3 rounded-lg border border-rose-200 text-center">
                                <ShieldCheck className="h-3 w-3 inline mr-1 text-rose-600" />
                                Rodapé Centralizado: Todas estas informações são exibidas de forma clara e centralizada no final do PDF para facilitar auditorias rápidas ou verificações manuais de autenticidade.
                            </p>
                        </div>
                    </div>

                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                        <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                            <FileText className="h-5 w-5" /> Composição de Dados e Privacidade
                        </h3>
                        <div className="bg-white p-4 rounded-xl border border-rose-200">
                            <p className="text-sm text-gray-700 mb-4">
                                <strong>Dados inclusos no documento:</strong> Data, hora exata da reserva, lista de equipamentos, unidade e nome do responsável.
                            </p>
                            <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 flex gap-3 text-xs text-rose-900">
                                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                                <p>
                                    <strong>Garantia de Privacidade (LGPD):</strong> No Termo de Empréstimo, o campo <strong>CPF</strong> é de preenchimento manual obrigatório no ato da assinatura. Para proteção de dados do professor, essa informação <strong>não é armazenada</strong> no banco de dados do sistema em hipótese alguma.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4">Tipos de Termo</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                                <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded mb-3 inline-block">PADRÃO</span>
                                <h4 className="font-bold text-gray-900 mb-2">Termo de Agendamento</h4>
                                <p className="text-sm text-gray-600">
                                    Agendamentos padrão são aqueles que o professor faz cadastro no sistema e realiza um agendamento de um equipamento para pesquisas pedagógicas entre o professor e os alunos no dia a dia.
                                </p>
                            </div>
                            <div id="term-recurrent-card" className="bg-purple-50 border border-purple-100 p-5 rounded-3xl">
                                <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded mb-3 inline-block">RECORRENTE</span>
                                <h4 className="font-bold text-gray-900 mb-2">Termo Recorrente</h4>
                                <p className="text-sm text-gray-600 mb-4">
                                    Simplifica a rotina de professores que utilizam os mesmos equipamentos em dias fixos da semana. Permite criar, em uma única ação, agendamentos automáticos para todas as datas correspondentes dentro do mês vigente. O professor assina o termo uma única vez, abrangendo todas as reservas do período.
                                </p>
                                <div className="text-[10px] flex items-center gap-1.5 text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg font-bold border border-purple-200 w-fit">
                                    <Lock className="h-3 w-3" /> Atenção: A recorrência é mensal.
                                </div>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl">
                                <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded mb-3 inline-block">EMPRÉSTIMO</span>
                                <h4 className="font-bold text-gray-900 mb-2">Termo de Retirada</h4>
                                <p className="text-sm text-gray-600">
                                    Esse tipo de agendamento é indicado para terceiros que não têm cadastro no sistema. É necessário inserir informações sobre o solicitante, setor, local, data, horário, equipamento, número de patrimônio e imprimir o termo de uso e responsabilidade e dar ao solicitante para que ele assine com o CPF. Esse termo será guardado em um local físico pelo técnico da educação digital.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                        <div className="flex gap-4">
                            <div className="shrink-0 p-2 bg-blue-50 rounded-lg h-fit text-blue-600"><FileText className="h-4 w-4" /></div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Compartilhamento</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    O documento pode ser baixado em <strong>PDF</strong> para arquivamento digital ou enviado instantaneamente via <strong>WhatsApp Web</strong>.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 p-2 bg-red-50 rounded-lg h-fit text-red-600"><Trash2 className="h-4 w-4" /></div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Vínculo de Exclusão</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Quando um professor exclui um agendamento, ele recebe o status "EXCLUÍDO PELO DOCENTE" e permanece visível para o administrador. Da mesma forma, exclusões administrativas não removem o dado imediatamente; o registro é mantido no banco de dados para auditoria por 365 dias, sendo excluído automaticamente apenas após esse prazo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
