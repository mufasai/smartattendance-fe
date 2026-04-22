import { type Component, For, createSignal } from "solid-js";
import { Plus, MapPin, Clock, RefreshCw, AlertCircle, Play, Edit2, Trash2, Activity, User, CheckCircle2 } from "lucide-solid";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import CheckpointForm, { type Checkpoint } from "../components/CheckpointForm";

const Patrol: Component = () => {
  // State Management
  const [checkpoints, setCheckpoints] = createSignal<Checkpoint[]>([
    { id: "CP-001", name: "Gate A", code: "QR-G-001", latitude: "-6.123", longitude: "106.123", status: "Sudah dikunjungi" },
    { id: "CP-002", name: "Gudang B", code: "QR-G-002", latitude: "-6.124", longitude: "106.124", status: "Belum dikunjungi" },
    { id: "CP-003", name: "Parkir C", code: "QR-G-003", latitude: "-6.125", longitude: "106.125", status: "Belum dikunjungi" },
    { id: "CP-004", name: "Kantor D", code: "QR-G-004", latitude: "-6.126", longitude: "106.126", status: "Belum dikunjungi" },
  ]);

  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [editingCheckpoint, setEditingCheckpoint] = createSignal<Checkpoint | null>(null);

  // CRUD Handlers
  const handleAddCheckpoint = () => {
    setEditingCheckpoint(null);
    setIsModalOpen(true);
  };

  const handleEditCheckpoint = (cp: Checkpoint) => {
    setEditingCheckpoint(cp);
    setIsModalOpen(true);
  };

  const handleDeleteCheckpoint = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus checkpoint ini?")) {
      setCheckpoints(checkpoints().filter((cp) => cp.id !== id));
    }
  };

  const handleSaveCheckpoint = (data: Omit<Checkpoint, "status">) => {
    if (editingCheckpoint()) {
      // Update existing
      setCheckpoints(
        checkpoints().map((cp) => 
          cp.id === editingCheckpoint()?.id 
            ? { ...cp, ...data } 
            : cp
        )
      );
    } else {
      // Add new
      const newCp: Checkpoint = {
        ...data,
        status: "Belum dikunjungi"
      };
      setCheckpoints([...checkpoints(), newCp]);
    }
    setIsModalOpen(false);
  };

  // Tracking Stats
  const completedCount = () => checkpoints().filter(cp => cp.status === "Sudah dikunjungi").length;

  return (
    <div class="space-y-6">
      {/* Header Sesuai Tema Web */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Patrol Management
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Pantau rutinitas patroli dan kelola rute checkpoint (Manager View)
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="bg-white">
            <RefreshCw class="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={handleAddCheckpoint}>
            <Plus class="w-5 h-5" />
            Tambah Checkpoint
          </Button>
        </div>
      </div>

      {/* Grid Utama 2 Kolom */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Status & Rute */}
        <div class="lg:col-span-4 space-y-6">
          
          {/* Status Panel (Manager Overview) */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Activity class="w-4 h-4 text-[var(--color-primary-button)]" />
                Status Patroli Aktif
              </h3>
              <span class="px-2 py-1 text-[10px] font-bold rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">
                Berlangsung
              </span>
            </div>

            <div class="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-light-gray)]/30 space-y-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)]">
                  <User class="w-5 h-5" />
                </div>
                <div>
                  <div class="font-bold text-sm text-[var(--color-text-primary)]">Andi Wijaya</div>
                  <div class="text-[10px] text-[var(--color-text-secondary)] uppercase">Petugas Lapangan</div>
                </div>
              </div>
              <div class="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-white p-2 rounded-lg border border-[var(--color-border)]">
                <Clock class="w-3.5 h-3.5 text-[var(--color-primary-button)]" />
                Mulai: <span class="font-bold text-[var(--color-text-primary)]">22:15 WIB</span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[var(--color-primary-bg)]/40 p-3 rounded-xl border border-[var(--color-border)] text-center">
                <div class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Progres</div>
                <div class="text-lg font-black text-[var(--color-primary-button)]">
                  {completedCount()}/{checkpoints().length}
                </div>
              </div>
              <div class="bg-[var(--color-primary-bg)]/40 p-3 rounded-xl border border-[var(--color-border)] text-center">
                <div class="text-[10px] text-[var(--color-text-secondary)] uppercase font-bold">Sisa Waktu</div>
                <div class="text-lg font-black text-[var(--color-primary-button)]">4j 30m</div>
              </div>
            </div>
          </div>

          {/* Daftar Checkpoint Panel (CRUD Interface) */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-[var(--color-text-primary)]">Konfigurasi Rute</h3>
              <div class="text-[10px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-light-gray)] px-2 py-1 rounded-lg uppercase tracking-wide">
                {checkpoints().length} Points
              </div>
            </div>
            
            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <For each={checkpoints()}>
                {(cp) => (
                  <div class="group flex items-center justify-between p-3 border border-[var(--color-border)] rounded-2xl hover:border-[var(--color-accent)] hover:bg-[var(--color-primary-bg)]/20 transition-all">
                    <div class="flex items-center gap-3">
                      <div class={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                        cp.status === "Sudah dikunjungi" 
                        ? "bg-emerald-100 text-emerald-600 border-emerald-200" 
                        : "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] border-[var(--color-border)]"
                      }`}>
                        {cp.status === "Sudah dikunjungi" ? <CheckCircle2 class="w-5 h-5" /> : <MapPin class="w-4 h-4" />}
                      </div>
                      <div>
                        <div class="font-bold text-[var(--color-text-primary)] text-sm">
                          {cp.name}
                        </div>
                        <div class="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                          {cp.code}
                        </div>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEditCheckpoint(cp)}
                        class="p-1.5 rounded-lg text-[var(--color-primary-button)] hover:bg-white border border-transparent hover:border-[var(--color-border)] transition-all"
                      >
                        <Edit2 class="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCheckpoint(cp.id)}
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

        {/* Kolom Kanan: Tracking Visual */}
        <div class="lg:col-span-8 flex flex-col gap-6">
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] flex-1 flex flex-col min-h-[500px]">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <h3 class="font-bold text-[var(--color-text-primary)]">Live Tracking Map</h3>
              </div>
              <div class="flex gap-2">
                 <Button variant="outline" size="sm" class="text-[10px] uppercase font-bold py-1">
                   Optimasi Rute
                 </Button>
                 <Button variant="secondary" size="sm" class="text-[10px] uppercase font-bold py-1">
                   Fokus Petugas
                 </Button>
              </div>
            </div>

            <div class="bg-[var(--color-light-gray)]/30 rounded-2xl border-2 border-dashed border-[var(--color-border)] flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-white to-[var(--color-primary-bg)]/20">
              <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(var(--color-primary-button) 1px, transparent 1px); background-size: 24px 24px;" />
              
              <div class="mb-6 relative">
                 <div class="absolute -inset-4 bg-[var(--color-primary-button)]/10 rounded-full blur-xl animate-pulse" />
                 <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-[var(--color-border)] relative z-10 rotate-3">
                    <MapPin class="w-10 h-10 text-[var(--color-primary-button)]" />
                 </div>
              </div>

              <h4 class="font-black text-[var(--color-text-primary)] text-xl mb-2">
                Visualisasi Geo-Tracking
              </h4>
              <p class="text-sm text-[var(--color-text-secondary)] max-w-sm leading-relaxed mb-6">
                Monitoring rute patroli secara real-time. Hubungkan API Google Maps atau Leaflet untuk menampilkan marker petugas dan status checkpoint secara dinamis.
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
              
              <div class="absolute bottom-6 right-6 font-bold text-2xl tracking-tighter mix-blend-multiply opacity-20 flex">
                <span class="text-blue-500">G</span>
                <span class="text-red-500">o</span>
                <span class="text-yellow-500">o</span>
                <span class="text-blue-500">g</span>
                <span class="text-green-500">l</span>
                <span class="text-red-500">e</span>
              </div>
            </div>
          </div>
          
          {/* Recent Activity Log */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
             <h3 class="font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
               <Clock class="w-4 h-4 text-[var(--color-primary-button)]" />
               Log Aktivitas Patroli (Terakhir)
             </h3>
             <div class="space-y-4">
                <div class="flex items-center gap-4 p-3 rounded-xl bg-[var(--color-light-gray)]/20 border border-[var(--color-border)]/50">
                   <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-black text-xs">
                     01
                   </div>
                   <div class="flex-1">
                      <div class="text-sm font-bold">Gate A <span class="text-[var(--color-text-secondary)] font-normal text-xs">— Berhasil di-scan</span></div>
                      <div class="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-tighter">Pukul 22:30:15 oleh Andi Wijaya</div>
                   </div>
                   <div class="text-[10px] font-bold px-2 py-1 bg-green-50 text-green-700 rounded-md">TEPAT WAKTU</div>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* CRUD Modal */}
      <Modal 
        isOpen={isModalOpen()} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCheckpoint() ? "Edit Checkpoint" : "Tambah Checkpoint Baru"}
      >
        <CheckpointForm 
          initialData={editingCheckpoint()}
          onSubmit={handleSaveCheckpoint}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Patrol;
