import { app, BrowserWindow } from 'electron'
// import { setupScraperHandlers } from './scraper-service' // Moved to dynamic import
import path from 'node:path'
import fs from 'node:fs'

const logDir = app.getPath('userData');
const logFile = path.join(logDir, 'startup.log');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const log = (msg: string) => {
    try {
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {
        // ignore
    }
};

log('Запуск приложения...');

process.on('uncaughtException', (err) => {
    log(`UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
    log(`UNHANDLED REJECTION: ${reason}`);
});

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    log(`LOG: ${args.map(a => String(a)).join(' ')}`);
    originalConsoleLog.apply(console, args);
};
console.error = (...args) => {
    log(`ERROR: ${args.map(a => String(a)).join(' ')}`);
    originalConsoleError.apply(console, args);
};

// The built directory structure
//
// ├─┬─ dist
// │ ├─ index.html
// │ ├─ assets
// │ └─ ...
// ├─┬─ dist-electron
// │ ├─ main.js
// │ └─ preload.js
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: true, // Enable frame for debug
        transparent: false, // Disable transparency for debug
        backgroundColor: '#1A1C1E', // Dark background
        hasShadow: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // Start simple for debugging
            nodeIntegration: true,
            contextIsolation: true // Use context isolation with preload
        },
    })

    // Setup IPC Handlers immediately
    log('Настройка IPC обработчиков...');
    try {
        import('./scraper-service').then(({ setupScraperHandlers }) => {
            setupScraperHandlers(win!);
            log('IPC обработчики настроены.');
        }).catch(err => {
            log(`КРИТИЧЕСКИЙ СБОЙ: Не удалось загрузить сервис скрейпинга: ${err.message}\n${err.stack}`);
        });
    } catch (e: any) {
        log(`КРИТИЧЕСКИЙ СБОЙ: Ошибка в setupScraperHandlers: ${e.message}\n${e.stack}`);
    }

    // Open DevTools immediately to see errors
    win.webContents.openDevTools();

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        log('Процесс рендеринга загружен.');
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        log(`Загрузка Dev Server: ${VITE_DEV_SERVER_URL}`);
        win.loadURL(VITE_DEV_SERVER_URL as string)
    } else {
        const indexPath = path.join(process.env.DIST as string, 'index.html');
        log(`Загрузка Production файла: ${indexPath}`);
        if (!fs.existsSync(indexPath)) {
            log(`КРИТИЧЕСКИЙ СБОЙ: index.html НЕ НАЙДЕН по пути ${indexPath}`);
        }
        win.loadFile(indexPath).catch(e => {
            log(`КРИТИЧЕСКИЙ СБОЙ: Ошибка loadFile: ${e.message}`);
        });
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(() => {
    createWindow()
})
