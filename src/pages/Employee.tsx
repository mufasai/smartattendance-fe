import { type Component, createSignal, Show, lazy } from "solid-js";
import { Users, Wifi, MapPin } from "lucide-solid";

// Lazy load components
const EmployeeManagement = lazy(() => import("../components/EmployeeManagement"));
const WiFiManagement = lazy(() => import("../components/WiFiManagement"));
const LocationManagement = lazy(() => import("../components/LocationManagement"));

const Employee: Component = () => {
  const [activeTab, setActiveTab] = createSignal<"employees" | "wifi" | "location">("employees");

  return (
    <div class="space-y-6">
      {/* Header */}
      {/* <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
        <h2 class="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Employee & Attendance Management
        </h2>
        <p class="text-sm text-[var(--color-text-secondary)]">
          Comprehensive employee management with attendance configuration
        </p>
      </div> */}

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
            <span class="hidden sm:inline">Employee Management</span>
            <span class="sm:hidden">Employees</span>
          </button>
          <button
            onClick={() => setActiveTab("wifi")}
            class={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab() === "wifi"
                ? "bg-[var(--color-primary-button)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <Wifi class="w-5 h-5" />
            <span class="hidden sm:inline">WiFi Settings</span>
            <span class="sm:hidden">WiFi</span>
          </button>
          <button
            onClick={() => setActiveTab("location")}
            class={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab() === "location"
                ? "bg-[var(--color-primary-button)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <MapPin class="w-5 h-5" />
            <span class="hidden sm:inline">Location Boundaries</span>
            <span class="sm:hidden">Location</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <Show when={activeTab() === "employees"}>
        <EmployeeManagement />
      </Show>
      <Show when={activeTab() === "wifi"}>
        <WiFiManagement />
      </Show>
      <Show when={activeTab() === "location"}>
        <LocationManagement />
      </Show>
    </div>
  );
};

export default Employee;