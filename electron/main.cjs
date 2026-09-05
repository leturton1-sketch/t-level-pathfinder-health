const { app, BrowserWindow, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const distDirectory = path.join(__dirname, '..', 'dist');
let server;

function contentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.obj': 'text/plain',
  }[extension] || 'application/octet-stream';
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((request, response) => {
      const requestPath = decodeURIComponent((request.url || '/').split('?')[0]);
      const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
      const candidate = path.resolve(distDirectory, relativePath);
      const safeRoot = path.resolve(distDirectory) + path.sep;
      const filePath = candidate.startsWith(safeRoot) ? candidate : path.join(distDirectory, 'index.html');

      fs.stat(filePath, (error, stats) => {
        const resolvedPath = !error && stats.isFile() ? filePath : path.join(distDirectory, 'index.html');
        fs.readFile(resolvedPath, (readError, content) => {
          if (readError) {
            response.writeHead(500, { 'Content-Type': 'text/plain' });
            response.end('Pathfinder Health could not load its bundled files.');
            return;
          }
          response.writeHead(200, { 'Content-Type': contentType(resolvedPath) });
          response.end(content);
        });
      });
    });

    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

async function createWindow() {
  const port = await startStaticServer();
  const window = new BrowserWindow({
    width: 1440,
    height: 1000,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  await window.loadURL(`http://127.0.0.1:${port}/`);
}

app.whenReady().then(createWindow).catch((error) => {
  console.error('Failed to start Pathfinder Health:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
