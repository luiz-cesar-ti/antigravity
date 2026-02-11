// 🛑 FILE LOCKED: DO NOT EDIT. THIS RENDER LOGIC IS CRITICAL FOR PDF ALIGNMENT.
import React from 'react';
import { UNIT_LEGAL_NAMES } from '../utils/constants'; // Import legal mapping
// import { LOGO_BASE64 } from './TermDocumentLogo';

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
    job_title?: string;
    jobTitle?: string;
    legal_name?: string;
    legalName?: string;
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

    // Cargo/Job Title Logic
    const getJobTitle = () => data.job_title || data.jobTitle || data.term_document?.jobTitle || data.term_document?.job_title || data.users?.job_title || 'Colaborador(a)';

    // Legal Name Logic (Snapshot > Constant Map > Fallback)
    const getLegalName = () => {
        if (data.legal_name || data.legalName) return data.legal_name || data.legalName;
        if (data.term_document?.legalName || data.term_document?.legal_name) return data.term_document.legalName || data.term_document.legal_name;

        // Fallback using current map if not in snapshot
        const unitName = getUnit();
        return UNIT_LEGAL_NAMES[unitName] || 'SOCIEDADE INSTRUTIVA JOAQUIM NABUCO LTDA';
    };

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
        const isListItem = /^(\d+\.|[a-zA-Z]\))/.test(trimmed);
        const listMatch = trimmed.match(/^(\d+\.|[a-zA-Z]\))(.*)/);

        // UNIFIED Alignment Fix: Use Flexbox for perfect list alignment (Normal AND Recurring)
        if (isListItem && listMatch) {
            return (
                <div key={key} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '0.4rem',
                    textAlign: 'justify',
                    fontSize: '11pt',
                    lineHeight: '1.5'
                }}>
                    <div style={{ minWidth: '25px', fontWeight: 'bold' }}>
                        {listMatch[1].replace(/\.$/, ')')}
                    </div>
                    <div style={{ flex: 1 }}>
                        {listMatch[2].trim()}
                    </div>
                </div>
            );
        }

        // Standard Render (Legacy / Normal Term)
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
                        <strong style={{ fontWeight: 'bold', marginRight: '4px' }}>{listMatch[1].replace(/\.$/, ')')}</strong>
                        {listMatch[2]}
                    </>
                ) : trimmed}
            </p>
        );
    };

    const renderScienceTerm = (content?: string) => (
        <div style={{
            marginTop: isRecurring ? '0.2rem' : '0.5rem', // Compact for recurring
            marginBottom: isRecurring ? '0.2rem' : '0.5rem', // Compact for recurring
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
                <img src="/logo-objetivo.jpg" alt="Logo" style={{ maxHeight: '100px', margin: '0 auto', display: 'block' }} />
            </div>

            <h1 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', margin: '0 0 0.25rem' }}>
                Declaração de Responsabilidade e Termo de Uso
            </h1>

            <div style={{ textAlign: 'justify', marginBottom: '2.5rem' }}>
                <p>
                    Declaro que eu, <strong style={{ fontWeight: 'bold' }}>{getName()}</strong>, portador(a) do número de usuário TOTVS <strong style={{ fontWeight: 'bold' }}>{getTotvs()}</strong>,
                    <strong style={{ fontWeight: 'bold' }}> {getJobTitle()}</strong> na empresa <strong style={{ fontWeight: 'bold' }}>{getLegalName()}</strong>,
                    estou ciente e de acordo com as condições de uso {isRoom ? 'do espaço físico' : 'do(s) equipamento(s)'} abaixo descrito(s),
                    responsabilizando-me integralmente por sua utilização durante o período de agendamento.
                </p>
            </div>

            {/* 
               🛑 TRAVA DE DESIGN - LAYOUT APROVADO (Normal e Recorrente):
               Este layout de "Dados do Agendamento", "Equipamentos" e "Listas" foi aprovado e testado.
               A renderização de listas agora usa Flexbox para alinhamento perfeito em ambos os modos.
               Para ajustes específicos de recorrentes (como datas), use condicionais `if (isRecurring)`.
            */}

            {/* Booking Stats Box - Adjusted spacing as requested */}
            <div style={{ marginBottom: '0.8rem', border: '1px solid #d1d5db', padding: '0.6rem 0.75rem 0.8rem 0.75rem', borderRadius: '0.25rem', backgroundColor: '#f9fafb' }}>
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
                    <div style={{ paddingLeft: '1.25rem' }}>
                        {getEquipments().map((eq, i) => (
                            <div key={i} style={{
                                marginBottom: i < getEquipments().length - 1 ? '0.6rem' : '1rem',
                                borderBottom: i < getEquipments().length - 1 ? '1px solid #9ca3af' : 'none', // Darker gray (#9ca3af)
                                paddingBottom: i < getEquipments().length - 1 ? '0.6rem' : '0'
                            }}>
                                <p style={{ margin: 0, lineHeight: '1.4' }}><strong>Equipamento:</strong> {eq.name}</p>
                                {eq.brand && <p style={{ margin: 0, lineHeight: '1.4' }}><strong>Marca:</strong> {eq.brand}</p>}
                                {eq.model && <p style={{ margin: 0, lineHeight: '1.4' }}><strong>Modelo:</strong> {eq.model}</p>}
                                <p style={{ margin: 0, lineHeight: '1.4' }}><strong>Quantidade:</strong> {String(eq.quantity).padStart(2, '0')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.term_document?.content ? (
                <div style={{ marginBottom: '1rem', color: '#1f2937' }}>
                    {data.term_document.content.split('\n').map((line: string, i: number) => {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('Estou ciente que a utilização')) {
                            return (
                                <div key={i} style={{ marginTop: '1rem' }}>
                                    {renderScienceTerm(trimmed)}
                                </div>
                            );
                        }
                        if (trimmed === 'TERMO DE CIÊNCIA') return null;

                        const manyEquipments = getEquipments().length >= 3;
                        const twoEquipments = getEquipments().length === 2;

                        // RECURRING SPECIAL LOGIC: Break at 'd)' for 3+ equipments
                        if (isRecurring && manyEquipments && trimmed.startsWith('d)')) {
                            return (
                                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
                                    {renderLine(line, i)}
                                </div>
                            );
                        }

                        // RECURRING SPECIAL LOGIC: Break at 'f)' for 2 equipments
                        if (isRecurring && twoEquipments && trimmed.startsWith('f)')) {
                            return (
                                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
                                    {renderLine(line, i)}
                                </div>
                            );
                        }

                        // Specific break logic for exactly 2 equipments (force break at 'g)')
                        // BUT ONLY IF NOT RECURRING (since recurring breaks at 'f')
                        if (!isRecurring && twoEquipments && trimmed.startsWith('g)')) {
                            return (
                                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
                                    {renderLine(line, i)}
                                </div>
                            );
                        }

                        // Specific break logic for 3+ equipments (force break at 'e)')
                        // BUT ONLY IF NOT RECURRING (since recurring breaks at 'd')
                        if (!isRecurring && manyEquipments && trimmed.startsWith('e)')) {
                            return (
                                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
                                    {renderLine(line, i)}
                                </div>
                            );
                        }

                        // Force page break before item 'h)' (ONLY for fewer equipments)
                        // If we broke at d) OR e) OR f) OR g), we don't need to break at h) again
                        if (!manyEquipments && !twoEquipments && trimmed.startsWith('h)')) {
                            return (
                                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '20mm' }}>
                                    {renderLine(line, i)}
                                </div>
                            );
                        }

                        return renderLine(line, i);
                    })}
                </div>
            ) : (
                <div style={{ marginBottom: '1rem' }}>
                    {renderLine('COMPROMISSOS E RESPONSABILIDADES', 'c1')}
                    {renderLine('Ao aceitar este termo, comprometo-me a:', 'c2')}

                    {renderLine(`a) Utilizar o ${isRoom ? 'espaço' : 'equipamento'} exclusivamente durante o período agendado e no local especificado.`, 'l1')}
                    {renderLine(`b) Zelar pela conservação e bom funcionamento do ${isRoom ? 'espaço e seus itens' : 'equipamento'}.`, 'l2')}

                    {renderLine(`Não emprestar ou transferir ${isRoom ? 'este espaço' : 'este equipamento'} a terceiros sem autorização prévia.`, 'l3_pre')}
                    {renderLine(`c) Comunicar imediatamente à equipe responsável qualquer dano, irregularidade ou extravio do ${isRoom ? 'espaço' : 'equipamento'}.`, 'l3')}

                    {renderLine(`d) Orientar adequadamente o uso do ${isRoom ? 'espaço' : 'equipamento'}, quando utilizado por alunos em sala de aula, zelando por sua conservação e bom funcionamento.`, 'l4')}

                    {renderLine(`e) Caso o ${isRoom ? 'espaço' : 'equipamento'} seja danificado por aluno, o fato deverá ser comunicado imediatamente à Coordenação e ao Técnico da Educação Digital.`, 'l5')}

                    {renderLine(`f) Estou ciente que o transporte do equipamento e sua integridade estão sob minha responsabilidade.`, 'l6')}

                    {renderLine(`g) Declaro estar ciente de que serei responsável por arcar com os custos de reparo ou reposição do equipamento, nos casos de danos decorrentes de mau uso, negligência ou imperícia.`, 'l7')}

                    {renderLine(`h) Declaro estar ciente de que não é permitido o armazenamento de arquivos pessoais no equipamento, sendo de responsabilidade do usuário a guarda de seus dados. O Técnico de Educação Digital está autorizado a realizar a exclusão de arquivos considerados desnecessários ou incompatíveis com a finalidade pedagógica do equipamento, sem necessidade de aviso prévio.`, 'l8')}

                    {renderLine(`i) Declaro estar ciente de que os aplicativos instalados no equipamento são oficiais e previamente autorizados pela instituição, não sendo permitida a instalação de novos aplicativos sem a autorização do Técnico de Educação Digital. Todos os softwares utilizados no equipamento deverão ser oficiais e devidamente licenciados.`, 'l9')}

                    {renderLine(`j) Declaro estar ciente de que o equipamento deverá ser entregue ao responsável pela Educação Digital ao final do período de agendamento, não sendo permitido deixá-lo desacompanhado, abandonado ou fora da guarda adequada nas dependências da instituição de ensino.`, 'l10')}

                    {isRecurring &&
                        renderLine('K) Declaro estar ciente de que as datas de utilização do equipamento, discriminadas na parte superior deste termo, refletem os agendamentos gerados automaticamente pelo sistema, vinculando o presente termo de responsabilidade a todas as utilizações ali previstas.', 'l11')
                    }



                    <div style={{ marginTop: '1rem' }}>
                        {renderScienceTerm()}
                    </div>
                </div>
            )}

            {/* Signature Area */}
            <div style={{ marginTop: isRecurring ? '0.5rem' : '1rem', marginBottom: isRecurring ? '0.2rem' : '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
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
                <div style={{ marginTop: isRecurring ? '0.2rem' : '0.5rem', borderTop: '1px dashed #e5e7eb', paddingTop: isRecurring ? '0.2rem' : '0.5rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '7.5pt', color: '#6b7280', fontWeight: 'normal' }}>

                        {displayId && <span style={{ color: '#000' }}><strong style={{ fontWeight: 'bold' }}>ID DO TERMO: #{displayId}</strong></span>}
                        <span style={{ margin: '0 8px' }}>|</span>
                        <strong style={{ fontWeight: 'bold', color: '#000' }}>VERSÃO:</strong> {data.version_tag || data.term_document?.version_tag || 'v3.0-loan'}
                        <span style={{ margin: '0 8px' }}>|</span>
                        <strong style={{ fontWeight: 'bold', color: '#000' }}>HASH:</strong> {(data.term_hash || data.term_fingerprint || data.term_document?.term_hash || data.term_document?.term_fingerprint)?.substring(0, 32)}...
                    </p>
                    <p style={{ fontSize: '7pt', color: '#9ca3af', marginTop: '4px' }}>Documento gerado eletronicamente pelo Sistema de Agendamentos Objetivo.</p>
                </div>
            )}
        </div>
    );
};
