import { useState } from 'react';
import {
    ChevronRight,
    Search,
    Trash2,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Shield,
    UserPlus,
    LayoutDashboard,
    Calendar,
    Monitor,
    Users,
    ClipboardCheck,
    Settings,
    Bell,
    TrendingUp,
    PieChart,
    Trophy,
    Clock,
    ShieldCheck,
    Lock,
    Info,
    LayoutGrid,
    Menu,
    X,
    History as LucideHistory,
    Globe
} from 'lucide-react';

export function AdminHelp() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', title: 'Agendamentos', icon: Calendar },
        { id: 'terms', title: 'Termo de Responsabilidade', icon: FileText },
        { id: 'equipments', title: 'Equipamentos', icon: Monitor },
        { id: 'register', title: 'Cadastro de Professores', icon: UserPlus },
        { id: 'users', title: 'Usuários', icon: Users },
        { id: 'super_admin', title: 'Super Admin (Global)', icon: Globe },
        { id: 'loans', title: 'Empréstimos', icon: ClipboardCheck },
        { id: 'notifications', title: 'Notificações', icon: Bell },
        { id: 'schedules', title: 'Horário de Aulas', icon: Clock },
        { id: 'settings', title: 'Configurações', icon: Settings },
        { id: 'security', title: 'Segurança e LGPD', icon: Shield },
    ];

    const scrollToSection = (id: string) => {
        setActiveSection(id);
        setIsMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-4">Manual do Administrador</h1>
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
                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 md:p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Monitor className="h-6 w-6 md:h-8 md:w-8" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black">Dashboard</h2>
                                </div>
                            </div>
                            <div className="p-5 md:p-8 space-y-6">
                                <p className="text-gray-600 leading-relaxed">
                                    O Dashboard é a central de inteligência da sua unidade. Utilize os gráficos para entender o comportamento de uso e otimizar a distribuição de recursos.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-blue-100 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                                <TrendingUp className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Indicadores de Pico</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Gráficos de barras e linhas mostram os dias de maior demanda nos agendamentos.
                                        </p>
                                    </div>

                                    <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-green-100 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                                <PieChart className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Mix de Utilização</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            O gráfico de rosca revela quais equipamentos são essenciais. Agora com <strong>filtros por turno</strong> (07h-13h e 13h-18h) para análise por período.
                                        </p>
                                    </div>

                                    <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-purple-100 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                                <Users className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Busca Inteligente</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Pesquise docentes pelo Nome ou TOTVS para visualizar um relatório individual de analytics.
                                        </p>
                                    </div>

                                    <div className="bg-white border border-gray-100 p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-sm hover:border-amber-100 transition-all">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                                <Trophy className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-bold text-gray-900">Top Docentes</h4>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Ranking dos professores que mais utilizam os recursos da unidade no período selecionado.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Agendamentos */}
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
                                    <h3 className="text-lg font-black text-gray-900 mb-4">Status do Card de Agendamento</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                                        <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                            <span className="text-[10px] md:text-sm font-black text-green-700 bg-green-100 px-2 py-1 rounded mb-2 inline-block">ATIVO</span>
                                            <p className="text-xs md:text-sm text-green-800 leading-tight">Reserva válida e futura. Equipamento reservado.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                            <span className="text-[10px] md:text-sm font-black text-blue-700 bg-blue-100 px-2 py-1 rounded mb-2 inline-block">CONCLUÍDO</span>
                                            <p className="text-xs md:text-sm text-blue-800 leading-tight">Data/Hora já passaram. Encerramento automático.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                            <span className="text-[10px] md:text-sm font-black text-amber-700 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">EXCLUÍDO PELO DOCENTE</span>
                                            <p className="text-xs md:text-sm text-amber-800 leading-tight">Professor tirou da visão dele. Admin ainda vê.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                            <span className="text-[10px] md:text-sm font-black text-purple-700 bg-purple-100 px-2 py-1 rounded mb-2 inline-block">RECORRENTE</span>
                                            <p className="text-xs md:text-sm text-purple-800 leading-tight">Fixo semanal. Criável até o final do mês corrente.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <Trash2 className="h-5 w-5 text-red-500" /> Fluxo de Exclusão
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 text-sm">Pelo Professor</h4>
                                            <p className="text-xs md:text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl">
                                                Exclusão visual para organização pessoal. Permanece registrado para o administrador (marcado em amarelo).
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-700 mb-2 text-sm">Pelo Administrador</h4>
                                            <p className="text-xs md:text-sm text-red-900 leading-relaxed bg-red-50 p-4 rounded-xl">
                                                <strong>"Exclusão Permanente"</strong>. O registro é apagado definitivamente, liberando o horário no estoque.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Termos de Responsabilidade */}
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
                                    <h3 className="text-lg font-black text-gray-900 mb-4">Tipos de Termo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-gray-50 border border-gray-100 p-5 rounded-3xl">
                                            <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded mb-3 inline-block">PADRÃO</span>
                                            <h4 className="font-bold text-gray-900 mb-2">Termo de Agendamento</h4>
                                            <p className="text-sm text-gray-600">Padrão automático para reservas pontuais.</p>
                                        </div>
                                        <div className="bg-purple-50 border border-purple-100 p-5 rounded-3xl">
                                            <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded mb-3 inline-block">RECORRENTE</span>
                                            <h4 className="font-bold text-gray-900 mb-2">Termo Recorrente</h4>
                                            <p className="text-sm text-gray-600 mb-4">Fixo semanal. Captura a recorrência (ex: Toda Segunda).</p>
                                            <div className="text-[10px] flex items-center gap-1.5 text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg font-bold border border-purple-200 w-fit">
                                                <Lock className="h-3 w-3" /> Cobre toda a série de aulas.
                                            </div>
                                        </div>
                                        <div className="bg-amber-50 border border-amber-100 p-5 rounded-3xl">
                                            <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded mb-3 inline-block">EMPRÉSTIMO</span>
                                            <h4 className="font-bold text-gray-900 mb-2">Termo de Retirada</h4>
                                            <p className="text-sm text-gray-600">Para terceiros. Assinatura dupla necessária.</p>
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
                                                Ao excluir permanentemente um agendamento do sistema, o <strong>ID deixa de existir</strong>, invalidando a verificação de qualquer termo impresso antigo.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Equipamentos */}
                    <section id="equipments" className="scroll-mt-8">
                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-6 md:p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Monitor className="h-6 w-6 md:h-8 md:w-8" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black">Cadastro de Equipamentos</h2>
                                </div>
                            </div>
                            <div className="p-5 md:p-8">
                                <p className="text-gray-600 mb-6 text-base md:text-lg">Módulo para controle de inventário disponível para reserva.</p>
                                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                                    <h3 className="font-bold text-emerald-900 mb-4">Boas Práticas de Cadastro</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-emerald-900">
                                                <strong>Nome Simples:</strong> Use nomes genéricos claros (ex: "Notebook", "Projetor").
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-emerald-900">
                                                <strong>Marca/Modelo:</strong> Detalhe a especificação técnica aqui para diferenciar itens (ex: "Dell Inspiron 15", "Epson X41").
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                            <p className="text-sm text-emerald-900">
                                                <strong>Quantidade Total:</strong> Define o limite de reservas simultâneas ("Estoque Virtual"). Se zerar, o item para de aparecer para os professores.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Cadastro de Professores */}
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

                                            <div className="bg-white p-6 rounded-3xl border border-gray-200">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <ShieldCheck className="h-6 w-6 text-gray-400" />
                                                    <h4 className="font-bold text-gray-900">Termo de Consentimento</h4>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                                                    Etapa final obrigatória. O professor deve ler e clicar na caixa de aceite ("Li e concordo") declarando estar ciente de que:
                                                </p>
                                                <ul className="space-y-2 text-sm text-gray-600">
                                                    <li className="flex gap-2">
                                                        <span className="text-gray-400">•</span>
                                                        <span>O sistema coleta Nome e E-mail para identificação.</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="text-gray-400">•</span>
                                                        <span>Suas ações geram <strong>logs de segurança</strong>.</span>
                                                    </li>
                                                    <li className="flex gap-2">
                                                        <span className="text-gray-400">•</span>
                                                        <span>Cópias dos termos assinados são armazenadas digitalmente.</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Usuários */}
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
                                                <h4 className="font-bold text-indigo-900">Edição de Dados</h4>
                                            </div>
                                            <p className="text-sm text-indigo-800 leading-relaxed mb-4">
                                                O Administrador possui controle total para corrigir o <strong className="text-indigo-900">Nome Completo</strong> do professor caso haja erros de digitação.
                                            </p>
                                            <p className="text-sm text-indigo-800 leading-relaxed bg-white/50 p-3 rounded-xl border border-indigo-200">
                                                <strong className="text-indigo-900">Gestão de Unidades:</strong> É possível incluir ou remover um professor de uma unidade específica a qualquer momento. Isso libera ou revoga o acesso dele à agenda daquela escola imediatamente.
                                            </p>
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
                                        <h3 className="text-xl font-bold text-purple-900">Agendamento Recorrente</h3>
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
                                                <strong className="text-gray-900">Exclusivo de Admins:</strong> Apenas um Administrador pode liberar essa função para um professor.
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

                    {/* Super Admin */}
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
                                            <Shield className="h-5 w-5" /> Controlo Total de Segurança
                                        </h3>
                                        <p className="text-sm text-red-800 leading-relaxed">
                                            Autonomia total para gerenciamento de acessos. O Super Admin tem a capacidade exclusiva de <strong className="text-red-900">redefinir senhas de outros Administradores de Unidade</strong> e também realizar a gestão de suas <strong className="text-red-900">próprias credenciais</strong>, garantindo que nenhuma unidade fique bloqueada por perda de acesso administrativo.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                    <h4 className="font-bold text-gray-900 mb-2">Edição de Docentes</h4>
                                    <p className="text-xs text-gray-500">Pode alterar nomes, gerenciar unidades e excluir cadastros permanentemente.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Empréstimos */}
                    <section id="loans" className="scroll-mt-8">
                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-amber-500 to-amber-700 p-6 md:p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <ClipboardCheck className="h-6 w-6 md:h-8 md:w-8" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black">Central de Empréstimos</h2>
                                </div>
                            </div>
                            <div className="p-5 md:p-8 space-y-8">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg mb-2">Propósito</h3>
                                    <p className="text-gray-600 leading-relaxed text-base">
                                        Diferente do agendamento, o Empréstimo foca na <strong className="text-gray-900">retirada física</strong> de equipamentos do estoque, geralmente para uso externo, eventos ou terceiros.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
                                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                                            <FileText className="h-5 w-5" />
                                            <h4 className="font-bold text-gray-900">1. Geração de Termo</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            O Admin preenche manualmente um pequeno formulário com as informações do solicitante. O sistema então gera um PDF formal onde o <strong className="text-gray-700">CPF deve ser preenchido à mão</strong> no ato da assinatura.
                                        </p>
                                    </div>
                                    <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm text-left">
                                        <div className="flex items-center gap-2 mb-3 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            <h4 className="font-bold text-gray-900">2. Baixa no Estoque</h4>
                                        </div>
                                        <p className="text-xs text-gray-500 leading-relaxed">
                                            Itens emprestados são reduzidos no inventário. Ao devolver, o estoque é reposto automaticamente.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Etapas do Processo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white border-2 border-orange-50 p-6 rounded-2xl">
                                            <span className="text-2xl font-black text-orange-500 mb-2 block">01</span>
                                            <h4 className="font-bold text-gray-900 mb-2">Solicitação Externa</h4>
                                            <p className="text-sm text-gray-600">Registro manual de empréstimos fora da grade de aulas padrão.</p>
                                        </div>
                                        <div className="bg-white border-2 border-orange-50 p-6 rounded-2xl">
                                            <span className="text-2xl font-black text-orange-500 mb-2 block">02</span>
                                            <h4 className="font-bold text-gray-900 mb-2">Assinatura do Termo</h4>
                                            <p className="text-sm text-gray-600">Impressão e assinatura física obrigatória para segurança jurídica.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex gap-4 items-start">
                                    <div className="shrink-0 text-amber-600 mt-1">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-amber-900 mb-1">Segurança de Dados e Exclusão</h4>
                                        <p className="text-xs text-amber-800 leading-relaxed">
                                            O sistema não armazena CPF (preenchimento manual). Ao excluir um empréstimo, o registro é apagado permanentemente do banco de dados, garantindo privacidade total.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Notificações */}
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

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Coluna 1: Alertas */}
                                    <div className="pt-2">
                                        <div className="border-l-4 border-cyan-500 pl-4 space-y-4">
                                            <h4 className="font-bold text-gray-900 mb-4 block">Alertas em Tempo Real</h4>

                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
                                                <span className="text-sm text-gray-600">Novos Pedidos de Cadastro</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
                                                <span className="text-sm text-gray-600">Agendamentos de Última Hora</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500"></div>
                                                <span className="text-sm text-gray-600">Cancelamentos Críticos</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna 2: Histórico */}
                                    <div className="bg-cyan-50 rounded-[2rem] p-6 text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                                            <LucideHistory className="h-5 w-5 text-cyan-700" />
                                            <h4 className="font-bold text-cyan-900">Histórico de Atividade</h4>
                                        </div>
                                        <p className="text-sm text-cyan-800 leading-relaxed">
                                            As notificações ficam salvas por <strong className="text-cyan-900">24 horas</strong> para consulta rápida no menu superior.
                                        </p>
                                    </div>

                                    {/* Coluna 3: Limpeza */}
                                    <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
                                        <div className="flex items-center gap-2 mb-3 text-amber-900">
                                            <Trash2 className="h-5 w-5" />
                                            <h4 className="font-bold">Política de Retenção (Limpeza)</h4>
                                        </div>
                                        <p className="text-xs text-amber-800 mb-4">
                                            Para manter a performance do sistema e evitar acúmulo de dados desnecessários:
                                        </p>
                                        <div className="bg-white rounded-xl p-4 border border-amber-100 flex items-center gap-4">
                                            <span className="text-4xl font-black text-amber-500 leading-none">
                                                7<br /><span className="text-sm">DIAS</span>
                                            </span>
                                            <p className="text-xs text-gray-600 leading-tight">
                                                É o tempo máximo que uma notificação fica guardada. Após esse período, ela é <strong className="text-gray-900">excluída permanentemente</strong> do banco de dados automaticamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Horário de Aulas */}
                    <section id="schedules" className="scroll-mt-8">
                        <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-700 p-6 md:p-8 text-white">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                                        <Clock className="h-6 w-6 md:h-8 md:w-8" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black">Horário de Aulas</h2>
                                </div>
                            </div>
                            <div className="p-5 md:p-8 space-y-6 md:space-y-8">
                                <p className="text-gray-600 leading-relaxed text-lg">
                                    O preenchimento do <strong>Horário de Aulas</strong> pelo administrador é uma ferramenta estratégica de gestão que vai além do simples registro.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 text-base md:text-lg mb-3 flex items-center gap-2">
                                            <Search className="h-5 w-5" /> Localização em Tempo Real
                                        </h4>
                                        <p className="text-sm text-indigo-800 leading-relaxed">
                                            Ao manter os horários atualizados por unidade, a Educação Digital consegue identificar instantaneamente onde o professor está lecionando (sala, laboratório ou ambiente externo).
                                        </p>
                                    </div>
                                    <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                                        <h4 className="font-bold text-emerald-900 text-base md:text-lg mb-3 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" /> Agilidade no Suporte
                                        </h4>
                                        <p className="text-sm text-emerald-800 leading-relaxed">
                                            Facilita a entrega e o recolhimento de equipamentos. Sabendo exatamente onde o recurso será utilizado, a Educação Digital ganha eficiência e evita atrasos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Configurações */}
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
                                <div className="text-gray-600">Área para personalização de parâmetros globais da unidade.</div>

                                <div className="border border-gray-200 rounded-3xl p-6 hover:border-primary-200 transition-all bg-white text-left shadow-sm">
                                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Antecedência Mínima (Horas)</h4>
                                    <p className="text-sm text-gray-500 mb-4">Define quantas horas de antecedência são exigidas para um professor realizar um agendamento.</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase tracking-wide">CONFIGURÁVEL</span>
                                        <span className="text-xs text-gray-400">Pode ser habilitado ou desabilitado.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Segurança e LGPD */}
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
                                        <h4 className="font-bold text-gray-900 text-lg">1. Auditoria de Consentimento (Prova Jurídica Imutável)</h4>
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
                                        <h4 className="font-bold text-gray-900 text-lg">2. Histórico Operacional</h4>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                                        O sistema mantém o histórico completo de agendamentos ativos, realizados e cancelados para consulta.
                                    </p>
                                    <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl">
                                        <p className="text-xs text-gray-500 italic leading-relaxed">
                                            Nota: Para garantir o "Direito ao Esquecimento" (outro pilar da LGPD), agendamentos antigos podem ser excluídos permanentemente pela administração, removendo seus vestígios do banco de dados quando não forem mais necessários.
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Arquitetura de Blindagem de Senhas */}
                                <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                                            <Shield className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg">3. Arquitetura de Blindagem de Senhas</h4>
                                    </div>
                                    <p className="text-center md:text-left text-sm text-gray-600 mb-8 leading-relaxed">
                                        Implementamos um sistema de <strong className="text-gray-800">Criptografia de Ponta</strong> para garantir que as credenciais jamais sejam expostas.
                                    </p>

                                    <div className="bg-[#1e1b4b] p-8 rounded-[2rem] text-white border border-white/10 shadow-2xl relative overflow-hidden group mb-6">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                            <Shield className="h-32 w-32" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                                    <Lock className="h-6 w-6 text-white" />
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-bold">Zero Exposição: Validação de Segurança Blindada</h3>
                                            </div>
                                            <p className="text-indigo-200 text-sm leading-relaxed mb-6 italic">
                                                Diferente de sistemas convencionais <span className="text-white not-italic">onde a senha é verificada pelo navegador, nossa arquitetura utiliza o conceito de Server-Side Validation.</span>
                                            </p>
                                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm text-xs text-indigo-100 italic leading-relaxed">
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

                                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                                        <div className="flex items-center gap-2 mb-2 text-blue-600">
                                            <Settings className="h-4 w-4" />
                                            <h5 className="font-bold text-xs uppercase tracking-wider text-gray-900">FUNÇÕES DE BANCO SEGURAS (RPCS)</h5>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Operações sensíveis como login e troca de senha ocorrem via <strong className="text-gray-800">Remote Procedure Calls (RPCs)</strong> isoladas, que validam permissões de cargo e tokens de sessão antes de qualquer alteração no banco.
                                        </p>
                                    </div>
                                </div>

                                {/* Conformidade LGPD */}
                                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex gap-4">
                                    <div className="shrink-0 bg-white p-2 rounded-lg text-emerald-600 border border-emerald-100 h-fit">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 text-lg mb-2">Conformidade LGPD: Privacidade por Design</h4>
                                        <p className="text-sm text-emerald-800 leading-relaxed">
                                            O sistema foi construído sob o princípio de <strong className="text-emerald-950">Minimização de Dados</strong>. Coletamos apenas o essencial (Nome, E-mail, TOTVS) e garantimos o controle total do usuário sobre seus dados (exclusão de conta e limpeza de históricos). O uso de <strong className="text-emerald-950">Tokens de Sessão Temporários (24h)</strong> garante que acessos não autorizados sejam bloqueados automaticamente em caso de esquecimento de logoff.
                                        </p>
                                    </div>
                                </div>

                                {/* 4. Infraestrutura e HTTPS */}
                                <div className="bg-white border border-gray-200 p-6 rounded-[2rem] shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <h4 className="font-bold text-gray-900 text-lg">4. Infraestrutura e HTTPS</h4>
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
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Mobile Navigation FAB */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center gap-2 bg-primary-600 text-white px-5 py-4 rounded-3xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 border-2 border-primary-500/50 backdrop-blur-sm"
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    <span className="font-bold text-sm tracking-wide">Índice</span>
                </button>
            </div>

            {/* Mobile Navigation Menu Overlay */}
            {isMobileMenuOpen && (
                <>
                    <div
                        className="lg:hidden fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 transition-opacity animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    <div className="lg:hidden fixed bottom-6 left-4 right-4 z-50 bg-white rounded-[2rem] shadow-2xl flex flex-col max-h-[70vh] animate-in slide-in-from-bottom duration-300 overflow-hidden ring-1 ring-black/5">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                            <div className="flex flex-col">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Navegação</h3>
                                <p className="text-[10px] text-gray-500 font-medium tracking-tight">Toque para ir ao tópico</p>
                            </div>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4 space-y-2 bg-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => scrollToSection(section.id)}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all relative overflow-hidden group border active:scale-[0.98] ${activeSection === section.id
                                        ? 'bg-gradient-to-r from-primary-50 to-white text-primary-700 border-l-4 border-l-primary-600 border-y-primary-100 border-r-primary-100 shadow-lg shadow-primary-100/50'
                                        : 'text-gray-600 bg-white border-gray-50 hover:bg-gray-50 hover:border-gray-100'
                                        }`}
                                >
                                    {activeSection === section.id && (
                                        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/50 to-transparent pointer-events-none" />
                                    )}
                                    <div className={`p-3 rounded-xl transition-all duration-300 shrink-0 ${activeSection === section.id ? 'bg-primary-600/10 text-primary-600 shadow-inner' : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-primary-500 group-hover:shadow-sm'}`}>
                                        <section.icon className={`h-5 w-5 ${activeSection === section.id ? 'scale-110' : ''}`} />
                                    </div>
                                    <span className={`flex-1 text-left text-base ${activeSection === section.id ? 'font-extrabold tracking-tight' : 'font-semibold'}`}>{section.title}</span>
                                    {activeSection === section.id && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-primary-600 animate-pulse shadow-[0_0_12px_rgba(79,70,229,0.8)]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            <div className="h-4" /> {/* Spacer for bottom scroll */}
                        </nav>

                        <div className="p-4 bg-gray-50 border-t border-gray-100 sticky bottom-0 z-10">
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="w-full py-4 bg-white border border-gray-200 text-gray-400 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-all active:scale-95 shadow-sm"
                            >
                                Fechar Menu
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="mt-20 text-center border-t border-gray-100 pt-10">
                <p className="text-gray-400 text-sm font-medium"></p>
            </div>
        </div>
    );
}
