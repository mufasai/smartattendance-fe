import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-solid";
import { wifiService } from "../services/wifiService";
import { ApiError } from "../utils/apiClient";

interface WiFiSetting {
  id: string;
  ssid: string;
  description: string;
  is_active: boolean;
}

const WiFiManagement: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [wifiSettings, setWifiSettings] = createSignal<WiFiSetting[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editingWiFi, setEditingWiFi] = createSignal<WiFiSetting | null>(null);

  const [formData, setFormData] = createSignal({
    ssid: "",
    description: "",
    is_active: true,
  });

  const [editFormData, setEditFormData] = createSignal({
    ssid: "",
    description: "",
    is_active: true,
  });

  const fetchWiFiSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await wifiService.getAll();
      const mappedData = data.map((item: any) => ({
        ...item,
        id: item.id?.id?.String || item.id?.id || item.id,
      }));
      setWifiSettings(mappedData);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to fetch WiFi settings");
      }
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchWiFiSettings();
  });

  const createWiFi = async () => {
    const data = formData();
    if (!data.ssid) {
      setError("SSID is required");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await wifiService.create({
        ssid: data.ssid.trim(),
        bssid: data.ssid.trim(),
      });

      setSuccess("WiFi setting created successfully");
      setShowAddModal(false);
      resetForm();
      fetchWiFiSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to create WiFi setting");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateWiFi = async () => {
    const wifi = editingWiFi();
    if (!wifi) return;

    const data = editFormData();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await wifiService.update(wifi.id, {
        ssid: data.ssid.trim(),
      });

      setSuccess("WiFi setting updated successfully");
      setShowEditModal(false);
      setEditingWiFi(null);
      fetchWiFiSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to update WiFi setting");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWiFi = async (id: string, ssid: string) => {
    if (!confirm(`Are you sure you want to delete WiFi "${ssid}"?`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await wifiService.delete(id);

      setSuccess("WiFi setting deleted successfully");
      fetchWiFiSettings();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to delete WiFi setting");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (wifi: WiFiSetting) => {
    setEditingWiFi(wifi);
    setEditFormData({
      ssid: wifi.ssid,
      description: wifi.description,
      is_active: wifi.is_active,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      ssid: "",
      description: "",
      is_active: true,
    });
  };

  const filteredWiFi = () =>
    wifiSettings().filter((wifi) =>
      wifi.ssid.toLowerCase().includes(searchTerm().toLowerCase()) ||
      wifi.description.toLowerCase().includes(searchTerm().toLowerCase())
    );

  return (
    <div class="space-y-6">
      {/* Header Actions */}
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-bold text-[var(--color-text-primary)]">WiFi Settings</h3>
          <p class="text-sm text-[var(--color-text-secondary)] mt-1">
            Manage WiFi networks for attendance validation
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={() => fetchWiFiSettings()}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
          >
            <Plus class="w-5 h-5" />
            Add WiFi
          </button>
        </div>
      </div>

      {/* Search */}
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)]">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
            placeholder="Search WiFi networks..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
      </div>

      {/* Messages */}
      {success() && (
        <div class="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-200 flex items-center gap-2">
          <CheckCircle class="w-5 h-5" />
          {success()}
        </div>
      )}

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2">
          <XCircle class="w-5 h-5" />
          {error()}
        </div>
      )}

      {/* WiFi Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <For each={filteredWiFi()}>
          {(wifi) => (
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  {wifi.is_active ? (
                    <div class="p-3 bg-blue-100 rounded-xl">
                      <Wifi class="w-6 h-6 text-blue-600" />
                    </div>
                  ) : (
                    <div class="p-3 bg-gray-100 rounded-xl">
                      <WifiOff class="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h4 class="font-bold text-[var(--color-text-primary)]">{wifi.ssid}</h4>
                    <span
                      class={`text-xs px-2 py-1 rounded-full ${
                        wifi.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {wifi.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-[var(--color-text-secondary)] mb-4">
                {wifi.description || "No description"}
              </p>
              <div class="flex gap-2">
                <button
                  onClick={() => startEditing(wifi)}
                  class="flex-1 flex items-center justify-center gap-2 text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] bg-[var(--color-light-gray)] border border-[var(--color-border)] px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 class="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteWiFi(wifi.id, wifi.ssid)}
                  class="flex-1 flex items-center justify-center gap-2 text-red-600 hover:bg-red-100 bg-red-50 border border-red-200 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                >
                  <Trash2 class="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </For>
      </div>

      {!isLoading() && filteredWiFi().length === 0 && (
        <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-12 text-center">
          <Wifi class="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p class="text-[var(--color-text-secondary)]">No WiFi settings found</p>
        </div>
      )}

      {/* Add Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">Add WiFi Setting</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setError(null);
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  SSID (WiFi Name) *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Office-WiFi"
                  value={formData().ssid}
                  onInput={(e) => setFormData((prev) => ({ ...prev, ssid: e.currentTarget.value }))}
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Main office WiFi network"
                  rows="3"
                  value={formData().description}
                  onInput={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.currentTarget.value }))
                  }
                />
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active_create"
                  class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                  checked={formData().is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, is_active: e.currentTarget.checked }))
                  }
                />
                <label for="is_active_create" class="text-sm font-medium text-[var(--color-text-primary)]">
                  Active
                </label>
              </div>
            </div>

            <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                  setError(null);
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={createWiFi}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Creating..." : "Create WiFi"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Modal */}
      <Show when={showEditModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Edit WiFi: {editingWiFi()?.ssid}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWiFi(null);
                  setError(null);
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  SSID (WiFi Name) *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Office-WiFi"
                  value={editFormData().ssid}
                  onInput={(e) =>
                    setEditFormData((prev) => ({ ...prev, ssid: e.currentTarget.value }))
                  }
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description
                </label>
                <textarea
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Main office WiFi network"
                  rows="3"
                  value={editFormData().description}
                  onInput={(e) =>
                    setEditFormData((prev) => ({ ...prev, description: e.currentTarget.value }))
                  }
                />
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active_edit"
                  class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                  checked={editFormData().is_active}
                  onChange={(e) =>
                    setEditFormData((prev) => ({ ...prev, is_active: e.currentTarget.checked }))
                  }
                />
                <label for="is_active_edit" class="text-sm font-medium text-[var(--color-text-primary)]">
                  Active
                </label>
              </div>
            </div>

            <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingWiFi(null);
                  setError(null);
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateWiFi}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Updating..." : "Update WiFi"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default WiFiManagement;
