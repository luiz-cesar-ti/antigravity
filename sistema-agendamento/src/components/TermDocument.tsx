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

    const getDate = () => {
        const isRecOrFixo = data.isRecurring || data.term_document?.isRecurring;
        if (isRecOrFixo) {
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
            if (date.getDay() === dayNum) dates.push(date.toLocaleDateString('pt-BR'));
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
                marginTop: isTitle ? '1rem' : '0',
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
            marginTop: '1.5rem',
            marginBottom: '1rem',
            fontSize: '11pt',
            backgroundColor: '#f3f4f6',
            padding: '1rem',
            borderLeft: '4px solid #1f2937',
            borderRadius: '2px',
            lineHeight: '1.5'
        }}>
            <strong style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '11pt' }}>
                TERMO DE CIÊNCIA
            </strong>
            <p style={{ margin: 0, fontSize: '11pt', lineHeight: '1.5' }}>
                {content || `Estou ciente que a utilização inadequada pode resultar em medidas administrativas e que sou responsável pela segurança e integridade do ${isRoom ? 'espaço' : 'equipamento'}.`}
            </p>
        </div>
    );

    return (
        <div id="term-doc-inner" style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '30mm 20mm 20mm 30mm',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.5',
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <img src="/logo-objetivo.jpg" alt="Logo" crossOrigin="anonymous" style={{ maxHeight: '100px', margin: '0 auto', display: 'block' }} />
            </div>

            <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                Declaração de Responsabilidade e Termo de Uso
            </h1>

            <div style={{ textAlign: 'justify', marginBottom: '0.75rem' }}>
                <p>
                    Declaro que eu, <strong style={{ fontWeight: 'bold' }}>{getName()}</strong>, portador(a) do número de usuário TOTVS <strong style={{ fontWeight: 'bold' }}>{getTotvs()}</strong>,
                    estou ciente e de acordo com as condições de uso {isRoom ? 'do espaço físico' : 'do(s) equipamento(s)'} abaixo descrito(s),
                    responsabilizando-me integralmente por sua utilização durante o período de agendamento.
                </p>
            </div>

            {/* Booking Stats Box */}
            <div style={{ marginBottom: '0.75rem', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#f9fafb' }}>
                <h2 style={{ fontWeight: 'bold', borderBottom: '1px solid #d1d5db', marginBottom: '0.25rem', fontSize: '11pt', textTransform: 'uppercase' }}>Dados do Agendamento</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    <p><strong>Unidade:</strong> {getUnit()}</p>
                    <p><strong>{isRoom ? 'Sala/Espaço' : 'Local'}:</strong> {getLocal()}</p>
                    <p><strong>Dia de Uso:</strong> {getDate()}</p>
                    <p><strong>Horário:</strong> {getTime()}</p>
                </div>
                {getRecurringDates() && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #d1d5db' }}>
                        <p style={{ fontSize: '11pt', marginBottom: '6px', fontWeight: 'bold' }}>Datas agendadas para o mês atual:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {getRecurringDates()?.map(d => (
                                <span key={d} style={{ backgroundColor: '#fff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #9ca3af', fontWeight: 'bold' }}>{d}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {getEquipments().length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                    <h2 style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '0.25rem', fontSize: '11pt', textTransform: 'uppercase' }}>Equipamento(s) Reservado(s)</h2>
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
                        if (trimmed.startsWith('Estou ciente que a utilização')) return renderScienceTerm(trimmed);
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

                    {(data.isRecurring || data.term_document?.isRecurring) &&
                        renderLine('6. Declaro ciência que este é um Agendamento Fixo e concordo em assinar digitalmente todos os termos gerados automaticamente.', 'l6')
                    }

                    <div style={{ marginTop: '1rem', textAlign: 'justify' }}>
                        <p>Comprometo-me a devolver {isRoom ? 'o espaço' : 'o(s) equipamento(s)'} nas mesmas condições em que o(s) recebi.</p>
                    </div>

                    {renderScienceTerm()}
                </div>
            )}

            {/* Signature Area */}
            <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
            {(displayId || data.term_hash || data.term_fingerprint || data.term_document?.term_hash) && (
                <div style={{ marginTop: '1.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: '0.5rem', textAlign: 'center' }}>
                    {displayId && <p style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '4px' }}>ID DO TERMO: #{displayId}</p>}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '7.5pt', color: '#6b7280' }}>
                        <span><strong style={{ fontWeight: 'bold' }}>VERSÃO:</strong> {data.version_tag || 'v2.0'}</span>
                        <span><strong style={{ fontWeight: 'bold' }}>HASH:</strong> {(data.term_hash || data.term_fingerprint || data.term_document?.term_hash)?.substring(0, 24)}...</span>
                    </div>
                </div>
            )}
            <p style={{ fontSize: '7.5pt', color: '#9ca3af', marginTop: '4px', textAlign: 'center' }}>Documento gerado eletronicamente pelo Sistema de Agendamentos Objetivo.</p>
        </div>
    );
};
