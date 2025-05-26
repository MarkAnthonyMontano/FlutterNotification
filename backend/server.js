// server.js - Complete Express server with Socket.io integration
const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Create express app and HTTP server
const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Configure Express middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Update with your actual password
  database: 'testdb'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection error:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

// Function to notify clients about database changes
function notifyClients(eventType, data) {
  console.log(`🔔 Emitting ${eventType} event:`, data);
  io.emit('db_change', { event: eventType, payload: data });
}

// Setup Socket.io connection event
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// API Routes
// Get all records
app.get('/records', (req, res) => { 
  db.query('SELECT * FROM records', (err, results) => {
    if (err) {
      console.error('Error fetching records:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(results);
  });
});

// Create a record
app.post('/records', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  console.log('📝 Adding new record:', { name });
  
  db.query('INSERT INTO records (name) VALUES (?)', [name], (err, result) => {
    if (err) {
      console.error('Error creating record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    const newRecord = { id: result.insertId, name };
    notifyClients('added', newRecord);
    res.status(201).json(newRecord);
  });
});

// Update a record
app.put('/records/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  console.log('✏️ Updating record:', { id, name });
  
  db.query('UPDATE records SET name = ? WHERE id = ?', [name, id], (err, result) => {
    if (err) {
      console.error('Error updating record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const updatedRecord = { id: parseInt(id), name };
    notifyClients('updated', updatedRecord);
    res.json(updatedRecord);
  });
});

// Delete a record
app.delete('/records/:id', (req, res) => {
  const { id } = req.params;
  
  console.log('🗑️ Deleting record:', { id });
  
  db.query('DELETE FROM records WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting record:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    notifyClients('deleted', { id: parseInt(id) });
    res.json({ id: parseInt(id) });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);  
}); 