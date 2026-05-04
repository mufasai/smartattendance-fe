import { type Component, For, createSignal, Show, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Plus, Trash2, Edit, MapPin, Users, Building2 } from "lucide-solid";

interface ShiftSchedule {
    shift_number: number;
    start_time: string;
    end_time: string;
}

interface ShiftTaskName {
    id: string;
    name: string;
    department: string;
    working_location: string;
    shift_type: string; // "2 Sesi" or "3 Sesi"
    number_of_groups: number;
    schedules: ShiftSchedule[];
    created_at: string;
}

const ShiftManagement: Component = () => {
    const navigate = useNavigate();

    const [shiftTaskNames, setShiftTaskNames] = createSignal<ShiftTaskName[]>([
        {
            id: "1",
            name: "Security Head Office",
            department: "Security",
            working_location: "Head Office",
            shift_type: "3 Sesi",
            number_of_groups: 4,
            schedules: [
                { shift_number: 1, start_time: "07:00", end_time: "15:00" },
                { shift_number: 2, start_time: "15:00", end_time: "23:00" },
                { shift_number: 3, start_time: "23:00", end_time: "07:00" },
            ],
            created_at: new Date().toISOString(),
        },
        {
            id: "2",
            name: "Security Factory Bekasi",
            department: "Security",
            working_location: "Factory Bekasi",
            shift_type: "3 Sesi",
            number_of_groups: 4,
            schedules: [
                { shift_number: 1, start_time: "07:00", end_time: "15:00" },
                { shift_number: 2, start_time: "15:00", end_time: "23:00" },
                { shift_number: 3, start_time: "23:00", end_time: "07:00" },
            ],
            created_at: new Date().toISOString(),
        },
        {
          id: "3",
          name: "Shift 3",
          start_time: "22:00",
          end_time: "06:00",
          description: "Shift malam untuk keamanan gedung",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error("Failed to fetch shift types:", err);
    }
  };

  const fetchEmployeeGroups = async () => {
    try {
      // Mock data for now - replace with actual API call
      setEmployeeGroups([]);
    } catch (err: any) {
      console.error("Failed to fetch employee groups:", err);
    }
  };

  const fetchShiftAssignments = async () => {
    try {
      // Mock data for now - replace with actual API call
      setShiftAssignments([]);
    } catch (err: any) {
      console.error("Failed to fetch shift assignments:", err);
    }
  };

  const fetchShifts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/shift/all`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
          employee_id:
            item.employee_id?.id?.String ||
            item.employee_id?.id ||
            item.employee_id,
        }));
        setShifts(mappedData);
      } else {
        setError(result.message || "Failed to fetch shifts");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}/employees`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        const mappedData = result.data.map((item: any) => ({
          id: item.id?.id?.String || item.id?.id || item.id,
          nik: item.nik,
          full_name: item.full_name,
        }));
        setEmployees(mappedData);
      } else {
        // If API fails, use dummy data for testing
        setEmployees([
          { id: "1", nik: "001", full_name: "Agus Santoso" },
          { id: "2", nik: "002", full_name: "Budi Prasetyo" },
          { id: "3", nik: "003", full_name: "Catur Wibowo" },
          { id: "4", nik: "004", full_name: "Dodik Setiawan" },
          { id: "5", nik: "005", full_name: "Eko Susanto" },
          { id: "6", nik: "006", full_name: "Fajar Rahman" },
        ]);
      }
    } catch (err: any) {
      console.error("Failed to fetch employees:", err);
      // If network error, use dummy data for testing
      setEmployees([
        { id: "1", nik: "001", full_name: "Agus Santoso" },
        { id: "2", nik: "002", full_name: "Budi Prasetyo" },
        { id: "3", nik: "003", full_name: "Catur Wibowo" },
        { id: "4", nik: "004", full_name: "Dodik Setiawan" },
        { id: "5", nik: "005", full_name: "Eko Susanto" },
        { id: "6", nik: "006", full_name: "Fajar Rahman" },
      ]);
    }
  };

  onMount(() => {
    fetchShifts();
    fetchEmployees();
    fetchShiftTypes();
    fetchEmployeeGroups();
    fetchShiftAssignments();
  });

  // Create functions
  const createShiftType = async () => {
    const data = shiftTypeForm();
    if (!data.name || !data.start_time || !data.end_time) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newShiftType: ShiftType = {
        id: Date.now().toString(),
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        description: data.description,
        created_at: new Date().toISOString(),
      };

      setShiftTypes(prev => [...prev, newShiftType]);
      setShowAddShiftTypeModal(false);
      resetShiftTypeForm();
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const editShiftType = async () => {
    const data = shiftTypeForm();
    const editing = editingShiftType();

    if (!data.name || !data.start_time || !data.end_time || !editing) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const updatedShiftType: ShiftType = {
        ...editing,
        name: data.name,
        start_time: data.start_time,
        end_time: data.end_time,
        description: data.description,
      };

      setShiftTypes(prev => prev.map(st =>
        st.id === editing.id ? updatedShiftType : st
      ));

      setShowEditShiftTypeModal(false);
      setEditingShiftType(null);
      resetShiftTypeForm();
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const createEmployeeGroup = async () => {
    const data = groupForm();
    if (!data.name) {
      setError("Please fill group name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newGroup: EmployeeGroup = {
        id: Date.now().toString(),
        name: data.name,
        description: data.description,
        employees: [], // Start with empty employees
        created_at: new Date().toISOString(),
      };

      setEmployeeGroups(prev => [...prev, newGroup]);
      setShowAddGroupModal(false);
      resetGroupForm();
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const assignShiftToGroup = async () => {
    const data = assignmentForm();
    if (!data.group_id || !data.shift_type_id || !data.date || !data.location) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const group = employeeGroups().find(g => g.id === data.group_id);
      const shiftType = shiftTypes().find(st => st.id === data.shift_type_id);

      if (!group || !shiftType) {
        setError("Invalid group or shift type selected");
        return;
      }

      const newAssignment: ShiftAssignment = {
        id: Date.now().toString(),
        group_id: data.group_id,
        group_name: group.name,
        shift_type_id: data.shift_type_id,
        shift_type_name: shiftType.name,
        date: data.date,
        location: data.location,
        tasks: data.tasks.filter(t => t.trim() !== ""),
        status: "SCHEDULED",
        notes: data.notes || null,
        created_at: new Date().toISOString(),
      };

      // Create individual shift schedules in backend
      const shiftPromises = group.employees.map(emp => 
        fetch(`${BASE_URL}/shift`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nik: emp.nik,
            shift_type: shiftType.name,
            date: data.date,
            start_time: shiftType.start_time,
            end_time: shiftType.end_time,
            location: data.location,
            tasks: data.tasks.filter(t => t.trim() !== ""),
            notes: data.notes || null,
          }),
        })
      );

      await Promise.all(shiftPromises);

      setShiftAssignments(prev => [...prev, newAssignment]);
      setShowAssignShiftModal(false);
      resetAssignmentForm();
      fetchShifts(); // Sync Active Shifts tab
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const createShift = async () => {
    const data = formData();
    if (!data.nik || !data.shift_type_id || !data.date || !data.location) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BASE_URL}/shift`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
    ]);

    const [showCreateModal, setShowCreateModal] = createSignal(false);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const [editingTask, setEditingTask] = createSignal<ShiftTaskName | null>(null);

    const [formData, setFormData] = createSignal({
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

    // Load from localStorage on mount
    onMount(() => {
        const saved = localStorage.getItem('shiftTaskNames');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setShiftTaskNames(parsed);
                }
            } catch (e) {
                console.error('Failed to parse saved shift tasks:', e);
            }
        }
    });

    const updateShiftType = (type: string) => {
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

    const createShiftTaskName = () => {
        const data = formData();
        if (!data.name || !data.department || !data.working_location) {
            alert("Please fill all required fields");
            return;
        }

        const newTask: ShiftTaskName = {
            id: Date.now().toString(),
            name: data.name,
            department: data.department,
            working_location: data.working_location,
            shift_type: data.shift_type,
            number_of_groups: data.number_of_groups,
            schedules: data.schedules,
            created_at: new Date().toISOString(),
        };

        const updatedTasks = [...shiftTaskNames(), newTask];
        setShiftTaskNames(updatedTasks);

        // Save to localStorage for persistence
        localStorage.setItem('shiftTaskNames', JSON.stringify(updatedTasks));

        setShowCreateModal(false);
        resetForm();
    };

    const startEdit = (task: ShiftTaskName) => {
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

    const updateShiftTaskName = () => {
        const data = formData();
        const editing = editingTask();
        if (!editing) return;

        const updatedTask: ShiftTaskName = {
            ...editing,
            name: data.name,
            department: data.department,
            working_location: data.working_location,
            shift_type: data.shift_type,
            number_of_groups: data.number_of_groups,
            schedules: data.schedules,
        };

        const updatedTasks = shiftTaskNames().map(task => task.id === editing.id ? updatedTask : task);
        setShiftTaskNames(updatedTasks);

        // Save to localStorage for persistence
        localStorage.setItem('shiftTaskNames', JSON.stringify(updatedTasks));

        setShowEditModal(false);
        setEditingTask(null);
        resetForm();
    };

    const deleteShiftTaskName = (id: string) => {
        if (confirm("Are you sure you want to delete this shift task?")) {
            const updatedTasks = shiftTaskNames().filter(task => task.id !== id);
            setShiftTaskNames(updatedTasks);

            // Save to localStorage for persistence
            localStorage.setItem('shiftTaskNames', JSON.stringify(updatedTasks));
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
                            <Show when={shiftTaskNames().length === 0}>
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
                                                    onClick={() => navigate(`/shift-management/${task.id}/groups`)}
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
                                                    onClick={() => deleteShiftTaskName(task.id)}
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
                                        onChange={(e) => updateShiftType(e.currentTarget.value)}
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
                                    class="flex-1 px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-blue-700 transition-all"
                                >
                                    Create Shift Task
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
                                        onChange={(e) => updateShiftType(e.currentTarget.value)}
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
                                    class="flex-1 px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-blue-700 transition-all"
                                >
                                    Update Shift Task
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
