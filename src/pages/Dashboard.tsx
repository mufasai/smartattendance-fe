import { type Component, For, createSignal, createEffect } from "solid-js";
import { Users, UserCheck, Shield, TriangleAlert, TrendingUp, MapPin } from "lucide-solid";
import type { DashboardData, ApiResponse, DashboardOverview, AttendanceAnalytics, IncidentAnalytics, PatrolAnalytics, PerformanceAnalytics, LocationAnalytics } from "../types/dashboard";
import config from "../config/env";

const [dashboardData, setDashboardData] = createSignal<DashboardData | null>(null);
const [loading, setLoading] = createSignal(true);
const [error, setError] = createSignal<string | null>(null);

const fetchDashboardData = async () => {
  console.log("Starting to fetch dashboard data...");
  setLoading(true);
  setError(null);

  try {
    const baseUrl = `${config.apiUrl}/dashboard`;

    console.log("Fetching from:", baseUrl);

    const [overviewRes, attendanceRes, incidentsRes, patrolRes, performanceRes, locationRes] = await Promise.all([
      fetch(`${baseUrl}/overview`),
      fetch(`${baseUrl}/attendance`),
      fetch(`${baseUrl}/incidents`),
      fetch(`${baseUrl}/patrol`),
      fetch(`${baseUrl}/performance`),
      fetch(`${baseUrl}/locations`)
    ]);

    console.log("API responses:", {
      overview: overviewRes.status,
      attendance: attendanceRes.status,
      incidents: incidentsRes.status,
      patrol: patrolRes.status,
      performance: performanceRes.status,
      location: locationRes.status
    });

    // Check if core endpoints are successful (overview, attendance, incidents, patrol are required)
    if (overviewRes.ok && attendanceRes.ok && incidentsRes.ok && patrolRes.ok) {
      const [overview, attendance, incidents, patrol] = await Promise.all([
        overviewRes.json() as Promise<ApiResponse<{ overview: DashboardOverview }>>,
        attendanceRes.json() as Promise<ApiResponse<{ attendance_analytics: AttendanceAnalytics }>>,
        incidentsRes.json() as Promise<ApiResponse<{ incident_analytics: IncidentAnalytics }>>,
        patrolRes.json() as Promise<ApiResponse<{ patrol_analytics: PatrolAnalytics }>>
      ]);

      console.log("Successfully fetched core API data");

      const newData: DashboardData = {
        overview: overview.data.overview,
        attendance: attendance.data.attendance_analytics,
        incidents: incidents.data.incident_analytics,
        patrol: patrol.data.patrol_analytics
      };

      // Try to fetch optional endpoints (performance and location)
      try {
        if (performanceRes.ok) {
          const performance = await performanceRes.json() as ApiResponse<{ performance_analytics: PerformanceAnalytics }>;
          newData.performance = performance.data.performance_analytics;
          console.log("Performance data loaded");
        } else {
          console.warn("Performance endpoint failed:", performanceRes.status);
        }
      } catch (perfError) {
        console.warn("Performance data not available:", perfError);
      }

      try {
        if (locationRes.ok) {
          const location = await locationRes.json() as ApiResponse<{ location_analytics: LocationAnalytics }>;
          newData.location = location.data.location_analytics;
          console.log("Location data loaded");
        } else {
          console.warn("Location endpoint failed:", locationRes.status);
        }
      } catch (locError) {
        console.warn("Location data not available:", locError);
      }

      setDashboardData(newData);
      console.log("Dashboard data set:", newData);
    } else {
      throw new Error(`Core API requests failed - Status codes: ${overviewRes.status}, ${attendanceRes.status}, ${incidentsRes.status}, ${patrolRes.status}`);
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    setError(`Failed to load dashboard data: ${(error as Error).message}`);
    setDashboardData(null);
  }

  setLoading(false);
  console.log("Loading set to false");
};

const Dashboard: Component = () => {
  // Pagination state for patrol activities
  const [currentPage, setCurrentPage] = createSignal(1);
  const itemsPerPage = 5;

  // Use createEffect with empty dependency to run only once
  createEffect(() => {
    console.log("Dashboard component mounted");
    fetchDashboardData();
  });

  const paginatedPatrolRecords = () => {
    const data = dashboardData();
    if (!data) return [];

    const startIndex = (currentPage() - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.patrol.patrol_records.slice(startIndex, endIndex);
  };

  const totalPages = () => {
    const data = dashboardData();
    if (!data) return 0;
    return Math.ceil(data.patrol.patrol_records.length / itemsPerPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const stats = () => {
    const data = dashboardData();
    if (!data) return [];

    return [
      {
        title: "Total Active Employees",
        value: data.overview.total_active_employees.toString(),
        icon: Users,
        color: "text-[var(--color-primary-button)]",
        bg: "bg-blue-50",
      },
      {
        title: "Personnel on Duty",
        value: data.overview.total_personnel_on_duty.toString(),
        icon: UserCheck,
        color: "text-green-600",
        bg: "bg-green-50",
      },
      {
        title: "Attendance Rate",
        value: `${data.overview.attendance_rate.toFixed(1)}%`,
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50",
      },
      {
        title: "Total Incidents",
        value: data.overview.total_incidents.toString(),
        icon: TriangleAlert,
        color: "text-red-600",
        bg: "bg-red-50",
      },
    ];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { bg: "bg-green-100", text: "text-green-700", label: "Completed" },
      incomplete: { bg: "bg-red-100", text: "text-red-700", label: "Incomplete" },
      in_progress: { bg: "bg-blue-100", text: "text-blue-700", label: "In Progress" },
      resolved: { bg: "bg-green-100", text: "text-green-700", label: "Resolved" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
      investigating: { bg: "bg-blue-100", text: "text-blue-700", label: "Investigating" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
      { bg: "bg-gray-100", text: "text-gray-700", label: status };

    return `px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`;
  };

  if (loading()) {
    return (
      <div class="flex flex-col items-center justify-center h-64 space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-button)]"></div>
        <p class="text-[var(--color-text-secondary)]">Loading dashboard data...</p>
      </div>
    );
  }

  const data = dashboardData();
  if (!data) {
    return (
      <div class="flex flex-col items-center justify-center h-64 space-y-4">
        <TriangleAlert class="w-12 h-12 text-red-500" />
        <div class="text-center">
          <p class="text-[var(--color-text-primary)] font-medium">Failed to load dashboard data</p>
          {error() && (
            <p class="text-red-500 text-sm mt-2">{error()}</p>
          )}
          <button
            onClick={() => {
              console.log("Retry button clicked");
              fetchDashboardData();
            }}
            class="mt-4 px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {error() && (
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-800 text-sm">{error()}</p>
        </div>
      )}

      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">Security Dashboard</h2>
        <div class="flex items-center gap-4">
          <button
            onClick={() => {
              console.log("Manual refresh triggered");
              fetchDashboardData();
            }}
            class="px-4 py-2 bg-[var(--color-primary-button)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Refresh
          </button>
          <span class="text-sm text-[var(--color-text-secondary)]">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <For each={stats()}>
          {(stat) => (
            <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-6 flex items-center gap-4 transition-transform hover:scale-105 duration-200">
              <div
                class={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}
              >
                <stat.icon class="w-6 h-6" />
              </div>
              <div>
                <p class="text-sm font-medium text-[var(--color-text-secondary)]">{stat.title}</p>
                <p class="text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
              </div>
            </div>
          )}
        </For>
      </div>

      {/* Main Content Area */}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 flex flex-col gap-6">
          {/* Recent Patrol Activities */}
          <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4 lg:col-span-2">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                Recent Patrol Activities
              </h3>
              <div class="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Shield class="w-4 h-4" />
                <span>Completion Rate: {data.patrol.completion.completion_rate.toFixed(1)}%</span>
              </div>

            </div>
            {/* Patrol Records Table */}
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="text-xs text-[var(--color-text-secondary)] uppercase bg-[var(--color-light-gray)]">
                  <tr>
                    <th class="px-2 py-1.5 rounded-tl-lg rounded-bl-lg">Employee</th>
                    <th class="px-2 py-1.5">Location</th>
                    <th class="px-2 py-1.5">Time</th>
                    <th class="px-2 py-1.5">Progress</th>
                    <th class="px-2 py-1.5 rounded-tr-lg rounded-br-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={paginatedPatrolRecords()}>
                    {(patrol) => (
                      <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-light-gray)]">
                        <td class="px-2 py-1.5 font-medium text-[var(--color-text-primary)]">
                          <div class="truncate max-w-[100px]" title={patrol.employee_name}>
                            {patrol.employee_name}
                          </div>
                        </td>
                        <td class="px-2 py-1.5 text-[var(--color-text-secondary)]">
                          <div class="truncate max-w-[120px]" title={patrol.location_name}>
                            {patrol.location_name.replace('Gedung ', '').replace(' - ', ' ')}
                          </div>
                        </td>
                        <td class="px-2 py-1.5 text-[var(--color-text-secondary)] text-xs">
                          {formatTime(patrol.started_at)}
                        </td>
                        <td class="px-2 py-1.5 text-[var(--color-text-secondary)]">
                          <div class="flex items-center gap-1">
                            <span class="text-xs font-medium">{patrol.checkpoints_visited}/{patrol.checkpoints_total}</span>
                            <div class="w-6 bg-gray-200 rounded-full h-1">
                              <div
                                class={`h-1 rounded-full ${patrol.checkpoints_visited === patrol.checkpoints_total ? 'bg-green-500' :
                                  patrol.checkpoints_visited / patrol.checkpoints_total >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                style={`width: ${(patrol.checkpoints_visited / patrol.checkpoints_total) * 100}%`}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td class="px-2 py-1.5">
                          <span class={`${getStatusBadge(patrol.status)} text-xs`}>
                            {patrol.status === 'in_progress' ? 'Progress' :
                              patrol.status === 'completed' ? 'Done' :
                                patrol.status === 'incomplete' ? 'Incomplete' : patrol.status}
                          </span>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages() > 1 && (
              <div class="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)]">
                <div class="text-xs text-[var(--color-text-secondary)]">
                  {((currentPage() - 1) * itemsPerPage) + 1}-{Math.min(currentPage() * itemsPerPage, data.patrol.patrol_records.length)} of {data.patrol.patrol_records.length}
                </div>
                <div class="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage() - 1)}
                    disabled={currentPage() === 1}
                    class="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-light-gray)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>

                  <div class="flex gap-1">
                    <For each={Array.from({ length: Math.min(totalPages(), 5) }, (_, i) => i + 1)}>
                      {(page) => (
                        <button
                          onClick={() => goToPage(page)}
                          class={`px-2 py-1 text-xs rounded ${currentPage() === page
                            ? 'bg-[var(--color-primary-button)] text-white'
                            : 'border border-[var(--color-border)] hover:bg-[var(--color-light-gray)]'
                            }`}
                        >
                          {page}
                        </button>
                      )}
                    </For>
                  </div>

                  <button
                    onClick={() => goToPage(currentPage() + 1)}
                    disabled={currentPage() === totalPages()}
                    class="px-2 py-1 text-xs border border-[var(--color-border)] rounded hover:bg-[var(--color-light-gray)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
          {data.location && (
            <div class="flex flex-col">
              {/* Site Performance Comparison */}
              <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4">
                <div class="flex items-center gap-2 mb-4">
                  <MapPin class="w-5 h-5 text-[var(--color-primary-button)]" />
                  <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                    Site Performance Comparison
                  </h3>
                </div>
                <div class="space-y-3">
                  <For each={data.location.site_comparison.slice(0, 4)}>
                    {(site) => (
                      <div class="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-[var(--color-light-gray)]">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-[var(--color-text-primary)]">{site.site_name}</p>
                          <p class="text-xs text-[var(--color-text-secondary)]">
                            {site.completed_patrols}/{site.total_patrols} patrols completed
                          </p>
                        </div>
                        <div class="text-right">
                          <div class="flex items-center gap-2 mb-1">
                            <div class="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                class={`h-1.5 rounded-full ${site.patrol_completion_rate >= 80 ? 'bg-green-500' : site.patrol_completion_rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={`width: ${site.patrol_completion_rate}%`}
                              ></div>
                            </div>
                            <span class="text-xs text-[var(--color-text-secondary)] min-w-[30px]">
                              {site.patrol_completion_rate.toFixed(0)}%
                            </span>
                          </div>
                          <span class={`px-2 py-1 text-xs rounded-full ${site.incident_count === 0 ? 'bg-green-100 text-green-700' : site.incident_count <= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {site.incident_count} incidents
                          </span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
              {/* Incident Distribution by Location */}
              <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4 mt-4">
                <div class="flex items-center gap-2 mb-4">
                  <TriangleAlert class="w-5 h-5 text-red-500" />
                  <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                    Incident Distribution by Location
                  </h3>
                </div>
                <div class="space-y-3">
                  <For each={data.location.incidents_per_site.slice(0, 4)}>
                    {(location) => (
                      <div class="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-[var(--color-light-gray)]">
                        <div class="flex-1">
                          <p class="text-sm font-medium text-[var(--color-text-primary)]">{location.location_name}</p>
                          <p class="text-xs text-[var(--color-text-secondary)]">
                            Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
                          </p>
                        </div>
                        <div class="text-right">
                          <p class="text-lg font-bold text-[var(--color-text-primary)]">{location.incident_count}</p>
                          <p class="text-xs text-[var(--color-text-secondary)]">incidents</p>
                          {location.high_severity_count > 0 && (
                            <p class="text-xs text-red-600 font-medium">{location.high_severity_count} high severity</p>
                          )}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Compact */}
        <div class="space-y-4">
          {/* Attendance Summary */}
          <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4">
            <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Attendance Summary
            </h3>
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-[var(--color-text-secondary)]">On Time</span>
                <span class="font-semibold text-green-600">
                  {data.attendance.on_time_vs_late.on_time_percentage.toFixed(1)}%
                </span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-green-500 h-2 rounded-full"
                  style={`width: ${data.attendance.on_time_vs_late.on_time_percentage}%`}
                ></div>
              </div>
              <div class="text-xs text-[var(--color-text-secondary)]">
                {data.attendance.on_time_vs_late.on_time} on time, {data.attendance.on_time_vs_late.late} late
              </div>
            </div>
          </div>

          {/* High Priority Incidents */}
          <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4">
            <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Recent High Priority Incidents
            </h3>
            <div class="space-y-2">
              <For each={data.incidents.high_severity_incidents.slice(0, 2)}>
                {(incident) => (
                  <div class="p-2 border border-red-100 rounded-lg bg-red-50">
                    <p class="text-sm font-medium text-[var(--color-text-primary)]">
                      {incident.title}
                    </p>
                    <p class="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                      {incident.description}
                    </p>
                    <div class="flex justify-between items-center mt-1">
                      <span class="text-xs text-red-600 font-medium">
                        {incident.severity.toUpperCase()}
                      </span>
                      <span class={getStatusBadge(incident.status)}>
                        {incident.status}
                      </span>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Top Late Employees */}
          <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4">
            <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
              Frequent Late Arrivals
            </h3>
            <div class="space-y-2">
              <For each={data.attendance.top_late_users.slice(0, 3)}>
                {(employee) => (
                  <div class="flex justify-between items-center p-2 border border-yellow-100 rounded-lg bg-yellow-50">
                    <div>
                      <p class="text-sm font-medium text-[var(--color-text-primary)]">
                        {employee.full_name}
                      </p>
                      <p class="text-xs text-[var(--color-text-secondary)]">
                        NIK: {employee.nik}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-semibold text-yellow-700">
                        {employee.late_count}x
                      </p>
                      <p class="text-xs text-[var(--color-text-secondary)]">
                        Avg: {employee.avg_late_minutes.toFixed(0)}min
                      </p>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Performance Summary */}
          {data.performance && (
            <div class="bg-white rounded-xl shadow-sm border border-[var(--color-border)] p-4">
              <h3 class="text-lg font-semibold text-[var(--color-text-primary)] mb-3">
                Performance Overview
              </h3>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-[var(--color-text-secondary)]">Avg Compliance</span>
                  <span class="font-semibold text-blue-600">
                    {data.performance.average_compliance_score.toFixed(1)}%
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-[var(--color-text-secondary)]">Avg Activity</span>
                  <span class="font-semibold text-green-600">
                    {data.performance.average_activity_score.toFixed(1)}%
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-[var(--color-text-secondary)]">Overall Score</span>
                  <span class="font-semibold text-purple-600">
                    {data.performance.average_final_score.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;