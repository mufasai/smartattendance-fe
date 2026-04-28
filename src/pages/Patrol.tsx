import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  MapPin,
  RefreshCw,
  Edit2,
  Trash2,
  Activity,
  User,
  CheckCircle2,
  Calendar,
  Users,
  LayoutGrid,
} from "lucide-solid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import CheckpointForm, { type Checkpoint } from "../components/CheckpointForm";
import AssignmentForm, { type CreateAssignmentPayload } from "../components/AssignmentForm";
import ConfirmModal from "../components/ConfirmModal";

// Define Employee interface locally
interface Employee {
  id: string;
  nik: string;
  full_name: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Assignment {
  id: string;
  assignee_type: string;
  assignee_id: string;
  start_time: string;
  end_time: string;
  checkpoints: string[];
  status: string;
}

interface Area {
  id: string;
  name: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

interface ActivePatrol {
  id: string;
  assignee_type: string;
  assignee_id: string;
  start_time: string;
  end_time: string;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = "http://127.0.0.1:8080/api";

/** Extract string ID from SurrealDB Thing format (returns only the ID part) */
const extractId = (raw: any): string => {
  if (!raw) return "";
  const str = typeof raw === "string" ? raw : (raw?.id?.String ?? raw?.id ?? String(raw));
  if (str.includes(":")) return str.split(":")[1];
  return str;
};

// ─── Component ───────────────────────────────────────────────────────────────

const Patrol: Component = () => {
  // Data state
  const [checkpoints, setCheckpoints] = createSignal<Checkpoint[]>([]);
  const [areas, setAreas] = createSignal<Area[]>([]);
  const [groups, setGroups] = createSignal<Group[]>([]);
  const [assignments, setAssignments] = createSignal<Assignment[]>([]);
  const [activePatrols, setActivePatrols] = createSignal<ActivePatrol[]>([]);
  const [employees, setEmployees] = createSignal<Employee[]>([]);

  // UI state
  const [isLoading, setIsLoading] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Modal state
  const [configModalOpen, setConfigModalOpen] = createSignal(false);
  const [configActiveTab, setConfigActiveTab] = createSignal<"checkpoint" | "area">("checkpoint");
  const [assignmentModalOpen, setAssignmentModalOpen] = createSignal(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = createSignal(false);
  const [editingCheckpoint, setEditingCheckpoint] = createSignal<Checkpoint | null>(null);
  const [editingArea, setEditingArea] = createSignal<Area | null>(null);
  const [checkpointToDelete, setCheckpointToDelete] = createSignal<string | null>(null);
  const [areaToDelete, setAreaToDelete] = createSignal<string | null>(null);
  const [areaDeleteConfirmOpen, setAreaDeleteConfirmOpen] = createSignal(false);
  const [areaName, setAreaName] = createSignal("");

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /** Map backend checkpoint response → frontend Checkpoint type */
  const mapCheckpoint = (item: any): Checkpoint => ({
    id: extractId(item.id),
    area_id: extractId(item.area_id),
    name: item.name,
    code: item.qr_code_id,
    latitude: String(item.latitude ?? ""),
    longitude: String(item.longitude ?? ""),
    notes: item.description ?? "",
    status: "Belum dikunjungi",
  });

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

  const fetchAreas = async () => {
    try {
      const res = await fetch(`${BASE_URL}/patrol/areas`);
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setAreas(result.data.map((a: any) => ({ ...a, id: extractId(a.id) })));
      }
    } catch (err) { console.error("Gagal ambil area", err); }
  };

  const saveArea = async (data: { name: string; description: string }) => {
    setIsSaving(true);
    try {
      const editing = editingArea();
      const url = editing ? `${BASE_URL}/patrol/areas/${editing.id}` : `${BASE_URL}/patrol/areas`;
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setConfigModalOpen(false);
        setEditingArea(null);
        setAreaName("");
        await fetchAreas();
      }
    } catch (err) { console.error("Gagal simpan area", err); }
    finally { setIsSaving(false); }
  };
  const openDeleteAreaConfirm = (id: string) => {
    setAreaToDelete(id);
    setAreaDeleteConfirmOpen(true);
  };

  const confirmDeleteArea = async () => {
    const id = areaToDelete();
    if (!id) return;

    setIsLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/patrol/areas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAreaDeleteConfirmOpen(false);
        setAreaToDelete(null);
        await fetchAreas();
      }
    } catch (err) {
      console.error("Gagal hapus area", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BASE_URL}/groups`);
      const result = await res.json();
      if (res.ok && result.status === "success") {
        setGroups(result.data.map((g: any) => ({ ...g, id: extractId(g.id) })));
      }
    } catch (err) { console.error("Gagal ambil grup", err); }
  };

  const saveCheckpoint = async (data: Omit<Checkpoint, "status">) => {
    setIsSaving(true);
    setError(null);
    const payload = {
      area_id: data.area_id || null,
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
        setConfigModalOpen(false);
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
    setConfigActiveTab("checkpoint");
    setConfigModalOpen(true);
  };

  const openEditCheckpoint = (cp: Checkpoint) => {
    setEditingCheckpoint(cp);
    setConfigActiveTab("checkpoint");
    setConfigModalOpen(true);
  };

  const handleRefresh = () => {
    fetchCheckpoints();
    fetchActiveStatus();
    fetchAssignments();
  };

  const getAssigneeName = (type: string, id: string) => {
    if (!id) return "N/A";
    const cleanId = extractId(id).toLowerCase();

    if (type === "group") {
      const g = groups().find((x) => extractId(x.id).toLowerCase() === cleanId || x.name.toLowerCase() === cleanId);
      return g ? g.name : `Grup: ${extractId(id)}`;
    }

    // Try to find by ID part or by NIK just in case
    const emp = employees().find((e) => {
      const eId = extractId(e.id).toLowerCase();
      const eNik = e.nik?.toLowerCase();
      return eId === cleanId || eNik === cleanId;
    });

    return emp ? emp.full_name : (type === "group" ? `Grup: ${extractId(id)}` : `Karyawan: ${extractId(id)}`);
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

  onMount(async () => {
    await Promise.all([
      fetchCheckpoints(),
      fetchEmployees(),
      fetchActiveStatus(),
      fetchAssignments(),
      fetchAreas(),
      fetchGroups(),
    ]);
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
          <Button
            class="shadow-lg shadow-[var(--color-primary-button)]/20"
            onClick={() => setAssignmentModalOpen(true)}
          >
            <Plus class="w-4 h-4" />
            Assignment
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      <Show when={error()}>
        <div class="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-200">
          {error()}
        </div>
      </Show>

      {/* ── Live Tracking Map (Prominent) ── */}
      <div class="bg-gradient-to-br from-white to-[var(--color-secondary-bg)]/30 p-1 rounded-3xl shadow-lg border border-[var(--color-border)] mb-8">
        <div class="bg-white/60 backdrop-blur-md rounded-[calc(1.5rem-4px)] p-6 flex flex-col min-h-[480px]">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-3">
              <div class="relative">
                <div class="w-3 h-3 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 animate-ping" />
                <div class="w-3 h-3 rounded-full bg-red-500 relative" />
              </div>
              <h3 class="font-black text-xl text-[var(--color-text-primary)] tracking-tight">Geo-Patrol Dashboard</h3>
            </div>
            <div class="flex gap-3">
              <Button variant="outline" size="sm" class="text-[11px] uppercase font-black px-4 py-2 bg-white/50 border-[var(--color-border)] hover:bg-[var(--color-secondary-bg)] transition-all">
                Optimasi Rute
              </Button>
              <Button variant="primary" size="sm" class="text-[11px] uppercase font-black px-4 py-2 shadow-lg shadow-[var(--color-primary-button)]/20">
                Fokus Petugas
              </Button>
            </div>
          </div>

          <div class="bg-[var(--color-secondary-bg)]/20 rounded-2xl border-2 border-[var(--color-border)] flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center p-8">
            {/* Decorative background pattern */}
            <div
              class="absolute inset-0 opacity-[0.05] pointer-events-none"
              style="background-image: url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.826 10.531c1.007 0 1.823-.816 1.823-1.823s-.816-1.823-1.823-1.823-1.823.816-1.823 1.823.816 1.823 1.823 1.823zm-5.046 2.01c.562 0 1.017-.456 1.017-1.017s-.455-1.017-1.017-1.017-1.017.455-1.017 1.017.455 1.017 1.017 1.017zm-1.017 4.024c.562 0 1.017-.455 1.017-1.017s-.455-1.017-1.017-1.017-1.017.455-1.017 1.017.455 1.017 1.017 1.017zm-2.035 2.01c.562 0 1.017-.455 1.017-1.017s-.455-1.017-1.017-1.017-1.017.455-1.017 1.017.455 1.017 1.017 1.017z\' fill=\'%237286d3\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E');"
            />

            <div class="relative group cursor-pointer">
              <div class="absolute -inset-8 bg-[var(--color-accent)]/20 rounded-full blur-3xl group-hover:bg-[var(--color-accent)]/30 transition-all duration-500" />
              <div class="w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-2xl border border-[var(--color-border)] relative z-10 rotate-2 group-hover:rotate-0 transition-transform duration-500">
                <MapPin class="w-16 h-16 text-[var(--color-primary-button)]" />
              </div>
            </div>

            <h4 class="font-black text-[var(--color-text-primary)] text-3xl mb-3 mt-8">Monitoring Real-Time</h4>
            <p class="text-base text-[var(--color-text-secondary)] max-w-xl leading-relaxed mb-8">
              Sistem visualisasi patroli aktif. Hubungkan kunci API <span class="font-bold text-[var(--color-primary-button)]">Google Maps</span> atau integrasikan <span class="font-bold text-[var(--color-primary-button)]">Leaflet.js</span> untuk melacak pergerakan petugas dan status titik koordinat secara langsung.
            </p>

            <div class="flex flex-wrap justify-center gap-8 bg-white/50 px-8 py-4 rounded-2xl border border-[var(--color-border)] shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30" />
                <span class="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-wider">Selesai</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full bg-[var(--color-primary-button)] shadow-lg shadow-[var(--color-primary-button)]/30" />
                <span class="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-wider">Berjalan</span>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-4 h-4 rounded-full bg-[var(--color-text-tertiary)]" />
                <span class="text-xs font-black text-[var(--color-text-primary)] uppercase tracking-wider">Menunggu</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ── 3-Column Integrated Content Grid ── */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── COL 1: Summaries (Span 3) ── */}
        <div class="lg:col-span-3 flex flex-col gap-6">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)]">
                <Activity class="w-5 h-5" />
              </div>
              <h4 class="font-black text-sm text-[var(--color-text-primary)] uppercase tracking-tight">Aktif</h4>
            </div>
            <div class="text-4xl font-black text-[var(--color-primary-button)] mb-1">{activePatrols().length}</div>
            <div class="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase">Petugas di Lapangan</div>
          </div>

          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <CheckCircle2 class="w-5 h-5" />
              </div>
              <h4 class="font-black text-sm text-[var(--color-text-primary)] uppercase tracking-tight">Progres</h4>
            </div>
            <div class="text-4xl font-black text-blue-600 mb-1">{completedCount()} / {assignments().length}</div>
            <div class="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase">Tugas Selesai</div>
          </div>

          <Show when={activePatrols().length > 0}>
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-[var(--color-border)] bg-gradient-to-b from-white to-[var(--color-secondary-bg)]/20">
              <h4 class="font-black text-xs text-[var(--color-text-primary)] uppercase mb-4 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live List
              </h4>
              <div class="space-y-3">
                <For each={activePatrols()}>
                  {(patrol) => (
                    <div class="p-3 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)]">
                        <Show when={patrol.assignee_type === "group"} fallback={<User class="w-4 h-4" />}>
                          <Users class="w-4 h-4" />
                        </Show>
                      </div>
                      <div class="min-w-0">
                        <div class="text-xs font-black truncate">{getAssigneeName(patrol.assignee_type, patrol.assignee_id)}</div>
                        <div class="text-[9px] text-[var(--color-text-secondary)] uppercase">{patrol.start_time}</div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </Show>
        </div>

        {/* ── COL 2: Route Config (Span 4) ── */}
        <div class="lg:col-span-4">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full">
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center gap-2">
                <h3 class="font-black text-[var(--color-text-primary)] flex items-center gap-2">
                  <MapPin class="w-5 h-5 text-[var(--color-primary-button)]" />
                  Konfigurasi Rute
                </h3>
                <span class="text-[10px] font-black text-[var(--color-primary-button)] bg-[var(--color-secondary-bg)]/50 px-2.5 py-1 rounded-full uppercase tracking-tighter">
                  {checkpoints().length} Titik
                </span>
              </div>
              <button
                onClick={openAddCheckpoint}
                class="w-8 h-8 rounded-xl bg-[var(--color-primary-button)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary-button)]/30 hover:scale-105 transition-transform"
              >
                <Plus class="w-5 h-5" />
              </button>
            </div>

            <div class="space-y-6 overflow-y-auto pr-1 custom-scrollbar max-h-[480px]">
              <For each={areas()}>
                {(area) => {
                  const areaCps = () => checkpoints().filter((c) => c.area_id === area.id);
                  return (
                    <div class="space-y-3">
                      <h4 class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                        <div class="w-4 h-[1px] bg-[var(--color-border)]" />
                        {area.name}
                        <div class="flex-1 h-[1px] bg-[var(--color-border)]" />
                      </h4>
                      <For each={areaCps()}>
                        {(cp) => (
                          <div class="group flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-secondary-bg)]/20 transition-all bg-white">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary-button)] shadow-sm">
                                <MapPin class="w-5 h-5" />
                              </div>
                              <div>
                                <div class="font-bold text-xs">{cp.name}</div>
                                <div class="text-[9px] text-[var(--color-text-tertiary)]">{cp.code}</div>
                              </div>
                            </div>
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditCheckpoint(cp)} class="p-1.5 text-[var(--color-primary-button)]"><Edit2 class="w-3.5 h-3.5" /></button>
                              <button onClick={() => openDeleteConfirm(cp.id)} class="p-1.5 text-red-500"><Trash2 class="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        )}
                      </For>
                      <Show when={areaCps().length === 0}>
                        <div class="text-[10px] text-center text-gray-400 italic py-2">Belum ada titik di area ini</div>
                      </Show>
                    </div>
                  );
                }}
              </For>

              {/* Un-grouped checkpoints */}
              <Show when={checkpoints().filter(c => !c.area_id || c.area_id === "").length > 0}>
                <div class="space-y-3">
                  <h4 class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] px-2">Lainnya</h4>
                  <For each={checkpoints().filter(c => !c.area_id || c.area_id === "")}>
                    {(cp) => (
                      <div class="group flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] hover:bg-[var(--color-secondary-bg)]/20 transition-all bg-white">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary-button)] shadow-sm">
                            <MapPin class="w-5 h-5" />
                          </div>
                          <div>
                            <div class="font-bold text-xs">{cp.name}</div>
                            <div class="text-[9px] text-[var(--color-text-tertiary)]">{cp.code}</div>
                          </div>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditCheckpoint(cp)} class="p-1.5 text-[var(--color-primary-button)]"><Edit2 class="w-3.5 h-3.5" /></button>
                          <button onClick={() => openDeleteConfirm(cp.id)} class="p-1.5 text-red-500"><Trash2 class="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </div>
        </div>

        {/* ── COL 3: Assignments (Span 5) ── */}
        <div class="lg:col-span-5 flex flex-col gap-6">
          {/* Active Assignments */}
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] flex-1 flex flex-col">
            <h3 class="font-black text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
              <Calendar class="w-5 h-5 text-[var(--color-accent)]" />
              Jadwal Patroli
            </h3>
            <Show when={assignments().filter(a => a.status !== "completed").length === 0}>
              <div class="py-8 text-center bg-[var(--color-primary-bg)]/50 rounded-2xl border border-dashed border-[var(--color-border)]">
                <p class="text-xs font-bold text-[var(--color-text-tertiary)] uppercase">Tidak ada jadwal aktif</p>
              </div>
            </Show>
            <div class="space-y-4 overflow-y-auto custom-scrollbar max-h-[320px]">
              <For each={assignments().filter(a => a.status !== "completed")}>
                {(a) => (
                  <div class="p-4 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm hover:shadow-md transition-all">
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)]">
                          <Show when={a.assignee_type === "group"} fallback={<Users class="w-5 h-5" />}>
                            <LayoutGrid class="w-5 h-5" />
                          </Show>
                        </div>
                        <div>
                          <div class="font-black text-sm">{getAssigneeName(a.assignee_type, a.assignee_id)}</div>
                          <div class="text-[10px] text-[var(--color-text-secondary)] font-bold">{a.start_time} — {a.end_time}</div>
                        </div>
                      </div>
                      <span class={`text-[9px] font-black px-3 py-1 rounded-full border ${statusBadge(a.status)} uppercase tracking-widest`}>
                        {a.status?.replace("_", " ")}
                      </span>
                    </div>
                    <div class="flex gap-2">
                      <Show when={a.status === "scheduled"}>
                        <button onClick={() => updateAssignmentStatus(a.id, "in_progress")} class="flex-1 text-[10px] bg-emerald-500 text-white font-black py-2 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600">MULAI</button>
                      </Show>
                      <Show when={a.status === "in_progress"}>
                        <button onClick={() => updateAssignmentStatus(a.id, "completed")} class="flex-1 text-[10px] bg-[var(--color-primary-button)] text-white font-black py-2 rounded-xl shadow-lg shadow-[var(--color-primary-button)]/20">SELESAI</button>
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* History */}
          <div class="bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-[var(--color-border)] flex-1 flex flex-col">
            <h3 class="font-black text-xs text-[var(--color-text-tertiary)] mb-4 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 class="w-4 h-4" />
              History Selesai
            </h3>
            <div class="space-y-2 max-h-[170px] overflow-y-auto custom-scrollbar">
              <Show when={assignments().filter(a => a.status === "completed").length === 0}>
                <div class="py-10 text-center border border-dashed border-[var(--color-border)] rounded-2xl bg-white/20">
                  <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Belum ada riwayat patroli</p>
                </div>
              </Show>
              <For each={assignments().filter(a => a.status === "completed")}>
                {(a) => (
                  <div class="p-3 rounded-2xl bg-white/40 border border-[var(--color-border)] flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 class="w-4 h-4" /></div>
                      <div class="text-xs font-bold truncate max-w-[120px]">{getAssigneeName(a.assignee_type, a.assignee_id)}</div>
                    </div>
                    <div class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">DONE</div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>
      </div>

      {/* ── Configuration Modal (Tabbed) ── */}
      <Modal
        isOpen={configModalOpen()}
        onClose={() => {
          setConfigModalOpen(false);
          setEditingCheckpoint(null);
          setEditingArea(null);
          setAreaName("");
        }}
        title="Konfigurasi Patroli Terpadu"
      >
        <div class="space-y-6">
          {/* Tab Switcher (Pill Style) */}
          <div class="flex p-1 bg-[var(--color-light-gray)] rounded-2xl border border-[var(--color-border)]">
            <button
              onClick={() => setConfigActiveTab("checkpoint")}
              class={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${configActiveTab() === "checkpoint"
                ? "bg-white text-[var(--color-primary-button)] shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
            >
              Titik Rute
            </button>
            <button
              onClick={() => setConfigActiveTab("area")}
              class={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${configActiveTab() === "area"
                ? "bg-white text-[var(--color-primary-button)] shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
            >
              Area Grouping
            </button>
          </div>

          <div class="min-h-[400px]">
            <Show when={configActiveTab() === "checkpoint"}>
              <div class="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <CheckpointForm
                  initialData={editingCheckpoint()}
                  areas={areas()}
                  onSubmit={saveCheckpoint}
                  onCancel={() => {
                    setConfigModalOpen(false);
                    setEditingCheckpoint(null);
                  }}
                />
              </div>
            </Show>

            <Show when={configActiveTab() === "area"}>
              <div class="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                <div class="bg-gradient-to-br from-[var(--color-secondary-bg)]/50 to-white p-6 rounded-3xl border border-[var(--color-border)] shadow-inner">
                  <h4 class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-4">Daftar Area Aktif</h4>
                  <div class="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    <Show when={areas().length === 0}>
                      <div class="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                        <p class="text-xs font-bold text-gray-400 italic">Belum ada area terdaftar</p>
                      </div>
                    </Show>
                    <For each={areas()}>
                      {(a) => (
                        <div class="group flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] bg-white/80 backdrop-blur-sm hover:border-[var(--color-accent)] transition-all shadow-sm">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-accent)]">
                              <LayoutGrid class="w-4 h-4" />
                            </div>
                            <span class="text-sm font-black text-[var(--color-text-primary)]">{a.name}</span>
                          </div>
                          <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { setEditingArea(a); setAreaName(a.name); }}
                              class="p-2 text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] rounded-xl transition-colors"
                            >
                              <Edit2 class="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteAreaConfirm(a.id)}
                              class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 class="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>

                <div class="p-6 rounded-3xl bg-white border-2 border-[var(--color-accent)]/10 shadow-xl shadow-[var(--color-accent)]/5 space-y-4">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-black text-[var(--color-accent)] uppercase tracking-widest">
                      {editingArea() ? "Mode Edit Area" : "Registrasi Area Baru"}
                    </h4>
                    <Show when={editingArea()}>
                      <button onClick={() => { setEditingArea(null); setAreaName(""); }} class="text-[10px] font-bold text-gray-400 hover:text-red-500 uppercase">Batal</button>
                    </Show>
                  </div>

                  <div class="relative">
                    <input
                      type="text"
                      placeholder="Nama Area (Contoh: Area Warehouse)"
                      class="w-full px-5 py-3 bg-[var(--color-secondary-bg)]/30 border-2 border-transparent focus:border-[var(--color-accent)] focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                      value={areaName()}
                      onInput={(e) => setAreaName(e.currentTarget.value)}
                    />
                    <div class="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                      <LayoutGrid class="w-4 h-4" />
                    </div>
                  </div>

                  <Button
                    class="w-full py-4 rounded-2xl shadow-lg shadow-[var(--color-accent)]/20 font-black uppercase text-xs tracking-widest"
                    onClick={() => {
                      if (areaName()) saveArea({ name: areaName(), description: "" });
                    }}
                    loading={isSaving()}
                  >
                    {editingArea() ? "Perbarui Area" : "Simpan Area"}
                  </Button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      </Modal>

      {/* ── Assignment Modal ── */}
      <Modal
        isOpen={assignmentModalOpen()}
        onClose={() => setAssignmentModalOpen(false)}
        title="Buat Assignment Patroli"
      >
        <AssignmentForm
          employees={employees()}
          groups={groups()}
          checkpoints={checkpoints()}
          onSubmit={saveAssignment}
          onCancel={() => setAssignmentModalOpen(false)}
          isLoading={isSaving()}
        />
      </Modal>

      {/* ── Confirm Delete Checkpoint ── */}
      <ConfirmModal
        isOpen={confirmDeleteOpen()}
        title="Hapus Checkpoint"
        message="Apakah Anda yakin ingin menghapus checkpoint ini? Seluruh data terkait titik ini akan dihapus permanen."
        onConfirm={deleteCheckpoint}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setCheckpointToDelete(null);
        }}
        variant="danger"
        isLoading={isLoading()}
      />

      {/* ── Confirm Delete Area ── */}
      <ConfirmModal
        isOpen={areaDeleteConfirmOpen()}
        title="Hapus Area Patroli"
        message="Apakah Anda yakin ingin menghapus area ini? Titik rute di dalamnya tetap ada namun tidak lagi dikelompokkan."
        onConfirm={confirmDeleteArea}
        onCancel={() => {
          setAreaDeleteConfirmOpen(false);
          setAreaToDelete(null);
        }}
        variant="danger"
        isLoading={isLoading()}
      />
    </div>
  );
};

export default Patrol;
