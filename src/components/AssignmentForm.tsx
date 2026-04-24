import { type Component, createSignal, For, Show } from "solid-js";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { Clock, MapPin, Save, User } from "lucide-solid";
import { type Checkpoint } from "./CheckpointForm";

interface Employee {
  id: string;
  nik: string;
  full_name: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface CreateAssignmentPayload {
  assignee_type: string; // "individual" | "group"
  assignee_id: string;
  start_time: string;
  end_time: string;
  checkpoints: string[]; // array of checkpoint IDs
}

interface AssignmentFormProps {
  employees: Employee[];
  groups: Group[];
  checkpoints: Checkpoint[];
  onSubmit: (data: CreateAssignmentPayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const AssignmentForm: Component<AssignmentFormProps> = (props) => {
  const [assigneeType, setAssigneeType] = createSignal("individual");
  const [assigneeId, setAssigneeId] = createSignal("");
  const [startTime, setStartTime] = createSignal("");
  const [endTime, setEndTime] = createSignal("");
  const [selectedCheckpoints, setSelectedCheckpoints] = createSignal<string[]>([]);

  const toggleCheckpoint = (id: string) => {
    if (selectedCheckpoints().includes(id)) {
      setSelectedCheckpoints(selectedCheckpoints().filter((c) => c !== id));
    } else {
      setSelectedCheckpoints([...selectedCheckpoints(), id]);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!assigneeId() || !startTime() || !endTime()) return;
    props.onSubmit({
      assignee_type: assigneeType(),
      assignee_id: assigneeId(),
      start_time: startTime(),
      end_time: endTime(),
      checkpoints: selectedCheckpoints(),
    });
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      {/* Assignee Type Toggle */}
      <div class="flex p-1 bg-[var(--color-light-gray)] rounded-xl border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => { setAssigneeType("individual"); setAssigneeId(""); }}
          class={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assigneeType() === "individual" ? "bg-white shadow-sm text-[var(--color-primary-button)]" : "text-[var(--color-text-secondary)]"}`}
        >
          Perorangan
        </button>
        <button
          type="button"
          onClick={() => { setAssigneeType("group"); setAssigneeId(""); }}
          class={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assigneeType() === "group" ? "bg-white shadow-sm text-[var(--color-primary-button)]" : "text-[var(--color-text-secondary)]"}`}
        >
          Grup / Regu
        </button>
      </div>

      {/* Assignee Selector */}
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <User class="w-4 h-4 text-[var(--color-primary-button)]" />
          {assigneeType() === "individual" ? "Pilih Petugas *" : "Pilih Grup *"}
        </label>
        <select
          class="w-full px-4 py-2.5 bg-[var(--color-light-gray)]/50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm transition-all"
          value={assigneeId()}
          onChange={(e) => setAssigneeId(e.currentTarget.value)}
          required
        >
          <option value="">-- Pilih {assigneeType() === "individual" ? "Karyawan" : "Grup"} --</option>
          <Show when={assigneeType() === "individual"}>
            <For each={props.employees}>
              {(emp) => (
                <option value={emp.id}>
                  {emp.full_name} (NIK: {emp.nik})
                </option>
              )}
            </For>
          </Show>
          <Show when={assigneeType() === "group"}>
            <For each={props.groups}>
              {(g) => (
                <option value={g.id}>
                  {g.name}
                </option>
              )}
            </For>
          </Show>
        </select>
      </div>

      {/* Time Range */}
      <div class="bg-[var(--color-primary-bg)]/40 p-4 rounded-2xl border border-[var(--color-border)] space-y-3">
        <div class="flex items-center gap-2 text-sm font-bold text-[var(--color-primary-button)]">
          <Clock class="w-4 h-4" />
          Waktu Patroli *
        </div>
        <div class="grid grid-cols-2 gap-3">
          <Input
            label="Jam Mulai"
            type="time"
            value={startTime()}
            onInput={(e) => setStartTime(e.currentTarget.value)}
            required
          />
          <Input
            label="Jam Selesai"
            type="time"
            value={endTime()}
            onInput={(e) => setEndTime(e.currentTarget.value)}
            required
          />
        </div>
      </div>

      {/* Checkpoint Multi-Select */}
      <div class="space-y-2">
        <label class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <MapPin class="w-4 h-4 text-[var(--color-primary-button)]" />
          Pilih Titik Checkpoint ({selectedCheckpoints().length} dipilih)
        </label>
        <div class="border border-[var(--color-border)] rounded-2xl max-h-[220px] overflow-y-auto bg-[var(--color-light-gray)]/20 p-2 custom-scrollbar">
          <For each={props.checkpoints}>
            {(cp) => {
              const isSelected = () => selectedCheckpoints().includes(cp.id);
              return (
                <div
                  onClick={() => toggleCheckpoint(cp.id)}
                  class={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border mb-1 ${
                    isSelected()
                      ? "bg-white border-[var(--color-primary-button)] shadow-sm"
                      : "border-transparent hover:bg-white hover:border-[var(--color-border)]"
                  }`}
                >
                  <div class="flex items-center gap-3">
                    <div
                      class={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected()
                          ? "bg-[var(--color-primary-button)] text-white"
                          : "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)]"
                      }`}
                    >
                      <MapPin class="w-4 h-4" />
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--color-text-primary)]">{cp.name}</div>
                      <div class="text-[10px] text-[var(--color-text-tertiary)] font-mono">{cp.code}</div>
                    </div>
                  </div>
                  <div
                    class={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      isSelected()
                        ? "bg-[var(--color-primary-button)] border-[var(--color-primary-button)]"
                        : "border-[var(--color-border)] bg-white"
                    }`}
                  >
                    {isSelected() && (
                      <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              );
            }}
          </For>
          {props.checkpoints.length === 0 && (
            <div class="py-8 text-center text-xs text-[var(--color-text-tertiary)] italic">
              Belum ada checkpoint. Tambahkan checkpoint terlebih dahulu.
            </div>
          )}
        </div>
        <p class="text-[10px] text-[var(--color-text-secondary)] italic">
          * Pilih checkpoint yang harus dikunjungi petugas pada shift ini.
        </p>
      </div>

      {/* Actions */}
      <div class="flex gap-3 pt-2">
        <Button type="button" variant="ghost" class="flex-1" onClick={props.onCancel}>
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          class="flex-1 shadow-md shadow-[var(--color-primary-button)]/20"
          loading={props.isLoading}
        >
          <Save class="w-4 h-4" />
          Buat Assignment
        </Button>
      </div>
    </form>
  );
};

export default AssignmentForm;
