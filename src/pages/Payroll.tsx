import { type Component, For, createSignal } from "solid-js";
import {
  Search,
  Download,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-solid";

const mockPayroll = [
  {
    id: "PAY-001",
    name: "Ahmad Setiawan",
    department: "Engineering",
    period: "Nov 2023",
    basicSalary: 15000000,
    allowance: 2000000,
    deduction: 500000,
    netSalary: 16500000,
    status: "Paid",
  },
  {
    id: "PAY-002",
    name: "Dewi Lestari",
    department: "Finance",
    period: "Nov 2023",
    basicSalary: 12000000,
    allowance: 1500000,
    deduction: 300000,
    netSalary: 13200000,
    status: "Paid",
  },
  {
    id: "PAY-003",
    name: "Budi Santoso",
    department: "Marketing",
    period: "Nov 2023",
    basicSalary: 10000000,
    allowance: 1000000,
    deduction: 200000,
    netSalary: 10800000,
    status: "Pending",
  },
  {
    id: "PAY-004",
    name: "Citra Kirana",
    department: "Human Resources",
    period: "Nov 2023",
    basicSalary: 9000000,
    allowance: 1000000,
    deduction: 150000,
    netSalary: 9850000,
    status: "Pending",
  },
];

const stats = [
  {
    title: "Total Payroll (Nov)",
    value: "Rp 145.5M",
    icon: DollarSign,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Processed",
    value: "125 Emp",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    title: "Pending Approval",
    value: "25 Emp",
    icon: Clock,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const Payroll: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStatus, setFilterStatus] = createSignal("All");

  const filteredPayroll = () =>
    mockPayroll.filter((record) => {
      const matchName = record.name
        .toLowerCase()
        .includes(searchTerm().toLowerCase());
      const matchStatus =
        filterStatus() === "All" || record.status === filterStatus();
      return matchName && matchStatus;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Payroll Management</h2>
          <p class="text-sm text-gray-500">
            Manage employee salaries and payslips
          </p>
        </div>
        <div class="flex gap-2">
          <button class="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium">
            <Download class="w-4 h-4" />
            Export Data
          </button>
          <button class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
            <DollarSign class="w-4 h-4" />
            Run Payroll
          </button>
        </div>
      </div>

      {/* Stats */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <For each={stats}>
          {(stat) => (
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
              <div
                class={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}
              >
                <stat.icon class="w-6 h-6" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">{stat.title}</p>
                <p class="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Filters */}
      <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Search employee..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select class="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            <option value="Nov 2023">November 2023</option>
            <option value="Oct 2023">October 2023</option>
            <option value="Sep 2023">September 2023</option>
          </select>
          <select
            class="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus()}
            onChange={(e) => setFilterStatus(e.currentTarget.value)}
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Employee Info
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Basic Salary
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Allowances
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Deductions
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Net Salary
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <For each={filteredPayroll()}>
                {(record) => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {record.name.charAt(0)}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {record.name}
                          </div>
                          <div class="text-xs text-gray-500">
                            {record.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {formatCurrency(record.basicSalary)}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-green-600">
                        +{formatCurrency(record.allowance)}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-red-600">
                        -{formatCurrency(record.deduction)}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-bold text-gray-900">
                        {formatCurrency(record.netSalary)}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        class="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        title="Download Payslip"
                      >
                        <FileText class="w-4 h-4" />
                        <span class="text-xs">Payslip</span>
                      </button>
                    </td>
                  </tr>
                )}
              </For>
              {filteredPayroll().length === 0 && (
                <tr>
                  <td
                    colspan="7"
                    class="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No payroll records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
