const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Can add Electron APIs here later
});