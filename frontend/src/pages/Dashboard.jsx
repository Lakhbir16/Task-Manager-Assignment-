import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const fmt = d => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '—';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  const s = data?.stats || {};
  const maxBar = Math.max(s.todo || 0, s.inProgress || 0, s.review || 0, s.done || 0, 1);

  const bars = [
    { label: 'To Do',       val: s.todo || 0,       color: '#94a3b8' },
    { label: 'In Progress', val: s.inProgress || 0,  color: '#3b82f6' },
    { label: 'Review',      val: s.review || 0,      color: '#f59e0b' },
    { label: 'Done',        val: s.done || 0,        color: '#22c55e' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Hello, {user?.name} — here is your workspace overview.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Projects',     value: s.projects || 0,   color: '#4f46e5' },
          { label: 'Total Tasks',  value: s.total || 0,      color: '#0891b2' },
          { label: 'In Progress',  value: s.inProgress || 0, color: '#2563eb' },
          { label: 'Completed',    value: s.done || 0,       color: '#16a34a' },
          { label: 'Assigned to Me', value: s.myTasks || 0,  color: '#7c3aed' },
          { label: 'Overdue',      value: s.overdue || 0,    color: '#dc2626' },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-value" style={{ color: item.color }}>{item.value}</div>
                <div className="stat-label">{item.label}</div>
              </div>
              <div className="stat-accent" style={{ background: item.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Chart */}
          <div className="card">
            <div className="section-title">Task Status Breakdown</div>
            <div className="chart-bars">
              {bars.map(b => (
                <div key={b.label} className="chart-bar-wrap">
                  <div className="chart-bar-val">{b.val}</div>
                  <div className="chart-bar"
                    style={{ height: `${(b.val / maxBar) * 70}px`, background: b.color }} />
                  <div className="chart-bar-label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent tasks */}
          <div className="card">
            <div className="section-title">Recent Tasks</div>
            {data?.recentTasks?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.recentTasks.map(t => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{t.project?.name}</div>
                    </div>
                    <span className={`badge badge-${t.status}`}>{t.status}</span>
                    <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: '#6b7280' }}>No tasks yet.</p>}
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overdue */}
          <div className="card">
            <div className="section-title">Overdue Tasks</div>
            {data?.overdueTasks?.length ? (
              <div className="overdue-list">
                {data.overdueTasks.map(t => (
                  <div key={t._id} className="overdue-item">
                    <div className="overdue-title">{t.title}</div>
                    <div className="overdue-meta">Due {fmt(t.dueDate)} · {t.project?.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: '#16a34a', textAlign: 'center', padding: '12px 0' }}>
                No overdue tasks.
              </p>
            )}
          </div>

          {/* Quick links */}
          <div className="card">
            <div className="section-title">Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/projects" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                All Projects
              </Link>
              <Link to="/tasks" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                My Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
