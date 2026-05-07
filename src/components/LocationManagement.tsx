import { type Component, For, createSignal, createEffect, onMount, onCleanup, Show } from "solid-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon path for Vite
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;
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
  Maximize,
  Minimize,
} from "lucide-solid";
import { locationService } from "../services/locationService";
import { ApiError } from "../utils/apiClient";

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

const MapPicker: Component<{
  lat: number;
  lng: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
}> = (props) => {
  const [isFullscreen, setIsFullscreen] = createSignal(false);
  let mapContainer!: HTMLDivElement;
  let map: L.Map;
  let marker: L.Marker;
  let circle: L.Circle;

  onMount(() => {
    map = L.map(mapContainer).setView([props.lat, props.lng], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    marker = L.marker([props.lat, props.lng], { draggable: true }).addTo(map);
    circle = L.circle([props.lat, props.lng], {
      radius: props.radius,
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    marker.on("dragend", (e) => {
      const position = marker.getLatLng();
      props.onLocationChange(position.lat, position.lng);
    });

    let isMounted = true;

    // Fix map rendering issues inside modals
    setTimeout(() => {
      if (isMounted && map) {
        try {
          map.invalidateSize();
        } catch (e) {}
      }
    }, 100);

    onCleanup(() => {
      isMounted = false;
      if (map) {
        map.remove();
      }
    });
  });

  createEffect(() => {
    if (marker && circle && map) {
      const latlng = L.latLng(props.lat, props.lng);
      marker.setLatLng(latlng);
      circle.setLatLng(latlng);
      circle.setRadius(props.radius);
      // Smoothly pan to new location if it changes
      map.panTo(latlng);
    }
  });

  createEffect(() => {
    let active = true;
    // When isFullscreen toggles, we need to invalidate the map size
    // after the CSS transition completes to prevent rendering bugs
    if (isFullscreen() || !isFullscreen()) {
      setTimeout(() => {
        if (active && map) {
          try {
            map.invalidateSize();
          } catch (e) {}
        }
      }, 300);
    }
    onCleanup(() => {
      active = false;
    });
  });

  return (
    <div class={`transition-all duration-300 ${isFullscreen() ? "fixed inset-4 sm:inset-12 z-[9999] bg-gray-50 rounded-2xl shadow-2xl p-2 flex flex-col border border-gray-300" : "relative w-full h-64 sm:h-80"}`}>
      <div ref={mapContainer} class={`w-full h-full rounded-xl border border-[var(--color-border)] z-10 shadow-inner ${isFullscreen() ? "flex-1" : ""}`} />
      
      <button 
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setIsFullscreen(!isFullscreen());
        }}
        class="absolute top-4 right-4 z-[1000] bg-white p-2.5 rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors"
        title={isFullscreen() ? "Exit full screen" : "Full screen map"}
      >
        {isFullscreen() ? <Minimize class="w-5 h-5"/> : <Maximize class="w-5 h-5"/>}
      </button>

      {isFullscreen() && (
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-6 py-3 rounded-2xl shadow-lg border border-gray-200 text-sm font-semibold text-gray-800 flex items-center gap-3">
          <MapPin class="w-5 h-5 text-blue-600" />
          Drag the blue marker to pinpoint the exact location
        </div>
      )}
    </div>
  );
};

const StaticMiniMap: Component<{ lat: number; lng: number; radius: number }> = (props) => {
  let mapContainer!: HTMLDivElement;
  let map: L.Map;

  onMount(() => {
    map = L.map(mapContainer, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([props.lat, props.lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    L.marker([props.lat, props.lng]).addTo(map);
    L.circle([props.lat, props.lng], {
      radius: props.radius,
      color: "#10b981", // green-500
      fillColor: "#10b981",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(map);

    onCleanup(() => {
      map.remove();
    });
  });

  return <div ref={mapContainer} class="w-full h-32 rounded-lg border border-[var(--color-border)] z-0 pointer-events-none mt-2 shadow-inner" />;
};

const LocationManagement: Component = () => {
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

  const fetchLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await locationService.getAll();
      const mappedData = data.map((item: any) => ({
        ...item,
        id: item.id?.id?.String || item.id?.id || item.id,
      }));
      setLocations(mappedData);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to fetch location boundaries");
      }
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
      await locationService.create({
        name: data.name.trim(),
        description: data.description.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius,
        is_active: data.is_active,
      });

      setSuccess("Location boundary created successfully");
      setShowAddModal(false);
      resetForm();
      fetchLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to create location boundary");
      }
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
      await locationService.update(locationId, {
        name: data.name.trim(),
        description: data.description.trim(),
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius,
        is_active: data.is_active,
      });

      setSuccess("Location boundary updated successfully");
      setEditingId(null);
      fetchLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to update location boundary");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLocationStatus = async (locationId: string, currentStatus: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await locationService.update(locationId, {
        is_active: !currentStatus,
      });

      setSuccess(`Location ${!currentStatus ? "activated" : "deactivated"}`);
      fetchLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to toggle location status");
      }
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
      await locationService.delete(locationId);

      setSuccess("Location boundary deleted successfully");
      fetchLocations();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err.message || "Failed to delete location boundary");
      }
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
      {/* Header Actions */}
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-xl font-bold text-[var(--color-text-primary)]">Location Boundaries</h3>
          <p class="text-sm text-[var(--color-text-secondary)] mt-1">
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
                    <div class="p-3 bg-green-100 rounded-xl">
                      <MapPin class="w-5 h-5 text-green-600" />
                    </div>
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
                    <MapPicker
                      lat={editFormData().latitude}
                      lng={editFormData().longitude}
                      radius={editFormData().radius}
                      onLocationChange={(lat, lng) => setEditFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
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

                    <div class="text-xs text-[var(--color-text-secondary)] bg-gray-50 p-2 rounded-xl">
                      <StaticMiniMap lat={location.latitude} lng={location.longitude} radius={location.radius} />
                      <div class="mt-2 text-center font-semibold text-[var(--color-primary-button)]">
                        Radius: {location.radius}m
                      </div>
                    </div>

                    <div class="flex gap-2">
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
          <div class="col-span-full bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-12 text-center">
            <MapPin class="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p class="text-[var(--color-text-secondary)]">No location boundaries found</p>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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
                  placeholder="e.g., Main Office Jakarta"
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
                  placeholder="e.g., Main office building"
                  value={formData().description}
                  onInput={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.currentTarget.value,
                    }))
                  }
                />
              </div>

              <div class="mb-2 pt-2 border-t border-[var(--color-border)]">
                <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                  Location Map
                </label>
                <p class="text-xs text-[var(--color-text-secondary)] mb-3">
                  Drag the blue marker to pinpoint the location. The circle shows your coverage area.
                </p>
                <MapPicker
                  lat={formData().latitude}
                  lng={formData().longitude}
                  radius={formData().radius}
                  onLocationChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
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

export default LocationManagement;
