import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import type { Admin } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    DoorOpen,
    GripVertical
} from 'lucide-react';
import { ConfirmModal } from '../../components/ConfirmModal';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Classroom {
    id: string;
    name: string;
    unit: string;
    position: number;
    is_active: boolean;
    created_at: string;
}

interface SortableItemProps {
    classroom: Classroom;
    index: number;
    onEdit: (classroom: Classroom) => void;
    onDelete: (classroom: Classroom) => void;
}

function SortableItem({ classroom, index, onEdit, onDelete }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: classroom.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`group/row hover:bg-primary-50 transition-colors ${isDragging ? 'bg-primary-100 shadow-lg' : ''}`}
        >
            <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center min-w-0 gap-3">
                    <div
                        {...attributes}
                        {...listeners}
                        className="flex-shrink-0 text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 p-1 -ml-1 rounded hover:bg-gray-100"
                        title="Arraste para reordenar"
                    >
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-100 group-hover/row:bg-primary-600 transition-colors">
                        <DoorOpen className="h-5 w-5 text-primary-600 group-hover/row:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {classroom.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            Posição: {index + 1}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onEdit(classroom)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(classroom)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </li>
    );
}

export function AdminClassrooms() {
    const { user } = useAuth();
    const adminUser = user as Admin;

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; item: Classroom | null }>({
        isOpen: false,
        item: null
    });

    const [formData, setFormData] = useState({
        name: '',
        unit: adminUser?.unit || ''
    });

    // Dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );



    useEffect(() => {
        if (adminUser?.unit) {
            setFormData(prev => ({ ...prev, unit: adminUser.unit }));
            fetchClassrooms();
        }
    }, [adminUser]);

    const fetchClassrooms = async () => {
        setLoading(true);
        let query = supabase
            .from('classrooms')
            .select('*')
            .eq('is_active', true)
            .order('position', { ascending: true });

        if (adminUser?.unit) {
            query = query.eq('unit', adminUser.unit);
        }

        const { data, error } = await query;
        if (!error && data) {
            setClassrooms(data as Classroom[]);
        }
        setLoading(false);
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', unit: adminUser?.unit || '' });
        setIsModalOpen(true);
    };

    const openEditModal = (classroom: Classroom) => {
        setEditingId(classroom.id);
        setFormData({ name: classroom.name, unit: classroom.unit });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        // Get session token from admin user
        const sessionToken = (adminUser as any)?.session_token;
        if (!sessionToken) {
            console.error('Session token missing');
            return;
        }

        if (editingId) {
            // Update via secure RPC
            const { error } = await supabase.rpc('update_classroom_secure', {
                p_classroom_id: editingId,
                p_name: formData.name.trim(),
                p_admin_token: sessionToken
            });
            if (error) console.error('Update error:', error);
        } else {
            // Create via secure RPC
            const { error } = await supabase.rpc('create_classroom_secure', {
                p_name: formData.name.trim(),
                p_unit: formData.unit,
                p_admin_token: sessionToken
            });
            if (error) console.error('Create error:', error);
        }

        setIsModalOpen(false);
        fetchClassrooms();
    };

    const handleDelete = async (classroom: Classroom) => {
        // Get session token from admin user
        const sessionToken = (adminUser as any)?.session_token;
        if (!sessionToken) {
            console.error('Session token missing');
            return;
        }

        // Delete via secure RPC (soft delete)
        const { error } = await supabase.rpc('delete_classroom_secure', {
            p_classroom_id: classroom.id,
            p_admin_token: sessionToken
        });
        if (error) console.error('Delete error:', error);

        setDeleteModal({ isOpen: false, item: null });
        fetchClassrooms();
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const oldIndex = classrooms.findIndex(c => c.id === active.id);
        const newIndex = classrooms.findIndex(c => c.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // Optimistic update
        const newClassrooms = arrayMove(classrooms, oldIndex, newIndex);
        setClassrooms(newClassrooms);

        // Update positions in database
        const updates = newClassrooms.map((classroom, index) => ({
            id: classroom.id,
            position: index + 1
        }));

        // Execute updates sequentially to avoid race conditions
        for (const update of updates) {
            await supabase
                .from('classrooms')
                .update({ position: update.position })
                .eq('id', update.id);
        }
    };

    const filteredClassrooms = classrooms.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Salas</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie as salas de aula. Arraste para reordenar.
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sala
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar salas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
            </div>

            {/* List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando...</div>
                ) : filteredClassrooms.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {searchTerm ? 'Nenhuma sala encontrada.' : 'Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.'}
                    </div>
                ) : searchTerm ? (
                    // When searching, disable drag-and-drop
                    <ul className="divide-y divide-gray-200">
                        {filteredClassrooms.map((classroom, index) => (
                            <li key={classroom.id} className="group/row hover:bg-primary-50 transition-colors">
                                <div className="px-4 py-4 flex items-center justify-between">
                                    <div className="flex items-center min-w-0 gap-3">
                                        <div className="flex-shrink-0 text-gray-300">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary-100 group-hover/row:bg-primary-600 transition-colors">
                                            <DoorOpen className="h-5 w-5 text-primary-600 group-hover/row:text-white" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {classroom.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Posição: {index + 1}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditModal(classroom)}
                                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, item: classroom })}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    // Sortable list with drag-and-drop
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={classrooms.map(c => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="divide-y divide-gray-200">
                                {classrooms.map((classroom, index) => (
                                    <SortableItem
                                        key={classroom.id}
                                        classroom={classroom}
                                        index={index}
                                        onEdit={openEditModal}
                                        onDelete={(c) => setDeleteModal({ isOpen: true, item: c })}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <form onSubmit={handleSubmit}>
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                                            {editingId ? 'Editar Sala' : 'Nova Sala'}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Nome da Sala *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                                                placeholder="Ex: Sala 01, Laboratório, Auditório"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Unidade
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.unit}
                                                disabled
                                                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2 border cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {editingId ? 'Salvar' : 'Criar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, item: null })}
                onConfirm={() => deleteModal.item && handleDelete(deleteModal.item)}
                title="Excluir Sala"
                message={`Tem certeza que deseja excluir "${deleteModal.item?.name}"? Esta ação não afetará agendamentos já realizados.`}
                confirmText="Excluir"
                cancelText="Cancelar"
                type="danger"
            />
        </div>
    );
}
