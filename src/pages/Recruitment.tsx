import { type Component, For, createSignal } from "solid-js";
import { Search, Users, UserPlus, FileCheck, CheckCircle } from "lucide-solid";

const mockCandidates = [
  {
    id: "CAN-001",
    name: "Farhan Maulana",
    position: "Senior Frontend Developer",
    department: "Engineering",
    stage: "Interview",
    appliedDate: "2023-11-15",
    rating: 4.5,
  },
  {
    id: "CAN-002",
    name: "Nisa Sabyan",
    position: "UI/UX Designer",
    department: "Design",
    stage: "Screening",
    appliedDate: "2023-11-18",
    rating: 0,
  },
  {
    id: "CAN-003",
    name: "Reza Rahadian",
    position: "Backend Developer",
    department: "Engineering",
    stage: "Offered",
    appliedDate: "2023-11-10",
    rating: 4.8,
  },
  {
    id: "CAN-004",
    name: "Anya Geraldine",
    position: "HR Specialist",
    department: "Human Resources",
    stage: "Rejected",
    appliedDate: "2023-11-12",
    rating: 2.5,
  },
];

const stats = [
  {
    title: "Total Candidates",
    value: "45",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "In Pipeline",
    value: "12",
    icon: FileCheck,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
  {
    title: "Hired (This Month)",
    value: "3",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-100",
  },
];

const Recruitment: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStage, setFilterStage] = createSignal("All");

  const filteredCandidates = () =>
    mockCandidates.filter((candidate) => {
      const matchName = candidate.name
        .toLowerCase()
        .includes(searchTerm().toLowerCase());
      const matchStage =
        filterStage() === "All" || candidate.stage === filterStage();
      return matchName && matchStage;
    });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "Offered":
        return "bg-green-100 text-green-800";
      case "Interview":
        return "bg-purple-100 text-purple-800";
      case "Screening":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Recruitment Pipeline</h2>
          <p class="text-sm text-gray-500">
            Manage job postings and candidate tracking
          </p>
        </div>
        <button class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">
          <UserPlus class="w-5 h-5" />
          Add Candidate
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
            placeholder="Search candidates..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select
            class="block w-full sm:w-auto pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={filterStage()}
            onChange={(e) => setFilterStage(e.currentTarget.value)}
          >
            <option value="All">All Stages</option>
            <option value="Screening">Screening</option>
            <option value="Interview">Interview</option>
            <option value="Offered">Offered</option>
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
                  Candidate Info
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Applied Position
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Applied Date
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Stage
                </th>
                <th
                  scope="col"
                  class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Rating
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
              <For each={filteredCandidates()}>
                {(candidate) => (
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10">
                          <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                            {candidate.name.charAt(0)}
                          </div>
                        </div>
                        <div class="ml-4">
                          <div class="text-sm font-medium text-gray-900">
                            {candidate.name}
                          </div>
                          <div class="text-xs text-gray-500">
                            {candidate.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {candidate.position}
                      </div>
                      <div class="text-xs text-gray-500">
                        {candidate.department}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">
                        {candidate.appliedDate}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(
                          candidate.stage,
                        )}`}
                      >
                        {candidate.stage}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      {candidate.rating > 0 ? (
                        <span class="text-sm font-medium text-gray-900">
                          {candidate.rating} / 5.0
                        </span>
                      ) : (
                        <span class="text-sm text-gray-400">Not rated</span>
                      )}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold">
                        View Details
                      </button>
                    </td>
                  </tr>
                )}
              </For>
              {filteredCandidates().length === 0 && (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-8 text-center text-gray-500 text-sm"
                  >
                    No candidates found in this stage.
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

export default Recruitment;
