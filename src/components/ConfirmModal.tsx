import { type Component } from "solid-js";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { AlertTriangle } from "lucide-solid";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

const ConfirmModal: Component<ConfirmModalProps> = (props) => {
  const getColors = () => {
    switch (props.variant) {
      case "danger":
        return {
          icon: "text-red-500 bg-red-50",
          button: "bg-red-500 hover:bg-red-600",
        };
      case "warning":
        return {
          icon: "text-orange-500 bg-orange-50",
          button: "bg-orange-500 hover:bg-orange-600",
        };
      default:
        return {
          icon: "text-[var(--color-primary-button)] bg-[var(--color-primary-bg)]",
          button: "bg-[var(--color-primary-button)] hover:opacity-90",
        };
    }
  };

  return (
    <Modal 
      isOpen={props.isOpen} 
      onClose={props.onCancel} 
      title={props.title}
      maxWidth="max-w-md"
    >
      <div class="flex flex-col items-center text-center space-y-4">
        <div class={`w-16 h-16 rounded-2xl flex items-center justify-center ${getColors().icon}`}>
          <AlertTriangle class="w-8 h-8" />
        </div>
        
        <div class="space-y-2">
          <p class="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            {props.message}
          </p>
        </div>

        <div class="flex gap-3 w-full pt-4">
          <Button 
            variant="outline" 
            class="flex-1" 
            onClick={props.onCancel}
            disabled={props.isLoading}
          >
            {props.cancelText || "Batal"}
          </Button>
          <Button 
            class={`flex-1 text-white shadow-lg ${getColors().button}`} 
            onClick={props.onConfirm}
            loading={props.isLoading}
          >
            {props.confirmText || "Hapus"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;
