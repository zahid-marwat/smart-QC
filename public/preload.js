const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectImageFolder: () => ipcRenderer.invoke('select-image-folder'),
  selectXmlFolder: () => ipcRenderer.invoke('select-xml-folder'),
  readFolderContents: (folderPath) => ipcRenderer.invoke('read-folder-contents', folderPath),
  readXmlFile: (filePath) => ipcRenderer.invoke('read-xml-file', filePath),
  writeXmlFile: (filePath, content) => ipcRenderer.invoke('write-xml-file', filePath, content),
});
