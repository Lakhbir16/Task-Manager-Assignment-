import { useEffect, useState } from 'react';
import api from '../api/axios';

const fmt = d => d
  ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  : null;
const isOverdue = d => d && new Date(d) < new Date();

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '', project: '' });
  const [selectedTask, setSelectedTask] = useState(null);

  // lazy import to avoid circular deps
  const [TaskModal, setTaskModal] = useState(null);
  useEffect(() => {
    import('../components/Modals').then(m => setTaskModal(() => m.TaskModal));
  }, []);

  const fetchTasks = () => {
    const params = new URLSearchParams({ myTasks: 'true' });
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.project) params.append('project', filters.project);
    return api.get(`/tasks?${params}`).then(r => setTasks(r.data.data.tasks));
  };

  useEffect(() => {
    Promise.all([
      api.get('/projects').then(r => setProjects(r.data.data.projects)),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) fetchTasks();
  }, [filters, loading]);

  const handleTaskSave = saved => {
    setTasks(prev => prev.map(t => t._id === saved._id ? saved : t));
    setSelectedTask(null);
  };

  const handleTaskDelete = id => {
    setTasks(prev => prev.filter(t => t._id !== id));
    setSelectedTask(null);
  };

  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const projectForTask = task =>
    projects.find(p => p._id === (task.project?._id || task.project));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div className="spinner" />
      </div>
    );
  }

  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-sub">Tasks assigned to you across all projects</p>
        </div>
        <div style={{
          background: 'white', border: '1px solid #e5e7eb',
          borderRadius: 8, padding: '6px 14px', fontSize: 13, color: '#6b7280'
        }}>
          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="filter-select" value={filters.status} onChange={e => set('status', e.target.value)}>
          <option value="">All Statuses</option>
          {['todo', 'in-progress', 'review', 'done'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select className="filter-select" value={filters.priority} onChange={e => set('priority', e.target.value)}>
          <option value="">All Priorities</option>
          {['low', 'medium', 'high', 'critical'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select className="filter-select" value={filters.project} onChange={e => set('project', e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>

        {hasFilter && (
          <button className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ status: '', priority: '', project: '' })}>
            Clear filters
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="empty">
          <div className="empty-text">No tasks found</div>
          <div className="empty-sub">
            {hasFilter ? 'Try adjusting your filters.' : 'No tasks are assigned to you yet.'}
          </div>
        </div>
      ) : (
        <div className="tasks-list">
          {tasks.map(task => {
            const overdue = isOverdue(task.dueDate) && task.status !== 'done';
            const proj = projectForTask(task);
            return (
              <div key={task._id} className="task-row" onClick={() => setSelectedTask(task)}>
                <div style={{
                  width: 4, height: 36, borderRadius: 3,
                  background: proj?.color || '#4f46e5', flexShrink: 0
                }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="task-row-title">{task.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    {task.project?.name && (
                      <span className="task-row-project">{task.project.name}</span>
                    )}
                    {task.tags?.slice(0, 3).map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  <span className={`badge badge-${task.status}`}>{task.status}</span>
                  {task.dueDate && (
                    <span style={{ fontSize: 12, color: overdue ? '#dc2626' : '#6b7280' }}>
                      {fmt(task.dueDate)}{overdue ? ' (overdue)' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedTask && TaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={selectedTask.project?._id || selectedTask.project}
          members={projectForTask(selectedTask)?.members || []}
          onClose={() => setSelectedTask(null)}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
        />
      )}
    </div>
  );
}
