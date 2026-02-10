import React from 'react';
import { Shield, Lock, ShieldCheck, FileText, AlertTriangle, CheckCircle2, LayoutGrid, ClipboardCheck, Clock, Timer, Info } from 'lucide-react';

export const SecuritySection: React.FC = () => {
    return (
        <section id="security" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-700 to-teal-900 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <Shield className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Segurança e Proteção de Dados (LGPD)</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                        O sistema utiliza arquitetura de segurança em camadas para garantir a integridade e privacidade dos dados, conforme a LGPD.
                    </p>

                    {/* 1. Auditoria de Consentimento */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                                <FileText className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">1. Auditoria de Consentimento (Prova Jurídica Imutável)</h4>
                        </div>
                        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                            O aceite do termo sobre <strong className="text-gray-800">informações dos professores na página de cadastro</strong> gera um <strong className="text-gray-800">registro blindado</strong> e auditável. O sistema armazena a prova contendo:
                        </p>
                        <ul className="space-y-2 text-sm text-gray-600 pl-2">
                            <li className="flex gap-2">
                                <span className="text-gray-400 font-black">•</span>
                                <span><strong className="text-gray-700">Identidade (Quem):</strong> Nome, E-mail e Matrícula.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-400 font-black">•</span>
                                <span><strong className="text-gray-700">Momento (Quando):</strong> Data e hora exata do aceite.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-gray-400 font-black">•</span>
                                <span><strong className="text-gray-700">Conteúdo (O Que):</strong> Cópia fiel da versão "v1.0" do contrato aceito.</span>
                            </li>
                        </ul>
                    </div>

                    {/* 2. Histórico Operacional */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <LayoutGrid className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">2. Histórico Operacional</h4>
                        </div>
                        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                            O sistema mantém todo o histórico de agendamentos (normais, recorrentes e empréstimos). Mesmo que um professor ou administrador realize a exclusão, esses registros permanecem salvos no banco de dados para fins de auditoria e segurança, sendo removidos permanentemente apenas após 365 dias.
                        </p>
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                            <p className="text-xs text-gray-500 italic leading-relaxed">
                                Nota: Essa retenção garante a rastreabilidade completa das operações e evita perdas acidentais, assegurando que o histórico permaneça auditável por um ano inteiro antes da limpeza automática.
                            </p>
                        </div>
                    </div>

                    {/* 3. Arquitetura de Blindagem de Senhas */}
                    <div className="bg-white border border-gray-200 p-4 md:p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">3. Arquitetura de Blindagem de Senhas</h4>
                        </div>
                        <p className="text-center md:text-left text-sm text-gray-600 mb-8 leading-relaxed">
                            Implementamos um sistema de <strong className="text-gray-800">Criptografia de Ponta</strong> para garantir que as credenciais jamais sejam expostas.
                        </p>

                        <div className="bg-gradient-to-br from-[#3b3b98] to-[#0b0b1a] -mx-4 md:mx-0 p-5 md:p-8 rounded-[2rem] text-white border border-white/5 shadow-2xl relative overflow-hidden group mb-6">
                            <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none">
                                <Shield className="h-32 w-32 text-white/40" strokeWidth={1} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 bg-white/5 rounded-xl backdrop-blur-md border border-white/10">
                                        <Lock className="h-6 w-6 text-indigo-300" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black tracking-tight">Zero Exposição: Validação de Segurança Blindada</h3>
                                </div>
                                <p className="text-white text-sm leading-relaxed mb-6 font-bold">
                                    Diferente de sistemas convencionais <span className="text-indigo-200 font-normal">onde a senha é verificada pelo navegador, nossa arquitetura utiliza o conceito de <i className="italic">Server-Side Validation</i>.</span>
                                </p>
                                <div className="bg-black/20 border border-white/5 p-6 rounded-2xl backdrop-blur-sm text-xs text-indigo-100 italic leading-relaxed">
                                    "A lógica de autenticação foi movida 100% para o servidor (RPC). O navegador do usuário nunca recebe códigos de segurança (hashes) e nunca processa a validação. O sistema apenas recebe um 'Sim' ou 'Não' do banco de dados, tornando impossível a interceptação ou manipulação de credenciais via rede."
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2 text-purple-600">
                                    <Lock className="h-4 w-4" />
                                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900">HASHING NO SERVIDOR</h5>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    As senhas nunca são armazenadas em texto puro. O sistema utiliza algoritmos de <strong className="text-gray-800">Hash (Bcrypt/Crypt)</strong> diretamente no banco de dados. Nem os administradores globais conseguem visualizar a senha de um usuário.
                                </p>
                            </div>
                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-2 mb-2 text-green-600">
                                    <ShieldCheck className="h-4 w-4" />
                                    <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900">POLÍTICAS DE ALTA COMPLEXIDADE</h5>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Exigência rigorosa de 8+ caracteres, mesclando Maiúsculas, Minúsculas, Números e Símbolos, impedindo o uso de senhas fracas ou previsíveis.
                                </p>
                            </div>
                        </div>


                    </div>

                    {/* Conformidade LGPD */}
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex gap-4">
                        <div className="shrink-0 bg-white p-2 rounded-lg text-emerald-600 border border-emerald-100 h-fit">
                            <Info className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-emerald-900 text-lg md:text-xl mb-2">Conformidade LGPD: Privacidade</h4>
                            <p className="text-sm text-emerald-800 leading-relaxed mb-4">
                                O sistema foi construído sob o princípio de <strong className="text-emerald-950">Minimização de Dados</strong>. Coletamos apenas o essencial (Nome, E-mail, TOTVS).
                            </p>

                            <h5 className="font-bold text-emerald-900 text-sm mb-1">Administradores</h5>
                            <p className="text-sm text-emerald-800 leading-relaxed">
                                O uso de <strong className="text-emerald-950">Tokens de Sessão Temporários (3 horas)</strong> garante que acessos não autorizados sejam bloqueados automaticamente em caso de esquecimento de logoff.
                            </p>
                        </div>
                    </div>

                    {/* Bloqueio de Conta (Rate Limiting) */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-red-50 p-2 rounded-lg text-red-600">
                                <Lock className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">Bloqueio Automático de Conta</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            Para proteção contra ataques de força bruta, o sistema implementa um mecanismo de <strong className="text-gray-900">Rate Limiting</strong> no login administrativo.
                        </p>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-3">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-xs text-red-900 leading-relaxed">
                                    <strong>3 Tentativas:</strong> Após errar a senha 3 vezes consecutivas, a conta do administrador é <strong>bloqueada automaticamente</strong>.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-red-600 shrink-0" />
                                <p className="text-xs text-red-900 leading-relaxed">
                                    <strong>Desbloqueio:</strong> Apenas o <strong>Admin Global</strong> pode desbloquear contas bloqueadas através do painel de Administradores.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expiração de Sessão */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                                <Timer className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">Expiração Automática de Sessão</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            Por motivos de segurança, as sessões administrativas expiram automaticamente após um período de inatividade.
                        </p>
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl">
                            <div className="flex gap-3">
                                <Clock className="h-5 w-5 text-orange-600 shrink-0" />
                                <p className="text-xs text-orange-900 leading-relaxed">
                                    <strong>Tempo de Sessão:</strong> A sessão do administrador expira automaticamente após <strong>3 horas</strong>. Após esse período, será necessário fazer login novamente para continuar operando o sistema.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 4. Infraestrutura e HTTPS */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg md:text-xl">4. Infraestrutura e HTTPS</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    <strong className="text-gray-900">Criptografia em Trânsito:</strong> Todo o tráfego de dados é 100% criptografado via HTTPS/SSL, impedindo a interceptação de informações.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    <strong className="text-gray-900">Nuvem Corporativa:</strong> Hospedado em infraestrutura Supabase (AWS/Postgres) com redundância e proteção contra ataques de negação de serviço (DDoS).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 5. Auditoria e Rastreabilidade */}
                    <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                                <ClipboardCheck className="h-6 w-6" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">5. Auditoria de Ações Administrativas</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            Para garantir total transparência e segurança forense, o sistema registra automaticamente todas as operações críticas realizadas no painel administrativo.
                        </p>
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-900 leading-relaxed">
                                    <strong>Snapshots Detalhados:</strong> Cada ação de exclusão, edição ou criação gera um log imutável contendo o estado dos dados <em>antes</em> e <em>depois</em> da alteração, permitindo auditoria técnica completa em caso de incidentes.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 6. Firewall de Dados (RLS) */}
                    <div className="bg-gradient-to-br from-blue-900 to-indigo-900 p-6 rounded-[2rem] shadow-lg border border-blue-800 relative overflow-hidden text-white mt-8">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Lock className="h-32 w-32 text-white" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
                                    <Shield className="h-6 w-6 text-blue-200" />
                                </div>
                                <h4 className="font-bold text-white text-lg">6. Firewall de Dados (RLS - Row Level Security)</h4>
                            </div>

                            <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                                Além da proteção HTTPS e senhas, o sistema utiliza uma camada de segurança nativa do banco de dados chamada <strong className="text-white">RLS (Row Level Security)</strong>.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                                    <h5 className="font-bold text-xs uppercase tracking-wider text-blue-300 mb-2">Bloqueio Total</h5>
                                    <p className="text-xs text-blue-100 leading-relaxed">
                                        Mesmo em caso de invasão, o banco de dados funciona como um "Cofre Individual". Cada linha de dado tem seu próprio segurança.
                                    </p>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                                    <h5 className="font-bold text-xs uppercase tracking-wider text-blue-300 mb-2">Isolamento Absoluto</h5>
                                    <p className="text-xs text-blue-100 leading-relaxed">
                                        Vazamentos em massa são matematicamente impossíveis. Um usuário só consegue ler estritamente o que pertence a ele.
                                    </p>
                                </div>

                                <div className="bg-black/20 p-4 rounded-xl border border-white/10">
                                    <h5 className="font-bold text-xs uppercase tracking-wider text-blue-300 mb-2">Imunidade a Falhas</h5>
                                    <p className="text-xs text-blue-100 leading-relaxed">
                                        A segurança não depende do aplicativo (frontend). Se houver um bug na tela, o banco de dados recusa a entrega da informação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
