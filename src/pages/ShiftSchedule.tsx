import { type Component, For, createSignal, onMount, Show } from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { ArrowLeft, Calendar, Save, RefreshCw, Edit2, Check, X } from "lucide-solid";

interface EmployeeGroup {
    id: string;
    name: string;
    employees: any[];
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

interface DaySchedule {
    date: string;
    dayName: string;
    shift1: string; // Group name or "OFF"
    shift2: string;
    shift3: string;
    off: string;
}

interface WeekSchedule {
    weekNumber: number;
    days: DaySchedule[];
}

const ShiftSchedule: Component = () => {
    const params = useParams();
    const navigate = useNavigate();

    const [shiftTask, setShiftTask] = createSignal<ShiftTaskName | null>(null);
    const [groups, setGroups] = createSignal<EmployeeGroup[]>([]);
    const [schedule, setSchedule] = createSignal<WeekSchedule[]>([]);
    const [editingCell, setEditingCell] = createSignal<{ week: number; day: number; shift: string } | null>(null);
    const [tempValue, setTempValue] = createSignal("");

    const dayNames = ["SENIN", "SELASA", "RABU", "KAMIS", "JUM'AT", "SABTU", "MINGGU"];

    // Fetch shift task data
    const fetchShiftTask = () => {
        const saved = localStorage.getItem('shiftTaskNames');
        let allTasks: ShiftTaskName[] = [];

        if (saved) {
            try {
                allTasks = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved shift tasks:', e);
            }
        }

        const task = allTasks.find(t => t.id === params.id);
        if (task) {
            setShiftTask(task);
            loadGroups(task.id);
        }
    };

    // Load groups from localStorage
    const loadGroups = (taskId: string) => {
        const saved = localStorage.getItem(`employeeGroups_${taskId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setGroups(parsed);
                generateSchedule(parsed);
            } catch (e) {
                console.error('Failed to parse saved groups:', e);
                // Generate default groups
                generateDefaultGroups();
            }
        } else {
            generateDefaultGroups();
        }
    };

    // Generate default groups if not found
    const generateDefaultGroups = () => {
        const task = shiftTask();
        if (!task) return;

        const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const newGroups: EmployeeGroup[] = [];

        for (let i = 0; i < task.number_of_groups; i++) {
            newGroups.push({
                id: `group-${i}`,
                name: `Group ${groupNames[i]}`,
                employees: [],
            });
        }

        setGroups(newGroups);
        generateSchedule(newGroups);
    };

    // Generate schedule for 4 weeks (1 month)
    const generateSchedule = (groupList: EmployeeGroup[]) => {
        const weeks: WeekSchedule[] = [];
        const today = new Date();

        // Get the start of current week (Monday)
        const startDate = new Date(today);
        const dayOfWeek = startDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
        startDate.setDate(startDate.getDate() + diff);

        // Generate 4 weeks
        for (let week = 0; week < 4; week++) {
            const weekDays: DaySchedule[] = [];

            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                const dateStr = currentDate.toISOString().split('T')[0];
                const dayName = dayNames[day];

                // Calculate rotation pattern based on week and day
                const rotation = calculateRotation(week, day, groupList.length);

                weekDays.push({
                    date: dateStr,
                    dayName: dayName,
                    shift1: rotation.shift1,
                    shift2: rotation.shift2,
                    shift3: rotation.shift3,
                    off: rotation.off,
                });
            }

            weeks.push({
                weekNumber: week + 1,
                days: weekDays,
            });
        }

        setSchedule(weeks);
    };

    // Calculate rotation pattern based on the image
    const calculateRotation = (week: number, day: number, numGroups: number) => {
        const groupNames = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
        const task = shiftTask();
        const is2Shift = task?.shift_type === "2 Sesi";

        // Calculate the rotation offset
        let offset = 0;

        if (is2Shift) {
            // For 2 shifts: rotate every 2 days
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
            // Week offset
            if (week === 0) {
                // Week 1
                if (day <= 1) offset = 0;      // Mon-Tue: A,B,C,D
                else if (day <= 3) offset = 3; // Wed-Thu: D,A,B,C
                else if (day <= 5) offset = 2; // Fri-Sat: C,D,A,B
                else offset = 1;               // Sun: B,C,D,A
            } else if (week === 1) {
                // Week 2
                if (day <= 1) offset = 1;      // Mon-Tue: B,C,D,A
                else if (day <= 3) offset = 0; // Wed-Thu: A,B,C,D
                else if (day <= 5) offset = 3; // Fri-Sat: D,A,B,C
                else offset = 2;               // Sun: C,D,A,B
            } else if (week === 2) {
                // Week 3
                if (day <= 1) offset = 1;      // Mon-Tue: B,C,D,A
                else if (day <= 3) offset = 0; // Wed-Thu: A,B,C,D
                else if (day <= 5) offset = 3; // Fri-Sat: D,A,B,C
                else offset = 2;               // Sun: C,D,A,B
            } else {
                // Week 4
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

    // Start editing a cell
    const startEdit = (week: number, day: number, shift: string, currentValue: string) => {
        setEditingCell({ week, day, shift });
        setTempValue(currentValue);
    };

    // Save edited cell
    const saveEdit = () => {
        const editing = editingCell();
        if (!editing) return;

        setSchedule(prev => prev.map((week, wIdx) => {
            if (wIdx === editing.week) {
                return {
                    ...week,
                    days: week.days.map((day, dIdx) => {
                        if (dIdx === editing.day) {
                            return {
                                ...day,
                                [editing.shift]: tempValue(),
                            };
                        }
                        return day;
                    }),
                };
            }
            return week;
        }));

        setEditingCell(null);
        setTempValue("");
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditingCell(null);
        setTempValue("");
    };

    // Save schedule to localStorage
    const saveSchedule = () => {
        const taskId = params.id;
        localStorage.setItem(`shiftSchedule_${taskId}`, JSON.stringify(schedule()));
        alert("Schedule saved successfully!");
    };

    // Regenerate schedule
    const regenerateSchedule = () => {
        if (confirm("Are you sure you want to regenerate the schedule? This will reset all manual changes.")) {
            generateSchedule(groups());
        }
    };

    onMount(() => {
        fetchShiftTask();
    });

    return (
        <div class="space-y-6">
            {/* Header */}
            <div class="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/shift-management/${params.id}/groups`)}
                    class="p-2 hover:bg-[var(--color-light-gray)] rounded-lg transition-colors"
                >
                    <ArrowLeft class="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-[var(--color-text-primary)]">
                        Shift Schedule
                    </h2>
                    <Show when={shiftTask()}>
                        <p class="text-sm text-[var(--color-text-secondary)]">
                            {shiftTask()!.name} - {shiftTask()!.department} ({shiftTask()!.working_location})
                        </p>
                    </Show>
                </div>
                <div class="flex gap-2">
                    <button
                        onClick={regenerateSchedule}
                        class="flex items-center gap-2 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-light-gray)] transition-all"
                    >
                        <RefreshCw class="w-4 h-4" />
                        Regenerate
                    </button>
                    <button
                        onClick={saveSchedule}
                        class="flex items-center gap-2 bg-[var(--color-primary-button)] text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium"
                    >
                        <Save class="w-4 h-4" />
                        Save Schedule
                    </button>
                </div>
            </div>

            {/* Schedule Table */}
            <div class="bg-white rounded-2xl shadow-sm border border-[var(--color-border)] overflow-hidden">
                <div class="p-6 border-b border-[var(--color-border)]">
                    <div class="flex items-center gap-2">
                        <Calendar class="w-5 h-5 text-[var(--color-text-secondary)]" />
                        <h3 class="text-lg font-semibold text-[var(--color-text-primary)]">
                            Monthly Shift Schedule
                        </h3>
                    </div>
                    <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                        Click on any cell to edit the group assignment
                    </p>
                </div>

                <div class="overflow-x-auto">
                    <For each={schedule()}>
                        {(week, weekIdx) => (
                            <div class="border-b border-[var(--color-border)] last:border-b-0">
                                <div class="bg-gray-50 px-6 py-3 border-b border-[var(--color-border)]">
                                    <h4 class="font-semibold text-[var(--color-text-primary)]">
                                        Minggu-{week.weekNumber}
                                    </h4>
                                </div>
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
                                        <For each={week.days}>
                                            {(day, dayIdx) => (
                                                <tr class="border-b border-[var(--color-border)] hover:bg-[var(--color-light-gray)] transition-colors">
                                                    <td class="p-4">
                                                        <div class="font-medium text-[var(--color-text-primary)]">{day.dayName}</div>
                                                        <div class="text-xs text-[var(--color-text-secondary)]">
                                                            {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </div>
                                                    </td>
                                                    <td class="p-4 text-center bg-green-50">
                                                        <Show
                                                            when={editingCell()?.week === weekIdx() && editingCell()?.day === dayIdx() && editingCell()?.shift === 'shift1'}
                                                            fallback={
                                                                <button
                                                                    onClick={() => startEdit(weekIdx(), dayIdx(), 'shift1', day.shift1)}
                                                                    class="w-full px-3 py-2 rounded-lg hover:bg-green-100 transition-colors group"
                                                                >
                                                                    <div class="flex items-center justify-center gap-2">
                                                                        <span class="font-medium text-[var(--color-text-primary)]">{day.shift1}</span>
                                                                        <Edit2 class="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </button>
                                                            }
                                                        >
                                                            <div class="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={tempValue()}
                                                                    onInput={(e) => setTempValue(e.currentTarget.value)}
                                                                    class="flex-1 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                                                                    autofocus
                                                                />
                                                                <button onClick={saveEdit} class="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                    <Check class="w-4 h-4" />
                                                                </button>
                                                                <button onClick={cancelEdit} class="p-1 text-red-600 hover:bg-red-100 rounded">
                                                                    <X class="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </Show>
                                                    </td>
                                                    <td class="p-4 text-center bg-green-50">
                                                        <Show
                                                            when={editingCell()?.week === weekIdx() && editingCell()?.day === dayIdx() && editingCell()?.shift === 'shift2'}
                                                            fallback={
                                                                <button
                                                                    onClick={() => startEdit(weekIdx(), dayIdx(), 'shift2', day.shift2)}
                                                                    class="w-full px-3 py-2 rounded-lg hover:bg-green-100 transition-colors group"
                                                                >
                                                                    <div class="flex items-center justify-center gap-2">
                                                                        <span class="font-medium text-[var(--color-text-primary)]">{day.shift2}</span>
                                                                        <Edit2 class="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </button>
                                                            }
                                                        >
                                                            <div class="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={tempValue()}
                                                                    onInput={(e) => setTempValue(e.currentTarget.value)}
                                                                    class="flex-1 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                                                                    autofocus
                                                                />
                                                                <button onClick={saveEdit} class="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                    <Check class="w-4 h-4" />
                                                                </button>
                                                                <button onClick={cancelEdit} class="p-1 text-red-600 hover:bg-red-100 rounded">
                                                                    <X class="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </Show>
                                                    </td>
                                                    <Show when={shiftTask()?.shift_type === "3 Sesi"}>
                                                        <td class="p-4 text-center bg-green-50">
                                                            <Show
                                                                when={editingCell()?.week === weekIdx() && editingCell()?.day === dayIdx() && editingCell()?.shift === 'shift3'}
                                                                fallback={
                                                                    <button
                                                                        onClick={() => startEdit(weekIdx(), dayIdx(), 'shift3', day.shift3)}
                                                                        class="w-full px-3 py-2 rounded-lg hover:bg-green-100 transition-colors group"
                                                                    >
                                                                        <div class="flex items-center justify-center gap-2">
                                                                            <span class="font-medium text-[var(--color-text-primary)]">{day.shift3}</span>
                                                                            <Edit2 class="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </button>
                                                                }
                                                            >
                                                                <div class="flex items-center gap-1">
                                                                    <input
                                                                        type="text"
                                                                        value={tempValue()}
                                                                        onInput={(e) => setTempValue(e.currentTarget.value)}
                                                                        class="flex-1 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                                                                        autofocus
                                                                    />
                                                                    <button onClick={saveEdit} class="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                        <Check class="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={cancelEdit} class="p-1 text-red-600 hover:bg-red-100 rounded">
                                                                        <X class="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </Show>
                                                        </td>
                                                    </Show>
                                                    <td class="p-4 text-center bg-yellow-50">
                                                        <Show
                                                            when={editingCell()?.week === weekIdx() && editingCell()?.day === dayIdx() && editingCell()?.shift === 'off'}
                                                            fallback={
                                                                <button
                                                                    onClick={() => startEdit(weekIdx(), dayIdx(), 'off', day.off)}
                                                                    class="w-full px-3 py-2 rounded-lg hover:bg-yellow-100 transition-colors group"
                                                                >
                                                                    <div class="flex items-center justify-center gap-2">
                                                                        <span class="font-medium text-[var(--color-text-primary)]">{day.off}</span>
                                                                        <Edit2 class="w-3 h-3 text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                    </div>
                                                                </button>
                                                            }
                                                        >
                                                            <div class="flex items-center gap-1">
                                                                <input
                                                                    type="text"
                                                                    value={tempValue()}
                                                                    onInput={(e) => setTempValue(e.currentTarget.value)}
                                                                    class="flex-1 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                                                                    autofocus
                                                                />
                                                                <button onClick={saveEdit} class="p-1 text-green-600 hover:bg-green-100 rounded">
                                                                    <Check class="w-4 h-4" />
                                                                </button>
                                                                <button onClick={cancelEdit} class="p-1 text-red-600 hover:bg-red-100 rounded">
                                                                    <X class="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </Show>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
};

export default ShiftSchedule;
