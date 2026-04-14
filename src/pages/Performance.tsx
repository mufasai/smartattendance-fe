import { type Component, For, createSignal } from "solid-js";
import { Search, Star, TrendingUp, Target, Plus, Edit2 } from "lucide-solid";

const mockPerformanceReviews = [
  {
    id: "PR-001",
    name: "Ahmad Setiawan",
    department: "Engineering",
    period: "Q3 2023",
    score: 4.8,
    goalsMet: 5,
    totalGoals: 5,
    status: "Completed",
  },
  {
    id: "PR-002",
    name: "Dewi Lestari",
    department: "Finance",
    period: "Q3 2023",
    score: 4.5,
    goalsMet: 4,
    totalGoals: 5,
    status: "Completed",
  },
  {
    id: "PR-003",
    name: "Budi Santoso",
    department: "Marketing",
    period: "Q3 2023",
    score: 0,
    goalsMet: 0,
    totalGoals: 4,
    status: "Pending",
  },
  {
    id: "PR-004",
    name: "Citra Kirana",
    department: "Human Resources",
    period: "Q3 2023",
    score: 4.2,
    goalsMet: 3,
    totalGoals: 4,
    status: "In Progress",
  },
];

const stats = [
  {
    title: "Company Avg Score",
    value: "4.4 / 5.0",
    icon: Star,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  {
    title: "Top Performers",
    value: "12",
    icon: TrendingUp,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    title: "Goals Achieved",
    value: "85%",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
];

const Performance: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStatus, setFilterStatus] = createSignal("All");

  const filteredReviews = () =>
    mockPerformanceReviews.filter((review) => {
      const matchName = review.name
        .toLowerCase()
        .includes(searchTerm().toLowerCase());
      const matchStatus =
        filterStatus() === "All" || review.status === filterStatus();
      return matchName && matchStatus;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
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
            Performance Management
          </h2>
          <p class="text-sm text-gray-500">
            Track and evaluate employee performance
          </p>
        </div>
        <button class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <Plus class="w-5 h-5" />
          New Review
        </button>
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
            <option value="Q3 2023">Q3 2023</option>
            <option value="Q2 2023">Q2 2023</option>
            <option value="Q1 2023">Q1 2023</option>
          </select>
          <select
            class="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filterStatus()}
            onChange={(e) => setFilterStatus(e.currentTarget.value)}
          >
            <option value="All">All Status</option>
            <option value="Completed">Completed</option>
            <option value="In Progress">In Progress</option>
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
                  Employee
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Period
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Goals
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Score
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
              <For each={filteredReviews()}>
                {(review) => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                            {review.name.charAt(0)}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {review.name}
                          </div>
                          <div class="text-xs text-gray-500">
                            {review.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">{review.period}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {review.goalsMet} / {review.totalGoals} Met
                      </div>
                      <div class="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          class="bg-blue-600 h-1.5 rounded-full"
                          style={{
                            width: `${(review.goalsMet / review.totalGoals) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {review.status === "Completed" ? (
                        <div class="flex items-center gap-1">
                          <Star class="w-4 h-4 text-yellow-500 fill-current" />
                          <span class="text-sm font-medium text-gray-900">
                            {review.score.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span class="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          review.status,
                        )}`}
                      >
                        {review.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-blue-600 hover:text-blue-900 bg-blue-50 p-2 rounded-lg transition-colors">
                        <Edit2 class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )}
              </For>
              {filteredReviews().length === 0 && (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No performance reviews found.
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

export default Performance;
