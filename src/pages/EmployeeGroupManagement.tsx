import { type Component, For, createSignal, onMount, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { ArrowLeft, Users, RefreshCw, Shuffle, UserPlus, X, Calendar } from "lucide-solid";

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

interface ShiftTaskName {
    id: string;
    name: string;
    department: string;
    working_location: string;
    shift_type: string;
    number_of_groups: number;
    schedules: any[];
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
    const [schedulePreview, setSchedulePreview] = createSignal<DaySchedule[]>([]);
    const [showSchedulePreview, setShowSchedulePreview] = createSignal(false);

    const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8080/api";
    const dayNames = ["SENIN", "SELASA", "RABU", "KAMIS", "JUM'AT", "SABTU", "MINGGU"];

    // Fetch shift task data
    const fetchShiftTask = () => {
        console.log("Fetching shift task with ID:", params.id);

        // Try to load from localStorage first
        const saved = localStorage.getItem('shiftTaskNames');
        let allTasks: ShiftTaskName[] = [];

        if (saved) {
            try {
                allTasks = JSON.parse(saved);
                console.log("Loaded from localStorage:", allTasks);
            } catch (e) {
                console.error('Failed to parse saved shift tasks:', e);
            }
        }

        // Fallback to mock data if localStorage is empty
        if (allTasks.length === 0) {
            allTasks = [
                {
                    id: "1",
                    name: "Security Head Office",
                    department: "Security",
                    working_location: "Head Office",
                    shift_type: "3 Sesi",
                    number_of_groups: 4,
                    schedules: [],
                    created_at: new Date().toISOString(),
                },
                {
                    id: "2",
                    name: "Security Factory Bekasi",
                    department: "Security",
                    working_location: "Factory Bekasi",
                    shift_type: "3 Sesi",
                    number_of_groups: 4,
                    schedules: [],
                    created_at: new Date().toISOString(),
                },
                {
                    id: "3",
                    name: "Security Factory Sukabumi",
                    department: "Security",
                    working_location: "Factory Sukabumi",
                    shift_type: "3 Sesi",
                    number_of_groups: 4,
                    schedules: [],
                    created_at: new Date().toISOString(),
                },
            ];
        }

        const task = allTasks.find(t => t.id === params.id);
        console.log("Found shift task:", task);

        if (task) {
            setShiftTask(task);
            initializeGroups(task.number_of_groups);
        } else {
            console.error("Shift task not found for ID:", params.id);
            alert(`Shift task with ID ${params.id} not found. Please go back and try again.`);
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
        try {
            const response = await fetch(`${BASE_URL}/employees`);
            const result = await response.json();

            console.log("API Response:", result);

            if (response.ok && result.status === "success") {
                const mappedData = result.data.map((item: any) => ({
                    id: item.id?.id?.String || item.id?.id || item.id,
                    nik: item.nik,
                    full_name: item.full_name,
                    department: item.department || "General",
                    working_time: item.working_time || "Shift",
                    location: item.location || "Main Office",
                }));

                console.log("Mapped Data:", mappedData);
                console.log("Shift Task:", shiftTask());

                // Filter employees by department (very flexible)
                const task = shiftTask();
                if (task) {
                    // Very flexible filtering with word-based matching
                    const filtered = mappedData.filter(
                        (emp: Employee) => {
                            // Extract words from department names for flexible matching
                            // "Security" matches "Security Department", "Security Operations", etc.
                            const taskDeptWords = task.department.toLowerCase().split(/\s+/);
                            const empDeptWords = emp.department.toLowerCase().split(/\s+/);

                            // Check if any word from task department appears in employee department
                            const deptMatch = !task.department ||
                                taskDeptWords.some(word =>
                                    empDeptWords.some(empWord =>
                                        empWord.includes(word) || word.includes(empWord)
                                    )
                                );

                            // Very lenient location filter - only filter if both have location AND they don't match
                            // If employee has no location field, we include them
                            const locMatch = !task.working_location ||
                                !emp.location ||
                                emp.location.toLowerCase().includes(task.working_location.toLowerCase()) ||
                                task.working_location.toLowerCase().includes(emp.location.toLowerCase());

                            console.log(`Employee ${emp.full_name}:`, {
                                department: emp.department,
                                taskDepartment: task.department,
                                location: emp.location,
                                taskLocation: task.working_location,
                                working_time: emp.working_time,
                                deptMatch,
                                locMatch,
                                included: deptMatch && locMatch
                            });

                            return deptMatch && locMatch;
                        }
                    );

                    console.log("Filtered Employees:", filtered);
                    console.log(`Filter result: ${filtered.length} out of ${mappedData.length} employees match criteria`);
                    setAllEmployees(filtered);
                    setAvailableEmployees(filtered);
                } else {
                    console.log("No shift task, showing all employees");
                    setAllEmployees(mappedData);
                    setAvailableEmployees(mappedData);
                }
            } else {
                console.log("API failed, using mock data");
                // Mock data for testing
                const mockEmployees: Employee[] = [
                    { id: "1", nik: "001", full_name: "Agus Santoso", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "2", nik: "002", full_name: "Budi Prasetyo", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "3", nik: "003", full_name: "Catur Wibowo", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "4", nik: "004", full_name: "Dodik Setiawan", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "5", nik: "005", full_name: "Eko Susanto", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "6", nik: "006", full_name: "Fajar Rahman", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "7", nik: "007", full_name: "Gunawan Adi", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "8", nik: "008", full_name: "Hendra Wijaya", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "9", nik: "009", full_name: "Indra Kusuma", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "10", nik: "010", full_name: "Joko Susilo", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "11", nik: "011", full_name: "Kurniawan Eko", department: "Security", working_time: "Shift", location: "Head Office" },
                    { id: "12", nik: "012", full_name: "Lukman Hakim", department: "Security", working_time: "Shift", location: "Head Office" },
                ];

                const task = shiftTask();
                if (task) {
                    const filtered = mockEmployees.filter(
                        emp =>
                            emp.department === task.department &&
                            emp.location === task.working_location
                    );
                    setAllEmployees(filtered);
                    setAvailableEmployees(filtered);
                } else {
                    setAllEmployees(mockEmployees);
                    setAvailableEmployees(mockEmployees);
                }
            }
        } catch (err) {
            console.error("Failed to fetch employees:", err);
            // Use mock data on error
            const mockEmployees: Employee[] = [
                { id: "1", nik: "001", full_name: "Agus Santoso", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "2", nik: "002", full_name: "Budi Prasetyo", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "3", nik: "003", full_name: "Catur Wibowo", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "4", nik: "004", full_name: "Dodik Setiawan", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "5", nik: "005", full_name: "Eko Susanto", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "6", nik: "006", full_name: "Fajar Rahman", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "7", nik: "007", full_name: "Gunawan Adi", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "8", nik: "008", full_name: "Hendra Wijaya", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "9", nik: "009", full_name: "Indra Kusuma", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "10", nik: "010", full_name: "Joko Susilo", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "11", nik: "011", full_name: "Kurniawan Eko", department: "Security", working_time: "Shift", location: "Head Office" },
                { id: "12", nik: "012", full_name: "Lukman Hakim", department: "Security", working_time: "Shift", location: "Head Office" },
            ];
            setAllEmployees(mockEmployees);
            setAvailableEmployees(mockEmployees);
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

        if (available.length === 0) {
            alert("No available employees to distribute");
            return;
        }

        // Shuffle employees randomly
        const shuffled = available.sort(() => Math.random() - 0.5);

        // Calculate employees per group
        const employeesPerGroup = Math.floor(shuffled.length / numberOfGroups);
        const remainder = shuffled.length % numberOfGroups;

        const newGroups = groups().map((group, index) => {
            const startIndex = index * employeesPerGroup + Math.min(index, remainder);
            const endIndex = startIndex + employeesPerGroup + (index < remainder ? 1 : 0);

            return {
                ...group,
                employees: shuffled.slice(startIndex, endIndex),
            };
        });

        setGroups(newGroups);
        setAvailableEmployees([]); // All employees are now assigned

        // Save to localStorage
        saveGroupsToStorage(newGroups);

        // Auto-generate schedule preview
        generateSchedulePreview(newGroups);
    };

    // Save groups to localStorage
    const saveGroupsToStorage = (groupsData: EmployeeGroup[]) => {
        const taskId = params.id;
        localStorage.setItem(`employeeGroups_${taskId}`, JSON.stringify(groupsData));
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
        setAvailableEmployees(prev => prev.filter(emp => emp.id !== employee.id));

        // Save to localStorage
        saveGroupsToStorage(newGroups);
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

        if (removedEmployee) {
            setAvailableEmployees(prev => [...prev, removedEmployee!]);
        }

        // Save to localStorage
        saveGroupsToStorage(newGroups);
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

    onMount(() => {
        fetchShiftTask();
        fetchEmployees();
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

            {/* Stats and Actions */}
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
        </div>
    );
};

export default EmployeeGroupManagement;
