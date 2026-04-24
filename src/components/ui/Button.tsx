import { type Component, type JSX, splitProps } from "solid-js";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const Button: Component<ButtonProps> = (props) => {
  const [local, others] = splitProps(props, ["variant", "size", "loading", "class", "children"]);

  const variantClasses = {
    primary: "bg-[var(--color-primary-button)] text-white hover:bg-[var(--color-primary-button)]/90 shadow-sm",
    secondary: "bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] hover:opacity-90 shadow-sm",
    outline: "bg-transparent text-[var(--color-primary-button)] border border-[var(--color-border)] hover:bg-[var(--color-secondary-bg)]",
    ghost: "bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)] hover:text-[var(--color-text-primary)]",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      {...others}
      disabled={props.disabled || local.loading}
      class={`flex items-center justify-center gap-2 rounded-xl transition-all font-medium active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${
        variantClasses[local.variant || "primary"]
      } ${sizeClasses[local.size || "md"]} ${local.class || ""}`}
    >
      {local.loading ? (
        <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : null}
      {local.children}
    </button>
  );
};

export default Button;
