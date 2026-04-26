import { type Component, createSignal, Show, lazy } from "solid-js";
import { Users, Settings } from "lucide-solid";

// Lazy load components
const EmployeeManagement = lazy(() => import("../components/EmployeeManagement"));
const AttendanceConfiguration = lazy(() => import("../components/AttendanceConfiguration"));

const Employee: Component = () => {
  const [activeTab, setActiveTab] = createSignal<"employees" | "configuration">("employees");

  return (
    <div class="space-y-6">
      {/* Header */}
      <div>
        <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
          Employee & Attendance Management
        </h2>
        <p class="text-sm text-[var(--color-text-secondary)]">
          Manage employees and configure attendance requirements
        </p>
      </div>

      {/* Tabs */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-2">
        <div class="flex gap-2">
          <button
            onClick={() => setActiveTab("employees")}
            class={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab() === "employees"
                ? "bg-[var(--color-primary-button)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <Users class="w-5 h-5" />
            Employee Management
          </button>
          <button
            onClick={() => setActiveTab("configuration")}
            class={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab() === "configuration"
                ? "bg-[var(--color-primary-button)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <Settings class="w-5 h-5" />
            Attendance Configuration
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <Show when={activeTab() === "employees"}>
        <EmployeeManagement />
      </Show>
      <Show when={activeTab() === "configuration"}>
        <AttendanceConfiguration />
      </Show>
    </div>
  );
};

export default Employee;
