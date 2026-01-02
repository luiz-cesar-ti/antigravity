import { useState } from 'react';
import { Monitor, AlertTriangle, ArrowLeft, ArrowRight, CheckCircle, Laptop, Projector, Speaker, Camera, Mic, Smartphone, Tv, Plug } from 'lucide-react';
import type { BookingData } from '../../pages/BookingWizard';
import { useAvailableEquipment } from '../../hooks/useAvailableEquipment';
import { clsx } from 'clsx';

interface Step2Props {
    data: BookingData;
    updateData: (data: Partial<BookingData>) => void;
    onNext: () => void;
    onPrev: () => void;
}

export function Step2Equipment({ data, updateData, onNext, onPrev }: Step2Props) {
    const { equipments, loading, error } = useAvailableEquipment(
        data.unit,
        data.date,
        data.startTime,
        data.endTime
    );

    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>(() => {
        // Initialize from existing data if returning to step
        const initial: Record<string, number> = {};
        data.equipments.forEach(eq => {
            initial[eq.id] = eq.quantity;
        });
        return initial;
    });

    const [validationError, setValidationError] = useState('');

    const handleQuantityChange = (id: string, quantity: number, max: number) => {
        // Validate range
        const validQuantity = Math.max(0, Math.min(quantity, max));

        setSelectedQuantities(prev => ({
            ...prev,
            [id]: validQuantity
        }));
        setValidationError('');
    };

    const handleNext = () => {
        // Convert selection map to array for booking data
        const selectedEquipmentList = equipments
            .filter(eq => selectedQuantities[eq.id] > 0)
            .map(eq => ({
                id: eq.id,
                name: eq.name,
                quantity: selectedQuantities[eq.id],
                brand: eq.brand,
                model: eq.model
            }));

        if (selectedEquipmentList.length === 0) {
            setValidationError('Por favor, selecione pelo menos um equipamento.');
            return;
        }

        updateData({ equipments: selectedEquipmentList });
        onNext();
    };

    const getEquipmentIcon = (name: string = '', isFullyBooked: boolean) => {
        const n = name.toLowerCase();
        const baseClass = clsx("h-6 w-6", isFullyBooked ? "text-gray-400" : "text-primary-600");

        if (n.includes('notebook') || n.includes('laptop') || n.includes('pc') || n.includes('computador')) return <Laptop className={baseClass} />;
        if (n.includes('projetor') || n.includes('datashow')) return <Projector className={baseClass} />;
        if (n.includes('caixa') || n.includes('som') || n.includes('audio')) return <Speaker className={baseClass} />;
        if (n.includes('camera') || n.includes('camara') || n.includes('foto')) return <Camera className={baseClass} />;
        if (n.includes('microfone') || n.includes('mic')) return <Mic className={baseClass} />;
        if (n.includes('tablet') || n.includes('ipad') || n.includes('celular')) return <Smartphone className={baseClass} />;
        if (n.includes('tv') || n.includes('televisao') || n.includes('monitor') || n.includes('tela')) return <Tv className={baseClass} />;
        if (n.includes('cabo') || n.includes('extensao') || n.includes('fio') || n.includes('adaptador')) return <Plug className={baseClass} />;
        return <Monitor className={baseClass} />;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-500">Verificando disponibilidade...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 text-center">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700">{error}</p>
                <button onClick={onPrev} className="mt-4 text-primary-600 hover:underline">Voltar</button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-semibold text-gray-800">Equipamentos Disponíveis</h2>
                <p className="text-sm text-gray-600">
                    Para: <strong>{data.date.split('-').reverse().join('/')}</strong> das <strong>{data.startTime}</strong> às <strong>{data.endTime}</strong>
                </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <p className="text-sm text-green-700">
                    As quantidades abaixo refletem a disponibilidade real para o horário selecionado.
                </p>
            </div>

            {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700 font-medium">{validationError}</p>
                </div>
            )}

            {equipments.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">Nenhum equipamento cadastrado nesta unidade.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {equipments.map((eq) => {
                        const isFullyBooked = eq.available_quantity === 0;
                        const currentQty = selectedQuantities[eq.id] || 0;

                        return (
                            <div
                                key={eq.id}
                                className={clsx(
                                    "border rounded-lg p-4 transition-all duration-200",
                                    isFullyBooked ? "bg-gray-50 border-gray-200 opacity-75" : "bg-white border-gray-200 hover:shadow-md hover:border-primary-200",
                                    currentQty > 0 && "ring-2 ring-primary-500 border-transparent"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center">
                                        <div className={clsx("p-2 rounded-lg mr-3", isFullyBooked ? "bg-gray-200" : "bg-primary-50")}>
                                            {getEquipmentIcon(eq.name, isFullyBooked)}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">{eq.name}</h3>
                                            <p className="text-xs text-gray-500">{eq.brand} {eq.model}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={clsx("text-xs font-bold px-2 py-1 rounded-full",
                                            isFullyBooked
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        )}>
                                            {isFullyBooked ? 'ESGOTADO' : `${eq.available_quantity} disponível`}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {isFullyBooked ? (
                                        <p className="text-xs font-bold text-red-600 uppercase text-center py-2">
                                            Todos Reservados
                                        </p>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm text-gray-700 mr-2">Quantidade:</label>
                                            <div className="flex items-center border border-gray-300 rounded-md">
                                                <button
                                                    type="button"
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-r border-gray-300 disabled:opacity-50"
                                                    onClick={() => handleQuantityChange(eq.id, currentQty - 1, eq.available_quantity)}
                                                    disabled={currentQty <= 0}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    className="w-12 text-center border-none focus:ring-0 text-sm py-1"
                                                    value={currentQty}
                                                    onChange={(e) => handleQuantityChange(eq.id, parseInt(e.target.value) || 0, eq.available_quantity)}
                                                    min="0"
                                                    max={eq.available_quantity}
                                                />
                                                <button
                                                    type="button"
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100 border-l border-gray-300 disabled:opacity-50"
                                                    onClick={() => handleQuantityChange(eq.id, currentQty + 1, eq.available_quantity)}
                                                    disabled={currentQty >= eq.available_quantity}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
                <button
                    onClick={onPrev}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                </button>
                <button
                    onClick={handleNext}
                    className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                </button>
            </div>
        </div>
    );
}
