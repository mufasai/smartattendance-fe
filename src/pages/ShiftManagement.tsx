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
            name: "Security Factory Sukabumi",
            department: "Security",
            working_location: "Factory Sukabumi",
            shift_type: "3 Sesi",
            number_of_groups: 4,
            schedules: [
                { shift_number: 1, start_time: "07:00", end_time: "15:00" },
                { shift_number: 2, start_time: "15:00", end_time: "23:00" },
                { shift_number: 3, start_time: "23:00", end_time: "07:00" },
            ],
            created_at: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      console.error("Failed to fetch shift types:", err);
    }
  };

  const fetchEmployeeGroups = async () => {
    try {
      const response = await fetch(`${BASE_URL}/groups`);
      const result = await response.json();
      if (response.ok && result.status === "success") {
        const mapped = result.data.map((g: any) => ({
          ...g,
          employees: (g.employee_ids || []).map((id: string) => {
             const cleanId = id.includes(":") ? id.split(":")[1] : id;
             return employees().find(e => e.id === cleanId || e.id === id);
          }).filter(Boolean)
        }));
        setEmployeeGroups(mapped);
      }
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
      const response = await fetch(`${BASE_URL}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          employee_ids: data.employee_ids,
        }),
      });
      const result = await response.json();

      if (response.ok && result.status === "success") {
        await fetchEmployeeGroups();
        setShowAddGroupModal(false);
        resetGroupForm();
      } else {
        setError(result.message || "Failed to create group");
      }
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

      setShiftAssignments(prev => [...prev, newAssignment]);
      setShowAssignShiftModal(false);
      resetAssignmentForm();
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
        body: JSON.stringify({
          nik: data.nik,
          shift_type: data.shift_type,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
          tasks: data.tasks.filter((t) => t.trim() !== ""),
          notes: data.notes || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setShowAddShiftModal(false);
        resetForm();
        fetchShifts();
      } else {
        setError(result.message || "Failed to create shift");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset functions
  const resetShiftTypeForm = () => {
    setShiftTypeForm({
      name: "",
      start_time: "06:00",
      end_time: "14:00",
      description: "",
    });
  };

  const resetGroupForm = () => {
    setGroupForm({
      name: "",
      description: "",
      employee_ids: [],
    });
  };

  const resetAssignmentForm = () => {
    setAssignmentForm({
      group_id: "",
      shift_type_id: "",
      date: "",
      location: "",
      tasks: [""],
      notes: "",
    });
  };

  const resetForm = () => {
    setFormData({
      nik: "",
      shift_type: "",
      shift_type_id: "",
      date: "",
      start_time: "",
      end_time: "",
      location: "",
      tasks: [""],
      notes: "",
    });
  };

  // Delete and update functions
  const deleteShift = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/shift/shift_schedules:${shiftId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        fetchShifts();
      } else {
        setError(result.message || "Failed to delete shift");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteShiftType = async (shiftTypeId: string) => {
    if (!confirm("Are you sure you want to delete this shift type?")) return;

    setShiftTypes(prev => prev.filter(st => st.id !== shiftTypeId));
  };

  const updateShiftStatus = async (shiftId: string, status: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/shift/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shift_id: `shift_schedules:${shiftId}`,
          status: status,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        fetchShifts();
      } else {
        setError(result.message || "Failed to update status");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const addTaskField = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ""],
    }));
  };

  const removeTaskField = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const updateTask = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? value : task)),
    }));
  };

  const addAssignmentTaskField = () => {
    setAssignmentForm((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ""],
    }));
  };

  const removeAssignmentTaskField = (index: number) => {
    setAssignmentForm((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  const updateAssignmentTask = (index: number, value: string) => {
    setAssignmentForm((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? value : task)),
    }));
  };

  const getUnassignedEmployees = () => {
    const assignedEmployeeIds = new Set();
    employeeGroups().forEach(group => {
      group.employees.forEach(emp => {
        assignedEmployeeIds.add(emp.id);
      });
    });

    return employees().filter(emp => !assignedEmployeeIds.has(emp.id));
  };

  const filteredShifts = () =>
    shifts().filter((shift) => {
      const matchesSearch =
        shift.employee_name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        shift.nik.toLowerCase().includes(searchTerm().toLowerCase()) ||
        shift.location.toLowerCase().includes(searchTerm().toLowerCase());

      const matchesShiftType =
        filterShiftType() === "all" || shift.shift_type === filterShiftType();

      const matchesStatus =
        filterStatus() === "all" || shift.status === filterStatus();

      const matchesDate =
        !filterDate() || shift.date === filterDate();

      return matchesSearch && matchesShiftType && matchesStatus && matchesDate;
    });

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case "PAGI":
      case "Pagi":
      case "Shift 1":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "SIANG":
      case "Siang":
      case "Shift 2":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MALAM":
      case "Malam":
      case "Shift 3":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return <AlertCircle class="w-4 h-4" />;
      case "COMPLETED":
        return <CheckCircle class="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle class="w-4 h-4" />;
      default:
        return null;
    }
  };

  // Drag and drop functions for employee groups
  const [draggedEmployee, setDraggedEmployee] = createSignal<Employee | null>(null);

  const handleDragStart = (employee: Employee) => {
    setDraggedEmployee(employee);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (groupId: string) => {
    const employee = draggedEmployee();
    if (!employee) return;

    const group = employeeGroups().find(g => g.id === groupId);
    if (!group) return;

    // Check if already in group
    if (group.employees.some(e => e.id === employee.id)) {
        setDraggedEmployee(null);
        return;
    }

    const newEmployeeIds = [...(group as any).employee_ids, employee.id];

    try {
      const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ids: newEmployeeIds,
        }),
      });
      if (response.ok) {
        await fetchEmployeeGroups();
      }
    } catch (err) {
      console.error("Failed to update group", err);
    }

    setDraggedEmployee(null);
  };

  const removeEmployeeFromGroup = async (groupId: string, employeeId: string) => {
    const group = employeeGroups().find(g => g.id === groupId);
    if (!group) return;

    const newEmployeeIds = (group as any).employee_ids.filter((id: string) => {
        const cleanId = id.includes(":") ? id.split(":")[1] : id;
        return cleanId !== employeeId;
    });

    try {
      const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_ids: newEmployeeIds,
        }),
      });
      if (response.ok) {
        await fetchEmployeeGroups();
      }
    } catch (err) {
      console.error("Failed to remove employee from group", err);
    }
  };

  const deleteEmployeeGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group?")) return;
    try {
      const response = await fetch(`${BASE_URL}/groups/${groupId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchEmployeeGroups();
      }
    } catch (err) {
      console.error("Failed to delete group", err);
    }
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

          {/* Shifts Table */}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-[var(--color-light-gray)]">
                <tr>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Employee</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Shift Type</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Date</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Time</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Location</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Status</th>
                  <th class="text-left p-4 font-medium text-[var(--color-text-primary)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                <Show when={filteredShifts().length === 0}>
                  <tr>
                    <td colspan="7" class="text-center p-8 text-[var(--color-text-secondary)]">
                      <div class="flex flex-col items-center gap-2">
                        <Calendar class="w-8 h-8 text-[var(--color-text-secondary)]" />
                        <p>No shifts found</p>
                      </div>
                    </td>
                  </tr>
                </Show>
                <For each={filteredShifts()}>
                  {(shift) => (
                    <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-light-gray)] transition-colors">
                      <td class="p-4">
                        <div>
                          <div class="font-medium text-[var(--color-text-primary)]">{shift.employee_name}</div>
                          <div class="text-sm text-[var(--color-text-secondary)]">NIK: {shift.nik}</div>
                        </div>
                      </td>
                      <td class="p-4">
                        <span class={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getShiftTypeColor(shift.shift_type)}`}>
                          {shift.shift_type}
                        </span>
                      </td>
                      <td class="p-4 text-[var(--color-text-primary)]">{shift.date}</td>
                      <td class="p-4">
                        <div class="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                          <Clock class="w-4 h-4" />
                          {shift.start_time} - {shift.end_time}
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                          <MapPin class="w-4 h-4" />
                          {shift.location}
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-2">
                          {getStatusIcon(shift.status)}
                          <span class={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(shift.status)}`}>
                            {shift.status}
                          </span>
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-2">
                          <Show when={shift.status === "SCHEDULED"}>
                            <button
                              onClick={() => updateShiftStatus(shift.id, "COMPLETED")}
                              class="text-green-600 hover:text-green-700 p-1 rounded"
                              title="Mark as Completed"
                            >
                              <CheckCircle class="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => updateShiftStatus(shift.id, "CANCELLED")}
                              class="text-red-600 hover:text-red-700 p-1 rounded"
                              title="Cancel Shift"
                            >
                              <XCircle class="w-4 h-4" />
                            </button>
                          </Show>
                          <button
                            onClick={() => deleteShift(shift.id)}
                            class="text-red-600 hover:text-red-700 p-1 rounded"
                            title="Delete Shift"
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
      </Show>

      {/* Shift Types Tab */}
      <Show when={activeTab() === "shift-types"}>
        <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <div class="p-6 border-b border-[var(--color-border)]">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Shift Types</h3>
              <button
                onClick={() => setShowAddShiftTypeModal(true)}
                class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
              >
                <Plus class="w-4 h-4" />
                Add Shift Type
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="grid gap-4">
              <Show when={shiftTypes().length === 0}>
                <div class="text-center p-8 text-[var(--color-text-secondary)]">
                  <div class="flex flex-col items-center gap-2">
                    <Settings class="w-8 h-8 text-[var(--color-text-secondary)]" />
                    <p>No shift types found</p>
                  </div>
                </div>
              </Show>
              <For each={shiftTypes()}>
                {(shiftType) => (
                  <div class="border border-[var(--color-border)] rounded-xl p-4">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h4 class="font-semibold text-[var(--color-text-primary)]">{shiftType.name}</h4>
                        <div class="flex items-center gap-4 mt-2 text-sm text-[var(--color-text-secondary)]">
                          <div class="flex items-center gap-1">
                            <Clock class="w-4 h-4" />
                            {shiftType.start_time} - {shiftType.end_time}
                          </div>
                        </div>
                        <Show when={shiftType.description}>
                          <p class="text-sm text-[var(--color-text-secondary)] mt-2">{shiftType.description}</p>
                        </Show>
                      </div>
                      <div class="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingShiftType(shiftType);
                            setShiftTypeForm({
                              name: shiftType.name,
                              start_time: shiftType.start_time,
                              end_time: shiftType.end_time,
                              description: shiftType.description || "",
                            });
                            setShowEditShiftTypeModal(true);
                          }}
                          class="text-blue-600 hover:text-blue-700 p-1 rounded"
                          title="Edit Shift Type"
                        >
                          <Edit class="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteShiftType(shiftType.id)}
                          class="text-red-600 hover:text-red-700 p-1 rounded"
                          title="Delete Shift Type"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>

      {/* Employee Groups Tab */}
      <Show when={activeTab() === "groups"}>
        <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <div class="p-6 border-b border-[var(--color-border)]">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Employee Groups</h3>
              <button
                onClick={() => setShowAddGroupModal(true)}
                class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
              >
                <Plus class="w-4 h-4" />
                Create Group
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="grid lg:grid-cols-2 gap-6">
              {/* Groups Column */}
              <div>
                <h4 class="font-medium text-[var(--color-text-primary)] mb-4">Groups</h4>
                <div class="space-y-4">
                  <Show when={employeeGroups().length === 0}>
                    <div class="text-center p-8 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                      <div class="flex flex-col items-center gap-2">
                        <Users class="w-8 h-8 text-[var(--color-text-secondary)]" />
                        <p>No groups created yet</p>
                        <p class="text-xs">Create a group to start organizing employees</p>
                      </div>
                    </div>
                  </Show>
                  <For each={employeeGroups()}>
                    {(group) => (
                      <div
                        class="border border-[var(--color-border)] rounded-xl p-4 min-h-[120px] bg-[var(--color-light-gray)]"
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(group.id)}
                      >
                        <div class="flex justify-between items-start mb-3">
                          <div>
                            <h5 class="font-semibold text-[var(--color-text-primary)]">{group.name}</h5>
                            <Show when={group.description}>
                              <p class="text-sm text-[var(--color-text-secondary)]">{group.description}</p>
                            </Show>
                          </div>
                          <button
                            onClick={() => deleteEmployeeGroup(group.id)}
                            class="text-red-600 hover:text-red-700 p-1 rounded"
                            title="Delete Group"
                          >
                            <Trash2 class="w-4 h-4" />
                          </button>
                        </div>

                        <div class="space-y-2">
                          <Show when={group.employees.length === 0}>
                            <div class="text-center p-4 text-[var(--color-text-secondary)] border-2 border-dashed border-[var(--color-border)] rounded-lg">
                              <p class="text-sm">Drop employees here</p>
                            </div>
                          </Show>
                          <For each={group.employees}>
                            {(employee) => (
                              <div class="flex items-center justify-between bg-white p-2 rounded-lg border border-[var(--color-border)]">
                                <div>
                                  <div class="font-medium text-sm text-[var(--color-text-primary)]">{employee.full_name}</div>
                                  <div class="text-xs text-[var(--color-text-secondary)]">NIK: {employee.nik}</div>
                                </div>
                                <button
                                  onClick={() => removeEmployeeFromGroup(group.id, employee.id)}
                                  class="text-red-600 hover:text-red-700 p-1 rounded"
                                  title="Remove from Group"
                                >
                                  <X class="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              {/* Available Employees Column */}
              <div>
                <h4 class="font-medium text-[var(--color-text-primary)] mb-4">Available Employees</h4>
                <div class="space-y-2">
                  <Show when={getUnassignedEmployees().length === 0}>
                    <div class="text-center p-8 text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-xl">
                      <div class="flex flex-col items-center gap-2">
                        <Users class="w-8 h-8 text-[var(--color-text-secondary)]" />
                        <p>All employees are assigned to groups</p>
                      </div>
                    </div>
                  </Show>
                  <For each={getUnassignedEmployees()}>
                    {(employee) => (
                      <div
                        class="flex items-center justify-between bg-white p-3 rounded-lg border border-[var(--color-border)] cursor-move hover:shadow-sm transition-shadow"
                        draggable={true}
                        onDragStart={() => handleDragStart(employee)}
                      >
                        <div>
                          <div class="font-medium text-[var(--color-text-primary)]">{employee.full_name}</div>
                          <div class="text-sm text-[var(--color-text-secondary)]">NIK: {employee.nik}</div>
                        </div>
                        <div class="text-[var(--color-text-secondary)]">
                          <Users class="w-4 h-4" />
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Group Assignments Tab */}
      <Show when={activeTab() === "assignments"}>
        <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)]">
          <div class="p-6 border-b border-[var(--color-border)]">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Group Assignments</h3>
              <button
                onClick={() => setShowAssignShiftModal(true)}
                class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
              >
                <Plus class="w-4 h-4" />
                Assign Shift to Group
              </button>
            </div>
          </div>

          <div class="p-6">
            <div class="space-y-4">
              <Show when={shiftAssignments().length === 0}>
                <div class="text-center p-8 text-[var(--color-text-secondary)]">
                  <div class="flex flex-col items-center gap-2">
                    <UserPlus class="w-8 h-8 text-[var(--color-text-secondary)]" />
                    <p>No group assignments found</p>
                  </div>
                </div>
              </Show>
              <For each={shiftAssignments()}>
                {(assignment) => (
                  <div class="border border-[var(--color-border)] rounded-xl p-4">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center gap-4 mb-2">
                          <h4 class="font-semibold text-[var(--color-text-primary)]">{assignment.group_name}</h4>
                          <span class={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getShiftTypeColor(assignment.shift_type_name)}`}>
                            {assignment.shift_type_name}
                          </span>
                          <span class={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                        </div>
                        <div class="grid grid-cols-2 gap-4 text-sm text-[var(--color-text-secondary)]">
                          <div class="flex items-center gap-1">
                            <Calendar class="w-4 h-4" />
                            {assignment.date}
                          </div>
                          <div class="flex items-center gap-1">
                            <MapPin class="w-4 h-4" />
                            {assignment.location}
                          </div>
                        </div>
                        <Show when={assignment.tasks.length > 0}>
                          <div class="mt-2">
                            <p class="text-sm font-medium text-[var(--color-text-primary)]">Tasks:</p>
                            <ul class="text-sm text-[var(--color-text-secondary)] list-disc list-inside">
                              <For each={assignment.tasks}>
                                {(task) => <li>{task}</li>}
                              </For>
                            </ul>
                          </div>
                        </Show>
                        <Show when={assignment.notes}>
                          <div class="mt-2">
                            <p class="text-sm font-medium text-[var(--color-text-primary)]">Notes:</p>
                            <p class="text-sm text-[var(--color-text-secondary)]">{assignment.notes}</p>
                          </div>
                        </Show>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this assignment?")) {
                            setShiftAssignments(prev => prev.filter(a => a.id !== assignment.id));
                          }
                        }}
                        class="text-red-600 hover:text-red-700 p-1 rounded"
                        title="Delete Assignment"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </Show>
      {/* Add Shift Type Modal */}
      <Show when={showAddShiftTypeModal()}>
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowAddShiftTypeModal(false)}>
          <div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Add Shift Type</h3>
              <button
                onClick={() => setShowAddShiftTypeModal(false)}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                  Shift Name *
                </label>
                <input
                  type="text"
                  value={shiftTypeForm().name}
                  onInput={(e) => setShiftTypeForm(prev => ({ ...prev, name: e.currentTarget.value }))}
                  placeholder="e.g., Shift 1"
                  class="w-full px-3 py-2 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-button)]"
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
