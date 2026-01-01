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
    term_document?: {
        equipments: TermEquipment[];
    };
    created_at?: string;
    timestamp?: string;
}

interface TermDocumentProps {
    data: TermData;
    id?: string;
}

export const TermDocument: React.FC<TermDocumentProps> = ({ data, id }) => {
    // Helper to extract data regardless of source (Wizard or DB)
    const getName = () => data.full_name || data.userName || '';
    const getTotvs = () => data.totvs_number || data.userTotvs || '';
    const getUnit = () => data.unit || '';
    const getLocal = () => data.local || '';

    const getDate = () => {
        const d = data.date || data.booking_date;
        if (!d) return '';
        // If it's ISO, try standard format, otherwise split
        if (d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
        return d.split('-').reverse().join('/');
    };

    const getTime = () => {
        const s = data.startTime || data.start_time;
        const e = data.endTime || data.end_time;
        return `${s} às ${e}`;
    };

    const getEquipments = (): TermEquipment[] => {
        if (data.equipments && Array.isArray(data.equipments)) return data.equipments;
        if (data.term_document && data.term_document.equipments) return data.term_document.equipments;
        return [];
    };



    return (
        <div id={id} style={{
            width: '100%',
            padding: '15mm',
            margin: '0 auto',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.4',
            position: 'relative',
            boxSizing: 'border-box'
        }}>
            {/* Header / Logo */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '5mm' }}>
                <img
                    src="/logo-objetivo.jpg"
                    alt="Logo Colégio Objetivo"
                    crossOrigin="anonymous"
                    style={{ maxHeight: '80px', margin: '0 auto', display: 'block' }}
                />
            </div>

            <h1 style={{
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '14pt',
                marginBottom: '1.5rem',
                textTransform: 'uppercase',
                maxWidth: '90%',
                margin: '0 auto 1.5rem'
            }}>
                Declaração de Responsabilidade e Termo de Uso
            </h1>

            <div style={{ textAlign: 'justify', marginBottom: '1.5rem' }}>
                <p style={{ marginBottom: '1rem' }}>
                    Declaro que eu, <strong style={{ fontWeight: 'bold' }}>{getName()}</strong>, portador(a) do número de usuário TOTVS <strong style={{ fontWeight: 'bold' }}>{getTotvs()}</strong>,
                    estou ciente e de acordo com as condições de uso do(s) equipamento(s) abaixo descrito(s),
                    responsabilizando-me integralmente por sua utilização durante o período de agendamento.
                </p>
            </div>

            <div style={{
                marginBottom: '1.5rem',
                border: '1px solid #d1d5db',
                padding: '1rem',
                borderRadius: '0.25rem',
                backgroundColor: '#f9fafb'
            }}>
                <h2 style={{
                    fontWeight: 'bold',
                    borderBottom: '1px solid #d1d5db',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.25rem',
                    fontSize: '10pt',
                    textTransform: 'uppercase'
                }}>Dados do Agendamento</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '10pt' }}>
                    <p><strong>Unidade:</strong> {getUnit()}</p>
                    <p><strong>Local:</strong> {getLocal()}</p>
                    <p><strong>Data de Uso:</strong> {getDate()}</p>
                    <p><strong>Horário:</strong> {getTime()}</p>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{
                    fontWeight: 'bold',
                    borderBottom: '1px solid #000000',
                    marginBottom: '0.5rem',
                    paddingBottom: '0.25rem',
                    fontSize: '10pt',
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

            <div style={{ marginBottom: '2rem', textAlign: 'justify', fontSize: '10pt' }}>
                <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Compromissos e Responsabilidades</h2>
                <p style={{ marginBottom: '0.5rem' }}>Ao aceitar este termo, comprometo-me a:</p>
                <ol style={{ listStyleType: 'decimal', paddingLeft: '1.25rem' }}>
                    <li style={{ marginBottom: '0.25rem' }}>Utilizar o equipamento exclusivamente durante o período agendado e no local especificado.</li>
                    <li style={{ marginBottom: '0.25rem' }}>Orientar adequadamente o uso do equipamento, zelando por sua conservação.</li>
                    <li style={{ marginBottom: '0.25rem' }}>Responsabilizar-me por qualquer dano decorrente de mau uso ou negligência.</li>
                    <li style={{ marginBottom: '0.25rem' }}>Informar imediatamente a administração sobre qualquer defeito identificado.</li>
                    <li style={{ marginBottom: '0.25rem' }}>Devolver o equipamento nas mesmas condições em que foi recebido.</li>
                    <li style={{ marginBottom: '0.25rem' }}>Utilizar o equipamento apenas para fins educacionais e pedagógicos.</li>
                </ol>
            </div>

            <div style={{
                marginBottom: '3rem',
                fontSize: '10pt',
                backgroundColor: '#f3f4f6',
                padding: '1rem',
                borderLeft: '4px solid #1f2937'
            }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>TERMO DE CIÊNCIA</h3>
                <p>
                    Estou ciente que a utilização inadequada pode resultar em medidas administrativas
                    e que sou responsável pela segurança e integridade do equipamento durante o período de uso.
                </p>
            </div>

            <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ width: '50%' }}>
                    <div style={{ borderBottom: '1px solid #000', marginBottom: '0.5rem', width: '100%' }}>
                        {/* Signature Line */}
                    </div>
                    <p style={{ fontSize: '10pt', fontWeight: 'bold', textTransform: 'uppercase' }}>{getName()}</p>
                    <p style={{ fontSize: '9pt', color: '#4b5563' }}>Professor(a) Responsável</p>
                    <p style={{ fontSize: '9pt', color: '#4b5563' }}>TOTVS: {getTotvs()}</p>
                </div>

                <div style={{ textAlign: 'right', fontSize: '9pt', color: '#6b7280' }}>
                    <p style={{ fontWeight: 'bold', color: '#000', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Assinado Digitalmente</p>
                    <p>Data: {data.created_at ? new Date(data.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}</p>
                    <p>Hora: {data.created_at ? new Date(data.created_at).toLocaleTimeString('pt-BR') : new Date().toLocaleTimeString('pt-BR')}</p>
                    <div style={{ fontSize: '8pt', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                        ID: {id || 'PENDING'}
                    </div>
                </div>
            </div>

            <div style={{
                marginTop: '3rem',
                borderTop: '1px dashed #e5e7eb',
                paddingTop: '1rem',
                textAlign: 'center',
                fontSize: '8pt',
                color: '#9ca3af'
            }}>
                <p>Este documento foi gerado eletronicamente pelo Sistema de Agendamentos Objetivo.</p>
                <p>A autenticidade deste documento pode ser verificada junto à coordenação da unidade.</p>
            </div>
        </div>
    );
};
