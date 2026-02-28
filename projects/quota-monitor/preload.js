/**
 * Preload script for secure IPC
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => require('electron').shell.openExternal(url),
  platform: process.platform
});
