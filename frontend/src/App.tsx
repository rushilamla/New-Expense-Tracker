import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import { SpinnerScreen } from "./components/SpinnerScreen";
import DarkModeToggle from "./components/DarkModeToggle";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { initialized, user } = useAuth();
  if (!initialized) return <SpinnerScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <DarkModeToggle />
    </AuthProvider>
  );
}

