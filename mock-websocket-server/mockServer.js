import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 4000

// Define __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const extname = path.extname(filePath);

    let contentType = 'text/html';
    if (extname === '.js') contentType = 'text/javascript';
    else if (extname === '.css') contentType = 'text/css';
    else if (extname === '.json') contentType = 'application/json';
    else if (extname === '.png') contentType = 'image/png';
    else if (extname === '.jpg') contentType = 'image/jpg';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const io = new Server(server);

server.listen(3000, () => {
    console.log('Mock Socket.IO server is running on http://localhost:3000/');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Send a response back to the client  
        socket.send(`Server received: ${message}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.post('/subgraph-listing', (req, res) => {
    // Here you can control what response you send based on the input  
    res.json({ success: true, data: req.body });
});

// Mock endpoint for subgraph-location  
app.post('/subgraph-location', (req, res) => {
    res.json({ success: true, locationId: 1 }); // example response  
});

// Start the server  
app.listen(PORT, () => {
    console.log(`Mock server running at http://localhost:${PORT}`);
});  