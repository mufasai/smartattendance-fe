import { type Component, For } from "solid-js";
import { Edit2, Trash2, Users, MoreVertical } from "lucide-solid";
import Button from "./ui/Button";

export interface Group {
  id: string;
  name: string;
  description: string;
  member_niks: string[];
}

interface GroupListProps {
  groups: Group[];
  onEdit: (group: Group) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const GroupList: Component<GroupListProps> = (props) => {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {props.isLoading && props.groups.length === 0 ? (
        <div class="col-span-full py-12 text-center text-[var(--color-text-secondary)]">
          Memuat data grup...
        </div>
      ) : (
        <For each={props.groups}>
          {(group) => (
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-all group relative overflow-hidden">
               {/* Accent decoration */}
              <div class="absolute top-0 right-0 w-24 h-24 bg-[var(--color-primary-bg)] rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:bg-[var(--color-secondary-bg)] transition-colors" />
              
              <div class="relative z-10 flex justify-between items-start mb-4">
                <div class="w-12 h-12 rounded-2xl bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] flex items-center justify-center shadow-inner">
                  <Users class="w-6 h-6" />
                </div>
                <div class="flex gap-1">
                  <button 
                    onClick={() => props.onEdit(group)}
                    class="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] rounded-xl transition-all"
                  >
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => props.onDelete(group.id)}
                    class="p-2 text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div class="relative z-10 space-y-4">
                <div>
                  <h4 class="text-lg font-bold text-[var(--color-text-primary)]">
                    {group.name}
                  </h4>
                  <p class="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-1">
                    {group.description || "Tidak ada deskripsi."}
                  </p>
                </div>

                <div class="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                  <div class="flex flex-col">
                    <span class="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold tracking-wider">Anggota Grup</span>
                    <span class="text-sm font-black text-[var(--color-primary-button)]">
                      {group.member_niks.length} Karyawan
                    </span>
                  </div>
                  
                  <div class="flex -space-x-2">
                    <For each={group.member_niks.slice(0, 3)}>
                      {() => (
                        <div class="w-8 h-8 rounded-full bg-[var(--color-primary-bg)] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[var(--color-primary-button)]">
                          ?
                        </div>
                      )}
                    </For>
                    {group.member_niks.length > 3 && (
                      <div class="w-8 h-8 rounded-full bg-[var(--color-light-gray)] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                        +{group.member_niks.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </For>
      )}
      
      {!props.isLoading && props.groups.length === 0 && (
        <div class="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-[var(--color-border)]">
          <Users class="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-4" />
          <h5 class="text-lg font-bold text-[var(--color-text-primary)]">Belum ada grup</h5>
          <p class="text-sm text-[var(--color-text-secondary)]">Mulai buat grup pertama Anda untuk mempermudah pengaturan shift.</p>
        </div>
      )}
    </div>
  );
};

export default GroupList;
