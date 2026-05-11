/**
 * 闲鱼自动化助手 - 后端服务
 * 
 * 纯 Node.js HTTP 服务器，替代 Electron
 * 提供静态文件服务和 REST API 接口
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cron = require('node-cron');

// 项目运行根目录（backend/ 作为工作目录）
const APP_ROOT = path.resolve(__dirname);
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// 存储文件路径
const STORE_DIR = path.join(__dirname, 'store');
const SCHEDULED_TASKS_FILE = path.join(STORE_DIR, 'scheduled_tasks.json');
const TASK_LOGS_FILE = path.join(STORE_DIR, 'task_logs.json');

// 确保存储目录存在
if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
}

// ========== 简单的 JSON 文件存储 ==========
function readJSON(filePath, defaultVal = []) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    } catch (e) { /* ignore */ }
    return defaultVal;
}

function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ========== 定时任务存储 ==========
function getScheduledTasks() {
    return readJSON(SCHEDULED_TASKS_FILE, []);
}

function setScheduledTasks(tasks) {
    writeJSON(SCHEDULED_TASKS_FILE, tasks);
}

function getTaskLogs() {
    return readJSON(TASK_LOGS_FILE, []);
}

function setTaskLogs(logs) {
    writeJSON(TASK_LOGS_FILE, logs);
}

// ========== SSE 客户端管理 ==========
const sseClients = new Set();

function broadcastSSE(event, data) {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    sseClients.forEach(client => {
        try {
            client.write(message);
        } catch (e) {
            sseClients.delete(client);
        }
    });
}

// ========== 可用任务列表 ==========
function getAvailableTasks() {
    return [
        { name: '每日搜索任务', path: 'tasks/get_shop_review_data.js' },
        { name: '获取飞书聊天链接', path: 'tasks/get_feishu_chat_links.js' },
        { name: '自动聊天链接', path: 'tasks/auto_chat_link.js' },
        { name: '自动回复任务', path: 'tasks/auto_reply.js' },
        { name: '自动发布任务', path: 'tasks/publish_links.js' },
        { name: '关键词搜索任务', path: 'tasks/search_shop_links_by_keyword.js' },
        { name: '获取店铺链接', path: 'tasks/get_shop_links.js' },
        { name: '资源处理任务', path: 'tasks/process_link_cozi.js' },
        { name: '每日链接数据更新', path: 'tasks/get_shop_link_date_data.js' },
        { name: '图片处理任务', path: 'tasks/process_image.js' }
    ];
}

// ========== 计算下次执行时间 ==========
function calculateNextRun(cronExpression) {
    try {
        const cronParts = cronExpression.split(' ');
        if (cronParts.length === 5) {
            const [minute, hour] = cronParts;
            const now = new Date();
            let next = new Date(now);
            if (hour !== '*') {
                next.setHours(parseInt(hour), parseInt(minute) || 0, 0, 0);
                if (next <= now) next.setDate(next.getDate() + 1);
            } else if (minute !== '*') {
                next.setMinutes(parseInt(minute), 0, 0);
                if (next <= now) next.setMinutes(next.getMinutes() + 60);
            } else {
                next.setMinutes(next.getMinutes() + 1);
            }
            return next.toISOString();
        }
    } catch (e) { /* ignore */ }
    return '';
}

// ========== 执行脚本 ==========
function runScript(scriptPath) {
    return new Promise((resolve, reject) => {
        const fullPath = path.join(APP_ROOT, scriptPath);
        const logEntry = {
            id: Date.now().toString(),
            scriptPath,
            startTime: new Date().toISOString(),
            endTime: '',
            status: 'running',
            output: ''
        };

        // 广播开始日志
        broadcastSSE('task-log', logEntry);

        const child = spawn('node', [fullPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true,
            cwd: __dirname
        });

        let output = '';

        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            broadcastSSE('task-output', { id: logEntry.id, output: text });
        });

        child.stderr.on('data', (data) => {
            const text = data.toString();
            output += text;
            broadcastSSE('task-output', { id: logEntry.id, output: text });
        });

        child.on('close', (code) => {
            logEntry.endTime = new Date().toISOString();
            logEntry.status = code === 0 ? 'success' : 'failed';
            logEntry.output = output;

            // 保存日志
            const logs = getTaskLogs();
            logs.unshift(logEntry);
            setTaskLogs(logs.slice(0, 200));

            broadcastSSE('task-complete', logEntry);
            resolve(logEntry);
        });

        child.on('error', (err) => {
            logEntry.endTime = new Date().toISOString();
            logEntry.status = 'failed';
            logEntry.output = err.message;

            const logs = getTaskLogs();
            logs.unshift(logEntry);
            setTaskLogs(logs.slice(0, 200));

            broadcastSSE('task-complete', logEntry);
            reject(err);
        });
    });
}

// ========== Cron 任务管理 ==========
const cronJobs = new Map();

function registerCronTask(task) {
    if (cronJobs.has(task.id)) {
        cronJobs.get(task.id).stop();
    }
    if (!task.enabled) return;

    try {
        const job = cron.schedule(task.cronExpression, async () => {
            task.lastRun = new Date().toISOString();
            const tasks = getScheduledTasks();
            const idx = tasks.findIndex(t => t.id === task.id);
            if (idx !== -1) {
                tasks[idx].lastRun = task.lastRun;
                setScheduledTasks(tasks);
            }
            broadcastSSE('task-triggered', task);
            await runScript(task.scriptPath);
        });
        cronJobs.set(task.id, job);

        // 更新下次运行时间
        const tasks = getScheduledTasks();
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
            tasks[idx].nextRun = calculateNextRun(task.cronExpression);
            setScheduledTasks(tasks);
        }
        return true;
    } catch (err) {
        console.error(`定时任务注册失败: ${task.name}`, err);
        return false;
    }
}

function initScheduledTasks() {
    const tasks = getScheduledTasks();
    tasks.forEach(task => registerCronTask(task));
}

// ========== MIME 类型 ==========
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

// ========== 解析请求体 ==========
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

// ========== 静态文件服务 ==========
function serveStaticFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 404 时返回 index.html（支持 SPA）
            fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (err2, data2) => {
                if (err2) {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404 Not Found');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(data2);
            });
            return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

// ========== HTTP 服务器 ==========
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // ===== API 路由 =====
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
            // --- GET /api/tasks --- 获取可用任务列表
            if (pathname === '/api/tasks' && method === 'GET') {
                res.end(JSON.stringify({ success: true, data: getAvailableTasks() }));
                return;
            }

            // --- GET /api/scheduled-tasks --- 获取定时任务列表
            if (pathname === '/api/scheduled-tasks' && method === 'GET') {
                res.end(JSON.stringify({ success: true, data: getScheduledTasks() }));
                return;
            }

            // --- POST /api/scheduled-tasks --- 添加定时任务
            if (pathname === '/api/scheduled-tasks' && method === 'POST') {
                const body = await parseBody(req);
                const task = {
                    id: Date.now().toString(),
                    name: body.name,
                    scriptPath: body.scriptPath,
                    cronExpression: body.cronExpression,
                    enabled: body.enabled !== false,
                    lastRun: '',
                    nextRun: calculateNextRun(body.cronExpression),
                    createdAt: new Date().toISOString()
                };
                const tasks = getScheduledTasks();
                tasks.push(task);
                setScheduledTasks(tasks);
                registerCronTask(task);
                res.end(JSON.stringify({ success: true, data: task }));
                return;
            }

            // --- PUT /api/scheduled-tasks/:id --- 更新定时任务
            if (pathname.startsWith('/api/scheduled-tasks/') && method === 'PUT') {
                const taskId = pathname.split('/')[3];
                const body = await parseBody(req);
                const tasks = getScheduledTasks();
                const idx = tasks.findIndex(t => t.id === taskId);
                if (idx !== -1) {
                    tasks[idx] = { ...tasks[idx], ...body };
                    tasks[idx].nextRun = calculateNextRun(tasks[idx].cronExpression);
                    setScheduledTasks(tasks);
                    registerCronTask(tasks[idx]);
                    res.end(JSON.stringify({ success: true, data: tasks[idx] }));
                } else {
                    res.end(JSON.stringify({ success: false, error: '任务未找到' }));
                }
                return;
            }

            // --- DELETE /api/scheduled-tasks/:id --- 删除定时任务
            if (pathname.startsWith('/api/scheduled-tasks/') && method === 'DELETE') {
                const taskId = pathname.split('/')[3];
                if (cronJobs.has(taskId)) {
                    cronJobs.get(taskId).stop();
                    cronJobs.delete(taskId);
                }
                const tasks = getScheduledTasks().filter(t => t.id !== taskId);
                setScheduledTasks(tasks);
                res.end(JSON.stringify({ success: true }));
                return;
            }

            // --- POST /api/tasks/run --- 立即运行脚本
            if (pathname === '/api/tasks/run' && method === 'POST') {
                const body = await parseBody(req);
                const result = await runScript(body.scriptPath);
                res.end(JSON.stringify({ success: true, data: result }));
                return;
            }

            // --- POST /api/tasks/toggle/:id --- 切换任务启用状态
            if (pathname.startsWith('/api/tasks/toggle/') && method === 'POST') {
                const taskId = pathname.split('/')[4];
                const tasks = getScheduledTasks();
                const idx = tasks.findIndex(t => t.id === taskId);
                if (idx !== -1) {
                    tasks[idx].enabled = !tasks[idx].enabled;
                    setScheduledTasks(tasks);
                    registerCronTask(tasks[idx]);
                    res.end(JSON.stringify({ success: true, data: tasks[idx] }));
                } else {
                    res.end(JSON.stringify({ success: false, error: '任务未找到' }));
                }
                return;
            }

            // --- GET /api/logs --- 获取任务日志
            if (pathname === '/api/logs' && method === 'GET') {
                res.end(JSON.stringify({ success: true, data: getTaskLogs() }));
                return;
            }

            // --- DELETE /api/logs --- 清空日志
            if (pathname === '/api/logs' && method === 'DELETE') {
                setTaskLogs([]);
                res.end(JSON.stringify({ success: true }));
                return;
            }

            // 未知 API 路由
            res.writeHead(404);
            res.end(JSON.stringify({ success: false, error: '路由未找到' }));
        } catch (e) {
            console.error('API 错误:', e);
            res.writeHead(500);
            res.end(JSON.stringify({ success: false, error: e.message }));
        }
        return;
    }

    // ===== SSE 端点 =====
    if (pathname === '/events') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        });
        res.write('retry: 1000\n\n');

        sseClients.add(res);
        req.on('close', () => {
            sseClients.delete(res);
        });
        return;
    }

    // ===== 静态文件服务 =====
    let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
    serveStaticFile(res, filePath);
});

// ========== 启动服务器 ==========
server.listen(PORT, () => {
    console.log(`==========================================`);
    console.log(`  闲鱼自动化助手 - 服务已启动`);
    console.log(`==========================================`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  按 Ctrl+C 停止服务`);
    console.log(`==========================================`);

    // 初始化定时任务
    initScheduledTasks();
});
