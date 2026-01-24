// 🛑 FILE LOCKED: DO NOT EDIT. THIS RENDER LOGIC IS CRITICAL FOR PDF ALIGNMENT.
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
// The layout MUST remain on a SINGLE PAGE A4 (or clean flow for more content).
// DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.
// ---------------------------------------------------------------------------
// 🔒 LOCKED COMPONENT - FINAL VERSION - APPROVED 08/01/2026
// Any changes to margins, padding, or logic WILL break the PDF generation alignment.
// ---------------------------------------------------------------------------
export const TermDocument: React.FC<TermDocumentProps> = ({ data }) => {
    // Helper to extract data regardless of source (Wizard, DB Booking, or Term JSON)
    const getName = () => data.full_name || data.userName || data.term_document?.userName || data.term_document?.full_name || data.users?.full_name || '';
    const getTotvs = () => data.totvs_number || data.userTotvs || data.term_document?.userTotvs || data.term_document?.totvs_number || data.users?.totvs_number || '';
    const getUnit = () => data.unit || data.term_document?.unit || '';
    const getLocal = () => data.local || data.term_document?.local || '';

    // Robust Room/Equipment detection
    const isRoom = data.type === 'room' ||
        data.term_document?.type === 'room' ||
        !!data.term_document?.room_id ||
        !!(data as any).room_id ||
        (data.term_document?.content && data.term_document.content.toLowerCase().includes('o espaço'));

    // Extract Traceability Data
    const displayId = data.display_id || data.displayId || data.term_document?.displayId || data.term_document?.display_id;

    // Define isRecurring early to avoid scope issues
    const isRecurring = !!(data.isRecurring || data.term_document?.isRecurring);

    const getDate = () => {
        if (isRecurring) {
            const dayNum = data.dayOfWeek ?? data.day_of_week ?? data.term_document?.dayOfWeek ?? data.term_document?.day_of_week;
            const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
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
        const dayNum = data.dayOfWeek ?? data.day_of_week ?? data.term_document?.dayOfWeek ?? data.term_document?.day_of_week;
        if (!isRecurring || dayNum === undefined) return null;

        // Use created_at if available to anchor the calculation (for past terms), otherwise use now (for preview)
        // This fixes the issue of showing past dates for new bookings in the current month
        const anchorDate = data.created_at ? new Date(data.created_at) : new Date();
        const year = anchorDate.getFullYear();
        const month = anchorDate.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        // Start checking from the anchor date (ignoring time)
        const startDate = new Date(year, month, anchorDate.getDate());
        startDate.setHours(0, 0, 0, 0);

        const dates: string[] = [];
        for (let day = 1; day <= lastDay; day++) {
            const date = new Date(year, month, day);
            // Only include dates that are equal to or after the creation date
            if (date >= startDate && date.getDay() === dayNum) {
                dates.push(date.toLocaleDateString('pt-BR'));
            }
        }
        return dates;
    };

    // UNIFIED RENDERER: Ensures absolute parity across all views
    const renderLine = (line: string, key: any) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={key} style={{ height: '0.4rem' }} />;

        const isTitle = trimmed.length > 5 && trimmed === trimmed.toUpperCase() && !trimmed.includes('CIÊNCIA');
        const isListItem = /^\d+\./.test(trimmed);
        const listMatch = trimmed.match(/^(\d+\.)(.*)/);

        return (
            <p key={key} style={{
                marginBottom: isTitle ? '0.4rem' : '0.4rem',
                fontWeight: isTitle ? 'bold' : 'normal',
                fontSize: isTitle ? '12pt' : '11pt',
                textTransform: isTitle ? 'uppercase' : 'none',
                marginTop: isTitle ? '0.6rem' : '0',
                paddingLeft: isListItem ? '1.5rem' : '0',
                textIndent: isListItem ? '-1.5rem' : '0',
                textAlign: 'justify',
                lineHeight: '1.5'
            }}>
                {isListItem && listMatch ? (
                    <>
                        <strong style={{ fontWeight: 'bold', marginRight: '4px' }}>{listMatch[1]}</strong>
                        {listMatch[2]}
                    </>
                ) : trimmed}
            </p>
        );
    };

    const renderScienceTerm = (content?: string) => (
        <div style={{
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
            fontSize: '11pt',
            backgroundColor: '#f3f4f6',
            padding: '0.6rem',
            borderLeft: '4px solid #1f2937',
            borderRadius: '2px',
            lineHeight: '1.5'
        }}>
            <strong style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '11pt' }}>
                TERMO DE CIÊNCIA
            </strong>
            <p style={{ margin: 0, fontSize: '11pt', lineHeight: '1.5' }}>
                {content || `Estou ciente que a utilização inadequada pode resultar em medidas administrativas e que sou responsável pela segurança e integridade do ${isRoom ? 'espaço' : 'equipamento'} durante todo o período da recorrência.`}
            </p>
        </div>
    );

    return (
        <div id="term-doc-inner" style={{
            width: '210mm',
            minHeight: '296mm',
            padding: '15mm 20mm 20mm 30mm',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            position: 'relative',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <img src="/logo-objetivo.jpg" alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '100px', margin: '0 auto', display: 'block' }} />
            </div>

            <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
                Declaração de Responsabilidade e Termo de Uso
            </h1>

            <div style={{ textAlign: 'justify', marginBottom: '0.5rem' }}>
                <p>
                    Declaro que eu, <strong style={{ fontWeight: 'bold' }}>{getName()}</strong>, portador(a) do número de usuário TOTVS <strong style={{ fontWeight: 'bold' }}>{getTotvs()}</strong>,
                    estou ciente e de acordo com as condições de uso {isRoom ? 'do espaço físico' : 'do(s) equipamento(s)'} abaixo descrito(s),
                    responsabilizando-me integralmente por sua utilização durante o período de agendamento.
                </p>
            </div>

            {/* Booking Stats Box */}
            <div style={{ marginBottom: '0.5rem', border: '1px solid #d1d5db', padding: '0.4rem 0.75rem', borderRadius: '0.25rem', backgroundColor: '#f9fafb' }}>
                <h2 style={{ fontWeight: 'bold', borderBottom: '1px solid #d1d5db', marginBottom: '0.25rem', paddingBottom: '8px', fontSize: '11pt', textTransform: 'uppercase' }}>Dados do Agendamento</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <p><strong>Unidade:</strong> {getUnit()}</p>
                    <p><strong>{isRoom ? 'Sala/Espaço' : 'Local'}:</strong> {getLocal()}</p>
                    <p><strong>Dia de Uso:</strong> {getDate()}</p>
                    <p><strong>Horário:</strong> {getTime()}</p>
                </div>
                {getRecurringDates() && (
                    <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #d1d5db' }}>
                        <p style={{ fontSize: '10pt', marginBottom: '4px', fontWeight: 'bold' }}>Datas agendadas para o mês atual:</p>
                        <p style={{ fontSize: '11pt', fontWeight: 'bold', color: '#1f2937' }}>
                            {getRecurringDates()?.join(' - ')}
                        </p>
                    </div>
                )}
            </div>

            {getEquipments().length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                    <h2 style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '0.2rem', paddingBottom: '4px', fontSize: '11pt', textTransform: 'uppercase' }}>Equipamento(s) Reservado(s)</h2>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem' }}>
                        {getEquipments().map((eq, i) => (
                            <li key={i}><strong>{eq.name}</strong>{eq.brand ? ` (${eq.brand} ${eq.model || ''})` : ''} - {eq.quantity} unidade(s)</li>
                        ))}
                    </ul>
                </div>
            )}

            {data.term_document?.content ? (
                <div style={{ marginBottom: '1rem', color: '#1f2937' }}>
                    {data.term_document.content.split('\n').map((line: string, i: number) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('Estou ciente que a utilização')) {
                            // Using isRecurring here causes reference error if not defined in scope
                            return (
                                <div key={i} style={isRecurring ? { pageBreakBefore: 'always', paddingTop: '30mm' } : {}}>
                                    {renderScienceTerm(trimmed)}
                                </div>
                            );
                        }
                        if (trimmed === 'TERMO DE CIÊNCIA') return null;
                        return renderLine(line, i);
                    })}
                </div>
            ) : (
                <div style={{ marginBottom: '1rem' }}>
                    {renderLine('COMPROMISSOS E RESPONSABILIDADES', 'c1')}
                    {renderLine('Ao aceitar este termo, comprometo-me a:', 'c2')}
                    {renderLine(`1. Utilizar o ${isRoom ? 'espaço' : 'equipamento'} exclusivamente durante o período agendado e no local especificado.`, 'l1')}
                    {renderLine(`2. Zelar pela conservação e bom funcionamento do ${isRoom ? 'espaço e seus itens' : 'equipamento'}.`, 'l2')}
                    {renderLine('3. Comunicar imediatamente à equipe responsável qualquer defeito ou irregularidade constatada.', 'l3')}
                    {renderLine(`4. Não emprestar ou transferir o ${isRoom ? 'espaço' : 'equipamento'} a terceiros sem autorização prévia.`, 'l4')}
                    {renderLine(`5. Orientar adequadamente o uso do ${isRoom ? 'espaço' : 'equipamento'}, quando utilizado por alunos, zelando por sua conservação.`, 'l5')}

                    {isRecurring &&
                        renderLine('6. Declaro ciência que este é um AGENDAMENTO FIXO (RECORRENTE) e este termo de responsabilidade aplica-se a todas as ocorrências geradas automaticamente por esta reserva semanal.', 'l6')
                    }

                    <div style={{ marginTop: '1rem', textAlign: 'justify' }}>
                        <p>Comprometo-me a devolver o(s) equipamento(s) nas mesmas condições em que o(s) recebi. Estou ciente que qualquer dano ou extravio será de minha responsabilidade.</p>
                    </div>

                    <div style={isRecurring ? { pageBreakBefore: 'always', paddingTop: '30mm' } : {}}>
                        {renderScienceTerm()}
                    </div>
                </div>
            )}

            {/* Signature Area */}
            <div style={{ marginTop: isRecurring ? '2rem' : '1rem', marginBottom: isRecurring ? '4rem' : '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '50%', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>{getName()}</div>
                    <div style={{ borderBottom: '1px solid #000' }}></div>
                    <p style={{ fontSize: '8pt', color: '#4b5563', marginTop: '4px' }}>Responsável • TOTVS: {getTotvs()}</p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '8pt' }}>
                    <p style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Assinatura Digital</p>
                    <p>Data: {data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Hora: {data.created_at ? new Date(data.created_at).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>

            {/* Footer Traceability */}
            {(displayId || data.term_hash || data.term_fingerprint || data.term_document?.term_hash || data.term_document?.term_fingerprint) && (
                <div style={{ marginTop: isRecurring ? '1rem' : '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '7.5pt', color: '#6b7280', fontWeight: 'normal' }}>
                        {displayId && <span style={{ color: '#000' }}><strong style={{ fontWeight: 'bold' }}>ID DO TERMO: #{displayId}</strong></span>}
                        <span style={{ margin: '0 8px' }}>|</span>
                        <strong style={{ fontWeight: 'bold', color: '#000' }}>VERSÃO:</strong> {data.version_tag || data.term_document?.version_tag || 'v2.0'}
                        <span style={{ margin: '0 8px' }}>|</span>
                        <strong style={{ fontWeight: 'bold', color: '#000' }}>HASH:</strong> {(data.term_hash || data.term_fingerprint || data.term_document?.term_hash || data.term_document?.term_fingerprint)?.substring(0, 32)}...
                    </p>
                    <p style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '4px' }}>Documento gerado eletronicamente pelo Sistema de Agendamentos Objetivo.</p>
                </div>
            )}
        </div>
    );
};
