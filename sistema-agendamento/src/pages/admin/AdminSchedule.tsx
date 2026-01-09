
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
    Lock,
    Unlock
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SCHOOL_UNITS } from '../../utils/constants';
import { Building } from 'lucide-react';

interface ScheduleGrid {
    headers: string[];
    rows: string[][];
    columnWidth?: number;
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
    const isSuperAdmin = (user as any)?.role === 'super_admin';

    const [selectedDay, setSelectedDay] = useState(DAYS_OF_WEEK[0]);
    const [selectedSegment, setSelectedSegment] = useState(SEGMENTS[0]);
    const [targetUnit, setTargetUnit] = useState(adminUnit || SCHOOL_UNITS[0]);
    const [schedule, setSchedule] = useState<ClassSchedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [columnWidth, setColumnWidth] = useState(150);
    const [isLocked, setIsLocked] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const lastFetchParams = useRef("");

    useEffect(() => {
        if (adminUnit && !isSuperAdmin) {
            setTargetUnit(adminUnit);
        }
    }, [adminUnit, isSuperAdmin]);

    useEffect(() => {
        const params = `${targetUnit}-${selectedDay}-${selectedSegment}`;
        if (params === lastFetchParams.current) return;

        lastFetchParams.current = params;
        if (targetUnit) {
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
    }, [targetUnit, selectedDay, selectedSegment]);

    const fetchSchedule = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('class_schedules')
                .select('*')
                .eq('unit', targetUnit)
                .eq('day_of_week', selectedDay)
                .eq('segment', selectedSegment)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (data) {
                setSchedule(data);
                if (data.schedule_data?.columnWidth) {
                    setColumnWidth(data.schedule_data.columnWidth);
                }
            } else {
                setSchedule({
                    unit: targetUnit,
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
                    schedule_data: {
                        ...schedule.schedule_data,
                        columnWidth: columnWidth
                    },
                    unit: targetUnit,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'unit, day_of_week, segment' });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Horário salvo com sucesso!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            console.error('Save error:', error);
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
                const decoder = new TextDecoder('utf-8', { fatal: true });
                text = decoder.decode(buffer);
            } catch {
                const decoder = new TextDecoder('windows-1252');
                text = decoder.decode(buffer);
            }

            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 1) return;
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 text-primary-600 mb-1">
                        <Calendar className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-sm font-black uppercase tracking-widest italic">Gestão Escolar</span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">Horário de Aulas</h1>
                    <p className="text-gray-500 font-medium">Configure a grade de horários para {isSuperAdmin ? 'a rede' : `a unidade ${adminUnit}`}.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={downloadTemplate}
                        disabled={isLocked}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-gray-100 hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4" />
                        Baixar Modelo
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLocked}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-50 text-primary-700 font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-primary-100 hover:bg-primary-100 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Global Admin Unit Selector */}
            {
                isSuperAdmin && (
                    <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex items-center gap-2 text-amber-700">
                                <Building className="h-5 w-5" />
                                <span className="font-black uppercase tracking-widest text-sm">Visualizando Unidade:</span>
                            </div>
                            <select
                                value={targetUnit}
                                onChange={(e) => setTargetUnit(e.target.value)}
                                className="flex-1 bg-white border-none py-3 px-6 rounded-xl font-bold text-gray-700 shadow-sm outline-none ring-0 w-full md:w-auto"
                            >
                                {SCHOOL_UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )
            }

            {/* Filters & View Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3 order-3 md:order-1">
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

                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3 order-2 md:order-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <LayoutGrid className="h-3 w-3" /> Seguimento
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

                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3 order-1 md:order-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                        <LayoutGrid className="h-3 w-3" /> Largura das Colunas
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                        <input
                            type="range"
                            min="80"
                            max="300"
                            value={columnWidth}
                            onChange={(e) => setColumnWidth(Number(e.target.value))}
                            className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-primary-600"
                        />
                        <span className="text-xs font-mono font-bold text-gray-600 w-12 text-right">{columnWidth}px</span>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden relative min-h-[500px]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                            <span className="font-black text-xs text-primary-600 uppercase tracking-widest italic">Carregando...</span>
                        </div>
                    </div>
                )}

                <div className="p-4 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="font-black text-gray-900 leading-none">{selectedDay}</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{selectedSegment}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                            {message && (
                                <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold animate-in slide-in-from-right ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {message.text}
                                </div>
                            )}
                            <button
                                onClick={() => setIsLocked(!isLocked)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isLocked
                                    ? 'bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 border-2 border-green-100 hover:bg-green-100'}`}
                                title={isLocked ? "Desbloquear edição" : "Bloquear edição"}
                            >
                                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                <span className="hidden md:inline">{isLocked ? 'Bloqueado' : 'Desbloqueado'}</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || isLocked}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-95 disabled:opacity-50 w-full md:w-auto"
                            >
                                <Save className="h-4 w-4" />
                                {isSaving ? 'Salvando...' : 'Salvar Grade'}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-6 custom-scrollbar">
                        <table className="border-separate border-spacing-2" style={{ tableLayout: 'fixed', width: 'max-content' }}>
                            <thead>
                                <tr>
                                    {schedule?.schedule_data.headers.map((header, i) => (
                                        <th
                                            key={i}
                                            className="relative group transition-all duration-200"
                                            style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                                        >
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={header}
                                                    onChange={(e) => updateHeader(i, e.target.value)}
                                                    className={`w-full p-2 bg-gray-50 border-2 border-transparent focus:border-indigo-400 focus:bg-white rounded-2xl text-xs font-black text-center uppercase tracking-wider transition-all outline-none ${i === 0 ? 'text-indigo-600' : 'text-gray-700'}`}
                                                    style={{ height: '60px' }}
                                                    placeholder={i === 0 ? "Horário" : "Turma"}
                                                    disabled={isLocked}
                                                />
                                                {i > 0 && !isLocked && (
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
                                    <th className="w-16">
                                        {!isLocked && (
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={addColumn}
                                                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 active:scale-90"
                                                >
                                                    <Plus className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedule?.schedule_data.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="group">
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex}>
                                                <div className={`relative flex items-center justify-center transition-all border-2 rounded-2xl min-h-[60px]
                                                    ${colIndex === 0
                                                        ? 'bg-gray-50 border-gray-100'
                                                        : rowIndex === 0
                                                            ? 'bg-indigo-50 border-indigo-100'
                                                            : 'bg-white border-gray-100'
                                                    }`}
                                                    style={{ width: `${columnWidth}px`, minWidth: `${columnWidth}px` }}
                                                >
                                                    {colIndex === 0 || rowIndex === 0 ? (
                                                        <input
                                                            type="text"
                                                            value={cell}
                                                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                            className={`w-full bg-transparent border-none outline-none text-center px-1
                                                                ${colIndex === 0
                                                                    ? 'font-black text-gray-900 text-xs'
                                                                    : 'text-indigo-700 font-bold text-xs placeholder:text-indigo-300'
                                                                }
                                                                ${colIndex === 0 && rowIndex === 0 ? 'opacity-0' : ''}`}
                                                            placeholder={colIndex === 0 ? "00:00" : "Sala"}
                                                            disabled={(colIndex === 0 && rowIndex === 0) || isLocked}
                                                            style={{ height: '60px' }}
                                                        />
                                                    ) : (
                                                        <textarea
                                                            value={cell}
                                                            onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                            disabled={isLocked}
                                                            className={`w-full bg-transparent border-none outline-none resize-none text-center text-gray-600 font-medium text-[10px] leading-tight px-1 flex items-center justify-center ${isLocked ? 'cursor-not-allowed' : ''}`}
                                                            placeholder="Prof."
                                                            style={{
                                                                height: '60px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                paddingTop: '16px' // Fine-tuning for textarea vertical centering behavior in some browsers
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                        <td className="w-16">
                                            {!isLocked && (
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => removeRow(rowIndex)}
                                                        className="p-3 text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Show add row only if not locked */}
                        {!isLocked && (
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={addRow}
                                    className="flex items-center gap-2 px-8 py-3 bg-gray-50 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:text-primary-600 transition-all active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                    Adicionar Linha
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
            `}</style>
        </div >
    );
}
