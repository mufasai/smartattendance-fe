import { type Component, createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import auth from "../store/auth";

const Login: Component = () => {
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const navigate = useNavigate();

  const handleLogin = (e: Event) => {
    e.preventDefault();
    if (username() === "manager" && password() === "password") {
      auth.login("manager", "fake-manager-token");
      navigate("/", { replace: true });
    } else if (username() === "hrd" && password() === "password") {
      auth.login("hrd", "fake-hrd-token");
      navigate("/", { replace: true });
    } else {
      setError("Invalid credentials. Use manager/password or hrd/password");
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-bg to-secondary-bg p-4 font-poppins">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-border">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-primary-button rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/50">
            <span class="text-white text-2xl font-bold">SA</span>
          </div>
          <h2 class="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p class="text-sm text-text-secondary mt-2">Login to manage your workforce</p>
        </div>

        <form onSubmit={handleLogin} class="space-y-5">
          {error() && (
            <div class="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
              {error()}
            </div>
          )}

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Username
            </label>
            <input
              type="text"
              value={username()}
              onInput={(e) => setUsername(e.currentTarget.value)}
              class="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-accent bg-light-gray/50 transition-all text-text-primary placeholder:text-text-tertiary"
              placeholder="manager or hrd"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Password
            </label>
            <input
              type="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="w-full px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-accent bg-light-gray/50 transition-all text-text-primary placeholder:text-text-tertiary"
              placeholder="password"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full py-3 px-4 bg-primary-button hover:bg-primary-button/90 text-white font-semibold rounded-xl shadow-lg shadow-primary-button/30 transition-all active:scale-95 mt-4"
          >
            Sign In
          </button>
        </form>

        <div class="mt-8 text-center">
          <p class="text-xs text-text-tertiary">
            Demo Credentials: <br />
            <strong>manager / password</strong> <br />
            <strong>hrd / password</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
