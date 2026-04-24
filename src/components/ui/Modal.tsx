import { type Component, type JSX, Show, onCleanup, onMount } from "solid-js";
import { X } from "lucide-solid";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: JSX.Element;
  maxWidth?: string;
}

const Modal: Component<ModalProps> = (props) => {
  // Close on Escape key
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.isOpen) {
      props.onClose();
    }
  };

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown);
  });

  onCleanup(() => {
    window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <Show when={props.isOpen}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
          onClick={props.onClose}
        />
        
        {/* Modal Container */}
        <div 
          class={`relative w-full ${props.maxWidth || "max-w-lg"} bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 border border-[var(--color-border)]`}
        >
          {/* Header */}
          <div class="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-light-gray)]/50">
            <h3 class="text-lg font-bold text-[var(--color-text-primary)]">
              {props.title}
            </h3>
            <button 
              onClick={props.onClose}
              class="p-2 rounded-xl hover:bg-white transition-colors text-[var(--color-text-secondary)]"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div class="p-6 max-h-[80vh] overflow-y-auto">
            {props.children}
          </div>
        </div>
      </div>
    </Show>
  );
};

export default Modal;
