import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/http";
import { useAuth } from "../auth/AuthContext";
import CategoryDistributionChart from "../components/charts/CategoryDistributionChart";
import MonthlyTrendsChart from "../components/charts/MonthlyTrendsChart";
import { SpinnerScreen } from "../components/SpinnerScreen";

type Expense = { id: number; category: string; amount: number; date: string };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [chartMode, setChartMode] = useState<"bar" | "pie">("bar");
  const [page, setPage] = useState(1);
  const limit = 50;

  const [filters, setFilters] = useState<{ from: string; to: string; category: string }>({
    from: "",
    to: "",
    category: "",
  });

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<{ totalSpent: number; topCategory: string | null; recentTransactions: Expense[] } | null>(
    null
  );
  const [categoryDist, setCategoryDist] = useState<{ categories: string[]; amounts: number[] } | null>(null);
  const [monthly, setMonthly] = useState<{ labels: string[]; amounts: number[] } | null>(null);

  const activeParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.category) params.category = filters.category;
    return params;
  }, [filters]);

  const analyticsParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    if (filters.category) params.category = filters.category;
    return params;
  }, [filters.from, filters.to, filters.category]);

  const refreshAll = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [expRes, sumRes, catRes, monRes] = await Promise.all([
        api.listExpenses({ ...activeParams, page, limit }),
        api.dashboardSummary(analyticsParams),
        api.categoriesDistribution(analyticsParams),
        api.monthlyTrends(
          Object.keys(analyticsParams).length > 0
            ? analyticsParams
            : {
                months: "12",
              }
        ),
      ]);

      setExpenses(expRes.items);
      setTotal(expRes.total);
      setSummary(sumRes);
      setCategoryDist(catRes);
      setMonthly(monRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.from, filters.to, filters.category]);

  const [addForm, setAddForm] = useState<{ category: string; amount: string; date: string }>({
    category: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const onAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const amount = Number(addForm.amount);
    if (!addForm.category.trim() || !Number.isFinite(amount) || amount <= 0 || !addForm.date) {
      setError("Please enter a valid category, amount, and date.");
      return;
    }
    try {
      await api.createExpense({ category: addForm.category.trim(), amount, date: addForm.date });
      setAddForm({ category: "", amount: "", date: addForm.date });
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
    }
  };

  const [editing, setEditing] = useState<Expense | null>(null);
  const [editForm, setEditForm] = useState<{ category: string; amount: string; date: string }>({
    category: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  const startEdit = (exp: Expense) => {
    setEditing(exp);
    setEditForm({ category: exp.category, amount: String(exp.amount), date: exp.date });
  };

  const onUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setError(null);
    const amount = Number(editForm.amount);
    if (!editForm.category.trim() || !Number.isFinite(amount) || amount <= 0 || !editForm.date) {
      setError("Please enter valid values.");
      return;
    }

    try {
      await api.updateExpense(editing.id, { category: editForm.category.trim(), amount, date: editForm.date });
      setEditing(null);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  };

  const onDeleteExpense = async (id: number) => {
    if (!confirm("Delete this expense?")) return;
    setError(null);
    try {
      await api.deleteExpense(id);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  const exportCsv = async () => {
    setError(null);
    try {
      const blob = await api.exportExpensesCsv({
        ...(filters.from ? { from: filters.from } : {}),
        ...(filters.to ? { to: filters.to } : {}),
        ...(filters.category ? { category: filters.category } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "expenses.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  if (!user) {
    // Defensive: RequireAuth should handle redirect.
    navigate("/login");
    return <SpinnerScreen message="Redirecting..." />;
  }

  const categoryOptions = categoryDist?.categories ?? [];

  return (
    <div className="min-vh-100">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <span className="navbar-brand">Expense Tracker</span>
          <div className="d-flex gap-2">
            <span className="navbar-text text-light">Signed in: {user.username}</span>
            <button
              className="btn btn-outline-light"
              onClick={async () => {
                try {
                  await logout();
                  navigate("/login");
                } catch {
                  // ignore, user might still be logged in
                }
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div>
            <h2 className="mb-1">Dashboard</h2>
            <div className="text-muted">Overview, analytics, and transaction management.</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>

        {error ? <div className="alert alert-danger">{error}</div> : null}
        {loading ? <SpinnerScreen message="Loading your data..." /> : null}

        {!loading && summary ? (
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted">Total spent</div>
                  <div className="fs-3 fw-semibold">₹ {summary.totalSpent.toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted">Top category</div>
                  <div className="fs-4 fw-semibold">{summary.topCategory ?? "—"}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted">Recent transactions</div>
                  <div className="mt-2" style={{ maxHeight: 120, overflow: "auto" }}>
                    {summary.recentTransactions.length === 0 ? (
                      <div className="text-muted small">No expenses yet.</div>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {summary.recentTransactions.map((t) => (
                          <li key={t.id} className="d-flex justify-content-between gap-2">
                            <span className="text-truncate" style={{ maxWidth: 160 }}>
                              {t.category}
                            </span>
                            <span className="text-nowrap">₹ {t.amount.toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="row g-4">
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h4 className="mb-0">Category distribution</h4>
                  <div className="d-flex gap-2">
                    <button className={`btn btn-sm ${chartMode === "bar" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setChartMode("bar")}>
                      Bar
                    </button>
                    <button className={`btn btn-sm ${chartMode === "pie" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setChartMode("pie")}>
                      Pie
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  {categoryDist && categoryDist.categories.length > 0 ? (
                    <CategoryDistributionChart labels={categoryDist.categories} amounts={categoryDist.amounts} mode={chartMode} />
                  ) : (
                    <div className="text-muted text-center py-4">No data to chart.</div>
                  )}
                </div>
              </div>
            </div>
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="mb-3">Monthly trends</h4>
                {monthly ? <MonthlyTrendsChart labels={monthly.labels} amounts={monthly.amounts} /> : <div className="text-muted">Loading chart...</div>}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-5">
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="mb-3">Filters</h4>
                <div className="row g-2">
                  <div className="col-12 col-sm-6">
                    <label className="form-label">From</label>
                    <input className="form-control" type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label">To</label>
                    <input className="form-control" type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}>
                      <option value="">All</option>
                      {categoryOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 d-flex justify-content-end">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setFilters({ from: "", to: "", category: "" });
                        setPage(1);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h4 className="mb-3">Add expense</h4>
                <form onSubmit={onAddExpense}>
                  <div className="mb-2">
                    <label className="form-label">Category</label>
                    <input className="form-control" value={addForm.category} onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Amount (INR)</label>
                    <input className="form-control" type="number" step="0.01" value={addForm.amount} onChange={(e) => setAddForm((p) => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input className="form-control" type="date" value={addForm.date} onChange={(e) => setAddForm((p) => ({ ...p, date: e.target.value }))} required />
                  </div>
                  <button className="btn btn-primary w-100" type="submit">
                    Add
                  </button>
                </form>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                  <h4 className="mb-0">Expense history</h4>
                  <div className="text-muted small">{total.toLocaleString()} total</div>
                </div>
                {expenses.length === 0 ? (
                  <div className="text-muted text-center py-4">No expenses found.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-striped align-middle">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th className="text-end">Amount</th>
                          <th>Date</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((e) => (
                          <tr key={e.id}>
                            <td className="text-truncate" style={{ maxWidth: 140 }}>
                              {e.category}
                            </td>
                            <td className="text-end">₹ {e.amount.toFixed(2)}</td>
                            <td className="text-nowrap">{e.date}</td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm" role="group">
                                <button className="btn btn-outline-primary" onClick={() => startEdit(e)}>
                                  Edit
                                </button>
                                <button className="btn btn-outline-danger" onClick={() => onDeleteExpense(e.id)}>
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {total > limit ? (
                  <div className="d-flex justify-content-center mt-3 gap-2">
                    <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </button>
                    <div className="text-muted small align-self-center">
                      Page {page}
                    </div>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {editing ? (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit expense</h5>
                <button className="btn-close" onClick={() => setEditing(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <form onSubmit={onUpdateExpense}>
                  <div className="mb-2">
                    <label className="form-label">Category</label>
                    <input className="form-control" value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))} required />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Amount (INR)</label>
                    <input className="form-control" type="number" step="0.01" value={editForm.amount} onChange={(e) => setEditForm((p) => ({ ...p, amount: e.target.value }))} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input className="form-control" type="date" value={editForm.date} onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} required />
                  </div>
                  {error ? <div className="alert alert-danger">{error}</div> : null}
                  <button className="btn btn-primary w-100" type="submit">
                    Save changes
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

