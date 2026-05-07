import { type Component, type JSX, createEffect, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Sidebar from "./components/Sidebar";
import auth from "./store/auth";

const App: Component<{ children?: JSX.Element }> = (props) => {
  const navigate = useNavigate();

  createEffect(() => {
    // If not logged in and trying to access protected routes, redirect to login
    if (!auth.isLoggedIn() && window.location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  });

  const handleLogout = () => {
    auth.logout();
  };

  return (
    <div class="flex h-screen bg-[var(--color-primary-bg)] font-poppins text-[var(--color-text-primary)]">
      <Sidebar />
      <div class="flex-1 flex flex-col overflow-hidden">
        <header class="flex justify-between items-center p-4 bg-white border-b border-[var(--color-border)] shadow-sm z-10">
          <h1 class="text-xl font-semibold text-[var(--color-text-primary)]">
            Smart Attendance Admin
          </h1>
          <div class="flex items-center space-x-4">
            <div class="flex flex-col text-right">
              <span class="text-sm font-medium text-[var(--color-text-primary)] capitalize">
                {auth.getUserName()}
              </span>
              <span class="text-xs text-[var(--color-text-secondary)]">
                {auth.role() || "Guest"} • NIK: {auth.getUserNik()}
              </span>
            </div>
            <div class="relative group">
              <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-button)] flex items-center justify-center text-white font-bold shadow-md cursor-pointer">
                {auth.getUserName().charAt(0).toUpperCase()}
              </div>
              {/* Logout dropdown */}
              <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <button
                  onClick={handleLogout}
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
        <main class="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-light-gray)] p-6">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default App;
