import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await register(username, password);
      navigate("/");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <h2 className="text-center mb-4">Sign up</h2>
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
                    autoComplete="new-password"
                    required
                  />
                </div>
                {formError ? <div className="alert alert-danger">{formError}</div> : null}
                <button className="btn btn-success w-100" type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create account"}
                </button>
                <div className="text-center mt-3">
                  <Link to="/login">Back to login</Link>
                </div>
              </form>
            </div>
          </div>
          <div className="text-center text-muted mt-3 small">Username supports letters, numbers, underscore.</div>
        </div>
      </div>
    </div>
  );
}

