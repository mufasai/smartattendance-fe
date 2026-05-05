import { type Component, For } from "solid-js";
import { A, useNavigate } from "@solidjs/router";
import {
  LayoutDashboard,
  Users,
  LogOut,
  CalendarClock,
  Shield,
} from "lucide-solid";
import auth from "../store/auth";

const menuItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Employee", path: "/employee", icon: Users },
  { name: "Shift Management", path: "/shift", icon: CalendarClock },
  { name: "Patrol", path: "/patrol", icon: Shield },
];

const Sidebar: Component = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside class="w-64 bg-white border-r border-[var(--color-border)] h-full flex flex-col shadow-sm font-poppins z-20 relative">
      <div class="h-16 flex items-center justify-center border-b border-[var(--color-border)] px-4">
        <div class="text-xl font-bold text-[var(--color-primary-button)] flex items-center gap-3">
          <div class="w-9 h-9 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-primary-button)] rounded-xl flex items-center justify-center shadow-md shadow-[var(--color-accent)]/30">
            <span class="text-white text-lg leading-none font-black">S</span>
          </div>
          SmartAtt
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto py-6">
        <ul class="space-y-1.5 px-3">
          <For each={menuItems}>
            {(item) => (
              <li>
                <A
                  href={item.path}
                  end={item.path === "/"}
                  class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-light-gray)] hover:text-[var(--color-text-primary)] transition-all duration-200"
                  activeClass="bg-[var(--color-secondary-bg)] text-[var(--color-primary-button)] font-semibold shadow-sm hover:bg-[var(--color-secondary-bg)] hover:text-[var(--color-primary-button)]"
                >
                  <item.icon class="w-5 h-5" />
                  {item.name}
                </A>
              </li>
            )}
          </For>
        </ul>
      </nav>

      <div class="p-4 border-t border-[var(--color-border)] bg-[var(--color-light-gray)]/30">
        <button
          onClick={handleLogout}
          class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
        >
          <LogOut class="w-4 h-4" />
          Logout
        </button>
        <div class="mt-4 text-[10px] text-[var(--color-text-tertiary)] text-center font-medium uppercase tracking-wider">
          &copy; 2024 Smart Attendance
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
