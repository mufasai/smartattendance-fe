import { type Component, createSignal, Show } from "solid-js";
import { Wifi, MapPin } from "lucide-solid";
import WiFiSettings from "./WiFiSettings";
import LocationSettings from "./LocationSettings";

const AttendanceConfiguration: Component = () => {
  const [activeSubTab, setActiveSubTab] = createSignal<"wifi" | "location">("wifi");

  return (
    <div class="space-y-6">
      {/* Sub Tabs */}
      <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-2">
        <div class="flex gap-2">
          <button
            onClick={() => setActiveSubTab("wifi")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSubTab() === "wifi"
                ? "bg-[var(--color-primary-button)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <Wifi class="w-4 h-4" />
            WiFi Networks
          </button>
          <button
            onClick={() => setActiveSubTab("location")}
            class={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeSubTab() === "location"
                ? "bg-[var(--color-primary-button)] text-white shadow-sm"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)]"
            }`}
          >
            <MapPin class="w-4 h-4" />
            Location Boundaries
          </button>
        </div>
      </div>

      {/* Content */}
      <Show when={activeSubTab() === "wifi"}>
        <WiFiSettings />
      </Show>
      <Show when={activeSubTab() === "location"}>
        <LocationSettings />
      </Show>
    </div>
  );
};

export default AttendanceConfiguration;
