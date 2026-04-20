import { type Component, For, createSignal } from "solid-js";
import { Plus, MapPin, Clock, RefreshCw, AlertCircle, Play } from "lucide-solid";

const Patrol: Component = () => {
  const [checkpoints] = createSignal([
    { id: "CP-001", name: "Gate A", status: "Belum dikunjungi" },
    { id: "CP-002", name: "Gudang B", status: "Belum dikunjungi" },
    { id: "CP-003", name: "Parkir C", status: "Belum dikunjungi" },
    { id: "CP-004", name: "Kantor D", status: "Belum dikunjungi" },
  ]);

  return (
    <div class="space-y-6">
      {/* Header Sesuai Tema Web */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Patrol Management
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Pantau rutinitas patroli dan kelola rute checkpoint
          </p>
        </div>
        <div class="flex gap-2">
          <button class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium">
            <RefreshCw class="w-4 h-4" />
            Refresh
          </button>
          <button class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium">
            <Plus class="w-5 h-5" />
            Tambah Checkpoint
          </button>
        </div>
      </div>

      {/* Grid Utama 2 Kolom */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Kolom Kiri: Status & Rute */}
        <div class="lg:col-span-4 space-y-6">
          
          {/* Status Panel Biasa (Tidak mencolok seperti mobile app) */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4">
            <div class="flex justify-between items-center">
              <h3 class="font-bold text-[var(--color-text-primary)]">Status Patroli</h3>
              <span class="px-2 py-1 text-xs font-bold rounded-lg border bg-blue-50 text-blue-700 border-blue-200">
                Menunggu
              </span>
            </div>

            <div class="flex items-center gap-3 bg-[var(--color-light-gray)]/50 p-3 rounded-xl border border-[var(--color-border)]">
              <div class="text-[var(--color-primary-button)]">
                <Clock class="w-5 h-5" />
              </div>
              <div>
                <div class="font-bold text-[var(--color-text-primary)] text-sm">
                  Shift Malam
                </div>
                <div class="text-xs text-[var(--color-text-secondary)]">
                  22:00 - 06:00
                </div>
              </div>
            </div>

            <button class="w-full bg-[var(--color-primary-bg)] text-[var(--color-primary-button)] border border-[var(--color-border)] font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-[var(--color-secondary-bg)] transition-colors text-sm">
              <Play class="w-4 h-4 fill-current" />
              Mulai Patroli (Simulasi)
            </button>
          </div>

          {/* Daftar Checkpoint Panel */}
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-[var(--color-text-primary)]">Rute Checkpoint</h3>
              <span class="text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-light-gray)] px-2 py-1 rounded-lg">
                0/4
              </span>
            </div>
            
            <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              <For each={checkpoints()}>
                {(cp) => (
                  <div class="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)]/50 transition-colors">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-lg bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] flex items-center justify-center shrink-0">
                        <MapPin class="w-4 h-4" />
                      </div>
                      <div>
                        <div class="font-bold text-[var(--color-text-primary)] text-sm">
                          {cp.name}
                        </div>
                        <div class="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                          <AlertCircle class="w-3 h-3" />
                          {cp.status}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

        </div>

        {/* Kolom Kanan: Peta */}
        <div class="lg:col-span-8">
          <div class="bg-white p-5 rounded-2xl shadow-sm border border-[var(--color-border)] h-full flex flex-col min-h-[600px]">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-[var(--color-text-primary)]">Peta Area Patroli</h3>
              <button class="text-[var(--color-primary-button)] font-semibold text-sm hover:underline">
                Lihat Detail Peta
              </button>
            </div>

            <div class="bg-[var(--color-light-gray)]/50 rounded-xl border border-[var(--color-border)] flex-1 relative overflow-hidden flex flex-col items-center justify-center text-center p-6">
              <div class="absolute bottom-4 left-4 font-bold text-xl tracking-tighter mix-blend-multiply opacity-50 flex">
                <span class="text-blue-500">G</span>
                <span class="text-red-500">o</span>
                <span class="text-yellow-500">o</span>
                <span class="text-blue-500">g</span>
                <span class="text-green-500">l</span>
                <span class="text-red-500">e</span>
              </div>

              <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 text-[var(--color-text-tertiary)]">
                <MapPin class="w-8 h-8" />
              </div>
              <h4 class="font-bold text-[var(--color-text-primary)] text-lg mb-2">
                Peta Iteraktif Terhubung
              </h4>
              <p class="text-sm text-[var(--color-text-secondary)] max-w-sm">
                Integrasi Google Maps akan dimuat di sini untuk menampilkan pergerakan petugas sekuriti dari Gate A hingga Kantor D secara real-time.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Patrol;
