// App.js - Complete React frontend
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Update with your server's IP address
const SERVER_IPS = [
  'http://192.168.1.10:3000',
  'http://192.168.1.9:3000',
 
];

const SELECTED_INDEX = 0;

const API_URL = `${SERVER_IPS[SELECTED_INDEX]}/records`;
const SOCKET_URL = SERVER_IPS[SELECTED_INDEX];

function App() {
  const [records, setRecords] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Setup socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to socket server');
      setSocketConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setSocketConnected(false);
    });

    socket.on('db_change', (data) => {
      console.log('📦 Database change received:', data);
      // Real-time update the UI when records change
      fetchRecords();
      
      // Show success message
      setSuccess(`Record ${data.event} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    });

    return () => {
      console.log('Cleaning up socket connection');
      socket.disconnect();
    };
  }, []);

  // Fetch records on component mount
  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRecords(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching records:', err);
      setError(`Error fetching records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      if (editingId) {
        // Update existing record
        await axios.put(`${API_URL}/${editingId}`, { name });
        console.log(`Updated record ${editingId}`);
      } else {
        // Create new record
        await axios.post(API_URL, { name });
        console.log('Created new record');
      }
      
      // Reset form
      setName('');
      setEditingId(null);
      
      // No need to fetch records here as socket will trigger updates
    } catch (err) {
      console.error('Error saving record:', err);
      setError(`Error saving record: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      console.log(`Deleted record ${id}`);
      // No need to fetch records here as socket will trigger updates  
    } catch (err) {
      console.error('Error deleting record:', err);
      setError(`Error deleting record: ${err.message}`);
      fetchRecords(); // Refresh in case of error
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record) => {
    setName(record.name);
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setName('');
    setEditingId(null);
  };

  // Styles
  const styles = {
    container: { 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    },
    header: { 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    status: { 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'flex-end' 
    },
    socketStatus: {
      padding: '5px 10px',
      borderRadius: '4px',
      backgroundColor: socketConnected ? '#d4edda' : '#f8d7da',
      color: socketConnected ? '#155724' : '#721c24',
      marginBottom: '10px'
    },
    form: { 
      marginBottom: '20px', 
      display: 'flex', 
      gap: '10px',
      flexWrap: 'wrap'
    },
    input: { 
      padding: '8px', 
      flex: '1', 
      minWidth: '200px' 
    },
    button: { 
      padding: '8px 16px', 
      backgroundColor: '#007bff', 
      color: 'white', 
      border: 'none', 
      cursor: 'pointer' 
    },
    cancelButton: {
      padding: '8px 16px',
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
      cursor: 'pointer'
    },
    error: { 
      padding: '10px', 
      backgroundColor: '#f8d7da', 
      color: '#721c24', 
      borderRadius: '4px', 
      marginBottom: '10px' 
    },
    success: { 
      padding: '10px', 
      backgroundColor: '#d4edda', 
      color: '#155724', 
      borderRadius: '4px', 
      marginBottom: '10px' 
    },
    loading: { 
      padding: '10px', 
      backgroundColor: '#e2e3e5', 
      color: '#383d41', 
      borderRadius: '4px', 
      marginBottom: '10px' 
    },
    recordsList: { 
      listStyle: 'none', 
      padding: '0' 
    },
    recordItem: { 
      padding: '10px', 
      border: '1px solid #ddd', 
      marginBottom: '10px', 
      borderRadius: '4px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    buttonGroup: { 
      display: 'flex', 
      gap: '10px' 
    },
    editButton: { 
      padding: '5px 10px', 
      backgroundColor: '#ffc107', 
      color: 'black', 
      border: 'none', 
      cursor: 'pointer',
      borderRadius: '4px'
    },
    deleteButton: { 
      padding: '5px 10px', 
      backgroundColor: '#dc3545', 
      color: 'white', 
      border: 'none', 
      cursor: 'pointer',
      borderRadius: '4px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>React CRUD App</h1>
        <div style={styles.status}>
          <div style={styles.socketStatus}>
            {socketConnected ? '✅ Live Updates Connected' : '❌ Live Updates Disconnected'}
          </div>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}
      {loading && <div style={styles.loading}>Loading...</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name"
        />
        <button type="submit" style={styles.button}>
          {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
          <button type="button" onClick={cancelEdit} style={styles.cancelButton}>
            Cancel
          </button>
        )}
      </form>

      <h2>Records</h2>
      {records.length === 0 ? (
        <p>No records found. Add some!</p>
      ) : (
        <ul style={styles.recordsList}>
          {records.map((record) => (
            <li key={record.id} style={styles.recordItem}>
              <span>{record.name}</span>
              <div style={styles.buttonGroup}>
                <button 
                  onClick={() => handleEdit(record)} 
                  style={styles.editButton}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(record.id)} 
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;