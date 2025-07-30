# Getting Started with Smart QC

## 🚀 Quick Start

### Option 1: Automatic Setup (Recommended)
Simply double-click `start.bat` and the application will automatically:
- Install all dependencies
- Set up the Python backend
- Launch the application

### Option 2: Manual Setup

#### Prerequisites
- Node.js (v16+): https://nodejs.org/
- Python (3.8+): https://python.org/

#### Step 1: Install Frontend Dependencies
```bash
npm install
```

#### Step 2: Set Up Python Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### Step 3: Run the Application
```bash
# Terminal 1: Start backend (from backend folder)
venv\Scripts\activate
python app.py

# Terminal 2: Start frontend (from project root)
npm run electron-dev
```

## 🧪 Testing the Application

### Using Sample Data
1. Copy some JPG images to the `test_data` folder
2. Rename them to `sample_image1.jpg` and `sample_image2.jpg`
3. Launch the application
4. Select "Combined Folder" option
5. Choose the `test_data` folder
6. Select a configuration (Object Detection QC recommended)
7. Start quality control!

### Creating Your Own Data
1. Create a folder with your images (JPG, PNG, etc.)
2. Create corresponding XML files with the same names
3. Use the application to add quality control attributes

## 🔧 Configuration

### Built-in Configurations
- **Object Detection QC**: For bounding box annotations
- **Image Classification QC**: For classification tasks
- **Segmentation QC**: For segmentation masks

### Custom Configuration
Create a `config.json` file in your data folder:

```json
{
  "name": "My Custom QC",
  "version": "1.0.0",
  "description": "Custom quality control configuration",
  "type": "custom",
  "attributes": [
    {
      "name": "quality_score",
      "type": "number",
      "min": 1,
      "max": 10,
      "step": 1,
      "description": "Quality score (1-10)",
      "default": 5
    },
    {
      "name": "review_status",
      "type": "select",
      "options": ["pending", "approved", "rejected"],
      "description": "Review status",
      "default": "pending"
    },
    {
      "name": "notes",
      "type": "textarea",
      "description": "Additional notes",
      "default": ""
    }
  ]
}
```

## 📝 Usage Workflow

1. **Launch Application**
   - Run `start.bat` or manually start both backend and frontend

2. **Select Folders**
   - Choose separate image/XML folders OR combined folder
   - Application will scan for supported files

3. **Choose Configuration**
   - Select built-in configuration or use custom config.json
   - Review the attributes that will be added

4. **Quality Control**
   - Navigate through images using left panel
   - View current image in center panel
   - Add/edit QC attributes in right panel
   - Save changes to update XML files

5. **Export Results**
   - All changes are saved directly to XML files
   - Use the backend API to export reports if needed

## 🔍 Features Overview

### Core Features
- ✅ Multi-format image support (JPG, PNG, BMP, GIF, TIFF)
- ✅ labelImg-compatible XML handling
- ✅ Configurable quality control attributes
- ✅ Real-time XML editing and saving
- ✅ Flexible folder organization
- ✅ Desktop application (Windows executable)

### User Interface
- ✅ Three-panel layout for efficient workflow
- ✅ AirLoop branding with orange/yellow theme
- ✅ Intuitive navigation controls
- ✅ Real-time status feedback
- ✅ Responsive design

### Configuration System
- ✅ Built-in configurations for common tasks
- ✅ Custom JSON configuration support
- ✅ Multiple attribute types (text, number, select, textarea)
- ✅ Validation and default values
- ✅ Hot-reloading of configurations

## 🐛 Troubleshooting

### Common Issues

**Application won't start**
- Ensure Node.js and Python are installed
- Try running `npm install` again
- Check if ports 3000 and 5000 are available

**Images not loading**
- Check file permissions
- Ensure images are in supported formats
- Verify folder paths are correct

**XML not saving**
- Check write permissions to XML folder
- Ensure XML files are valid
- Verify XML folder path is correct

**Configuration not loading**
- Check config.json syntax with a JSON validator
- Ensure config.json is in the correct folder
- Review attribute definitions for errors

### Getting Help

1. Check the `DEVELOPMENT.md` file for detailed setup instructions
2. Review the sample configurations in the `config/` folder
3. Test with the provided sample data in `test_data/`
4. Check console logs in both frontend and backend terminals

## 🏗️ Building for Production

### Create Windows Executable
```bash
# Run the build script
build.bat

# Or manually
npm run build
npm run electron-pack
```

The executable will be created in the `dist/` folder.

## 📚 Next Steps

1. **Customize the Theme**: Modify CSS variables in `src/index.css`
2. **Add New Attribute Types**: Extend `AttributePanel.js` component
3. **Create Custom Configurations**: Use the JSON schema to define your own QC attributes
4. **Integrate with Your Workflow**: Use the REST API for automation
5. **Scale Up**: Deploy the backend server for team collaboration

---

**Happy Quality Control!** 🎯

For more detailed documentation, see:
- `README.md` - Complete project overview
- `DEVELOPMENT.md` - Development setup and guidelines
- `config/` - Sample configuration files
- `test_data/` - Sample XML annotations
