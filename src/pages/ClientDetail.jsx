import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';
import { useChat } from '../context/ChatContext';
import ChatWindow from '../components/ChatWindow';
import { MessageCircle, Play } from 'lucide-react';

const ClientDetail = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);

    const isAuthorizedToExport = user?.role === 'Admin' || user?.role === 'Manager';
    const { unreadCounts } = useChat();
    const [activeChatTask, setActiveChatTask] = useState(null);
    const [teamEmployees, setTeamEmployees] = useState([]);

    useEffect(() => {
        fetchClient();
    }, [slug]);

    const fetchClient = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/clients/slug/${slug}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const c = await res.json();

                // Use requirements directly from backend without adding all global defaults.
                // This ensures we only see what was actually selected.
                const requirements = c.requirements || {};

                // Normalize scope_status - only for services that actually exist in requirements
                const normalizedScopeStatus = {};
                Object.keys(requirements).forEach(key => {
                    const req = requirements[key];
                    if (req.checked || parseInt(req.count) > 0) {
                        normalizedScopeStatus[key] = (c.scope_status && c.scope_status[key]) || 'In Progress';
                    }
                });

                const normalizedClient = {
                    ...c,
                    requirements: requirements,
                    scope_status: normalizedScopeStatus
                };

                setClient(normalizedClient);
            } else {
                console.error("Client not found");
            }
        } catch (error) {
            console.error("Error loading client details:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedService) {
            fetchTeamEmployees();
        }
    }, [selectedService]);

    const fetchTeamEmployees = async () => {
        // Map service key to team name
        const teamMap = { 'Web': 'Website', 'SEO': 'SEO', 'Campaign': 'Campaign', 'Calls': 'Telecaller', 'Posters': 'Branding', 'Reels': 'Branding', 'Shorts': 'Branding', 'Longform': 'Branding', 'Carousel': 'Branding', 'EventDay': 'Branding', 'Blog': 'Branding' };
        const team = teamMap[selectedService];
        if (!team) return;

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/employees?team=${team}&status=Active`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeamEmployees(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleExportExcel = () => {
        if (!isAuthorizedToExport) {
            alert("Unauthorized: Only Admins and Managers can export data.");
            return;
        }

        if (!client) return;

        // 1. Prepare Client Info Sheet
        const clientInfo = [
            ["CLIENT REPORT", ""],
            ["Generated At:", new Date().toLocaleString()],
            ["", ""],
            ["CLIENT INFORMATION", ""],
            ["Client ID:", client.clientID],
            ["Client Name:", client.clientName],
            ["Industry:", client.industry || "N/A"],
            ["Phone:", client.phone || "N/A"],
            ["Email:", client.email || "N/A"],
            ["Delivery Target:", client.deliveryDate || "TBD"],
            ["Total Billing:", `₹${client.totalAmount || 0} `],
            ["Status:", client.status || "Pending"],
            ["", ""],
            ["PROJECT SCOPE & STATUS", ""],
            ["Service", "Status"]
        ];

        // Add scope items
        const serviceKeys = [
            { key: 'Web', label: 'Website Management' },
            { key: 'SEO', label: 'SEO Optimization' },
            { key: 'Campaign', label: 'Ad Campaigns' },
            { key: 'Calls', label: 'Telecalling Support' },
            { key: 'Posters', label: 'Poster Designs' },
            { key: 'Reels', label: 'Reel Creation' },
            { key: 'Shorts', label: 'Short Video Production' },
            { key: 'Longform', label: 'Longform Content' },
            { key: 'Carousel', label: 'Carousel Posts' },
            { key: 'EventDay', label: 'Event Day Management' },
            { key: 'Blog', label: 'Blog Publication' }
        ];

        serviceKeys.forEach(item => {
            const req = client.requirements?.[item.key];
            // Only include services that were explicitly selected/checked
            if (req && (req.checked === true || req.checked === 'true')) {
                const status = client.scope_status?.[item.key] || 'Not Set';
                clientInfo.push([item.label, status]);
            }
        });

        // 2. Prepare Timeline Sheet
        const timelineData = [
            ["PROJECT TIMELINE / TASK AUDIT", "", "", "", "", ""],
            ["", "", "", "", "", ""],
            ["Activity Code", "Service Name", "Status", "Assigned At", "Completed At", "Assigned To"]
        ];

        const formatDateXLS = (dateStr) => {
            if (!dateStr || dateStr === 'N/A' || dateStr === 'None') return 'N/A';
            try {
                const d = new Date(dateStr);
                if (isNaN(d.getTime())) return dateStr;
                return d.toLocaleString('en-IN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).toUpperCase();
            } catch { return 'N/A'; }
        };

        if (client.tasks && client.tasks.length > 0) {
            client.tasks.forEach(t => {
                // Find label for content_type (Service Name)
                const serv = serviceKeys.find(sk => sk.key === t.activityType);
                timelineData.push([
                    t.activityCode || "N/A",
                    serv ? serv.label : (t.activityType || "N/A"),
                    t.status || "Pending",
                    formatDateXLS(t.clientSentAt),
                    formatDateXLS(t.completedAt),
                    t.assignedTo || "Unassigned"
                ]);
            });
        } else {
            timelineData.push(["No tasks found for this client.", "", "", "", "", ""]);
        }

        // 3. Create Workbook and Sheets
        const wb = XLSX.utils.book_new();
        const wsClient = XLSX.utils.aoa_to_sheet(clientInfo);
        const wsTimeline = XLSX.utils.aoa_to_sheet(timelineData);

        // Adjust column widths
        wsClient['!cols'] = [{ wch: 25 }, { wch: 40 }];
        wsTimeline['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 25 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, wsClient, "Client Summary");
        XLSX.utils.book_append_sheet(wb, wsTimeline, "Project Timeline");

        // 4. Save File
        XLSX.writeFile(wb, `Client_${client.clientID}_${client.clientName.replace(/\s+/g, '_')}_Report.xlsx`);
    };

    if (loading) return <div className="container" style={{ textAlign: 'center', padding: '50px' }}>Loading client details...</div>;
    if (!client) return <div className="container" style={{ textAlign: 'center', padding: '50px' }}>Client not found.</div>;

    const getServicesWithStatus = () => {
        const results = [];
        const keys = [
            { key: 'Web', label: 'Website Management' },
            { key: 'SEO', label: 'SEO Optimization' },
            { key: 'Campaign', label: 'Ad Campaigns' },
            { key: 'Calls', label: 'Telecalling Support' },
            { key: 'Posters', label: 'Poster Designs' },
            { key: 'Reels', label: 'Reel Creation' },
            { key: 'Shorts', label: 'Short Video Production' },
            { key: 'Longform', label: 'Longform Content' },
            { key: 'Carousel', label: 'Carousel Posts' },
            { key: 'EventDay', label: 'Event Day Management' },
            { key: 'Blog', label: 'Blog Publication' }
        ];

        // Requirement: Show ONLY services that the client explicitly selected
        keys.forEach(item => {
            const req = client.requirements?.[item.key];
            // Strict check: must be checked. We no longer rely on count alone as it has defaults.
            const isSelected = req && (req.checked === true || req.checked === 'true');

            if (isSelected) {
                const status = client.scope_status?.[item.key] || 'In Progress';
                results.push({ label: item.label, status: status, key: item.key });
            }
        });

        return results;
    };

    const activeServices = getServicesWithStatus();

    // Requirement: If no services selected, hide section
    const showProjectSection = activeServices.length > 0;

    return (
        <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            fontWeight: '600',
                            color: '#666',
                            fontSize: '14px',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s'
                        }}
                    >
                        ← Back
                    </button>
                    <h1 style={{ color: '#007bff', margin: 0, fontWeight: '800' }}>Client Records: {client.clientName}</h1>
                </div>

                {isAuthorizedToExport && (
                    <button
                        onClick={handleExportExcel}
                        style={{
                            padding: '10px 20px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 10px rgba(40, 167, 69, 0.2)'
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>📄</span> Export to Excel
                    </button>
                )}
            </div>

            <div style={{
                background: '#fff',
                padding: '35px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                border: '1px solid #f0f0f0'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '25px',
                    marginBottom: '40px'
                }}>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Client ID</label>
                        <p style={{ margin: '8px 0', fontSize: '20px', fontWeight: '700', color: '#007bff' }}>{client.clientID}</p>
                    </div>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Industry</label>
                        <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: '500' }}>{client.industry || "Not Specified"}</p>
                    </div>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Phone</label>
                        <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: '500' }}>{client.phone || "N/A"}</p>
                    </div>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Email Address</label>
                        <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: '500' }}>{client.email || "N/A"}</p>
                    </div>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Delivery Target</label>
                        <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: '500' }}>{client.deliveryDate || "TBD"}</p>
                    </div>
                    <div>
                        <label style={{ color: '#999', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Billing</label>
                        <p style={{ margin: '8px 0', fontSize: '22px', fontWeight: '800', color: '#28a745' }}>₹{client.totalAmount || 0}</p>
                    </div>
                </div>

                <div style={{ borderTop: '2px solid #f8f9fa', paddingTop: '30px' }}>
                    {showProjectSection ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                                <h3 style={{ margin: 0, color: '#333', fontWeight: '700', fontSize: '18px' }}>Project Requirements & Status</h3>

                                <div style={{ minWidth: '250px' }}>
                                    <select
                                        value={selectedService || ""}
                                        onChange={(e) => setSelectedService(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 15px',
                                            borderRadius: '10px',
                                            border: '1px solid #ddd',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            color: '#444',
                                            outline: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <option value="">Select a project service to view task details</option>
                                        {activeServices.map((s, idx) => (
                                            <option key={idx} value={s.key}>{s.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!selectedService ? (
                                <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fcfcfc', borderRadius: '12px', border: '1px dashed #ddd' }}>
                                    <p style={{ color: '#999', fontSize: '15px', fontWeight: '500', margin: 0 }}>
                                        📂 Select a project service from the dropdown above to view granular task details.
                                    </p>
                                </div>
                            ) : (
                                <div className="table-container" style={{ marginTop: '10px', overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Task ID</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Assigned Date</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Status</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Status Updated At</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Upload</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Chat</th>
                                                <th style={{ padding: '15px', fontSize: '13px', fontWeight: '700', color: '#666' }}>Employee Remark</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {client.tasks?.filter(t => t.activityType === selectedService).length > 0 ? (
                                                client.tasks.filter(t => t.activityType === selectedService).map((task, idx) => {
                                                    // Status Mapping
                                                    let statusLabel = task.status;
                                                    let statusColor = '#007bff'; // Blue for Assigned
                                                    let statusBg = '#e7f1ff';

                                                    if (task.status === 'In Progress' || task.status === 'Ongoing') {
                                                        statusLabel = 'In Progress';
                                                        statusColor = '#ef6c00';
                                                        statusBg = '#fff3e0';
                                                    } else if (task.status === 'Completed' || task.status === 'Done' || task.status === 'Call Completed') {
                                                        statusLabel = 'Completed';
                                                        statusColor = '#2e7d32';
                                                        statusBg = '#e8f5e9';
                                                    } else {
                                                        // Default to 'Assigned' for 'Pending' or any other non-started state
                                                        statusLabel = 'Assigned';
                                                        statusColor = '#007bff';
                                                        statusBg = '#e7f1ff';
                                                    }

                                                    const formatDate = (dateStr) => {
                                                        if (!dateStr || dateStr === 'N/A') return 'N/A';
                                                        try {
                                                            const d = new Date(dateStr);
                                                            if (isNaN(d.getTime())) return dateStr;
                                                            return d.toLocaleString('en-IN', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            }).toUpperCase();
                                                        } catch { return dateStr; }
                                                    };

                                                    return (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                                            <td style={{ padding: '15px', fontWeight: '700', color: '#444' }}>{task.activityCode}</td>
                                                            <td style={{ padding: '15px', fontSize: '14px', color: '#666' }}>{formatDate(task.clientSentAt)}</td>
                                                            <td style={{ padding: '15px' }}>
                                                                <div style={{
                                                                    display: 'inline-block',
                                                                    padding: '6px 14px',
                                                                    borderRadius: '20px',
                                                                    background: statusBg,
                                                                    color: statusColor,
                                                                    fontSize: '11px',
                                                                    fontWeight: '800',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {statusLabel}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px', fontSize: '13px', color: '#666' }}>
                                                                {task.updatedAt ? new Date(task.updatedAt).toLocaleString() : '-'}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                {task.submissionLink ? (
                                                                    <a href={task.submissionLink} target="_blank" rel="noreferrer" style={{ color: '#007bff', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                                                                        View Upload
                                                                    </a>
                                                                ) : (
                                                                    <span style={{ color: '#bbb', fontSize: '12px' }}>No upload</span>
                                                                )}
                                                            </td>
                                                            <td style={{ padding: '15px' }}>
                                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                    <button
                                                                        onClick={() => setActiveChatTask(task)}
                                                                        style={{
                                                                            background: 'none',
                                                                            border: 'none',
                                                                            cursor: 'pointer',
                                                                            color: '#25D366',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            padding: '5px'
                                                                        }}
                                                                        title="Chat with Employee"
                                                                    >
                                                                        <MessageCircle size={20} fill={unreadCounts[task.activityCode] ? "#25D366" : "none"} />
                                                                    </button>
                                                                    {unreadCounts[task.activityCode] > 0 && (
                                                                        <span style={{
                                                                            position: 'absolute',
                                                                            top: '-5px',
                                                                            right: '-5px',
                                                                            background: '#e74c3c',
                                                                            color: 'white',
                                                                            borderRadius: '50%',
                                                                            padding: '2px 6px',
                                                                            fontSize: '10px',
                                                                            fontWeight: 'bold',
                                                                            minWidth: '18px',
                                                                            textAlign: 'center',
                                                                            border: '2px solid white'
                                                                        }}>
                                                                            {unreadCounts[task.activityCode]}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td style={{ padding: '15px', fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                                                                {task.employeeRemark || '-'}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#999', fontStyle: 'italic' }}>
                                                        No tasks available for this service.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999', background: '#fafafa', borderRadius: '12px', border: '1px solid #eee' }}>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: '500' }}>
                                ℹ️ No services selected for this client.
                            </p>
                        </div>
                    )}
                </div>

                {/* Media Gallery Section */}
                {client.media_assets && client.media_assets.length > 0 && (
                    <div style={{ marginTop: '40px', borderTop: '2px solid #f8f9fa', paddingTop: '30px' }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontWeight: '700', fontSize: '18px' }}>Media Gallery</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                            {client.media_assets.map(asset => (
                                <div key={asset.id} style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <div style={{ height: '120px', background: '#000', position: 'relative' }}>
                                        <img src={asset.thumbnail_url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        {asset.mime_type && asset.mime_type.startsWith('video/') && (
                                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '8px' }}>
                                                <Play size={16} color="white" fill="white" />
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>
                                            {asset.status}
                                        </div>
                                    </div>
                                    <div style={{ padding: '10px' }}>
                                        <p style={{ margin: '0', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 'bold' }} title={asset.filename}>{asset.filename}</p>
                                        <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>{new Date(asset.created_at).toLocaleDateString()}</p>
                                        <a href={asset.play_url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px', fontSize: '12px', color: '#007bff', textDecoration: 'none' }}>View Preview</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {activeChatTask && (
                <ChatWindow
                    task={activeChatTask}
                    currentUser={user}
                    onClose={() => setActiveChatTask(null)}
                    assignedEmployeeName={teamEmployees.find(e => e.id === activeChatTask.assignedTo)?.name}
                />
            )}
        </div>
    );
};

export default ClientDetail;
