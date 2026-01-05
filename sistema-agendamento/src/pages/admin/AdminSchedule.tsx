
import { useState, useEffect, useRef } from 'react';
import {
    Calendar,
    Upload,
    Download,
    Plus,
    Trash2,
    Save,
    AlertCircle,
    CheckCircle2,
    FileSpreadsheet,
    Clock,
    LayoutGrid,
    Info
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ScheduleGrid {
    headers: string[];
    rows: string[][];
}

interface ClassSchedule {
    id?: string;
    unit: string;
    day_of_week: string;
    segment: string;
    schedule_data: ScheduleGrid;
}

const DAYS_OF_WEEK = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira'
];

const SEGMENTS = [
    'Ensino Fundamental 2',
    'Ensino Médio'
];

export function AdminSchedule() {
    const { user } = useAuth();
    const adminUnit = (user as any)?.unit;

    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
    const [selectedSegment, setSelectedSegment] = useState(SEGMENTS[0]);
    const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSchedule(null); // Clear immediately to avoid "ghost data" from previous day
        if (adminUnit) {
            fetchSchedule();
        } else {
            setIsLoading(false);
            setSchedule({
                unit: '',
                day_of_week: selectedDay,
                segment: selectedSegment,
                schedule_data: {
                    headers: ['Horário', 'Turma A', 'Turma B'],
                    rows: [['', '', '']]
                }
            });
        }
    }, [adminUnit, selectedDay, selectedSegment]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('unit', adminUnit)
                .eq('day_of_week', selectedDay)
                .eq('segment', selectedSegment)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setSchedule(data);
            } else {
                // Default empty grid
                setSchedule({
                    unit: adminUnit,
                    day_of_week: selectedDay,
                    segment: selectedSegment,
                    schedule_data: {
                        headers: ['Horário', 'Turma A', 'Turma B'],
                        rows: [['', '', '']]
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!schedule) return;
        setIsSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('class_schedules')
                .upsert({
                    ...schedule,
                    unit: adminUnit,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Horário salvo com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Erro ao salvar horário.' });
        } finally {
            setIsSaving(false);
        }
    };

    const updateHeader = (index: number, value: string) => {
        setSchedule(prev => {
            if (!prev) return prev;
            const newHeaders = [...prev.schedule_data.headers];
            newHeaders[index] = value;
            return {
                ...prev,
                schedule_data: { ...prev.schedule_data, headers: newHeaders }
            };
        });
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        setSchedule(prev => {
            if (!prev) return prev;
            const newRows = [...prev.schedule_data.rows];
            newRows[rowIndex] = [...newRows[rowIndex]];
            newRows[rowIndex][colIndex] = value;
            return {
                ...prev,
                schedule_data: { ...prev.schedule_data, rows: newRows }
            };
        });
    };

    const addColumn = () => {
        setSchedule(prev => {
            const current = prev || {
                unit: adminUnit || '',
                day_of_week: selectedDay,
                segment: selectedSegment,
                schedule_data: { headers: ['Horário'], rows: [['']] }
            };
            const nextLetter = String.fromCharCode(65 + (current.schedule_data.headers.length - 1));
            const newHeaders = [...current.schedule_data.headers, `Turma ${nextLetter}`];
            const newRows = current.schedule_data.rows.map(row => [...row, '']);
            return {
                ...current,
                schedule_data: { headers: newHeaders, rows: newRows }
            };
        });
    };

    const removeColumn = (index: number) => {
        setSchedule(prev => {
            if (!prev || prev.schedule_data.headers.length <= 1) return prev;
            const newHeaders = prev.schedule_data.headers.filter((_, i) => i !== index);
            const newRows = prev.schedule_data.rows.map(row => row.filter((_, i) => i !== index));
            return {
                ...prev,
                schedule_data: { headers: newHeaders, rows: newRows }
            };
        });
    };

    const addRow = () => {
        setSchedule(prev => {
            const current = prev || {
                unit: adminUnit || '',
                day_of_week: selectedDay,
                segment: selectedSegment,
                schedule_data: { headers: ['Horário', 'Turma A'], rows: [] }
            };
            const newRow = new Array(current.schedule_data.headers.length).fill('');
            return {
                ...current,
                schedule_data: {
                    ...current.schedule_data,
                    rows: [...current.schedule_data.rows, newRow]
                }
            };
        });
    };

    const removeRow = (index: number) => {
        setSchedule(prev => {
            if (!prev || prev.schedule_data.rows.length <= 1) return prev;
            const newRows = prev.schedule_data.rows.filter((_, i) => i !== index);
            return {
                ...prev,
                schedule_data: { ...prev.schedule_data, rows: newRows }
            };
        });
    };

    const downloadTemplate = () => {
        const headers = ['Horário', '6º Ano A', '6º Ano B', '7º Ano A'];
        const roomsRow = ['', 'Sala 16', 'Sala 17', 'Sala 14'];
        const exampleRow = ['07:20 - 08:10', 'Rosane', 'D.Gatti', 'Felipe'];
        const csvContent = [headers, roomsRow, exampleRow].map(row => row.join(',')).join('\n');

        // Add UTF-8 BOM for Excel compatibility (solves "strange letters" problem)
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `modelo_horario_${selectedSegment.toLowerCase().replace(/ /g, '_')}.csv`;
        link.click();
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const buffer = e.target?.result as ArrayBuffer;
            let text = '';

            try {
                // Try decoding as UTF-8 first with error checking
                const decoder = new TextDecoder('utf-8', { fatal: true });
                text = decoder.decode(buffer);
            } catch (err) {
                // Fallback to Windows-1252 (Standard for Brazilian Excel)
                const decoder = new TextDecoder('windows-1252');
                text = decoder.decode(buffer);
            }

            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 1) return;

            // Simple parser: check for comma or semicolon
            const delimiter = lines[0].includes(';') ? ';' : ',';

            const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
            const rows = lines.slice(1).map(line =>
                line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ''))
            );

            setSchedule({
                unit: adminUnit || '',
                day_of_week: selectedDay,
                segment: selectedSegment,
                schedule_data: { headers, rows }
            });

            if (fileInputRef.current) fileInputRef.current.value = '';
            setMessage({ type: 'success', text: 'Dados importados com sucesso! Não esqueça de salvar.' });
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary-600 mb-1">
                        <Calendar className="h-6 w-6" />
                        <span className="text-sm font-black uppercase tracking-widest italic">Gestão Escolar</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Horário de Aulas</h1>
                    <p className="text-gray-500 font-medium">Configure a grade de horários para a unidade {adminUnit}.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm active:scale-95"
                    >
                        <Download className="h-4 w-4" />
                        Baixar Modelo
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-700 font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-primary-100 hover:bg-primary-100 transition-all shadow-sm active:scale-95"
                    >
                        <Upload className="h-4 w-4" />
                        Importar CSV
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <Clock className="h-3 w-3" /> Dia da Semana
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map(day => (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border-2 ${selectedDay === day
                                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-primary-100'
                                    }`}
                            >
                                {day.split('-')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <LayoutGrid className="h-3 w-3" /> Seguimento Escolar
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SEGMENTS.map(seg => (
                            <button
                                key={seg}
                                onClick={() => setSelectedSegment(seg)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all border-2 ${selectedSegment === seg
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-100'
                                    }`}
                            >
                                {seg}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative min-h-[500px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                            <span className="font-black text-xs text-primary-600 uppercase tracking-widest italic">Carregando Grade...</span>
                        </div>
                    </div>
                ) : null}

                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 leading-none">{selectedDay}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{selectedSegment}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {message && (
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in slide-in-from-right duration-300 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                                    }`}>
                                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {message.text}
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Salvando...' : 'Salvar Grade'}
                            </button>
                        </div>
                    </div>

                    {/* Instructions Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top duration-500">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                            <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs text-blue-800 font-black uppercase tracking-wider">Dica de Edição Manual</p>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Use os botões <strong>+</strong> para adicionar turmas (colunas) ou horários (linhas). Digite o nome do professor e a sala em cada célula. Para excluir, passe o mouse sobre a célula e use o ícone de lixeira.
                                </p>
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs text-amber-800 font-black uppercase tracking-wider">Como Preencher o CSV</p>
                                <ul className="text-[11px] text-amber-700 list-disc ml-4 space-y-0.5">
                                    <li><strong>Linha 1:</strong> Cabeçalhos das Turmas.</li>
                                    <li><strong>Linha 2:</strong> Deixe o Horário vazio e coloque apenas as <strong>Salas</strong> (ex: Sala 16).</li>
                                    <li><strong>Linhas Seguintes:</strong> Coloque o Horário na Coluna A e os <strong>Nomes dos Professores</strong> nas demais.</li>
                                    <li><strong>Importante:</strong> Siga exatamente essa ordem para a grade ficar correta.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Editable Table */}
                    <div className="overflow-x-auto pb-6 custom-scrollbar">
                        <table className="w-full border-separate border-spacing-2">
                            <thead>
                                <tr>
                                    {schedule?.schedule_data.headers.map((header, i) => (
                                        <th key={i} className="min-w-[150px] relative group">
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={header}
                                                    onChange={(e) => updateHeader(i, e.target.value)}
                                                    className={`w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-xs font-black text-center uppercase tracking-wider transition-all outline-none ${i === 0 ? 'text-indigo-600 font-black' : 'text-gray-700'}`}
                                                    placeholder={i === 0 ? "Horário" : "Nome da Turma"}
                                                />
                                                {i > 0 && (
                                                    <button
                                                        onClick={() => removeColumn(i)}
                                                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                    <th className="w-12">
                                        <button
                                            onClick={addColumn}
                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all active:scale-90"
                                            title="Adicionar Turma"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule?.schedule_data.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="group">
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex}>
                                                <div className="relative">
                                                    <textarea
                                                        value={cell}
                                                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                        rows={rowIndex === 0 ? 1 : 2}
                                                        className={`w-full p-3 border-2 transition-all outline-none resize-none rounded-2xl text-[11px] 
                                                            ${colIndex === 0
                                                                ? 'text-center font-black bg-gray-50 border-gray-100 grayscale'
                                                                : rowIndex === 0
                                                                    ? 'bg-indigo-50 border-indigo-100 text-indigo-700 font-bold text-center placeholder:text-indigo-300'
                                                                    : 'bg-white border-gray-100 focus:border-primary-400 text-gray-600 font-medium'
                                                            }`}
                                                        placeholder={colIndex === 0
                                                            ? "Ex: 07:20 - 08:10"
                                                            : rowIndex === 0
                                                                ? "Sala..."
                                                                : "Professor..."}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                        <td>
                                            <button
                                                onClick={() => removeRow(rowIndex)}
                                                className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex justify-center mt-4">
                            <button
                                onClick={addRow}
                                className="flex items-center gap-2 px-8 py-3 bg-gray-50 text-gray-500 font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-all group active:scale-95"
                            >
                                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                                Adicionar Linha de Horário
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E5E7EB;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #D1D5DB;
                }
            `}</style>
        </div>
    );
}
