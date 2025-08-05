import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  overflow: hidden;
  cursor: ${props => 
    props.isDraggingCanvas ? 'grabbing' : 
    props.zoomed ? 'grab' : 
    'default'
  };
  
  &:active {
    cursor: ${props => 
      props.isDraggingCanvas ? 'grabbing' : 
      props.zoomed ? 'grabbing' : 
      'default'
    };
  }
`;

const ImageContainer = styled.div`
  position: relative;
  transform-origin: center;
  transition: transform 0.1s ease-out;
  min-width: fit-content;
  min-height: fit-content;
  transform: translate(${props => props.offsetX || 0}px, ${props => props.offsetY || 0}px);
`;

const ImageElement = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
  transform: scale(${props => props.scale || 1});
  transform-origin: center;
  transition: transform 0.1s ease-out;
`;

const EditableBoundingBox = styled.div`
  position: absolute;
  border: 3px solid ${props => props.isSelected ? '#ff3333' : '#ff6b35'};
  background: ${props => props.isSelected ? 'rgba(255, 51, 51, 0.15)' : 'rgba(255, 107, 53, 0.1)'};
  cursor: ${props => props.isResizing ? (props.resizeHandle || 'move') : 'move'};
  z-index: ${props => props.isSelected ? 15 : 10};
  box-shadow: ${props => props.isSelected ? '0 0 0 1px white, 0 0 8px rgba(255, 51, 51, 0.5)' : 'none'};
  pointer-events: all;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  
  &:hover {
    border-color: #ff3333;
    background: rgba(255, 51, 51, 0.15);
    z-index: 12;
  }
`;

const ObjectLabel = styled.div`
  position: absolute;
  background: ${props => props.isSelected ? '#ff3333' : '#ff6b35'};
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 11;
  top: ${props => props.isNearTop ? '100%' : '-28px'}; /* Move below box if near top */
  left: 0;
  min-width: 40px;
  text-align: center;
  user-select: none;
`;

const ResizeHandle = styled.div`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${props => props.isSelected ? '#ff3333' : '#ff6b35'};
  border: 2px solid white;
  border-radius: 3px;
  z-index: 20;
  pointer-events: all;
  
  &.nw { top: -6px; left: -6px; cursor: nw-resize; }
  &.ne { top: -6px; right: -6px; cursor: ne-resize; }
  &.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
  &.se { bottom: -6px; right: -6px; cursor: se-resize; }
  &.n { top: -6px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  &.s { bottom: -6px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  &.w { top: 50%; left: -6px; transform: translateY(-50%); cursor: w-resize; }
  &.e { top: 50%; right: -6px; transform: translateY(-50%); cursor: e-resize; }
`;

const PolygonOverlay = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: all;
  z-index: 10;
  width: 100%;
  height: 100%;
`;

const EditablePolygonLabel = styled.div`
  position: absolute;
  background: ${props => props.isSelected ? '#33ff33' : '#35ff6b'};
  color: white;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 11;
  min-width: 40px;
  text-align: center;
  user-select: none;
  pointer-events: all;
  cursor: move;
`;

const SaveIndicator = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background: ${props => props.saving ? '#ffa500' : '#28a745'};
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 20;
  transition: all 0.3s ease;
  opacity: ${props => props.show ? 0.8 : 0};
  pointer-events: none;
`;

const ZoomIndicator = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 20;
  font-weight: 600;
  opacity: ${props => props.show ? 0.8 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const ImageInfoContainer = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 200px;
  z-index: 30;
`;

const InfoSection = styled.div``;

const InfoItem = styled.div`
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
`;

const LabelDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 100;
  min-width: 320px;
`;

const LabelDialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 99;
`;

const LabelInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  margin: 12px 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const DialogButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const DialogButton = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
  }
  
  &.secondary {
    background: rgba(108, 117, 125, 0.1);
    color: #6c757d;
    border: 1px solid rgba(108, 117, 125, 0.2);
    
    &:hover {
      background: rgba(108, 117, 125, 0.2);
      transform: translateY(-1px);
    }
  }
`;

const StatusBadge = styled.span`
  background: ${props => props.available ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'};
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 600;
`;

const InteractiveImageCanvas = ({ currentImage, xmlData, qcType, onXmlUpdate, selectedConfig, onMouseMove, onSelectedObjectChange, selectedObjectId, selectionSource }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, visibleWidth: 0, visibleHeight: 0, paddingX: 0, paddingY: 0, objectFit: 'contain' });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [polygons, setPolygons] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedPolygon, setSelectedPolygon] = useState(null);
  const [selectedPolygonPoint, setSelectedPolygonPoint] = useState(null); // Track which point is being edited
  const [previewPolygonPoint, setPreviewPolygonPoint] = useState(null); // Store preview position during drag
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingPolygonPoint, setIsDraggingPolygonPoint] = useState(false); // Track polygon point dragging
  const [isDraggingPolygon, setIsDraggingPolygon] = useState(false); // Track whole polygon dragging
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saveStatus, setSaveStatus] = useState({ saving: false, show: false });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modifiedBoxes, setModifiedBoxes] = useState(new Set()); // Track which boxes have been modified
  const [modifiedPolygons, setModifiedPolygons] = useState(new Set()); // Track which polygons have been modified
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 }); // Track mouse position for magnifier
  
  // Creation modes and states
  const [isCreatingBox, setIsCreatingBox] = useState(false); // BB QC box creation mode
  const [isCreatingPolygon, setIsCreatingPolygon] = useState(false); // Seg QC polygon creation mode
  const [creationStart, setCreationStart] = useState(null); // Start point for box creation
  const [previewBox, setPreviewBox] = useState(null); // Preview box during creation
  const [polygonPoints, setPolygonPoints] = useState([]); // Points for polygon creation
  const [showLabelDialog, setShowLabelDialog] = useState(false); // Show label input dialog
  const [pendingAnnotation, setPendingAnnotation] = useState(null); // Pending annotation for labeling
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom functionality
  const [showZoomIndicator, setShowZoomIndicator] = useState(false); // Show zoom level temporarily
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false); // For canvas drag navigation
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 }); // Canvas drag start position
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }); // Image position offset for navigation
  const [xmlPresent, setXmlPresent] = useState(!!xmlData);
  
  // Track mouse position for magnifier
  const handleMousePositionTracking = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newMousePosition = {
        x: e.clientX,
        y: e.clientY
      };
      setMousePosition(newMousePosition);
      
      if (onMouseMove) {
        onMouseMove(newMousePosition);
      }
    }
  };

  // Notify parent about selected object changes
  useEffect(() => {
    let selectedObject = null;
    
    if (selectedBox !== null && boundingBoxes[selectedBox]) {
      selectedObject = boundingBoxes[selectedBox];
    } else if (selectedPolygon !== null && polygons[selectedPolygon]) {
      selectedObject = polygons[selectedPolygon];
    }
    
    if (onSelectedObjectChange) {
      onSelectedObjectChange(selectedObject);
    }
  }, [selectedBox, selectedPolygon, boundingBoxes, polygons, onSelectedObjectChange]);

  // Handle external object selection from AttributePanel
  useEffect(() => {
    if (selectionSource === 'panel' && selectedObjectId !== null && selectedObjectId !== undefined) {
      // Find the object by ID in boundingBoxes or polygons
      const boxIndex = boundingBoxes.findIndex(box => box.id === selectedObjectId);
      const polygonIndex = polygons.findIndex(polygon => polygon.id === selectedObjectId);
      
      if (boxIndex !== -1) {
        setSelectedBox(selectedObjectId);
        setSelectedPolygon(null);
      } else if (polygonIndex !== -1) {
        setSelectedPolygon(selectedObjectId);
        setSelectedBox(null);
      }
    } else if (selectedObjectId === null) {
      // Clear selection if no object is selected externally
      setSelectedBox(null);
      setSelectedPolygon(null);
    }
  }, [selectedObjectId, boundingBoxes, polygons, selectionSource]);

  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const dragDataRef = useRef({});

  useEffect(() => {
    setXmlPresent(!!xmlData);
    if (xmlData && imageSize.width > 0) {
      parseXMLBoundingBoxes();
    }
  }, [xmlData, imageSize]);

  // Add zoom functionality with scroll wheel
  useEffect(() => {
    const handleWheel = (e) => {
      console.log('Wheel event detected:', e);
      
      // Only handle zoom if Ctrl is NOT pressed (to avoid interfering with browser zoom)
      if (e.ctrlKey) {
        console.log('Ctrl key pressed, skipping zoom');
        return;
      }
      
      // Prevent default scrolling behavior
      e.preventDefault();
      e.stopPropagation();
      
      // Calculate zoom delta
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      console.log('Zoom delta:', delta, 'current zoom:', zoomLevel);
      
      setZoomLevel(prevZoom => {
        const newZoom = Math.max(1.0, Math.min(3.0, prevZoom + delta)); // Limited zoom out to 100% (1.0)
        console.log('Zoom level changed from', prevZoom, 'to:', newZoom);
        
        // Reset image offset when zooming back to 100%
        if (newZoom === 1.0) {
          setImageOffset({ x: 0, y: 0 });
        }
        
        // Show zoom indicator temporarily
        setShowZoomIndicator(true);
        setTimeout(() => setShowZoomIndicator(false), 1500);
        
        return newZoom;
      });
    };

    // Add event listener to document instead of container to ensure it captures events
    console.log('Setting up wheel event listener on document');
    document.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      console.log('Removing wheel event listener from document');
      document.removeEventListener('wheel', handleWheel);
    };
  }, []); // Remove zoomLevel dependency to avoid re-adding listeners

  // Reset zoom when image changes
  useEffect(() => {
    setZoomLevel(1);
    setImageOffset({ x: 0, y: 0 });
  }, [currentImage]);

  // Separate save function that accepts the updated boxes directly
  const saveUpdatedXML = useCallback(async (updatedBoxes) => {
    if (!currentImage) return;

    setSaveStatus({ saving: true, show: true });
    
    try {
      let xmlDoc;
      
      if (xmlData) {
        // Parse existing XML
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      } else {
        // Create new XML structure
        xmlDoc = document.implementation.createDocument(null, 'annotation');
        const root = xmlDoc.documentElement;
        
        // Add filename
        const filename = xmlDoc.createElement('filename');
        filename.textContent = currentImage.name;
        root.appendChild(filename);
        
        // Add size
        const size = xmlDoc.createElement('size');
        const width = xmlDoc.createElement('width');
        width.textContent = imageSize.width.toString();
        const height = xmlDoc.createElement('height');
        height.textContent = imageSize.height.toString();
        const depth = xmlDoc.createElement('depth');
        depth.textContent = '3';
        size.appendChild(width);
        size.appendChild(height);
        size.appendChild(depth);
        root.appendChild(size);
      }
      
      console.log('Saving XML with', updatedBoxes.length, 'boxes');
      
      // Clear existing objects and add updated ones
      const existingObjects = xmlDoc.getElementsByTagName('object');
      while (existingObjects.length > 0) {
        existingObjects[0].parentNode.removeChild(existingObjects[0]);
      }
      
      // Add all boxes as objects
      updatedBoxes.forEach((box, index) => {
        const objElement = xmlDoc.createElement('object');
        
        // Add name
        const nameElement = xmlDoc.createElement('name');
        nameElement.textContent = box.name;
        objElement.appendChild(nameElement);
        
        // Add bounding box
        const bndboxElement = xmlDoc.createElement('bndbox');
        const xmin = xmlDoc.createElement('xmin');
        const ymin = xmlDoc.createElement('ymin');
        const xmax = xmlDoc.createElement('xmax');
        const ymax = xmlDoc.createElement('ymax');
        
        xmin.textContent = box.originalCoords.xmin.toString();
        ymin.textContent = box.originalCoords.ymin.toString();
        xmax.textContent = box.originalCoords.xmax.toString();
        ymax.textContent = box.originalCoords.ymax.toString();
        
        bndboxElement.appendChild(xmin);
        bndboxElement.appendChild(ymin);
        bndboxElement.appendChild(xmax);
        bndboxElement.appendChild(ymax);
        objElement.appendChild(bndboxElement);
        
        // Add lat/lng if available
        if (box.latLng && Array.isArray(box.latLng) && box.latLng.length >= 2) {
          const latLngElement = xmlDoc.createElement('latLng');
          latLngElement.textContent = `(${box.latLng[0]}, ${box.latLng[1]})`;
          objElement.appendChild(latLngElement);
        }
        
        xmlDoc.documentElement.appendChild(objElement);
      });

      const serializer = new XMLSerializer();
      const updatedXml = serializer.serializeToString(xmlDoc);
      
      console.log('Sending save request to backend...');
      
      // Save via backend API
      const response = await fetch('http://localhost:5000/api/save-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: currentImage.name,
          xml_content: updatedXml
        })
      });

      if (response.ok) {
        console.log('InteractiveImageCanvas: Successfully saved bounding box changes');
        setHasUnsavedChanges(false);
        setModifiedBoxes(new Set()); // Clear the modified boxes list after successful save
        setSaveStatus({ saving: false, show: true });
        
        // CRITICAL: Update parent component with new XML data
        if (onXmlUpdate) {
          console.log('Updating parent with new XML data');
          onXmlUpdate(updatedXml);
        }
        
      } else {
        const errorText = await response.text();
        console.error('Save failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to save XML: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus({ saving: false, show: true });
    }
    
    // Hide save indicator after 1.5 seconds
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 1500);
  }, [currentImage, xmlData, onXmlUpdate, imageSize]);

  // Save function for JSON data (segmentation)
  const saveUpdatedJSON = useCallback(async (updatedPolygons) => {
    if (!currentImage || qcType !== 'segmentation') return;

    setSaveStatus({ saving: true, show: true });
    
    try {
      let updatedJsonData;
      
      if (xmlData && typeof xmlData === 'object') {
        // Update existing JSON data
        updatedJsonData = JSON.parse(JSON.stringify(xmlData)); // Deep copy
      } else {
        // Create new JSON structure
        updatedJsonData = {
          version: "5.2.1",
          flags: {},
          shapes: [],
          imagePath: currentImage.name,
          imageData: null,
          imageHeight: imageSize.height,
          imageWidth: imageSize.width,
          image_latLng: [0, 0] // Default latlng
        };
      }
      
      console.log('Saving JSON with', updatedPolygons.length, 'polygons');
      
      // Update polygon coordinates in JSON
      updatedJsonData.shapes = updatedPolygons.map(polygon => {
        // Find existing shape to preserve additional fields
        const existingShape = xmlData?.shapes?.find(shape => shape.label === polygon.name) || {};
        
        return {
          label: polygon.name,
          shape_type: 'polygon',
          points: polygon.points.map(point => [point.originalX, point.originalY]),
          group_id: existingShape.group_id || null,
          flags: existingShape.flags || {},
          description: existingShape.description || "",
          LatLng: existingShape.LatLng || (xmlData?.image_latLng || [0, 0]),
          mask: existingShape.mask || null
        };
      });
      
      console.log('Sending JSON save request to backend...');
      
      // Save via backend API
      const response = await fetch('http://localhost:5000/api/save-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: currentImage.name,
          json_content: updatedJsonData
        })
      });

      if (response.ok) {
        console.log('InteractiveImageCanvas: Successfully saved polygon changes');
        setHasUnsavedChanges(false);
        setModifiedPolygons(new Set()); // Clear the modified polygons list after successful save
        setSaveStatus({ saving: false, show: true });
        
        // Update parent component with new JSON data
        if (onXmlUpdate) {
          console.log('Updating parent with new JSON data');
          onXmlUpdate(updatedJsonData);
        }
        
      } else {
        const errorText = await response.text();
        console.error('JSON save failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to save JSON: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving JSON changes:', error);
      setSaveStatus({ saving: false, show: true });
    }
    
    // Hide save indicator after 1.5 seconds
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 1500);
  }, [currentImage, xmlData, qcType, onXmlUpdate, imageSize]);

  // Auto-save when switching images - use the new save system
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) {
        if (qcType === 'segmentation' && modifiedPolygons.size > 0) {
          // Save polygons for segmentation
          saveUpdatedJSON(polygons);
        } else if (qcType === 'detection' && modifiedBoxes.size > 0) {
          // Calculate final coordinates for all modified boxes before switching images
          setBoundingBoxes(prev => {
            const updatedBoxes = prev.map(box => {
              if (modifiedBoxes.has(box.id)) {
                const xmin = Math.round((box.x / displaySize.width) * imageSize.width);
                const ymin = Math.round((box.y / displaySize.height) * imageSize.height);
                const xmax = Math.round(((box.x + box.width) / displaySize.width) * imageSize.width);
                const ymax = Math.round(((box.y + box.height) / displaySize.height) * imageSize.height);
                
                return {
                  ...box,
                  originalCoords: { xmin, ymin, xmax, ymax }
                };
              }
              return box;
            });
            
            // Save immediately when switching images
            saveUpdatedXML(updatedBoxes);
            return updatedBoxes;
          });
        }
      }
    };
  }, [currentImage, hasUnsavedChanges, modifiedBoxes, modifiedPolygons, qcType, displaySize, imageSize, saveUpdatedXML, saveUpdatedJSON, polygons]);

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const newImageSize = {
      width: img.naturalWidth,
      height: img.naturalHeight
    };

    // Calculate the actual visible image size and object-fit dynamically
    const elementAspectRatio = imgRect.width / imgRect.height;
    const imageAspectRatio = newImageSize.width / newImageSize.height;

    let visibleImageWidth, visibleImageHeight;
    let paddingX, paddingY;
    let objectFit = 'contain';

    // If image is much wider or taller than container, use 'cover' to fill
    if (imageAspectRatio > elementAspectRatio * 1.2) {
      objectFit = 'cover';
    } else if (imageAspectRatio < elementAspectRatio * 0.8) {
      objectFit = 'cover';
    } else {
      objectFit = 'contain';
    }

    if (objectFit === 'contain') {
      if (imageAspectRatio > elementAspectRatio) {
        visibleImageWidth = imgRect.width;
        visibleImageHeight = imgRect.width / imageAspectRatio;
        paddingX = 0;
        paddingY = (imgRect.height - visibleImageHeight) / 2;
      } else {
        visibleImageHeight = imgRect.height;
        visibleImageWidth = imgRect.height * imageAspectRatio;
        paddingX = (imgRect.width - visibleImageWidth) / 2;
        paddingY = 0;
      }
    } else if (objectFit === 'cover') {
      // Fill the container, crop excess
      visibleImageWidth = imgRect.width;
      visibleImageHeight = imgRect.height;
      paddingX = 0;
      paddingY = 0;
    }

    const newDisplaySize = {
      width: imgRect.width,
      height: imgRect.height,
      offsetX: imgRect.left - containerRect.left,
      offsetY: imgRect.top - containerRect.top,
      visibleWidth: visibleImageWidth,
      visibleHeight: visibleImageHeight,
      paddingX: paddingX,
      paddingY: paddingY,
      objectFit: objectFit
    };

    setImageSize(newImageSize);
    setDisplaySize(newDisplaySize);
    }
  };

  const parseXMLBoundingBoxes = () => {
    if (!xmlData) {
      console.log('InteractiveImageCanvas: No annotation data available');
      setBoundingBoxes([]);
      setPolygons([]);
      return;
    }

    console.log('InteractiveImageCanvas: Parsing annotation data for interactive editing, QC Type:', qcType);

    try {
      if (qcType === 'segmentation') {
        // JSON format - LabelMe segmentation data
        if (typeof xmlData === 'object') {
          // Data is already parsed as JSON object
          parseJSONSegmentation(xmlData);
        } else {
          // Data is still a string, parse it
          const jsonData = JSON.parse(xmlData);
          parseJSONSegmentation(jsonData);
        }
      } else {
        // XML format - detection data
        parseXMLDetection(xmlData);
      }
    } catch (error) {
      console.error('Error parsing annotation data:', error);
      setBoundingBoxes([]);
      setPolygons([]);
    }
  };

  const parseJSONSegmentation = (jsonData) => {
    try {
      // Handle both string and object inputs
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      console.log('InteractiveImageCanvas: Parsing LabelMe JSON data:', data);
      
      const polygonShapes = [];
      
      if (data.shapes && Array.isArray(data.shapes)) {
        data.shapes.forEach((shape, index) => {
          if (shape.shape_type === 'polygon' && shape.points && Array.isArray(shape.points)) {
            console.log('InteractiveImageCanvas: Processing polygon shape:', shape);
            
            const relativePoints = shape.points.map(point => ({
              x: (point[0] / imageSize.width) * displaySize.width,
              y: (point[1] / imageSize.height) * displaySize.height,
              originalX: point[0],
              originalY: point[1]
            }));
            
            const polygonShape = {
              id: index,
              name: shape.label || `Object ${index}`,
              points: relativePoints,
              originalPoints: shape.points.flat(), // Flatten [[x,y], [x,y]] to [x,y,x,y]
              shapeData: shape,
              element: shape // Store original shape data for editing
            };
            
            console.log('InteractiveImageCanvas: Calculated relative polygon from JSON:', polygonShape);
            polygonShapes.push(polygonShape);
          } else {
            console.warn('InteractiveImageCanvas: Skipping non-polygon shape:', shape);
          }
        });
      }
      
      console.log('InteractiveImageCanvas: Final polygons from JSON:', polygonShapes);
      setBoundingBoxes([]); // No bounding boxes in segmentation mode
      setPolygons(polygonShapes);
      setHasUnsavedChanges(false);
      setModifiedBoxes(new Set()); // Reset modified boxes when parsing new data
      setModifiedPolygons(new Set()); // Reset modified polygons when parsing new data
      
    } catch (error) {
      console.error('Error parsing JSON segmentation data:', error);
      setBoundingBoxes([]);
      setPolygons([]);
    }
  };

  const parseXMLDetection = (xmlData) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML parsing error:', parseError.textContent);
        setBoundingBoxes([]);
        setPolygons([]);
        return;
      }

      const objects = xmlDoc.getElementsByTagName('object');
      console.log('InteractiveImageCanvas: Found', objects.length, 'objects in XML');
      
      const boxes = [];
      const polygonShapes = [];

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const nameElement = obj.getElementsByTagName('name')[0];
        
        if (nameElement) {
          const name = nameElement.textContent;
          
          // Check for bounding box
          const bndboxElement = obj.getElementsByTagName('bndbox')[0];
          if (bndboxElement) {
            const xmin = parseInt(bndboxElement.getElementsByTagName('xmin')[0]?.textContent || 0);
            const ymin = parseInt(bndboxElement.getElementsByTagName('ymin')[0]?.textContent || 0);
            const xmax = parseInt(bndboxElement.getElementsByTagName('xmax')[0]?.textContent || 0);
            const ymax = parseInt(bndboxElement.getElementsByTagName('ymax')[0]?.textContent || 0);
            
            const relativeBox = {
              id: i,
              name: name,
              x: (xmin / imageSize.width) * displaySize.width,
              y: (ymin / imageSize.height) * displaySize.height,
              width: ((xmax - xmin) / imageSize.width) * displaySize.width,
              height: ((ymax - ymin) / imageSize.height) * displaySize.height,
              originalCoords: { xmin, ymin, xmax, ymax },
              element: obj
            };
            
            console.log('Parsed box:', i, 'original coords:', { xmin, ymin, xmax, ymax });
            console.log('Scaled to display coords:', {
              x: (xmin / imageSize.width) * displaySize.width,
              y: (ymin / imageSize.height) * displaySize.height,
              width: ((xmax - xmin) / imageSize.width) * displaySize.width,
              height: ((ymax - ymin) / imageSize.height) * displaySize.height
            });
            console.log('Image size:', imageSize, 'Display size:', displaySize);
            
            boxes.push(relativeBox);
          }
          
          // Check for polygon/segmentation
          const polygonElement = obj.getElementsByTagName('polygon')[0] || obj.getElementsByTagName('segmentation')[0];
          if (polygonElement) {
            const pointsText = polygonElement.textContent || polygonElement.getAttribute('points') || '';
            console.log('InteractiveImageCanvas: Polygon object', i, ':', { name, pointsText });
            
            if (pointsText.trim()) {
              // Parse points - handle both "x1,y1,x2,y2..." and "x1,y1 x2,y2..." formats
              const points = pointsText.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
              
              if (points.length >= 6 && points.length % 2 === 0) { // At least 3 points (x,y pairs)
                const relativePoints = [];
                for (let j = 0; j < points.length; j += 2) {
                  const x = points[j];
                  const y = points[j + 1];
                  relativePoints.push({
                    x: (x / imageSize.width) * displaySize.width,
                    y: (y / imageSize.height) * displaySize.height,
                    originalX: x,
                    originalY: y
                  });
                }
                
                const polygonShape = {
                  id: i,
                  name: name,
                  points: relativePoints,
                  originalPoints: points,
                  element: obj
                };
                
                console.log('InteractiveImageCanvas: Calculated relative polygon:', polygonShape);
                polygonShapes.push(polygonShape);
              } else {
                console.warn('InteractiveImageCanvas: Invalid polygon points for object', i, '- need at least 3 coordinate pairs');
              }
            }
          }
        }
      }
      
      console.log('InteractiveImageCanvas: Parsed', boxes.length, 'editable bounding boxes');
      console.log('InteractiveImageCanvas: Parsed', polygonShapes.length, 'editable polygons');
      setBoundingBoxes(boxes);
      setPolygons(polygonShapes);
      setHasUnsavedChanges(false);
      setModifiedBoxes(new Set()); // Reset modified boxes when parsing new XML
      setModifiedPolygons(new Set()); // Reset modified polygons when parsing new XML
      
    } catch (error) {
      console.error('Error parsing XML for annotations:', error);
      setBoundingBoxes([]);
      setPolygons([]);
    }
  };

  const handleBoxClick = (boxId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Box clicked:', boxId, 'isDragging:', isDragging, 'isResizing:', isResizing);
    
    // Only select if not currently dragging or resizing
    if (!isDragging && !isResizing) {
      setSelectedBox(boxId);
      setSelectedPolygon(null); // Deselect polygon when selecting box
      console.log('Selected box:', boxId);
    }
  };

  const handlePolygonClick = (polygonId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Polygon clicked:', polygonId);
    
    // Only select if not currently dragging or resizing
    if (!isDragging && !isResizing && !isDraggingPolygonPoint) {
      setSelectedPolygon(polygonId);
      setSelectedBox(null); // Deselect box when selecting polygon
      console.log('Selected polygon:', polygonId);
    }
  };

  const handlePolygonMouseDown = (e, polygonId) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Polygon mouse down for whole polygon dragging:', polygonId);
    
    setSelectedPolygon(polygonId);
    setSelectedBox(null);
    setIsDraggingPolygon(true);
    
    // Store initial mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    
    // Initialize preview position for whole polygon movement (starts at 0,0 delta)
    setPreviewPolygonPoint({ x: 0, y: 0 });
    
    console.log('Starting whole polygon drag from:', { mouseX, mouseY });
  };

  const handlePolygonPointMouseDown = (e, polygonId, pointIndex) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Polygon point mouse down:', polygonId, pointIndex);
    
    // Find the current polygon and point
    const polygon = polygons.find(p => p.id === polygonId);
    if (!polygon || !polygon.points[pointIndex]) return;
    
    const currentPoint = polygon.points[pointIndex];
    
    setSelectedPolygon(polygonId);
    setSelectedPolygonPoint({ polygonId, pointIndex });
    setIsDraggingPolygonPoint(true);
    setSelectedBox(null);
    
    // Store initial mouse position
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setDragStart({ x: mouseX, y: mouseY });
    
    // Set initial preview position to current point position (prevents jumping)
    setPreviewPolygonPoint({ x: currentPoint.x, y: currentPoint.y });
    
    console.log('Starting drag from point:', currentPoint);
  };

  const handleMouseDown = (e, boxId, handle = '') => {
    e.stopPropagation();
    e.preventDefault();
    
    const box = boundingBoxes.find(b => b.id === boxId);
    if (!box) return;

    console.log('Mouse down on box:', boxId, 'handle:', handle);
    
    setSelectedBox(boxId);
    
    // Calculate center offset for zoom
    const scaledDisplayWidth = displaySize.width * zoomLevel;
    const scaledDisplayHeight = displaySize.height * zoomLevel;
    const centerOffsetX = (scaledDisplayWidth - displaySize.width) / 2;
    const centerOffsetY = (scaledDisplayHeight - displaySize.height) / 2;
    
    // Store the interaction type in dragDataRef to avoid closure issues
    dragDataRef.current = {
      originalBox: { ...box },
      startX: e.clientX,
      startY: e.clientY,
      isDragging: !handle, // If no handle, it's a drag operation
      isResizing: !!handle, // If handle exists, it's a resize operation
      resizeHandle: handle || '',
      centerOffsetX,
      centerOffsetY
    };
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setIsDragging(false);
      console.log('Starting resize with handle:', handle);
    } else {
      setIsDragging(true);
      setIsResizing(false);
      setResizeHandle('');
      console.log('Starting drag operation');
    }

    // Prevent event bubbling to avoid multiple selections
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp, { passive: false });
  };

  const handleMouseMove = useCallback((e) => {
    e.preventDefault();
    
    if (!dragDataRef.current.originalBox) {
      console.log('No original box in drag data, returning');
      return;
    }

    // Account for center offset when calculating deltas
    const { centerOffsetX = 0, centerOffsetY = 0 } = dragDataRef.current;
    const deltaX = (e.clientX - dragDataRef.current.startX) / zoomLevel;
    const deltaY = (e.clientY - dragDataRef.current.startY) / zoomLevel;
    const { originalBox, isDragging: dragDataIsDragging, isResizing: dragDataIsResizing, resizeHandle: dragDataResizeHandle } = dragDataRef.current;

    // Throttle updates to reduce jerkiness - only update every 16ms (~60fps)
    const now = Date.now();
    if (dragDataRef.current.lastUpdate && now - dragDataRef.current.lastUpdate < 16) {
      return;
    }
    dragDataRef.current.lastUpdate = now;

    console.log('Mouse move - dragData isDragging:', dragDataIsDragging, 'isResizing:', dragDataIsResizing, 'handle:', dragDataResizeHandle, 'delta:', { deltaX, deltaY });

    // Calculate new position/size but don't update state yet - just store for visual feedback
    let previewBox = null;

    if (dragDataIsDragging && !dragDataIsResizing) {
      // Calculate new position for move operation - use visible image boundary (red box) in image-relative coordinates
      const minX = 0;
      const minY = 0;
      const maxX = (displaySize.visibleWidth || displaySize.width) - originalBox.width;
      const maxY = (displaySize.visibleHeight || displaySize.height) - originalBox.height;

      // Box coordinates are relative to the image area
      const newX = Math.max(minX, Math.min(maxX, originalBox.x + deltaX));
      const newY = Math.max(minY, Math.min(maxY, originalBox.y + deltaY));

      previewBox = { x: newX, y: newY };
      console.log('MOVEMENT: Moving box from', { x: originalBox.x, y: originalBox.y }, 'to:', previewBox);
      console.log('MOVEMENT: Y-axis bounds - min Y:', minY, 'max Y:', maxY);
      console.log('MOVEMENT: X-axis bounds - min X:', minX, 'max X:', maxX);
      console.log('MOVEMENT: Display size:', displaySize);
      console.log('MOVEMENT: Original box dimensions:', { width: originalBox.width, height: originalBox.height });
    } else if (dragDataIsResizing && dragDataResizeHandle && !dragDataIsDragging) {
      // Calculate new dimensions for resize operation
      let newBox = { ...originalBox };
      
      console.log('Resizing with handle:', dragDataResizeHandle, 'delta:', { deltaX, deltaY });
      
      switch (dragDataResizeHandle) {
        case 'nw':
          newBox.x = Math.max(0, originalBox.x + deltaX);
          newBox.y = Math.max(0, originalBox.y + deltaY);
          newBox.width = Math.max(20, originalBox.width - deltaX);
          newBox.height = Math.max(20, originalBox.height - deltaY);
          break;
        case 'ne':
          newBox.y = Math.max(0, originalBox.y + deltaY);
          newBox.width = Math.max(20, originalBox.width + deltaX);
          newBox.height = Math.max(20, originalBox.height - deltaY);
          break;
        case 'sw':
          newBox.x = Math.max(0, originalBox.x + deltaX);
          newBox.width = Math.max(20, originalBox.width - deltaX);
          newBox.height = Math.max(20, originalBox.height + deltaY);
          break;
        case 'se':
          newBox.width = Math.max(20, originalBox.width + deltaX);
          newBox.height = Math.max(20, originalBox.height + deltaY);
          break;
        case 'n':
          newBox.y = Math.max(0, originalBox.y + deltaY);
          newBox.height = Math.max(20, originalBox.height - deltaY);
          break;
        case 's':
          newBox.height = Math.max(20, originalBox.height + deltaY);
          break;
        case 'w':
          newBox.x = Math.max(0, originalBox.x + deltaX);
          newBox.width = Math.max(20, originalBox.width - deltaX);
          break;
        case 'e':
          newBox.width = Math.max(20, originalBox.width + deltaX);
          break;
      }
      
      // Ensure box stays within visible image boundary (red box) in image-relative coordinates
      const minX = 0;
      const minY = 0;
      const maxX = (displaySize.visibleWidth || displaySize.width);
      const maxY = (displaySize.visibleHeight || displaySize.height);

      newBox.x = Math.max(minX, Math.min(maxX - newBox.width, newBox.x));
      newBox.y = Math.max(minY, Math.min(maxY - newBox.height, newBox.y));

      // Also ensure minimum box size constraints
      newBox.width = Math.max(20, Math.min(maxX - newBox.x, newBox.width));
      newBox.height = Math.max(20, Math.min(maxY - newBox.y, newBox.height));

      previewBox = newBox;
      console.log('RESIZE: New box dimensions:', previewBox);
      console.log('RESIZE: Bounds - min:', { x: minX, y: minY }, 'max:', { x: maxX, y: maxY });
    }

    // Store the preview position for visual feedback during drag
    if (previewBox) {
      dragDataRef.current.previewBox = previewBox;
      // Update visual position immediately for smooth dragging feedback
      updateBoundingBoxVisual(selectedBox, previewBox);
    }
  }, [selectedBox, displaySize, zoomLevel]);

  const updateBoundingBox = useCallback((boxId, updates) => {
    setBoundingBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return { ...box, ...updates };
      }
      return box;
    }));
    setHasUnsavedChanges(true);
    
    // Track that this box has been modified
    setModifiedBoxes(prev => new Set([...prev, boxId]));
    console.log('Updated box:', boxId, 'with:', updates);
  }, []);

  // New function for visual updates during dragging (doesn't mark as modified)
  const updateBoundingBoxVisual = useCallback((boxId, updates) => {
    setBoundingBoxes(prev => prev.map(box => {
      if (box.id === boxId) {
        return { ...box, ...updates };
      }
      return box;
    }));
    // Don't set hasUnsavedChanges or add to modifiedBoxes - this is just visual feedback
  }, []);

  const handleMouseUp = useCallback(() => {
    console.log('Mouse up - applying final changes and clearing drag/resize state');
    
    // Apply the final position/size changes when drag is released
    if (dragDataRef.current.previewBox && selectedBox !== null) {
      console.log('Applying final changes for box:', selectedBox, 'with:', dragDataRef.current.previewBox);
      updateBoundingBox(selectedBox, dragDataRef.current.previewBox);
    }
    
    // Calculate final coordinates for ALL modified boxes when interaction is complete
    if (hasUnsavedChanges && modifiedBoxes.size > 0) {
      console.log('Updating final coordinates for modified boxes:', Array.from(modifiedBoxes));
      
      setBoundingBoxes(prev => {
        const updatedBoxes = prev.map(box => {
          // Update coordinates for all modified boxes, not just the selected one
          if (modifiedBoxes.has(box.id)) {
            const xmin = Math.round((box.x / displaySize.width) * imageSize.width);
            const ymin = Math.round((box.y / displaySize.height) * imageSize.height);
            const xmax = Math.round(((box.x + box.width) / displaySize.width) * imageSize.width);
            const ymax = Math.round(((box.y + box.height) / displaySize.height) * imageSize.height);
            
            const updatedBox = {
              ...box,
              originalCoords: { xmin, ymin, xmax, ymax }
            };
            
            console.log('Final coordinates for box', box.id, ':', updatedBox.originalCoords);
            return updatedBox;
          }
          return box;
        });
        
        // Trigger save with ALL updated boxes
        setTimeout(() => {
          console.log('Triggering save with all modified boxes...');
          saveUpdatedXML(updatedBoxes);
        }, 100);
        
        return updatedBoxes;
      });
    }
    
    resetInteractionState();
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [hasUnsavedChanges, modifiedBoxes, handleMouseMove, displaySize, imageSize, selectedBox, updateBoundingBox]);

  const resetInteractionState = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
    dragDataRef.current = {}; // This will clear previewBox as well
    console.log('Reset interaction state');
  };

  // Creation mode functions
  const startCreatingBox = () => {
    if (qcType !== 'detection') return;
    setIsCreatingBox(true);
    setIsCreatingPolygon(false);
    setPolygonPoints([]);
    setPreviewBox(null);
    setSelectedBox(null);
    setSelectedPolygon(null);
    console.log('Started bounding box creation mode');
  };

  const startCreatingPolygon = () => {
    if (qcType !== 'segmentation') return;
    setIsCreatingPolygon(true);
    setIsCreatingBox(false);
    setPolygonPoints([]);
    setPreviewBox(null);
    setSelectedBox(null);
    setSelectedPolygon(null);
    console.log('Started polygon creation mode');
  };

  const cancelCreation = () => {
    setIsCreatingBox(false);
    setIsCreatingPolygon(false);
    setPolygonPoints([]);
    setPreviewBox(null);
    setCreationStart(null);
    console.log('Cancelled creation mode');
  };

  // Delete selected bounding box
  const deleteSelectedBoundingBox = () => {
    if (selectedBox === null) return;
    
    // Find the box by ID
    const boxToDelete = boundingBoxes.find(box => box.id === selectedBox);
    if (!boxToDelete) {
      console.error('Box to delete not found:', selectedBox);
      return;
    }
    
    const updatedBoxes = boundingBoxes.filter(box => box.id !== selectedBox);
    setBoundingBoxes(updatedBoxes);
    setSelectedBox(null);
    setHasUnsavedChanges(true);
    
    console.log('Deleted bounding box with ID:', selectedBox, 'Name:', boxToDelete.name, '- Press Ctrl+S to save');
  };

  // Delete selected polygon
  const deleteSelectedPolygon = () => {
    if (selectedPolygon === null) return;
    
    // Find the polygon by ID
    const polygonToDelete = polygons.find(polygon => polygon.id === selectedPolygon);
    if (!polygonToDelete) {
      console.error('Polygon to delete not found:', selectedPolygon);
      return;
    }
    
    const updatedPolygons = polygons.filter(polygon => polygon.id !== selectedPolygon);
    setPolygons(updatedPolygons);
    setSelectedPolygon(null);
    setHasUnsavedChanges(true);
    
    console.log('Deleted polygon with ID:', selectedPolygon, 'Name:', polygonToDelete.name, '- Press Ctrl+S to save');
  };

  // Remove point from selected polygon
  const removePolygonPoint = (pointIndex) => {
    if (selectedPolygon === null || !polygons[selectedPolygon]) return;
    
    const polygon = polygons[selectedPolygon];
    if (polygon.points.length <= 3) {
      console.log('Cannot remove point: polygon must have at least 3 points');
      return;
    }
    
    const updatedPolygons = [...polygons];
    updatedPolygons[selectedPolygon] = {
      ...polygon,
      points: polygon.points.filter((_, index) => index !== pointIndex)
    };
    setPolygons(updatedPolygons);
    
    // Update JSON data
    if (xmlData && xmlData.shapes) {
      const updatedJsonData = { ...xmlData };
      if (updatedJsonData.shapes[selectedPolygon]) {
        updatedJsonData.shapes[selectedPolygon].points = updatedPolygons[selectedPolygon].points;
        saveUpdatedJSON(updatedJsonData);
      }
    }
    
    console.log('Removed point', pointIndex, 'from polygon', selectedPolygon);
  };

  // Track backspace key state
  const [isBackspacePressed, setIsBackspacePressed] = useState(false);

  // Add keydown/keyup listeners for backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Backspace' && selectedPolygon !== null) {
        setIsBackspacePressed(true);
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'Backspace') {
        setIsBackspacePressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedPolygon]);

  // Handle creation mouse events
  const handleCreationMouseDown = (e) => {
    if (!isCreatingBox && !isCreatingPolygon) return;
    if (showLabelDialog) return; // Block creation when dialog is open
    
    e.stopPropagation();
    e.preventDefault();
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to image coordinates with proper offset calculation
    const scaledDisplayWidth = displaySize.width * zoomLevel;
    const scaledDisplayHeight = displaySize.height * zoomLevel;
    const centerOffsetX = (scaledDisplayWidth - displaySize.width) / 2;
    const centerOffsetY = (scaledDisplayHeight - displaySize.height) / 2;
    
    // More accurate coordinate conversion
    const imageX = (mouseX - (displaySize.paddingX || 0) + centerOffsetX - imageOffset.x) / zoomLevel;
    const imageY = (mouseY - (displaySize.paddingY || 0) + centerOffsetY - imageOffset.y) / zoomLevel;
    
    // Ensure coordinates are within image bounds
    const boundedX = Math.max(0, Math.min(displaySize.visibleWidth || displaySize.width, imageX));
    const boundedY = Math.max(0, Math.min(displaySize.visibleHeight || displaySize.height, imageY));
    
    if (isCreatingBox) {
      setCreationStart({ x: boundedX, y: boundedY });
      console.log('Started box creation at:', { x: boundedX, y: boundedY });
    } else if (isCreatingPolygon) {
      const newPoints = [...polygonPoints, { x: boundedX, y: boundedY }];
      setPolygonPoints(newPoints);
      console.log('Added polygon point:', { x: boundedX, y: boundedY }, 'Total points:', newPoints.length);
    }
  };

  const handleCreationMouseMove = (e) => {
    if (!isCreatingBox || !creationStart) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convert to image coordinates
    const scaledDisplayWidth = displaySize.width * zoomLevel;
    const scaledDisplayHeight = displaySize.height * zoomLevel;
    const centerOffsetX = (scaledDisplayWidth - displaySize.width) / 2;
    const centerOffsetY = (scaledDisplayHeight - displaySize.height) / 2;
    
    const imageX = (mouseX - (displaySize.paddingX || 0) + centerOffsetX - imageOffset.x) / zoomLevel;
    const imageY = (mouseY - (displaySize.paddingY || 0) + centerOffsetY - imageOffset.y) / zoomLevel;
    
    // Ensure coordinates are within image bounds
    const boundedX = Math.max(0, Math.min(displaySize.visibleWidth || displaySize.width, imageX));
    const boundedY = Math.max(0, Math.min(displaySize.visibleHeight || displaySize.height, imageY));
    
    // Create preview box
    const minX = Math.min(creationStart.x, boundedX);
    const minY = Math.min(creationStart.y, boundedY);
    const maxX = Math.max(creationStart.x, boundedX);
    const maxY = Math.max(creationStart.y, boundedY);
    
    setPreviewBox({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    });
  };

  const handleCreationMouseUp = (e) => {
    if (isCreatingBox && creationStart && previewBox) {
      // Only create box if it has minimum size
      if (previewBox.width > 10 && previewBox.height > 10) {
        const newAnnotation = {
          type: 'box',
          x: previewBox.x,
          y: previewBox.y,
          width: previewBox.width,
          height: previewBox.height
        };
        setPendingAnnotation(newAnnotation);
        setShowLabelDialog(true);
      }
      setCreationStart(null);
      setPreviewBox(null);
    }
  };

  const handlePolygonDoubleClick = (e) => {
    if (isCreatingPolygon && polygonPoints.length >= 3 && !showLabelDialog) {
      e.stopPropagation();
      e.preventDefault();
      
      // Close polygon and show label dialog
      const newAnnotation = {
        type: 'polygon',
        points: polygonPoints
      };
      setPendingAnnotation(newAnnotation);
      setShowLabelDialog(true);
      
      // Immediately stop creation mode to prevent additional points
      setIsCreatingPolygon(false);
      setPolygonPoints([]);
    }
  };

  const handleLabelSubmit = (label) => {
    if (!pendingAnnotation || !label || !label.trim()) {
      console.error('Invalid label or pending annotation');
      return;
    }
    
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0) {
      console.error('Label cannot be empty');
      return;
    }
    
    // Extract lat/lng from image data or use default
    const getImageLatLng = () => {
      if (xmlData) {
        if (qcType === 'segmentation' && xmlData.image_latLng) {
          return xmlData.image_latLng;
        } else if (qcType === 'detection') {
          // For XML, try to extract from annotation element
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
            const imgLatLngElement = xmlDoc.getElementsByTagName('Img_latLng')[0];
            if (imgLatLngElement) {
              const latLngText = imgLatLngElement.textContent;
              const match = latLngText.match(/\((.*?),\s*(.*?)\)/);
              if (match) {
                return [parseFloat(match[1]), parseFloat(match[2])];
              }
            }
          } catch (error) {
            console.warn('Error extracting lat/lng from XML:', error);
          }
        }
      }
      return [0, 0]; // Default lat/lng
    };
    
    if (pendingAnnotation.type === 'box') {
      // Create new bounding box
      const newBox = {
        id: boundingBoxes.length,
        name: trimmedLabel,
        x: pendingAnnotation.x,
        y: pendingAnnotation.y,
        width: pendingAnnotation.width,
        height: pendingAnnotation.height,
        originalCoords: {
          xmin: Math.round((pendingAnnotation.x / (displaySize.visibleWidth || displaySize.width)) * imageSize.width),
          ymin: Math.round((pendingAnnotation.y / (displaySize.visibleHeight || displaySize.height)) * imageSize.height),
          xmax: Math.round(((pendingAnnotation.x + pendingAnnotation.width) / (displaySize.visibleWidth || displaySize.width)) * imageSize.width),
          ymax: Math.round(((pendingAnnotation.y + pendingAnnotation.height) / (displaySize.visibleHeight || displaySize.height)) * imageSize.height)
        },
        latLng: getImageLatLng() // Add lat/lng from image data
      };
      
      const updatedBoxes = [...boundingBoxes, newBox];
      setBoundingBoxes(updatedBoxes);
      setHasUnsavedChanges(true);
      setModifiedBoxes(prev => new Set([...prev, newBox.id]));
      
      console.log('Created new bounding box:', newBox, '- Press Ctrl+S to save');
      
    } else if (pendingAnnotation.type === 'polygon') {
      // Create new polygon
      const newPolygon = {
        id: polygons.length,
        name: trimmedLabel,
        points: pendingAnnotation.points.map(point => ({
          x: point.x,
          y: point.y,
          originalX: (point.x / (displaySize.visibleWidth || displaySize.width)) * imageSize.width,
          originalY: (point.y / (displaySize.visibleHeight || displaySize.height)) * imageSize.height
        })),
        LatLng: getImageLatLng() // Add lat/lng from image data
      };
      
      const updatedPolygons = [...polygons, newPolygon];
      setPolygons(updatedPolygons);
      setHasUnsavedChanges(true);
      setModifiedPolygons(prev => new Set([...prev, newPolygon.id]));
      
      console.log('Created new polygon:', newPolygon, '- Press Ctrl+S to save');
    }
    
    // Clean up
    setShowLabelDialog(false);
    setPendingAnnotation(null);
    setIsCreatingBox(false);
    setIsCreatingPolygon(false);
  };

  // Get unique labels from existing annotations in the folder
  const getExistingLabels = useCallback(async () => {
    const labels = new Set();
    
    // Add labels from current file
    if (qcType === 'detection' && xmlData?.annotation?.object) {
      const objects = Array.isArray(xmlData.annotation.object) ? xmlData.annotation.object : [xmlData.annotation.object];
      objects.forEach(obj => labels.add(obj.name));
    } else if (qcType === 'segmentation' && xmlData?.shapes) {
      xmlData.shapes.forEach(shape => labels.add(shape.label));
    }
    
    // For BB QC, fetch class names from all XML files in the folder
    if (qcType === 'detection') {
      try {
        const response = await fetch('http://localhost:5000/api/get-class-names');
        if (response.ok) {
          const data = await response.json();
          data.class_names.forEach(className => labels.add(className));
        }
      } catch (error) {
        console.error('Error fetching class names:', error);
      }
    }
    
    return Array.from(labels).sort();
  }, [qcType, xmlData]);

  // Label Dialog Component
  const LabelInputDialog = () => {
    const [labelValue, setLabelValue] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [existingLabels, setExistingLabels] = useState([]);
    const [filteredLabels, setFilteredLabels] = useState([]);
    const inputRef = useRef(null);

    // Load existing labels when dialog opens
    useEffect(() => {
      const loadLabels = async () => {
        const labels = await getExistingLabels();
        setExistingLabels(labels);
        setFilteredLabels(labels);
      };
      
      if (showLabelDialog) {
        loadLabels();
        // Focus input after dialog is shown
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }
    }, [showLabelDialog, getExistingLabels]);

    // Filter labels based on input
    useEffect(() => {
      if (labelValue.trim()) {
        const filtered = existingLabels.filter(label => 
          label.toLowerCase().includes(labelValue.toLowerCase())
        );
        setFilteredLabels(filtered);
        setShowDropdown(filtered.length > 0);
      } else {
        setFilteredLabels(existingLabels);
        setShowDropdown(false);
      }
    }, [labelValue, existingLabels]);
    
    const handleSubmit = () => {
      if (labelValue.trim()) {
        handleLabelSubmit(labelValue.trim());
        setLabelValue('');
      }
    };
    
    const handleCancel = () => {
      setShowLabelDialog(false);
      setPendingAnnotation(null);
      setIsCreatingBox(false);
      setIsCreatingPolygon(false);
      setLabelValue('');
      setShowDropdown(false);
    };
    
    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'ArrowDown' && filteredLabels.length > 0) {
        e.preventDefault();
        setShowDropdown(true);
      }
    };

    const handleLabelSelect = (label, e) => {
      e.stopPropagation();
      e.preventDefault();
      setLabelValue(label);
      setShowDropdown(false);
      // Focus back to input to prevent cursor issues
      if (inputRef.current) {
        inputRef.current.focus();
      }
    };

    const handleInputFocus = () => {
      if (existingLabels.length > 0 && !labelValue.trim()) {
        setShowDropdown(true);
      }
    };

    const handleInputChange = (e) => {
      const value = e.target.value;
      setLabelValue(value);
    };
    
    return (
      <>
        <LabelDialogOverlay onClick={handleCancel} />
        <LabelDialog>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#333', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Add New Annotation
          </div>
          <div style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '16px' 
          }}>
            Creating {pendingAnnotation?.type === 'box' ? 'bounding box' : 'polygon'} annotation
          </div>
          
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <LabelInput
              ref={inputRef}
              type="text"
              placeholder="Enter object label (e.g., car, person, dog...)"
              value={labelValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              onFocus={handleInputFocus}
              autoFocus
            />
            
            {/* Dropdown for existing labels */}
            {showDropdown && filteredLabels.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 1000,
                maxHeight: '150px',
                overflowY: 'auto'
              }}>
                {filteredLabels.map((label, index) => (
                  <div
                    key={`${label}-${index}`}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: 'white',
                      borderBottom: index < filteredLabels.length - 1 ? '1px solid #eee' : 'none',
                      fontSize: '14px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseDown={(e) => handleLabelSelect(label, e)}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {existingLabels.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                Existing labels (double-click to select):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {existingLabels.map((label, index) => (
                  <button
                    key={`${label}-btn-${index}`}
                    onDoubleClick={(e) => handleLabelSelect(label, e)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      userSelect: 'none'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <DialogButtonContainer>
            <DialogButton className="secondary" onClick={handleCancel}>
              Cancel
            </DialogButton>
            <DialogButton className="primary" onClick={handleSubmit}>
              Create Annotation
            </DialogButton>
          </DialogButtonContainer>
        </LabelDialog>
      </>
    );
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setTimeout(handleImageLoad, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle canvas drag for navigation when zoomed
  const handleCanvasMouseDown = (e) => {
    // Handle creation modes first
    if (isCreatingBox || isCreatingPolygon) {
      handleCreationMouseDown(e);
      return;
    }
    
    // Only allow canvas dragging when zoomed in and not interacting with bounding boxes
    if (zoomLevel > 1 && !isDragging && !isResizing && e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
      console.log('Started canvas drag navigation');
    }
  };

  const handleCanvasMouseMove = (e) => {
    // Handle creation mode mouse move
    if (isCreatingBox) {
      handleCreationMouseMove(e);
      return;
    }
    
    if (isDraggingPolygonPoint && selectedPolygonPoint) {
      e.preventDefault();
      
      // Get current mouse position
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate movement delta from drag start in screen coordinates
      const deltaX = (mouseX - dragStart.x) / zoomLevel;
      const deltaY = (mouseY - dragStart.y) / zoomLevel;
      
      // Get the original point position from when drag started
      const polygon = polygons.find(p => p.id === selectedPolygonPoint.polygonId);
      if (polygon && polygon.points[selectedPolygonPoint.pointIndex]) {
        const originalPoint = polygon.points[selectedPolygonPoint.pointIndex];
        
        // Calculate new position based on original + delta
        const newX = originalPoint.x + deltaX;
        const newY = originalPoint.y + deltaY;
        
        // Ensure point stays within image bounds
        const boundedX = Math.max(0, Math.min(displaySize.visibleWidth || displaySize.width, newX));
        const boundedY = Math.max(0, Math.min(displaySize.visibleHeight || displaySize.height, newY));
        
        // Store the preview position
        setPreviewPolygonPoint({ x: boundedX, y: boundedY });
        setHasUnsavedChanges(true);
      }
      
    } else if (isDraggingPolygon && selectedPolygon) {
      e.preventDefault();
      
      // Get current mouse position
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate movement delta from drag start
      const deltaX = (mouseX - dragStart.x) / zoomLevel;
      const deltaY = (mouseY - dragStart.y) / zoomLevel;
      
      // Store the delta for preview (whole polygon movement)
      setPreviewPolygonPoint({ x: deltaX, y: deltaY });
      setHasUnsavedChanges(true);
      
    } else if (isDraggingCanvas && zoomLevel > 1) {
      e.preventDefault();
      // Calculate the actual visible image area
      const scaledImageWidth = displaySize.visibleWidth * zoomLevel;
      const scaledImageHeight = displaySize.visibleHeight * zoomLevel;
      const containerWidth = displaySize.width;
      const containerHeight = displaySize.height;

      // Calculate max offset so image edges can be reached
      const maxOffsetX = Math.max(0, scaledImageWidth > containerWidth ? (scaledImageWidth - containerWidth) / 2 : 0);
      const maxOffsetY = Math.max(0, scaledImageHeight > containerHeight ? (scaledImageHeight - containerHeight) / 2 : 0);

      // Use previous offset for smooth dragging
      const deltaX = e.clientX - canvasDragStart.x;
      const deltaY = e.clientY - canvasDragStart.y;
      const newX = deltaX;
      const newY = deltaY;

      // Constrain so image stays in view
      const constrainedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX));
      const constrainedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY));

      setImageOffset({ x: constrainedX, y: constrainedY });
    }
  };

  const handleCanvasMouseUp = () => {
    // Handle creation mode mouse up
    if (isCreatingBox) {
      handleCreationMouseUp();
      return;
    }
    
    if (isDraggingPolygonPoint && previewPolygonPoint && selectedPolygonPoint) {
      // Save the final polygon point position
      setPolygons(prevPolygons => {
        return prevPolygons.map(polygon => {
          if (polygon.id === selectedPolygonPoint.polygonId) {
            const updatedPoints = [...polygon.points];
            updatedPoints[selectedPolygonPoint.pointIndex] = {
              ...updatedPoints[selectedPolygonPoint.pointIndex],
              x: previewPolygonPoint.x,
              y: previewPolygonPoint.y,
              originalX: previewPolygonPoint.x * (imageSize.width / (displaySize.visibleWidth || displaySize.width)),
              originalY: previewPolygonPoint.y * (imageSize.height / (displaySize.visibleHeight || displaySize.height))
            };
            
            return { ...polygon, points: updatedPoints };
          }
          return polygon;
        });
      });
      
      // Mark polygon as modified and save
      setModifiedPolygons(prev => new Set(prev).add(selectedPolygonPoint.polygonId));
      setHasUnsavedChanges(true);
      
      setIsDraggingPolygonPoint(false);
      setSelectedPolygonPoint(null);
      setPreviewPolygonPoint(null);
      console.log('Polygon point modified - Press Ctrl+S to save');
    } else if (isDraggingPolygon && previewPolygonPoint && selectedPolygon) {
      // Save the final whole polygon position
      const deltaX = previewPolygonPoint.x;
      const deltaY = previewPolygonPoint.y;
      
      setPolygons(prevPolygons => {
        return prevPolygons.map(polygon => {
          if (polygon.id === selectedPolygon) {
            const updatedPoints = polygon.points.map(point => ({
              ...point,
              x: point.x + deltaX,
              y: point.y + deltaY,
              originalX: (point.x + deltaX) * (imageSize.width / (displaySize.visibleWidth || displaySize.width)),
              originalY: (point.y + deltaY) * (imageSize.height / (displaySize.visibleHeight || displaySize.height))
            }));
            
            return { ...polygon, points: updatedPoints };
          }
          return polygon;
        });
      });
      
      // Mark polygon as modified and save
      setModifiedPolygons(prev => new Set(prev).add(selectedPolygon));
      setHasUnsavedChanges(true);
      
      setIsDraggingPolygon(false);
      setPreviewPolygonPoint(null);
      console.log('Polygon position modified - Press Ctrl+S to save');
    } else if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      console.log('Ended canvas drag navigation');
    }
  };

  // Add canvas drag event listeners
  useEffect(() => {
    if (isDraggingCanvas || isDraggingPolygonPoint || isDraggingPolygon) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isDraggingCanvas, isDraggingPolygonPoint, isDraggingPolygon, canvasDragStart, imageOffset, zoomLevel, displaySize, dragStart, selectedPolygonPoint, previewPolygonPoint]);

  // Add keyboard shortcuts for creation modes and deletion
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle shortcuts if typing in input fields
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.contentEditable === 'true') {
        return;
      }

      if (e.key === 'w' && !showLabelDialog) {
        e.preventDefault();
        if (qcType === 'detection') {
          if (isCreatingBox) {
            cancelCreation();
          } else {
            startCreatingBox();
          }
        } else if (qcType === 'segmentation') {
          if (isCreatingPolygon) {
            cancelCreation();
          } else {
            startCreatingPolygon();
          }
        }
      } else if (e.key === 'Delete') {
        e.preventDefault();
        if (qcType === 'detection' && selectedBox !== null) {
          deleteSelectedBoundingBox();
        } else if (qcType === 'segmentation' && selectedPolygon !== null) {
          deleteSelectedPolygon();
        }
      } else if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        // Manual save when Ctrl+S is pressed
        if (hasUnsavedChanges) {
          if (qcType === 'detection' && modifiedBoxes.size > 0) {
            saveUpdatedXML(boundingBoxes);
          } else if (qcType === 'segmentation' && modifiedPolygons.size > 0) {
            saveUpdatedJSON(polygons);
          }
        }
      } else if (e.key === 'Escape') {
        cancelCreation();
        setShowLabelDialog(false);
        setPendingAnnotation(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [qcType, isCreatingBox, isCreatingPolygon, showLabelDialog, selectedBox, selectedPolygon, hasUnsavedChanges, modifiedBoxes, modifiedPolygons, boundingBoxes, polygons, saveUpdatedXML, saveUpdatedJSON]);

  // Add double-click listener for polygon creation
  useEffect(() => {
    if (isCreatingPolygon) {
      document.addEventListener('dblclick', handlePolygonDoubleClick);
      return () => document.removeEventListener('dblclick', handlePolygonDoubleClick);
    }
  }, [isCreatingPolygon, polygonPoints]);

  // Click outside to deselect
  const handleContainerClick = (e) => {
    // Handle creation modes
    if (isCreatingBox || isCreatingPolygon) {
      return; // Let creation handlers manage this
    }
    
    // Deselect if clicking on container or image (but not on bounding boxes or during canvas drag)
    const isClickOnContainer = e.target === e.currentTarget;
    const isClickOnImage = e.target === imageRef.current;
    const isNotInteracting = !isDragging && !isResizing && !isDraggingCanvas && !isDraggingPolygonPoint && !isDraggingPolygon;
    
    if ((isClickOnContainer || isClickOnImage) && isNotInteracting) {
      setSelectedBox(null);
      setSelectedPolygon(null);
      console.log('Deselected all boxes and polygons - clicked outside');
    }
  };

  // Also handle image clicks specifically
  const handleImageClick = (e) => {
    // Handle polygon creation mode
    if (isCreatingPolygon) {
      handleCreationMouseDown(e);
      return;
    }
    
    // Only deselect if not dragging/resizing/canvas dragging and the click didn't bubble from a bounding box
    if (!isDragging && !isResizing && !isDraggingCanvas && !isDraggingPolygonPoint && !isDraggingPolygon && !isCreatingBox) {
      setSelectedBox(null);
      setSelectedPolygon(null);
      console.log('Deselected all boxes and polygons - clicked on image');
    }
  };

  if (!currentImage) {
    return (
      <CanvasContainer>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-black)',
          fontSize: '18px'
        }}>
          Select an image to start annotation
        </div>
      </CanvasContainer>
    );
  }


  // ...existing code...
  if (!currentImage) {
    return (
      <CanvasContainer>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'var(--text-black)',
          fontSize: '18px'
        }}>
          Select an image to start annotation
        </div>
      </CanvasContainer>
    );
  }

  return (
    <CanvasContainer 
      ref={containerRef} 
      onClick={handleContainerClick} 
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={(e) => {
        handleMousePositionTracking(e);
        if (isCreatingBox) handleCreationMouseMove(e);
      }}
      onMouseUp={isCreatingBox ? handleCreationMouseUp : undefined}
      zoomed={zoomLevel > 1}
      isDraggingCanvas={isDraggingCanvas}
      style={{ cursor: (isCreatingBox || isCreatingPolygon) ? 'crosshair' : 'default' }}
    >
      {/* Image Information Only */}
      <ImageInfoContainer>
        <InfoSection>
          <SectionTitle>Image Information</SectionTitle>
          <InfoItem>
            <span>Dimensions:</span>
            <span>{imageSize.width} × {imageSize.height}</span>
          </InfoItem>
          <InfoItem>
            <span>Zoom:</span>
            <span>{Math.round(zoomLevel * 100)}%</span>
          </InfoItem>
          <InfoItem>
            <span>{qcType === 'detection' ? 'XML' : 'JSON'}:</span>
            <StatusBadge available={xmlData}>
              {xmlData ? 'Available' : 'None'}
            </StatusBadge>
          </InfoItem>
        </InfoSection>
      </ImageInfoContainer>
      <ImageContainer 
        offsetX={imageOffset.x} 
        offsetY={imageOffset.y}
      >
        <ImageElement
          ref={imageRef}
          scale={zoomLevel}
          src={window.electronAPI ? 
            `file://${currentImage.fullPath}` : 
            `http://localhost:5000/api/images/${currentImage.name}`
          }
          alt="Current annotation"
          onLoad={handleImageLoad}
          onClick={handleImageClick}
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.style.display = 'none';
          }}
          style={{ 
            objectFit: displaySize.objectFit,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center',
            transition: 'transform 0.1s ease-out'
          }}
        />
        
        {/* Render editable bounding boxes - selected box last to ensure it's on top */}
        {boundingBoxes
          .sort((a, b) => (a.id === selectedBox ? 1 : 0) - (b.id === selectedBox ? 1 : 0))
          .map(box => {
            // Calculate the actual scaled dimensions
            const scaledDisplayWidth = displaySize.width * zoomLevel;
            const scaledDisplayHeight = displaySize.height * zoomLevel;

            // Calculate the center offset caused by image scaling
            const centerOffsetX = (scaledDisplayWidth - displaySize.width) / 2;
            const centerOffsetY = (scaledDisplayHeight - displaySize.height) / 2;

            // Position relative to the top-left of the visible image area (red box), not the container
            const boxLeft = (displaySize.paddingX || 0) + (box.x * zoomLevel) - centerOffsetX + imageOffset.x;
            const boxTop = (displaySize.paddingY || 0) + (box.y * zoomLevel) - centerOffsetY + imageOffset.y;

            // Check if box is near the top (within label height)
            const labelHeight = 28;
            const imageTopBoundary = displaySize.offsetY + (displaySize.paddingY || 0);
            const isNearTop = (boxTop - imageTopBoundary) < labelHeight;

            return (
              <EditableBoundingBox
                key={box.id}
                isSelected={selectedBox === box.id}
                style={{
                  left: `${boxLeft}px`,
                  top: `${boxTop}px`,
                  width: `${box.width * zoomLevel}px`,
                  height: `${box.height * zoomLevel}px`,
                }}
                onClick={(e) => handleBoxClick(box.id, e)}
                onMouseDown={(e) => handleMouseDown(e, box.id)}
              >
                <ObjectLabel 
                  isSelected={selectedBox === box.id}
                  isNearTop={isNearTop}
                >
                  {box.name}
                </ObjectLabel>

                {/* Resize handles - only show for selected box */}
                {selectedBox === box.id && (
                  <>
                    <ResizeHandle 
                      className="nw" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'nw')} 
                    />
                    <ResizeHandle 
                      className="ne" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'ne')} 
                    />
                    <ResizeHandle 
                      className="sw" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'sw')} 
                    />
                    <ResizeHandle 
                      className="se" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'se')} 
                    />
                    <ResizeHandle 
                      className="n" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'n')} 
                    />
                    <ResizeHandle 
                      className="s" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 's')} 
                    />
                    <ResizeHandle 
                      className="w" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'w')} 
                    />
                    <ResizeHandle 
                      className="e" 
                      isSelected={true} 
                      onMouseDown={(e) => handleMouseDown(e, box.id, 'e')} 
                    />
                  </>
                )}
              </EditableBoundingBox>
            );
          })}
          
          {/* Render polygons */}
          {polygons.length > 0 && (() => {
            // Calculate the same offsets used for bounding boxes
            const scaledDisplayWidth = displaySize.width * zoomLevel;
            const scaledDisplayHeight = displaySize.height * zoomLevel;
            const centerOffsetX = (scaledDisplayWidth - displaySize.width) / 2;
            const centerOffsetY = (scaledDisplayHeight - displaySize.height) / 2;
            
            return (
              <PolygonOverlay
                style={{
                  width: `${(displaySize.visibleWidth || displaySize.width) * zoomLevel}px`,
                  height: `${(displaySize.visibleHeight || displaySize.height) * zoomLevel}px`,
                  left: `${(displaySize.paddingX || 0) - centerOffsetX + imageOffset.x}px`,
                  top: `${(displaySize.paddingY || 0) - centerOffsetY + imageOffset.y}px`,
                }}
              >
              {polygons.map(polygon => {
                // Calculate polygon points with preview adjustments
                let polygonPoints = polygon.points;
                
                // Apply preview for whole polygon dragging
                if (isDraggingPolygon && selectedPolygon === polygon.id && previewPolygonPoint) {
                  polygonPoints = polygon.points.map(point => ({
                    ...point,
                    x: point.x + previewPolygonPoint.x,
                    y: point.y + previewPolygonPoint.y
                  }));
                }
                
                // Apply preview for individual point dragging
                if (isDraggingPolygonPoint && selectedPolygonPoint?.polygonId === polygon.id && previewPolygonPoint) {
                  polygonPoints = polygon.points.map((point, index) => {
                    if (index === selectedPolygonPoint.pointIndex) {
                      return { ...point, x: previewPolygonPoint.x, y: previewPolygonPoint.y };
                    }
                    return point;
                  });
                }
                
                const scaledPoints = polygonPoints.map(point => {
                  const x = point.x * zoomLevel;
                  const y = point.y * zoomLevel;
                  return `${x},${y}`;
                }).join(' ');
                
                return (
                  <g key={`polygon-${polygon.id}`}>
                    <polygon
                      points={scaledPoints}
                      fill={selectedPolygon === polygon.id ? "rgba(51, 255, 51, 0.2)" : "rgba(53, 255, 107, 0.15)"}
                      stroke={selectedPolygon === polygon.id ? "#33ff33" : "#35ff6b"}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      onClick={(e) => handlePolygonClick(polygon.id, e)}
                      onMouseDown={(e) => {
                        // Only start whole polygon drag if polygon is already selected
                        // and we're not clicking on a point (points have higher z-index)
                        if (selectedPolygon === polygon.id) {
                          handlePolygonMouseDown(e, polygon.id);
                        }
                      }}
                      style={{ cursor: selectedPolygon === polygon.id ? 'move' : 'pointer' }}
                    />
                    {/* Render polygon points - only show for selected polygon */}
                    {selectedPolygon === polygon.id && polygon.points.map((point, pointIndex) => (
                      <circle
                        key={`point-${polygon.id}-${pointIndex}`}
                        cx={point.x * zoomLevel}
                        cy={point.y * zoomLevel}
                        r="6"
                        fill={isBackspacePressed ? "#ff4444" : "#33ff33"}
                        stroke="white"
                        strokeWidth="2"
                        style={{ 
                          cursor: isBackspacePressed ? 'pointer' : 'grab',
                          opacity: isBackspacePressed ? 0.8 : 1
                        }}
                        onMouseDown={(e) => {
                          if (isBackspacePressed) {
                            e.stopPropagation();
                            removePolygonPoint(pointIndex);
                          } else {
                            handlePolygonPointMouseDown(e, polygon.id, pointIndex);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isBackspacePressed) {
                            handlePolygonClick(polygon.id, e);
                          }
                        }}
                        title={isBackspacePressed ? "Click to remove point" : "Drag to move point"}
                      />
                    ))}
                    {/* Polygon label - positioned at centroid */}
                    {polygon.points.length > 0 && (
                      <text
                        x={polygon.points.reduce((sum, p) => sum + p.x, 0) / polygon.points.length * zoomLevel}
                        y={polygon.points.reduce((sum, p) => sum + p.y, 0) / polygon.points.length * zoomLevel - 10}
                        fill={selectedPolygon === polygon.id ? "#33ff33" : "#35ff6b"}
                        fontSize="12"
                        fontWeight="600"
                        textAnchor="middle"
                        style={{ 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        onClick={(e) => handlePolygonClick(polygon.id, e)}
                      >
                        {polygon.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </PolygonOverlay>
            );
          })()}
          
          {/* Render preview box during creation */}
          {isCreatingBox && previewBox && (
            <div
              style={{
                position: 'absolute',
                left: `${(displaySize.paddingX || 0) + (previewBox.x * zoomLevel) + imageOffset.x}px`,
                top: `${(displaySize.paddingY || 0) + (previewBox.y * zoomLevel) + imageOffset.y}px`,
                width: `${previewBox.width * zoomLevel}px`,
                height: `${previewBox.height * zoomLevel}px`,
                border: '2px dashed #007bff',
                background: 'rgba(0, 123, 255, 0.1)',
                pointerEvents: 'none',
                zIndex: 15
              }}
            />
          )}
          
          {/* Render polygon points during creation */}
          {isCreatingPolygon && polygonPoints.length > 0 && (
            <PolygonOverlay
              style={{
                width: `${(displaySize.visibleWidth || displaySize.width) * zoomLevel}px`,
                height: `${(displaySize.visibleHeight || displaySize.height) * zoomLevel}px`,
                left: `${(displaySize.paddingX || 0) + imageOffset.x}px`,
                top: `${(displaySize.paddingY || 0) + imageOffset.y}px`,
                pointerEvents: 'none'
              }}
            >
              <g>
                {/* Render lines between points */}
                {polygonPoints.map((point, index) => {
                  if (index === 0) return null;
                  const prevPoint = polygonPoints[index - 1];
                  return (
                    <line
                      key={`line-${index}`}
                      x1={prevPoint.x * zoomLevel}
                      y1={prevPoint.y * zoomLevel}
                      x2={point.x * zoomLevel}
                      y2={point.y * zoomLevel}
                      stroke="#007bff"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                })}
                
                {/* Render points */}
                {polygonPoints.map((point, index) => (
                  <circle
                    key={`point-${index}`}
                    cx={point.x * zoomLevel}
                    cy={point.y * zoomLevel}
                    r="4"
                    fill="#007bff"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
                
                {/* Show instruction text */}
                {polygonPoints.length > 0 && (
                  <text
                    x={polygonPoints[polygonPoints.length - 1].x * zoomLevel}
                    y={polygonPoints[polygonPoints.length - 1].y * zoomLevel - 15}
                    fill="#007bff"
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                  >
                    {polygonPoints.length < 3 ? 'Click to add points' : 'Double-click to finish'}
                  </text>
                )}
              </g>
            </PolygonOverlay>
          )}
      </ImageContainer>
      
      {/* Save Status Indicator */}
      <SaveIndicator saving={saveStatus.saving} show={saveStatus.show}>
        {saveStatus.saving ? 'Saving...' : 'Saved'}
      </SaveIndicator>
      
      {/* Zoom Level Indicator */}
      <ZoomIndicator show={showZoomIndicator}>
        {Math.round(zoomLevel * 100)}%
      </ZoomIndicator>
      
      {/* Label Input Dialog */}
      {showLabelDialog && pendingAnnotation && <LabelInputDialog />}
    </CanvasContainer>
  );
};

export default InteractiveImageCanvas;
