import { format } from 'date-fns';

export interface FriendlyLogSummary {
    action: string;
    target: string;
    details: string;
    icon: 'create' | 'update' | 'delete' | 'info';
}

export const formatAction = (action: string): string => {
    switch (action) {
        case 'CREATE_ROOM': return 'Criou Sala';
        case 'UPDATE_ROOM': return 'Editou Sala';
        case 'DELETE_ROOM': return 'Excluiu Sala';
        case 'TOGGLE_ROOM_AVAILABILITY': return 'Alterou Disponibilidade de Sala';
        case 'DELETE_ROOM_BOOKING': return 'Excluiu Reserva de Sala';

        case 'CREATE_LOAN': return 'Novo Empréstimo';
        case 'RETURN_LOAN': return 'Devolução de Equipamento';
        case 'DELETE_LOAN': return 'Excluiu Empréstimo';

        case 'UPDATE_USER': return 'Gerenciou Professor';

        case 'DELETE_BOOKINGS': return 'Cancelou Agendamento(s)';

        case 'UPDATE_ADMIN': return 'Editou Administrador';
        case 'RESET_ADMIN_PASSWORD': return 'Resetou Senha de Admin';
        case 'DELETE_ADMIN_BOOKINGS': return 'Removeu Agendamentos'; // Legacy/Duplicate

        default: return action.replace(/_/g, ' ');
    }
};

export const formatTargetType = (tableName: string): string => {
    switch (tableName) {
        case 'rooms': return 'Sala';
        case 'equipment_loans': return 'Empréstimo';
        case 'users': return 'Professor';
        case 'bookings': return 'Agendamento';
        case 'admins': return 'Administrador';
        default: return tableName;
    }
};

export const getActionIconType = (action: string): 'create' | 'update' | 'delete' | 'info' => {
    if (action.includes('create') || action.includes('CREATE')) return 'create';
    if (action.includes('delete') || action.includes('DELETE')) return 'delete';
    if (action.includes('update') || action.includes('UPDATE') || action.includes('toggle') || action.includes('TOGGLE')) return 'update';
    return 'info';
};

export const generateFriendlySummary = (log: any): FriendlyLogSummary => {
    const action = formatAction(log.action_type);
    const targetType = formatTargetType(log.table_name);
    let details = '';

    const newData = log.new_data;
    const oldData = log.old_data;

    // --- ROOMS ---
    if (log.table_name === 'rooms') {
        const roomName = newData?.name || oldData?.name || 'Desconhecida';
        if (log.action_type === 'CREATE_ROOM') {
            details = `Criou a sala "${roomName}" na unidade ${newData?.unit || '?'}.`;
        } else if (log.action_type === 'UPDATE_ROOM') {
            details = `Atualizou dados da sala "${roomName}".`;
        } else if (log.action_type === 'DELETE_ROOM') {
            details = `Removeu a sala "${roomName}" permanentemente.`;
        } else if (log.action_type === 'TOGGLE_ROOM_AVAILABILITY') {
            details = `Alterou a disponibilidade da sala (ID: ${log.record_id}).`;
        }
    }
    // --- LOANS ---
    else if (log.table_name === 'equipment_loans') {
        const borrower = newData?.borrower || newData?.user_full_name || oldData?.user_full_name || 'Desconhecido';

        if (log.action_type === 'CREATE_LOAN') {
            const equip = newData?.equipment_name || 'Equipamento';
            const assetDesc = newData?.asset_number ? ` (Patrimônio: ${newData.asset_number})` : '';
            const loc = newData?.location ? ` para uso em: ${newData.location}` : '';
            const unit = newData?.unit ? ` (${newData.unit})` : '';

            details = `Novo empréstimo de "${equip}"${assetDesc}${unit}.\n` +
                `• Solicitante: ${borrower} (${newData?.role || 'Cargo não informado'})${loc}\n` +
                `• Quantidade: ${newData?.quantity || 1}`;

        } else if (log.action_type === 'RETURN_LOAN') {
            details = `Confirmou devolução de empréstimo (ID: ${log.record_id}).`;
        } else if (log.action_type === 'DELETE_LOAN') {
            const equip = oldData?.equipment_name ? ` do equipamento "${oldData.equipment_name}"` : '';
            details = `Apagou o registro de empréstimo${equip} de "${borrower}".`;
        }
    }
    // --- USERS ---
    else if (log.table_name === 'users') {
        const userName = newData?.full_name || oldData?.full_name || 'Usuário';
        if (log.action_type === 'UPDATE_USER') {
            const changes = [];
            if (oldData?.active !== newData?.active) changes.push(newData?.active ? 'Reativou acesso' : 'Desativou acesso');
            if (JSON.stringify(oldData?.units) !== JSON.stringify(newData?.units)) changes.push('Alterou unidades');

            details = `Atualizou professor "${userName}". ${changes.join(', ')}`;
        }
    }
    // --- BOOKINGS & ROOM_BOOKINGS ---
    else if (log.table_name === 'bookings' || log.table_name === 'room_bookings') {
        // Handle DELETE_BOOKINGS (Equipment)
        if (log.action_type === 'DELETE_BOOKINGS') {
            if (oldData && Array.isArray(oldData) && oldData.length > 0) {
                const count = oldData.length;
                if (count === 1) {
                    const item = oldData[0];
                    const equipName = item.equipment_name || 'Equipamento desconhecido';
                    const brand = item.equipment_brand || '-';
                    const model = item.equipment_model || '-';
                    const fullEquip = `${equipName} (Marca: ${brand}, Modelo: ${model})`;

                    const userName = item.user_full_name || 'Professor desconhecido';
                    const date = item.booking_date ? format(new Date(item.booking_date), 'dd/MM/yyyy') : '?';
                    const createdAt = item.created_at ? format(new Date(item.created_at), 'dd/MM/yyyy HH:mm') : '?';
                    const local = item.local || 'Local não informado';
                    const qty = item.quantity || 1;

                    details = `Cancelou agendamento de "${fullEquip}" (Qtd: ${qty}).\n` +
                        `• Professor: ${userName}\n` +
                        `• Para uso em: ${date} no local: ${local}\n` +
                        `• Criado em: ${createdAt}`;
                } else {
                    details = `Cancelou ${count} agendamentos. (Ex: ${oldData[0].equipment_name} de ${oldData[0].user_full_name}...)`;
                }
            } else {
                const ids = log.record_id ? log.record_id.split(',') : [];
                const count = ids.length > 0 ? ids.length : 1;
                details = `Cancelou ${count} agendamento(s) de equipamento (Dados detalhados indisponíveis para logs antigos).`;
            }
        }
        // Handle DELETE_ROOM_BOOKING (Rooms - Admin Deleting Professor's Booking)
        else if (log.action_type === 'DELETE_ROOM_BOOKING') {
            const roomName = oldData?.room_name || 'Sala desconhecida';
            const userName = oldData?.user_name || 'Professor desconhecido';
            const unit = oldData?.room_unit || '';

            // Format time range if available
            let timeRange = '';
            if (oldData?.start_ts && oldData?.end_ts) {
                const start = new Date(oldData.start_ts);
                const end = new Date(oldData.end_ts);
                timeRange = ` (${format(start, 'dd/MM/yyyy HH:mm')} - ${format(end, 'HH:mm')})`;
            }

            details = `Excluiu reserva da sala "${roomName}" ${unit}.\n` +
                `• Responsável pela reserva: ${userName}\n` +
                `• Período: ${timeRange}`;
        }
    }
    // --- ADMINS ---
    else if (log.table_name === 'admins') {
        const adminName = newData?.username || oldData?.username || 'Admin';
        if (log.action_type === 'RESET_ADMIN_PASSWORD') {
            details = `Resetou a senha do administrador "${adminName}".`;
        } else if (log.action_type === 'UPDATE_USER') {
            details = `Atualizou dados do administrador "${adminName}".`;
        }
    }

    // Fallback if details is empty
    if (!details) {
        details = `Realizou ação ${log.action_type} em ${targetType} (ID: ${log.record_id || '?'}).`;
    }

    return {
        action,
        target: targetType,
        details,
        icon: getActionIconType(log.action_type)
    };
};
