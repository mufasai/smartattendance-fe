import { type Component, type JSX, createEffect } from "solid-js";
import { useNavigate } from "@solidjs/router";
import Sidebar from "./components/Sidebar";
import auth from "./store/auth";

const App: Component<{ children?: JSX.Element }> = (props) => {
  const navigate = useNavigate();

  createEffect(() => {
    // If not logged in and trying to access protected routes, redirect to login
    if (!auth.token() && window.location.pathname !== "/login") {
      navigate("/login", { replace: true });
    }
  });

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
                {auth.role() || "Guest"}
              </span>
              <span class="text-xs text-[var(--color-text-secondary)]">
                Admin Portal
              </span>
            </div>
            <div class="w-10 h-10 rounded-xl bg-[var(--color-primary-button)] flex items-center justify-center text-white font-bold shadow-md">
              {auth.role()?.charAt(0).toUpperCase() || "A"}
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
