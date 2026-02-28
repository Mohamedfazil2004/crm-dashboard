import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Play, ArrowLeft } from 'lucide-react';

const ClientMediaDetail = () => {
    const { clientName } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterType, setFilterType] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (clientName) {
            fetchMedia();
        }
    }, [clientName]);

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [filterType]);

    const fetchMedia = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(`/api/media/assets?project=${encodeURIComponent(clientName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMedia(data);
            }
        } catch (err) {
            console.error("Error fetching media:", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'APPROVED': return '#27ae60';
            case 'REVIEWED': return '#f39c12';
            default: return '#e74c3c';
        }
    };

    // Filtering Logic
    const filteredMedia = media.filter(asset => {
        if (filterType === 'All') return true;
        if (filterType === 'Images') return asset.mime_type && asset.mime_type.startsWith('image/');
        if (filterType === 'Videos') return asset.mime_type && asset.mime_type.startsWith('video/');
        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
    const displayedMedia = filteredMedia.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/client-media')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    color: '#666',
                    fontSize: '14px'
                }}
            >
                <ArrowLeft size={18} /> Back to Overview
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>{clientName} Media</h1>

                {/* Filter Controls */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="All">All Media</option>
                    <option value="Images">Images</option>
                    <option value="Videos">Videos</option>
                </select>
            </div>

            {loading ? (
                <p>Loading media...</p>
            ) : filteredMedia.length === 0 ? (
                <div style={{ padding: '40px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                    <p>{media.length === 0 ? "No media assigned for this client." : "No media found matching the selected filter."}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {displayedMedia.map(asset => (
                            <div key={asset.id} style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                <div style={{ position: 'relative', height: '150px', background: '#000' }}>
                                    <img src={asset.thumbnail_url} alt={asset.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    {asset.mime_type && asset.mime_type.startsWith('video/') && (
                                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '10px' }}>
                                            <Play size={20} color="white" fill="white" />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: getStatusColor(asset.status), color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>
                                        {asset.status}
                                    </div>
                                </div>
                                <div style={{ padding: '12px' }}>
                                    <p style={{ margin: '0 0 5px 0', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={asset.filename}>{asset.filename}</p>
                                    <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#666' }}>{new Date(asset.created_at).toLocaleDateString()}</p>
                                    <a
                                        href={asset.play_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ display: 'block', textAlign: 'center', background: '#007bff', color: 'white', padding: '6px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 'bold' }}
                                    >
                                        View Preview
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '10px' }}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#eee' : 'white' }}
                            >
                                Previous
                            </button>
                            <span style={{ display: 'flex', alignItems: 'center' }}>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                style={{ padding: '8px 16px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === totalPages ? '#eee' : 'white' }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ClientMediaDetail;
