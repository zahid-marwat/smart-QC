# Smart QC - Quality Control for Image Annotations

A comprehensive desktop application for quality control of image annotations with configurable attributes, built with React frontend and Python backend.

## Features

### Core Functionality
- **Multi-format Support**: Works with various image formats (JPG, PNG, BMP, GIF, TIFF)
- **XML Annotation Support**: Reads and writes XML annotation files (labelImg compatible)
- **Flexible Folder Selection**: 
  - Separate folders for images and XML files
  - Combined folder option when both are in the same location
- **Configurable Attributes**: Add custom quality control attributes via JSON configuration files
- **Real-time Editing**: Modify XML annotations with custom QC attributes
- **Desktop Application**: Electron-based Windows executable

### Configuration Options
- **Object Detection QC**: Confidence scores, visibility levels, quality ratings
- **Image Classification QC**: Classification confidence, image quality, lighting conditions  
- **Segmentation QC**: Segmentation quality, boundary accuracy, completeness
- **Custom Configuration**: Load your own attribute configurations via JSON files

### User Interface
- **AirLoop Branding**: Custom logo and orange/yellow color scheme
- **Three-Panel Layout**: Image list, main viewer, and attribute panel
- **Intuitive Navigation**: Previous/next buttons and click-to-select
- **Real-time Feedback**: Status indicators and validation messages

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8 or higher
- Git

### Frontend Setup
```bash
# Clone the repository
git clone <repository-url>
cd smart-QC

# Install dependencies
npm install

# Start development server
npm run electron-dev
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start backend server
python app.py
```

### Building Executable
```bash
# Build React app and create executable
npm run electron-pack
```

## Configuration

### Default Configurations

The application comes with three built-in configurations:

1. **Object Detection QC** (`config/object_detection_config.json`)
   - Confidence scores
   - Visibility levels (fully_visible, partially_occluded, heavily_occluded)
   - Quality ratings (excellent, good, fair, poor)
   - Verification details

2. **Image Classification QC** (`config/classification_config.json`)
   - Classification confidence
   - Image quality assessment
   - Lighting conditions
   - Annotation accuracy

3. **Segmentation QC** (`config/segmentation_config.json`)
   - Segmentation quality
   - Boundary accuracy
   - Completeness assessment
   - Edge quality

### Custom Configuration

Create a `config.json` file in your image or XML folder with the following structure:

```json
{
  "name": "Custom QC Configuration",
  "version": "1.0.0",
  "description": "Your custom quality control configuration",
  "type": "custom",
  "attributes": [
    {
      "name": "custom_attribute",
      "type": "select",
      "options": ["option1", "option2", "option3"],
      "description": "Description of the attribute",
      "default": "option1"
    },
    {
      "name": "numeric_rating",
      "type": "number",
      "min": 0,
      "max": 10,
      "step": 1,
      "description": "Numeric rating (0-10)",
      "default": 5
    },
    {
      "name": "text_notes",
      "type": "textarea",
      "description": "Additional notes",
      "default": ""
    }
  ]
}
```

### Attribute Types

- **text**: Single-line text input
- **textarea**: Multi-line text input
- **number**: Numeric input with min/max/step validation
- **select**: Dropdown selection from predefined options
- **date**: Date picker input

## Usage

1. **Launch Application**: Run the executable or development server
2. **Select Folders**: Choose your image and XML folders (separate or combined)
3. **Choose Configuration**: Select from built-in configs or use custom config.json
4. **Quality Control**: 
   - Navigate through images using the left panel
   - View images in the center panel
   - Add/edit QC attributes in the right panel
   - Save changes to update XML files

## File Structure

```
smart-QC/
├── public/
│   ├── electron.js          # Electron main process
│   └── index.html           # HTML template
├── src/
│   ├── components/          # React components
│   │   ├── Header.js
│   │   ├── FolderSelection.js
│   │   ├── ConfigSelection.js
│   │   ├── ImageViewer.js
│   │   └── AttributePanel.js
│   ├── context/
│   │   └── ThemeContext.js  # Theme provider
│   ├── App.js              # Main React component
│   └── index.js            # React entry point
├── backend/
│   ├── app.py              # Flask backend server
│   └── requirements.txt    # Python dependencies
├── config/                 # Configuration files
│   ├── object_detection_config.json
│   ├── classification_config.json
│   └── segmentation_config.json
├── assets/
│   └── logo/
│       └── airloop_logo_black.png
└── package.json           # Node.js dependencies
```

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check
- `POST /api/load-folders` - Load image and XML folders
- `POST /api/set-config` - Set configuration
- `GET /api/get-xml/<filename>` - Get XML data for image
- `POST /api/save-xml` - Save XML modifications
- `POST /api/update-attributes` - Update custom attributes
- `GET /api/images/<filename>` - Serve image files
- `POST /api/export-report` - Export QC report

## Development

### Adding New Attribute Types

1. Update the `AttributePanel.js` component's `renderAttributeInput` method
2. Add validation logic if needed
3. Update the backend XML handling in `app.py`

### Customizing Themes

Modify the CSS variables in `src/index.css`:

```css
:root {
  --primary-orange: #FF8C00;
  --secondary-yellow: #FFD700;
  --accent-white: #FFFFFF;
  --text-black: #000000;
}
```

### Adding New Configurations

Create new JSON configuration files in the `config/` folder and add them to the `defaultConfigs` array in `ConfigSelection.js`.

## Troubleshooting

### Common Issues

1. **Electron not starting**: Make sure all dependencies are installed with `npm install`
2. **Backend connection failed**: Ensure Python backend is running on port 5000
3. **Images not loading**: Check file permissions and path accessibility
4. **XML not saving**: Verify write permissions to the XML folder

### Debug Mode

Run in development mode to see detailed error messages:
```bash
npm run electron-dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Smart QC** - Making annotation quality control smart and efficient.
Smart QC for the point Assets Bboxes in XML format
