import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Edit,
  Save,
} from "lucide-solid";

interface WiFiSetting {
  id: string;
  ssid: string;
  description: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const WiFiManagement: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [wifiList, setWifiList] = createSignal<WiFiSetting[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filterStatus, setFilterStatus] = createSignal("all");
  const [editingId, setEditingId] = createSignal<string | null>(null);

  // Form state
  const [formData, setFormData] = createSignal({
    ssid: "",
    description: "",
    is_active: true,
  });

  // Edit form state
  const [editFormData, setEditFormData] = createSignal({
    description: "",
    is_active: true,
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";

  const fetchWiFiSettings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/wifi-settings/all`);
      const result = await response.json();

      if (response.ok && result.success) {
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
        }));
        setWifiList(mappedData);
      } else {
        setError(result.message || "Failed to fetch WiFi settings");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchWiFiSettings();
  });

  const createWiFi = async () => {
    const data = formData();
    if (!data.ssid || !data.description) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/wifi-settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ssid: data.ssid.trim(),
          description: data.description.trim(),
          is_active: data.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("WiFi berhasil ditambahkan");
        setShowAddModal(false);
        resetForm();
        fetchWiFiSettings();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to create WiFi setting");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateWiFi = async (wifiId: string) => {
    const data = editFormData();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/wifi-settings/${wifiId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: data.description.trim(),
          is_active: data.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("WiFi berhasil diupdate");
        setEditingId(null);
        fetchWiFiSettings();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to update WiFi setting");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWiFiStatus = async (wifiId: string, currentStatus: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/wifi-settings/${wifiId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(`WiFi ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
        fetchWiFiSettings();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to toggle WiFi status");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWiFi = async (wifiId: string, ssid: string) => {
    if (!confirm(`Are you sure you want to delete WiFi "${ssid}"?`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/wifi-settings/${wifiId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("WiFi berhasil dihapus");
        fetchWiFiSettings();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to delete WiFi setting");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (wifi: WiFiSetting) => {
    setEditingId(wifi.id);
    setEditFormData({
      description: wifi.description,
      is_active: wifi.is_active,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      ssid: "",
      description: "",
      is_active: true,
    });
  };

  const filteredWiFi = () =>
    wifiList().filter((wifi) => {
      const matchesSearch =
        wifi.ssid.toLowerCase().includes(searchTerm().toLowerCase()) ||
        wifi.description.toLowerCase().includes(searchTerm().toLowerCase());

      const matchesStatus =
        filterStatus() === "all" ||
        (filterStatus() === "active" && wifi.is_active) ||
        (filterStatus() === "inactive" && !wifi.is_active);

      return matchesSearch && matchesStatus;
    });

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <Wifi class="w-4 h-4" />
    ) : (
      <WifiOff class="w-4 h-4" />
    );
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            WiFi Management
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Manage allowed WiFi networks for attendance
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={fetchWiFiSettings}
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

      {/* Filters & Search */}
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] space-y-4">
        <div class="flex flex-col lg:flex-row gap-4">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
            </div>
            <input
              type="text"
              class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
              placeholder="Search by SSID or description..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
            />
          </div>

          <div class="flex gap-2">
            <select
              class="block pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
              value={filterStatus()}
              onChange={(e) => setFilterStatus(e.currentTarget.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success() && (
        <div class="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-200 flex items-center gap-2">
          <CheckCircle class="w-5 h-5" />
          {success()}
        </div>
      )}

      {/* Error Message */}
      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200 flex items-center gap-2">
          <XCircle class="w-5 h-5" />
          {error()}
        </div>
      )}

      {/* WiFi Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-[var(--color-light-gray)]/50 border-b border-[var(--color-border)]">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  SSID
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Description
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Created At
                </th>
                <th class="px-6 py-4 text-right text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              {isLoading() && wifiList().length === 0 ? (
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center">
                    <div class="flex items-center justify-center gap-2 text-[var(--color-text-secondary)]">
                      <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
                      Loading WiFi settings...
                    </div>
                  </td>
                </tr>
              ) : (
                <For each={filteredWiFi()}>
                  {(wifi) => (
                    <tr class="hover:bg-[var(--color-light-gray)]/30 transition-colors">
                      <td class="px-6 py-4">
                        <div class="flex items-center gap-2">
                          {getStatusIcon(wifi.is_active)}
                          <span class="font-semibold text-[var(--color-text-primary)]">
                            {wifi.ssid}
                          </span>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        {editingId() === wifi.id ? (
                          <input
                            type="text"
                            class="w-full px-3 py-1.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm"
                            value={editFormData().description}
                            onInput={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                description: e.currentTarget.value,
                              }))
                            }
                          />
                        ) : (
                          <span class="text-sm text-[var(--color-text-secondary)]">
                            {wifi.description}
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-4">
                        {editingId() === wifi.id ? (
                          <select
                            class="px-3 py-1.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm"
                            value={editFormData().is_active ? "active" : "inactive"}
                            onChange={(e) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                is_active: e.currentTarget.value === "active",
                              }))
                            }
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span
                            class={`inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(wifi.is_active)}`}
                          >
                            {wifi.is_active ? "Active" : "Inactive"}
                          </span>
                        )}
                      </td>
                      <td class="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                        {wifi.created_at
                          ? new Date(wifi.created_at).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center justify-end gap-2">
                          {editingId() === wifi.id ? (
                            <>
                              <button
                                onClick={() => updateWiFi(wifi.id)}
                                disabled={isLoading()}
                                class="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium disabled:opacity-50"
                              >
                                <Save class="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={cancelEditing}
                                class="flex items-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                              >
                                <X class="w-3 h-3" />
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(wifi)}
                                class="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                              >
                                <Edit class="w-3 h-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleWiFiStatus(wifi.id, wifi.is_active)}
                                disabled={isLoading()}
                                class={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium disabled:opacity-50 ${
                                  wifi.is_active
                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                    : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                }`}
                              >
                                {wifi.is_active ? (
                                  <>
                                    <WifiOff class="w-3 h-3" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Wifi class="w-3 h-3" />
                                    Enable
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => deleteWiFi(wifi.id, wifi.ssid)}
                                disabled={isLoading()}
                                class="flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                              >
                                <Trash2 class="w-3 h-3" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              )}

              {!isLoading() && filteredWiFi().length === 0 && (
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                    No WiFi settings found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add WiFi Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Add New WiFi
              </h3>
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
                  placeholder="e.g., KANTOR-WIFI"
                  value={formData().ssid}
                  onInput={(e) =>
                    setFormData((prev) => ({ ...prev, ssid: e.currentTarget.value }))
                  }
                />
                <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Enter the exact WiFi network name (case-sensitive)
                </p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., WiFi Kantor Utama"
                  value={formData().description}
                  onInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.currentTarget.value,
                    }))
                  }
                />
              </div>

              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                  checked={formData().is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_active: e.currentTarget.checked,
                    }))
                  }
                />
                <label
                  for="is_active"
                  class="text-sm font-medium text-[var(--color-text-primary)]"
                >
                  Active (Allow attendance with this WiFi)
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
                {isLoading() ? "Adding..." : "Add WiFi"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default WiFiManagement;
