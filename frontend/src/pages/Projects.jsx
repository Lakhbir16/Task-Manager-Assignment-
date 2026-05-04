import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { ProjectModal } from '../components/Modals';

const fmt = d => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : null;

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = () =>
    api.get('/projects')
      .then(r => setProjects(r.data.data.projects))
      .finally(() => setLoading(false));

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = project => {
    setProjects(prev => {
      const idx = prev.findIndex(p => p._id === project._id);
      if (idx >= 0) { const n = [...prev]; n[idx] = project; return n; }
      return [project, ...prev];
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        {user?.role === 'Admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <div className="empty-text">No projects found</div>
          <div className="empty-sub">
            {user?.role === 'Admin'
              ? 'Create your first project to get started.'
              : 'You have not been added to any project yet.'}
          </div>
          {user?.role === 'Admin' && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => {
            const pct = p.taskCount ? Math.round((p.doneCount / p.taskCount) * 100) : 0;
            return (
              <Link key={p._id} to={`/projects/${p._id}`} className="project-card">
                <div className="project-color-strip" style={{ background: p.color }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div className="project-name">{p.name}</div>
                  <span className={`badge badge-${p.status}`}>{p.status}</span>
                </div>

                <div className="project-desc">
                  {p.description || 'No description provided.'}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                    <span>{p.doneCount || 0} / {p.taskCount || 0} tasks</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>

                <div className="project-footer">
                  <div className="member-stack">
                    {(p.members || []).slice(0, 4).map(m => (
                      <div key={m.user?._id} className="avatar"
                        title={m.user?.name} style={{ background: p.color }}>
                        {(m.user?.name || '?')[0].toUpperCase()}
                      </div>
                    ))}
                    {(p.members?.length || 0) > 4 && (
                      <div className="avatar" style={{ background: '#e5e7eb', color: '#6b7280' }}>
                        +{p.members.length - 4}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    {p.overdueCount > 0 && (
                      <span style={{ color: '#dc2626' }}>{p.overdueCount} overdue</span>
                    )}
                    {p.deadline && <span>{fmt(p.deadline)}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)} onSave={handleSave} />
      )}
    </div>
  );
}
