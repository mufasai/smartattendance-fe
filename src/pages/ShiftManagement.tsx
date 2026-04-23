import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  LayoutGrid,
} from "lucide-solid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import GroupList, { type Group } from "../components/GroupList";
import GroupForm from "../components/GroupForm";
import ConfirmModal from "../components/ConfirmModal";

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
  // Navigation State
  const [activeTab, setActiveTab] = createSignal<"shifts" | "groups">("shifts");

  // Common State
  const [employees, setEmployees] = createSignal<Employee[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Shifts State
  const [searchTerm, setSearchTerm] = createSignal("");
  const [shifts, setShifts] = createSignal<ShiftSchedule[]>([]);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filterShiftType, setFilterShiftType] = createSignal("all");
  const [filterStatus, setFilterStatus] = createSignal("all");
  const [filterDate, setFilterDate] = createSignal("");

  // Groups State
  const [groups, setGroups] = createSignal<Group[]>([]);
  const [showGroupModal, setShowGroupModal] = createSignal(false);
  const [editingGroup, setEditingGroup] = createSignal<Group | null>(null);
  const [confirmDeleteShift, setConfirmDeleteShift] = createSignal<string | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = createSignal<string | null>(null);

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

  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";

  // --- Shift API Methods ---
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

  const deleteShift = async () => {
    const shiftId = confirmDeleteShift();
    if (!shiftId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/shift/shift_schedules:${shiftId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        setConfirmDeleteShift(null);
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

  // --- Group API Methods ---
  const fetchGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/groups`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        setGroups(result.data);
      } else {
        setGroups([
          { id: "1", name: "Grup A - Shift 1", description: "Terdiri dari petugas senior Gate A.", member_niks: ["2024001", "2024002"] },
          { id: "2", name: "Grup B - Shift 2", description: "Petugas cadangan area parkir.", member_niks: ["2024003"] },
        ]);
      }
    } catch (err: any) {
      setGroups([
        { id: "1", name: "Grup A - Shift 1", description: "Terdiri dari petugas senior Gate A.", member_niks: ["2024001", "2024002"] },
        { id: "2", name: "Grup B - Shift 2", description: "Petugas cadangan area parkir.", member_niks: ["2024003"] },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGroup = async (groupData: Omit<Group, "id">) => {
    setIsLoading(true);
    try {
      if (editingGroup()) {
        await fetch(`${BASE_URL}/groups/${editingGroup()?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });
      } else {
        await fetch(`${BASE_URL}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupData),
        });
      }
      setShowGroupModal(false);
      fetchGroups();
    } catch (err) {
      if (editingGroup()) {
        setGroups(groups().map(g => g.id === editingGroup()?.id ? { ...g, ...groupData } : g));
      } else {
        setGroups([...groups(), { id: Math.random().toString(), ...groupData }]);
      }
      setShowGroupModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    const id = confirmDeleteGroup();
    if (!id) return;
    
    try {
      await fetch(`${BASE_URL}/groups/${id}`, { method: "DELETE" });
      setConfirmDeleteGroup(null);
      fetchGroups();
    } catch (err) {
      setGroups(groups().filter(g => g.id !== id));
      setConfirmDeleteGroup(null);
    }
  };

  // --- Helper Methods ---
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

  const updateShiftTimes = (shiftType: string) => {
    const times: any = {
      PAGI: { start: "06:00", end: "14:00" },
      SIANG: { start: "14:00", end: "22:00" },
      MALAM: { start: "22:00", end: "06:00" },
    };
    const selected = times[shiftType];
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
      case "PAGI": return "bg-orange-100 text-orange-800 border-orange-200";
      case "SIANG": return "bg-blue-100 text-blue-800 border-blue-200";
      case "MALAM": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-800 border-blue-200";
      case "COMPLETED": return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SCHEDULED": return <AlertCircle class="w-4 h-4" />;
      case "COMPLETED": return <CheckCircle class="w-4 h-4" />;
      case "CANCELLED": return <XCircle class="w-4 h-4" />;
      default: return null;
    }
  };

  onMount(() => {
    fetchShifts();
    fetchEmployees();
    fetchGroups();
  });

  return (
    <div class="space-y-6">
      {/* Header & Reusable Tabs */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Shift Management
          </h2>
          <div class="flex gap-4 mt-2">
            <button 
              onClick={() => setActiveTab("shifts")}
              class={`px-4 py-1.5 text-sm font-bold rounded-xl transition-all ${activeTab() === "shifts" ? "bg-[var(--color-primary-button)] text-white shadow-md shadow-[var(--color-primary-button)]/20" : "text-[var(--color-text-secondary)] hover:bg-white border border-transparent hover:border-[var(--color-border)]"}`}
            >
              Jadwal Shift
            </button>
            <button 
              onClick={() => setActiveTab("groups")}
              class={`px-4 py-1.5 text-sm font-bold rounded-xl transition-all ${activeTab() === "groups" ? "bg-[var(--color-primary-button)] text-white shadow-md shadow-[var(--color-primary-button)]/20" : "text-[var(--color-text-secondary)] hover:bg-white border border-transparent hover:border-[var(--color-border)]"}`}
            >
              Manajemen Grup
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="bg-white" onClick={activeTab() === "shifts" ? fetchShifts : fetchGroups}>
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={() => activeTab() === "shifts" ? setShowAddModal(true) : setShowGroupModal(true)}>
            <Plus class="w-5 h-5" />
            {activeTab() === "shifts" ? "Add Shift" : "Buat Grup"}
          </Button>
        </div>
      </div>

      <Show when={activeTab() === "shifts"}>
        <div class="space-y-6">
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

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <For each={filteredShifts()}>
              {(shift) => (
                <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5 hover:shadow-md transition-all">
                  <div class="flex justify-between items-start mb-4">
                    <div class="flex gap-2">
                      <span class={`px-3 py-1 text-xs font-bold rounded-full border ${getShiftTypeColor(shift.shift_type)}`}>{shift.shift_type}</span>
                      <span class={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${getStatusColor(shift.status)}`}>{getStatusIcon(shift.status)}{shift.status}</span>
                    </div>
                  </div>
                  <div class="space-y-3">
                    <div class="text-lg font-bold text-[var(--color-text-primary)]">{shift.employee_name}</div>
                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><Calendar class="w-4 h-4" />{shift.date}</div>
                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><Clock class="w-4 h-4" />{shift.start_time} - {shift.end_time}</div>
                    <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"><MapPin class="w-4 h-4" />{shift.location}</div>
                  </div>
                  <div class="flex gap-2 mt-4 pt-4 border-t border-[var(--color-border)]">
                    <Show when={shift.status === "SCHEDULED"}>
                      <Button size="sm" variant="success" class="flex-1 text-xs" onClick={() => updateShiftStatus(shift.id, "COMPLETED")}>Complete</Button>
                      <Button size="sm" variant="danger" class="flex-1 text-xs" onClick={() => updateShiftStatus(shift.id, "CANCELLED")}>Cancel</Button>
                    </Show>
                    <button onClick={() => setConfirmDeleteShift(shift.id)} class="text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={activeTab() === "groups"}>
        <div class="space-y-6">
           <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-bg)] text-[var(--color-primary-button)] flex items-center justify-center">
                  <LayoutGrid class="w-6 h-6" />
                </div>
                <div>
                  <h4 class="font-bold text-[var(--color-text-primary)]">Overview Grup</h4>
                  <p class="text-xs text-[var(--color-text-secondary)] tracking-tight">Kelola tim Anda untuk memudahkan alokasi shift rutin.</p>
                </div>
              </div>
           </div>
           
           <GroupList 
            groups={groups()} 
            isLoading={isLoading()} 
            onEdit={(g) => { setEditingGroup(g); setShowGroupModal(true); }} 
            onDelete={(id) => setConfirmDeleteGroup(id)} 
           />
        </div>
      </Show>

      {/* Add Shift Modal */}
      <Modal isOpen={showAddModal()} onClose={() => setShowAddModal(false)} title="Add New Shift">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Employee *</label>
            <select
              class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-white"
              value={formData().nik}
              onChange={(e) => setFormData((prev) => ({ ...prev, nik: e.currentTarget.value }))}
            >
              <option value="">Select Employee</option>
              <For each={employees()}>{(emp) => <option value={emp.nik}>{emp.full_name} (NIK: {emp.nik})</option>}</For>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Shift Type *</label>
              <select class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl" value={formData().shift_type} onChange={(e) => updateShiftTimes(e.currentTarget.value)}>
                <option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="MALAM">Malam</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Date *</label>
              <input type="date" class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl" value={formData().date} onInput={(e) => setFormData((prev) => ({ ...prev, date: e.currentTarget.value }))} />
            </div>
          </div>
          <div class="flex gap-3 pt-6 border-t border-[var(--color-border)]">
             <Button class="flex-1" variant="ghost" onClick={() => setShowAddModal(false)}>Batal</Button>
             <Button class="flex-1" onClick={createShift}>Create Shift</Button>
          </div>
        </div>
      </Modal>

      {/* Group Modal */}
      <Modal 
        isOpen={showGroupModal()} 
        onClose={() => setShowGroupModal(false)} 
        title={editingGroup() ? "Edit Grup" : "Buat Grup Baru"}
      >
        <GroupForm 
          initialData={editingGroup()} 
          employees={employees()} 
          onSubmit={handleSaveGroup} 
          onCancel={() => setShowGroupModal(false)} 
          isLoading={isLoading()} 
        />
      </Modal>

      {/* Confirm Modals */}
      <ConfirmModal
        isOpen={!!confirmDeleteShift()}
        title="Hapus Jadwal Shift"
        message="Apakah Anda yakin ingin menghapus jadwal shift ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={deleteShift}
        onCancel={() => setConfirmDeleteShift(null)}
        variant="danger"
        isLoading={isLoading()}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteGroup()}
        title="Hapus Grup"
        message="Hapus grup ini? Anggota grup tidak akan terhapus, namun relasi grup akan hilang selamanya."
        onConfirm={handleDeleteGroup}
        onCancel={() => setConfirmDeleteGroup(null)}
        variant="danger"
        isLoading={isLoading()}
      />

      {error() && (
        <div class="fixed bottom-6 right-6 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 shadow-lg animate-in slide-in-from-bottom-5">
          {error()}
        </div>
      )}
    </div>
  );
};

export default ShiftManagement;
