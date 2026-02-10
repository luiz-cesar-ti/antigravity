import { useState, useEffect } from 'react';
import {
    ChevronRight,

    FileText,
    Shield,
    UserPlus,
    LayoutDashboard,
    Calendar,
    Monitor,
    Building,
    Users,
    ClipboardCheck,
    Settings,
    Bell,
    Clock,
    LayoutGrid,
    Menu,
    X,
    Globe,
} from 'lucide-react';
import {
    DashboardSection,
    BookingsSection,
    TermsSection,
    EquipmentsSection,
    RoomsSection,
    ClassroomsSection,
    RegisterSection,
    UsersSection,
    SuperAdminSection,
    LoansSection,
    NotificationsSection,
    SchedulesSection,
    SettingsSection,
    SecuritySection
} from '../../components/admin/help/sections';

export function AdminHelp() {
    const [activeSection, setActiveSection] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sections = [
        { id: 'dashboard', title: 'Dashboard', icon: LayoutDashboard },
        { id: 'bookings', title: 'Agendamentos', icon: Calendar },
        { id: 'terms', title: 'Termo de Responsabilidade', icon: FileText },
        { id: 'equipments', title: 'Equipamentos', icon: Monitor },
        { id: 'rooms', title: 'Gestão de Salas', icon: LayoutGrid },
        { id: 'classrooms', title: 'Salas de Aula', icon: Building },
        { id: 'register', title: 'Cadastro de Professores', icon: UserPlus },
        { id: 'users', title: 'Gestão de Usuários', icon: Users },
        { id: 'super_admin', title: 'Super Admin (Global)', icon: Globe },
        { id: 'loans', title: 'Empréstimos', icon: ClipboardCheck },
        { id: 'notifications', title: 'Notificações', icon: Bell },
        { id: 'schedules', title: 'Horário de Aulas', icon: Clock },
        { id: 'settings', title: 'Configurações', icon: Settings },
        { id: 'security', title: 'Segurança e LGPD', icon: Shield },
    ];

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false); // Close menu first

        // Wait for exit animation to finish before scrolling
        setTimeout(() => {
            const element = document.getElementById(id);
            const container = document.getElementById('admin-main-content');

            if (element) {
                const yOffset = -100;

                if (container) {
                    const topPos = element.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop + yOffset;
                    container.scrollTo({ top: topPos, behavior: 'smooth' });
                } else {
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }
        }, 300);
    };

    // Scroll Spy Effect
    useEffect(() => {
        const handleScroll = () => {
            const container = document.getElementById('admin-main-content');
            const scrollPosition = (container ? container.scrollTop : window.scrollY) + 300;

            // Find the section currently in view
            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element) {
                    const { offsetTop, offsetHeight } = element;
                    // If inside reference container, offsetTop is relative to it
                    if (
                        scrollPosition >= offsetTop &&
                        scrollPosition < offsetTop + offsetHeight
                    ) {
                        setActiveSection(section.id);
                        break;
                    }
                }
            }
        };

        const container = document.getElementById('admin-main-content');
        const target = container || window;
        target.addEventListener('scroll', handleScroll);

        // Initial check
        handleScroll();

        return () => target.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-6 md:mb-10 text-center md:text-left pt-6 md:pt-0">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-4">Manual do Administrador</h1>
                <p className="text-base md:text-lg text-gray-600 max-w-3xl mx-auto md:mx-0">
                    Guia completo de referência sobre todas as funcionalidades, regras de negócio e fluxos operacionais do Sistema de Agendamento.
                </p>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-900/20 hover:bg-primary-700 transition-all active:scale-95"
            >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Mobile Menu Modal (Clean Professional Design) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:hidden animate-in fade-in duration-200">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Menu Card */}
                    <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
                        {/* Header with Light Blue Gradient */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white shrink-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold tracking-tight">Índice do Manual</h3>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                            <p className="text-blue-50 text-sm font-medium opacity-90">Navegue pelos tópicos abaixo</p>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto p-2 flex-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
                            <div className="space-y-1 p-2">
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${activeSection === section.id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`
                                            p-2 rounded-lg transition-colors
                                            ${activeSection === section.id
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}
                                        `}>
                                            <section.icon className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 text-left">{section.title}</span>
                                        {activeSection === section.id && (
                                            <ChevronRight className="w-4 h-4 text-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 relative">
                {/* Desktop Sidebar (Hidden on Mobile) */}
                <div className="hidden lg:block lg:w-72 lg:shrink-0">
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
                    <DashboardSection />
                    <BookingsSection />
                    <TermsSection />
                    <EquipmentsSection />
                    <RoomsSection />
                    <ClassroomsSection />
                    <RegisterSection />
                    <UsersSection />
                    <SuperAdminSection />
                    <LoansSection />
                    <NotificationsSection />
                    <SchedulesSection />
                    <SettingsSection />
                    <SecuritySection />
                </div>
            </div>
        </div>
    );
}
