import { type Component, For, createSignal, onMount, Show } from "solid-js";
import { CheckCircle, XCircle, Search, RefreshCw } from "lucide-solid";
import auth from "../store/auth";
import ConfirmModal from "../components/ConfirmModal";

interface LeaveRequest {
  id: string;
  nik: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  duration: number;
  reason: string;
  status: string;
  stage1_status: string;
  stage2_status: string;
  created_at: string;
}

const ApprovalCuti: Component = () => {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [filterStatus, setFilterStatus] = createSignal("All");
  const [requests, setRequests] = createSignal<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [confirmAction, setConfirmAction] = createSignal<{ id: string, action: "APPROVED" | "REJECTED" } | null>(null);

  const role = auth.role(); // "manager" or "hrd"
  const BASE_URL = "http://127.0.0.1:8080/api";

  const fetchLeaves = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/leave`);
      const result = await response.json();
      if (response.ok && result.status === "success") {
        // Map surrealDB ID format
        const mappedData = result.data.map((item: any) => ({
          ...item,
          id: item.id?.id?.String || item.id?.id || item.id,
        }));
        setRequests(mappedData);
      } else {
        setError(result.message || "Failed to fetch leaves");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  onMount(() => {
    fetchLeaves();
  });

  const handleAction = async () => {
    const data = confirmAction();
    if (!data) return;

    const { id, action } = data;
    setIsLoading(true);

    // Line manager = stage 1, HRD = stage 2
    const stage = role === "manager" ? 1 : 2;

    try {
      const response = await fetch(`${BASE_URL}/leave/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: `leaves:⟨${id}⟩`,
          stage,
          status: action,
        }),
      });

      const result = await response.json();
      if (response.ok && result.status === "success") {
        setConfirmAction(null);
        fetchLeaves();
      } else {
        alert(result.message || "Failed to update status");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = () =>
    requests().filter((req) => {
      const matchName = req.nik
        .toLowerCase()
        .includes(searchTerm().toLowerCase()); // using NIK for now as name is not in model
      const matchStatus =
        filterStatus() === "All" || req.status === filterStatus();
      return matchName && matchStatus;
    });

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border border-red-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      default:
        return "bg-[var(--color-light-gray)] text-[var(--color-text-secondary)] border border-gray-200";
    }
  };

  const canAction = (req: LeaveRequest) => {
    if (req.status === "REJECTED" || req.status === "APPROVED") return false;

    if (role === "manager") {
      return req.stage1_status === "WAITING";
    } else if (role === "hrd") {
      // HRD can only action if manager approved
      return (
        req.stage1_status === "APPROVED" && req.stage2_status === "WAITING"
      );
    }
    return false;
  };

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
            Approval Cuti
          </h2>
          <p class="text-sm text-[var(--color-text-secondary)]">
            Manage employee leave requests as{" "}
            {role === "manager" ? "Line Manager" : "HRD"}
          </p>
        </div>
        <button
          onClick={fetchLeaves}
          class="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--color-border)] rounded-xl text-sm font-medium text-[var(--color-primary-button)] hover:bg-[var(--color-secondary-bg)] transition-all shadow-sm"
        >
          <RefreshCw class={`w-4 h-4 ${isLoading() ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div class="bg-white p-4 rounded-2xl shadow-sm border border-[var(--color-border)] flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div class="relative w-full sm:w-96">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search class="h-5 w-5 text-[var(--color-text-tertiary)]" />
          </div>
          <input
            type="text"
            class="block w-full pl-10 pr-3 py-2.5 border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-[var(--color-light-gray)]/50 text-sm transition-all"
            placeholder="Search by NIK..."
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <select
            class="block w-full sm:w-auto pl-4 pr-10 py-2.5 text-sm border border-[var(--color-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] bg-white text-[var(--color-text-primary)] font-medium"
            value={filterStatus()}
            onChange={(e) => setFilterStatus(e.currentTarget.value)}
          >
            <option value="All">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {error() && (
        <div class="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-200">
          {error()}
        </div>
      )}

      <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--color-border)]">
            <thead class="bg-[var(--color-light-gray)]/50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Employee (NIK)
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Type & Duration
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Dates
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Reason
                </th>
                <th class="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-4 text-right text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-[var(--color-border)]">
              <Show when={isLoading() && requests().length === 0}>
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    <div class="flex items-center justify-center gap-2">
                      <RefreshCw class="w-5 h-5 animate-spin text-[var(--color-primary-button)]" />
                      Loading data...
                    </div>
                  </td>
                </tr>
              </Show>
              
              <For each={filteredRequests()}>
                {(req) => (
                  <tr class="hover:bg-[var(--color-light-gray)]/30 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] flex items-center justify-center font-bold shadow-inner">
                          {req.nik.substring(0, 2)}
                        </div>
                        <div>
                          <div class="text-sm font-semibold text-[var(--color-text-primary)]">
                            {req.nik}
                          </div>
                          <div class="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wide">
                            ID: {req.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-[var(--color-text-primary)]">
                        {req.leave_type}
                      </div>
                      <div class="text-xs text-[var(--color-primary-button)] font-semibold mt-0.5 bg-[var(--color-secondary-bg)] inline-block px-2 py-0.5 rounded-md">
                        {req.duration} Days
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-[var(--color-text-primary)]">
                        {req.start_date}
                      </div>
                      <div class="text-xs text-[var(--color-text-tertiary)] flex items-center gap-1 mt-0.5">
                        to {req.end_date}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div
                        class="text-sm text-[var(--color-text-secondary)] line-clamp-2 max-w-[200px]"
                        title={req.reason}
                      >
                        {req.reason}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span
                        class={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${getStatusColor(req.status)}`}
                      >
                        {req.status}
                      </span>
                      <div class="text-[10px] text-[var(--color-text-secondary)] mt-2 flex flex-col gap-0.5 bg-[var(--color-light-gray)] p-1.5 rounded-lg border border-[var(--color-border)]">
                        <span class="flex justify-between w-32">
                          <span>L1 (Mgr):</span>{" "}
                          <strong
                            class={
                              req.stage1_status === "APPROVED"
                                ? "text-green-600"
                                : req.stage1_status === "REJECTED"
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {req.stage1_status}
                          </strong>
                        </span>
                        <span class="flex justify-between w-32">
                          <span>L2 (HRD):</span>{" "}
                          <strong
                            class={
                              req.stage2_status === "APPROVED"
                                ? "text-green-600"
                                : req.stage2_status === "REJECTED"
                                  ? "text-red-600"
                                  : ""
                            }
                          >
                            {req.stage2_status}
                          </strong>
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {canAction(req) ? (
                        <div class="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setConfirmAction({ id: req.id, action: "APPROVED" })}
                            class="flex items-center gap-1 text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
                            title="Approve"
                          >
                            <CheckCircle class="w-4 h-4" />
                            <span class="text-xs font-bold">Approve</span>
                          </button>
                          <button
                            onClick={() => setConfirmAction({ id: req.id, action: "REJECTED" })}
                            class="flex items-center gap-1 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95"
                            title="Reject"
                          >
                            <XCircle class="w-4 h-4" />
                            <span class="text-xs font-bold">Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span class="text-[var(--color-text-tertiary)] text-xs font-medium italic px-3 py-1.5 bg-[var(--color-light-gray)] rounded-lg border border-[var(--color-border)] inline-block">
                          No Action Needed
                        </span>
                      )}
                    </td>
                  </tr>
                )}
              </For>

              {!isLoading() && filteredRequests().length === 0 && (
                <tr>
                  <td
                    colspan="6"
                    class="px-6 py-12 text-center text-[var(--color-text-secondary)] text-sm"
                  >
                    No leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction()}
        title={confirmAction()?.action === "APPROVED" ? "Setujui Cuti" : "Tolak Cuti"}
        message={confirmAction()?.action === "APPROVED" 
          ? "Apakah Anda yakin ingin menyetujui pengajuan cuti ini?" 
          : "Apakah Anda yakin ingin menolak pengajuan cuti ini? Karyawan akan menerima notifikasi penolakan."}
        confirmText={confirmAction()?.action === "APPROVED" ? "Setujui" : "Tolak"}
        cancelText="Kembali"
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
        variant={confirmAction()?.action === "APPROVED" ? "info" : "danger"}
        isLoading={isLoading()}
      />
    </div>
  );
};

export default ApprovalCuti;
