import React, { useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    Monitor,
    Users,
    ClipboardCheck,
    Settings,
    ChevronDown,
    ChevronRight,
    Search,
    Info,
    Trash2,
    FileText,
    Upload,
    CheckCircle2,
    AlertTriangle,
    Shield,
    BookOpen
} from 'lucide-react';

export function AdminHelp() {
    const [activeSection, setActiveSection] = useState('intro');

    const sections = [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', title: 'Agendamentos', icon: Calendar },
        { id: 'equipments', title: 'Equipamentos', icon: Monitor },
        { id: 'users', title: 'Usuários', icon: Users },
        { id: 'loans', title: 'Empréstimos', icon: ClipboardCheck },
        { id: 'settings', title: 'Configurações', icon: Settings },
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
                    Guia completo de referência sobre todas as funcionalidades, regras de negócio e fluxos operacionais do Sistema de Agendamento Antigravity.
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Search className="h-4 w-4 text-primary-600" /> Métricas Principais
                                        </h3>
                                        <ul className="space-y-2 text-sm text-gray-600">
                                            <li>• <strong>Agendamentos Ativos:</strong> Total de reservas futuras validas.</li>
                                            <li>• <strong>Empréstimos Ativos:</strong> Equipamentos que estão atualmente fora do estoque.</li>
                                            <li>• <strong>Usuários Totais:</strong> Contagem de professores e admins cadastrados na unidade.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-purple-600" /> Auditoria Rápida
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Os últimos 5 registros de atividade (logs) são exibidos para controle rápido de segurança, mostrando quem fez o que e quando.
                                        </p>
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
                                            <span className="text-xs font-black text-green-700 bg-green-100 px-2 py-1 rounded mb-2 inline-block">ATIVO</span>
                                            <p className="text-xs text-green-800">Reserva válida e futura. O equipamento está reservado.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                                            <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-1 rounded mb-2 inline-block">ENCERRADO</span>
                                            <p className="text-xs text-red-800">Data/Hora já passaram. O sistema encerra automaticamente.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                            <span className="text-xs font-black text-gray-600 bg-gray-200 px-2 py-1 rounded mb-2 inline-block">CANCELADO</span>
                                            <p className="text-xs text-gray-600">Cancelado via sistema, mas mantido no histórico para auditoria.</p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                                            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded mb-2 inline-block">EXCLUÍDO (PROF)</span>
                                            <p className="text-xs text-amber-800">Professor excluiu da visão dele. Admin ainda vê o registro.</p>
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
                                                O professor realiza uma <strong>"Exclusão Lógica"</strong> (Soft Delete). O agendamento some da lista dele para limpar a visão, mas permanece no banco de dados com a flag <code>deleted_by_teacher</code>. O administrador continua vendo esse registro marcado em amarelo.
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

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-gray-500" /> Termos de Responsabilidade
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        Todo agendamento gera automaticamente um termo jurídico digital.
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 ml-4">
                                        <li>O termo contém data, hora, local, dados do professor e lista de equipamentos.</li>
                                        <li>Pode ser baixado em <strong>PDF</strong> ou compartilhado via WhatsApp Web diretamente pelo painel.</li>
                                        <li>Ao excluir um agendamento permanentemente, o vínculo com o termo é desfeito.</li>
                                    </ul>
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
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg"><Search className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Reset de Senha</p>
                                                    <p className="text-xs text-gray-500">O Admin não vê a senha atual, mas pode enviar um link de redefinição ou orientar o reset.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg"><Settings className="h-4 w-4" /></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-sm">Edição de Dados</p>
                                                    <p className="text-xs text-gray-500">Correção de nome, e-mail e unidade de lotação do professor.</p>
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
                                        Diferente do agendamento (reserva de sala/aula), o Empréstimo foca na <strong>retirada física</strong> de equipamentos do estoque, geralmente para uso externo, eventos ou terceiros.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                            <h4 className="font-bold text-gray-900">1. Geração de Termo</h4>
                                        </div>
                                        <p className="text-xs text-gray-500">Sistema gera um PDF formal com campos para assinatura física, CPF e patrimônios.</p>
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
                                        <h4 className="font-bold text-amber-900 mb-1">Atenção na Exclusão</h4>
                                        <p className="text-sm text-amber-800">
                                            Excluir um empréstimo também apaga permanentemente o arquivo de imagem (Termo Assinado) do servidor para economizar espaço e manter a LGPD. Certifique-se de ter o físico se necessário.
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
                                        <h4 className="font-bold text-gray-900 mb-2">Notificações por E-mail (Resend)</h4>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Define se o sistema deve disparar e-mails para cada novo agendamento.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">ATIVADO</span>
                                            <span className="text-xs text-gray-400">Requer API Key válida configurada no Edge Function.</span>
                                        </div>
                                    </div>
                                    <div className="border border-gray-200 rounded-2xl p-5 hover:border-primary-200 transition-colors">
                                        <h4 className="font-bold text-gray-900 mb-2">E-mail de Destino</h4>
                                        <p className="text-sm text-gray-500">
                                            Endereço principal que receberá os alertas de novos agendamentos da unidade (ex: <code>ti.suporte@escola.com.br</code>).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            <div className="mt-20 text-center border-t border-gray-100 pt-10">
                <p className="text-gray-400 text-sm font-medium">Antigravity System v2.2 • Todos os direitos reservados</p>
            </div>
        </div>
    );
}
