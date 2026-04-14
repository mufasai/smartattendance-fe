import { createSignal, createRoot } from "solid-js";

export type Role = "manager" | "hrd" | null;

function createAuthStore() {
  const [role, setRole] = createSignal<Role>(null);
  const [token, setToken] = createSignal<string | null>(null);

  const login = (selectedRole: Role, userToken: string) => {
    setRole(selectedRole);
    setToken(userToken);
    localStorage.setItem("userRole", selectedRole || "");
    localStorage.setItem("authToken", userToken);
  };

  const logout = () => {
    setRole(null);
    setToken(null);
    localStorage.removeItem("userRole");
    localStorage.removeItem("authToken");
  };

  const initFromStorage = () => {
    const savedRole = localStorage.getItem("userRole") as Role;
    const savedToken = localStorage.getItem("authToken");
    if (savedRole && savedToken) {
      setRole(savedRole);
      setToken(savedToken);
    }
  };

  return { role, token, login, logout, initFromStorage };
}

export default createRoot(createAuthStore);
