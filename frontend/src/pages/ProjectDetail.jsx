import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { TaskModal, ProjectModal } from '../components/Modals';

const fmt = d => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  : null;
const isOverdue = d => d && new Date(d) < new Date();

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       dot: 'todo' },
  { id: 'in-progress', label: 'In Progress',  dot: 'in-progress' },
  { id: 'review',      label: 'Review',       dot: 'review' },
  { id: 'done',        label: 'Done',         dot: 'done' },
];

function TaskCard({ task, onClick }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
  return (
    <div
      className="task-card"
      onClick={() => onClick(task)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
        {task.assignee && (
          <div className="avatar" style={{ width: 22, height: 22, fontSize: 9, flexShrink: 0 }}>
            {(task.assignee.name || '?')[0].toUpperCase()}
          </div>
        )}
      </div>
      <div className="task-title">{task.title}</div>
      {task.tags?.length > 0 && (
        <div className="task-tags">
          {task.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        {task.dueDate && (
          <span className={`due-date${overdue ? ' overdue' : ''}`}>
            {fmt(task.dueDate)}{overdue ? ' (overdue)' : ''}
          </span>
        )}
        {task.comments?.length > 0 && (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>{task.comments.length} comment{task.comments.length !== 1 ? 's' : ''}</span>
        )}
      </div>
    </div>
  );
}

function AddMemberModal({ project, onClose, onSave }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/users').then(r => {
      const memberIds = project.members.map(m => m.user?._id || m.user);
      setUsers(r.data.data.users.filter(u => !memberIds.includes(u._id)));
    });
  }, []);

  const handleAdd = async () => {
    if (!userId) return setError('Please select a user.');
    setLoading(true);
    try {
      const res = await api.post(`/projects/${project._id}/members`, { userId, role });
      onSave(res.data.data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Team Member</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)}>
              <option value="">Choose a user...</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} — {u.email}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role in Project</label>
            <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={loading}>
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);

  const myMembership = project?.members?.find(
    m => (m.user?._id || m.user) === user?._id
  );
  const isProjectAdmin =
    myMembership?.role === 'Admin' || project?.owner?._id === user?._id;

  const loadAll = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/tasks?project=${id}`),
      ]);
      setProject(pRes.data.data.project);
      setTasks(tRes.data.data.tasks);
    } catch {
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  const handleTaskSave = saved => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t._id === saved._id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const handleTaskDelete = taskId =>
    setTasks(prev => prev.filter(t => t._id !== taskId));

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleRemoveMember = async userId => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await api.delete(`/projects/${id}/members/${userId}`);
      setProject(res.data.data.project);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member.');
    }
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
      {/* Header */}
      <div className="page-header" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }} />
            <h1 className="page-title" style={{ fontSize: 18 }}>{project.name}</h1>
            <span className={`badge badge-${project.status}`}>{project.status}</span>
          </div>
          {project.description && (
            <p className="page-sub">{project.description}</p>
          )}
          {project.deadline && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isProjectAdmin && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowProjectModal(true)}>
              Edit
            </button>
          )}
          {isProjectAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              Delete
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab${activeTab === 'board' ? ' active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          Kanban Board
        </button>
        <button
          className={`tab${activeTab === 'members' ? ' active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          Members ({project.members?.length || 0})
        </button>
      </div>

      {/* Kanban Board */}
      {activeTab === 'board' && (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div
                key={col.id}
                className="kanban-col"
              >
                <div className="kanban-col-header">
                  <div className="kanban-col-title">
                    <div className={`col-dot ${col.dot}`} />
                    {col.label}
                  </div>
                  <span className="kanban-count">{colTasks.length}</span>
                </div>

                <div className="kanban-tasks">
                  {colTasks.map(task => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={t => { setSelectedTask(t); setShowTaskModal(true); }}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '18px 0', color: '#9ca3af', fontSize: 12 }}>
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isProjectAdmin && (
            <div style={{ marginBottom: 14 }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                + Add Member
              </button>
            </div>
          )}
          <div className="members-list">
            {project.members?.map(m => (
              <div key={m.user?._id} className="member-row">
                <div className="avatar lg">
                  {(m.user?.name || '?')[0].toUpperCase()}
                </div>
                <div className="member-info">
                  <div className="member-name">{m.user?.name}</div>
                  <div className="member-email">{m.user?.email}</div>
                </div>
                <span className={`badge badge-${m.role?.toLowerCase()}`}>{m.role}</span>
                {isProjectAdmin && m.user?._id !== project.owner?._id && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveMember(m.user?._id)}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          members={project.members}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSave={p => setProject(p)}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          project={project}
          onClose={() => setShowAddMember(false)}
          onSave={p => setProject(p)}
        />
      )}
    </div>
  );
}
