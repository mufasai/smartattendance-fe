import { type Component, For, createSignal, onMount } from "solid-js";
import { Download, Search, Calendar, RefreshCw } from "lucide-solid";

interface AttendanceLog {
  id: string;
  employee_id: string;
  date: string | null;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  location: string | null;
}

const Attendance: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [logs, setLogs] = createSignal<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const BASE_URL = "http://127.0.0.1:8080/api";

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/attendance/logs`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
          employee_id:
            item.employee_id?.id?.String ||
            item.employee_id?.id ||
            item.employee_id ||
            "Unknown",
        }));
        setLogs(mappedData);
      } else {
        setError(result.message || "Failed to fetch attendance logs");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchAttendance();
  });

  const filteredAttendance = () =>
    logs().filter((record) =>
      record.employee_id.toLowerCase().includes(searchTerm().toLowerCase()),
    );

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "present":
      case "on time":
        return "bg-green-100 text-green-800 border border-green-200";
      case "late":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "working":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "absent":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-[var(--color-light-gray)] text-[var(--color-text-secondary)] border border-[var(--color-border)]";
    }
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return isoString;
    }
  };

  const formatDate = (isoString: string | null) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Attendance Logs
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Monitor employee daily attendance
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={fetchAttendance}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium text-sm">
            <Download class="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div class="relative w-full lg:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
            placeholder="Search by Employee ID..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>

        <div class="flex flex-wrap gap-3 w-full lg:w-auto">
          <div class="relative flex-1 sm:flex-none">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar class="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </div>
            <input
              type="date"
              class="block w-full pl-10 pr-3 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[var(--color-text-primary)] font-medium"
              value={new Date().toISOString().split("T")[0]}
            />
          </div>
          <select class="flex-1 sm:flex-none block pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Human Resources</option>
            <option>Finance</option>
          </select>
          <select class="flex-1 sm:flex-none block pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium">
            <option>All Status</option>
            <option>Present</option>
            <option>Late</option>
            <option>Absent</option>
          </select>
        </div>
      </div>

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
          {error()}
        </div>
      )}

      {/* Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--color-border)]">
            <thead class="bg-[var(--color-light-gray)]/50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Employee
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Date
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Check In
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Check Out
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-[var(--color-border)]">
              {isLoading() && logs().length === 0 ? (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
                      Loading attendance data...
                    </div>
                  </td>
                </tr>
              ) : (
                <For each={filteredAttendance()}>
                  {(record) => (
                    <tr class="hover:bg-[var(--color-light-gray)]/30 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)] font-bold text-sm shadow-inner">
                              {record.employee_id.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-semibold text-[var(--color-text-primary)]">
                              EMP-{record.employee_id.substring(0, 4)}
                            </div>
                            <div class="text-[10px] text-[var(--color-text-tertiary)] uppercase mt-0.5">
                              {record.employee_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-[var(--color-text-primary)]">
                          {formatDate(record.date)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-[var(--color-primary-button)] bg-[var(--color-secondary-bg)]/50 inline-block px-2.5 py-1 rounded-lg">
                          {formatTime(record.check_in)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-bold text-[var(--color-text-primary)] bg-[var(--color-light-gray)] inline-block px-2.5 py-1 rounded-lg border border-[var(--color-border)]">
                          {formatTime(record.check_out)}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-[var(--color-text-secondary)] font-medium">
                          {record.location || "Office"}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm capitalize ${getStatusColor(
                            record.status,
                          )}`}
                        >
                          {record.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  )}
                </For>
              )}
              {!isLoading() && filteredAttendance().length === 0 && (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    No attendance records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div class="bg-white px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-between sm:px-6">
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-[var(--color-text-secondary)]">
                Showing{" "}
                <span class="font-medium text-[var(--color-text-primary)]">
                  1
                </span>{" "}
                to{" "}
                <span class="font-medium text-[var(--color-text-primary)]">
                  {filteredAttendance().length}
                </span>{" "}
                of{" "}
                <span class="font-medium text-[var(--color-text-primary)]">
                  {logs().length}
                </span>{" "}
                results
              </p>
            </div>
            <div>
              <nav
                class="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button class="relative inline-flex items-center px-3 py-2 rounded-l-lg border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)] transition-colors">
                  Previous
                </button>
                <button class="relative inline-flex items-center px-4 py-2 border border-[var(--color-primary-button)] bg-[var(--color-secondary-bg)] text-sm font-bold text-[var(--color-primary-button)] z-10">
                  1
                </button>
                <button class="relative inline-flex items-center px-3 py-2 rounded-r-lg border border-[var(--color-border)] bg-white text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)] transition-colors">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
