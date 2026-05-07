import { type Component, type JSX, Show } from 'solid-js';
import { Navigate } from '@solidjs/router';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: Component<ProtectedRouteProps> = (props) => {
  const isLoggedIn = authService.isLoggedIn();

  return (
    <Show
      when={isLoggedIn}
      fallback={<Navigate href="/login" />}
    >
      {props.children}
    </Show>
  );
};

export default ProtectedRoute;
