import { type Component, For, createSignal, onMount, Show } from "solid-js";
import {
  Plus,
  Search,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  MapPin,
  Edit,
  Save,
  Navigation,
} from "lucide-solid";

interface LocationBoundary {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const LocationBoundaries: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [locations, setLocations] = createSignal<LocationBoundary[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [filterStatus, setFilterStatus] = createSignal("all");
  const [editingId, setEditingId] = createSignal<string | null>(null);

  // Form state
  const [formData, setFormData] = createSignal({
    name: "",
    description: "",
    latitude: -6.200000,
    longitude: 106.816666,
    radius: 100,
    is_active: true,
  });

  // Edit form state
  const [editFormData, setEditFormData] = createSignal({
    name: "",
    description: "",
    latitude: 0,
    longitude: 0,
    radius: 100,
    is_active: true,
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";

  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/location-boundaries/all`);
      const result = await response.json();

      if (response.ok && result.success) {
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
        }));
        setLocations(mappedData);
      } else {
        setError(result.message || "Failed to fetch location boundaries");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchLocations();
    // Get current location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => {
          console.log("Geolocation error:", error);
        }
      );
    }
  });

  const createLocation = async () => {
    const data = formData();
    if (!data.name || !data.description) {
      setError("Please fill all required fields");
      return;
    }

    if (data.radius < 10 || data.radius > 10000) {
      setError("Radius must be between 10 and 10000 meters");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/location-boundaries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          is_active: data.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Location boundary berhasil ditambahkan");
        setShowAddModal(false);
        resetForm();
        fetchLocations();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to create location boundary");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async (locationId: string) => {
    const data = editFormData();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/location-boundaries/${locationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name.trim(),
          description: data.description.trim(),
          latitude: data.latitude,
          longitude: data.longitude,
          radius: data.radius,
          is_active: data.is_active,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Location boundary berhasil diupdate");
        setEditingId(null);
        fetchLocations();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to update location boundary");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLocationStatus = async (locationId: string, currentStatus: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/location-boundaries/${locationId}`, {
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
        setSuccess(`Location ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}`);
        fetchLocations();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to toggle location status");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteLocation = async (locationId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete location "${name}"?`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/location-boundaries/${locationId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Location boundary berhasil dihapus");
        fetchLocations();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to delete location boundary");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (location: LocationBoundary) => {
    setEditingId(location.id);
    setEditFormData({
      name: location.name,
      description: location.description,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius,
      is_active: location.is_active,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      latitude: -6.200000,
      longitude: 106.816666,
      radius: 100,
      is_active: true,
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
          setSuccess("Current location set!");
          setTimeout(() => setSuccess(null), 2000);
        },
        (error) => {
          setError("Failed to get current location: " + error.message);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  };

  const filteredLocations = () =>
    locations().filter((location) => {
      const matchesSearch =
        location.name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        location.description.toLowerCase().includes(searchTerm().toLowerCase());

      const matchesStatus =
        filterStatus() === "all" ||
        (filterStatus() === "active" && location.is_active) ||
        (filterStatus() === "inactive" && !location.is_active);

      return matchesSearch && matchesStatus;
    });

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-red-100 text-red-800 border-red-200";
  };

  const openInMaps = (lat: number, lon: number, name: string) => {
    window.open(`https://www.google.com/maps?q=${lat},${lon}&label=${encodeURIComponent(name)}`, "_blank");
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Location Boundaries
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Manage geofencing boundaries for attendance validation
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={fetchLocations}
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
            Add Location
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
              placeholder="Search by name or description..."
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

      {/* Locations Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading() && locations().length === 0 ? (
          <div class="col-span-full flex items-center justify-center py-12">
            <div class="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
              Loading locations...
            </div>
          </div>
        ) : (
          <For each={filteredLocations()}>
            {(location) => (
              <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-5 hover:shadow-md transition-all">
                <div class="flex justify-between items-start mb-4">
                  <div class="flex items-center gap-2">
                    <MapPin class="w-5 h-5 text-[var(--color-primary-button)]" />
                    <span
                      class={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(location.is_active)}`}
                    >
                      {location.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {editingId() === location.id ? (
                  <div class="space-y-3">
                    <input
                      type="text"
                      class="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
                      value={editFormData().name}
                      onInput={(e) =>
                        setEditFormData((prev) => ({ ...prev, name: e.currentTarget.value }))
                      }
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      class="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
                      value={editFormData().description}
                      onInput={(e) =>
                        setEditFormData((prev) => ({ ...prev, description: e.currentTarget.value }))
                      }
                      placeholder="Description"
                    />
                    <div class="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        step="0.000001"
                        class="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
                        value={editFormData().latitude}
                        onInput={(e) =>
                          setEditFormData((prev) => ({ ...prev, latitude: parseFloat(e.currentTarget.value) }))
                        }
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        step="0.000001"
                        class="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
                        value={editFormData().longitude}
                        onInput={(e) =>
                          setEditFormData((prev) => ({ ...prev, longitude: parseFloat(e.currentTarget.value) }))
                        }
                        placeholder="Longitude"
                      />
                    </div>
                    <input
                      type="number"
                      class="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
                      value={editFormData().radius}
                      onInput={(e) =>
                        setEditFormData((prev) => ({ ...prev, radius: parseInt(e.currentTarget.value) }))
                      }
                      placeholder="Radius (meters)"
                    />
                    <div class="flex gap-2">
                      <button
                        onClick={() => updateLocation(location.id)}
                        class="flex-1 flex items-center justify-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors font-medium"
                      >
                        <Save class="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        class="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        <X class="w-3 h-3" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div class="space-y-3">
                    <div>
                      <div class="text-lg font-bold text-[var(--color-text-primary)]">
                        {location.name}
                      </div>
                      <div class="text-sm text-[var(--color-text-secondary)]">
                        {location.description}
                      </div>
                    </div>

                    <div class="text-xs text-[var(--color-text-secondary)] space-y-1">
                      <div>Lat: {location.latitude.toFixed(6)}</div>
                      <div>Lon: {location.longitude.toFixed(6)}</div>
                      <div class="font-semibold text-[var(--color-primary-button)]">
                        Radius: {location.radius}m
                      </div>
                    </div>

                    <div class="flex gap-2 pt-3 border-t border-[var(--color-border)]">
                      <button
                        onClick={() => openInMaps(location.latitude, location.longitude, location.name)}
                        class="flex-1 flex items-center justify-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                      >
                        <Navigation class="w-3 h-3" />
                        Maps
                      </button>
                      <button
                        onClick={() => startEditing(location)}
                        class="flex-1 flex items-center justify-center gap-1 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-2 rounded-lg hover:bg-yellow-100 transition-colors font-medium"
                      >
                        <Edit class="w-3 h-3" />
                        Edit
                      </button>
                    </div>

                    <div class="flex gap-2">
                      <button
                        onClick={() => toggleLocationStatus(location.id, location.is_active)}
                        class={`flex-1 flex items-center justify-center gap-1 text-xs px-3 py-2 rounded-lg transition-colors font-medium ${
                          location.is_active
                            ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        }`}
                      >
                        {location.is_active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id, location.name)}
                        class="flex-1 flex items-center justify-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium"
                      >
                        <Trash2 class="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </For>
        )}

        {!isLoading() && filteredLocations().length === 0 && (
          <div class="col-span-full text-center py-12 text-[var(--color-text-secondary)]">
            No location boundaries found matching your criteria.
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Add New Location Boundary
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
                  Location Name *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Kantor Pusat Jakarta"
                  value={formData().name}
                  onInput={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.currentTarget.value }))
                  }
                />
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  placeholder="e.g., Gedung Kantor Utama"
                  value={formData().description}
                  onInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.currentTarget.value,
                    }))
                  }
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().latitude}
                    onInput={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        latitude: parseFloat(e.currentTarget.value),
                      }))
                    }
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().longitude}
                    onInput={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        longitude: parseFloat(e.currentTarget.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Radius (meters) *
                </label>
                <input
                  type="number"
                  min="10"
                  max="10000"
                  class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                  value={formData().radius}
                  onInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      radius: parseInt(e.currentTarget.value),
                    }))
                  }
                />
                <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Radius between 10 and 10000 meters
                </p>
              </div>

              <button
                onClick={getCurrentLocation}
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors font-medium"
              >
                <Navigation class="w-4 h-4" />
                Use Current Location
              </button>

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
                  Active (Enable geofencing for this location)
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
                onClick={createLocation}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Adding..." : "Add Location"}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default LocationBoundaries;
