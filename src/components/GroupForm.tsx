import { type Component, createSignal, For, createMemo } from "solid-js";
import Input from "./ui/Input";
import Button from "./ui/Button";
import { Search, UserPlus, Check, Save } from "lucide-solid";
import { type Group } from "./GroupList";

interface Employee {
  id: string;
  nik: string;
  full_name: string;
}

interface GroupFormProps {
  initialData?: Group | null;
  employees: Employee[];
  onSubmit: (data: Omit<Group, "id">) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const GroupForm: Component<GroupFormProps> = (props) => {
  const [name, setName] = createSignal(props.initialData?.name || "");
  const [description, setDescription] = createSignal(props.initialData?.description || "");
  const [selectedNiks, setSelectedNiks] = createSignal<string[]>(props.initialData?.member_niks || []);
  const [searchMember, setSearchMember] = createSignal("");

  const filteredEmployees = createMemo(() =>
    props.employees.filter(emp =>
      emp.full_name.toLowerCase().includes(searchMember().toLowerCase()) ||
      emp.nik.toLowerCase().includes(searchMember().toLowerCase())
    )
  );

  const toggleMember = (nik: string) => {
    if (selectedNiks().includes(nik)) {
      setSelectedNiks(selectedNiks().filter(n => n !== nik));
    } else {
      setSelectedNiks([...selectedNiks(), nik]);
    }
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    props.onSubmit({
      name: name(),
      description: description(),
      member_niks: selectedNiks(),
    });
  };

  return (
    <form onSubmit={handleSubmit} class="space-y-6">
      <div class="space-y-4">
        <Input
          label="Nama Grup"
          placeholder="Contoh: Grup Shift Pagi"
          value={name()}
          onInput={(e) => setName(e.currentTarget.value)}
          required
        />

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-[var(--color-text-primary)]"> Deskripsi Grup </label>
          <textarea
            class="w-full px-4 py-2.5 bg-[var(--color-light-gray)]/50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-tertiary)] text-sm min-h-[80px] resize-none"
            placeholder="Tambahkan detail atau instruksi grup di sini..."
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
          />
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <label class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
            <UserPlus class="w-4 h-4 text-[var(--color-primary-button)]" />
            Pilih Anggota ({selectedNiks().length})
          </label>
          <span class="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)] bg-[var(--color-light-gray)] px-2 py-0.5 rounded">
            {props.employees.length} Total Karyawan
          </span>
        </div>

        {/* Member Search */}
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </div>
          <input
            type="text"
            class="block w-full pl-9 pr-3 py-2 bg-[var(--color-primary-bg)]/30 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-xs transition-all"
            placeholder="Cari karyawan berdasarkan nama atau NIK..."
            value={searchMember()}
            onInput={(e) => setSearchMember(e.currentTarget.value)}
          />
        </div>

        {/* Member List Grid */}
        <div class="border border-[var(--color-border)] rounded-2xl max-h-[250px] overflow-y-auto bg-[var(--color-light-gray)]/20 p-2 custom-scrollbar">
          <div class="grid grid-cols-1 gap-1">
            <For each={filteredEmployees()}>
              {(emp) => (
                <div
                  onClick={() => toggleMember(emp.nik)}
                  class={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${selectedNiks().includes(emp.nik)
                      ? "bg-white border-[var(--color-primary-button)] shadow-sm"
                      : "border-transparent hover:bg-white"
                    }`}
                >
                  <div class="flex items-center gap-3">
                    <div class={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedNiks().includes(emp.nik)
                        ? "bg-[var(--color-primary-button)] text-white"
                        : "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)]"
                      }`}>
                      {emp.full_name.charAt(0)}
                    </div>
                    <div>
                      <div class="text-xs font-bold text-[var(--color-text-primary)]">{emp.full_name}</div>
                      <div class="text-[10px] text-[var(--color-text-secondary)]">NIK: {emp.nik}</div>
                    </div>
                  </div>
                  <div class={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${selectedNiks().includes(emp.nik)
                      ? "bg-[var(--color-primary-button)] border-[var(--color-primary-button)] text-white"
                      : "border-[var(--color-border)] bg-white"
                    }`}>
                    {selectedNiks().includes(emp.nik) && <Check class="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              )}
            </For>
            {filteredEmployees().length === 0 && (
              <div class="py-8 text-center text-[var(--color-text-tertiary)] text-xs italic">
                Karyawan tidak ditemukan.
              </div>
            )}
          </div>
        </div>
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
          class="flex-1 shadow-lg shadow-[var(--color-primary-button)]/20"
          loading={props.isLoading}
        >
          <Save class="w-4 h-4" />
          {props.initialData ? "Simpan Perubahan" : "Buat Grup"}
        </Button>
      </div>
    </form>
  );
};

export default GroupForm;
