const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/logo/airloop_logo_black.png')
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-image-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Images Folder'
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('select-xml-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select XML Files Folder'
  });
  
  if (!result.canceled) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('read-folder-contents', async (event, folderPath) => {
  try {
    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(file => 
      /\.(jpg|jpeg|png|bmp|gif|tiff)$/i.test(file)
    );
    const xmlFiles = files.filter(file => 
      /\.xml$/i.test(file)
    );
    
    return {
      images: imageFiles,
      xmls: xmlFiles,
      path: folderPath
    };
  } catch (error) {
    console.error('Error reading folder:', error);
    return null;
  }
});

ipcMain.handle('read-xml-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error('Error reading XML file:', error);
    return null;
  }
});

ipcMain.handle('write-xml-file', async (event, filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing XML file:', error);
    return false;
  }
});
