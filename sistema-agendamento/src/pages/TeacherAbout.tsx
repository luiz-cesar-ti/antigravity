import { BookOpen, Calendar, CheckSquare, Clock, FileText, Info, Laptop, Monitor, MousePointer, ShieldCheck, AlertCircle, Trash2, Repeat } from 'lucide-react';

export function TeacherAbout() {
    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-12">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                    Guia de Uso do Sistema
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    Aprenda a realizar agendamentos, gerenciar suas reservas e entenda a importância dos termos de responsabilidade.
                </p>
            </div>

            {/* Passo a Passo: Agendamento */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-primary-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-primary-700" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Como Realizar Agendamentos</h2>
                    </div>
                </div>

                <div className="p-6 grid gap-8 md:grid-cols-3">
                    {/* Passo 1 */}
                    <div className="relative group">
                        <div className="absolute top-0 left-4 h-full w-0.5 bg-gray-100 -z-10 md:hidden"></div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm shadow-sm ring-4 ring-white">1</span>
                                <h3 className="font-semibold text-gray-900">Dados Iniciais</h3>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-primary-200 transition-colors">
                                <div className="flex gap-2 mb-3">
                                    <Monitor className="h-5 w-5 text-gray-400" />
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    No <strong>Passo 1</strong>, preencha seus dados, escolha a <strong>Unidade</strong>, o <strong>Local</strong>, a <strong>Data</strong> e o <strong>Horário</strong> desejado.
                                </p>
                                <p className="text-xs text-gray-500 mt-2 bg-white p-2 rounded border border-gray-200">
                                    Nota: Você verá apenas suas unidades cadastradas.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Passo 2 */}
                    <div className="relative group">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm shadow-sm ring-4 ring-white">2</span>
                                <h3 className="font-semibold text-gray-900">Escolha de Itens</h3>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-primary-200 transition-colors">
                                <Laptop className="h-8 w-8 text-primary-500 mb-3" />
                                <p className="text-sm text-gray-600">
                                    No <strong>Passo 2</strong>, o sistema exibe todos os equipamentos e a <strong>quantidade disponível</strong> para o horário que você informou. Basta selecionar o que precisa.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Passo 3 */}
                    <div className="relative group">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white font-bold text-sm shadow-sm ring-4 ring-white">3</span>
                                <h3 className="font-semibold text-gray-900">Assinar e Confirmar</h3>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group-hover:border-primary-200 transition-colors">
                                <CheckSquare className="h-8 w-8 text-green-500 mb-3" />
                                <p className="text-sm text-gray-600">
                                    No <strong>Passo 3</strong>, revise o pedido, adicione observações se necessário, <strong>assine digitalmente</strong> o termo e clique em Confirmar.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualizando Agendamentos */}
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Meus Agendamentos</h2>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-600 mb-3 font-medium">Status das Reservas:</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <span className="block h-2 w-2 rounded-full bg-green-500"></span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        <strong>Ativo:</strong> O agendamento está confirmado e aguardando uso.
                                    </span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="mt-1">
                                        <span className="block h-2 w-2 rounded-full bg-gray-400"></span>
                                    </div>
                                    <span className="text-sm text-gray-600">
                                        <strong>Encerrado:</strong> O período de uso já finalizou.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                <Trash2 className="h-4 w-4 text-red-500" />
                                Excluir Agendamento
                            </h4>
                            <p className="text-sm text-gray-600">
                                O professor pode excluir um agendamento a qualquer momento. O item será liberado, mas o registro <strong>permanecerá visível para o administrador</strong> (como "Excluído pelo Professor").
                            </p>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-amber-500" />
                                Agendamentos Fixos (Recorrentes)
                            </h4>
                            <p className="text-sm text-gray-600">
                                É possível habilitar uma função para reservas que se repetem automaticamente (ex: toda semana).
                                <br />
                                <strong>Atenção:</strong> Essa função precisa ser solicitada pessoalmente ao <strong>Responsável da Educação Digital</strong> de sua unidade. Apenas ele poderá ativar essa permissão no seu perfil.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Termos de Responsabilidade */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                        <ShieldCheck className="h-40 w-40" />
                    </div>

                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <FileText className="h-6 w-6 text-amber-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Termo de Responsabilidade</h2>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <div className="flex gap-2">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                                <p className="text-sm text-amber-800 font-medium">
                                    Por que é importante?
                                </p>
                            </div>
                            <p className="text-xs text-amber-700 mt-1 ml-7">
                                O termo garante a segurança dos equipamentos e organiza o uso compartilhado entre os professores.
                            </p>
                        </div>

                        <p className="text-sm text-gray-600">
                            Ao confirmar reservas com equipamentos (como Tablets e Notebooks), um <strong>Termo Digital</strong> é gerado.
                        </p>

                        <p className="text-sm text-gray-600">
                            Você pode <strong>visualizar, baixar (PDF) ou compartilhar (WhatsApp)</strong> o termo em dois momentos:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 ml-2 space-y-1">
                            <li>No <strong>Passo 3</strong> do formulário, logo após assinar e confirmar.</li>
                            <li>Na página <strong>"Meus Agendamentos"</strong>, clicando sobre a reserva desejada.</li>
                        </ul>

                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                            <MousePointer className="h-4 w-4" />
                            <span>Basta clicar no agendamento para ver as opções disponíveis.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer / Dúvidas */}
            <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200 border-dashed">
                <Info className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">Ainda tem dúvidas?</h3>
                <p className="text-sm text-gray-500">
                    Entre em contato com a Educação Digital de sua unidade.
                </p>
            </div>
        </div>
    );
}
