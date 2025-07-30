# Smart QC Development Setup

## Quick Start

### Windows Users
1. Double-click `start.bat` to automatically set up and run the application
2. Or follow the manual setup steps below

### Manual Setup

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm start

# Or start with Electron
npm run electron-dev
```

#### Backend Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Activate virtual environment (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app.py
```

## Building for Production

### Windows
```bash
# Run the build script
build.bat

# Or manually
npm run build
npm run electron-pack
```

### Manual Build
```bash
# Build React app
npm run build

# Build Electron executable
npm run electron-pack
```

## Development Notes

### Hot Reload
- Frontend: Automatically reloads when you save React files
- Backend: Restart `python app.py` when you modify Python files

### Debugging
- Frontend: Open DevTools in Electron (Ctrl+Shift+I)
- Backend: Check console output in the backend terminal

### File Watching
The application watches for changes in:
- React components (`src/` folder)
- Configuration files (`config/` folder)
- Python backend (`backend/` folder)

## Testing

### Test with Sample Data
1. Create a test folder with some images (JPG, PNG)
2. Create corresponding XML files with the same names
3. Use the built-in configurations or create a custom config.json

### Example XML Format
```xml
<?xml version="1.0" encoding="UTF-8"?>
<annotation>
    <filename>image.jpg</filename>
    <size>
        <width>640</width>
        <height>480</height>
        <depth>3</depth>
    </size>
    <object>
        <name>person</name>
        <bndbox>
            <xmin>100</xmin>
            <ymin>100</ymin>
            <xmax>200</xmax>
            <ymax>200</ymax>
        </bndbox>
        <!-- Custom QC attributes will be added here -->
        <confidence_score>0.95</confidence_score>
        <quality_rating>excellent</quality_rating>
        <verified_by>reviewer_001</verified_by>
    </object>
</annotation>
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill process using port 3000
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Port 5000 already in use**
   ```bash
   # Kill process using port 5000
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

3. **Electron not starting**
   ```bash
   # Clear node_modules and reinstall
   rmdir /s node_modules
   npm install
   ```

4. **Python dependencies failing**
   ```bash
   # Upgrade pip and try again
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Logs
- Frontend logs: Browser DevTools Console
- Backend logs: Terminal running `python app.py`
- Electron logs: Main process logs in terminal

## Project Structure Detail

```
smart-QC/
├── public/
│   ├── electron.js          # Electron main process
│   ├── index.html           # HTML template
│   └── favicon.ico          # Application icon
├── src/
│   ├── components/          # React components
│   │   ├── Header.js        # Top navigation bar
│   │   ├── FolderSelection.js # Folder picker interface
│   │   ├── ConfigSelection.js # Configuration chooser
│   │   ├── ImageViewer.js   # Image list and navigation
│   │   └── AttributePanel.js # QC attribute editor
│   ├── context/
│   │   └── ThemeContext.js  # Theme and styling context
│   ├── App.js              # Main React application
│   ├── App.css             # Application styles
│   ├── index.js            # React entry point
│   └── index.css           # Global styles
├── backend/
│   ├── app.py              # Flask backend server
│   └── requirements.txt    # Python dependencies
├── config/                 # Pre-built configurations
│   ├── object_detection_config.json
│   ├── classification_config.json
│   └── segmentation_config.json
├── assets/
│   └── logo/
│       └── airloop_logo_black.png # Company logo
├── build/                  # Built React app (generated)
├── dist/                   # Electron executables (generated)
├── node_modules/           # Node.js dependencies (generated)
├── package.json            # Node.js project config
├── start.bat              # Windows startup script
├── build.bat              # Windows build script
└── README.md              # This documentation
```
