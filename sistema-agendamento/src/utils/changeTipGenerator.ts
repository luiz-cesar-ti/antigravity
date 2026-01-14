
export const generateChangeTip = (log: any): string | null => {
    if (!log.old_data || !log.new_data) return null;

    const changes: string[] = [];
    const oldData = log.old_data;
    const newData = log.new_data;

    // Helper to format values
    const formatValue = (val: any) => {
        if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
        if (val === null || val === undefined) return 'Vazio';
        if (Array.isArray(val)) return `[${val.length} itens]`;
        if (typeof val === 'object') return '{Objeto}';
        return val;
    };

    // Generic comparison for known fields
    const fieldsToCheck = [
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrição' },
        { key: 'min_time', label: 'Tempo Mínimo' },
        { key: 'max_time', label: 'Tempo Máximo' },
        { key: 'role', label: 'Cargo' },
        { key: 'unit', label: 'Unidade' },
        { key: 'available_days', label: 'Dias Disponíveis' },
        { key: 'email', label: 'Email' },
        { key: 'full_name', label: 'Nome Completo' },
        { key: 'status', label: 'Status' },
        { key: 'totvs_number', label: 'Matrícula' }
    ];

    // 1. Special Handling for 'units' (Arrays)
    if (log.table_name === 'users') {
        const oldUnits = Array.isArray(oldData.units) ? oldData.units : [];
        const newUnits = Array.isArray(newData.units) ? newData.units : [];

        // Check for additions
        const addedUnits = newUnits.filter((u: string) => !oldUnits.includes(u));
        addedUnits.forEach((u: string) => changes.push(`Adicionou o usuário na unidade ${u}`));

        // Check for removals
        const removedUnits = oldUnits.filter((u: string) => !newUnits.includes(u));
        removedUnits.forEach((u: string) => changes.push(`Removeu o usuário da unidade ${u}`));

        // 2. Special Handling for Booleans
        if (oldData.active !== newData.active && newData.active !== undefined) {
            changes.push(newData.active ? 'Reativou o acesso do usuário' : 'Desativou o acesso do usuário');
        }

        if (oldData.recurring_booking_enabled !== newData.recurring_booking_enabled && newData.recurring_booking_enabled !== undefined) {
            changes.push(newData.recurring_booking_enabled ? 'Ativou agendamento recorrente' : 'Desativou agendamento recorrente');
        }

        if (JSON.stringify(oldData.recurring_booking_units) !== JSON.stringify(newData.recurring_booking_units)) {
            // If it's just units changing within recurrence
            const oldRecUnits = Array.isArray(oldData.recurring_booking_units) ? oldData.recurring_booking_units : [];
            const newRecUnits = Array.isArray(newData.recurring_booking_units) ? newData.recurring_booking_units : [];

            const addedRec = newRecUnits.filter((u: string) => !oldRecUnits.includes(u));
            addedRec.forEach((u: string) => changes.push(`Liberou agendamento recorrente na unidade ${u}`));

            const removedRec = oldRecUnits.filter((u: string) => !newRecUnits.includes(u));
            removedRec.forEach((u: string) => changes.push(`Revogou agendamento recorrente na unidade ${u}`));
        }
    }

    // 3. Generic Checks
    fieldsToCheck.forEach(({ key, label }) => {
        // Skip if handled specially above
        if (['active', 'units', 'recurring_booking_enabled', 'recurring_booking_units'].includes(key)) return;

        const oldVal = oldData[key];
        const newVal = newData[key];

        if ((oldVal === undefined || oldVal === null) && (newVal === undefined || newVal === null)) return;

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes.push(`${label}: ${formatValue(oldVal)} ➝ ${formatValue(newVal)}`);
        }
    });

    if (changes.length > 0) {
        return changes.join(' | ');
    }

    return null;
};
