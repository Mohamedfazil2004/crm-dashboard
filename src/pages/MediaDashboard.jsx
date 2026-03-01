import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Play, Filter, User, Calendar, CheckCircle, Clock, AlertCircle,
    Bookmark, Video, Image as ImageIcon, Sparkles, Megaphone,
    MessageSquare, GraduationCap, Camera, Grid3x3, X
} from 'lucide-react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';

const SCRIPT_TYPES = [
    { id: "Social Media", label: "Social Media", icon: Sparkles, color: "#3b82f6" },
    { id: "Service Promotion", label: "Service Promotion", icon: Megaphone, color: "#8b5cf6" },
    { id: "Testimonial", label: "Testimonial", icon: MessageSquare, color: "#10b981" },
    { id: "Educational", label: "Educational", icon: GraduationCap, color: "#f59e0b" },
    { id: "Behind the Scene (BTS)", label: "Behind the Scene", icon: Camera, color: "#ec4899" }
];

const MediaDashboard = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        project: 'Unassigned',
        status: '',
        script_type: ''
    });
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [assignTarget, setAssignTarget] = useState("");
    const [activeId, setActiveId] = useState(null);
    const [draggedAsset, setDraggedAsset] = useState(null);
    const [scriptCounts, setScriptCounts] = useState({});

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const canDrag = user?.role === 'Admin' || user?.role === 'Manager';

    useEffect(() => {
        fetchAssets();
        fetchProjects();
        fetchClients();
    }, [filters]);

    useEffect(() => {
        if (selectedVideo) {
            setAssignTarget(selectedVideo.project_name === "Unassigned" ? "" : selectedVideo.project_name);
        }
    }, [selectedVideo]);

    useEffect(() => {
        // Calculate script counts
        const counts = {};
        SCRIPT_TYPES.forEach(type => {
            counts[type.id] = 0;
        });
        counts['Unassigned'] = 0;

        assets.forEach(asset => {
            const scriptType = asset.script_type === 'Unassigned' || !asset.script_type ? 'Unassigned' : asset.script_type;
            counts[scriptType] = (counts[scriptType] || 0) + 1;
        });

        setScriptCounts(counts);
    }, [assets]);

    const fetchAssets = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            const params = new URLSearchParams(filters).toString();
            const res = await fetch(`/api/media/assets?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssets(data);
            }
        } catch (err) {
            console.error("Error fetching assets:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/media/projects', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProjects(data);
            }
        } catch (err) {
            console.error("Error fetching projects:", err);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/clients?all=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (err) {
            console.error("Error fetching clients:", err);
        }
    };

    const handleStatusUpdate = async (assetId, newStatus) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/media/assets/${assetId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchAssets();
                if (selectedVideo?.id === assetId) {
                    setSelectedVideo(prev => ({ ...prev, status: newStatus }));
                }
            }
        } catch (err) {
            console.error("Error updating status:", err);
        }
    };

    const handleAssignProject = async (assetId) => {
        if (!assignTarget) {
            alert("Please select a client first.");
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/media/assets/${assetId}/project`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ project_name: assignTarget })
            });

            const result = await res.json();

            if (res.ok) {
                showToast("Successfully assigned to " + assignTarget, "success");
                fetchAssets();
                if (selectedVideo?.id === assetId) {
                    setSelectedVideo(prev => ({ ...prev, project_name: assignTarget }));
                }
            } else {
                showToast("Failed to assign: " + (result.msg || "Unknown error"), "error");
            }
        } catch (err) {
            console.error("Error assigning project:", err);
            showToast("Error connecting to server.", "error");
        }
    };

    const handleScriptUpdate = async (assetId, newScript) => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/media/assets/${assetId}/script`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ script_type: newScript })
            });
            if (res.ok) {
                showToast(`Script updated to ${newScript}`, "success");
                fetchAssets();
                if (selectedVideo?.id === assetId) {
                    setSelectedVideo(prev => ({ ...prev, script_type: newScript }));
                }
            } else {
                const err = await res.json();
                showToast(err.msg || "Failed to update script type", "error");
            }
        } catch (err) {
            console.error("Error updating script:", err);
            showToast("Error updating script", "error");
        }
    };

    const handleSync = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch('/api/media/sync', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                const authRes = await fetch('/api/media/auth-url', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const authData = await authRes.json();
                if (authData.auth_url) {
                    window.open(authData.auth_url, '_blank', 'width=600,height=600');
                    showToast("Please authorize Google Drive in the popup window and then try Sync again.", "info");
                }
                return;
            }

            if (res.ok) {
                const result = await res.json();
                showToast(result.msg, "success");
                fetchAssets();
            } else {
                const error = await res.json();
                showToast("Sync failed: " + error.msg, "error");
            }
        } catch (err) {
            console.error("Error syncing:", err);
            showToast("Error connecting to server for sync.", "error");
        }
    };

    const handleDragStart = (event) => {
        if (!canDrag) return;
        const asset = assets.find(a => a.id === event.active.id);
        setActiveId(event.active.id);
        setDraggedAsset(asset);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const scriptType = over.id;
            const assetId = active.id;

            // Update script type
            handleScriptUpdate(assetId, scriptType);
        }

        setActiveId(null);
        setDraggedAsset(null);
    };

    const handleScriptPanelClick = (scriptType) => {
        setFilters(prev => ({ ...prev, script_type: scriptType }));
    };

    const showToast = (message, type = "info") => {
        // Simple toast implementation
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-weight: 500;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#27ae60';
            case 'REVIEWED': return '#f39c12';
            default: return '#e74c3c';
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="container" style={{ maxWidth: '100%', padding: '20px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 style={{ color: '#2c3e50', margin: 0, fontSize: '28px', fontWeight: '700' }}>
                        📹 Media Production Hub
                    </h1>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button
                            onClick={handleSync}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            <Clock size={18} /> Sync with Google Drive
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{
                    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    padding: '20px',
                    marginBottom: '30px',
                    borderRadius: '16px',
                    display: 'flex',
                    gap: '15px',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            📁 Project
                        </label>
                        <select
                            value={filters.project}
                            onChange={(e) => setFilters({ ...filters, project: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <option value="Unassigned">📥 Unassigned Media (Inbox)</option>
                            <option value="">🗂️ All Media</option>
                            {projects.filter(p => p !== "Unassigned").map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                            ⚡ Workflow Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">All Statuses</option>
                            <option value="RAW">🔴 RAW (Awaiting Review)</option>
                            <option value="REVIEWED">🟡 REVIEWED (Changes Made)</option>
                            <option value="APPROVED">🟢 APPROVED</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setFilters({ project: 'Unassigned', status: '', script_type: '' })}
                        style={{
                            background: 'white',
                            border: '2px solid #e5e7eb',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            color: '#6b7280',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#f9fafb';
                            e.target.style.borderColor = '#d1d5db';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.borderColor = '#e5e7eb';
                        }}
                    >
                        🔄 Reset Filters
                    </button>
                </div>

                {/* Main Layout: Media Grid + Script Panels */}
                <div className="media-dashboard-layout">
                    {/* Media Grid */}
                    <div className="media-dashboard-grid-container">
                        {!canDrag && (
                            <div style={{
                                background: '#fef3c7',
                                border: '2px solid #fbbf24',
                                borderRadius: '12px',
                                padding: '12px 16px',
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontSize: '14px',
                                color: '#92400e'
                            }}>
                                <AlertCircle size={20} />
                                <span><strong>View Only:</strong> Only Admins and Managers can assign scripts via drag & drop.</span>
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {loading ? (
                                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
                                    <div className="spinner" style={{
                                        width: '50px',
                                        height: '50px',
                                        border: '4px solid #f3f4f6',
                                        borderTop: '4px solid #3b82f6',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        margin: '0 auto 20px'
                                    }}></div>
                                    <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading media from Drive...</p>
                                </div>
                            ) : assets.length === 0 ? (
                                <div style={{
                                    gridColumn: '1/-1',
                                    textAlign: 'center',
                                    padding: '60px',
                                    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                                    borderRadius: '16px',
                                    border: '2px dashed #d1d5db'
                                }}>
                                    <AlertCircle size={64} color="#d1d5db" style={{ marginBottom: '16px' }} />
                                    <h3 style={{ color: '#6b7280', margin: '0 0 8px 0' }}>No media files found</h3>
                                    <p style={{ color: '#9ca3af', margin: 0 }}>Try adjusting your filters or sync with Google Drive</p>
                                </div>
                            ) : (
                                assets.map(asset => (
                                    <MediaCard
                                        key={asset.id}
                                        asset={asset}
                                        canDrag={canDrag}
                                        isDragging={activeId === asset.id}
                                        onPreview={() => setSelectedVideo(asset)}
                                        getStatusColor={getStatusColor}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Script Category Panels */}
                    <ScriptPanels
                        scriptTypes={SCRIPT_TYPES}
                        scriptCounts={scriptCounts}
                        selectedScript={filters.script_type}
                        onScriptClick={handleScriptPanelClick}
                        isDragging={!!activeId}
                    />
                </div>

                {/* Preview Modal */}
                {selectedVideo && (
                    <PreviewModal
                        video={selectedVideo}
                        clients={clients}
                        assignTarget={assignTarget}
                        setAssignTarget={setAssignTarget}
                        onClose={() => setSelectedVideo(null)}
                        onStatusUpdate={handleStatusUpdate}
                        onAssignProject={handleAssignProject}
                        getStatusColor={getStatusColor}
                    />
                )}

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeId && draggedAsset ? (
                        <div style={{
                            width: '280px',
                            opacity: 0.9,
                            transform: 'rotate(5deg)',
                            cursor: 'grabbing'
                        }}>
                            <MediaCard
                                asset={draggedAsset}
                                canDrag={true}
                                isDragging={true}
                                getStatusColor={getStatusColor}
                            />
                        </div>
                    ) : null}
                </DragOverlay>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </DndContext>
    );
};

// Media Card Component
const MediaCard = ({ asset, canDrag, isDragging, onPreview, getStatusColor }) => {
    const [isHovered, setIsHovered] = useState(false);

    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: asset.id,
        disabled: !canDrag,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                ...style,
                background: 'white',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : isHovered ? '0 12px 24px rgba(0,0,0,0.15)' : '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: canDrag ? 'grab' : 'default',
                opacity: isDragging ? 0.5 : 1,
                transform: isHovered && !isDragging ? 'translateY(-4px)' : 'translateY(0)',
                border: '2px solid transparent',
                position: 'relative'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Thumbnail */}
            <div style={{ position: 'relative', height: '180px', background: '#000', overflow: 'hidden' }}>
                <img
                    src={asset.thumbnail_url}
                    alt={asset.filename}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.85,
                        transition: 'all 0.3s'
                    }}
                />
                {asset.mime_type && asset.mime_type.startsWith('video/') && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.6)',
                        borderRadius: '50%',
                        padding: '16px',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <Play size={32} color="white" fill="white" />
                    </div>
                )}

                {/* Status & Script Badges */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    alignItems: 'flex-end'
                }}>
                    <div style={{
                        background: getStatusColor(asset.status),
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        {asset.status}
                    </div>
                    <div style={{
                        background: asset.script_type === 'Unassigned' ? '#6b7280' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <Bookmark size={12} />
                        {asset.script_type}
                    </div>
                </div>

                {canDrag && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: '600',
                        color: '#6b7280',
                        backdropFilter: 'blur(4px)'
                    }}>
                        🖱️ Drag to assign
                    </div>
                )}
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#1f2937',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {asset.filename}
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} color="#9ca3af" />
                        <span>{asset.shoot_date || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Bookmark size={14} color="#9ca3af" />
                        <span style={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {asset.script_type}
                        </span>
                    </div>
                </div>

                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid #f3f4f6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>
                        📁 {asset.project_name}
                    </div>
                    {onPreview && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview();
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            👁️ Preview
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Script Panels Component
const ScriptPanels = ({ scriptTypes, scriptCounts, selectedScript, onScriptClick, isDragging }) => {
    return (
        <div className="media-dashboard-sidebar">
            <h2 style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <Grid3x3 size={20} />
                Script Categories
            </h2>

            {/* All Media */}
            <ScriptPanel
                id="all"
                label="All Media"
                icon={Grid3x3}
                color="#6b7280"
                count={Object.values(scriptCounts).reduce((a, b) => a + b, 0)}
                isSelected={selectedScript === ''}
                onClick={() => onScriptClick('')}
                isDragging={false}
                isDropZone={false}
            />

            {/* Unassigned */}
            <ScriptPanel
                id="Unassigned"
                label="Unassigned"
                icon={AlertCircle}
                color="#ef4444"
                count={scriptCounts['Unassigned'] || 0}
                isSelected={selectedScript === 'Unassigned'}
                onClick={() => onScriptClick('Unassigned')}
                isDragging={isDragging}
                isDropZone={true}
            />

            {/* Script Types */}
            {scriptTypes.map(type => (
                <ScriptPanel
                    key={type.id}
                    id={type.id}
                    label={type.label}
                    icon={type.icon}
                    color={type.color}
                    count={scriptCounts[type.id] || 0}
                    isSelected={selectedScript === type.id}
                    onClick={() => onScriptClick(type.id)}
                    isDragging={isDragging}
                    isDropZone={true}
                />
            ))}
        </div>
    );
};

// Script Panel Component
const ScriptPanel = ({ id, label, icon: Icon, color, count, isSelected, onClick, isDragging, isDropZone }) => {
    const [isHovered, setIsHovered] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: id,
        disabled: !isDropZone,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                background: isSelected ? `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)` : 'white',
                border: isOver ? `3px dashed ${color}` : isSelected ? `2px solid ${color}` : '2px solid #e5e7eb',
                borderRadius: '16px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateX(-4px)' : 'translateX(0)',
                boxShadow: isOver ? `0 8px 24px ${color}40` : isHovered ? '0 6px 16px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {isOver && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `${color}10`,
                    animation: 'pulse 1s infinite',
                    pointerEvents: 'none'
                }}></div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Icon size={24} color={color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontSize: '14px',
                        fontWeight: '700',
                        color: '#1f2937',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {label}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        fontWeight: '500'
                    }}>
                        {count} {count === 1 ? 'item' : 'items'}
                    </div>
                </div>
                {count > 0 && (
                    <div style={{
                        background: color,
                        color: 'white',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        flexShrink: 0,
                        boxShadow: `0 2px 8px ${color}40`
                    }}>
                        {count}
                    </div>
                )}
            </div>

            {isOver && isDropZone && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    background: `${color}15`,
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: color,
                    textAlign: 'center',
                    position: 'relative',
                    zIndex: 1
                }}>
                    📥 Drop here to assign
                </div>
            )}
        </div>
    );
};

// Preview Modal Component
const PreviewModal = ({ video, clients, assignTarget, setAssignTarget, onClose, onStatusUpdate, onAssignProject, getStatusColor }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.85)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000,
                padding: '20px',
                backdropFilter: 'blur(4px)'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    maxWidth: '1000px',
                    width: '100%',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Video Player */}
                <div style={{ aspectRatio: '16/9', background: '#000', flexShrink: 0 }}>
                    <iframe
                        src={video.play_url}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="autoplay"
                        title="Video Preview"
                    ></iframe>
                </div>

                {/* Content */}
                <div style={{ padding: '30px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
                                {video.filename}
                            </h2>
                            <p style={{ color: '#6b7280', margin: 0, fontSize: '14px' }}>
                                Project: <span style={{ fontWeight: '600', color: '#3b82f6' }}>{video.project_name}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: '#f3f4f6',
                                border: 'none',
                                borderRadius: '50%',
                                width: '40px',
                                height: '40px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px',
                                color: '#6b7280',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#e5e7eb';
                                e.target.style.transform = 'rotate(90deg)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#f3f4f6';
                                e.target.style.transform = 'rotate(0deg)';
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        {/* Review Workflow */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                ⚡ Review Workflow
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['RAW', 'REVIEWED', 'APPROVED'].map(stat => (
                                    <button
                                        key={stat}
                                        onClick={() => onStatusUpdate(video.id, stat)}
                                        style={{
                                            flex: 1,
                                            padding: '10px 8px',
                                            borderRadius: '8px',
                                            border: video.status === stat ? 'none' : '2px solid #e5e7eb',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer',
                                            background: video.status === stat ? getStatusColor(stat) : 'white',
                                            color: video.status === stat ? 'white' : '#6b7280',
                                            transition: 'all 0.2s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (video.status !== stat) {
                                                e.target.style.borderColor = getStatusColor(stat);
                                                e.target.style.color = getStatusColor(stat);
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (video.status !== stat) {
                                                e.target.style.borderColor = '#e5e7eb';
                                                e.target.style.color = '#6b7280';
                                            }
                                        }}
                                    >
                                        {stat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Assign Client */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                                📁 Assign Client (Project)
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <select
                                    value={assignTarget}
                                    onChange={(e) => setAssignTarget(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '2px solid #e5e7eb',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Select Client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.clientName}>
                                            {client.clientName}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => onAssignProject(video.id)}
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0 20px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Metadata */}
                    <div style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#374151' }}>
                            📊 Asset Metadata
                        </h4>
                        <div style={{
                            fontSize: '13px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px',
                            color: '#6b7280'
                        }}>
                            <div>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Upload Date:</span>{' '}
                                <span style={{ color: '#374151' }}>{video.created_at?.split('T')[0]}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Mime Type:</span>{' '}
                                <span style={{ color: '#374151' }}>{video.mime_type}</span>
                            </div>
                            <div>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Owner:</span>{' '}
                                <span style={{ color: '#374151' }}>{video.crew_member || 'System'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Status:</span>
                                <span style={{
                                    color: 'white',
                                    background: getStatusColor(video.status),
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase'
                                }}>
                                    {video.status}
                                </span>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <span style={{ fontWeight: '600', color: '#9ca3af' }}>Script Type:</span>{' '}
                                <span style={{
                                    color: 'white',
                                    background: video.script_type === 'Unassigned' ? '#6b7280' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    marginLeft: '8px'
                                }}>
                                    {video.script_type}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaDashboard;
