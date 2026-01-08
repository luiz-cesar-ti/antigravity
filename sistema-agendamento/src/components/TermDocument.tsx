import React from 'react';

// Interfaces to handle both fresh Wizard data and stored Admin/DB data
interface TermEquipment {
    name: string;
    brand?: string;
    model?: string;
    quantity: number;
}

interface TermData {
    full_name?: string;
    userName?: string;
    totvs_number?: string;
    userTotvs?: string;
    unit: string;
    local: string;
    date?: string;
    booking_date?: string; // Admin view often uses snake_case
    startTime?: string;
    start_time?: string; // Admin view
    endTime?: string;
    end_time?: string; // Admin view
    equipments?: TermEquipment[];
    term_document?: any; // Allow loose access
    users?: any; // Allow loose access
    created_at?: string;
    timestamp?: string;
    display_id?: string;
    displayId?: string; // Wizard format
    isRecurring?: boolean;
    day_of_week?: number;
    dayOfWeek?: number;
    term_hash?: string;
    version_tag?: string;
    term_fingerprint?: string;
    type?: 'equipment' | 'room';
}

interface TermDocumentProps {
    data: TermData;
    id?: string;
}

// CRITICAL: This component's layout and content (especially responsibilities, signature, AND RECURRING DATES)
// have been legally approved and must remain exact.
// The signature date MUST use data.created_at to ensure immutability.
// The layout MUST remain on a SINGLE PAGE A4.
// DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
export const TermDocument: React.FC<TermDocumentProps> = ({ data, id }) => {
    // Helper to extract data regardless of source (Wizard, DB Booking, or Term JSON)
    const getName = () => data.full_name || data.userName || data.term_document?.userName || data.term_document?.full_name || data.users?.full_name || '';
    const getTotvs = () => data.totvs_number || data.userTotvs || data.term_document?.userTotvs || data.term_document?.totvs_number || data.users?.totvs_number || '';
    const getUnit = () => data.unit || data.term_document?.unit || '';
    const getLocal = () => data.local || data.term_document?.local || '';


    // Extract Traceability Data
    const getDisplayId = () => data.display_id || data.displayId || data.term_document?.displayId || data.term_document?.display_id;

    const displayId = getDisplayId();

    const getDate = () => {
        const isRecOrFixo = data.isRecurring || data.term_document?.isRecurring;
        if (isRecOrFixo) {
            const dayNum = data.dayOfWeek ?? data.day_of_week ?? data.term_document?.dayOfWeek ?? data.term_document?.day_of_week;
            const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

            // If dayNum is missing, maybe we have the pre-formatted string in 'date'
            if (dayNum === undefined) {
                const storedDate = data.date || data.booking_date || data.term_document?.date || data.term_document?.booking_date;
                if (storedDate?.startsWith('Toda')) return storedDate;
            }

            return `Toda ${days[dayNum ?? 0]}`;
        }

        const d = data.date || data.booking_date || data.term_document?.date || data.term_document?.booking_date;
        if (!d) return '';
        if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
        return d.split('-').reverse().join('/');
    };

    const getTime = () => {
        const s = data.startTime || data.start_time || data.term_document?.startTime || data.term_document?.start_time;
        const e = data.endTime || data.end_time || data.term_document?.endTime || data.term_document?.end_time;
        return `${s} às ${e}`;
    };

    const getEquipments = (): TermEquipment[] => {
        if (data.equipments && Array.isArray(data.equipments)) return data.equipments;
        if (data.term_document && data.term_document.equipments) return data.term_document.equipments;
        return [];
    };

    const getRecurringDates = () => {
        const isRecOrFixo = data.isRecurring || data.term_document?.isRecurring;
        const dayNum = data.dayOfWeek ?? data.day_of_week ?? data.term_document?.dayOfWeek ?? data.term_document?.day_of_week;

        if (!isRecOrFixo || dayNum === undefined) return null;

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const dates: string[] = [];

        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            if (date.getDay() === dayNum) {
                dates.push(date.toLocaleDateString('pt-BR'));
            }
        }
        return dates;
    };

    const isRoom = data.type === 'room';

    return (
        <div id={id} style={{
            width: '100%',
            padding: '30mm 20mm 20mm 30mm', // Strict ABNT Standard
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            {/* Header / Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '0' }}>
                <img
                    src="/logo-objetivo.jpg"
                    alt="Logo Colégio Objetivo"
                    crossOrigin="anonymous"
                    style={{ maxHeight: '100px', margin: '0 auto', display: 'block' }}
                />
            </div>

            <h1 style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '12pt',
                marginBottom: '0.5rem',
                textTransform: 'uppercase',
                maxWidth: '90%',
                margin: '0 auto 0.25rem'
            }}>
                Declaração de Responsabilidade e Termo de Uso
            </h1>

            <div style={{ textAlign: 'justify', marginBottom: '0.75rem' }}>
                <p style={{ marginBottom: '0.5rem' }}>
                    Declaro que eu, <strong style={{ fontWeight: 'bold' }}>{getName()}</strong>, portador(a) do número de usuário TOTVS <strong style={{ fontWeight: 'bold' }}>{getTotvs()}</strong>,
                    estou ciente e de acordo com as condições de uso {isRoom ? 'do espaço físico' : 'do(s) equipamento(s)'} abaixo descrito(s),
                    responsabilizando-me integralmente por sua utilização durante o período de agendamento.
                </p>
            </div>

            <div style={{
                marginBottom: '0.75rem',
                border: '1px solid #d1d5db',
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                backgroundColor: '#f9fafb'
            }}>
                <h2 style={{
                    fontWeight: 'bold',
                    borderBottom: '1px solid #d1d5db',
                    marginBottom: '0.25rem',
                    paddingBottom: '0.25rem',
                    fontSize: '11pt',
                    textTransform: 'uppercase'
                }}>Dados do Agendamento</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '11pt' }}>
                    <p><strong>Unidade:</strong> {getUnit()}</p>
                    <p><strong>{isRoom ? 'Sala/Espaço' : 'Local'}:</strong> {getLocal()}</p>
                    <p><strong>Dia de Uso:</strong> {getDate()}</p>
                    <p><strong>Horário:</strong> {getTime()}</p>
                </div>
                {getRecurringDates() && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #d1d5db' }}>
                        {/* LOCKED LAYOUT: DO NOT CHANGE SPACING OR FONT SIZE OF RECURRING DATES. MUST FIT SINGLE PAGE. */}
                        <p style={{ fontSize: '11pt', color: '#374151', marginBottom: '6px', fontWeight: 'bold' }}>Datas agendadas para o mês atual:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {getRecurringDates()?.map(date => (
                                <span key={date} style={{
                                    backgroundColor: '#fff',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #9ca3af',
                                    fontSize: '11pt',
                                    fontWeight: 'bold',
                                    color: '#1f2937'
                                }}>{date}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {getEquipments().length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{
                        fontWeight: 'bold',
                        borderBottom: '1px solid #000000',
                        marginBottom: '0.25rem',
                        paddingBottom: '0.25rem',
                        fontSize: '11pt',
                        textTransform: 'uppercase'
                    }}>Equipamento(s) Reservado(s)</h2>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', marginTop: '0.5rem' }}>
                        {getEquipments().map((eq, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>
                                <strong>{eq.name}</strong>
                                {eq.brand ? ` (${eq.brand} ${eq.model || ''})` : ''}
                                &nbsp;- {eq.quantity} unidade(s)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Dynamic Content from DB or Hardcoded Fallback */}
            {data.term_document?.content ? (
                <div style={{
                    marginBottom: '1rem',
                    textAlign: 'justify',
                    fontSize: '11pt',
                    lineHeight: '1.5',
                    color: '#1f2937'
                }}>
                    {data.term_document.content.split('\n').map((line: string, i: number) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return <div key={i} style={{ height: '0.5rem' }} />;

                        // Detect titles (Uppercase lines)
                        const isTitle = trimmedLine.length > 5 && trimmedLine === trimmedLine.toUpperCase() && !trimmedLine.includes('CIÊNCIA');

                        // Handle "TERMO DE CIÊNCIA" block duplication fix
                        const isScienceTitleOnly = trimmedLine === 'TERMO DE CIÊNCIA';
                        const isScienceContent = trimmedLine.startsWith('Estou ciente que a utilização');

                        if (isScienceTitleOnly) return null; // Skip line that is just the title to avoid duplication

                        if (isScienceContent) {
                            return (
                                <div key={i} style={{
                                    marginTop: '0.75rem',
                                    fontSize: '11pt',
                                    backgroundColor: '#f3f4f6',
                                    padding: '1rem',
                                    borderLeft: '4px solid #1f2937',
                                    borderRadius: '2px'
                                }}>
                                    <strong style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>TERMO DE CIÊNCIA</strong>
                                    {trimmedLine}
                                </div>
                            );
                        }

                        return (
                            <p key={i} style={{
                                marginBottom: isTitle ? '0.3rem' : '0.5rem',
                                fontWeight: isTitle ? 'bold' : 'normal',
                                fontSize: isTitle ? '12pt' : '11pt',
                                textTransform: isTitle ? 'uppercase' : 'none',
                                marginTop: isTitle ? '0.8rem' : '0'
                            }}>
                                {trimmedLine}
                            </p>
                        );
                    })}
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: '1rem', textAlign: 'justify', fontSize: '11pt', lineHeight: '1.5' }}>
                        <h2 style={{ fontWeight: 'bold', marginBottom: '0.25rem', textTransform: 'uppercase', fontSize: '12pt' }}>Compromissos e Responsabilidades</h2>
                        <p style={{ marginBottom: '0.25rem' }}>Ao aceitar este termo, comprometo-me a:</p>
                        <div style={{ paddingLeft: '0.5rem' }}>
                            {[
                                `Utilizar o ${isRoom ? 'espaço' : 'equipamento'} exclusivamente durante o período agendado e no local especificado.`,
                                `Zelar pela conservação e bom funcionamento do ${isRoom ? 'espaço e seus itens' : 'equipamento'}.`,
                                "Comunicar imediatamente à equipe responsável qualquer defeito ou irregularidade constatada.",
                                `Não emprestar ou transferir o ${isRoom ? 'espaço' : 'equipamento'} a terceiros sem autorização prévia.`,
                                `Orientar adequadamente o uso do ${isRoom ? 'espaço' : 'equipamento'}, quando utilizado por alunos, zelando por sua conservação.`
                            ].map((item, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                                    <span style={{ minWidth: '15px', fontWeight: 'bold' }}>{index + 1}.</span>
                                    <span style={{ textAlign: 'justify' }}>{item}</span>
                                </div>
                            ))}
                            {(data.isRecurring || data.term_document?.isRecurring) && (
                                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.2rem' }}>
                                    <span style={{ minWidth: '15px', fontWeight: 'bold' }}>6.</span>
                                    <span style={{ textAlign: 'justify' }}>Declaro ciência que este é um <strong style={{ fontWeight: 'bold' }}>Agendamento Fixo</strong> e concordo em assinar digitalmente todos os termos gerados automaticamente para cada ocorrência desta recorrência.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem', textAlign: 'justify', fontSize: '11pt', lineHeight: '1.5' }}>
                        <p>
                            Comprometo-me a devolver {isRoom ? 'o espaço' : 'o(s) equipamento(s)'} nas mesmas condições em que {isRoom ? 'o recebi' : 'os recebi'}.
                            Estou ciente que qualquer dano ou extravio será de minha responsabilidade.
                        </p>
                    </div>

                    <div style={{
                        marginBottom: '1rem',
                        fontSize: '11pt',
                        backgroundColor: '#f3f4f6',
                        padding: '1rem',
                        borderLeft: '4px solid #1f2937',
                        borderRadius: '2px'
                    }}>
                        <strong style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '11pt' }}>TERMO DE CIÊNCIA</strong>
                        <p style={{ margin: 0, fontSize: '11pt', lineHeight: '1.5' }}>
                            Estou ciente que a utilização inadequada pode resultar em medidas administrativas
                            e que sou responsável pela segurança e integridade do {isRoom ? 'espaço' : 'equipamento'}.
                        </p>
                    </div>
                </>
            )}

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '50%' }}>
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        marginBottom: '0.25rem'
                    }}>
                        <div style={{
                            marginBottom: '10px', // Space between name and line
                            fontWeight: 'bold',
                            fontSize: '11pt',
                            textTransform: 'uppercase'
                        }}>
                            {getName()}
                        </div>
                        <div style={{
                            borderBottom: '1px solid #000',
                            width: '100%'
                        }}></div>
                    </div>
                    <p style={{ fontSize: '8pt', color: '#4b5563', marginTop: '2px' }}>Responsável • TOTVS: {getTotvs()}</p>
                </div>

                <div style={{ textAlign: 'right', fontSize: '8pt', color: '#6b7280' }}>
                    <p style={{ fontWeight: 'bold', color: '#000', marginBottom: '0.1rem', textTransform: 'uppercase' }}>Assinatura Digital</p>
                    <p>Data: {data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Hora: {data.created_at ? new Date(data.created_at).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>

            {/* Traceability Footer */}
            {(getDisplayId() || data.term_hash || data.term_fingerprint || data.term_document?.term_fingerprint || data.term_document?.term_hash) && (
                <div style={{ marginTop: '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem', textAlign: 'center' }}>
                    {displayId && (
                        <p style={{ fontWeight: 'bold', fontSize: '10pt', color: '#111827', marginBottom: '4px' }}>
                            ID DO TERMO: #{displayId}
                        </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '7.5pt', color: '#6b7280' }}>
                        <span>
                            <strong style={{ fontWeight: 'bold' }}>VERSÃO DO TERMO:</strong> {
                                data.version_tag ||
                                data.term_document?.version_tag ||
                                data.term_version ||
                                'v1.0'
                            }
                        </span>
                        <span>
                            <strong style={{ fontWeight: 'bold' }}>HASH DE AUTENTICIDADE (SHA-256):</strong> {
                                (data.term_hash || data.term_fingerprint || data.term_document?.term_fingerprint || data.term_document?.term_hash)?.substring(0, 24)
                            }...
                        </span>
                    </div>
                </div>
            )}
            <p style={{ fontSize: '7.5pt', color: '#9ca3af', marginTop: '2px', textAlign: 'center' }}>
                Documento gerado eletronicamente pelo Sistema de Agendamentos Objetivo.
            </p>
        </div>
    );
};
