import { type Component, For } from "solid-js";
import { Users, UserCheck, CalendarOff, AlertCircle } from "lucide-solid";

const stats = [
  {
    title: "Total Employees",
    value: "150",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Present Today",
    value: "135",
    icon: UserCheck,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    title: "On Leave",
    value: "10",
    icon: CalendarOff,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  {
    title: "Pending Approvals",
    value: "5",
    icon: AlertCircle,
    color: "text-yellow-600",
    bg: "bg-yellow-100",
  },
];

const Dashboard: Component = () => {
  return (
    <div class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <span class="text-sm text-gray-500">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <For each={stats}>
          {(stat) => (
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform hover:scale-105 duration-200">
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

      {/* Main Content Area */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance */}
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">
              Recent Check-ins
            </h3>
            <button class="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th class="px-4 py-3 rounded-tl-lg rounded-bl-lg">
                    Employee
                  </th>
                  <th class="px-4 py-3">Time</th>
                  <th class="px-4 py-3">Location</th>
                  <th class="px-4 py-3 rounded-tr-lg rounded-br-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">
                    Ahmad Setiawan
                  </td>
                  <td class="px-4 py-3 text-gray-600">07:45 AM</td>
                  <td class="px-4 py-3 text-gray-600">Head Office</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      On Time
                    </span>
                  </td>
                </tr>
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">
                    Budi Santoso
                  </td>
                  <td class="px-4 py-3 text-gray-600">08:15 AM</td>
                  <td class="px-4 py-3 text-gray-600">Branch A</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      Late
                    </span>
                  </td>
                </tr>
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">
                    Citra Kirana
                  </td>
                  <td class="px-4 py-3 text-gray-600">07:50 AM</td>
                  <td class="px-4 py-3 text-gray-600">Remote</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
                      On Time
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Items */}
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            Pending Tasks
          </h3>
          <div class="space-y-4">
            <div class="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
              <p class="text-sm font-medium text-gray-800">
                Leave Request: John Doe
              </p>
              <p class="text-xs text-gray-500 mt-1">
                Annual Leave (2 days) - Awaiting Manager Approval
              </p>
            </div>
            <div class="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
              <p class="text-sm font-medium text-gray-800">
                Overtime: Sarah Lee
              </p>
              <p class="text-xs text-gray-500 mt-1">
                3 hours (Project Deadline) - Awaiting HR Approval
              </p>
            </div>
            <div class="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer">
              <p class="text-sm font-medium text-gray-800">
                Performance Review
              </p>
              <p class="text-xs text-gray-500 mt-1">
                3 Employee reviews pending for Q3
              </p>
            </div>
          </div>
          <button class="w-full mt-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
            View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
