import { type Component, For, createSignal, onMount } from "solid-js";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  MoreVertical,
  RefreshCw,
} from "lucide-solid";

interface Employee {
  id: string;
  nik: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  status: string | null;
}

const Employee: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [employees, setEmployees] = createSignal<Employee[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const BASE_URL = "http://127.0.0.1:8080/api";

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/employees`);
      const result = await response.json();

      if (response.ok && result.status === "success") {
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
          department: item.department || "General",
          status: item.status || "Active",
        }));
        setEmployees(mappedData);
      } else {
        setError(result.message || "Failed to fetch employees");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchEmployees();
  });

  const filteredEmployees = () =>
    employees().filter(
      (emp) =>
        emp.full_name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchTerm().toLowerCase()) ||
        (emp.department &&
          emp.department.toLowerCase().includes(searchTerm().toLowerCase())),
    );

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Employee Management
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Manage your company's workforce
          </p>
        </div>
        <div class="flex gap-2">
          <button
            onClick={fetchEmployees}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium">
            <Plus class="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
            placeholder="Search employees by name, NIK, or department..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select class="block w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Marketing</option>
            <option>Human Resources</option>
            <option>Finance</option>
          </select>
          <select class="block w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium">
            <option>All Status</option>
            <option>Active</option>
            <option>On Leave</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
          {error()}
        </div>
      )}

      {/* Employee Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--color-border)]">
            <thead class="bg-[var(--color-light-gray)]/50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Employee Info
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Employee ID (NIK)
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Department & Role
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-right text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-[var(--color-border)]">
              {isLoading() && employees().length === 0 ? (
                <tr>
                  <td
                    colspan="5"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
                      Loading employees...
                    </div>
                  </td>
                </tr>
              ) : (
                <For each={filteredEmployees()}>
                  {(employee) => (
                    <tr class="hover:bg-[var(--color-light-gray)]/30 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <div class="flex-shrink-0 h-10 w-10">
                            <div class="h-10 w-10 rounded-full bg-[var(--color-secondary-bg)] flex items-center justify-center text-[var(--color-primary-button)] font-bold text-sm shadow-inner">
                              {employee.full_name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div class="ml-4">
                            <div class="text-sm font-semibold text-[var(--color-text-primary)]">
                              {employee.full_name}
                            </div>
                            <div class="text-xs text-[var(--color-text-secondary)] mt-0.5">
                              {employee.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-[var(--color-text-primary)] font-semibold">
                          {employee.nik}
                        </div>
                        <div class="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide mt-0.5">
                          ID: {employee.id.substring(0, 8)}...
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-[var(--color-text-primary)] font-medium">
                          {employee.department}
                        </div>
                        <div class="text-xs text-[var(--color-text-secondary)] mt-0.5 capitalize">
                          {employee.role}
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span
                          class={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                            employee.status === "Active"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : employee.status === "On Leave"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div class="flex items-center justify-end gap-2">
                          <button class="text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] bg-[var(--color-light-gray)] border border-[var(--color-border)] p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button class="text-red-600 hover:bg-red-100 bg-red-50 border border-red-200 p-2 rounded-lg transition-colors shadow-sm active:scale-95">
                            <Trash2 class="w-4 h-4" />
                          </button>
                          <button class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2">
                            <MoreVertical class="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              )}
              {!isLoading() && filteredEmployees().length === 0 && (
                <tr>
                  <td
                    colspan="5"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    No employees found matching your criteria.
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
                  {filteredEmployees().length}
                </span>{" "}
                of{" "}
                <span class="font-medium text-[var(--color-text-primary)]">
                  {employees().length}
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

export default Employee;
