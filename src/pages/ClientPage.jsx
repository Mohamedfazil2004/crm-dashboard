import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ClientPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('access_token');
      // Fetch ALL clients from backend including Sent ones
      const res = await fetch('/api/clients?all=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        // Also sync to localStorage if other components need it
        localStorage.setItem("allClients", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      setClients([]);
    }
  };

  // --- HELPER: Get Task List ---
  const getTaskList = (client) => {
    const taskNames = [];
    const keys = [
      { key: 'Web', label: 'Web' },
      { key: 'SEO', label: 'SEO' },
      { key: 'Campaign', label: 'Campaign' },
      { key: 'Calls', label: 'Calls' },
      { key: 'Posters', label: 'Post' },
      { key: 'Reels', label: 'Reel' },
      { key: 'Shorts', label: 'Shorts' },
      { key: 'Longform', label: 'Longform' },
      { key: 'Carousel', label: 'Carousel' },
      { key: 'EventDay', label: 'Event Day' },
      { key: 'Blog', label: 'Blog' }
    ];

    keys.forEach(item => {
      // Check if checked or if there is a count
      if (client[item.key]?.checked || parseInt(client[item.key]?.count || 0) > 0) {
        taskNames.push(item.label);
      }
    });

    return taskNames.length > 0 ? taskNames.join(", ") : "None";
  };

  // --- HELPER: Calculate Total Tasks ---
  const getTotalTaskCount = (client) => {
    let total = 0;

    // Branding Items
    total += parseInt(client.Posters?.count || 0);
    total += parseInt(client.Reels?.count || 0);
    total += parseInt(client.Shorts?.count || 0);
    total += parseInt(client.Longform?.count || 0);
    total += parseInt(client.Carousel?.count || 0);
    total += parseInt(client.EventDay?.count || 0);
    total += parseInt(client.Blog?.count || 0);

    // Service Counts
    total += parseInt(client.Web?.count || 0);
    total += parseInt(client.SEO?.count || 0);
    total += parseInt(client.Campaign?.count || 0);
    total += parseInt(client.Calls?.count || 0);

    return total;
  };

  const exportToCSV = () => {
    if (clients.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = [
      "Client ID", "Client Name", "Industry", "Phone", "Email", "Delivery Date",
      "Tasks", "Total Tasks", "Total Amount"
    ];

    const rows = clients.map(client => [
      client.clientID,
      `"${client.clientName}"`,
      client.industry,
      client.phone,
      client.email,
      client.deliveryDate,
      `"${getTaskList(client)}"`,
      getTotalTaskCount(client),
      client.totalAmount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const date = new Date();
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    link.setAttribute("href", url);
    link.setAttribute("download", `All_Clients_Report_${monthYear}.csv`);

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportIndividualCSV = (client) => {
    const headers = [
      "Client ID", "Client Name", "Industry", "Phone", "Email", "Delivery Date",
      "Tasks", "Total Tasks", "Total Amount"
    ];

    const row = [
      client.clientID,
      `"${client.clientName}"`,
      client.industry,
      client.phone,
      client.email,
      client.deliveryDate,
      `"${getTaskList(client)}"`,
      getTotalTaskCount(client),
      client.totalAmount
    ];

    const csvContent = [
      headers.join(","),
      row.join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Client_${client.clientID}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DEBUGGING TOOL: RESET DATA ---
  const handleResetData = () => {
    if (window.confirm("⚠️ WARNING: This will delete ALL client records. Are you sure?")) {
      localStorage.removeItem("allClients");
      setClients([]);
      alert("All client data cleared. Please go to Dashboard and add a new client.");
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#007bff', margin: 0 }}>All Client Records</h1>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isAdmin && (
            <button
              onClick={handleResetData}
              style={{
                background: '#dc3545',
                padding: '10px 15px',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Reset Data
            </button>
          )}

          <button
            onClick={exportToCSV}
            style={{
              background: '#28a745',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            📊 Export All
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Industry</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Task</th>
              <th style={{ textAlign: 'center' }}>Count</th>
              <th>Total Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No client records found.</td></tr>
            ) : (
              clients.map((c, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'bold', color: '#007bff' }}>
                    <Link
                      to={`/clients/${c.slug}`}
                      style={{ color: '#007bff', textDecoration: 'none', borderBottom: '1px solid transparent' }}
                      onMouseOver={(e) => e.target.style.borderBottom = '1px solid #007bff'}
                      onMouseOut={(e) => e.target.style.borderBottom = '1px solid transparent'}
                    >
                      {c.clientID || "-"}
                    </Link>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{c.clientName || "Unknown"}</td>
                  <td>{c.industry || "-"}</td>
                  <td>{c.phone || "-"}</td>
                  <td>{c.email || "-"}</td>
                  <td style={{ fontSize: '12px', color: '#666', maxWidth: '200px' }}>
                    {getTaskList(c)}
                  </td>
                  <td style={{ fontWeight: 'bold', fontSize: '15px', color: '#555', textAlign: 'center' }}>
                    {getTotalTaskCount(c)}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#28a745' }}>₹{c.totalAmount || 0}</td>
                  <td>
                    <button
                      onClick={() => exportIndividualCSV(c)}
                      style={{
                        padding: '5px 10px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Export
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientPage;
