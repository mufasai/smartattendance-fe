import { type Component, For, createSignal } from "solid-js";
import { CheckCircle, XCircle, Search, Clock } from "lucide-solid";

const mockOvertimeRequests = [
  {
    id: "OT-001",
    name: "Ahmad Setiawan",
    department: "Engineering",
    date: "2023-11-20",
    startTime: "17:00",
    endTime: "20:00",
    duration: 3,
    reason: "Deploy new production release",
    status: "Pending",
  },
  {
    id: "OT-002",
    name: "Dewi Lestari",
    department: "Finance",
    date: "2023-11-19",
    startTime: "17:30",
    endTime: "19:30",
    duration: 2,
    reason: "Monthly financial closing",
    status: "Approved",
  },
  {
    id: "OT-003",
    name: "Budi Santoso",
    department: "Marketing",
    date: "2023-11-21",
    startTime: "18:00",
    endTime: "22:00",
    duration: 4,
    reason: "Campaign preparation",
    status: "Rejected",
  },
  {
    id: "OT-004",
    name: "Citra Kirana",
    department: "Human Resources",
    date: "2023-11-22",
    startTime: "17:00",
    endTime: "18:30",
    duration: 1.5,
    reason: "Interviews with candidates",
    status: "Pending",
  },
];

const ApprovalLembur: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStatus, setFilterStatus] = createSignal("All");

  const filteredRequests = () =>
    mockOvertimeRequests.filter((req) => {
      const matchName = req.name
        .toLowerCase()
        .includes(searchTerm().toLowerCase());
      const matchStatus =
        filterStatus() === "All" || req.status === filterStatus();
      return matchName && matchStatus;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
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
          <h2 class="text-2xl font-bold text-gray-800">
            Overtime Approvals (Lembur)
          </h2>
          <p class="text-sm text-gray-500">
            Manage and review employee overtime requests
          </p>
        </div>
        <div class="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-medium text-sm">
          <Clock class="w-4 h-4" />
          Total Pending:{" "}
          {mockOvertimeRequests.filter((r) => r.status === "Pending").length}
        </div>
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
            placeholder="Search by employee name..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select
            class="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus()}
            onChange={(e) => setFilterStatus(e.currentTarget.value)}
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
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
                  Employee
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Date & Time
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Reason
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
              <For each={filteredRequests()}>
                {(req) => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {req.name.charAt(0)}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {req.name}
                          </div>
                          <div class="text-xs text-gray-500">
                            {req.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{req.date}</div>
                      <div class="text-xs text-gray-500">
                        {req.startTime} - {req.endTime}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">
                        {req.duration} Hours
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="text-sm text-gray-900 truncate max-w-[200px]"
                        title={req.reason}
                      >
                        {req.reason}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          req.status,
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {req.status === "Pending" ? (
                        <div class="flex items-center justify-end gap-2">
                          <button
                            class="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle class="w-5 h-5" />
                          </button>
                          <button
                            class="text-red-600 hover:text-red-900 bg-red-50 p-2 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle class="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span class="text-gray-400 text-xs italic">
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </For>
              {filteredRequests().length === 0 && (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No overtime requests found matching your search.
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

export default ApprovalLembur;
