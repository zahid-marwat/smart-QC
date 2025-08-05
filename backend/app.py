from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import xml.etree.ElementTree as ET
from pathlib import Path
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SmartQCBackend:
    def __init__(self):
        self.current_config = None
        self.image_folder = None
        self.xml_folder = None
        
    def load_config(self, config_path):
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                self.current_config = json.load(f)
            return True
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return False
    
    def get_image_list(self, folder_path):
        """Get list of images in folder"""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.tif'}
        images = []
        
        try:
            for file_path in Path(folder_path).iterdir():
                if file_path.suffix.lower() in image_extensions:
                    images.append({
                        'name': file_path.name,
                        'path': str(file_path),
                        'size': file_path.stat().st_size
                    })
            return sorted(images, key=lambda x: x['name'])
        except Exception as e:
            logger.error(f"Error reading image folder: {e}")
            return []
    
    def get_xml_list(self, folder_path):
        """Get list of XML files in folder"""
        xml_files = []
        
        try:
            for file_path in Path(folder_path).iterdir():
                if file_path.suffix.lower() == '.xml':
                    xml_files.append({
                        'name': file_path.name,
                        'path': str(file_path),
                        'basename': file_path.stem
                    })
            return sorted(xml_files, key=lambda x: x['name'])
        except Exception as e:
            logger.error(f"Error reading XML folder: {e}")
            return []
    
    def get_json_list(self, folder_path):
        """Get list of JSON files in folder"""
        json_files = []
        
        try:
            for file_path in Path(folder_path).iterdir():
                if file_path.suffix.lower() == '.json':
                    json_files.append({
                        'name': file_path.name,
                        'path': str(file_path),
                        'basename': file_path.stem
                    })
            return sorted(json_files, key=lambda x: x['name'])
        except Exception as e:
            logger.error(f"Error reading JSON folder: {e}")
            return []
    
    def read_xml_file(self, xml_path):
        """Read and parse XML file"""
        try:
            # Check if file exists and is not empty
            if not os.path.exists(xml_path) or os.path.getsize(xml_path) == 0:
                logger.warning(f"XML file is empty or doesn't exist: {xml_path}")
                return None
                
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            # Extract basic information
            filename = root.find('filename')
            filename = filename.text if filename is not None else ''
            
            size = root.find('size')
            width = size.find('width').text if size is not None and size.find('width') is not None else '0'
            height = size.find('height').text if size is not None and size.find('height') is not None else '0'
            depth = size.find('depth').text if size is not None and size.find('depth') is not None else '0'
            
            # Extract objects
            objects = []
            for obj in root.findall('object'):
                obj_data = {}
                
                # Basic object info
                name = obj.find('name')
                obj_data['name'] = name.text if name is not None else 'unknown'
                
                # Bounding box
                bndbox = obj.find('bndbox')
                if bndbox is not None:
                    obj_data['bndbox'] = {
                        'xmin': int(bndbox.find('xmin').text) if bndbox.find('xmin') is not None else 0,
                        'ymin': int(bndbox.find('ymin').text) if bndbox.find('ymin') is not None else 0,
                        'xmax': int(bndbox.find('xmax').text) if bndbox.find('xmax') is not None else 0,
                        'ymax': int(bndbox.find('ymax').text) if bndbox.find('ymax') is not None else 0
                    }
                
                # Custom attributes
                if self.current_config:
                    for attr in self.current_config.get('attributes', []):
                        attr_elem = obj.find(attr['name'])
                        if attr_elem is not None:
                            obj_data[attr['name']] = attr_elem.text
                
                objects.append(obj_data)
            
            return {
                'filename': filename,
                'size': {'width': width, 'height': height, 'depth': depth},
                'objects': objects,
                'raw_xml': ET.tostring(root, encoding='unicode')
            }
            
        except Exception as e:
            logger.error(f"Error reading XML file {xml_path}: {e}")
            return None
    
    def read_json_file(self, json_path):
        """Read and parse JSON file (LabelMe format)"""
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Extract basic information
            image_path = data.get('imagePath', '')
            image_width = data.get('imageWidth', 0)
            image_height = data.get('imageHeight', 0)
            
            # Extract shapes (segmentation polygons)
            shapes = []
            for shape in data.get('shapes', []):
                shape_data = {
                    'label': shape.get('label', 'unknown'),
                    'shape_type': shape.get('shape_type', 'polygon'),
                    'points': shape.get('points', []),
                    'group_id': shape.get('group_id', None),
                    'flags': shape.get('flags', {})
                }
                shapes.append(shape_data)
            
            return {
                'imagePath': image_path,
                'imageWidth': image_width,
                'imageHeight': image_height,
                'shapes': shapes,
                'version': data.get('version', ''),
                'flags': data.get('flags', {}),
                'raw_json': data
            }
            
        except Exception as e:
            logger.error(f"Error reading JSON file {json_path}: {e}")
            return None
    
    def write_xml_file(self, xml_path, xml_data):
        """Write XML data to file"""
        try:
            # Parse the XML data
            root = ET.fromstring(xml_data)
            
            # Create tree and write to file
            tree = ET.ElementTree(root)
            ET.indent(tree, space="  ", level=0)  # Pretty formatting
            tree.write(xml_path, encoding='utf-8', xml_declaration=True)
            
            return True
        except Exception as e:
            logger.error(f"Error writing XML file {xml_path}: {e}")
            return False
    
    def write_json_file(self, json_path, json_data):
        """Write JSON data to file (LabelMe format)"""
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            logger.error(f"Error writing JSON file {json_path}: {e}")
            return False
    
    def update_xml_attributes(self, xml_path, object_index, attributes):
        """Update custom attributes in XML file"""
        try:
            # Check if file exists and is not empty
            if not os.path.exists(xml_path) or os.path.getsize(xml_path) == 0:
                logger.warning(f"XML file is empty or doesn't exist: {xml_path}")
                return False
                
            tree = ET.parse(xml_path)
            root = tree.getroot()
            
            objects = root.findall('object')
            if object_index < len(objects):
                obj = objects[object_index]
                
                # Update each attribute
                for attr_name, attr_value in attributes.items():
                    # Find existing element or create new one
                    attr_elem = obj.find(attr_name)
                    if attr_elem is None:
                        attr_elem = ET.SubElement(obj, attr_name)
                    attr_elem.text = str(attr_value)
                
                # Write back to file
                ET.indent(tree, space="  ", level=0)
                tree.write(xml_path, encoding='utf-8', xml_declaration=True)
                return True
            else:
                logger.error(f"Object index {object_index} out of range")
                return False
                
        except Exception as e:
            logger.error(f"Error updating XML attributes: {e}")
            return False

# Initialize backend
backend = SmartQCBackend()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Smart QC Backend is running'})

@app.route('/api/load-folders', methods=['POST'])
def load_folders():
    """Load image and XML folders"""
    data = request.json
    image_folder = data.get('image_folder')
    xml_folder = data.get('xml_folder')
    
    if not image_folder or not os.path.exists(image_folder):
        return jsonify({'error': 'Invalid image folder'}), 400
    
    if not xml_folder or not os.path.exists(xml_folder):
        return jsonify({'error': 'Invalid XML folder'}), 400
    
    backend.image_folder = image_folder
    backend.xml_folder = xml_folder
    
    # Get file lists
    images = backend.get_image_list(image_folder)
    xml_files = backend.get_xml_list(xml_folder)
    
    return jsonify({
        'images': images,
        'xml_files': xml_files,
        'image_count': len(images),
        'xml_count': len(xml_files)
    })

@app.route('/api/set-folders', methods=['POST'])
def set_folders():
    """Set image and XML folder paths"""
    data = request.json
    image_folder = data.get('image_folder')
    xml_folder = data.get('xml_folder')
    
    if image_folder and os.path.exists(image_folder):
        backend.image_folder = image_folder
        logger.info(f"Image folder set to: {image_folder}")
    
    if xml_folder and os.path.exists(xml_folder):
        backend.xml_folder = xml_folder
        logger.info(f"XML folder set to: {xml_folder}")
    
    return jsonify({
        'success': True,
        'image_folder': backend.image_folder,
        'xml_folder': backend.xml_folder
    })

@app.route('/api/get-images')
def get_images():
    """Get list of images from folder"""
    folder = request.args.get('folder')
    if not folder:
        folder = backend.image_folder
    
    if not folder or not os.path.exists(folder):
        return jsonify({'error': 'Folder not found'}), 404
    
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.tif'}
    images = []
    
    try:
        for filename in os.listdir(folder):
            if any(filename.lower().endswith(ext) for ext in image_extensions):
                images.append(filename)
        return jsonify({'images': sorted(images)})
    except Exception as e:
        logger.error(f"Error reading images folder: {e}")
        return jsonify({'error': 'Failed to read folder'}), 500

@app.route('/api/get-xmls')
def get_xmls():
    """Get list of XML files from folder"""
    folder = request.args.get('folder')
    if not folder:
        folder = backend.xml_folder
    
    if not folder or not os.path.exists(folder):
        return jsonify({'error': 'Folder not found'}), 404
    
    xmls = []
    try:
        for filename in os.listdir(folder):
            if filename.lower().endswith('.xml'):
                xmls.append(filename)
        return jsonify({'xmls': sorted(xmls)})
    except Exception as e:
        logger.error(f"Error reading XML folder: {e}")
        return jsonify({'error': 'Failed to read folder'}), 500

@app.route('/api/get-jsons')
def get_jsons():
    """Get list of JSON files from folder"""
    folder = request.args.get('folder')
    if not folder:
        folder = backend.xml_folder  # Use same folder structure for now
    
    if not folder or not os.path.exists(folder):
        return jsonify({'error': 'Folder not found'}), 404
    
    jsons = []
    try:
        for filename in os.listdir(folder):
            if filename.lower().endswith('.json'):
                jsons.append(filename)
        return jsonify({'jsons': sorted(jsons)})
    except Exception as e:
        logger.error(f"Error reading JSON folder: {e}")
        return jsonify({'error': 'Failed to read folder'}), 500

@app.route('/api/load-config', methods=['POST'])
def load_config():
    """Load configuration file"""
    data = request.json
    config_path = data.get('config_path')
    
    if config_path and os.path.exists(config_path):
        if backend.load_config(config_path):
            return jsonify({
                'success': True,
                'config': backend.current_config
            })
        else:
            return jsonify({'error': 'Failed to load config file'}), 500
    else:
        return jsonify({'error': 'Config file not found'}), 404

@app.route('/api/set-config', methods=['POST'])
def set_config():
    """Set configuration directly"""
    data = request.json
    backend.current_config = data
    return jsonify({'success': True})

@app.route('/api/get-xml/<filename>')
def get_xml(filename):
    """Get XML data for specific image"""
    if not backend.xml_folder:
        return jsonify({'error': 'XML folder not set'}), 400
    
    # Find XML file with same basename as image
    image_basename = os.path.splitext(filename)[0]
    xml_path = os.path.join(backend.xml_folder, f"{image_basename}.xml")
    
    if os.path.exists(xml_path):
        xml_data = backend.read_xml_file(xml_path)
        if xml_data:
            return jsonify(xml_data)
        else:
            return jsonify({'error': 'Failed to read XML file'}), 500
    else:
        return jsonify({'error': 'XML file not found'}), 404

@app.route('/api/get-json/<filename>')
def get_json(filename):
    """Get JSON data for specific image"""
    if not backend.xml_folder:  # Use same folder structure for now
        return jsonify({'error': 'JSON folder not set'}), 400
    
    # Find JSON file with same basename as image
    image_basename = os.path.splitext(filename)[0]
    json_path = os.path.join(backend.xml_folder, f"{image_basename}.json")
    
    if os.path.exists(json_path):
        json_data = backend.read_json_file(json_path)
        if json_data:
            return jsonify(json_data)
        else:
            return jsonify({'error': 'Failed to read JSON file'}), 500
    else:
        return jsonify({'error': 'JSON file not found'}), 404

@app.route('/api/xml/<filename>')
def get_raw_xml(filename):
    """Get raw XML content for specific image"""
    if not backend.xml_folder:
        return "XML folder not set", 400
    
    # Find XML file with same basename as image
    image_basename = os.path.splitext(filename)[0]
    xml_path = os.path.join(backend.xml_folder, f"{image_basename}.xml")
    
    if os.path.exists(xml_path):
        try:
            with open(xml_path, 'r', encoding='utf-8') as file:
                xml_content = file.read()
            return xml_content, 200, {'Content-Type': 'application/xml'}
        except Exception as e:
            logger.error(f"Error reading XML file: {e}")
            return f"Error reading XML file: {e}", 500
    else:
        return "XML file not found", 404

@app.route('/api/json/<filename>')
def get_raw_json(filename):
    """Get raw JSON content for specific image"""
    if not backend.xml_folder:  # Use same folder structure for now
        return "JSON folder not set", 400
    
    # Find JSON file with same basename as image
    image_basename = os.path.splitext(filename)[0]
    json_path = os.path.join(backend.xml_folder, f"{image_basename}.json")
    
    if os.path.exists(json_path):
        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                json_content = file.read()
            return json_content, 200, {'Content-Type': 'application/json'}
        except Exception as e:
            logger.error(f"Error reading JSON file: {e}")
            return f"Error reading JSON file: {e}", 500
    else:
        return "JSON file not found", 404

@app.route('/api/save-xml', methods=['POST'])
def save_xml():
    """Save XML data"""
    data = request.json
    filename = data.get('filename')
    xml_content = data.get('xml_content')
    
    if not backend.xml_folder or not filename or not xml_content:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Find XML file path
    image_basename = os.path.splitext(filename)[0]
    xml_path = os.path.join(backend.xml_folder, f"{image_basename}.xml")
    
    if backend.write_xml_file(xml_path, xml_content):
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to save XML file'}), 500

@app.route('/api/save-json', methods=['POST'])
def save_json():
    """Save JSON data"""
    data = request.json
    filename = data.get('filename')
    json_content = data.get('json_content')
    
    if not backend.xml_folder or not filename or not json_content:  # Use same folder structure for now
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Find JSON file path
    image_basename = os.path.splitext(filename)[0]
    json_path = os.path.join(backend.xml_folder, f"{image_basename}.json")
    
    if backend.write_json_file(json_path, json_content):
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Failed to save JSON file'}), 500

@app.route('/api/update-attributes', methods=['POST'])
def update_attributes():
    """Update custom attributes in XML"""
    data = request.json
    filename = data.get('filename')
    object_index = data.get('object_index', 0)
    attributes = data.get('attributes', {})
    
    if not backend.xml_folder or not filename:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Find XML file path
    image_basename = os.path.splitext(filename)[0]
    xml_path = os.path.join(backend.xml_folder, f"{image_basename}.xml")
    
    if os.path.exists(xml_path):
        if backend.update_xml_attributes(xml_path, object_index, attributes):
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Failed to update attributes'}), 500
    else:
        return jsonify({'error': 'XML file not found'}), 404

@app.route('/api/images/<path:filename>')
def serve_image(filename):
    """Serve image files"""
    if backend.image_folder:
        return send_from_directory(backend.image_folder, filename)
    else:
        return jsonify({'error': 'Image folder not set'}), 400

@app.route('/api/get-class-names', methods=['GET'])
def get_class_names():
    """Get all existing class names from XML files in the folder"""
    if not backend.xml_folder:
        return jsonify({'error': 'XML folder not set'}), 400
    
    class_names = set()
    
    try:
        # Read all XML files in the folder
        for file_path in Path(backend.xml_folder).iterdir():
            if file_path.suffix.lower() == '.xml':
                try:
                    # Check if file is empty
                    if file_path.stat().st_size == 0:
                        logger.info(f"Skipping empty XML file: {file_path}")
                        continue
                        
                    tree = ET.parse(file_path)
                    root = tree.getroot()
                    
                    # Extract class names from object elements
                    for obj in root.findall('object'):
                        name_elem = obj.find('name')
                        if name_elem is not None and name_elem.text:
                            class_names.add(name_elem.text.strip())
                            
                except ET.ParseError as e:
                    logger.warning(f"Error parsing XML file {file_path}: {e}")
                    continue
                except Exception as e:
                    logger.warning(f"Error reading XML file {file_path}: {e}")
                    continue
        
        # Also check for classes.txt file
        classes_file = Path(backend.xml_folder) / 'classes.txt'
        if classes_file.exists():
            try:
                with open(classes_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            class_names.add(line)
            except Exception as e:
                logger.warning(f"Error reading classes.txt: {e}")
        
        return jsonify({'class_names': sorted(list(class_names))})
        
    except Exception as e:
        logger.error(f"Error getting class names: {e}")
        return jsonify({'error': 'Failed to get class names'}), 500

@app.route('/api/export-report', methods=['POST'])
def export_report():
    """Export QC report"""
    data = request.json
    format_type = data.get('format', 'json')
    
    if not backend.xml_folder:
        return jsonify({'error': 'XML folder not set'}), 400
    
    # Collect all XML data
    xml_files = backend.get_xml_list(backend.xml_folder)
    report_data = []
    
    for xml_file in xml_files:
        xml_data = backend.read_xml_file(xml_file['path'])
        if xml_data:
            report_data.append({
                'filename': xml_file['name'],
                'image_filename': xml_data['filename'],
                'object_count': len(xml_data['objects']),
                'objects': xml_data['objects']
            })
    
    if format_type == 'json':
        return jsonify({
            'report': report_data,
            'summary': {
                'total_files': len(report_data),
                'total_objects': sum(len(item['objects']) for item in report_data)
            }
        })
    else:
        # Could add CSV, Excel export here
        return jsonify({'error': 'Unsupported format'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

