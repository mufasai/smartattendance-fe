// Additional Modals for Employee Management
// This file contains Bulk Attendance and Import Preview modals
// To be imported and used in EmployeeManagement.tsx

import { type Component, For, Show, createSignal } from "solid-js";
import { X, Wifi, MapPin, Scan, Fingerprint, Upload, CheckCircle, XCircle } from "lucide-solid";

// These would be props passed from parent component
export interface BulkAttendanceModalProps {
  show: boolean;
  onClose: () => void;
  selectedCount: number;
  wifiSettings: any[];
  locationBoundaries: any[];
  bulkData: any;
  setBulkData: (data: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  onFileUpload: (e: Event) => void;
  importPreview: any[];
  onImport: () => void;
  isLoading: boolean;
}

// Bulk Attendance Modal Component
export const BulkAttendanceModal: Component<BulkAttendanceModalProps> = (props) => {
  const toggleWiFiSSID = (ssid: string) => {
    const current = props.bulkData.wifi_ssids || [];
    const updated = current.includes(ssid)
      ? current.filter((s: string) => s !== ssid)
      : [...current, ssid];
    props.setBulkData({ ...props.bulkData, wifi_ssids: updated });
  };

  const toggleLocationBoundary = (locationId: string) => {
    const current = props.bulkData.location_boundaries || [];
    const updated = current.includes(locationId)
      ? current.filter((l: string) => l !== locationId)
      : [...current, locationId];
    props.setBulkData({ ...props.bulkData, location_boundaries: updated });
  };

  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Set Attendance Requirements
              </h3>
              <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                Apply to {props.selectedCount} selected employees
              </p>
            </div>
            <button
              onClick={props.onClose}
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            {/* WiFi Validation */}
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bulk_wifi"
                  class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                  checked={props.bulkData.wifi_enabled}
                  onChange={(e) =>
                    props.setBulkData({ ...props.bulkData, wifi_enabled: e.currentTarget.checked })
                  }
                />
                <label for="bulk_wifi" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <Wifi class="w-5 h-5 text-blue-600" />
                  WiFi Validation
                </label>
              </div>

              <Show when={props.bulkData.wifi_enabled}>
                <div class="ml-7 space-y-2">
                  <p class="text-xs text-[var(--color-text-secondary)]">Select allowed WiFi networks:</p>
                  <div class="flex flex-wrap gap-2">
                    <For each={props.wifiSettings}>
                      {(wifi) => (
                        <button
                          type="button"
                          onClick={() => toggleWiFiSSID(wifi.ssid)}
                          class={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            props.bulkData.wifi_ssids?.includes(wifi.ssid)
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {wifi.ssid}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>

            {/* Location Validation */}
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="bulk_location"
                  class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                  checked={props.bulkData.location_enabled}
                  onChange={(e) =>
                    props.setBulkData({ ...props.bulkData, location_enabled: e.currentTarget.checked })
                  }
                />
                <label for="bulk_location" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                  <MapPin class="w-5 h-5 text-green-600" />
                  Location Boundary Validation
                </label>
              </div>

              <Show when={props.bulkData.location_enabled}>
                <div class="ml-7 space-y-2">
                  <p class="text-xs text-[var(--color-text-secondary)]">Select allowed locations:</p>
                  <div class="flex flex-wrap gap-2">
                    <For each={props.locationBoundaries}>
                      {(location) => (
                        <button
                          type="button"
                          onClick={() => toggleLocationBoundary(location.id)}
                          class={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                            props.bulkData.location_boundaries?.includes(location.id)
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {location.name}
                        </button>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </div>

            {/* Face Recognition */}
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="bulk_face"
                class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                checked={props.bulkData.face_recognition_enabled}
                onChange={(e) =>
                  props.setBulkData({ ...props.bulkData, face_recognition_enabled: e.currentTarget.checked })
                }
              />
              <label for="bulk_face" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Scan class="w-5 h-5 text-purple-600" />
                Face Recognition
              </label>
            </div>

            {/* Fingerprint */}
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                id="bulk_fingerprint"
                class="w-4 h-4 text-[var(--color-primary-button)] border-[var(--color-border)] rounded focus:ring-2 focus:ring-[var(--color-accent)]"
                checked={props.bulkData.fingerprint_enabled}
                onChange={(e) =>
                  props.setBulkData({ ...props.bulkData, fingerprint_enabled: e.currentTarget.checked })
                }
              />
              <label for="bulk_fingerprint" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                <Fingerprint class="w-5 h-5 text-orange-600" />
                Fingerprint Validation
              </label>
            </div>
          </div>

          <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
            <button
              onClick={props.onClose}
              class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={props.onSubmit}
              disabled={props.isLoading}
              class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
            >
              {props.isLoading ? "Applying..." : `Apply to ${props.selectedCount} Employees`}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Import Preview Modal Component
export const ImportPreviewModal: Component<ImportModalProps> = (props) => {
  return (
    <Show when={props.show}>
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
            <div>
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Import Employees from Excel
              </h3>
              <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                Upload an Excel file with employee data
              </p>
            </div>
            <button
              onClick={props.onClose}
              class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            {/* File Upload */}
            <div>
              <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                Select Excel File
              </label>
              <div class="flex items-center gap-4">
                <label class="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[var(--color-border)] rounded-xl hover:border-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] transition-colors cursor-pointer">
                  <Upload class="w-5 h-5 text-[var(--color-primary-button)]" />
                  <span class="text-sm font-medium text-[var(--color-text-primary)]">
                    Choose Excel File (.xlsx, .xls)
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    class="hidden"
                    onChange={props.onFileUpload}
                  />
                </label>
              </div>
              <p class="mt-2 text-xs text-[var(--color-text-secondary)]">
                Download the template first to ensure correct format
              </p>
            </div>

            {/* Preview */}
            <Show when={props.importPreview.length > 0}>
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-bold text-[var(--color-text-primary)]">
                    Preview (First 5 rows)
                  </h4>
                  <span class="text-sm text-[var(--color-text-secondary)]">
                    Total: {props.importPreview.length} employees
                  </span>
                </div>
                <div class="border border-[var(--color-border)] rounded-xl overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-[var(--color-border)]">
                      <thead class="bg-[var(--color-light-gray)]/50">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase">NIK</th>
                          <th class="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase">Name</th>
                          <th class="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase">Email</th>
                          <th class="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase">Department</th>
                          <th class="px-4 py-3 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-[var(--color-border)]">
                        <For each={props.importPreview.slice(0, 5)}>
                          {(row: any) => (
                            <tr class="hover:bg-[var(--color-light-gray)]/30">
                              <td class="px-4 py-3 text-sm text-[var(--color-text-primary)]">{row.NIK || row.nik}</td>
                              <td class="px-4 py-3 text-sm text-[var(--color-text-primary)]">{row["Full Name"] || row.full_name}</td>
                              <td class="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{row.Email || row.email}</td>
                              <td class="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{row.Department || row.department}</td>
                              <td class="px-4 py-3 text-sm">
                                <span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                  {row.Status || row.status || "Active"}
                                </span>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
                <Show when={props.importPreview.length > 5}>
                  <p class="mt-2 text-xs text-[var(--color-text-secondary)] text-center">
                    ... and {props.importPreview.length - 5} more employees
                  </p>
                </Show>
              </div>
            </Show>
          </div>

          <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
            <button
              onClick={props.onClose}
              class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={props.onImport}
              disabled={props.isLoading || props.importPreview.length === 0}
              class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {props.isLoading ? "Importing..." : `Import ${props.importPreview.length} Employees`}
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
};
