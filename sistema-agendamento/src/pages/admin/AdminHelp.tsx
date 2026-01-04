import { useState } from 'react';
import {
    ChevronRight,
    Search,
    Info,
    Trash2,
    FileText,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Shield,
    BookOpen,
    UserPlus,
    LayoutDashboard,
    Calendar,
    Monitor,
    Users,
    ClipboardCheck,
    Settings
} from 'lucide-react';

export function AdminHelp() {
    const [activeSection, setActiveSection] = useState('intro');

    const sections = [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', title: 'Agendamentos', icon: Calendar },
        { id: 'terms', title: 'Termo de Responsabilidade', icon: FileText },
        { id: 'equipments', title: 'Equipamentos', icon: Monitor },
        { id: 'register', title: 'Cadastro de Professores', icon: UserPlus },
        { id: 'users', title: 'Usuários', icon: Users },
        { id: 'loans', title: 'Empréstimos', icon: ClipboardCheck },
        { id: 'settings', title: 'Configurações', icon: Settings },
        { id: 'security', title: 'Segurança e LGPD', icon: Shield },
    ];

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-12 text-center md:text-left">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Manual do Administrador</h1>
                <p className="text-lg text-gray-600 max-w-3xl">
                    Guia completo de referência sobre todas as funcionalidades, regras de negócio e fluxos operacionais do Sistema de Agendamento.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation (Sticky) */}
                <div className="lg:w-72 shrink-0">
                    <div className="sticky top-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Índice</h3>
                        <nav className="space-y-1">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === section.id
                                        ? 'bg-primary-50 text-primary-700 shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <section.icon className={`h-4 w-4 ${activeSection === section.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                    {section.title}
                                    {activeSection === section.id && <ChevronRight className="h-4 w-4 ml-auto text-primary-400" />}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-12">

                    {/* Dashboard */}
                    <section id="dashboard" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <LayoutDashboard className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Dashboard</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-6">
                                <p className="text-gray-600 leading-relaxed">
                                    O Dashboard é a central de monitoramento em tempo real da unidade. Ele fornece uma visão macro da utilização dos recursos e métricas de desempenho.
                                </p>
                                <div className="flex justify-center">
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 max-w-2xl w-full">
                                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Search className="h-4 w-4 text-primary-600" /> Métricas Principais
                                        </h3>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li>• <strong>Agendamentos Ativos:</strong> Total de reservas futuras validas.</li>
                                            <li>• <strong>Agendamentos Concluídos:</strong> Contagem total de agendamentos realizados com sucesso.</li>
                                            <li>• <strong>Docentes ativos:</strong> Contagem de professores cadastrados na unidade.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Agendamentos */}
                    <section id="bookings" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Calendar className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Gerenciamento de Agendamentos</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 mb-4">Status do Card de Agendamento</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                            <span className="text-sm font-black text-green-700 bg-green-100 px-2 py-1 rounded mb-2 inline-block">ATIVO</span>
                                            <p className="text-sm text-green-800">Reserva válida e futura. O equipamento está reservado.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                            <span className="text-sm font-black text-blue-700 bg-blue-100 px-2 py-1 rounded mb-2 inline-block">CONCLUÍDO</span>
                                            <p className="text-sm text-blue-800">Data/Hora já passaram. O sistema encerra automaticamente.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                            <span className="text-sm font-black text-amber-700 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">Excluído pelo Professor</span>
                                            <p className="text-sm text-amber-800">Professor excluiu da visão dele. Admin ainda vê o registro.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <Trash2 className="h-5 w-5 text-red-500" /> Fluxo de Exclusão
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2">Pelo Professor</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                                O professor realiza uma exclusão visual para organização pessoal. O agendamento some da lista dele para limpar a visão, mas permanece registrado no sistema. O administrador continua vendo esse registro marcado em amarelo para fins de histórico.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2">Pelo Administrador</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-red-50 p-4 rounded-xl text-red-900">
                                                O administrador tem poder de <strong>"Exclusão Permanente"</strong> (Hard Delete). Ao excluir, o registro é apagado definitivamente do banco de dados, liberando o horário para novos agendamentos e removendo históricos.
                                            </p>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </section>

                    {/* Termos de Responsabilidade - NEW */}
                    <section id="terms" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-rose-600 to-rose-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <FileText className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Termo de Responsabilidade</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <p className="text-gray-600 leading-relaxed mb-6">
                                        Todo agendamento realizado no sistema gera automaticamente um <strong>Documento Jurídico Digital</strong> que vincula o professor aos equipamentos reservados.
                                    </p>

                                    <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                                        <h3 className="font-bold text-rose-900 mb-4 flex items-center gap-2">
                                            <Shield className="h-5 w-5" /> Autenticidade e Segurança (ID Único)
                                        </h3>
                                        <div className="space-y-4">
                                            <p className="text-sm text-rose-800 leading-relaxed">
                                                Para garantir a segurança e a validade jurídica de cada operação, o sistema utiliza um mecanismo de <strong>Verificação Cruzada de IDs</strong>.
                                            </p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">No Documento (PDF)</span>
                                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                                        No rodapé de todo termo gerado, existe um código identificador único (UUID).
                                                    </p>
                                                </div>
                                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">No Sistema</span>
                                                    <p className="text-sm font-bold text-gray-700 mt-1">
                                                        Cada agendamento registrado no banco de dados possui exatamente esse mesmo código ID.
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-rose-900 mt-2 bg-white/50 p-3 rounded-lg border border-rose-100 mb-6">
                                                <CheckCircle2 className="h-4 w-4 inline mr-2 text-rose-600" />
                                                Essa correspondência exata é o que comprova a <strong>originalidade</strong> do termo. Se o ID do papel não bater com o do sistema, o documento pode ter sido adulterado.
                                            </p>

                                            <div className="border-t border-rose-200/50 pt-6">
                                                <h4 className="font-bold text-rose-900 mb-3 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" /> Composição de Dados e Privacidade
                                                </h4>
                                                <div className="bg-white p-4 rounded-xl border border-rose-200">
                                                    <p className="text-sm text-gray-700 mb-3">
                                                        <strong>Dados inclusos no documento:</strong> Data, hora exata da reserva, lista de equipamentos, unidade e nome do responsável.
                                                    </p>
                                                    <p className="text-xs bg-rose-50 text-rose-800 p-2 rounded-lg leading-relaxed border border-rose-100 flex items-start gap-2">
                                                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                                        <span>
                                                            <strong>Garantia de Privacidade (LGPD):</strong> No Termo de Empréstimo, o campo <strong>CPF</strong> é de preenchimento manual obrigatório no ato da assinatura. Para proteção de dados do professor, essa informação <strong>não é armazenada</strong> no banco de dados do sistema em hipótese alguma.
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-gray-900 mb-4">Tipos de Termo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 h-full">
                                            <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-1 rounded mb-3 inline-block">PADRÃO</span>
                                            <h4 className="font-bold text-gray-800 text-lg mb-2">Termo de Agendamento</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">O termo padrão criado automaticamente para os agendamentos do dia a dia. Válido para reservas pontuais.</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 h-full">
                                            <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-1 rounded mb-3 inline-block">FIXO (RECORRENTE)</span>
                                            <h4 className="font-bold text-gray-800 text-lg mb-2">Termo Recorrente</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">Função ativada pelo Admin. Permite ao professor agendar um dia fixo na semana. O termo assinado valida todas as datas do semestre de uma vez.</p>
                                        </div>
                                        <div className="p-6 bg-gray-50 rounded-xl border border-gray-100 h-full">
                                            <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-1 rounded mb-3 inline-block">EMPRÉSTIMO</span>
                                            <h4 className="font-bold text-gray-800 text-lg mb-2">Termo de Retirada</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">Criado na seção "Empréstimos" para terceiros. Preenchido manualmente pelo solicitante e requer <strong>assinatura dupla</strong> (solicitante + responsável).</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors h-full bg-gray-50/50">
                                    <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" /> Compartilhamento
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        O documento pode ser baixado em <strong>PDF</strong> para arquivamento digital ou enviado instantaneamente via <strong>WhatsApp Web</strong>.
                                    </p>
                                </div>
                                <div className="p-6 rounded-2xl border border-gray-100 hover:border-rose-200 transition-colors h-full bg-gray-50/50">
                                    <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
                                        <Trash2 className="h-5 w-5 text-rose-600" /> Vínculo de Exclusão
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        Ao excluir permanentemente um agendamento do sistema, o <strong>ID deixa de existir</strong>, invalidando a verificação de qualquer termo impresso antigo.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </section>

                    {/* Equipamentos */}
                    <section id="equipments" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Monitor className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Cadastro de Equipamentos</h2>
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-600 mb-6">
                                    Módulo para controle de inventário disponível para reserva.
                                </p>
                                <div className="flex flex-col gap-6">
                                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                                        <h3 className="font-bold text-emerald-900 mb-3">Boas Práticas de Cadastro</h3>
                                        <ul className="space-y-3 text-sm text-emerald-800">
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                                <span><strong>Nome Simples:</strong> Use nomes genéricos claros (ex: "Notebook", "Projetor").</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                                <span><strong>Marca/Modelo:</strong> Detalhe a especificação técnica aqui para diferenciar itens (ex: "Dell Inspiron 15", "Epson X41").</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                                                <span><strong>Quantidade Total:</strong> Define o limite de reservas simultâneas ("Estoque Virtual"). Se zerar, o item para de aparecer para os professores.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Cadastro de Professores - NEW */}
                    <section id="register" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-pink-600 to-pink-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <UserPlus className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Cadastro de Professores</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    Para acessar o sistema e realizar agendamentos, todo professor deve realizar seu próprio cadastro através da tela pública de registro. O processo é rigoroso para garantir a segurança e a organização das unidades.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-pink-500 pl-3">Dados Obrigatórios</h3>

                                        <div className="space-y-4">
                                            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">1. Número TOTVS</span>
                                                    <span className="text-[10px] font-black text-pink-500 bg-pink-100 px-2 py-0.5 rounded">ID APENAS</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Identificador único do professor. Usado apenas para fins de cadastro e distinção.</p>
                                            </div>

                                            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">2. E-mail Institucional</span>
                                                    <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded">RESTRIÇÃO</span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">O sistema aceita <strong>exclusivamente</strong> e-mails com o domínio oficial:</p>
                                                <code className="text-sm font-bold text-pink-600 bg-white px-2 py-1 rounded border border-pink-200 block text-center">
                                                    @objetivoportal.com.br
                                                </code>
                                            </div>

                                            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">3. Confirmação de E-mail</span>
                                                    <span className="text-[10px] font-black text-amber-500 bg-amber-100 px-2 py-0.5 rounded">OBRIGATÓRIO</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Para a segurança do sistema e identificação real do professor, é necessário acessar a caixa de entrada do email institucional e clicar no link de confirmação enviado.</p>
                                            </div>

                                            <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">4. Senha Segura</span>
                                                    <span className="text-[10px] font-black text-gray-500 bg-gray-200 px-2 py-0.5 rounded">SEGURANÇA</span>
                                                </div>
                                                <p className="text-sm text-gray-600">Mínimo de <strong>8 dígitos</strong> requeridos.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-blue-500 pl-3">Regras de Acesso</h3>

                                        <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm"><Users className="h-5 w-5" /></div>
                                                <h4 className="font-bold text-blue-900">Seleção de Unidades</h4>
                                            </div>
                                            <p className="text-sm text-blue-800 leading-relaxed mb-4">
                                                Para que o professor consiga visualizar e agendar equipamentos em múltiplas escolas, ele <strong>DEVE selecionar TODAS as unidades</strong> em que trabalha no momento do cadastro.
                                            </p>
                                            <div className="bg-white p-3 rounded-lg border border-blue-100 text-xs text-gray-500 italic">
                                                "Se o professor trabalha na unidade Objetivo São Vicente e Objetivo Praia Grande, ele precisa marcar ambas as unidades do Objetivo. Caso contrário, o professor não conseguirá selecionar as unidades para realizar o agendamento."
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="p-2 bg-white rounded-lg text-gray-600 shadow-sm"><Shield className="h-5 w-5" /></div>
                                                <h4 className="font-bold text-gray-900">Termo de Consentimento</h4>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Etapa final obrigatória. O professor deve ler e clicar na caixa de aceite ("Li e concordo") declarando estar ciente de que:
                                            </p>
                                            <ul className="mt-3 space-y-2 text-sm text-gray-500 list-disc list-inside">
                                                <li>O sistema coleta Nome e E-mail para identificação.</li>
                                                <li>Suas ações geram <strong>logs de segurança</strong>.</li>
                                                <li>Cópias dos termos assinados são armazenadas digitalmente.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Usuários */}
                    <section id="users" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Users className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Gestão de Usuários</h2>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 mb-4">Funções do Administrador</h3>
                                        <div className="space-y-4">
                                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm"><Search className="h-5 w-5" /></div>
                                                    <h4 className="font-bold text-orange-900 text-base">Reset de Senha</h4>
                                                </div>
                                                <p className="text-sm text-orange-800 leading-relaxed">
                                                    O Admin NÃO redefine senhas manualmente. O próprio usuário deve clicar em "Esqueci a Senha" na tela de login.
                                                </p>
                                            </div>

                                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Settings className="h-5 w-5" /></div>
                                                    <h4 className="font-bold text-indigo-900 text-base">Edição de Dados</h4>
                                                </div>
                                                <div className="text-sm text-indigo-800 space-y-2 leading-relaxed">
                                                    <p>O Administrador possui controle total para corrigir o <strong>Nome Completo</strong> do professor caso haja erros de digitação.</p>
                                                    <p className="pt-2 border-t border-indigo-100/50">
                                                        <strong>Gestão de Unidades:</strong> É possível incluir ou remover um professor de uma unidade específica a qualquer momento. Isso libera ou revoga o acesso dele à agenda daquela escola imediatamente.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 bg-purple-50 p-6 rounded-2xl border border-purple-100">
                                        <h3 className="text-sm font-black text-purple-900 uppercase tracking-widest mb-4">Hierarquia</h3>
                                        <ul className="space-y-4">
                                            <li className="bg-white p-3 rounded-xl shadow-sm">
                                                <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-0.5 rounded">ADMIN</span>
                                                <p className="text-xs text-gray-600 mt-1">Acesso total. Vê todos os agendamentos da sua unidade, gerencia usuários e estoque.</p>
                                            </li>
                                            <li className="bg-white p-3 rounded-xl shadow-sm">
                                                <span className="text-xs font-black text-gray-600 bg-gray-100 px-2 py-0.5 rounded">PROFESSOR</span>
                                                <p className="text-xs text-gray-600 mt-1">Acesso restrito. Vê apenas seus próprios agendamentos e disponibilidade de equipamentos.</p>
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                {/* Agendamento Recorrente - NEW BLOCK */}
                                <div className="mt-8 bg-purple-50 border border-purple-100 rounded-2xl p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg text-purple-600 shadow-sm"><Calendar className="h-5 w-5" /></div>
                                        <h3 className="font-bold text-lg text-purple-900">Agendamento Fixo (Recorrente)</h3>
                                    </div>
                                    <p className="text-sm text-purple-900 mb-4 leading-relaxed">
                                        O agendamento recorrente permite que um professor tenha um agendamento fixo toda semana (ex: Toda Quinta às 08:00).
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-4 rounded-xl border border-purple-100">
                                            <h4 className="text-sm font-bold text-gray-800 mb-2">Renovação Mensal</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                O sistema gera os agendamentos automáticos <strong>apenas até o final do mês atual</strong>. No início de cada mês, o professor deve realizar um novo agendamento.
                                                <br /><br />
                                                Isso garante que um <strong>novo Termo de Responsabilidade</strong>, com as datas atualizadas, seja assinado mensalmente, aumentando a segurança jurídica.
                                            </p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-purple-100 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg">REGRA DE OURO</div>
                                            <h4 className="text-sm font-bold text-gray-800 mb-2">Permissão de Acesso</h4>
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                <strong>Exclusivo de Admins:</strong> Apenas um Administrador pode liberar essa função para um professor.
                                                <br /><br />
                                                <span className="italic text-purple-600">"Um Admin de uma unidade só pode conceder permissão de recorrência para professores daquela mesma unidade. Se o professor atua em outra escola, o Admin de lá é quem deve liberar."</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Empréstimos */}
                    <section id="loans" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <ClipboardCheck className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Central de Empréstimos</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 mb-2">Propósito</h3>
                                    <p className="text-gray-600">
                                        Diferente do agendamento, o Empréstimo foca na <strong>retirada física</strong> de equipamentos do estoque, geralmente para uso externo, eventos ou terceiros.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                            <h4 className="font-bold text-gray-900">1. Geração de Termo</h4>
                                        </div>
                                        <p className="text-xs text-gray-500">Sistema gera um PDF formal. O campo <strong>CPF é preenchido manualmente</strong> pelo solicitante no papel, pois o sistema não guarda essa informação para segurança.</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Upload className="h-5 w-5 text-amber-600" />
                                            <h4 className="font-bold text-gray-900">2. Upload do Assinado</h4>
                                        </div>
                                        <p className="text-xs text-gray-500">O Admin fotografa (JPG/PNG) o termo assinado e anexa ao registro digital para arquivamento.</p>
                                    </div>
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                            <h4 className="font-bold text-gray-900">3. Baixa no Estoque</h4>
                                        </div>
                                        <p className="text-xs text-gray-500">Itens emprestados são deduzidos do inventário. Ao devolver, o estoque é reposto automaticamente.</p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4">
                                    <Info className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
                                    <div>
                                        <h4 className="font-bold text-amber-900 mb-1">Segurança de Dados e Exclusão</h4>
                                        <p className="text-sm text-amber-800">
                                            O sistema não armazena CPF (preenchimento manual). Ao excluir um empréstimo, a imagem do termo assinado também é apagada permanentemente do servidor, garantindo privacidade total.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Configurações */}
                    <section id="settings" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Settings className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Configurações do Sistema</h2>
                                </div>
                            </div>
                            <div className="p-8">
                                <p className="text-gray-600 mb-6">
                                    Área para personalização de parâmetros globais da unidade.
                                </p>
                                <div className="space-y-4">
                                    <div className="border border-gray-200 rounded-2xl p-5 hover:border-primary-200 transition-colors">
                                        <h4 className="font-bold text-gray-900 mb-2">Antecedência Mínima (Horas)</h4>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Define quantas horas de antecedência são exigidas para um professor realizar um agendamento.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">CONFIGURÁVEL</span>
                                            <span className="text-xs text-gray-400">Pode ser habilitado ou desabilitado.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Segurança e LGPD */}
                    <section id="security" className="scroll-mt-8">
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-700 to-teal-900 p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Shield className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-black">Segurança e Proteção de Dados (LGPD)</h2>
                                </div>
                            </div>
                            <div className="p-8 space-y-8">
                                <p className="text-gray-600">
                                    O sistema utiliza arquitetura de segurança em camadas para garantir a integridade e privacidade dos dados, conforme a LGPD.
                                </p>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-emerald-50 rounded-lg">
                                                <FileText className="h-6 w-6 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">1. Auditoria de Consentimento (Prova Jurídica Imutável)</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                                    O aceite do termo sobre <strong>informações dos professores na página de cadastro</strong> gera um <strong>registro blindado</strong> e auditável. O sistema armazena a prova contendo:
                                                </p>
                                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-500">
                                                    <li><strong>Identidade (Quem):</strong> Nome, E-mail e Matrícula.</li>
                                                    <li><strong>Momento (Quando):</strong> Data e hora exata do aceite.</li>
                                                    <li><strong>Conteúdo (O Que):</strong> Cópia fiel da versão "v1.0" do contrato aceito.</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-blue-50 rounded-lg">
                                                <LayoutDashboard className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">2. Histórico Operacional</h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    O sistema mantém o histórico completo de agendamentos ativos, realizados e cancelados para consulta.
                                                </p>
                                                <p className="text-xs text-gray-500 mt-2 italic bg-gray-50 p-2 rounded border border-gray-200">
                                                    Nota: Para garantir o "Direito ao Esquecimento" (outro pilar da LGPD), agendamentos antigos podem ser excluídos permanentemente pela administração, removendo seus vestígios do banco de dados quando não forem mais necessários.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-purple-50 rounded-lg">
                                                <Shield className="h-6 w-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-gray-900 mb-2">3. Segurança da Informação</h4>
                                                <ul className="space-y-3 text-sm text-gray-600">
                                                    <li className="flex items-center gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                                        <span><strong>Criptografia:</strong> Tráfego de dados 100% via HTTPS/SSL.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span><strong>Controle Rígido (RLS):</strong> O banco de dados bloqueia nativamente acessos não autorizados. Dados sensíveis (como Matrícula) são visíveis estritamente para a administração.</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                                        <span><strong>Infraestrutura de Nuvem:</strong> O sistema é hospedado em plataforma global que fornece proteção contra ataques (DDoS) e certificações de segurança corporativa.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div >

            <div className="mt-20 text-center border-t border-gray-100 pt-10">
                <p className="text-gray-400 text-sm font-medium"></p>
            </div>
        </div >
    );
}
