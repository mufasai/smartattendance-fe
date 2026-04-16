import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Users,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-solid";

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
  const [searchTerm, setSearchTerm] = createSignal("");
  const [shifts, setShifts] = createSignal<ShiftSchedule[]>([]);
  const [employees, setEmployees] = createSignal<Employee[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filterShiftType, setFilterShiftType] = createSignal("all");
  const [filterStatus, setFilterStatus] = createSignal("all");
  const [filterDate, setFilterDate] = createSignal("");

  // Form state
  const [formData, setFormData] = createSignal({
    nik: "",
    shift_type: "PAGI",
    date: "",
    start_time: "06:00",
    end_time: "14:00",
    location: "",
    tasks: [""],
    notes: "",
  });

  const BASE_URL = "http://127.0.0.1:8080/api";

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
      }
    } catch (err: any) {
      console.error("Failed to fetch employees:", err);
    }
  };

  onMount(() => {
    fetchShifts();
    fetchEmployees();
  });

  const createShift = async () => {
    const data = formData();
    if (!data.nik || !data.date || !data.location) {
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
        setShowAddModal(false);
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

  const resetForm = () => {
    setFormData({
      nik: "",
      shift_type: "PAGI",
      date: "",
      start_time: "06:00",
      end_time: "14:00",
      location: "",
      tasks: [""],
      notes: "",
    });
  };

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
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "SIANG":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MALAM":
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
            Manage employee shift schedules
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={fetchShifts}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
          >
            <Plus class="w-5 h-5" />
            Add Shift
          </button>
        </div>
      </div>

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
          </div>
        </div>
      </div>

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2">
          <XCircle class="w-5 h-5" />
          {error()}
        </div>
      )}

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

      {/* Add Shift Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Add New Shift
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
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
                    value={formData().shift_type}
                    onChange={(e) => updateShiftTimes(e.currentTarget.value)}
                  >
                    <option value="PAGI">Pagi (06:00-14:00)</option>
                    <option value="SIANG">Siang (14:00-22:00)</option>
                    <option value="MALAM">Malam (22:00-06:00)</option>
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

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().start_time}
                    onInput={(e) =>
                      setFormData((prev) => ({
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
                    value={formData().end_time}
                    onInput={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        end_time: e.currentTarget.value,
                      }))
                    }
                  />
                </div>
              </div>

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
                  setShowAddModal(false);
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
