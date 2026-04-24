import { type Component, createSignal } from "solid-js";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { Save, MapPin } from "lucide-solid";

export interface Checkpoint {
  id: string;
  name: string;
  code: string;
  latitude: string;
  longitude: string;
  notes?: string;
  status?: string;
}

interface CheckpointFormProps {
  initialData?: Checkpoint | null;
  onSubmit: (data: Omit<Checkpoint, "status">) => void;
  onCancel: () => void;
}

const CheckpointForm: Component<CheckpointFormProps> = (props) => {
  const [name, setName] = createSignal(props.initialData?.name || "");
  const [code, setCode] = createSignal(props.initialData?.code || "");
  const [lat, setLat] = createSignal(props.initialData?.latitude || "");
  const [long, setLong] = createSignal(props.initialData?.longitude || "");
  const [notes, setNotes] = createSignal(props.initialData?.notes || "");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSubmit({
      id: props.initialData?.id || Math.random().toString(36).substr(2, 9),
      name: name(),
      code: code(),
      latitude: lat(),
      longitude: long(),
      notes: notes(),
    });
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Nama Checkpoint"
          placeholder="Contoh: Gate A"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          required
        />
        <Input
          label="ID / QR Code"
          placeholder="Contoh: CP-QR-001"
          value={code()}
          onInput={(e) => setCode(e.currentTarget.value)}
          required
        />
      </div>

      <div class="bg-[var(--color-primary-bg)]/50 p-4 rounded-2xl border border-[var(--color-border)] space-y-4">
        <div class="flex items-center gap-2 text-sm font-bold text-[var(--color-primary-button)] mb-1">
          <MapPin class="w-4 h-4" />
          Koordinat Lokasi (Geo-tagging)
        </div>
        <div class="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="text"
            placeholder="-6.123456"
            value={lat()}
            onInput={(e) => setLat(e.currentTarget.value)}
          />
          <Input
            label="Longitude"
            type="text"
            placeholder="106.123456"
            value={long()}
            onInput={(e) => setLong(e.currentTarget.value)}
          />
        </div>
        <p class="text-[10px] text-[var(--color-text-secondary)] italic">
          * Koordinat digunakan untuk memantau apakah petugas benar-benar berada di lokasi saat scanning.
        </p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-semibold text-[var(--color-text-primary)]">
          Catatan / Deskripsi (Opsional)
        </label>
        <textarea
          class="w-full px-4 py-2.5 bg-[var(--color-light-gray)]/50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-tertiary)] text-sm min-h-[100px]"
          placeholder="Instruksi khusus untuk checkpoint ini..."
          value={notes()}
          onInput={(e) => setNotes(e.currentTarget.value)}
        />
      </div>

      <div class="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          class="flex-1"
          onClick={props.onCancel}
        >
          Batal
        </Button>
        <Button
          type="submit"
          variant="primary"
          class="flex-1 shadow-md shadow-[var(--color-primary-button)]/20"
        >
          <Save class="w-4 h-4" />
          {props.initialData ? "Simpan Perubahan" : "Tambah Checkpoint"}
        </Button>
      </div>
    </form>
  );
};

export default CheckpointForm;
