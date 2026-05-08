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
  AlertTriangle,
  ShieldAlert,
  Camera,
  Clock,
} from "lucide-solid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import CheckpointForm, { type Checkpoint } from "../components/CheckpointForm";
import AssignmentForm, { type CreateAssignmentPayload } from "../components/AssignmentForm";
import ConfirmModal from "../components/ConfirmModal";
import { config } from "../config/env";
import { toast } from "solid-toast";
import { patrolService } from "../services/patrolService";
import { ApiError, apiClient } from "../utils/apiClient";
// ─── Types ───────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  nik: string;
  full_name: string;
}

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
  assignee_name?: string;
  start_time: string;
  end_time: string;
  status: string;
  progress: number;
  checkpoint_details?: Array<{
    id: string;
    name: string;
    qr_code_id: string;
    status: "pending" | "visited";
    scanned_at?: string;
  }>;
  area_id?: string;
  area_name?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = `${config.apiUrl}`;
const STATIC_URL = BASE_URL.replace('/api', ''); // Remove /api for static files

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
      const data = await patrolService.getCheckpoints();
      setCheckpoints(data.map(mapCheckpoint));
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Koneksi ke backend gagal. Pastikan server berjalan.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const data = await patrolService.getAreas();
      setAreas(data.map((a: any) => ({ ...a, id: extractId(a.id) })));
    } catch (err) {
      console.error("Gagal ambil area", err);
    }
  };

  const saveArea = async (data: { name: string; description: string }) => {
    setIsSaving(true);
    try {
      const editing = editingArea();
      if (editing) {
        await patrolService.updateArea(editing.id, data);
      } else {
        await patrolService.createArea(data);
      }
      setConfigModalOpen(false);
      setEditingArea(null);
      setAreaName("");
      await fetchAreas();
    } catch (err) {
      console.error("Gagal simpan area", err);
    } finally {
      setIsSaving(false);
    }
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
      await patrolService.deleteArea(id);
      setAreaDeleteConfirmOpen(false);
      setAreaToDelete(null);
      await fetchAreas();
    } catch (err) {
      console.error("Gagal hapus area", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const data = await apiClient.get("/groups") as any;
      if (data.status === "success") {
        setGroups(data.data.map((g: any) => ({ ...g, id: extractId(g.id) })));
      }
    } catch (err) {
      console.error("Gagal ambil grup", err);
    }
  };

  const saveCheckpoint = async (data: Omit<Checkpoint, "status">) => {
    setIsSaving(true);
    setError(null);

    try {
      const editing = editingCheckpoint();
      if (editing) {
        // Update checkpoint - all fields optional
        const updatePayload: {
          name?: string;
          latitude?: number;
          longitude?: number;
          area_id?: string;
        } = {
          name: data.name,
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
        };
        if (data.area_id) {
          updatePayload.area_id = data.area_id;
        }
        await patrolService.updateCheckpoint(editing.id, updatePayload);
      } else {
        // Create checkpoint - area_id is required
        const createPayload = {
          name: data.name,
          latitude: parseFloat(data.latitude) || 0,
          longitude: parseFloat(data.longitude) || 0,
          area_id: data.area_id || "", // Provide default empty string if not set
        };
        await patrolService.createCheckpoint(createPayload);
      }
      setConfigModalOpen(false);
      setEditingCheckpoint(null);
      await fetchCheckpoints();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error saat menyimpan checkpoint.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCheckpoint = async () => {
    const id = checkpointToDelete();
    if (!id) return;

    setIsLoading(true);
    try {
      await patrolService.deleteCheckpoint(id);
      setConfirmDeleteOpen(false);
      setCheckpointToDelete(null);
      await fetchCheckpoints();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error saat menghapus checkpoint.");
      }
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
      // Note: The patrol service returns PatrolAssignment which has a different structure
      // This endpoint might need to be updated or we need a different endpoint
      // For now, cast to any to avoid type errors
      const data = await apiClient.get("/patrol/assignments") as any;
      if (data && Array.isArray(data)) {
        setAssignments(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setAssignments(data.data);
      }
    } catch {
      console.error("Gagal mengambil data assignment.");
    }
  };

  const saveAssignment = async (payload: CreateAssignmentPayload) => {
    setIsSaving(true);
    setError(null);
    try {
      // Note: CreateAssignmentPayload might not match the API expectations
      // Cast to any for now
      await apiClient.post("/patrol/assignments", payload as any);
      setAssignmentModalOpen(false);
      await Promise.all([fetchAssignments(), fetchActiveStatus()]);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error saat membuat assignment.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateAssignmentStatus = async (id: string, newStatus: string) => {
    setIsLoading(true);
    try {
      await apiClient.put(`/patrol/assignments/${id}`, { status: newStatus } as any);
      await fetchAssignments();
      await fetchActiveStatus();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Network error saat memperbarui status.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── API: Active Status & Employees ─────────────────────────────────────

  const fetchActiveStatus = async () => {
    await fetchActivePatrols();
  };

  const fetchEmployees = async () => {
    try {
      const data = await apiClient.get("/employees") as any;
      if (data.status === "success") {
        setEmployees(
          data.data.map((e: any) => ({
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

  const getAssigneeName = (type: string, id: string, assigneeName?: string) => {
    // If assignee_name is provided from backend, use it directly
    if (assigneeName) return assigneeName;

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

  const [reportModalOpen, setReportModalOpen] = createSignal(false);
  const [incidents, setIncidents] = createSignal<any[]>([]);
  const [checkpointReports, setCheckpointReports] = createSignal<any[]>([]);
  const [newIncident, setNewIncident] = createSignal({
    title: "",
    description: "",
    location: "",
    time: "",
    photo: null as File | null,
    photoPreview: ""
  });
  const [selectedIncidentPhoto, setSelectedIncidentPhoto] = createSignal<string | null>(null);
  const [selectedReportPhoto, setSelectedReportPhoto] = createSignal<string | null>(null);

  const handleFileChange = (e: Event) => {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewIncident(prev => ({
          ...prev,
          photo: file,
          photoPreview: ev.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch Incidents
  const fetchIncidents = async () => {
    try {
      const data = await patrolService.getIncidents();
      setIncidents(data || []);
    } catch (e) {
      console.error("Error fetching incidents:", e);
    }
  };

  // Fetch Checkpoint Reports
  const fetchCheckpointReports = async () => {
    try {
      const data = await patrolService.getCheckpointReports();
      setCheckpointReports(data || []);
    } catch (e) {
      console.error("Error fetching checkpoint reports:", e);
    }
  };

  const submitIncident = async () => {
    if (!newIncident().title || !newIncident().description) {
      toast.error("Judul dan Deskripsi wajib diisi");
      return;
    }

    setIsLoading(true);
    try {
      const body = {
        nik: "ADMIN",
        title: newIncident().title,
        description: newIncident().description,
        location: newIncident().location || "Admin Office",
        time: newIncident().time || new Date().toISOString(),
        photo_url: ""
      };

      await apiClient.post("/patrol/incident", body);
      toast.success("Insiden berhasil dilaporkan");
      setReportModalOpen(false);
      setNewIncident({ title: "", description: "", location: "", time: "", photo: null, photoPreview: "" });
      fetchIncidents();
    } catch (e) {
      toast.error("Gagal melaporkan insiden");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivePatrols = async () => {
    try {
      const data = await apiClient.get("/patrol/status/active") as any;
      if (data && Array.isArray(data)) {
        setActivePatrols(data);
      } else if (data?.data && Array.isArray(data.data)) {
        setActivePatrols(data.data);
      }
    } catch {
      console.error("Gagal mengambil status patroli aktif.");
    }
  };

  onMount(async () => {
    await Promise.all([
      fetchEmployees(),
      fetchGroups(),
      fetchCheckpoints(),
      fetchAreas(),
      fetchAssignments(),
      fetchActivePatrols(),
      fetchIncidents(),
      fetchCheckpointReports()
    ]);

    const interval = setInterval(() => {
      fetchActivePatrols();
      fetchIncidents();
      fetchCheckpointReports();
    }, 10000);
    return () => clearInterval(interval);
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

      {/* ── Live Tracking Dashboard ── */}
      <div class="relative bg-gradient-to-br from-white to-[var(--color-secondary-bg)]/30 p-1 rounded-3xl shadow-lg border border-[var(--color-border)] h-full mb-8 overflow-hidden">
        <div class="bg-white/60 backdrop-blur-md rounded-[calc(1.5rem-4px)] flex flex-col h-[680px] overflow-hidden">

          {/* ── Header ── */}
          <div class="flex justify-between items-center px-6 pt-5 pb-4 border-b border-[var(--color-border)]">
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100 shadow-inner">
                  <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                </div>
                <div>
                  <h3 class="text-lg font-black text-[var(--color-text-primary)] leading-none tracking-tight">Geo-Patrol Live Monitor</h3>
                  <p class="text-[9px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mt-1">Real-time Field Surveillance</p>
                </div>
              </div>

              {/* ── Integrated Stats Pills ── */}
              <div class="flex items-center gap-4 border-l border-[var(--color-border)] pl-8">
                <div class="flex items-center gap-4 px-6 py-3 bg-white/50 rounded-[24px] border border-[var(--color-border)] h-full shadow-sm hover:border-[var(--color-accent)] transition-all">
                  <div class="w-10 h-10 rounded-xl bg-[var(--color-secondary-bg)]/80 flex items-center justify-center">
                    <Activity class="w-6 h-6 text-[var(--color-primary-button)]" />
                  </div>
                  <div>
                    <div class="text-xl font-black text-[var(--color-text-primary)] leading-none">
                      {assignments().filter(a => a.status === "in_progress").length}
                    </div>
                    <div class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mt-1.5">Officers On-Site</div>
                  </div>
                </div>

                <div class="flex items-center gap-4 px-6 py-3 bg-white/50 rounded-[24px] border border-[var(--color-border)] h-full shadow-sm hover:border-[var(--color-accent)] transition-all">
                  <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 class="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <div class="text-xl font-black text-[var(--color-text-primary)] leading-none">
                      {assignments().filter(a => a.status === "completed").length} <span class="text-gray-300 font-normal mx-0.5">/</span> {assignments().length}
                    </div>
                    <div class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest mt-1.5">Patrols Done</div>
                  </div>
                </div>
              </div>
            </div>

            <Show when={assignments().filter(a => a.status === "in_progress").length > 0}>
              <div class="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full shadow-sm transition-all">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span class="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                  System Online
                </span>
              </div>
            </Show>
          </div>

          {/* ── Body: 3-Column Command Center ── */}
          <div class="relative flex-1 flex overflow-hidden">

            {/* ── LEFT PANEL: Live Tracking List ── */}
            <div class="w-72 flex-shrink-0 border-r border-[var(--color-border)] flex flex-col bg-white/40 backdrop-blur-sm">
              <div class="px-5 py-4 border-b border-[var(--color-border)] bg-white/50">
                <div class="flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span class="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">On Duty Units</span>
                </div>
              </div>
              <div class="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/20">
                <Show when={assignments().filter(a => a.status === "in_progress").length === 0}>
                  <div class="py-10 text-center">
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">No active patrols</p>
                  </div>
                </Show>
                <For each={assignments().filter(a => a.status === "in_progress")}>
                  {(a) => {
                    const patrol = () => activePatrols().find(p =>
                      extractId(a.assignee_id).toLowerCase() === extractId(p.assignee_id).toLowerCase()
                    );
                    const pct = () => {
                      const p = patrol();
                      if (!p) return 0;
                      const visited = p.checkpoint_details?.filter(c => c.status === "visited").length ?? 0;
                      const total = p.checkpoint_details?.length ?? 0;
                      return total > 0 ? Math.round((visited / total) * 100) : 0;
                    };

                    return (
                      <div class="group flex flex-col gap-2 p-3.5 rounded-2xl border border-[var(--color-border)] h-full bg-white hover:border-[var(--color-accent)] hover:shadow-lg transition-all cursor-default">
                        <div class="flex items-center gap-3">
                          <div class="relative flex-shrink-0">
                            <div class="w-10 h-10 rounded-xl bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)] border border-white shadow-sm">
                              <Show when={a.assignee_type === "group"} fallback={<User class="w-5 h-5" />}>
                                <Users class="w-5 h-5" />
                              </Show>
                            </div>
                            <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                          </div>
                          <div class="min-w-0 flex-1">
                            <div class="text-[11px] font-black text-[var(--color-text-primary)] truncate leading-tight group-hover:text-[var(--color-primary-button)] transition-colors">
                              {getAssigneeName(a.assignee_type, a.assignee_id)}
                            </div>
                            <div class="flex items-center gap-1.5 mt-1">
                              <span class="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-tight">{pct()}% Progres</span>
                            </div>
                          </div>
                        </div>
                        <div class="h-1 w-full bg-[var(--color-secondary-bg)]/80 rounded-full overflow-hidden mt-1">
                          <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000" style={`width: ${pct()}%`} />
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            {/* ── CENTER PANEL: Surveillance Map Area ── */}
            <div class="flex-1 relative flex flex-col bg-white">
              {/* Background Grid Pattern */}
              <div class="absolute inset-0 opacity-[0.05]"
                style="background-image: radial-gradient(#6366f1 1px, transparent 1px); background-size: 24px 24px;" />

              <Show when={assignments().filter(a => a.status === "in_progress").length === 0}>
                <div class="flex-1 flex flex-col items-center justify-center text-center p-8 z-10">
                  <div class="w-16 h-16 rounded-3xl bg-white border border-[var(--color-border)] h-full flex items-center justify-center mb-5 shadow-sm text-gray-300">
                    <MapPin class="w-8 h-8" />
                  </div>
                  <h4 class="font-black text-[var(--color-text-primary)] text-xl mb-2 tracking-tight">System Ready</h4>
                  <p class="text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">Belum ada patroli aktif yang terpantau dalam jangkauan radar saat ini.</p>
                </div>
              </Show>

              <Show when={assignments().filter(a => a.status === "in_progress").length > 0}>
                <div class="flex-1 relative overflow-hidden flex items-center justify-center z-10">
                  {/* Technical Radar & Grid */}
                  <div class="absolute w-[600px] h-[600px] rounded-full border border-indigo-500/5 animate-[spin_12s_linear_infinite]"
                    style="background: conic-gradient(from 0deg, transparent 0%, rgba(99, 102, 241, 0.03) 100%);"></div>

                  {/* Corner HUD */}
                  <div class="absolute top-6 left-6 flex flex-col gap-1.5 opacity-30 z-20">
                    <div class="text-[7px] font-black text-indigo-900 uppercase tracking-widest">Feed: ENC_V3.8</div>
                    <div class="text-[7px] font-black text-indigo-900 uppercase tracking-widest">Signal: Stable</div>
                  </div>

                  <div class="absolute top-6 right-6 opacity-30 z-20">
                    <div class="text-[7px] font-black text-indigo-900 uppercase tracking-widest text-right">Coords: 7.69S / 109.25E</div>
                  </div>

                  {/* Surveillance Capsule (Stadium Shape) */}
                  <div class="w-60 h-[420px] rounded-[110px] border-2 border-slate-100 relative bg-white/40 backdrop-blur-sm shadow-2xl flex flex-col items-center py-10">
                    <div class="absolute top-12 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Sector Alpha</div>
                    <div class="absolute bottom-12 text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Sector Bravo</div>
                    <div class="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-100 -translate-y-1/2"></div>

                    {/* Center Status Indicator */}
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm z-10 flex items-center gap-2">
                      <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span class="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Surveillance Zone</span>
                    </div>
                  </div>

                  <For each={assignments().filter(a => a.status === "in_progress")}>
                    {(a, idx) => {
                      const col = idx() % 3;
                      const row = Math.floor(idx() / 3) % 3;
                      return (
                        <div class="absolute flex flex-col items-center transition-all duration-1000 ease-in-out z-20" style={`top: ${25 + row * 25}%; left: ${20 + col * 30}%;`}>
                          <div class="relative group">
                            <span class="absolute inline-flex h-8 w-8 -inset-2 rounded-full bg-[var(--color-primary-button)] opacity-20 animate-ping" />
                            <div class="relative w-4 h-4 rounded-full bg-[var(--color-primary-button)] border-2 border-white shadow-2xl" />
                            <div class="absolute top-6 left-1/2 -translate-x-1/2 bg-[var(--color-primary-button)] text-white text-[8px] font-black px-2 py-0.5 rounded shadow-xl whitespace-nowrap uppercase tracking-tighter">
                              {getAssigneeName(a.assignee_type, a.assignee_id).split(" ")[0]}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  </For>
                </div>
              </Show>
            </div>

            {/* ── RIGHT PANEL: Detailed Progress ── */}
            <div class="w-[440px] flex-shrink-0 border-l border-[var(--color-border)] flex flex-col bg-white/40 backdrop-blur-sm">
              <div class="px-6 py-4 border-b border-[var(--color-border)] bg-white/50 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Activity class="w-4 h-4 text-[var(--color-primary-button)]" />
                  <span class="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">Checkpoint Analytics</span>
                </div>
                <div class="flex gap-3 text-[8px] font-black uppercase tracking-tighter text-[var(--color-text-tertiary)]">
                  <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Done</div>
                  <div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full bg-slate-300" /> Pending</div>
                </div>
              </div>

              <div class="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/10">
                <Show when={assignments().filter(a => a.status === "in_progress").length === 0}>
                  <div class="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <Activity class="w-10 h-10 mb-3 text-gray-400" />
                    <p class="text-[10px] font-black uppercase tracking-widest leading-loose">Waiting for<br />Deployment Data</p>
                  </div>
                </Show>
                <For each={assignments().filter(a => a.status === "in_progress")}>
                  {(a) => {
                    const patrol = () => activePatrols().find(p =>
                      extractId(a.assignee_id).toLowerCase() === extractId(p.assignee_id).toLowerCase()
                    );
                    const visited = () => patrol()?.checkpoint_details?.filter(c => c.status === "visited").length ?? 0;
                    const total = () => patrol()?.checkpoint_details?.length ?? 0;
                    const pct = () => total() > 0 ? Math.round((visited() / total()) * 100) : 0;

                    const nextCp = () => patrol()?.checkpoint_details?.find(c => c.status === "pending");
                    const lastCp = () => {
                      const visitedArr = patrol()?.checkpoint_details?.filter(c => c.status === "visited") ?? [];
                      return visitedArr.length > 0 ? visitedArr[visitedArr.length - 1] : null;
                    };

                    return (
                      <div class="bg-white border border-[var(--color-border)] h-full rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                        <div class="flex items-center justify-between">
                          <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-2xl bg-[var(--color-secondary-bg)]/50 flex items-center justify-center text-[var(--color-primary-button)] border border-white">
                              <Show when={a.assignee_type === "group"} fallback={<User class="w-5 h-5" />}>
                                <Users class="w-5 h-5" />
                              </Show>
                            </div>
                            <div>
                              <div class="font-black text-xs text-[var(--color-text-primary)] truncate max-w-[160px]">
                                {getAssigneeName(a.assignee_type, a.assignee_id)}
                              </div>
                              <div class="text-[9px] text-[var(--color-text-tertiary)] font-bold uppercase tracking-tight mt-0.5">
                                {pct() === 100 ? "Task Completed" : "Operational Status: Active"}
                              </div>
                            </div>
                          </div>
                          <div class="text-right">
                            <div class="text-xs font-black text-[var(--color-primary-button)]">{pct()}%</div>
                            <div class="text-[8px] font-bold text-[var(--color-text-secondary)] uppercase tracking-tighter">{visited()}/{total()} PT</div>
                          </div>
                        </div>

                        <div class="h-2.5 w-full bg-[var(--color-secondary-bg)]/50 rounded-full overflow-hidden">
                          <div class="h-full bg-gradient-to-r from-[var(--color-primary-button)] to-indigo-400 rounded-full transition-all duration-1000 shadow-sm" style={`width: ${pct()}%`} />
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                          <div class="bg-slate-50 p-2.5 rounded-2xl border border-[var(--color-border)] h-full/50">
                            <div class="text-[8px] font-black text-[var(--color-text-tertiary)] uppercase mb-1">Previous</div>
                            <div class="text-[9px] font-bold text-[var(--color-text-primary)] truncate">
                              {lastCp()?.name || "-"}
                            </div>
                          </div>
                          <div class={`p-2.5 rounded-2xl border transition-all ${nextCp() ? "bg-indigo-50 border-indigo-100 shadow-sm" : "bg-emerald-50 border-emerald-100"}`}>
                            <div class="text-[8px] font-black text-[var(--color-text-tertiary)] uppercase mb-1">
                              {nextCp() ? "Next Target" : "Complete"}
                            </div>
                            <div class={`text-[9px] font-bold truncate ${nextCp() ? "text-indigo-600" : "text-emerald-600"}`}>
                              {nextCp()?.name || "All Visited"}
                            </div>
                          </div>
                        </div>

                        <div class="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border)]/40 mt-1">
                          <For each={patrol()?.checkpoint_details ?? []}>
                            {(cp) => {
                              const isNext = () => nextCp()?.id === cp.id;
                              return (
                                <div class={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[9px] font-bold border transition-all ${cp.status === "visited"
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                  : isNext()
                                    ? "bg-white border-indigo-400 text-indigo-700 shadow-md ring-2 ring-indigo-400/10"
                                    : "bg-white border-[var(--color-border)] text-[var(--color-text-tertiary)]"
                                  }`}>
                                  <div class={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cp.status === "visited"
                                    ? "bg-emerald-500"
                                    : isNext()
                                      ? "bg-indigo-500 animate-pulse"
                                      : "bg-slate-300"
                                    }`} />
                                  <span class="truncate max-w-[85px]">{cp.name}</span>
                                  <Show when={cp.status === "visited"}>
                                    <CheckCircle2 class="w-3 h-3 text-emerald-500" />
                                  </Show>
                                </div>
                              );
                            }}
                          </For>
                        </div>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ── Bottom Content Grid ── */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

        {/* ── COL 1: Laporan Insiden (Span 4) ── */}
        <div class="lg:col-span-4 flex flex-col">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full flex flex-col">
            <div class="flex justify-between items-center mb-6">
              <div class="flex items-center gap-2">
                <AlertTriangle class="w-5 h-5 text-red-500" />
                <h4 class="font-black text-sm text-[var(--color-text-primary)] uppercase tracking-tight">Laporan Insiden</h4>
              </div>
              <button
                onClick={() => {
                  const now = new Date();
                  setNewIncident({
                    title: "",
                    description: "",
                    location: "-7.696787, 109.253526",
                    time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                    photo: null,
                    photoPreview: ""
                  });
                  setReportModalOpen(true);
                }}
                class="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <Plus class="w-4 h-4" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar max-h-[600px] flex flex-col">
              <Show when={incidents().length === 0}>
                <div class="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-12">
                  <ShieldAlert class="w-12 h-12 mb-3 text-gray-300" />
                  <p class="text-[10px] font-black uppercase tracking-widest leading-loose">Tidak ada<br />insiden aktif</p>
                </div>
              </Show>
              <For each={incidents().slice(0, 10)}>
                {(item) => (
                  <div class="p-4 rounded-2xl border border-red-100 bg-red-50/30 hover:bg-white hover:border-red-300 transition-all cursor-default">
                    <div class="flex justify-between items-start mb-2">
                      <div class="text-[11px] font-black text-red-700 uppercase">{item.title}</div>
                      <div class="text-[8px] font-bold text-gray-400">
                        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>
                    <p class="text-[10px] text-gray-600 line-clamp-2 leading-relaxed mb-3">{item.description}</p>

                    {/* Photo Display */}
                    <Show when={item.photo_url}>
                      <div class="mb-3 relative group">
                        <img
                          src={`${STATIC_URL}${item.photo_url}`}
                          alt="Incident photo"
                          class="w-full h-32 object-cover rounded-xl border border-red-100 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedIncidentPhoto(`${STATIC_URL}${item.photo_url}`)}
                        />
                        <div class="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera class="w-3 h-3 inline mr-1" />
                          Klik untuk perbesar
                        </div>
                      </div>
                    </Show>

                    <div class="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                      <MapPin class="w-3 h-3" />
                      <span class="truncate">{item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}</span>
                    </div>
                    <div class="mt-2 text-[8px] font-bold text-gray-400">
                      NIK: {item.nik} • {item.timestamp}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>
        </div>

        {/* ── COL 2: Route Config (Span 4) ── */}
        <div class="lg:col-span-4 flex flex-col">
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full flex flex-col">
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

            <div class="flex-1 space-y-6 overflow-y-auto pr-1 custom-scrollbar max-h-[600px]">
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
                          <div class="group flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] h-full hover:bg-[var(--color-secondary-bg)]/20 transition-all bg-white">
                            <div class="flex items-center gap-3">
                              <div class="w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] h-full flex items-center justify-center text-[var(--color-primary-button)] shadow-sm">
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
                      <div class="group flex items-center justify-between p-3 rounded-2xl border border-[var(--color-border)] h-full hover:bg-[var(--color-secondary-bg)]/20 transition-all bg-white">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-white border border-[var(--color-border)] h-full flex items-center justify-center text-[var(--color-primary-button)] shadow-sm">
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

        {/* ── COL 3: Schedule & Logs (Span 4) ── */}
        <div class="lg:col-span-4 flex flex-col gap-8">
          {/* Active Assignments */}
          <div class="bg-white p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-6">
              <h3 class="font-black text-[var(--color-text-primary)] flex items-center gap-2">
                <Calendar class="w-5 h-5 text-[var(--color-accent)]" />
                Jadwal Patroli
              </h3>
              <span class="text-[9px] font-black text-[var(--color-text-tertiary)] bg-[var(--color-light-gray)] px-2 py-1 rounded-md uppercase tracking-wider">
                {assignments().filter(a => a.status !== "completed").length} Pending
              </span>
            </div>

            <Show when={assignments().filter(a => a.status !== "completed").length === 0}>
              <div class="py-12 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-[var(--color-border)]">
                <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-300">
                  <Calendar class="w-5 h-5" />
                </div>
                <p class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-widest">Semua jadwal telah selesai</p>
              </div>
            </Show>

            <div class="space-y-3 overflow-y-auto custom-scrollbar max-h-[380px] pr-1">
              <For each={assignments().filter(a => a.status !== "completed")}>
                {(a) => (
                  <div class={`p-4 rounded-3xl border transition-all ${a.status === "in_progress" ? "bg-indigo-50/30 border-indigo-200" : "bg-white border-[var(--color-border)]"}`}>
                    <div class="flex justify-between items-start mb-3">
                      <div class="flex items-center gap-3">
                        <div class={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${a.status === "in_progress" ? "bg-indigo-500 text-white" : "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)]"}`}>
                          <Show when={a.assignee_type === "group"} fallback={<User class="w-5 h-5" />}>
                            <Users class="w-5 h-5" />
                          </Show>
                        </div>
                        <div>
                          <div class="font-black text-xs text-[var(--color-text-primary)]">{getAssigneeName(a.assignee_type, a.assignee_id)}</div>
                          <div class="flex items-center gap-1.5 mt-0.5">
                            <div class="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-tighter">{a.start_time} — {a.end_time}</div>
                          </div>
                        </div>
                      </div>
                      <span class={`text-[8px] font-black px-2.5 py-1 rounded-lg border ${statusBadge(a.status)} uppercase tracking-widest`}>
                        {a.status?.replace("_", " ")}
                      </span>
                    </div>

                    {/* ── Checkpoint Details (High-Fidelity) ── */}
                    <div class="mt-4 pt-4 border-t border-[var(--color-border)]/50">
                      <div class="flex justify-between items-center mb-3">
                        <h4 class="text-[10px] font-black text-[var(--color-text-primary)] uppercase tracking-tight">
                          Checkpoint (
                          {activePatrols().find(p => p.id === a.id)?.checkpoint_details?.filter(d => d.status === "visited").length || 0}
                          /
                          {a.checkpoints?.length || 0}
                          )
                        </h4>
                      </div>

                      <div class="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        <For each={a.checkpoints}>
                          {(cpId) => {
                            const cp = checkpoints().find(c => c.id === extractId(cpId));
                            const activeDetail = activePatrols().find(p => p.id === a.id)?.checkpoint_details?.find(d => d.id === cpId);
                            const isVisited = activeDetail?.status === "visited";

                            return (
                              <div class={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isVisited ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-100 shadow-sm"}`}>
                                <div class="flex items-center gap-3 flex-1 min-w-0">
                                  <div class={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isVisited ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400"}`}>
                                    <MapPin class="w-5 h-5" />
                                  </div>
                                  <div class="flex-1 min-w-0">
                                    <div class={`text-[11px] font-black truncate ${isVisited ? "text-emerald-700" : "text-slate-800"}`}>
                                      {cp?.name || "Unknown Point"}
                                    </div>
                                    <div class="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                      {isVisited ? `Dikunjungi: ${activeDetail?.scanned_at ? new Date(activeDetail.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}` : "Belum dikunjungi"}
                                    </div>
                                    <Show when={!isVisited}>
                                      <div class="text-[8px] font-bold text-amber-500 mt-0.5">
                                        Jarak Anda: 12141778m (Di luar jangkauan)
                                      </div>
                                    </Show>
                                  </div>
                                </div>

                                <div class="flex flex-col items-end gap-1 ml-2">
                                  <Show when={isVisited} fallback={
                                    <span class="text-[8px] font-black text-slate-300 uppercase tracking-widest opacity-40">Buat Laporan</span>
                                  }>
                                    <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                                  </Show>
                                </div>
                              </div>
                            );
                          }}
                        </For>
                      </div>
                    </div>

                    <div class="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-[var(--color-border)]/30">
                      <div class="flex flex-col">
                        <span class="text-[8px] font-black text-[var(--color-text-tertiary)] uppercase tracking-tighter mb-0.5">Status Tugas</span>
                        <span class={`text-[9px] font-black ${a.status === "in_progress" ? "text-indigo-600" : "text-slate-400"} uppercase`}>
                          {a.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div class="flex-1 flex gap-2 justify-end">
                        <Show when={a.status === "scheduled"}>
                          <button onClick={() => updateAssignmentStatus(a.id, "in_progress")} class="px-6 text-[9px] bg-emerald-500 text-white font-black py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors uppercase tracking-widest">Mulai</button>
                        </Show>
                        <Show when={a.status === "in_progress"}>
                          <button onClick={() => updateAssignmentStatus(a.id, "completed")} class="px-6 text-[9px] bg-[var(--color-primary-button)] text-white font-black py-2.5 rounded-xl shadow-lg shadow-[var(--color-primary-button)]/20 hover:opacity-90 transition-opacity uppercase tracking-widest">Selesai</button>
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* History Selesai - Detailed */}
          <div class="bg-white/40 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-[var(--color-border)] h-full flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-5">
              <h3 class="font-black text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4" />
                Log Aktivitas Selesai
              </h3>
              <span class="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                {assignments().filter(a => a.status === "completed").length} Records
              </span>
            </div>

            <div class="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              <Show when={assignments().filter(a => a.status === "completed").length === 0}>
                <div class="py-12 text-center border-2 border-dashed border-[var(--color-border)] rounded-3xl bg-white/40">
                  <p class="text-[10px] font-black text-gray-300 uppercase tracking-widest">Belum ada riwayat tercatat</p>
                </div>
              </Show>
              <For each={assignments().filter(a => a.status === "completed")}>
                {(a) => (
                  <div class="group p-3.5 rounded-2xl bg-white border border-[var(--color-border)] h-full hover:border-emerald-200 hover:shadow-sm transition-all">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                          <CheckCircle2 class="w-4 h-4" />
                        </div>
                        <div>
                          <div class="text-[11px] font-black text-[var(--color-text-primary)] leading-none mb-1">{getAssigneeName(a.assignee_type, a.assignee_id)}</div>
                          <div class="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-tighter">
                            {a.checkpoints?.length || 0}/{a.checkpoints?.length || 0} Titik • {a.end_time}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">100% Done</div>
                        <div class="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{a.status}</div>
                      </div>
                    </div>
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
          <div class="flex p-1 bg-[var(--color-light-gray)] rounded-2xl border border-[var(--color-border)] h-full">
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
                <div class="bg-gradient-to-br from-[var(--color-secondary-bg)]/50 to-white p-6 rounded-3xl border border-[var(--color-border)] h-full shadow-inner">
                  <h4 class="text-[10px] font-black text-[var(--color-text-tertiary)] uppercase tracking-[0.2em] mb-4">Daftar Area Aktif</h4>
                  <div class="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    <Show when={areas().length === 0}>
                      <div class="py-8 text-center border-2 border-dashed border-[var(--color-border)] rounded-2xl">
                        <p class="text-xs font-bold text-gray-400 italic">Belum ada area terdaftar</p>
                      </div>
                    </Show>
                    <For each={areas()}>
                      {(a) => (
                        <div class="group flex items-center justify-between p-4 rounded-2xl border border-[var(--color-border)] h-full bg-white/80 backdrop-blur-sm hover:border-[var(--color-accent)] transition-all shadow-sm">
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

      {/* ── Modal Lapor Insiden ── */}
      <Modal
        isOpen={reportModalOpen()}
        onClose={() => setReportModalOpen(false)}
        title="Lapor Insiden"
      >
        <div class="space-y-5 p-2">
          {/* Mock Camera View or Map */}
          <div class="h-32 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200">
            <div class="absolute inset-0 bg-[url('https://api.maptiler.com/maps/basic-v2/static/109.25, -7.69,12/600x300.png?key=get_your_own_key')] bg-cover bg-center opacity-50" />
            <div class="absolute inset-0 flex items-center justify-center">
              <MapPin class="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div class="space-y-4">
            <div class="relative">
              <input
                type="text"
                placeholder="Judul Insiden"
                value={newIncident().title}
                onInput={(e) => setNewIncident(prev => ({ ...prev, title: e.currentTarget.value }))}
                class="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-[var(--color-primary-button)] focus:ring-0 transition-all placeholder:text-gray-300"
              />
            </div>

            <div class="relative">
              <textarea
                placeholder="Deskripsi"
                rows="4"
                value={newIncident().description}
                onInput={(e) => setNewIncident(prev => ({ ...prev, description: e.currentTarget.value }))}
                class="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-[var(--color-primary-button)] focus:ring-0 transition-all placeholder:text-gray-300 resize-none"
              />
            </div>

            <div class="grid grid-cols-1 gap-3">
              <div class="relative group">
                <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <MapPin class="w-4 h-4 text-[var(--color-primary-button)]" />
                </div>
                <input
                  type="text"
                  value={newIncident().location}
                  onInput={(e) => setNewIncident(prev => ({ ...prev, location: e.currentTarget.value }))}
                  class="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-[var(--color-text-primary)] focus:border-[var(--color-primary-button)] focus:ring-0 transition-all"
                />
                <div class="absolute -top-2.5 left-4 bg-white px-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Lokasi</div>
              </div>

              <div class="relative group">
                <div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <Clock class="w-4 h-4 text-[var(--color-primary-button)]" />
                </div>
                <input
                  type="text"
                  value={newIncident().time}
                  onInput={(e) => setNewIncident(prev => ({ ...prev, time: e.currentTarget.value }))}
                  class="w-full pl-12 pr-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-[11px] font-black text-[var(--color-text-primary)] focus:border-[var(--color-primary-button)] focus:ring-0 transition-all"
                />
                <div class="absolute -top-2.5 left-4 bg-white px-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">Waktu</div>
              </div>
            </div>

            <div class="relative">
              <input
                type="file"
                accept="image/*"
                id="incident-photo-input"
                class="hidden"
                onChange={handleFileChange}
              />

              <Show when={newIncident().photoPreview} fallback={
                <button
                  onClick={() => document.getElementById('incident-photo-input')?.click()}
                  class="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-xs font-black text-gray-400 hover:bg-slate-50 hover:border-slate-300 transition-all"
                >
                  <Camera class="w-4 h-4" />
                  TAMBAH FOTO BUKTI
                </button>
              }>
                <div class="relative group rounded-2xl overflow-hidden border-2 border-slate-100">
                  <img src={newIncident().photoPreview} class="w-full h-40 object-cover" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => document.getElementById('incident-photo-input')?.click()}
                      class="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Ganti Foto
                    </button>
                    <button
                      onClick={() => setNewIncident(prev => ({ ...prev, photo: null, photoPreview: "" }))}
                      class="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          </div>

          <div class="flex gap-4 pt-2">
            <button
              onClick={() => setReportModalOpen(false)}
              class="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-xs font-black text-gray-400 hover:bg-slate-50 transition-all"
            >
              BATAL
            </button>
            <button
              onClick={submitIncident}
              disabled={isLoading()}
              class="flex-1 py-4 rounded-2xl bg-[var(--color-primary-button)] text-white text-xs font-black shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading() ? "MENGIRIM..." : "KIRIM"}
            </button>
          </div>
        </div>
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

      {/* ── Photo Preview Modal for Incidents ── */}
      <Show when={selectedIncidentPhoto()}>
        <div
          class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIncidentPhoto(null)}
        >
          <div class="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedIncidentPhoto(null)}
              class="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
            >
              <div class="flex items-center gap-2 text-sm font-bold">
                <span>Tutup</span>
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</div>
              </div>
            </button>
            <img
              src={selectedIncidentPhoto()!}
              alt="Incident photo preview"
              class="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </Show>

      {/* ── Photo Preview Modal for Checkpoint Reports ── */}
      <Show when={selectedReportPhoto()}>
        <div
          class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReportPhoto(null)}
        >
          <div class="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedReportPhoto(null)}
              class="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors"
            >
              <div class="flex items-center gap-2 text-sm font-bold">
                <span>Tutup</span>
                <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">✕</div>
              </div>
            </button>
            <img
              src={selectedReportPhoto()!}
              alt="Checkpoint report photo preview"
              class="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </Show>

      {/* ── Checkpoint Reports Section (Floating Bottom Panel) ── */}
      <Show when={checkpointReports().length > 0}>
        <div class="fixed bottom-6 right-6 w-96 max-h-[500px] bg-white rounded-3xl shadow-2xl border border-[var(--color-border)] overflow-hidden z-40">
          <div class="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 text-white">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CheckCircle2 class="w-5 h-5" />
                </div>
                <div>
                  <h4 class="font-black text-sm uppercase tracking-tight">Laporan Checkpoint</h4>
                  <p class="text-[10px] font-bold opacity-90">{checkpointReports().length} laporan tercatat</p>
                </div>
              </div>
            </div>
          </div>

          <div class="overflow-y-auto max-h-[400px] p-4 space-y-3 custom-scrollbar">
            <For each={checkpointReports().slice(0, 20)}>
              {(report) => {
                const checkpoint = checkpoints().find(c => c.id === extractId(report.checkpoint_id));
                return (
                  <div class="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 hover:bg-white hover:border-emerald-300 transition-all">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex items-center gap-2">
                        <MapPin class="w-4 h-4 text-emerald-600" />
                        <div class="text-[11px] font-black text-emerald-700 uppercase">
                          {checkpoint?.name || 'Unknown Checkpoint'}
                        </div>
                      </div>
                      <div class="text-[8px] font-bold text-gray-400">
                        {report.created_at ? new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </div>
                    </div>

                    <p class="text-[10px] text-gray-600 leading-relaxed mb-3">{report.report}</p>

                    {/* Photo Display */}
                    <Show when={report.photo_url}>
                      <div class="relative group">
                        <img
                          src={`${STATIC_URL}${report.photo_url}`}
                          alt="Checkpoint report photo"
                          class="w-full h-32 object-cover rounded-xl border border-emerald-100 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedReportPhoto(`${STATIC_URL}${report.photo_url}`)}
                        />
                        <div class="absolute top-2 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera class="w-3 h-3 inline mr-1" />
                          Klik untuk perbesar
                        </div>
                      </div>
                    </Show>

                    <div class="mt-3 flex items-center justify-between text-[8px] font-bold text-gray-400">
                      <span>NIK: {report.nik}</span>
                      <span>Assignment: {extractId(report.assignment_id).slice(0, 8)}...</span>
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default Patrol;
