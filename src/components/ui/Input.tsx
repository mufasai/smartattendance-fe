import { type Component, type JSX, splitProps } from "solid-js";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  containerClass?: string;
}

const Input: Component<InputProps> = (props) => {
  const [local, others] = splitProps(props, ["label", "error", "containerClass", "class"]);

  return (
    <div class={`flex flex-col gap-1.5 ${local.containerClass || ""}`}>
      {local.label && (
        <label class="text-sm font-semibold text-[var(--color-text-primary)]">
          {local.label}
        </label>
      )}
      <input
        {...others}
        class={`w-full px-4 py-2.5 bg-[var(--color-light-gray)]/50 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-tertiary)] text-sm ${
          local.error ? "border-red-500 ring-red-500/20" : ""
        } ${local.class || ""}`}
      />
      {local.error && (
        <span class="text-xs font-medium text-red-500 ml-1">{local.error}</span>
      )}
    </div>
  );
};

export default Input;
