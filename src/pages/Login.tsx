import { createSignal, type Component } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { apiClient } from "../utils/apiClient";
import auth from "../store/auth";
import toast from "solid-toast";

interface AdminLoginResponse {
  status: string;
  message: string;
  token?: string;
  username?: string;
  name?: string;
  role?: string;
}

const Login: Component = () => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.post<AdminLoginResponse>("/admin/login", {
        username: username(),
        password: password(),
      });

      if (response.status === "success" && response.token) {
        // Save to auth store (using username as nik for compatibility)
        auth.login(
          response.token,
          response.username!,
          response.name!,
          response.role!
        );

        toast.success(`Welcome back, ${response.name}!`);
        
        // Redirect to dashboard
        navigate("/", { replace: true });
      } else {
        toast.error(response.message || "Login failed");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-800 mb-2">
            Smart Attendance
          </h1>
          <p class="text-gray-600">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} class="space-y-6">
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your username"
              required
              disabled={loading()}
            />
          </div>

          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter your password"
              required
              disabled={loading()}
            />
          </div>

          <button
            type="submit"
            disabled={loading()}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading() ? "Logging in..." : "Login"}
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
          <p>Default Admin Credentials:</p>
          <p class="font-mono bg-gray-100 p-2 rounded mt-2">
            Username: <strong>admin</strong> | Password: <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
