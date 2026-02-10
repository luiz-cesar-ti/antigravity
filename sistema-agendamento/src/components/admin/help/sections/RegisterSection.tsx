import React from 'react';
import { UserPlus, Users, ShieldCheck, FileText } from 'lucide-react';

export const RegisterSection: React.FC = () => {
    return (
        <section id="register" className="scroll-mt-8">
            <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-pink-600 to-pink-800 p-6 md:p-8 text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                            <UserPlus className="h-6 w-6 md:h-8 md:w-8" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black">Cadastro de Professores</h2>
                    </div>
                </div>
                <div className="p-5 md:p-8 space-y-8">
                    <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                        Para acessar o sistema e realizar agendamentos, todo professor deve realizar seu próprio cadastro através da tela pública de registro. O processo é rigoroso para garantir a segurança e a organização das unidades.
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                        {/* Coluna Esquerda: Dados Obrigatórios */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 border-l-4 border-pink-600 pl-3">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Dados Obrigatórios</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Item 1 */}
                                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">1. Número TOTVS</h4>
                                        <span className="text-[10px] uppercase font-black bg-pink-100 text-pink-600 px-2 py-0.5 rounded">ID</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Identificador único. Usado para cadastro e distinção.</p>
                                </div>

                                {/* Item 2 */}
                                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-900">2. E-mail Institucional</h4>
                                        <span className="text-[10px] uppercase font-black bg-pink-100 text-pink-600 px-2 py-0.5 rounded">EMPRESA</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">Aceita <strong className="text-gray-900">exclusivamente</strong> o domínio:</p>
                                    <div className="bg-white border border-pink-200 rounded-lg p-2 text-center">
                                        <span className="text-sm font-bold text-pink-600">@objetivoportal.com.br</span>
                                    </div>
                                </div>

                                {/* Item 3 */}
                                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">3. Confirmação</h4>
                                        <span className="text-[10px] uppercase font-black bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">LINK</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Necessário clicar no link enviado ao email institucional.</p>
                                </div>

                                {/* Item 4 */}
                                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-gray-900">4. Senha Segura</h4>
                                        <span className="text-[10px] uppercase font-black bg-gray-200 text-gray-700 px-2 py-0.5 rounded">8+ CARAC</span>
                                    </div>
                                    <p className="text-sm text-gray-600">Maiúsculas, minúsculas, números e símbolos (@$!%*?&).</p>
                                </div>
                            </div>
                        </div>

                        {/* Coluna Direita: Regras de Acesso */}
                        <div>
                            <div className="flex items-center gap-3 mb-6 border-l-4 border-blue-600 pl-3">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900">Regras de Acesso</h3>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-white p-2 rounded-lg text-blue-600">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <h4 className="font-bold text-blue-900">Seleção de Unidades</h4>
                                    </div>
                                    <p className="text-sm text-blue-800 mb-4 leading-relaxed">
                                        Para que o professor consiga visualizar e agendar equipamentos em múltiplas escolas, ele <strong className="font-black">DEVE selecionar TODAS as unidades</strong> em que trabalha no momento do cadastro.
                                    </p>
                                    <div className="bg-white p-4 rounded-xl border border-blue-100">
                                        <p className="text-xs text-gray-500 italic leading-relaxed">
                                            "Se o professor trabalha na unidade Objetivo São Vicente e Objetivo Praia Grande, ele precisa marcar ambas as unidades do Objetivo. Caso contrário, o professor não conseguirá selecionar as unidades para realizar o agendamento."
                                        </p>
                                    </div>
                                </div>

                                {/* Empty space after removing Term card from here */}
                            </div>
                        </div>
                    </div>

                    {/* Termo de Consentimento - Horizontal / Full Width */}
                    <div className="group relative bg-gradient-to-br from-white to-pink-50/30 p-8 rounded-[2rem] border border-pink-100/50 shadow-sm transition-all hover:shadow-md hover:border-pink-200 overflow-hidden">
                        {/* Decorative element */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <ShieldCheck className="h-40 w-40 text-pink-600 rotate-12" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
                                {/* Left side: Icon & Intro */}
                                <div className="lg:w-1/3 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-pink-100 rounded-2xl text-pink-600 shadow-sm">
                                            <ShieldCheck className="h-8 w-8" />
                                        </div>
                                        <h4 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Termo de Consentimento</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed font-bold">
                                        Esta é a <strong className="text-pink-700">etapa final e obrigatória</strong> de todo cadastro. Antes de concluir o registro, o professor deve obrigatoriamente realizar a leitura e o aceite eletrônico do termo diretamente no sistema.
                                    </p>
                                </div>

                                {/* Right side: Importance box */}
                                <div className="lg:w-2/3">
                                    <div className="bg-white/60 backdrop-blur-sm border border-pink-200/50 p-6 rounded-3xl h-full flex flex-col justify-center">
                                        <h5 className="flex items-center gap-2 text-xs font-black text-pink-800 uppercase tracking-widest mb-3">
                                            <FileText className="h-4 w-4" /> Importância Estratégica
                                        </h5>
                                        <p className="text-sm md:text-base text-gray-500 leading-relaxed text-justify">
                                            O aceite formaliza as diretrizes de uso e conduta entre o docente e a instituição. Sua presença no momento do registro garante que o sistema seja utilizado apenas por usuários que estejam plenamente cientes e de acordo com as normas vigentes, assegurando transparência e conformidade estratégica desde o primeiro acesso.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
