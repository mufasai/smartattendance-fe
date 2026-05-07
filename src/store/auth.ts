import { createSignal, createRoot } from "solid-js";

export type Role = "admin" | "manager" | "employee" | null;

export interface UserInfo {
  nik: string;
  name: string;
  role: string;
}

function createAuthStore() {
  const [role, setRole] = createSignal<Role>(null);
  const [token, setToken] = createSignal<string | null>(null);
  const [userInfo, setUserInfo] = createSignal<UserInfo | null>(null);

  const login = (jwtToken: string, nik: string, name: string, userRole: string) => {
    const normalizedRole = userRole.toLowerCase() as Role;
    setRole(normalizedRole);
    setToken(jwtToken);
    setUserInfo({ nik, name, role: userRole });
    
    // Save to localStorage
    localStorage.setItem("jwt_token", jwtToken);
    localStorage.setItem("user_info", JSON.stringify({ nik, name, role: userRole }));
  };

  const logout = () => {
    setRole(null);
    setToken(null);
    setUserInfo(null);
    
    // Clear localStorage
    localStorage.removeItem("jwt_token");
    localStorage.removeItem("user_info");
    
    // Redirect to login
    window.location.href = "/login";
  };

  const initFromStorage = () => {
    const savedToken = localStorage.getItem("jwt_token");
    const savedUserInfo = localStorage.getItem("user_info");
    
    if (savedToken && savedUserInfo) {
      try {
        const user: UserInfo = JSON.parse(savedUserInfo);
        setToken(savedToken);
        setUserInfo(user);
        setRole(user.role.toLowerCase() as Role);
      } catch (error) {
        console.error("Failed to parse user info:", error);
        logout();
      }
    }
  };

  const isLoggedIn = () => {
    return token() !== null;
  };

  const isAdmin = () => {
    const currentRole = role();
    return currentRole === "admin" || currentRole === "manager";
  };

  const getUserName = () => {
    return userInfo()?.name || "Guest";
  };

  const getUserNik = () => {
    return userInfo()?.nik || "";
  };

  return { 
    role, 
    token, 
    userInfo,
    login, 
    logout, 
    initFromStorage,
    isLoggedIn,
    isAdmin,
    getUserName,
    getUserNik,
  };
}

export default createRoot(createAuthStore);
