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
  MapPin,
  Scan,
  Fingerprint,
  Upload,
  Download,
  CheckSquare,
  Square,
  Settings,
} from "lucide-solid";
import * as XLSX from 'xlsx';

interface AttendanceRequirement {
  wifi_enabled: boolean;
  wifi_ssids: string[] | null;
  location_enabled: boolean;
  location_boundaries: string[] | null;
  face_recognition_enabled: boolean;
  fingerprint_enabled: boolean;
}

interface Employee {
  id: string;
  nik: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  status: string | null;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  hire_date?: string;
  position?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  attendance_requirement: AttendanceRequirement | null;
  created_at?: string;
  updated_at?: string;
}

interface WiFiSetting {
  id: string;
  ssid: string;
  description: string;
  is_active: boolean;
}

interface LocationBoundary {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  radius: number;
  is_active: boolean;
}

const EmployeeManagement: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [employees, setEmployees] = createSignal<Employee[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const [showAddModal, setShowAddModal] = createSignal(false);
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [editingEmployee, setEditingEmployee] = createSignal<Employee | null>(null);
  const [filterDepartment, setFilterDepartment] = createSignal("all");
  const [filterStatus, setFilterStatus] = createSignal("all");
  
  // Bulk operations
  const [selectedEmployees, setSelectedEmployees] = createSignal<Set<string>>(new Set());
  const [showBulkAttendanceModal, setShowBulkAttendanceModal] = createSignal(false);
  const [bulkAttendanceData, setBulkAttendanceData] = createSignal({
    wifi_enabled: false,
    wifi_ssids: [] as string[],
    location_enabled: false,
    location_boundaries: [] as string[],
    face_recognition_enabled: false,
    fingerprint_enabled: false,
  });
  
  // Excel import/export
  const [showImportModal, setShowImportModal] = createSignal(false);
  const [importFile, setImportFile] = createSignal<File | null>(null);
  const [importPreview, setImportPreview] = createSignal<any[]>([]);

  // WiFi and Location data
  const [wifiSettings, setWifiSettings] = createSignal<WiFiSetting[]>([]);
  const [locationBoundaries, setLocationBoundaries] = createSignal<LocationBoundary[]>([]);

  // Form state for create
  const [formData, setFormData] = createSignal({
    nik: "",
    full_name: "",
    email: "",
    password: "",
    role: "employee",
    department: "General",
    status: "Active",
    phone: "",
    address: "",
    date_of_birth: "",
    hire_date: "",
    position: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  // Form state for edit
  const [editFormData, setEditFormData] = createSignal({
    full_name: "",
    email: "",
    password: "",
    role: "employee",
    department: "General",
    status: "Active",
    phone: "",
    address: "",
    date_of_birth: "",
    hire_date: "",
    position: "",
    emergency_contact: "",
    emergency_phone: "",
  });

  const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";

  const fetchEmployees = async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const url = forceRefresh 
        ? `${BASE_URL}/employees?_t=${Date.now()}`
        : `${BASE_URL}/employees`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      });
      
      if (!response.ok) {
        setError(`Server error: ${response.status} ${response.statusText}`);
        return;
      }

      const text = await response.text();
      if (!text) {
        setError("Empty response from server");
        return;
      }

      const result = JSON.parse(text);

      if (result.status === "success") {
        const dataArray = Array.isArray(result.data) ? result.data : [result.data];
        
        const mappedData = dataArray.map((item: any) => {
          let extractedId = "unknown";
          if (item.id) {
            if (typeof item.id === "string") {
              extractedId = item.id;
            } else if (item.id.id) {
              if (typeof item.id.id === "string") {
                extractedId = item.id.id;
              } else if (item.id.id.String) {
                extractedId = item.id.id.String;
              }
            }
          }
          
          return {
            ...item,
            id: extractedId,
            department: item.department || "General",
            status: item.status || "Active",
          };
        });
        
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

  const fetchWiFiSettings = async () => {
    try {
      const response = await fetch(`${BASE_URL}/wifi-settings/all`);
      const text = await response.text();
      if (text) {
        const result = JSON.parse(text);
        if (result.success) {
          const mappedData = result.data.map((item: any) => ({
            ...item,
            id: item.id?.id?.String || item.id?.id || item.id,
          }));
          setWifiSettings(mappedData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch WiFi settings:", err);
    }
  };

  const fetchLocationBoundaries = async () => {
    try {
      const response = await fetch(`${BASE_URL}/location-boundaries/all`);
      const text = await response.text();
      if (text) {
        const result = JSON.parse(text);
        if (result.success) {
          const mappedData = result.data.map((item: any) => ({
            ...item,
            id: item.id?.id?.String || item.id?.id || item.id,
          }));
          setLocationBoundaries(mappedData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch location boundaries:", err);
    }
  };

  onMount(() => {
    fetchEmployees();
    fetchWiFiSettings();
    fetchLocationBoundaries();
  });

  const createEmployee = async () => {
    const data = formData();
    if (!data.nik || !data.full_name || !data.email || !data.password) {
      setError("Please fill all required fields");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : { status: "error", message: "Empty response" };

      if (response.ok && result.status === "success") {
        setSuccess("Employee created successfully");
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to create employee");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const updateEmployee = async () => {
    const employee = editingEmployee();
    if (!employee) return;

    const data = editFormData();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/employees/${employee.nik}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : { status: "error", message: "Empty response" };

      if (response.ok && result.status === "success") {
        setSuccess("Employee updated successfully");
        setShowEditModal(false);
        setEditingEmployee(null);
        fetchEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to update employee");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEmployee = async (nik: string, name: string) => {
    if (!confirm(`Are you sure you want to delete employee "${name}"?`)) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${BASE_URL}/employees/${nik}`, {
        method: "DELETE",
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : { status: "error", message: "Empty response" };

      if (response.ok && result.status === "success") {
        setSuccess("Employee deleted successfully");
        fetchEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to delete employee");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      full_name: employee.full_name,
      email: employee.email,
      password: "",
      role: employee.role,
      department: employee.department || "General",
      status: employee.status || "Active",
      phone: employee.phone || "",
      address: employee.address || "",
      date_of_birth: employee.date_of_birth || "",
      hire_date: employee.hire_date || "",
      position: employee.position || "",
      emergency_contact: employee.emergency_contact || "",
      emergency_phone: employee.emergency_phone || "",
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      nik: "",
      full_name: "",
      email: "",
      password: "",
      role: "employee",
      department: "General",
      status: "Active",
      phone: "",
      address: "",
      date_of_birth: "",
      hire_date: "",
      position: "",
      emergency_contact: "",
      emergency_phone: "",
    });
  };

  const filteredEmployees = () =>
    employees().filter((emp) => {
      const matchesSearch =
        emp.full_name.toLowerCase().includes(searchTerm().toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchTerm().toLowerCase()) ||
        (emp.department &&
          emp.department.toLowerCase().includes(searchTerm().toLowerCase()));

      const matchesDepartment =
        filterDepartment() === "all" || emp.department === filterDepartment();

      const matchesStatus =
        filterStatus() === "all" || emp.status === filterStatus();

      return matchesSearch && matchesDepartment && matchesStatus;
    });

  const getAttendanceRequirementBadges = (req: AttendanceRequirement | null) => {
    if (!req) return [];
    const badges = [];
    if (req.wifi_enabled) badges.push({ icon: Wifi, label: "WiFi", color: "blue" });
    if (req.location_enabled) badges.push({ icon: MapPin, label: "Location", color: "green" });
    if (req.face_recognition_enabled) badges.push({ icon: Scan, label: "Face", color: "purple" });
    if (req.fingerprint_enabled) badges.push({ icon: Fingerprint, label: "Fingerprint", color: "orange" });
    return badges;
  };

  // Bulk selection functions
  const toggleSelectEmployee = (nik: string) => {
    const newSelected = new Set(selectedEmployees());
    if (newSelected.has(nik)) {
      newSelected.delete(nik);
    } else {
      newSelected.add(nik);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees().size === filteredEmployees().length) {
      setSelectedEmployees(new Set<string>());
    } else {
      const allNiks = filteredEmployees().map(emp => emp.nik);
      setSelectedEmployees(new Set<string>(allNiks));
    }
  };

  const bulkUpdateAttendanceRequirements = async () => {
    if (selectedEmployees().size === 0) {
      setError("Please select at least one employee");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const niks = Array.from(selectedEmployees());
      const response = await fetch(`${BASE_URL}/employees/bulk-attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_niks: niks,
          attendance_requirement: bulkAttendanceData(),
        }),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : { status: "error" };

      if (response.ok && result.status === "success") {
        setSuccess(`Attendance requirements updated for ${niks.length} employees`);
        setShowBulkAttendanceModal(false);
        setSelectedEmployees(new Set<string>());
        fetchEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to update attendance requirements");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  // Excel functions
  const downloadTemplate = () => {
    const template = [
      {
        NIK: "EMP001",
        "Full Name": "John Doe",
        Email: "john@example.com",
        Password: "password123",
        Role: "employee",
        Department: "Engineering",
        Status: "Active",
        Phone: "+1234567890",
        Address: "123 Main St, City",
        "Date of Birth": "1990-01-15",
        "Hire Date": "2020-01-01",
        Position: "Software Engineer",
        "Emergency Contact": "Jane Doe",
        "Emergency Phone": "+0987654321",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employee_template.xlsx");
  };

  const exportEmployees = () => {
    const data = employees().map(emp => ({
      NIK: emp.nik,
      "Full Name": emp.full_name,
      Email: emp.email,
      Role: emp.role,
      Department: emp.department || "",
      Status: emp.status || "",
      Phone: emp.phone || "",
      Address: emp.address || "",
      "Date of Birth": emp.date_of_birth || "",
      "Hire Date": emp.hire_date || "",
      Position: emp.position || "",
      "Emergency Contact": emp.emergency_contact || "",
      "Emergency Phone": emp.emergency_phone || "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, `employees_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportPreview(data);
      } catch (err) {
        setError("Failed to read Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const importEmployees = async () => {
    const preview = importPreview();
    if (preview.length === 0) {
      setError("No data to import");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const employees = preview.map((row: any) => ({
        nik: row.NIK || row.nik,
        full_name: row["Full Name"] || row.full_name,
        email: row.Email || row.email,
        password: row.Password || row.password || "default123",
        role: row.Role || row.role || "employee",
        department: row.Department || row.department || "General",
        status: row.Status || row.status || "Active",
        phone: row.Phone || row.phone || "",
        address: row.Address || row.address || "",
        date_of_birth: row["Date of Birth"] || row.date_of_birth || "",
        hire_date: row["Hire Date"] || row.hire_date || "",
        position: row.Position || row.position || "",
        emergency_contact: row["Emergency Contact"] || row.emergency_contact || "",
        emergency_phone: row["Emergency Phone"] || row.emergency_phone || "",
      }));

      const response = await fetch(`${BASE_URL}/employees/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees }),
      });

      const text = await response.text();
      const result = text ? JSON.parse(text) : { status: "error" };

      if (response.ok && result.status === "success") {
        setSuccess(`Successfully imported ${employees.length} employees`);
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview([]);
        fetchEmployees();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.message || "Failed to import employees");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Action Buttons */}
      <div class="flex flex-wrap justify-between items-center gap-2">
        <div class="flex gap-2">
          <Show when={selectedEmployees().size > 0}>
            <button
              onClick={() => setShowBulkAttendanceModal(true)}
              class="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all shadow-sm font-medium"
            >
              <Settings class="w-4 h-4" />
              Set Attendance ({selectedEmployees().size})
            </button>
            <button
              onClick={() => setSelectedEmployees(new Set())}
              class="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-xl hover:bg-gray-700 transition-all shadow-sm font-medium"
            >
              <X class="w-4 h-4" />
              Clear Selection
            </button>
          </Show>
        </div>
        
        <div class="flex gap-2">
          <button
            onClick={downloadTemplate}
            class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium"
            title="Download Excel template"
          >
            <Download class="w-4 h-4" />
            Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
            title="Import from Excel"
          >
            <Upload class="w-4 h-4" />
            Import
          </button>
          <button
            onClick={exportEmployees}
            class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium"
            title="Export to Excel"
          >
            <Download class="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => fetchEmployees(true)}
            class="flex items-center gap-2 bg-white text-[var(--color-primary-button)] border border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm font-medium"
            title="Force refresh (bypass cache)"
          >
            <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-all shadow-sm font-medium"
          >
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
          <select
            class="block w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
            value={filterDepartment()}
            onChange={(e) => setFilterDepartment(e.currentTarget.value)}
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="General">General</option>
          </select>
          <select
            class="block w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
            value={filterStatus()}
            onChange={(e) => setFilterStatus(e.currentTarget.value)}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
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

      {/* Employee Table */}
      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--color-border)]">
            <thead class="bg-[var(--color-light-gray)]/50">
              <tr>
                <th scope="col" class="px-4 py-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    class="flex items-center justify-center w-5 h-5 border-2 border-[var(--color-border)] rounded hover:bg-[var(--color-secondary-bg)] transition-colors"
                  >
                    {selectedEmployees().size === filteredEmployees().length && filteredEmployees().length > 0 ? (
                      <CheckSquare class="w-4 h-4 text-[var(--color-primary-button)]" />
                    ) : (
                      <Square class="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </th>
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
                  Attendance Requirements
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
                    colspan="7"
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
                      <td class="px-4 py-4">
                        <button
                          onClick={() => toggleSelectEmployee(employee.nik)}
                          class="flex items-center justify-center w-5 h-5 border-2 border-[var(--color-border)] rounded hover:bg-[var(--color-secondary-bg)] transition-colors"
                        >
                          {selectedEmployees().has(employee.nik) ? (
                            <CheckSquare class="w-4 h-4 text-[var(--color-primary-button)]" />
                          ) : (
                            <Square class="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
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
                      <td class="px-6 py-4">
                        <div class="flex flex-wrap gap-1">
                          <For each={getAttendanceRequirementBadges(employee.attendance_requirement)}>
                            {(badge) => (
                              <span
                                class={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                                  badge.color === "blue"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : badge.color === "green"
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : badge.color === "purple"
                                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                                        : "bg-orange-100 text-orange-700 border border-orange-200"
                                }`}
                              >
                                <badge.icon class="w-3 h-3" />
                                {badge.label}
                              </span>
                            )}
                          </For>
                          {getAttendanceRequirementBadges(employee.attendance_requirement).length === 0 && (
                            <span class="text-xs text-[var(--color-text-tertiary)]">No requirements</span>
                          )}
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
                          <button
                            onClick={() => startEditing(employee)}
                            class="text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] bg-[var(--color-light-gray)] border border-[var(--color-border)] p-2 rounded-lg transition-colors shadow-sm active:scale-95"
                          >
                            <Edit2 class="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEmployee(employee.nik, employee.full_name)}
                            class="text-red-600 hover:bg-red-100 bg-red-50 border border-red-200 p-2 rounded-lg transition-colors shadow-sm active:scale-95"
                          >
                            <Trash2 class="w-4 h-4" />
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
                    colspan="7"
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
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Show when={showAddModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Add New Employee
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

            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    NIK (Employee ID) *
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="e.g., EMP001"
                    value={formData().nik}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, nik: e.currentTarget.value }))
                    }
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="e.g., John Doe"
                    value={formData().full_name}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, full_name: e.currentTarget.value }))
                    }
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="e.g., john@example.com"
                    value={formData().email}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.currentTarget.value }))
                    }
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="Password for mobile app"
                    value={formData().password}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.currentTarget.value }))
                    }
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Role
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().role}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, role: e.currentTarget.value }))
                    }
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Department
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().department}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, department: e.currentTarget.value }))
                    }
                  >
                    <option value="General">General</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Status
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={formData().status}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, status: e.currentTarget.value }))
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Enriched Fields Section */}
              <div class="border-t border-[var(--color-border)] pt-4 mt-4">
                <h4 class="text-sm font-bold text-[var(--color-text-primary)] mb-4">Additional Information</h4>
                
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      placeholder="e.g., +1234567890"
                      value={formData().phone}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.currentTarget.value }))
                      }
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Position
                    </label>
                    <input
                      type="text"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      placeholder="e.g., Software Engineer"
                      value={formData().position}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, position: e.currentTarget.value }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Address
                  </label>
                  <textarea
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white resize-none"
                    placeholder="Full address"
                    rows="2"
                    value={formData().address}
                    onInput={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.currentTarget.value }))
                    }
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      value={formData().date_of_birth}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, date_of_birth: e.currentTarget.value }))
                      }
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      value={formData().hire_date}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, hire_date: e.currentTarget.value }))
                      }
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      placeholder="e.g., Jane Doe"
                      value={formData().emergency_contact}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, emergency_contact: e.currentTarget.value }))
                      }
                    />
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                      placeholder="e.g., +0987654321"
                      value={formData().emergency_phone}
                      onInput={(e) =>
                        setFormData((prev) => ({ ...prev, emergency_phone: e.currentTarget.value }))
                      }
                    />
                  </div>
                </div>
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
                onClick={createEmployee}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Creating..." : "Create Employee"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Edit Employee Modal */}
      <Show when={showEditModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                Edit Employee: {editingEmployee()?.full_name}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                  setError(null);
                }}
                class="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-2"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    NIK (Employee ID)
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl bg-gray-100 text-gray-500"
                    value={editingEmployee()?.nik}
                    disabled
                  />
                  <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
                    NIK cannot be changed
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="e.g., John Doe"
                    value={editFormData().full_name}
                    onInput={(e) =>
                      setEditFormData((prev) => ({ ...prev, full_name: e.currentTarget.value }))
                    }
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="e.g., john@example.com"
                    value={editFormData().email}
                    onInput={(e) =>
                      setEditFormData((prev) => ({ ...prev, email: e.currentTarget.value }))
                    }
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    placeholder="Leave empty to keep current"
                    value={editFormData().password}
                    onInput={(e) =>
                      setEditFormData((prev) => ({ ...prev, password: e.currentTarget.value }))
                    }
                  />
                  <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Leave empty to keep current password
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Role
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={editFormData().role}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, role: e.currentTarget.value }))
                    }
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Department
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={editFormData().department}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, department: e.currentTarget.value }))
                    }
                  >
                    <option value="General">General</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Status
                  </label>
                  <select
                    class="w-full px-4 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white"
                    value={editFormData().status}
                    onChange={(e) =>
                      setEditFormData((prev) => ({ ...prev, status: e.currentTarget.value }))
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingEmployee(null);
                  setError(null);
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={updateEmployee}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-[var(--color-primary-button)] text-white rounded-xl hover:bg-[var(--color-primary-button)]/90 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Updating..." : "Update Employee"}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Bulk Attendance Requirements Modal */}
      <Show when={showBulkAttendanceModal()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="border-b border-[var(--color-border)] p-6 flex justify-between items-center">
              <div>
                <h3 class="text-xl font-bold text-[var(--color-text-primary)]">
                  Set Attendance Requirements
                </h3>
                <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                  Apply to {selectedEmployees().size} selected employees
                </p>
              </div>
              <button
                onClick={() => setShowBulkAttendanceModal(false)}
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
                    checked={bulkAttendanceData().wifi_enabled}
                    onChange={(e) =>
                      setBulkAttendanceData((prev) => ({ ...prev, wifi_enabled: e.currentTarget.checked }))
                    }
                  />
                  <label for="bulk_wifi" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Wifi class="w-5 h-5 text-blue-600" />
                    WiFi Validation
                  </label>
                </div>

                <Show when={bulkAttendanceData().wifi_enabled}>
                  <div class="ml-7 space-y-2">
                    <p class="text-xs text-[var(--color-text-secondary)]">Select allowed WiFi networks:</p>
                    <div class="flex flex-wrap gap-2">
                      <For each={wifiSettings()}>
                        {(wifi) => {
                          const isSelected = () => bulkAttendanceData().wifi_ssids?.includes(wifi.ssid) || false;
                          const toggleWiFi = () => {
                            const current = bulkAttendanceData().wifi_ssids || [];
                            const updated = isSelected()
                              ? current.filter((s: string) => s !== wifi.ssid)
                              : [...current, wifi.ssid];
                            setBulkAttendanceData((prev) => ({ ...prev, wifi_ssids: updated }));
                          };
                          return (
                            <button
                              type="button"
                              onClick={toggleWiFi}
                              class={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                isSelected()
                                  ? "bg-blue-100 text-blue-700 border-blue-300"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {wifi.ssid}
                            </button>
                          );
                        }}
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
                    checked={bulkAttendanceData().location_enabled}
                    onChange={(e) =>
                      setBulkAttendanceData((prev) => ({ ...prev, location_enabled: e.currentTarget.checked }))
                    }
                  />
                  <label for="bulk_location" class="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <MapPin class="w-5 h-5 text-green-600" />
                    Location Boundary Validation
                  </label>
                </div>

                <Show when={bulkAttendanceData().location_enabled}>
                  <div class="ml-7 space-y-2">
                    <p class="text-xs text-[var(--color-text-secondary)]">Select allowed locations:</p>
                    <div class="flex flex-wrap gap-2">
                      <For each={locationBoundaries()}>
                        {(location) => {
                          const isSelected = () => bulkAttendanceData().location_boundaries?.includes(location.id) || false;
                          const toggleLocation = () => {
                            const current = bulkAttendanceData().location_boundaries || [];
                            const updated = isSelected()
                              ? current.filter((l: string) => l !== location.id)
                              : [...current, location.id];
                            setBulkAttendanceData((prev) => ({ ...prev, location_boundaries: updated }));
                          };
                          return (
                            <button
                              type="button"
                              onClick={toggleLocation}
                              class={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                isSelected()
                                  ? "bg-green-100 text-green-700 border-green-300"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              {location.name}
                            </button>
                          );
                        }}
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
                  checked={bulkAttendanceData().face_recognition_enabled}
                  onChange={(e) =>
                    setBulkAttendanceData((prev) => ({ ...prev, face_recognition_enabled: e.currentTarget.checked }))
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
                  checked={bulkAttendanceData().fingerprint_enabled}
                  onChange={(e) =>
                    setBulkAttendanceData((prev) => ({ ...prev, fingerprint_enabled: e.currentTarget.checked }))
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
                onClick={() => setShowBulkAttendanceModal(false)}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={bulkUpdateAttendanceRequirements}
                disabled={isLoading()}
                class="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Applying..." : `Apply to ${selectedEmployees().size} Employees`}
              </button>
            </div>
          </div>
        </div>
      </Show>

      {/* Import Preview Modal */}
      <Show when={showImportModal()}>
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
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
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
                      {importFile() ? importFile()!.name : "Choose Excel File (.xlsx, .xls)"}
                    </span>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      class="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <p class="mt-2 text-xs text-[var(--color-text-secondary)]">
                  Download the template first to ensure correct format
                </p>
              </div>

              {/* Preview */}
              <Show when={importPreview().length > 0}>
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-bold text-[var(--color-text-primary)]">
                      Preview (First 5 rows)
                    </h4>
                    <span class="text-sm text-[var(--color-text-secondary)]">
                      Total: {importPreview().length} employees
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
                          <For each={importPreview().slice(0, 5)}>
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
                  <Show when={importPreview().length > 5}>
                    <p class="mt-2 text-xs text-[var(--color-text-secondary)] text-center">
                      ... and {importPreview().length - 5} more employees
                    </p>
                  </Show>
                </div>
              </Show>
            </div>

            <div class="border-t border-[var(--color-border)] p-6 flex gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview([]);
                }}
                class="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-xl hover:bg-[var(--color-light-gray)] transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={importEmployees}
                disabled={isLoading() || importPreview().length === 0}
                class="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isLoading() ? "Importing..." : `Import ${importPreview().length} Employees`}
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

export default EmployeeManagement;
