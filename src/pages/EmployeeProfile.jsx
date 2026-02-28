import React, { useState, useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import ChatWindow from '../components/ChatWindow';
import { MessageCircle, X, ExternalLink, Clock } from 'lucide-react';

const EmployeeProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [employeeRemark, setEmployeeRemark] = useState('');
  const [activeChatTask, setActiveChatTask] = useState(null);
  const [teamLeader, setTeamLeader] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const { unreadCounts } = useChat();

  const isManagement = user?.role === 'Manager' || user?.role === 'Team Lead' || user?.role === 'Admin';
  // Check if current user is Admin or Manager for the new slug-based redirection feature
  const canViewClientDetail = user?.role === 'Admin' || user?.role === 'Manager';

  // Security Check: Employees can only see their own profile
  const isSelf = !isManagement && user?.id === id;
  const canView = isManagement || isSelf;

  // Daily Capacity (480 mins)
  const DAILY_CAPACITY = 480;

  // Identify Telecaller based on team
  const isTelecaller = employee?.team === 'Telecaller';

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/employees/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setEmployee(data);
          if (data.team_leader_id) fetchTL(data.team_leader_id);
        } else {
          // If employee not found in backend, set as unknown
          setEmployee({ id, name: 'Unknown Employee', role: 'N/A', team: 'Unknown' });
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
        setEmployee({ id, name: 'Unknown Employee', role: 'N/A', team: 'Unknown' });
      }
    };

    fetchEmployeeData();

    const fetchTL = async (tlId) => {
      if (!tlId) return;
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/employees/${tlId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setTeamLeader(data);
        }
      } catch (e) { console.error(e); }
    };

    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`/api/tasks?employee_id=${id}&group_by_client=true`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setMyTasks(data);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();
  }, [id]);

  const updateTaskInGroups = (taskId, updateFields) => {
    const updatedList = myTasks.map(g => {
      const taskIndex = g.tasks.findIndex(t => t.id === taskId);
      if (taskIndex > -1) {
        const updatedTasks = [...g.tasks];
        updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], ...updateFields };

        const allCompleted = updatedTasks.every(t => t.status === 'Completed' || t.status === 'Call Completed');
        const newGroup = { ...g, tasks: updatedTasks, status: allCompleted ? 'Completed' : 'In Progress' };

        if (selectedGroup && selectedGroup.clientID === g.clientID) {
          setSelectedGroup(newGroup);
        }
        return newGroup;
      }
      return g;
    });
    setMyTasks(updatedList);
  };

  const handleLinkChange = (taskId, value) => {
    updateTaskInGroups(taskId, { submissionLink: value });
  };

  const handleAttendedCallsChange = (taskId, value) => {
    updateTaskInGroups(taskId, { manualAttendedCalls: value });
  };

  const handleFileUpload = async (taskId, file) => {
    if (!file) return;
    const task = myTasks.flatMap(g => g.tasks).find(t => t.id === taskId);
    if (!task) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/tasks/${task.id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        updateTaskInGroups(task.id, { submissionLink: data.link });
        alert("File uploaded successfully!");
      } else {
        const err = await res.json();
        alert(err.message || "Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Network error during upload");
    }
  };

  const handleMarkDoneClick = (task) => {
    // Basic Validation before showing modal
    if (isTelecaller && (!task.manualAttendedCalls || task.manualAttendedCalls === "")) {
      alert("Please enter the number of calls you attended.");
      return;
    }
    // Upload validation only for non-telecallers
    if (!isTelecaller && (!task.submissionLink || task.submissionLink.trim() === "")) {
      alert("Please upload proof of work (Image/Video) before marking as done.");
      return;
    }

    setTaskToComplete(task);
    setEmployeeRemark('');
    setShowRemarkModal(true);
  };

  const submitCompletion = async () => {
    if (!employeeRemark.trim()) {
      alert("Please enter a short remark about your work.");
      return;
    }

    if (employeeRemark.length < 5) {
      alert("Remark is too short. Please provide a bit more detail (min 5 characters).");
      return;
    }

    await markAsDone(taskToComplete, employeeRemark);
    setShowRemarkModal(false);
    setTaskToComplete(null);
    setEmployeeRemark('');
  };

  const markAsDone = async (taskToUpdate, remark) => {
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        status: isTelecaller ? 'Call Completed' : 'Completed',
        submissionLink: taskToUpdate.submissionLink,
        manualAttendedCalls: taskToUpdate.manualAttendedCalls,
        employeeRemark: remark
      };

      const res = await fetch(`/api/tasks/${taskToUpdate.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        updateTaskInGroups(taskToUpdate.id, { status: payload.status, employeeRemark: remark });
        alert("Task marked as completed successfully!");
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to update task.");
      }
    } catch (err) {
      console.error("Error marking task as done:", err);
      alert("Network error. Could not update task.");
    }
  };

  const handleActiveStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/tasks/${taskId}/active-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ activeStatus: newStatus })
      });

      if (res.ok) {
        const data = await res.json();
        updateTaskInGroups(taskId, { activeStatus: newStatus, status: data.task.status });

        // Handle different response scenarios
        if (newStatus === "Leave") {
          if (data.email_sent) {
            // Success: Status updated and email sent
            alert(`✅ Status updated to ${newStatus}\n\n📧 Team Leader has been notified via email.`);
          } else if (data.warning) {
            // Warning: Status updated but email failed
            alert(`⚠️ Leave Recorded\n\n${data.email_error || 'Email delivery failed'}\n\nYour leave status has been saved, but the notification email could not be sent. Please inform your Team Leader directly.`);
          } else {
            // Status updated, email status unknown
            alert(`Status updated to ${newStatus}`);
          }
        } else {
          // Working status
          alert(`Status updated to ${newStatus}`);
        }
      } else {
        const err = await res.json();
        alert(err.message || "Failed to update active status");
      }
    } catch (err) {
      console.error("Active status update error:", err);
      alert("Network error. Could not update status. Please try again.");
    }
  };

  const getWorkDescription = (task) => {
    if (task.callsDescription) return task.callsDescription;
    if (task.description) return task.description;
    if (task.count) {
      const workName = Object.keys(task.count).find(key => task.count[key] > 0);
      return workName || "General Task";
    }
    return "Assigned Work";
  };

  const getTotalMinutes = (task) => {
    if (!task.minutes) return 0;
    return Object.values(task.minutes).reduce((a, b) => parseInt(a || 0) + parseInt(b || 0), 0);
  };

  // --- EFFICIENCY CALC ---
  const allFlattenedTasks = myTasks.flatMap(g => g.tasks);
  const assignedMinutes = allFlattenedTasks.reduce((sum, t) => sum + getTotalMinutes(t), 0);
  const usedMinutes = allFlattenedTasks
    .filter(t => t.status === 'Completed' || t.status === 'Call Completed')
    .reduce((sum, t) => sum + getTotalMinutes(t), 0);
  const efficiencyScore = Math.round((usedMinutes / DAILY_CAPACITY) * 100);

  const getEfficiencyColor = (score) => {
    if (score >= 90) return '#28a745';
    if (score >= 70) return '#ffc107';
    return '#dc3545';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Completed':
      case 'Call Completed': return { color: '#28a745', fontWeight: 'bold' };
      case 'Revision': return { color: '#dc3545', fontWeight: 'bold' };
      case 'Not Completed': return { color: '#e74c3c', fontWeight: 'bold' };
      default: return { color: '#e67e22', fontWeight: 'bold' };
    }
  };

  if (!canView) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2 style={{ color: 'red' }}>Access Denied</h2>
        <p>You do not have permission to view this profile.</p>
        <p style={{ fontSize: '12px', color: '#555' }}>
          Your ID: {user?.id} <br />
          Requested ID: {id} <br />
          Role: {user?.role}
        </p>
        <button onClick={() => window.location.href = `/employee-profile/${user?.id}`} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Go to My Profile
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h3>Loading Profile...</h3>
        <p>Fetching data for ID: {id}</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', borderLeft: '5px solid #007bff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, color: '#2c3e50' }}>{employee.name} <span style={{ fontSize: '16px', color: '#777' }}>({employee.id})</span></h1>
            <div style={{ display: 'flex', gap: '20px', marginTop: '5px' }}>
              <p style={{ margin: 0, color: '#007bff', fontWeight: 'bold' }}>{employee.role}</p>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>| Team: <strong>{employee.team}</strong></p>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>| Email: <strong>{employee.email}</strong></p>
            </div>
          </div>

          <div style={{ textAlign: 'center', background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <span style={{ display: 'block', fontSize: '12px', color: '#777', marginBottom: '5px' }}>Efficiency</span>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: getEfficiencyColor(efficiencyScore) }}>
              {efficiencyScore}%
            </span>
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '15px', color: '#444' }}>My Assigned Tasks</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Client</th>
              <th>Task Count</th>
              <th>Activity Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {myTasks.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No pending tasks.</td></tr>
            ) : (
              myTasks.map((group, index) => (
                <tr
                  key={group.clientID}
                  style={{
                    backgroundColor: group.status === 'Completed'
                      ? '#e8f5e9' // Light green for completed
                      : 'white'
                  }}
                >
                  <td style={{ lineHeight: '1.2' }}>
                    {group.isToday && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: '#e3f2fd',
                        color: '#007bff',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        marginBottom: '6px',
                        fontWeight: 'bold',
                        border: '1px solid #b3d7ff'
                      }}>
                        <Clock size={10} />
                        TODAY TASK
                      </div>
                    )}
                    <br />
                    {group.teamSentAt ? (
                      <>
                        {group.teamSentAt.split(' | ')[0]}
                        <br />
                        {group.teamSentAt.split(' | ')[1]}
                      </>
                    ) : group.deliveryDate}
                  </td>
                  <td style={{ fontWeight: 'bold' }}>
                    {canViewClientDetail ? (
                      <Link
                        to={`/clients/${group.clientSlug}`}
                        style={{ color: '#007bff', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                      >
                        {group.client}
                      </Link>
                    ) : (
                      group.client
                    )}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{group.count}</td>
                  <td>{group.activityType}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      background: group.status === 'Completed' ? '#d4edda' : '#fff3cd',
                      color: group.status === 'Completed' ? '#155724' : '#856404'
                    }}>
                      {group.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedGroup(group)}
                      style={{
                        padding: '6px 12px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      View Tasks
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '20px', color: '#2c3e50' }}>Add Remark</h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>Please provide a short summary of your work for this task.</p>

            <textarea
              style={{
                width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #ccc',
                fontSize: '14px', marginBottom: '20px', resize: 'none', outline: 'none'
              }}
              placeholder="Write a short note about your work or task completion..."
              value={employeeRemark}
              onChange={(e) => setEmployeeRemark(e.target.value)}
              maxLength={300}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowRemarkModal(false)}
                style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitCompletion}
                style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#007bff', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Submit Completion
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Group Details Modal */}
      {selectedGroup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', padding: '25px', borderRadius: '12px',
            width: '95%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto',
            position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <button
              onClick={() => setSelectedGroup(null)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                Tasks for {selectedGroup.client}
                <span style={{ fontSize: '14px', background: '#eee', padding: '4px 10px', borderRadius: '20px', fontWeight: 'normal' }}>
                  ID: {selectedGroup.clientID}
                </span>
              </h2>
              <p style={{ color: '#666', marginTop: '5px' }}>Total tasks: <strong>{selectedGroup.count}</strong> | Status: <strong>{selectedGroup.status}</strong></p>
            </div>

            <div className="table-container">
              <table style={{ minWidth: '1000px' }}>
                <thead>
                  <tr>
                    {!isTelecaller && <th>Code</th>}
                    <th>Activity</th>
                    <th>Work</th>
                    {isTelecaller && <th>Calls</th>}
                    <th>Min</th>
                    <th>Chat</th>
                    <th>Upload</th>
                    {!isManagement && <th>Active</th>}
                    {!isManagement && <th>Process</th>}
                    {!isManagement && <th>TL Feedback</th>}
                    {!isManagement && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedGroup.tasks.map((task) => (
                    <TaskItemRow
                      key={task.id}
                      task={task}
                      isTelecaller={isTelecaller}
                      isManagement={isManagement}
                      onUpdateCalls={handleAttendedCallsChange}
                      onUpload={handleFileUpload}
                      onMarkDone={handleMarkDoneClick}
                      onChat={() => setActiveChatTask(task)}
                      onActiveStatusChange={handleActiveStatusChange}
                      unreadCount={unreadCounts[task.activityCode] || 0}
                      getWorkDescription={getWorkDescription}
                      getTotalMinutes={getTotalMinutes}
                      getStatusStyle={getStatusStyle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {activeChatTask && (
        <ChatWindow
          task={activeChatTask}
          currentUser={user}
          onClose={() => setActiveChatTask(null)}
          assignedEmployeeName={!isManagement ? (teamLeader?.name || 'Your Team Leader') : (employee?.name)}
        />
      )}
    </div>
  );
};

// Sub-component for individual task rows within the modal
const TaskItemRow = ({
  task, isTelecaller, isManagement, onUpdateCalls, onUpload, onMarkDone,
  onChat, onActiveStatusChange, unreadCount, getWorkDescription, getTotalMinutes, getStatusStyle
}) => {
  return (
    <tr style={{
      backgroundColor: task.status === 'Completed' || task.status === 'Call Completed'
        ? '#f8fff8'
        : 'white'
    }}>
      {!isTelecaller && (
        <td>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ background: '#eee', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', width: 'fit-content' }}>
              {task.activityCode}
            </span>
            {task.isToday && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontSize: '9px',
                color: '#007bff',
                fontWeight: 'bold',
                background: '#e3f2fd',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid #b3d7ff'
              }}>
                <Clock size={8} /> Today
              </span>
            )}
          </div>
        </td>
      )}
      <td style={{ fontSize: '13px' }}>
        {task.activityType}
        {isTelecaller && task.isToday && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            fontSize: '8px',
            color: '#007bff',
            fontWeight: 'bold',
            background: '#e3f2fd',
            padding: '1px 4px',
            borderRadius: '4px',
            marginTop: '2px',
            border: '1px solid #b3d7ff'
          }}>
            <Clock size={8} /> Today
          </div>
        )}
      </td>
      <td style={{ fontSize: '13px' }}>{getWorkDescription(task)}</td>
      {isTelecaller && (
        <td>
          {task.status === 'Call Completed' ? (
            <span style={{ fontWeight: 'bold' }}>{task.manualAttendedCalls}</span>
          ) : (
            <input
              type="number"
              placeholder="0"
              value={task.manualAttendedCalls || ''}
              onChange={(e) => onUpdateCalls(task.id, e.target.value)}
              style={{ width: '60px', padding: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
              disabled={isManagement}
            />
          )}
        </td>
      )}
      <td style={{ fontWeight: 'bold' }}>{getTotalMinutes(task)}</td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button onClick={onChat} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#25D366' }}>
            <MessageCircle size={20} fill={unreadCount > 0 ? "#25D366" : "none"} />
          </button>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white',
              borderRadius: '50%', padding: '2px 5px', fontSize: '9px', fontWeight: 'bold',
              minWidth: '16px', textAlign: 'center', border: '1px solid white'
            }}>
              {unreadCount}
            </span>
          )}
        </div>
      </td>
      <td>
        {task.submissionLink ? (
          <a href={task.submissionLink} target="_blank" rel="noreferrer" style={{ color: '#007bff', fontSize: '12px', fontWeight: 'bold' }}>View</a>
        ) : (
          !isManagement && (
            <label style={{ cursor: 'pointer', color: '#007bff', fontSize: '12px', textDecoration: 'underline' }}>
              Upload
              <input type="file" style={{ display: 'none' }} onChange={(e) => onUpload(task.id, e.target.files[0])} />
            </label>
          )
        )}
      </td>
      {!isManagement && (
        <td>
          <select
            value={task.activeStatus || "Working"}
            onChange={(e) => onActiveStatusChange(task.id, e.target.value)}
            style={{
              padding: '4px',
              borderRadius: '4px',
              fontSize: '12px',
              border: '1px solid #ccc',
              backgroundColor: task.activeStatus === 'Leave' ? '#ffdada' : '#fff'
            }}
          >
            <option value="Working">Working</option>
            <option value="Leave">Leave</option>
          </select>
        </td>
      )}
      {!isManagement && <td style={getStatusStyle(task.status)}>{task.status}</td>}
      {!isManagement && <td style={{ fontSize: '12px', color: '#e74c3c' }}>{task.remarks || "-"}</td>}
      {!isManagement && (
        <td>
          {task.status !== 'Completed' && task.status !== 'Call Completed' ? (
            <button
              onClick={() => onMarkDone(task)}
              style={{
                padding: '4px 10px', fontSize: '11px', background: '#007bff', color: 'white',
                border: 'none', borderRadius: '4px', cursor: 'pointer'
              }}
            >
              Done
            </button>
          ) : (
            <span style={{ color: '#28a745', fontWeight: 'bold' }}>✔</span>
          )}
        </td>
      )}
    </tr>
  );
};

export default EmployeeProfile;