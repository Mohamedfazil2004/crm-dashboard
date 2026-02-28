import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatWindow from '../components/ChatWindow';
import { MessageCircle, X } from 'lucide-react';

const getStatusStyles = (status) => {
  switch (status) {
    case 'Completed':
    case 'Call Completed':
      return { background: '#d4edda', color: '#155724' };
    case 'In Progress':
      return { background: '#fff3cd', color: '#856404' };
    case 'Leave':
      return { background: '#ffe5d0', color: '#d84315' };
    case 'Assigned':
      return { background: '#cce5ff', color: '#004085' };
    case 'Unassigned':
      return { background: '#f8d7da', color: '#721c24' };
    default:
      return { background: '#eee', color: '#333' };
  }
};

const getTaskStatus = (task) => {
  if (!task.assignedTo && !task.employee_id) return "Unassigned";
  if (task.status === "Pending") return "Assigned";
  return task.status;
};

const BrandingTeam = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [groups, setGroups] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const url = '/api/employees?team=Branding&status=Active';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const filtered = (data || []).filter(emp => emp.role !== 'Team Lead' && emp.role !== 'Admin');
        setEmployees(filtered);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/branding/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    }
  };

  const updateTaskInState = (taskId, updateFn) => {
    const newGroups = groups.map(g => {
      const taskIndex = g.tasks.findIndex(t => t.id === taskId);
      if (taskIndex > -1) {
        const updatedTasks = [...g.tasks];
        updatedTasks[taskIndex] = updateFn(updatedTasks[taskIndex]);

        // Recalculate group status (Matching backend logic)
        // Priority: Leave > In Progress > Assigned > Completed > Unassigned
        const statuses = updatedTasks.map(t => t.status);
        const assigneds = updatedTasks.map(t => t.assignedTo || t.employee_id);

        let aggStatus = "Unassigned";
        if (statuses.includes("Leave")) {
          aggStatus = "Leave";
        } else if (updatedTasks.every(t => t.status === 'Completed' || t.status === 'Call Completed')) {
          aggStatus = "Completed";
        } else if (statuses.includes("In Progress")) {
          aggStatus = "In Progress";
        } else if (assigneds.some(a => a)) {
          aggStatus = "Assigned";
        }

        const newGroup = { ...g, tasks: updatedTasks, status: aggStatus };

        // If selectedGroup is active, update it too so the modal reflects changes immediately
        if (selectedGroup && selectedGroup.clientID === g.clientID) {
          setSelectedGroup(newGroup);
        }
        return newGroup;
      }
      return g;
    });
    setGroups(newGroups);
    localStorage.setItem("brandingGroups", JSON.stringify(newGroups));
  };

  const handleAssign = async (task, empID) => {
    if (isAdmin) return alert("Read-only access: Admin cannot perform this action.");
    if (!empID) return alert("Please select an option!");
    if (empID === "DELETE") {
      handleDelete(task);
      return;
    }
    const now = new Date();
    const datePart = now.toISOString().split('T')[0];
    const timePart = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const teamSentAt = `${datePart} | ${timePart}`;

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/branding/tasks/${task.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: empID,
          teamSentAt: teamSentAt
        })
      });

      if (res.ok) {
        updateTaskInState(task.id, (t) => ({
          ...t,
          assignedTo: empID,
          status: "Pending", // Keep backend state Pending to show as "Assigned"
          teamSentAt: teamSentAt
        }));
        alert(`Task assigned to ${empID} successfully!`);
      } else {
        const err = await res.json();
        alert(err.message || "Failed to assign task.");
      }
    } catch (err) {
      console.error("Assignment error:", err);
      alert("Error connecting to server.");
    }
  };


  const handleDelete = (task) => {
    if (isAdmin) return;
    if (window.confirm("⚠️ DELETE WARNING:\nThis will remove the task from this team AND delete the data from the Client Page.\n\nAre you sure?")) {
      // 1. Calculate Amount to subtract from Master Record
      const taskTotalAmount = Object.values(task.amount || {}).reduce((a, b) => a + (parseInt(b) || 0), 0);
      const taskTotalAmountAlt = Object.values(task.amo || {}).reduce((a, b) => a + (parseInt(b) || 0), 0);
      const finalDeduction = taskTotalAmount > 0 ? taskTotalAmount : taskTotalAmountAlt;

      // 2. Update Master Client Record (allClients)
      const allClients = JSON.parse(localStorage.getItem("allClients")) || [];
      const updatedClients = allClients.map(client => {
        if (client.clientID === task.clientID) {
          const newClient = { ...client };

          // Subtract Amount
          newClient.totalAmount = (parseInt(newClient.totalAmount) || 0) - finalDeduction;
          if (newClient.totalAmount < 0) newClient.totalAmount = 0;

          // Reset Branding Fields in Master
          ['Posters', 'Reels', 'Shorts', 'Longform', 'Carousel', 'EventDay', 'Blog'].forEach(key => {
            if (newClient[key]) {
              newClient[key] = { ...newClient[key], count: 0, amount: 0, min: 0, amo: 0 };
            }
          });

          return newClient;
        }
        return client;
      });
      localStorage.setItem("allClients", JSON.stringify(updatedClients));

      // 3. Remove from groups
      const newGroups = groups.map(g => {
        if (g.clientID === task.clientID) {
          const updatedTasks = g.tasks.filter(t => t.id !== task.id);
          if (updatedTasks.length === 0) return null; // Remove group if no tasks

          const newGroup = { ...g, tasks: updatedTasks, count: updatedTasks.length };
          if (selectedGroup && selectedGroup.clientID === g.clientID) {
            setSelectedGroup(newGroup);
          }
          return newGroup;
        }
        return g;
      }).filter(Boolean);

      setGroups(newGroups);
      localStorage.setItem("brandingGroups", JSON.stringify(newGroups));
    }
  };

  const updateTaskField = (task, field, value) => {
    updateTaskInState(task.id, (t) => ({ ...t, [field]: value }));
    const assignedEmp = task.assignedTo;
    if (assignedEmp) {
      const empKey = `${assignedEmp}_tasks`;
      const empTasks = JSON.parse(localStorage.getItem(empKey)) || [];
      const updatedEmpTasks = empTasks.map(t =>
        (t.activityCode === task.activityCode && t.clientID === task.clientID) ? { ...t, [field]: value } : t
      );
      localStorage.setItem(empKey, JSON.stringify(updatedEmpTasks));
    }
  };

  return (
    <div className="container">
      <h1 style={{ textAlign: 'center', color: '#007bff', marginBottom: '20px' }}>Branding & Creative Team</h1>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Client</th><th>ID</th><th>Date & Time</th><th>Task Count</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No Tasks Found</td></tr>
            ) : (
              groups.map((group, index) => (
                <tr key={group.clientID}>
                  <td>{group.client}</td>
                  <td>{group.clientID}</td>
                  <td style={{ lineHeight: '1.2' }}>
                    {group.clientSentAt ? (
                      <>
                        {group.clientSentAt.split(' | ')[0]}
                        <br />
                        {group.clientSentAt.split(' | ')[1]}
                      </>
                    ) : group.deliveryDate}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{group.count}</td>
                  <td>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '15px',
                      ...getStatusStyles(group.status),
                      fontWeight: 'bold',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      display: 'inline-block',
                      minWidth: '100px',
                      textAlign: 'center'
                    }}>
                      {group.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedGroup(group)}
                      style={{
                        padding: '5px 15px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedGroup && (
        <GroupDetailsModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
          employees={employees}
          onAssign={handleAssign}
          onDelete={handleDelete}
          onUpdate={updateTaskField}
          isAdmin={isAdmin}
          setActiveChatTask={setActiveChatTask}
          getTaskStatus={getTaskStatus}
          getStatusStyles={getStatusStyles}
        />
      )}

      {activeChatTask && (
        <ChatWindow
          task={activeChatTask}
          currentUser={user}
          onClose={() => setActiveChatTask(null)}
          assignedEmployeeName={employees.find(e => e.id === activeChatTask.assignedTo)?.name}
        />
      )}
    </div>
  );
};

const GroupDetailsModal = ({ group, onClose, employees, onAssign, onDelete, onUpdate, isAdmin, setActiveChatTask, getTaskStatus, getStatusStyles }) => {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'white', padding: '20px', borderRadius: '8px',
        width: '95%', maxWidth: '1400px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '15px', right: '15px',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '5px', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.2s',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <X size={24} color="#333" />
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>
            Tasks for {group.client} ({group.clientID})
          </h2>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Type</th>
                <th>Count</th><th>Min</th><th>Chat</th><th>Upload</th><th>Active</th><th>Employee Remark</th><th>Status</th>
                <th>Team Lead Remark</th><th>Action</th><th>Assign</th>
              </tr>
            </thead>
            <tbody>
              {group.tasks.map((task, i) => (
                <TaskItemRow
                  key={task.id || i}
                  task={task}
                  employees={employees}
                  onAssign={onAssign}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  isAdmin={isAdmin}
                  setActiveChatTask={setActiveChatTask}
                  getTaskStatus={getTaskStatus}
                  getStatusStyles={getStatusStyles}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TaskItemRow = ({ task, employees, onAssign, onDelete, onUpdate, isAdmin, setActiveChatTask, getTaskStatus, getStatusStyles }) => {
  const { unreadCounts } = useChat();
  const [selectedEmp, setSelectedEmp] = useState(task.assignedTo || "");

  useEffect(() => {
    if (task.assignedTo) {
      setSelectedEmp(task.assignedTo);
    }
  }, [task.assignedTo]);

  const getTotal = (obj) => Object.values(obj || {}).reduce((a, b) => parseInt(a || 0) + parseInt(b || 0), 0);
  const getWorkCount = (t) => {
    if (!t.count) return 0;
    const activeType = Object.keys(t.count).find(key => t.count[key] > 0);
    return activeType ? (t.count[activeType] || 0) : 0;
  };
  const getActivityTypeDisplay = (t) => {
    if (!t.count) return "-";
    const type = Object.keys(t.count).find(key => t.count[key] > 0);
    const typeCodes = { 'Posters': 'Poster (AT001)', 'Reels': 'Reel (AT002)', 'Carousel': 'Carousel (AT003)', 'Shorts': 'Shorts (AT004)', 'Longform': 'Longform (AT005)', 'EventDay': 'Event Day (AT006)', 'Blog': 'Blog (AT007)', 'JobWork': 'Job Work (AT008)' };
    return typeCodes[type] || type || "-";
  };

  return (
    <tr>
      <td>{task.activityCode}</td>
      <td>{getActivityTypeDisplay(task)}</td>
      <td>{getWorkCount(task)}</td>
      <td>{getTotal(task.minutes)}</td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setActiveChatTask(task)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#25D366',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px'
            }}
            title="Chat with Employee"
          >
            <MessageCircle size={20} fill={unreadCounts[task.activityCode] ? "#25D366" : "none"} />
          </button>
          {unreadCounts[task.activityCode] > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white',
              borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold',
              minWidth: '18px', textAlign: 'center', border: '2px solid white'
            }}>
              {unreadCounts[task.activityCode]}
            </span>
          )}
        </div>
      </td>
      <td>
        {task.submissionLink ? (
          <a href={task.submissionLink} target="_blank" rel="noreferrer" style={{ color: '#007bff', fontSize: '12px', fontWeight: 'bold' }}>
            View
          </a>
        ) : (
          <span style={{ color: '#999', fontSize: '12px' }}>No upload</span>
        )}
      </td>
      <td>
        <span style={{
          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
          background: task.activeStatus === 'Leave' ? '#ffdada' : '#d4edda',
          color: task.activeStatus === 'Leave' ? '#c0392b' : '#155724'
        }}>
          {task.activeStatus || "Working"}
        </span>
      </td>
      <td style={{ maxWidth: '150px', fontSize: '11px', color: '#666', fontStyle: 'italic' }}>
        {task.employeeRemark || "-"}
      </td>
      <td>
        <span style={{
          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
          ...getStatusStyles(getTaskStatus(task))
        }}>
          {getTaskStatus(task)}
        </span>
      </td>
      <td>
        <input
          type="text"
          placeholder="Add feedback..."
          defaultValue={task.remarks || ""}
          onBlur={(e) => !isAdmin && onUpdate(task, 'remarks', e.target.value)}
          style={{ padding: '4px', border: '1px solid #eee', borderRadius: '4px', width: '100%', fontSize: '12px' }}
          disabled={isAdmin}
        />
      </td>
      <td>
        {task.assignedTo ? (
          <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '12px' }}>Assigned to {task.assignedTo}</span>
        ) : (
          !isAdmin && <button onClick={() => onDelete(task)}>Delete</button>
        )}
      </td>
      <td>
        {!isAdmin && (
          <div style={{ display: 'flex', gap: '5px' }}>
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} style={{ padding: '5px', borderRadius: '4px', width: '80px' }}>
              <option value="">Select</option>
              <option value="DELETE" style={{ color: 'red', fontWeight: 'bold' }}>❌ Delete</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} ({emp.id})</option>)}
            </select>
            <button
              onClick={() => onAssign(task, selectedEmp)}
              disabled={task.assignedTo && task.activeStatus !== 'Leave'}
              style={{
                padding: '5px 8px',
                background: (task.assignedTo && task.activeStatus !== 'Leave') ? '#ccc' : '#28a745',
                color: 'white', border: 'none', borderRadius: '4px',
                cursor: (task.assignedTo && task.activeStatus !== 'Leave') ? 'not-allowed' : 'pointer'
              }}
            >
              {task.assignedTo ? 'Reassign' : 'Send'}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
};
export default BrandingTeam;