import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  MapPin,
  Clock,
  RefreshCw,
  Edit2,
  Trash2,
  Activity,
  User,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-solid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import CheckpointForm, { type Checkpoint } from "../components/CheckpointForm";
import AssignmentForm, { type CreateAssignmentPayload } from "../components/AssignmentForm";
import ConfirmModal from "../components/ConfirmModal";
import type Employee from "./Employee";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  checkpoints: string[];
  status: string;
}

interface ActivePatrol {
  id: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://127.0.0.1:8080/api";

/** Extract string ID from SurrealDB Thing format */
const extractId = (raw: any): string =>
  raw?.id?.String ?? raw?.id ?? raw ?? "";

/** Map backend checkpoint response → frontend Checkpoint type */
const mapCheckpoint = (item: any): Checkpoint => ({
  id: extractId(item.id),
  name: item.name,
  code: item.qr_code_id,
  latitude: String(item.latitude ?? ""),
  longitude: String(item.longitude ?? ""),
  notes: item.description ?? "",
  status: "Belum dikunjungi",
});

// ─── Component ───────────────────────────────────────────────────────────────

const Patrol: Component = () => {
  // Data state
  const [checkpoints, setCheckpoints] = createSignal<Checkpoint[]>([]);
  const [assignments, setAssignments] = createSignal<Assignment[]>([]);
  const [activePatrols, setActivePatrols] = createSignal<ActivePatrol[]>([]);
  const [employees, setEmployees] = createSignal<Employee[]>([]);

  // UI state
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Modal state
  const [checkpointModalOpen, setCheckpointModalOpen] = createSignal(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = createSignal(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = createSignal(false);
  const [editingCheckpoint, setEditingCheckpoint] = createSignal<Checkpoint | null>(null);
  const [checkpointToDelete, setCheckpointToDelete] = createSignal<string | null>(null);

  // ─── API: Checkpoints ───────────────────────────────────────────────────

  const fetchCheckpoints = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/patrol/checkpoints`);
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setCheckpoints(result.data.map(mapCheckpoint));
      } else {
        setError(result.message ?? "Gagal mengambil data checkpoint.");
      }
    } catch {
      setError("Koneksi ke backend gagal. Pastikan server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveCheckpoint = async (data: Omit<Checkpoint, "status">) => {
    setIsSaving(true);
    setError(null);
    const payload = {
      name: data.name,
      qr_code_id: data.code,
      latitude: parseFloat(data.latitude) || 0,
      longitude: parseFloat(data.longitude) || 0,
      description: data.notes || null,
    };

    try {
      const editing = editingCheckpoint();
      const url = editing
        ? `${BASE_URL}/patrol/checkpoints/${editing.id}`
        : `${BASE_URL}/patrol/checkpoints`;
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (res.ok && result.status === "success") {
        setCheckpointModalOpen(false);
        setEditingCheckpoint(null);
        await fetchCheckpoints();
      } else {
        setError(result.message ?? "Gagal menyimpan checkpoint.");
      }
    } catch {
      setError("Network error saat menyimpan checkpoint.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCheckpoint = async () => {
    const id = checkpointToDelete();
    if (!id) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/patrol/checkpoints/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setConfirmDeleteOpen(false);
        setCheckpointToDelete(null);
        await fetchCheckpoints();
      } else {
        setError(result.message ?? "Gagal menghapus checkpoint.");
      }
    } catch {
      setError("Network error saat menghapus checkpoint.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirm = (id: string) => {
    setCheckpointToDelete(id);
    setConfirmDeleteOpen(true);
  };

  // ─── API: Assignments ────────────────────────────────────────────────────

  const fetchAssignments = async () => {
    try {
      const res = await fetch(`${BASE_URL}/patrol/assignments`);
      const result = await res.json();
      // Response is now PatrolAssignmentResponse — IDs are already plain strings
      if (res.ok && result.status === "success") {
        setAssignments(result.data ?? []);
      }
    } catch {
      console.error("Gagal mengambil data assignment.");
    }
  };

  const saveAssignment = async (payload: CreateAssignmentPayload) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/patrol/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setAssignmentModalOpen(false);
        await Promise.all([fetchAssignments(), fetchActiveStatus()]);
      } else {
        setError(result.message ?? "Gagal membuat assignment.");
      }
    } catch {
      setError("Network error saat membuat assignment.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateAssignmentStatus = async (id: string, newStatus: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/patrol/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchAssignments();
        await fetchActiveStatus();
      } else {
        const result = await res.json();
        setError(result.message || "Gagal memperbarui status.");
      }
    } catch {
      setError("Network error saat memperbarui status.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── API: Active Status & Employees ─────────────────────────────────────

  const fetchActiveStatus = async () => {
    try {
      const res = await fetch(`${BASE_URL}/patrol/status/active`);
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setActivePatrols(result.data ?? []);
      }
    } catch {
      console.error("Gagal mengambil status patroli aktif.");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/employees`);
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setEmployees(
          result.data.map((e: any) => ({
            id: extractId(e.id),
            nik: e.nik,
            full_name: e.full_name,
          }))
        );
      }
    } catch {
      console.error("Gagal mengambil data karyawan.");
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────────

  const openAddCheckpoint = () => {
    setEditingCheckpoint(null);
    setCheckpointModalOpen(true);
  };

  const openEditCheckpoint = (cp: Checkpoint) => {
    setEditingCheckpoint(cp);
    setCheckpointModalOpen(true);
  };

  const handleRefresh = () => {
    fetchCheckpoints();
    fetchActiveStatus();
    fetchAssignments();
  };

  const getEmployeeName = (id: string) => {
    const emp = employees().find((e) => e.id === id);
    return emp ? emp.full_name : `Karyawan ID: ${id}`;
  };

  const getEmployeeNik = (id: string) => {
    const emp = employees().find((e) => e.id === id);
    return emp ? emp.nik : "-";
  };

  // ─── Computed ─────────────────────────────────────────────────────────────

  const completedCount = () =>
    assignments().filter((a) => a.status === "completed").length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      scheduled: "bg-orange-50 text-orange-700 border-orange-200",
      in_progress: "bg-emerald-50 text-emerald-700 border-emerald-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return map[status] ?? "bg-gray-50 text-gray-600 border-gray-200";
  };

  // ─── Mount ───────────────────────────────────────────────────────────────

  onMount(() => {
    fetchCheckpoints();
    fetchEmployees();
    fetchActiveStatus();
    fetchAssignments();
  });

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div class="space-y-6">
      {/* ── Page Header ── */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">Patrol Management</h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Pantau rutinitas patroli dan kelola rute checkpoint (Manager View)
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="bg-white" onClick={handleRefresh}>
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button id="btn-tambah-assignment" onClick={() => setAssignmentModalOpen(true)}>
            <Plus class="w-5 h-5" />
            Tambah Assignment
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      <Show when={error()}>
        <div class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200">
          {error()}
        </div>
      </Show>

      {/* ── Main Grid ── */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ─ Left Column ─ */}
        <div class="lg:col-span-4 space-y-6">

          {/* Status Patroli Aktif */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Activity class="w-4 h-4 text-[var(--color-primary-button)]" />
                Status Patroli Aktif
              </h3>
              <span class="px-2 py-1 text-[10px] font-bold rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                {activePatrols().length} Aktif
              </span>
            </div>

            <Show
              when={activePatrols().length > 0}
              fallback={
                <div class="p-4 rounded-xl border border-dashed border-[var(--color-border)] text-center text-sm text-[var(--color-text-secondary)]">
                  Tidak ada patroli aktif saat ini.
                </div>
              }
            >
              <For each={activePatrols()}>
                {(patrol) => (
                  <div class="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-light-gray)]/30 space-y-2">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)]">
                        <User class="w-5 h-5" />
                      </div>
                      <div>
                        <div class="font-bold text-sm text-[var(--color-text-primary)]">
                          {getEmployeeName(patrol.employee_id)}
                        </div>
                        <div class="text-[10px] text-[var(--color-text-secondary)] uppercase">
                          NIK: {getEmployeeNik(patrol.employee_id)}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-white p-2 rounded-lg border border-[var(--color-border)]">
                      <Clock class="w-3.5 h-3.5 text-[var(--color-primary-button)]" />
                      Mulai: <span class="font-bold text-[var(--color-text-primary)]">{patrol.start_time}</span>
                      &nbsp;→ Selesai: <span class="font-bold text-[var(--color-text-primary)]">{patrol.end_time}</span>
                    </div>
                  </div>
                )}
              </For>
            </Show>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[var(--color-primary-bg)]/40 p-3 rounded-xl border border-[var(--color-border)] text-center">
                <div class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Progres</div>
                <div class="text-lg font-black text-[var(--color-primary-button)]">
                  {completedCount()}/{assignments().length}
                </div>
              </div>
              <div class="bg-[var(--color-primary-bg)]/40 p-3 rounded-xl border border-[var(--color-border)] text-center">
                <div class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Assignment</div>
                <div class="text-lg font-black text-[var(--color-primary-button)]">{assignments().length}</div>
              </div>
            </div>
          </div>

          {/* Konfigurasi Rute — "+ Tambah Checkpoint" ada di sini */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-[var(--color-text-primary)]">Konfigurasi Rute</h3>
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-light-gray)] px-2 py-1 rounded-lg uppercase tracking-wide">
                  {checkpoints().length} Titik
                </span>
                <button
                  id="btn-tambah-checkpoint"
                  onClick={openAddCheckpoint}
                  class="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-[var(--color-primary-button)] text-white hover:opacity-90 transition-all shadow-sm"
                >
                  <Plus class="w-3 h-3" />
                  Tambah
                </button>
              </div>
            </div>

            {/* Loading */}
            <Show when={isLoading() && checkpoints().length === 0}>
              <div class="py-8 text-center text-sm text-[var(--color-text-secondary)]">
                <RefreshCw class="w-5 h-5 animate-spin mx-auto mb-2" />
                Memuat checkpoint...
              </div>
            </Show>

            {/* Empty */}
            <Show when={!isLoading() && checkpoints().length === 0}>
              <div class="py-10 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                <MapPin class="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
                <p class="text-sm font-semibold text-[var(--color-text-secondary)]">Belum ada checkpoint</p>
                <p class="text-xs text-[var(--color-text-tertiary)]">Klik "Tambah" untuk menambahkan titik.</p>
              </div>
            </Show>

            {/* List */}
            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
              <For each={checkpoints()}>
                {(cp) => (
                  <div class="group flex items-center justify-between p-3 border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)] hover:bg-[var(--color-primary-bg)]/20 transition-all">
                    <div class="flex items-center gap-3">
                      <div
                        class={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                          cp.status === "Sudah dikunjungi"
                            ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                            : "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] border-[var(--color-border)]"
                        }`}
                      >
                        {cp.status === "Sudah dikunjungi" ? (
                          <CheckCircle2 class="w-5 h-5" />
                        ) : (
                          <MapPin class="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div class="font-bold text-[var(--color-text-primary)] text-sm">{cp.name}</div>
                        <div class="text-[10px] text-[var(--color-text-tertiary)] font-mono">{cp.code}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditCheckpoint(cp)}
                        class="p-1.5 rounded-lg text-[var(--color-primary-button)] hover:bg-white border border-transparent hover:border-[var(--color-border)] transition-all"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(cp.id)}
                        class="p-1.5 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* ─ Right Column ─ */}
        <div class="lg:col-span-8 flex flex-col gap-6">

          {/* Live Tracking Map */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col min-h-[360px]">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 class="font-bold text-[var(--color-text-primary)]">Live Tracking Map</h3>
              </div>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" class="text-[10px] uppercase font-bold py-1">Optimasi Rute</Button>
                <Button variant="secondary" size="sm" class="text-[10px] uppercase font-bold py-1">Fokus Petugas</Button>
              </div>
            </div>

            <div class="bg-[var(--color-light-gray)]/30 rounded-2xl border-2 border-dashed border-[var(--color-border)] flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white to-[var(--color-primary-bg)]/20">
              <div
                class="absolute inset-0 opacity-10 pointer-events-none"
                style="background-image: radial-gradient(var(--color-primary-button) 1px, transparent 1px); background-size: 24px 24px;"
              />
              <div class="mb-6 relative">
                <div class="absolute -inset-4 bg-[var(--color-primary-button)]/10 rounded-full blur-xl animate-pulse" />
                <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-[var(--color-border)] relative z-10 rotate-3">
                  <MapPin class="w-10 h-10 text-[var(--color-primary-button)]" />
                </div>
              </div>
              <h4 class="font-black text-[var(--color-text-primary)] text-xl mb-2">Visualisasi Geo-Tracking</h4>
              <p class="text-sm text-[var(--color-text-secondary)] max-w-sm leading-relaxed mb-6">
                Monitoring rute patroli secara real-time. Hubungkan API Google Maps atau Leaflet untuk menampilkan
                marker petugas dan status checkpoint secara dinamis.
              </p>
              <div class="flex gap-4">
                <div class="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                  <div class="w-3 h-3 rounded-full bg-emerald-500" /> Selesai
                </div>
                <div class="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                  <div class="w-3 h-3 rounded-full bg-[var(--color-primary-button)]" /> Selanjutnya
                </div>
                <div class="flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)]">
                  <div class="w-3 h-3 rounded-full bg-[var(--color-border)]" /> Belum
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Assignment */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
            <h3 class="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <Calendar class="w-4 h-4 text-[var(--color-primary-button)]" />
              Daftar Assignment Patroli
            </h3>
            <Show
              when={assignments().length > 0}
              fallback={
                <div class="py-10 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                  <Users class="w-8 h-8 text-[var(--color-text-tertiary)] mx-auto mb-2" />
                  <p class="text-sm text-[var(--color-text-secondary)]">Belum ada assignment.</p>
                  <p class="text-xs text-[var(--color-text-tertiary)]">Klik "Tambah Assignment" untuk membuat.</p>
                </div>
              }
            >
              <div class="space-y-3 max-h-[280px] overflow-y-auto custom-scrollbar">
                <For each={assignments()}>
                  {(a) => (
                    <div class="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-light-gray)]/20 border border-[var(--color-border)]/50 hover:border-[var(--color-border)] transition-all">
                      <div class="w-10 h-10 rounded-xl bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] flex items-center justify-center shrink-0">
                        <Users class="w-5 h-5" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-[var(--color-text-primary)] truncate">
                          {getEmployeeName(a.employee_id)}
                        </div>
                        <div class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold tracking-tighter">
                          <Clock class="w-3 h-3 inline mr-1" />
                          {a.start_time} — {a.end_time}
                          &nbsp;|&nbsp;
                          <MapPin class="w-3 h-3 inline mr-1" />
                          {Array.isArray(a.checkpoints) ? a.checkpoints.length : 0} titik
                        </div>
                      </div>
                      <div class="flex flex-col gap-1">
                        <span
                          class={`text-[10px] font-bold px-2 py-1 rounded-lg border whitespace-nowrap text-center ${statusBadge(
                            a.status
                          )}`}
                        >
                          {a.status?.replace("_", " ").toUpperCase()}
                        </span>
                        <Show when={a.status === "scheduled"}>
                          <button 
                            onClick={() => updateAssignmentStatus(a.id, "in_progress")}
                            class="text-[9px] bg-emerald-500 text-white font-bold py-0.5 px-2 rounded-md hover:bg-emerald-600 transition-colors"
                          >
                            MULAI
                          </button>
                        </Show>
                        <Show when={a.status === "in_progress"}>
                          <button 
                            onClick={() => updateAssignmentStatus(a.id, "completed")}
                            class="text-[9px] bg-blue-500 text-white font-bold py-0.5 px-2 rounded-md hover:bg-blue-600 transition-colors"
                          >
                            SELESAI
                          </button>
                        </Show>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>

      {/* ── Checkpoint Modal ── */}
      <Modal
        isOpen={checkpointModalOpen()}
        onClose={() => {
          setCheckpointModalOpen(false);
          setEditingCheckpoint(null);
        }}
        title={editingCheckpoint() ? "Edit Checkpoint" : "Tambah Checkpoint Baru"}
      >
        <CheckpointForm
          initialData={editingCheckpoint()}
          onSubmit={saveCheckpoint}
          onCancel={() => {
            setCheckpointModalOpen(false);
            setEditingCheckpoint(null);
          }}
        />
      </Modal>

      {/* ── Assignment Modal ── */}
      <Modal
        isOpen={assignmentModalOpen()}
        onClose={() => setAssignmentModalOpen(false)}
        title="Buat Assignment Patroli"
      >
        <AssignmentForm
          employees={employees()}
          checkpoints={checkpoints()}
          onSubmit={saveAssignment}
          onCancel={() => setAssignmentModalOpen(false)}
          isLoading={isSaving()}
        />
      </Modal>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={confirmDeleteOpen()}
        title="Hapus Checkpoint"
        message="Apakah Anda yakin ingin menghapus checkpoint ini? Seluruh data terkait titik ini akan dihapus permanen dan tidak dapat dibatalkan."
        onConfirm={deleteCheckpoint}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setCheckpointToDelete(null);
        }}
        variant="danger"
        isLoading={isLoading()}
      />
    </div>
  );
};

export default Patrol;
