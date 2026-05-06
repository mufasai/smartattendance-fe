import { type Component, For, createSignal, Show, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Plus, Trash2, Edit, MapPin, Users, Building2, Loader2, AlertCircle } from "lucide-solid";
import { shiftTaskService } from "../services/shiftTaskService";
import type { ShiftTask, CreateShiftTaskDto, UpdateShiftTaskDto } from "../types/shiftManagement";
import { extractId } from "../types/shiftManagement";
import { ApiError } from "../utils/apiClient";

const ShiftManagement: Component = () => {
    const navigate = useNavigate();

    const [shiftTaskNames, setShiftTaskNames] = createSignal<ShiftTask[]>([]);
    const [isLoading, setIsLoading] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [showCreateModal, setShowCreateModal] = createSignal(false);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const [editingTask, setEditingTask] = createSignal<ShiftTask | null>(null);
    const [isSaving, setIsSaving] = createSignal(false);

    const [formData, setFormData] = createSignal({
        name: "",
        department: "",
        working_location: "",
        shift_type: "3 Sesi" as "2 Sesi" | "3 Sesi",
        number_of_groups: 4,
        schedules: [
            { shift_number: 1, start_time: "07:00", end_time: "15:00" },
            { shift_number: 2, start_time: "15:00", end_time: "23:00" },
            { shift_number: 3, start_time: "23:00", end_time: "07:00" },
        ],
    });

    // Fetch shift tasks from API
    const fetchShiftTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const tasks = await shiftTaskService.getAll();
            setShiftTaskNames(tasks);
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : "Failed to fetch shift tasks";
            setError(errorMessage);
            console.error("Error fetching shift tasks:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load data on mount
    onMount(() => {
        fetchShiftTasks();
    });

    const updateShiftType = (type: "2 Sesi" | "3 Sesi") => {
        if (type === "2 Sesi") {
            setFormData(prev => ({
                ...prev,
                shift_type: type,
                schedules: [
                    { shift_number: 1, start_time: "07:00", end_time: "19:00" },
                    { shift_number: 2, start_time: "19:00", end_time: "07:00" },
                ],
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                shift_type: type,
                schedules: [
                    { shift_number: 1, start_time: "07:00", end_time: "15:00" },
                    { shift_number: 2, start_time: "15:00", end_time: "23:00" },
                    { shift_number: 3, start_time: "23:00", end_time: "07:00" },
                ],
            }));
        }
    };

    const updateScheduleTime = (index: number, field: "start_time" | "end_time", value: string) => {
        setFormData(prev => ({
            ...prev,
            schedules: prev.schedules.map((schedule, i) =>
                i === index ? { ...schedule, [field]: value } : schedule
            ),
        }));
    };

    const createShiftTaskName = async () => {
        const data = formData();
        if (!data.name || !data.department || !data.working_location) {
            alert("Please fill all required fields");
            return;
        }

        setIsSaving(true);
        try {
            const createDto: CreateShiftTaskDto = {
                name: data.name,
                department: data.department,
                working_location: data.working_location,
                shift_type: data.shift_type,
                number_of_groups: data.number_of_groups,
                schedules: data.schedules,
            };

            const newTask = await shiftTaskService.create(createDto);
            setShiftTaskNames(prev => [...prev, newTask]);
            setShowCreateModal(false);
            resetForm();
            alert("Shift task created successfully!");
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : "Failed to create shift task";
            alert(errorMessage);
            console.error("Error creating shift task:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const startEdit = (task: ShiftTask) => {
        setEditingTask(task);
        setFormData({
            name: task.name,
            department: task.department,
            working_location: task.working_location,
            shift_type: task.shift_type,
            number_of_groups: task.number_of_groups,
            schedules: [...task.schedules],
        });
        setShowEditModal(true);
    };

    const updateShiftTaskName = async () => {
        const data = formData();
        const editing = editingTask();
        if (!editing) return;

        setIsSaving(true);
        try {
            const updateDto: UpdateShiftTaskDto = {
                name: data.name,
                department: data.department,
                working_location: data.working_location,
                shift_type: data.shift_type,
                number_of_groups: data.number_of_groups,
                schedules: data.schedules,
            };

            const idStr = extractId(editing.id);
            const updatedTask = await shiftTaskService.update(idStr, updateDto);
            setShiftTaskNames(prev => prev.map(task => extractId(task.id) === idStr ? updatedTask : task));
            setShowEditModal(false);
            setEditingTask(null);
            resetForm();
            alert("Shift task updated successfully!");
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : "Failed to update shift task";
            alert(errorMessage);
            console.error("Error updating shift task:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteShiftTaskName = async (id: string) => {
        if (!confirm("Are you sure you want to delete this shift task?")) {
            return;
        }

        try {
            await shiftTaskService.delete(id);
            setShiftTaskNames(prev => prev.filter(task => task.id !== id));
            alert("Shift task deleted successfully!");
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : "Failed to delete shift task";
            alert(errorMessage);
            console.error("Error deleting shift task:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            department: "",
            working_location: "",
            shift_type: "3 Sesi",
            number_of_groups: 4,
            schedules: [
                { shift_number: 1, start_time: "07:00", end_time: "15:00" },
                { shift_number: 2, start_time: "15:00", end_time: "23:00" },
                { shift_number: 3, start_time: "23:00", end_time: "07:00" },
            ],
        });
    };

    return (
        <div class="space-y-6">
            {/* Header */}
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
                        Shift Management
                    </h2>
                    <p class="text-sm text-[var(--color-text-secondary)]">
                        Manage shift task names and schedules
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
                >
                    <Plus class="w-4 h-4" />
                    Add Shift Task Name
                </button>
            </div>

            {/* Shift Task Name List */}
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
                <div class="p-6 border-b border-[var(--color-border)]">
                    <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                        Shift Task Name List
                    </h3>
                </div>

                {/* Error Message */}
                <Show when={error()}>
                    <div class="p-4 m-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                        <AlertCircle class="w-5 h-5 text-red-600" />
                        <div class="flex-1">
                            <p class="text-sm font-medium text-red-800">{error()}</p>
                        </div>
                        <button
                            onClick={fetchShiftTasks}
                            class="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Retry
                        </button>
                    </div>
                </Show>

                {/* Loading State */}
                <Show when={isLoading()}>
                    <div class="flex flex-col items-center justify-center py-12">
                        <Loader2 class="w-8 h-8 text-[var(--color-primary-button)] animate-spin mb-2" />
                        <p class="text-sm text-[var(--color-text-secondary)]">Loading shift tasks...</p>
                    </div>
                </Show>

                {/* Table */}
                <Show when={!isLoading()}>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-[var(--color-light-gray)]">
                                <tr>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Shift Task Name</th>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Department</th>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Working Location</th>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Shift Type</th>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Number of Group</th>
                                    <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <Show when={shiftTaskNames().length === 0 && !error()}>
                                    <tr>
                                        <td colspan="6" class="text-center p-8 text-[var(--color-text-secondary)]">
                                            No shift task names found. Click "Add Shift Task Name" to create one.
                                        </td>
                                    </tr>
                                </Show>
                                <For each={shiftTaskNames()}>
                                    {(task) => (
                                        <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-light-gray)] transition-colors">
                                            <td class="p-4">
                                                <div class="font-medium text-[var(--color-text-primary)]">{task.name}</div>
                                                <div class="text-xs text-[var(--color-text-secondary)] mt-1">
                                                    <For each={task.schedules}>
                                                        {(schedule) => (
                                                            <div>Shift-{schedule.shift_number}: {schedule.start_time} - {schedule.end_time}</div>
                                                        )}
                                                    </For>
                                                </div>
                                            </td>
                                            <td class="p-4">
                                                <div class="flex items-center gap-2">
                                                    <Building2 class="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                    <span class="text-[var(--color-text-primary)]">{task.department}</span>
                                                </div>
                                            </td>
                                            <td class="p-4">
                                                <div class="flex items-center gap-2">
                                                    <MapPin class="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                    <span class="text-[var(--color-text-primary)]">{task.working_location}</span>
                                                </div>
                                            </td>
                                            <td class="p-4">
                                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    {task.shift_type}
                                                </span>
                                            </td>
                                            <td class="p-4">
                                                <div class="flex items-center gap-2">
                                                    <Users class="w-4 h-4 text-[var(--color-text-secondary)]" />
                                                    <span class="font-semibold text-[var(--color-text-primary)]">{task.number_of_groups} Group</span>
                                                </div>
                                            </td>
                                            <td class="p-4">
                                                <div class="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/shift-management/${encodeURIComponent(extractId(task.id))}/groups`)}
                                                        class="text-green-600 hover:text-green-700 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                                        title="Manage Employee Groups"
                                                    >
                                                        <Users class="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => startEdit(task)}
                                                        class="text-blue-600 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit class="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteShiftTaskName(extractId(task.id))}
                                                        class="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 class="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </tbody>
                        </table>
                    </div>
                </Show>
            </div>

            {/* Create Modal */}
            <Show when={showCreateModal()}>
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                    <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-6">
                            Create Shift Task Name
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Nama Shift *
                                </label>
                                <input
                                    type="text"
                                    value={formData().name}
                                    onInput={(e) => setFormData(prev => ({ ...prev, name: e.currentTarget.value }))}
                                    placeholder="e.g., Security Head Office"
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Pilih Nama Department *
                                </label>
                                <select
                                    value={formData().department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.currentTarget.value }))}
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Security">Security</option>
                                    <option value="Network Operation Center">Network Operation Center</option>
                                    <option value="Service Operation Center">Service Operation Center</option>
                                    <option value="Customer Service">Customer Service / Helpdesk</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Lokasi Kerja *
                                </label>
                                <input
                                    type="text"
                                    value={formData().working_location}
                                    onInput={(e) => setFormData(prev => ({ ...prev, working_location: e.currentTarget.value }))}
                                    placeholder="e.g., Head Office, Factory Bekasi"
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Type Shift *
                                    </label>
                                    <select
                                        value={formData().shift_type}
                                        onChange={(e) => updateShiftType(e.currentTarget.value as "2 Sesi" | "3 Sesi")}
                                        class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                    >
                                        <option value="2 Sesi">2 Sesi</option>
                                        <option value="3 Sesi">3 Sesi</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Jumlah Group *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData().number_of_groups}
                                        onInput={(e) => setFormData(prev => ({ ...prev, number_of_groups: parseInt(e.currentTarget.value) || 1 }))}
                                        class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Schedule *
                                </label>
                                <div class="space-y-3">
                                    <For each={formData().schedules}>
                                        {(schedule, index) => (
                                            <div class="flex items-center gap-3 p-3 bg-[var(--color-light-gray)] rounded-xl">
                                                <span class="font-medium text-[var(--color-text-primary)] min-w-[80px]">
                                                    Shift-{schedule.shift_number}:
                                                </span>
                                                <input
                                                    type="time"
                                                    value={schedule.start_time}
                                                    onInput={(e) => updateScheduleTime(index(), "start_time", e.currentTarget.value)}
                                                    class="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                                />
                                                <span class="text-[var(--color-text-secondary)]">sd</span>
                                                <input
                                                    type="time"
                                                    value={schedule.end_time}
                                                    onInput={(e) => updateScheduleTime(index(), "end_time", e.currentTarget.value)}
                                                    class="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                                />
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>

                            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p class="text-sm font-medium text-blue-800 mb-2">Contoh:</p>
                                <p class="text-sm text-blue-700">Nama Shift: Shift Security</p>
                                <p class="text-sm text-blue-700">Department: Security</p>
                                <p class="text-sm text-blue-700">Lokasi: Headquarter Office</p>
                            </div>

                            <div class="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    class="flex-1 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-light-gray)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createShiftTaskName}
                                    disabled={isSaving()}
                                    class="flex-1 px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Show when={isSaving()}>
                                        <Loader2 class="w-4 h-4 animate-spin" />
                                    </Show>
                                    {isSaving() ? "Creating..." : "Create Shift Task"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Edit Modal */}
            <Show when={showEditModal()}>
                <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
                    <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 class="text-xl font-bold text-[var(--color-text-primary)] mb-6">
                            Edit Shift Task Name
                        </h3>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Nama Shift *
                                </label>
                                <input
                                    type="text"
                                    value={formData().name}
                                    onInput={(e) => setFormData(prev => ({ ...prev, name: e.currentTarget.value }))}
                                    placeholder="e.g., Security Head Office"
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                />
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Pilih Nama Department *
                                </label>
                                <select
                                    value={formData().department}
                                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.currentTarget.value }))}
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                >
                                    <option value="">Select Department</option>
                                    <option value="Security">Security</option>
                                    <option value="Network Operation Center">Network Operation Center</option>
                                    <option value="Service Operation Center">Service Operation Center</option>
                                    <option value="Customer Service">Customer Service / Helpdesk</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Lokasi Kerja *
                                </label>
                                <input
                                    type="text"
                                    value={formData().working_location}
                                    onInput={(e) => setFormData(prev => ({ ...prev, working_location: e.currentTarget.value }))}
                                    placeholder="e.g., Head Office, Factory Bekasi"
                                    class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                />
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Type Shift *
                                    </label>
                                    <select
                                        value={formData().shift_type}
                                        onChange={(e) => updateShiftType(e.currentTarget.value as "2 Sesi" | "3 Sesi")}
                                        class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                    >
                                        <option value="2 Sesi">2 Sesi</option>
                                        <option value="3 Sesi">3 Sesi</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                        Jumlah Group *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData().number_of_groups}
                                        onInput={(e) => setFormData(prev => ({ ...prev, number_of_groups: parseInt(e.currentTarget.value) || 1 }))}
                                        class="w-full px-4 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                                    Schedule *
                                </label>
                                <div class="space-y-3">
                                    <For each={formData().schedules}>
                                        {(schedule, index) => (
                                            <div class="flex items-center gap-3 p-3 bg-[var(--color-light-gray)] rounded-xl">
                                                <span class="font-medium text-[var(--color-text-primary)] min-w-[80px]">
                                                    Shift-{schedule.shift_number}:
                                                </span>
                                                <input
                                                    type="time"
                                                    value={schedule.start_time}
                                                    onInput={(e) => updateScheduleTime(index(), "start_time", e.currentTarget.value)}
                                                    class="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                                />
                                                <span class="text-[var(--color-text-secondary)]">sd</span>
                                                <input
                                                    type="time"
                                                    value={schedule.end_time}
                                                    onInput={(e) => updateScheduleTime(index(), "end_time", e.currentTarget.value)}
                                                    class="px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
                                                />
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>

                            <div class="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setEditingTask(null);
                                        resetForm();
                                    }}
                                    class="flex-1 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-light-gray)] transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={updateShiftTaskName}
                                    disabled={isSaving()}
                                    class="flex-1 px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Show when={isSaving()}>
                                        <Loader2 class="w-4 h-4 animate-spin" />
                                    </Show>
                                    {isSaving() ? "Updating..." : "Update Shift Task"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
};

export default ShiftManagement;
