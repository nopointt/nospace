
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electron', {
    startScrape: (url: string, maxPages: number, proxy: string, dbName: string) => ipcRenderer.invoke('start-scrape', { url, maxPages, proxy, dbName }),
    stopScrape: () => ipcRenderer.invoke('stop-scrape'),
    buildKnowledgeBase: (dbName: string) => ipcRenderer.invoke('build-knowledge-base', { dbName }),
    getReviews: (dbName: string) => ipcRenderer.invoke('get-reviews', { dbName }),
    getDatabases: () => ipcRenderer.invoke('get-databases'),
    exportDatabase: (dbName: string) => ipcRenderer.invoke('export-database', { dbName }),
    onLog: (callback: (message: string) => void) => {
        const subscription = (_: any, msg: string) => callback(msg);
        ipcRenderer.on('scraper-log', subscription);
        return () => ipcRenderer.removeListener('scraper-log', subscription);
    },
    onStats: (callback: (stats: any) => void) => {
        const subscription = (_: any, stats: any) => callback(stats);
        ipcRenderer.on('stats-update', subscription);
        return () => ipcRenderer.removeListener('stats-update', subscription);
    }
})
