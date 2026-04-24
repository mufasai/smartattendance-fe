import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Settings,
  UserPlus,
} from "lucide-solid";

interface ShiftType {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  description?: string;
  created_at: string;
}

interface EmployeeGroup {
  id: string;
  name: string;
  description?: string;
  employees: Employee[];
  created_at: string;
}

interface ShiftAssignment {
  id: string;
  group_id: string;
  group_name: string;
  shift_type_id: string;
  shift_type_name: string;
  date: string;
  location: string;
  tasks: string[];
  status: string;
  notes: string | null;
  created_at: string;
}

interface ShiftSchedule {
  id: string;
  employee_id: string;
  nik: string;
  employee_name: string;
  shift_type: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  tasks: string[];
  status: string;
  notes: string | null;
  created_at: string;
}

interface Employee {
  id: string;
  nik: string;
  full_name: string;
}

const ShiftManagement: Component = () => {
  const [activeTab, setActiveTab] = createSignal("shifts");
  const [searchTerm, setSearchTerm] = createSignal("");

  // Data states
  const [shifts, setShifts] = createSignal<ShiftSchedule[]>([]);
  const [shiftTypes, setShiftTypes] = createSignal<ShiftType[]>([]);
  const [employeeGroups, setEmployeeGroups] = createSignal<EmployeeGroup[]>([]);
  const [shiftAssignments, setShiftAssignments] = createSignal<ShiftAssignment[]>([]);
  const [employees, setEmployees] = createSignal<Employee[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Modal states
  const [showAddShiftTypeModal, setShowAddShiftTypeModal] = createSignal(false);
  const [showEditShiftTypeModal, setShowEditShiftTypeModal] = createSignal(false);
  const [editingShiftType, setEditingShiftType] = createSignal<ShiftType | null>(null);
  const [showAddGroupModal, setShowAddGroupModal] = createSignal(false);
  const [showAssignShiftModal, setShowAssignShiftModal] = createSignal(false);
  const [showAddShiftModal, setShowAddShiftModal] = createSignal(false);

  // Filter states
  const [filterShiftType, setFilterShiftType] = createSignal("all");
  const [filterStatus, setFilterStatus] = createSignal("all");
  const [filterDate, setFilterDate] = createSignal("");

  // Form states
  const [shiftTypeForm, setShiftTypeForm] = createSignal({
    name: "",
    start_time: "06:00",
    end_time: "14:00",
    description: "",
  });

  const [groupForm, setGroupForm] = createSignal({
    name: "",
    description: "",
    employee_ids: [] as string[],
  });

  const [assignmentForm, setAssignmentForm] = createSignal({
    group_id: "",
    shift_type_id: "",
    date: "",
    location: "",
    tasks: [""],
    notes: "",
  });

  // Legacy form state for individual shift creation
  const [formData, setFormData] = createSignal({
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

  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";

  // Fetch functions
  const fetchShiftTypes = async () => {
    try {
      // Mock data for now - replace with actual API call
      setShiftTypes([
        {
          id: "1",
          name: "Shift 1",
          start_time: "06:00",
          end_time: "14:00",
          description: "Shift pagi untuk keamanan gedung",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Shift 2",
          start_time: "14:00",
          end_time: "22:00",
          description: "Shift siang untuk keamanan gedung",
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
      // Mock creation - replace with actual API call
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
      // Mock assignment - replace with actual API call
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

  const deleteEmployeeGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this employee group?")) return;

    setEmployeeGroups(prev => prev.filter(g => g.id !== groupId));
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

  const updateShiftTimes = (shiftType: string) => {
    const times = {
      PAGI: { start: "06:00", end: "14:00" },
      SIANG: { start: "14:00", end: "22:00" },
      MALAM: { start: "22:00", end: "06:00" },
    };
    const selected = times[shiftType as keyof typeof times];
    setFormData((prev) => ({
      ...prev,
      shift_type: shiftType,
      start_time: selected.start,
      end_time: selected.end,
    }));
  };

  const toggleEmployeeInGroup = (employeeId: string) => {
    setGroupForm(prev => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(employeeId)
        ? prev.employee_ids.filter(id => id !== employeeId)
        : [...prev.employee_ids, employeeId]
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
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "SIANG":
      case "Siang":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MALAM":
      case "Malam":
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

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Shift Management
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Manage shift types, employee groups, and shift assignments
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={() => {
              fetchShifts();
              fetchShiftTypes();
              fetchEmployeeGroups();
              fetchShiftAssignments();
            }}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-1">
        <div class="flex gap-1">
          <button
            onClick={() => setActiveTab("shifts")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab() === "shifts"
              ? "bg-[var(--color-primary-button)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
              }`}
          >
            <Calendar class="w-4 h-4" />
            Active Shifts
          </button>
          <button
            onClick={() => setActiveTab("shift-types")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab() === "shift-types"
              ? "bg-[var(--color-primary-button)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
              }`}
          >
            <Settings class="w-4 h-4" />
            Shift Types
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab() === "groups"
              ? "bg-[var(--color-primary-button)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
              }`}
          >
            <Users class="w-4 h-4" />
            Employee Groups
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab() === "assignments"
              ? "bg-[var(--color-primary-button)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
              }`}
          >
            <UserPlus class="w-4 h-4" />
            Group Assignments
          </button>
        </div>
      </div>

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2">
          <XCircle class="w-5 h-5" />
          {error()}
        </div>
      )}
      {/* Active Shifts Tab */}
      <Show when={activeTab() === "shifts"}>
        <div class="space-y-4">
          {/* Filters & Search */}
          <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4">
            <div class="flex flex-col lg:flex-row gap-4">
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
                </div>
                <input
                  type="text"
                  class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
                  placeholder="Search by employee name, NIK, or location..."
                  value={searchTerm()}
                  onInput={(e) => setSearchTerm(e.currentTarget.value)}
                />
              </div>

              <div class="flex gap-2 flex-wrap">
                <input
                  type="date"
                  class="block pl-4 pr-4 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
                  value={filterDate()}
                  onInput={(e) => setFilterDate(e.currentTarget.value)}
                />

                <select
                  class="block pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
                  value={filterShiftType()}
                  onChange={(e) => setFilterShiftType(e.currentTarget.value)}
                >
                  <option value="all">All Shifts</option>
                  <option value="PAGI">Pagi (06:00-14:00)</option>
                  <option value="SIANG">Siang (14:00-22:00)</option>
                  <option value="MALAM">Malam (22:00-06:00)</option>
                </select>

                <select
                  class="block pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
                  value={filterStatus()}
                  onChange={(e) => setFilterStatus(e.currentTarget.value)}
                >
                  <option value="all">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  onClick={() => setShowAddShiftModal(true)}
                  class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
                >
                  <Plus class="w-4 h-4" />
                  Add Individual Shift
                </button>
              </div>
            </div>
          </div>

          {/* Shifts Grid */}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading() && shifts().length === 0 ? (
              <div class="col-span-full flex items-center justify-center py-12">
                <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
                  <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
                  Loading shifts...
                </div>
              </div>
            ) : (
              <For each={filteredShifts()}>
                {(shift) => (
                  <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5 hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-4">
                      <div class="flex gap-2">
                        <span
                          class={`px-3 py-1 text-xs font-bold rounded-full border ${getShiftTypeColor(shift.shift_type)}`}
                        >
                          {shift.shift_type}
                        </span>
                        <span
                          class={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${getStatusColor(shift.status)}`}
                        >
                          {getStatusIcon(shift.status)}
                          {shift.status}
                        </span>
                      </div>
                    </div>

                    <div class="space-y-3">
                      <div>
                        <div class="text-lg font-bold text-[var(--color-text-primary)]">
                          {shift.employee_name}
                        </div>
                        <div class="text-xs text-[var(--color-text-secondary)]">
                          NIK: {shift.nik}
                        </div>
                      </div>

                      <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Calendar class="w-4 h-4" />
                        <span>{shift.date}</span>
                      </div>

                      <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <Clock class="w-4 h-4" />
                        <span>
                          {shift.start_time} - {shift.end_time}
                        </span>
                      </div>

                      <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <MapPin class="w-4 h-4" />
                        <span class="truncate">{shift.location}</span>
                      </div>

                      {shift.tasks.length > 0 && (
                        <div class="pt-2 border-t border-[var(--color-border)]">
                          <div class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                            Tasks:
                          </div>
                          <ul class="text-xs text-[var(--color-text-secondary)] space-y-1">
                            <For each={shift.tasks.slice(0, 2)}>
                              {(task) => <li>• {task}</li>}
                            </For>
                            {shift.tasks.length > 2 && (
                              <li class="text-[var(--color-primary-button)] font-medium">
                                +{shift.tasks.length - 2} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div class="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                      {shift.status === "SCHEDULED" && (
                        <>
                          <button
                            onClick={() => updateShiftStatus(shift.id, "COMPLETED")}
                            class="flex-1 flex items-center justify-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
                          >
                            <CheckCircle class="w-3 h-3" />
                            Complete
                          </button>
                          <button
                            onClick={() => updateShiftStatus(shift.id, "CANCELLED")}
                            class="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                          >
                            <XCircle class="w-3 h-3" />
                            Cancel
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => deleteShift(shift.id)}
                        class="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        <Trash2 class="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </For>
            )}

            {!isLoading() && filteredShifts().length === 0 && (
              <div class="col-span-full text-center py-12 text-[var(--color-text-secondary)]">
                No shifts found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </Show>
      {/* Shift Types Tab */}
      <Show when={activeTab() === "shift-types"}>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Shift Types</h3>
              <p class="text-sm text-[var(--color-text-secondary)]">
                Create and manage different shift types with their time schedules
              </p>
            </div>
            <button
              onClick={() => setShowAddShiftTypeModal(true)}
              class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
            >
              <Plus class="w-4 h-4" />
              Create Shift Type
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={shiftTypes()}>
              {(shiftType) => (
                <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5 hover:shadow-md transition-all">
                  <div class="flex justify-between items-start mb-4">
                    <span
                      class={`px-3 py-1 text-xs font-bold rounded-full border ${getShiftTypeColor(shiftType.name)}`}
                    >
                      {shiftType.name}
                    </span>
                    <button
                      onClick={() => deleteShiftType(shiftType.id)}
                      class="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <Clock class="w-4 h-4" />
                      <span>
                        {shiftType.start_time} - {shiftType.end_time}
                      </span>
                    </div>

                    {shiftType.description && (
                      <p class="text-sm text-[var(--color-text-secondary)]">
                        {shiftType.description}
                      </p>
                    )}

                    <div class="text-xs text-[var(--color-text-tertiary)]">
                      Created: {new Date(shiftType.created_at).toLocaleDateString("id-ID")}
                    </div>
                  </div>
                </div>
              )}
            </For>

            {shiftTypes().length === 0 && (
              <div class="col-span-full text-center py-12 text-[var(--color-text-secondary)]">
                No shift types created yet. Create your first shift type to get started.
              </div>
            )}
          </div>
        </div>
      </Show>

      {/* Employee Groups Tab */}
      <Show when={activeTab() === "groups"}>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Employee Groups</h3>
              <p class="text-sm text-[var(--color-text-secondary)]">
                Create groups and drag employees to assign them
              </p>
            </div>
            <button
              onClick={() => setShowAddGroupModal(true)}
              class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
            >
              <Plus class="w-4 h-4" />
              Create Group
            </button>
          </div>

          {/* Two Column Layout */}
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[500px]">
            {/* Left Column - Groups */}
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-[var(--color-text-primary)]">Groups</h4>
                <span class="text-sm text-[var(--color-text-secondary)]">
                  {employeeGroups().length} groups
                </span>
              </div>

              <div class="space-y-3">
                <For each={employeeGroups()}>
                  {(group) => (
                    <div
                      class="bg-blue-500 text-white rounded-lg p-4 min-h-[120px] relative group hover:bg-blue-600 transition-colors"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('bg-blue-400');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('bg-blue-400');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('bg-blue-400');
                        const employeeId = e.dataTransfer?.getData('text/plain');
                        if (employeeId) {
                          const employee = employees().find(emp => emp.id === employeeId);
                          if (employee && !group.employees.some(emp => emp.id === employeeId)) {
                            // Add employee to group
                            setEmployeeGroups(prev => prev.map(g =>
                              g.id === group.id
                                ? { ...g, employees: [...g.employees, employee] }
                                : g
                            ));
                          }
                        }
                      }}
                    >
                      <div class="flex justify-between items-start mb-3">
                        <h5 class="font-semibold text-lg">{group.name}</h5>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this group?")) {
                              setEmployeeGroups(prev => prev.filter(g => g.id !== group.id));
                            }
                          }}
                          class="opacity-0 group-hover:opacity-100 text-white hover:text-red-200 transition-opacity"
                        >
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>

                      <div class="space-y-2">
                        <For each={group.employees}>
                          {(employee) => (
                            <div
                              class="bg-white/20 rounded px-3 py-1 text-sm flex justify-between items-center cursor-move"
                              draggable="true"
                              onDragStart={(e) => {
                                e.dataTransfer?.setData('text/plain', employee.id);
                                e.dataTransfer?.setData('source', 'group');
                                e.dataTransfer?.setData('groupId', group.id);
                              }}
                            >
                              <span>{employee.full_name}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Remove employee from group
                                  setEmployeeGroups(prev => prev.map(g =>
                                    g.id === group.id
                                      ? { ...g, employees: g.employees.filter(emp => emp.id !== employee.id) }
                                      : g
                                  ));
                                }}
                                class="text-white/70 hover:text-white"
                              >
                                <X class="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </For>

                        {group.employees.length === 0 && (
                          <div class="text-white/60 text-sm italic text-center py-4 border-2 border-dashed border-white/30 rounded">
                            Drag employees here
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </For>

                {employeeGroups().length === 0 && (
                  <div class="text-center py-12 text-[var(--color-text-secondary)]">
                    <Users class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No groups created yet.</p>
                    <p class="text-sm">Create your first group to get started.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Available Employees */}
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
              <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold text-[var(--color-text-primary)]">Available Employees</h4>
                <span class="text-sm text-[var(--color-text-secondary)]">
                  {getUnassignedEmployees().length} unassigned
                </span>
              </div>

              <div class="space-y-2 max-h-[400px] overflow-y-auto">
                <For each={getUnassignedEmployees()}>
                  {(employee) => (
                    <div
                      class="bg-gray-50 border border-gray-200 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors flex items-center justify-between"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer?.setData('text/plain', employee.id);
                        e.dataTransfer?.setData('source', 'available');
                      }}
                    >
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users class="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div class="font-medium text-[var(--color-text-primary)]">
                            {employee.full_name}
                          </div>
                          <div class="text-xs text-[var(--color-text-secondary)]">
                            NIK: {employee.nik}
                          </div>
                        </div>
                      </div>
                      <div class="text-gray-400">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                      </div>
                    </div>
                  )}
                </For>

                {getUnassignedEmployees().length === 0 && (
                  <div class="text-center py-12 text-[var(--color-text-secondary)]">
                    <CheckCircle class="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>All employees are assigned to groups!</p>
                  </div>
                )}
              </div>

              {/* Drop zone for removing from groups */}
              <div
                class="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('border-red-400', 'bg-red-50');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-red-400', 'bg-red-50');
                  const employeeId = e.dataTransfer?.getData('text/plain');
                  const source = e.dataTransfer?.getData('source');
                  const groupId = e.dataTransfer?.getData('groupId');

                  if (employeeId && source === 'group' && groupId) {
                    // Remove employee from group
                    setEmployeeGroups(prev => prev.map(g =>
                      g.id === groupId
                        ? { ...g, employees: g.employees.filter(emp => emp.id !== employeeId) }
                        : g
                    ));
                  }
                }}
              >
                <Trash2 class="w-6 h-6 mx-auto mb-2" />
                <p class="text-sm">Drop here to remove from group</p>
              </div>
            </div>
          </div>
        </div>
      </Show>

      {/* Group Assignments Tab */}
      <Show when={activeTab() === "assignments"}>
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Group Assignments</h3>
              <p class="text-sm text-[var(--color-text-secondary)]">
                Assign shifts to employee groups for bulk scheduling
              </p>
            </div>
            <button
              onClick={() => setShowAssignShiftModal(true)}
              class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
            >
              <Plus class="w-4 h-4" />
              Assign Shift to Group
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={shiftAssignments()}>
              {(assignment) => (
                <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5 hover:shadow-md transition-all">
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-2">
                      <span
                        class={`px-3 py-1 text-xs font-bold rounded-full border ${getShiftTypeColor(assignment.shift_type_name)}`}
                      >
                        {assignment.shift_type_name}
                      </span>
                      <span
                        class={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${getStatusColor(assignment.status)}`}
                      >
                        {getStatusIcon(assignment.status)}
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div>
                      <div class="text-lg font-bold text-[var(--color-text-primary)]">
                        {assignment.group_name}
                      </div>
                      <div class="text-xs text-[var(--color-text-secondary)]">
                        Group Assignment
                      </div>
                    </div>

                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <Calendar class="w-4 h-4" />
                      <span>{assignment.date}</span>
                    </div>

                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <MapPin class="w-4 h-4" />
                      <span class="truncate">{assignment.location}</span>
                    </div>

                    {assignment.tasks.length > 0 && (
                      <div class="pt-2 border-t border-[var(--color-border)]">
                        <div class="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                          Tasks:
                        </div>
                        <ul class="text-xs text-[var(--color-text-secondary)] space-y-1">
                          <For each={assignment.tasks.slice(0, 2)}>
                            {(task) => <li>• {task}</li>}
                          </For>
                          {assignment.tasks.length > 2 && (
                            <li class="text-[var(--color-primary-button)] font-medium">
                              +{assignment.tasks.length - 2} more
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div class="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                    <button
                      onClick={() => {
                        // Delete assignment logic here
                        setShiftAssignments(prev => prev.filter(a => a.id !== assignment.id));
                      }}
                      class="flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                    >
                      <Trash2 class="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </For>

            {shiftAssignments().length === 0 && (
              <div class="col-span-full text-center py-12 text-[var(--color-text-secondary)]">
                No group assignments created yet. Assign shifts to groups to get started.
              </div>
            )}
          </div>
        </div>
      </Show>
      {/* Create Shift Type Modal */}
      <Show when={showAddShiftTypeModal()}>
        <div
          class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{
            "z-index": "9999",
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddShiftTypeModal(false);
              resetShiftTypeForm();
            }
          }}
        >
          <div
            class="bg-white rounded-2xl shadow-xl max-w-md w-full"
            style={{
              "z-index": "10000",
              "position": "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Create Shift Type
              </h3>
              <button
                onClick={() => {
                  setShowAddShiftTypeModal(false);
                  resetShiftTypeForm();
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Shift Name *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Pagi, Siang, Malam"
                  value={shiftTypeForm().name}
                  onInput={(e) =>
                    setShiftTypeForm((prev) => ({ ...prev, name: e.currentTarget.value }))
                  }
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={shiftTypeForm().start_time}
                    onInput={(e) =>
                      setShiftTypeForm((prev) => ({
                        ...prev,
                        start_time: e.currentTarget.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={shiftTypeForm().end_time}
                    onInput={(e) =>
                      setShiftTypeForm((prev) => ({
                        ...prev,
                        end_time: e.currentTarget.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description (Optional)
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white resize-none"
                  rows="3"
                  placeholder="Describe this shift type..."
                  value={shiftTypeForm().description}
                  onInput={(e) =>
                    setShiftTypeForm((prev) => ({ ...prev, description: e.currentTarget.value }))
                  }
                />
              </div>
            </div>

            <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddShiftTypeModal(false);
                  resetShiftTypeForm();
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createShiftType}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Creating..." : "Create Shift Type"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Create Employee Group Modal */}
      <Show when={showAddGroupModal()}>
        <div
          class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{
            "z-index": "9999",
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddGroupModal(false);
              resetGroupForm();
            }
          }}
        >
          <div
            class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              "z-index": "10000",
              "position": "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="sticky top-0 bg-white border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Create Employee Group
              </h3>
              <button
                onClick={() => {
                  setShowAddGroupModal(false);
                  resetGroupForm();
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Group A, Team Alpha"
                  value={groupForm().name}
                  onInput={(e) =>
                    setGroupForm((prev) => ({ ...prev, name: e.currentTarget.value }))
                  }
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description (Optional)
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white resize-none"
                  rows="3"
                  placeholder="Describe this group..."
                  value={groupForm().description}
                  onInput={(e) =>
                    setGroupForm((prev) => ({ ...prev, description: e.currentTarget.value }))
                  }
                />
              </div>

              <div class="bg-blue-50 p-4 rounded-xl">
                <div class="flex items-center gap-2 text-blue-700 mb-2">
                  <Users class="w-4 h-4" />
                  <span class="text-sm font-medium">How to add employees:</span>
                </div>
                <p class="text-sm text-blue-600">
                  After creating the group, you can drag and drop employees from the "Available Employees" section to assign them to this group.
                </p>
              </div>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddGroupModal(false);
                  resetGroupForm();
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createEmployeeGroup}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      </Show>
      {/* Assign Shift to Group Modal */}
      <Show when={showAssignShiftModal()}>
        <div
          class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{
            "z-index": "9999",
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssignShiftModal(false);
              resetAssignmentForm();
            }
          }}
        >
          <div
            class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              "z-index": "10000",
              "position": "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="sticky top-0 bg-white border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Assign Shift to Group
              </h3>
              <button
                onClick={() => {
                  setShowAssignShiftModal(false);
                  resetAssignmentForm();
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Employee Group *
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={assignmentForm().group_id}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({ ...prev, group_id: e.currentTarget.value }))
                    }
                  >
                    <option value="">Select Group</option>
                    <For each={employeeGroups()}>
                      {(group) => (
                        <option value={group.id}>
                          {group.name} ({group.employees.length} employees)
                        </option>
                      )}
                    </For>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Shift Type *
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={assignmentForm().shift_type_id}
                    onChange={(e) =>
                      setAssignmentForm((prev) => ({ ...prev, shift_type_id: e.currentTarget.value }))
                    }
                  >
                    <option value="">Select Shift Type</option>
                    <For each={shiftTypes()}>
                      {(shiftType) => (
                        <option value={shiftType.id}>
                          {shiftType.name} ({shiftType.start_time} - {shiftType.end_time})
                        </option>
                      )}
                    </For>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  value={assignmentForm().date}
                  onInput={(e) =>
                    setAssignmentForm((prev) => ({ ...prev, date: e.currentTarget.value }))
                  }
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Gedung A - Lantai 1"
                  value={assignmentForm().location}
                  onInput={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      location: e.currentTarget.value,
                    }))
                  }
                />
              </div>

              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
                    Tasks
                  </label>
                  <button
                    onClick={addAssignmentTaskField}
                    class="text-xs text-[var(--color-primary-button)] hover:underline font-medium"
                  >
                    + Add Task
                  </button>
                </div>
                <div class="space-y-2">
                  <For each={assignmentForm().tasks}>
                    {(task, index) => (
                      <div class="flex gap-2">
                        <input
                          type="text"
                          class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-sm"
                          placeholder="Enter task description"
                          value={task}
                          onInput={(e) => updateAssignmentTask(index(), e.currentTarget.value)}
                        />
                        {assignmentForm().tasks.length > 1 && (
                          <button
                            onClick={() => removeAssignmentTaskField(index())}
                            class="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                          >
                            <X class="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white resize-none"
                  rows="3"
                  placeholder="Add any additional notes..."
                  value={assignmentForm().notes}
                  onInput={(e) =>
                    setAssignmentForm((prev) => ({ ...prev, notes: e.currentTarget.value }))
                  }
                />
              </div>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAssignShiftModal(false);
                  resetAssignmentForm();
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={assignShiftToGroup}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Assigning..." : "Assign Shift"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Add Individual Shift Modal (Legacy) */}
      <Show when={showAddShiftModal()}>
        <div
          class="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{
            "z-index": "9999",
            "position": "fixed",
            "top": "0",
            "left": "0",
            "right": "0",
            "bottom": "0"
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddShiftModal(false);
              resetForm();
            }
          }}
        >
          <div
            class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              "z-index": "10000",
              "position": "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="sticky top-0 bg-white border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Add Individual Shift
              </h3>
              <button
                onClick={() => {
                  setShowAddShiftModal(false);
                  resetForm();
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Employee *
                </label>
                <select
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  value={formData().nik}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nik: e.currentTarget.value }))
                  }
                >
                  <option value="">Select Employee</option>
                  <For each={employees()}>
                    {(emp) => (
                      <option value={emp.nik}>
                        {emp.full_name} (NIK: {emp.nik})
                      </option>
                    )}
                  </For>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Shift Type *
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().shift_type_id}
                    onChange={(e) => {
                      const selectedShiftType = shiftTypes().find(st => st.id === e.currentTarget.value);
                      if (selectedShiftType) {
                        setFormData((prev) => ({
                          ...prev,
                          shift_type: selectedShiftType.name,
                          shift_type_id: selectedShiftType.id,
                          start_time: selectedShiftType.start_time,
                          end_time: selectedShiftType.end_time,
                        }));
                      }
                    }}
                  >
                    <option value="">Select Shift Type</option>
                    <For each={shiftTypes()}>
                      {(shiftType) => (
                        <option value={shiftType.id}>
                          {shiftType.name} ({shiftType.start_time} - {shiftType.end_time})
                        </option>
                      )}
                    </For>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().date}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, date: e.currentTarget.value }))
                    }
                  />
                </div>
              </div>

              {/* Display selected shift time (read-only) */}
              {formData().shift_type && (
                <div class="bg-[var(--color-light-gray)] p-4 rounded-xl">
                  <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <Clock class="w-4 h-4" />
                    <span>
                      Selected shift time: {formData().start_time} - {formData().end_time}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Gedung A - Lantai 1"
                  value={formData().location}
                  onInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.currentTarget.value,
                    }))
                  }
                />
              </div>

              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
                    Tasks
                  </label>
                  <button
                    onClick={addTaskField}
                    class="text-xs text-[var(--color-primary-button)] hover:underline font-medium"
                  >
                    + Add Task
                  </button>
                </div>
                <div class="space-y-2">
                  <For each={formData().tasks}>
                    {(task, index) => (
                      <div class="flex gap-2">
                        <input
                          type="text"
                          class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-sm"
                          placeholder="Enter task description"
                          value={task}
                          onInput={(e) => updateTask(index(), e.currentTarget.value)}
                        />
                        {formData().tasks.length > 1 && (
                          <button
                            onClick={() => removeTaskField(index())}
                            class="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                          >
                            <X class="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white resize-none"
                  rows="3"
                  placeholder="Add any additional notes..."
                  value={formData().notes}
                  onInput={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.currentTarget.value }))
                  }
                />
              </div>
            </div>

            <div class="sticky bottom-0 bg-white border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddShiftModal(false);
                  resetForm();
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createShift}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Creating..." : "Create Shift"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default ShiftManagement;