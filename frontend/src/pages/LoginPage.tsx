import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <h2 className="text-center mb-4">Login</h2>
          <div className="card shadow-sm">
            <div className="card-body">
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    className="form-control"
                    value={password}
                    type="password"
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                {formError ? <div className="alert alert-danger">{formError}</div> : null}
                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </button>
                <div className="text-center mt-3">
                  <Link to="/register">Create an account</Link>
                </div>
              </form>
            </div>
          </div>
          <div className="text-center text-muted mt-3 small">Uses JWT in httpOnly cookies.</div>
        </div>
      </div>
    </div>
  );
}

