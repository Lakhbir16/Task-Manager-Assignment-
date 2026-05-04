import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#4f46e5', '#7c3aed', '#db2777', '#d97706', '#16a34a', '#0891b2', '#dc2626', '#ea580c'];

const fmtInput = d => d ? new Date(d).toISOString().split('T')[0] : '';
const fmt = d => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  : '';

/* ========== Project Modal ========== */
export function ProjectModal({ onClose, onSave, project }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    deadline: fmtInput(project?.deadline),
    color: project?.color || COLORS[0],
    status: project?.status || 'active',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (project) res = await api.put(`/projects/${project._id}`, form);
      else res = await api.post('/projects', form);
      onSave(res.data.data.project);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'New Project'}</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="form-input" value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Website Redesign" required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Brief description of the project..." />
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input type="date" className="form-input" value={form.deadline}
                onChange={e => set('deadline', e.target.value)} />
            </div>

            {project && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                  {['active', 'on-hold', 'completed', 'archived'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {COLORS.map(c => (
                  <div key={c} className={`color-dot${form.color === c ? ' selected' : ''}`}
                    style={{ background: c }} onClick={() => set('color', c)} />
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : project ? 'Save Changes' : 'Create Project'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========== Task Modal ========== */
export function TaskModal({ onClose, onSave, onDelete, task, projectId, members }) {
  const { user } = useAuth();

  const myMembership = members?.find(m => (m.user?._id || m.user) === user?._id);
  const canEdit = myMembership?.role === 'Admin' || !task;

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee?._id || task?.assignee || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    dueDate: fmtInput(task?.dueDate),
    tags: task?.tags?.join(', ') || '',
  });
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        project: projectId,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignee: form.assignee || null,
      };
      const res = task
        ? await api.put(`/tasks/${task._id}`, payload)
        : await api.post('/tasks', payload);
      onSave(res.data.data.task);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    } finally { setLoading(false); }
  };

  const handleComment = async e => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await api.post(`/tasks/${task._id}/comments`, { text: comment });
      setComments(res.data.data.task.comments);
      setComment('');
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      onDelete(task._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <h2 className="modal-title">{task ? 'Task Details' : 'New Task'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {task && canEdit && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
            )}
            <button className="close-btn" onClick={onClose}>x</button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="task-detail-grid">
              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="Task title" required disabled={!canEdit && !!task} />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Describe the task..." disabled={!canEdit && !!task} />
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma separated)</label>
                  <input className="form-input" value={form.tags}
                    onChange={e => set('tags', e.target.value)}
                    placeholder="design, frontend, api" disabled={!canEdit && !!task} />
                </div>

                {/* Comments — only shown when editing an existing task */}
                {task && (
                  <div>
                    <div className="detail-label">Comments ({comments.length})</div>
                    {comments.length > 0 && (
                      <div className="comments-list" style={{ marginBottom: 10 }}>
                        {comments.map(c => (
                          <div key={c._id} className="comment">
                            <div className="avatar" style={{ width: 26, height: 26, fontSize: 10, flexShrink: 0 }}>
                              {(c.author?.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="comment-body">
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span className="comment-author">{c.author?.name}</span>
                                <span className="comment-time">{fmt(c.createdAt)}</span>
                              </div>
                              <div className="comment-text">{c.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="form-input" value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Write a comment..." style={{ flex: 1 }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleComment}>
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                    {['todo', 'in-progress', 'review', 'done'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => set('priority', e.target.value)}
                    disabled={!canEdit && !!task}>
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select className="form-select" value={form.assignee}
                    onChange={e => set('assignee', e.target.value)} disabled={!canEdit && !!task}>
                    <option value="">Unassigned</option>
                    {(members || []).map(m => (
                      <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                        {m.user?.name || m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="date" className="form-input" value={form.dueDate}
                    onChange={e => set('dueDate', e.target.value)} disabled={!canEdit && !!task} />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
