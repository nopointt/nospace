const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3333;
const LOGS_DIR = path.join(__dirname, 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Agent configurations
const AGENTS = {
    qwen: { name: 'Qwen', logFile: 'qwen.log' },
    opencode: { name: 'OpenCode', logFile: 'opencode.log' },
    gemini: { name: 'Gemini', logFile: 'gemini.log' }
};

// Track last modification times for status
const lastModTimes = {};

// Read HTML file once at startup
const dashboardPath = path.join(__dirname, 'dashboard.html');
let dashboardHtml = '';
try {
    dashboardHtml = fs.readFileSync(dashboardPath, 'utf8');
} catch (err) {
    console.error('Error loading dashboard.html:', err.message);
    dashboardHtml = '<h1>Error: dashboard.html not found</h1>';
}

// Get last N lines from a file
function getLastLines(filePath, n) {
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim() !== '');
        return lines.slice(-n);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
        return [];
    }
}

// Get file modification time
function getFileMtime(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const stats = fs.statSync(filePath);
        return stats.mtimeMs;
    } catch (err) {
        return null;
    }
}

// Parse URL and route request
function handleRequest(req, res) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // Serve dashboard HTML
    if (pathname === '/' || pathname === '/dashboard.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(dashboardHtml);
        return;
    }

    // API: Get logs for specific agent
    if (pathname.startsWith('/logs/')) {
        const agent = pathname.split('/logs/')[1].toLowerCase();
        
        if (!AGENTS[agent]) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Agent not found' }));
            return;
        }

        const logPath = path.join(LOGS_DIR, AGENTS[agent].logFile);
        const lines = getLastLines(logPath, 100);
        const mtime = getFileMtime(logPath);
        const now = Date.now();
        
        // Determine status: ACTIVE if updated within 30 seconds
        let status = 'IDLE';
        if (mtime && (now - mtime) < 30000) {
            status = 'ACTIVE';
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            agent: agent,
            name: AGENTS[agent].name,
            status: status,
            lines: lines,
            lastUpdate: mtime
        }));
        return;
    }

    // API: Get all agents status
    if (pathname === '/api/status') {
        const statusData = {};
        const now = Date.now();

        for (const [key, config] of Object.entries(AGENTS)) {
            const logPath = path.join(LOGS_DIR, config.logFile);
            const mtime = getFileMtime(logPath);
            let status = 'IDLE';
            if (mtime && (now - mtime) < 30000) {
                status = 'ACTIVE';
            }
            statusData[key] = {
                name: config.name,
                status: status,
                lastUpdate: mtime
            };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(statusData));
        return;
    }

    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
    console.log(`Agent Monitor Server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
