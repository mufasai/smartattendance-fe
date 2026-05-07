import { type Component, For, createSignal, onMount, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { ArrowLeft, Users, RefreshCw, Shuffle, UserPlus, X, Calendar, Loader2, AlertCircle } from "lucide-solid";
import { shiftTaskService } from "../services/shiftTaskService";
import { employeeGroupService } from "../services/employeeGroupService";
import { employeeService } from "../services/employeeService";
import { extractId } from "../types/shiftManagement";
import { ApiError } from "../utils/apiClient";

interface Employee {
    id: string;
    nik: string;
    full_name: string;
    department: string;
    working_time: string;
    location: string;
}

interface EmployeeGroup {
    id: string;
    name: string;
    employees: Employee[];
}

interface DaySchedule {
    date: string;
    dayName: string;
    shift1: string;
    shift2: string;
    shift3: string;
    off: string;
}

interface ShiftSchedule {
    shift_number: number;
    start_time: string;
    end_time: string;
}

interface ShiftTaskName {
    id: string;
    name: string;
    department: string;
    working_location: string;
    shift_type: string;
    number_of_groups: number;
    schedules: ShiftSchedule[];
    created_at: string;
}

const EmployeeGroupManagement: Component = () => {
    const params = useParams();
    const navigate = useNavigate();

    const [shiftTask, setShiftTask] = createSignal<ShiftTaskName | null>(null);
    const [groups, setGroups] = createSignal<EmployeeGroup[]>([]);
    const [availableEmployees, setAvailableEmployees] = createSignal<Employee[]>([]);
    const [allEmployees, setAllEmployees] = createSignal<Employee[]>([]);
    const [isLoading, setIsLoading] = createSignal(false);
    const [isLoadingTask, setIsLoadingTask] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);
    const [schedulePreview, setSchedulePreview] = createSignal<DaySchedule[]>([]);
    const [showSchedulePreview, setShowSchedulePreview] = createSignal(false);

    const dayNames = ["SENIN", "SELASA", "RABU", "KAMIS", "JUM'AT", "SABTU", "MINGGU"];

    // Fetch shift task data from API
    const fetchShiftTask = async () => {
        setIsLoadingTask(true);
        setError(null);

        try {
            if (!params.id) {
                throw new Error("No shift task ID provided");
            }

            console.log("Fetching shift task with ID:", params.id);
            const task = await shiftTaskService.getById(params.id);
            console.log("Fetched shift task from API:", task);

            const mappedTask: ShiftTaskName = {
                id: extractId(task.id),
                name: task.name,
                department: task.department,
                working_location: task.working_location,
                shift_type: task.shift_type,
                number_of_groups: task.number_of_groups,
                schedules: task.schedules,
                created_at: task.created_at,
            };

            setShiftTask(mappedTask);
            initializeGroups(task.number_of_groups);

            // Try to load existing groups from API
            if (params.id) {
                await fetchExistingGroups(params.id);
            }
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : "Failed to fetch shift task";
            setError(errorMessage);
            console.error("Error fetching shift task:", err);
            alert(`Shift task with ID ${params.id} not found. Please go back and try again.`);
        } finally {
            setIsLoadingTask(false);
        }
    };

    // Fetch existing employee groups from API
    const fetchExistingGroups = async (shiftTaskId: string) => {
        try {
            const response = await employeeGroupService.getGroups(shiftTaskId);
            console.log("Fetched existing groups:", response);

            if (response.groups && response.groups.length > 0) {
                // Map groups with employees directly from API response
                const mappedGroups = response.groups.map(group => ({
                    id: extractId(group.id),
                    name: group.name,
                    employees: (group.employees || []).map(emp => ({
                        id: extractId(emp.id),
                        nik: emp.nik,
                        full_name: emp.full_name,
                        department: emp.department || "General",
                        working_time: "Shift",
                        location: "Main Office",
                    })),
                }));

                console.log("Mapped groups with employees:", mappedGroups);
                setGroups(mappedGroups);

                // Update available employees (remove those already in groups)
                const assignedNiks = new Set(
                    mappedGroups.flatMap(g => g.employees.map(e => e.nik))
                );
                setAvailableEmployees(prev =>
                    prev.filter(emp => !assignedNiks.has(emp.nik))
                );
            }
        } catch (err) {
            console.log("No existing groups found or error fetching:", err);
            // Not a critical error - groups might not exist yet
        }
    };

    // Initialize groups based on number_of_groups
    const initializeGroups = (numberOfGroups: number) => {
        const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const newGroups: EmployeeGroup[] = [];

        for (let i = 0; i < numberOfGroups; i++) {
            newGroups.push({
                id: `group-${i}`,
                name: `Group ${groupNames[i]}`,
                employees: [],
            });
        }

        setGroups(newGroups);
    };

    // Fetch employees
    const fetchEmployees = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await employeeService.getAll();

            console.log("API Response:", data);

            const mappedData = data.map((item: any) => ({
                id: extractId(item.id),
                nik: item.nik,
                full_name: item.full_name,
                department: item.department || "General",
                working_time: item.working_time || "Shift",
                location: item.location || "Main Office",
            }));

            console.log("Mapped Data:", mappedData);
            console.log("Shift Task:", shiftTask());

            // Filter employees by department (flexible matching)
            const task = shiftTask();
            if (task) {
                const taskDept = task.department.toLowerCase().trim();
                const filtered = mappedData.filter((emp: Employee) => {
                    const empDept = (emp.department || "").toLowerCase().trim();
                    // Match if either contains the other (handles "Security" vs "Security Department")
                    const deptMatch = !taskDept ||
                        empDept.includes(taskDept) ||
                        taskDept.includes(empDept);
                    return deptMatch;
                });

                console.log(`Filter: ${filtered.length}/${mappedData.length} employees match dept "${task.department}"`);
                setAllEmployees(filtered);

                // Update available employees (remove those already in groups)
                const assignedNiks = new Set(
                    groups().flatMap(g => g.employees.map(e => e.nik))
                );
                setAvailableEmployees(filtered.filter((emp: { nik: string; }) => !assignedNiks.has(emp.nik)));
            } else {
                // No task filter — show all employees
                setAllEmployees(mappedData);

                // Update available employees (remove those already in groups)
                const assignedNiks = new Set(
                    groups().flatMap(g => g.employees.map(e => e.nik))
                );
                setAvailableEmployees(mappedData.filter((emp: { nik: string; }) => !assignedNiks.has(emp.nik)));
            }
        } catch (err) {
            console.error("Failed to fetch employees:", err);
            if (err instanceof ApiError) {
                setError(err.message);
            } else {
                setError("Failed to load employees. Please refresh the page.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Generate schedule preview (first week only)
    const generateSchedulePreview = (groupList: EmployeeGroup[]) => {
        const preview: DaySchedule[] = [];
        const today = new Date();

        // Get the start of current week (Monday)
        const startDate = new Date(today);
        const dayOfWeek = startDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + diff);

        // Generate first week (7 days)
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day);

            const dateStr = currentDate.toISOString().split('T')[0];
            const dayName = dayNames[day];

            // Calculate rotation pattern for first week
            const rotation = calculateRotation(0, day, groupList.length);

            preview.push({
                date: dateStr,
                dayName: dayName,
                shift1: rotation.shift1,
                shift2: rotation.shift2,
                shift3: rotation.shift3,
                off: rotation.off,
            });
        }

        setSchedulePreview(preview);
        setShowSchedulePreview(true);
    };

    // Calculate rotation pattern
    const calculateRotation = (week: number, day: number, numGroups: number) => {
        const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const task = shiftTask();
        const is2Shift = task?.shift_type === "2 Sesi";

        let offset = 0;

        if (is2Shift) {
            // For 2 shifts: rotate every 2 days
            // Week 1: Days 0-1: A,B (C,D off) -> Days 2-3: C,D (A,B off) -> Days 4-5: A,B -> Day 6: C,D
            if (week === 0) {
                if (day <= 1) offset = 0;      // Mon-Tue: A,B
                else if (day <= 3) offset = 2; // Wed-Thu: C,D
                else if (day <= 5) offset = 0; // Fri-Sat: A,B
                else offset = 2;               // Sun: C,D
            } else {
                if (day <= 1) offset = 2;      // Mon-Tue: C,D
                else if (day <= 3) offset = 0; // Wed-Thu: A,B
                else if (day <= 5) offset = 2; // Fri-Sat: C,D
                else offset = 0;               // Sun: A,B
            }

            // For 2 shifts: shift1, shift2, and rest are off
            const shift1Index = offset % numGroups;
            const shift2Index = (offset + 1) % numGroups;
            const off1Index = (offset + 2) % numGroups;
            const off2Index = (offset + 3) % numGroups;

            return {
                shift1: `Group-${groupNames[shift1Index]}`,
                shift2: `Group-${groupNames[shift2Index]}`,
                shift3: "", // No shift 3 for 2 Sesi
                off: `Group-${groupNames[off1Index]}${numGroups > 3 ? `, Group-${groupNames[off2Index]}` : ""}`,
            };
        } else {
            // For 3 shifts: original rotation
            if (week === 0) {
                // Week 1
                if (day <= 1) offset = 0;      // Mon-Tue: A,B,C,D
                else if (day <= 3) offset = 3; // Wed-Thu: D,A,B,C
                else if (day <= 5) offset = 2; // Fri-Sat: C,D,A,B
                else offset = 1;               // Sun: B,C,D,A
            } else {
                // Week 2-4
                if (day <= 1) offset = 1;      // Mon-Tue: B,C,D,A
                else if (day <= 3) offset = 0; // Wed-Thu: A,B,C,D
                else if (day <= 5) offset = 3; // Fri-Sat: D,A,B,C
                else offset = 2;               // Sun: C,D,A,B
            }

            // Apply rotation for 3 shifts
            const shift1Index = offset % numGroups;
            const shift2Index = (offset + 1) % numGroups;
            const shift3Index = (offset + 2) % numGroups;
            const offIndex = (offset + 3) % numGroups;

            return {
                shift1: `Group-${groupNames[shift1Index]}`,
                shift2: `Group-${groupNames[shift2Index]}`,
                shift3: `Group-${groupNames[shift3Index]}`,
                off: `Group-${groupNames[offIndex]}`,
            };
        }
    };

    // Generate and distribute employees to groups
    const generateEmployeeDistribution = () => {
        const available = [...availableEmployees()];
        const numberOfGroups = groups().length;

        console.log("=== GENERATE EMPLOYEE DISTRIBUTION ===");
        console.log("Available employees:", available.length);
        console.log("Number of groups:", numberOfGroups);

        if (available.length === 0) {
            alert("No available employees to distribute");
            return;
        }

        // Shuffle employees randomly
        const shuffled = available.sort(() => Math.random() - 0.5);

        // Calculate employees per group
        const employeesPerGroup = Math.floor(shuffled.length / numberOfGroups);
        const remainder = shuffled.length % numberOfGroups;

        console.log("Employees per group:", employeesPerGroup);
        console.log("Remainder:", remainder);

        const newGroups = groups().map((group, index) => {
            const startIndex = index * employeesPerGroup + Math.min(index, remainder);
            const endIndex = startIndex + employeesPerGroup + (index < remainder ? 1 : 0);
            const assignedEmployees = shuffled.slice(startIndex, endIndex);

            console.log(`Group ${group.name}:`, {
                startIndex,
                endIndex,
                employees: assignedEmployees.length,
                niks: assignedEmployees.map(e => e.nik)
            });

            return {
                ...group,
                employees: assignedEmployees,
            };
        });

        setGroups(newGroups);
        setAvailableEmployees([]); // All employees are now assigned

        console.log("=== DISTRIBUTION COMPLETE ===");
        console.log("New groups:", newGroups.map(g => ({
            name: g.name,
            employeeCount: g.employees.length,
            niks: g.employees.map(e => e.nik)
        })));

        // Save to API
        saveGroupsToAPI(newGroups);

        // Auto-generate schedule preview
        generateSchedulePreview(newGroups);
    };

    // Save groups to API
    const saveGroupsToAPI = async (groupsData: EmployeeGroup[]) => {
        if (!params.id) {
            console.error("No shift task ID provided");
            return;
        }

        try {
            const saveDto = {
                groups: groupsData.map(group => ({
                    name: group.name,
                    employee_niks: group.employees.map(emp => emp.nik),
                })),
            };

            console.log("=== SAVING GROUPS TO API ===");
            console.log("Request payload:", JSON.stringify(saveDto, null, 2));
            console.log("Total groups:", saveDto.groups.length);
            saveDto.groups.forEach((g, i) => {
                console.log(`Group ${i + 1} (${g.name}): ${g.employee_niks.length} NIKs`, g.employee_niks);
            });

            const response = await employeeGroupService.saveGroups(params.id, saveDto);

            console.log("=== API RESPONSE ===");
            console.log("Response:", JSON.stringify(response, null, 2));
            console.log("Groups returned:", response.length);
            response.forEach((g, i) => {
                console.log(`Group ${i + 1} (${g.name}):`, {
                    employee_niks: g.employee_niks?.length || 0,
                    employees: g.employees?.length || 0
                });
            });

            console.log("Groups saved to API successfully");
        } catch (err) {
            console.error("Error saving groups to API:", err);
            alert("Failed to save groups. Please try again.");
        }
    };

    // Reset all groups
    const resetGroups = () => {
        if (confirm("Are you sure you want to reset all groups? This will remove all employee assignments.")) {
            const resetGroups = groups().map(group => ({
                ...group,
                employees: [],
            }));
            setGroups(resetGroups);
            setAvailableEmployees([...allEmployees()]);
        }
    };

    // Add employee to specific group
    const addEmployeeToGroup = (groupId: string, employee: Employee) => {
        // Check if employee is already in this group
        const targetGroup = groups().find(g => g.id === groupId);
        if (targetGroup && targetGroup.employees.some(emp => emp.id === employee.id)) {
            console.log("Employee already in this group");
            return;
        }

        const newGroups = groups().map(group => {
            if (group.id === groupId) {
                return {
                    ...group,
                    employees: [...group.employees, employee],
                };
            }
            return group;
        });

        setGroups(newGroups);

        // Remove from available employees
        setAvailableEmployees(prev => prev.filter(emp => emp.id !== employee.id));

        // Save to API
        saveGroupsToAPI(newGroups);
    };

    // Remove employee from group
    const removeEmployeeFromGroup = (groupId: string, employeeId: string) => {
        let removedEmployee: Employee | null = null;

        const newGroups = groups().map(group => {
            if (group.id === groupId) {
                const employee = group.employees.find(emp => emp.id === employeeId);
                if (employee) {
                    removedEmployee = employee;
                }
                return {
                    ...group,
                    employees: group.employees.filter(emp => emp.id !== employeeId),
                };
            }
            return group;
        });

        setGroups(newGroups);

        // Add removed employee back to available employees
        if (removedEmployee) {
            // Check if employee is in allEmployees (should be)
            const isInAllEmployees = allEmployees().some(emp => emp.id === removedEmployee!.id);
            if (isInAllEmployees) {
                // Add back to available employees if not already there
                const isAlreadyAvailable = availableEmployees().some(emp => emp.id === removedEmployee!.id);
                if (!isAlreadyAvailable) {
                    setAvailableEmployees(prev => [...prev, removedEmployee!]);
                }
            }
        }

        // Save to API
        saveGroupsToAPI(newGroups);
    };

    // Drag and drop handlers
    const [draggedEmployee, setDraggedEmployee] = createSignal<Employee | null>(null);

    const handleDragStart = (employee: Employee) => {
        setDraggedEmployee(employee);
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (groupId: string) => {
        const employee = draggedEmployee();
        if (!employee) return;

        addEmployeeToGroup(groupId, employee);
        setDraggedEmployee(null);
    };

    onMount(async () => {
        await fetchShiftTask();
        await fetchEmployees();
    });

    const getTotalAssigned = () => {
        return groups().reduce((total, group) => total + group.employees.length, 0);
    };

    return (
        <div class="space-y-6">
            {/* Header */}
            <div class="flex items-center gap-4">
                <button
                    onClick={() => navigate("/shift")}
                    class="p-2 hover:bg-[var(--color-light-gray)] rounded-lg transition-colors"
                >
                    <ArrowLeft class="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
                        Employee Group Management
                    </h2>
                    <Show when={shiftTask()}>
                        <p class="text-sm text-[var(--color-text-secondary)]">
                            {shiftTask()!.name} - {shiftTask()!.department} ({shiftTask()!.working_location})
                        </p>
                    </Show>
                </div>
            </div>

            {/* Loading State */}
            <Show when={isLoadingTask()}>
                <div class="flex flex-col items-center justify-center py-12">
                    <Loader2 class="w-8 h-8 text-[var(--color-primary-button)] animate-spin mb-2" />
                    <p class="text-sm text-[var(--color-text-secondary)]">Loading shift task...</p>
                </div>
            </Show>

            {/* Error Message */}
            <Show when={error()}>
                <div class="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                    <AlertCircle class="w-5 h-5 text-red-600" />
                    <div class="flex-1">
                        <p class="text-sm font-medium text-red-800">{error()}</p>
                    </div>
                    <button
                        onClick={fetchShiftTask}
                        class="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Retry
                    </button>
                </div>
            </Show>

            {/* Stats and Actions */}
            <Show when={!isLoadingTask() && !error()}>
                <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-6">
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <div class="flex gap-6">
                            <div>
                                <p class="text-sm text-[var(--color-text-secondary)]">Total Groups</p>
                                <p class="text-2xl font-bold text-[var(--color-text-primary)]">{groups().length}</p>
                            </div>
                            <div>
                                <p class="text-sm text-[var(--color-text-secondary)]">Total Employees</p>
                                <p class="text-2xl font-bold text-[var(--color-text-primary)]">{allEmployees().length}</p>
                            </div>
                            <div>
                                <p class="text-sm text-[var(--color-text-secondary)]">Assigned</p>
                                <p class="text-2xl font-bold text-green-600">{getTotalAssigned()}</p>
                            </div>
                            <div>
                                <p class="text-sm text-[var(--color-text-secondary)]">Available</p>
                                <p class="text-2xl font-bold text-blue-600">{availableEmployees().length}</p>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <button
                                onClick={resetGroups}
                                class="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-light-gray)] transition-all"
                            >
                                <RefreshCw class="w-4 h-4" />
                                Reset Groups
                            </button>
                            <button
                                onClick={generateEmployeeDistribution}
                                disabled={availableEmployees().length === 0}
                                class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Shuffle class="w-4 h-4" />
                                Generate Groups & Schedule
                            </button>
                        </div>
                    </div>
                </div>

                {/* Groups and Available Employees */}
                <div class="grid lg:grid-cols-3 gap-6">
                    {/* Groups Column (2/3 width) */}
                    <div class="lg:col-span-2 space-y-4">
                        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">Groups</h3>
                        <div class="space-y-4">
                            <For each={groups()}>
                                {(group) => (
                                    <div
                                        class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-4"
                                        onDragOver={handleDragOver}
                                        onDrop={() => handleDrop(group.id)}
                                    >
                                        <div class="flex items-center justify-between mb-3">
                                            <div class="flex items-center gap-2">
                                                <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <span class="text-blue-700 font-bold text-lg">{group.name.split(" ")[1]}</span>
                                                </div>
                                                <div>
                                                    <h4 class="font-semibold text-[var(--color-text-primary)]">{group.name}</h4>
                                                    <p class="text-xs text-[var(--color-text-secondary)]">
                                                        {group.employees.length} members
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="space-y-2 min-h-[150px] max-h-[300px] overflow-y-auto">
                                            <Show when={group.employees.length === 0}>
                                                <div class="flex items-center justify-center h-[150px] border-2 border-dashed border-[var(--color-border)] rounded-xl">
                                                    <p class="text-sm text-[var(--color-text-secondary)]">
                                                        Drop employees here or click Generate
                                                    </p>
                                                </div>
                                            </Show>
                                            <For each={group.employees}>
                                                {(employee) => (
                                                    <div class="flex items-center justify-between bg-[var(--color-light-gray)] p-3 rounded-lg hover:bg-gray-100 transition-colors">
                                                        <div class="flex-1">
                                                            <p class="font-medium text-sm text-[var(--color-text-primary)]">
                                                                {employee.full_name}
                                                            </p>
                                                            <p class="text-xs text-[var(--color-text-secondary)]">
                                                                NIK: {employee.nik}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeEmployeeFromGroup(group.id, employee.id)}
                                                            class="text-red-600 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                                                            title="Remove from group"
                                                        >
                                                            <X class="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>

                    {/* Available Employees Column (1/3 width) */}
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                                Available Employees
                            </h3>
                            <span class="text-sm text-[var(--color-text-secondary)]">
                                {availableEmployees().length} available
                            </span>
                        </div>

                        <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] p-4">
                            <div class="space-y-2 max-h-[600px] overflow-y-auto">
                                <Show when={isLoading()}>
                                    <div class="flex flex-col items-center justify-center py-12 text-center">
                                        <RefreshCw class="w-12 h-12 text-[var(--color-text-secondary)] mb-2 animate-spin" />
                                        <p class="text-sm text-[var(--color-text-secondary)]">
                                            Loading employees...
                                        </p>
                                    </div>
                                </Show>
                                <Show when={!isLoading() && availableEmployees().length === 0}>
                                    <div class="flex flex-col items-center justify-center py-12 text-center">
                                        <Users class="w-12 h-12 text-[var(--color-text-secondary)] mb-2" />
                                        <p class="text-sm text-[var(--color-text-secondary)]">
                                            All employees have been assigned to groups
                                        </p>
                                        <p class="text-xs text-[var(--color-text-secondary)] mt-2">
                                            Total in system: {allEmployees().length}
                                        </p>
                                    </div>
                                </Show>
                                <Show when={!isLoading() && availableEmployees().length > 0}>
                                    <For each={availableEmployees()}>
                                        {(employee) => (
                                            <div
                                                class="flex items-center justify-between bg-[var(--color-light-gray)] p-3 rounded-lg cursor-move hover:shadow-sm transition-all"
                                                draggable={true}
                                                onDragStart={() => handleDragStart(employee)}
                                            >
                                                <div class="flex-1">
                                                    <p class="font-medium text-sm text-[var(--color-text-primary)]">
                                                        {employee.full_name}
                                                    </p>
                                                    <p class="text-xs text-[var(--color-text-secondary)]">
                                                        NIK: {employee.nik} • {employee.department}
                                                    </p>
                                                </div>
                                                <UserPlus class="w-4 h-4 text-[var(--color-text-secondary)]" />
                                            </div>
                                        )}
                                    </For>
                                </Show>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedule Preview Section */}
                <Show when={showSchedulePreview()}>
                    <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                        <div class="p-6 border-b border-[var(--color-border)]">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <Calendar class="w-5 h-5 text-[var(--color-text-secondary)]" />
                                    <div>
                                        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                                            Schedule Preview - Week 1
                                        </h3>
                                        <p class="text-sm text-[var(--color-text-secondary)]">
                                            Preview of the first week schedule
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/shift-management/${params.id}/schedule`)}
                                    class="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium"
                                >
                                    <Calendar class="w-4 h-4" />
                                    View Full Schedule (4 Weeks)
                                </button>
                            </div>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-[var(--color-light-gray)]">
                                    <tr>
                                        <th class="text-left p-4 font-medium text-[var(--color-text-primary)] w-32">Day</th>
                                        <th class="text-center p-4 font-medium text-[var(--color-text-primary)] bg-green-50">
                                            <div>SHIFT-1</div>
                                            <div class="text-xs font-normal text-[var(--color-text-secondary)]">
                                                {shiftTask()?.schedules[0]?.start_time} - {shiftTask()?.schedules[0]?.end_time}
                                            </div>
                                        </th>
                                        <th class="text-center p-4 font-medium text-[var(--color-text-primary)] bg-green-50">
                                            <div>SHIFT-2</div>
                                            <div class="text-xs font-normal text-[var(--color-text-secondary)]">
                                                {shiftTask()?.schedules[1]?.start_time} - {shiftTask()?.schedules[1]?.end_time}
                                            </div>
                                        </th>
                                        <Show when={shiftTask()?.shift_type === "3 Sesi"}>
                                            <th class="text-center p-4 font-medium text-[var(--color-text-primary)] bg-green-50">
                                                <div>SHIFT-3</div>
                                                <div class="text-xs font-normal text-[var(--color-text-secondary)]">
                                                    {shiftTask()?.schedules[2]?.start_time} - {shiftTask()?.schedules[2]?.end_time}
                                                </div>
                                            </th>
                                        </Show>
                                        <th class="text-center p-4 font-medium text-[var(--color-text-primary)] bg-yellow-50">
                                            LIBUR (OFF)
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <For each={schedulePreview()}>
                                        {(day) => (
                                            <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-light-gray)] transition-colors">
                                                <td class="p-4">
                                                    <div class="font-medium text-[var(--color-text-primary)]">{day.dayName}</div>
                                                    <div class="text-xs text-[var(--color-text-secondary)]">
                                                        {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </td>
                                                <td class="p-4 text-center bg-green-50">
                                                    <span class="font-medium text-[var(--color-text-primary)]">{day.shift1}</span>
                                                </td>
                                                <td class="p-4 text-center bg-green-50">
                                                    <span class="font-medium text-[var(--color-text-primary)]">{day.shift2}</span>
                                                </td>
                                                <Show when={shiftTask()?.shift_type === "3 Sesi"}>
                                                    <td class="p-4 text-center bg-green-50">
                                                        <span class="font-medium text-[var(--color-text-primary)]">{day.shift3}</span>
                                                    </td>
                                                </Show>
                                                <td class="p-4 text-center bg-yellow-50">
                                                    <span class="font-medium text-[var(--color-text-primary)]">{day.off}</span>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        <div class="p-4 bg-blue-50 border-t border-blue-200">
                            <p class="text-sm text-blue-800">
                                💡 <strong>Tip:</strong> This is a preview of the first week. Click "View Full Schedule" to see all 4 weeks and make edits.
                            </p>
                        </div>
                    </div>
                </Show>
            </Show>
        </div>
    );
};

export default EmployeeGroupManagement;
