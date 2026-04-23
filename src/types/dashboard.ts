export interface DashboardOverview {
  total_personnel_on_duty: number;
  total_active_employees: number;
  attendance_rate: number;
  patrol_completion_rate: number;
  total_incidents: number;
}

export interface AttendanceAnalytics {
  on_time_vs_late: {
    on_time: number;
    late: number;
    total: number;
    on_time_percentage: number;
  };
  top_late_users: Array<{
    nik: string;
    full_name: string;
    department: string;
    late_count: number;
    avg_late_minutes: number;
  }>;
}

export interface IncidentAnalytics {
  by_severity: Array<{
    severity: string;
    total: number;
    percentage: number;
  }>;
  high_severity_incidents: Array<{
    title: string;
    description: string;
    severity: string;
    status: string;
    nik: string;
    created_at: string;
  }>;
}

export interface PatrolAnalytics {
  completion: {
    completed: number;
    incomplete: number;
    in_progress: number;
    completion_rate: number;
  };
  patrol_records: Array<{
    employee_name: string;
    location_name: string;
    status: string;
    duration_minutes: number | null;
    checkpoints_visited: number;
    checkpoints_total: number;
    started_at: string;
  }>;
}

export interface PerformanceAnalytics {
  top_performers: Array<{
    employee_id: string;
    nik: string;
    full_name: string;
    department: string;
    present_days: number;
    absent_days: number;
    on_time_days: number;
    late_days: number;
    total_late_minutes: number;
    patrol_completed: number;
    compliance_score: number;
    activity_score: number;
    final_score: number;
  }>;
  low_performers: Array<{
    employee_id: string;
    nik: string;
    full_name: string;
    department: string;
    present_days: number;
    absent_days: number;
    on_time_days: number;
    late_days: number;
    total_late_minutes: number;
    patrol_completed: number;
    compliance_score: number;
    activity_score: number;
    final_score: number;
  }>;
  average_compliance_score: number;
  average_activity_score: number;
  average_final_score: number;
}

export interface LocationAnalytics {
  site_comparison: Array<{
    location_id: string;
    site_name: string;
    address: string;
    latitude: number;
    longitude: number;
    total_patrols: number;
    completed_patrols: number;
    patrol_completion_rate: number;
    incident_count: number;
  }>;
  incidents_per_site: Array<{
    location_name: string;
    latitude: number;
    longitude: number;
    incident_count: number;
    high_severity_count: number;
  }>;
  patrols_per_site: Array<{
    location_id: string;
    site_name: string;
    total_patrols: number;
    completed_patrols: number;
    completion_rate: number;
  }>;
}

export interface DashboardData {
  overview: DashboardOverview;
  attendance: AttendanceAnalytics;
  incidents: IncidentAnalytics;
  patrol: PatrolAnalytics;
  performance?: PerformanceAnalytics;
  location?: LocationAnalytics;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
}