
export const generateChangeTip = (log: any): string | null => {
    if (!log.old_data || !log.new_data) return null;

    const changes: string[] = [];
    const oldData = log.old_data;
    const newData = log.new_data;

    // Helper to format values
    const formatValue = (val: any) => {
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        if (!val) return 'Vazio';
        return val;
    };

    // Generic comparison for known fields
    const fieldsToCheck = [
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrição' },
        { key: 'min_time', label: 'Tempo Mínimo' },
        { key: 'max_time', label: 'Tempo Máximo' },
        { key: 'active', label: 'Ativo' },
        { key: 'role', label: 'Cargo' },
        { key: 'unit', label: 'Unidade' },
        { key: 'available_days', label: 'Dias Disponíveis' }
    ];

    fieldsToCheck.forEach(({ key, label }) => {
        if (oldData[key] !== undefined && newData[key] !== undefined && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            changes.push(`${label}: ${formatValue(oldData[key])} ➝ ${formatValue(newData[key])}`);
        }
    });

    if (changes.length > 0) {
        return changes.join(' | ');
    }

    return null;
};
