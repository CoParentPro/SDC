const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data) => ipcRenderer.invoke('dialog:saveFile', data),
  
  // App operations
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // Security operations
  encrypt: (data, key) => ipcRenderer.invoke('crypto:encrypt', data, key),
  decrypt: (data, key) => ipcRenderer.invoke('crypto:decrypt', data, key),
  
  // Window operations
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
});