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
  
  &:hover {
    background: #ff1111;
    transform: ${props => 
      props.className.includes('n') && !props.className.includes('w') && !props.className.includes('e') ? 'translateX(-50%) scale(1.2)' :
      props.className.includes('w') && !props.className.includes('n') && !props.className.includes('s') ? 'translateY(-50%) scale(1.2)' :
      'scale(1.2)'
    };
  }
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

const InteractiveImageCanvas = ({ currentImage, xmlData, onXmlUpdate, selectedConfig }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, visibleWidth: 0, visibleHeight: 0, paddingX: 0, paddingY: 0, objectFit: 'contain' });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [selectedBox, setSelectedBox] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saveStatus, setSaveStatus] = useState({ saving: false, show: false });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modifiedBoxes, setModifiedBoxes] = useState(new Set()); // Track which boxes have been modified
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom functionality
  const [showZoomIndicator, setShowZoomIndicator] = useState(false); // Show zoom level temporarily
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false); // For canvas drag navigation
  const [canvasDragStart, setCanvasDragStart] = useState({ x: 0, y: 0 }); // Canvas drag start position
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 }); // Image position offset for navigation
  const [xmlPresent, setXmlPresent] = useState(!!xmlData);
  
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
    if (!currentImage || !xmlData) return;

    setSaveStatus({ saving: true, show: true });
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      console.log('Saving XML with', updatedBoxes.length, 'boxes');
      
      // Update bounding box coordinates in XML using the provided boxes
      updatedBoxes.forEach(box => {
        const objElement = xmlDoc.getElementsByTagName('object')[box.id];
        if (objElement) {
          const bndboxElement = objElement.getElementsByTagName('bndbox')[0];
          if (bndboxElement && box.originalCoords) {
            console.log('Saving box', box.id, 'with coordinates:', box.originalCoords);
            
            bndboxElement.getElementsByTagName('xmin')[0].textContent = box.originalCoords.xmin.toString();
            bndboxElement.getElementsByTagName('ymin')[0].textContent = box.originalCoords.ymin.toString();
            bndboxElement.getElementsByTagName('xmax')[0].textContent = box.originalCoords.xmax.toString();
            bndboxElement.getElementsByTagName('ymax')[0].textContent = box.originalCoords.ymax.toString();
          } else {
            console.warn('Missing originalCoords for box', box.id);
          }
        } else {
          console.warn('Object element not found for box', box.id);
        }
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
        // This ensures subsequent saves use the updated XML as the base
        if (onXmlUpdate) {
          console.log('Updating parent with new XML data');
          onXmlUpdate(updatedXml);
        }
        
        // The parent component will re-pass the updated xmlData which will trigger
        // parseXMLBoundingBoxes through the useEffect dependency
        
      } else {
        const errorText = await response.text();
        console.error('Save failed with status:', response.status, 'Error:', errorText);
        throw new Error(`Failed to save XML: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setSaveStatus({ saving: false, show: true });
    }
    
    // Hide save indicator after 1.5 seconds (reduced from 2 seconds)
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, show: false }));
    }, 1500);
  }, [currentImage, xmlData, onXmlUpdate]);

  // Auto-save when switching images - use the new save system
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && modifiedBoxes.size > 0) {
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
    };
  }, [currentImage, hasUnsavedChanges, modifiedBoxes, displaySize, imageSize, saveUpdatedXML]);

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
      console.log('InteractiveImageCanvas: No XML data available');
      setBoundingBoxes([]);
      return;
    }

    console.log('InteractiveImageCanvas: Parsing XML data for interactive editing');

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML parsing error:', parseError.textContent);
        setBoundingBoxes([]);
        return;
      }

      const objects = xmlDoc.getElementsByTagName('object');
      console.log('InteractiveImageCanvas: Found', objects.length, 'objects in XML');
      
      const boxes = [];

      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        const nameElement = obj.getElementsByTagName('name')[0];
        const bndboxElement = obj.getElementsByTagName('bndbox')[0];
        
        if (nameElement && bndboxElement) {
          const name = nameElement.textContent;
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
      }
      
      console.log('InteractiveImageCanvas: Parsed', boxes.length, 'editable bounding boxes');
      setBoundingBoxes(boxes);
      setHasUnsavedChanges(false);
      setModifiedBoxes(new Set()); // Reset modified boxes when parsing new XML
      
    } catch (error) {
      console.error('Error parsing XML for bounding boxes:', error);
      setBoundingBoxes([]);
    }
  };

  const handleBoxClick = (boxId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Box clicked:', boxId, 'isDragging:', isDragging, 'isResizing:', isResizing);
    
    // Only select if not currently dragging or resizing
    if (!isDragging && !isResizing) {
      setSelectedBox(boxId);
      console.log('Selected box:', boxId);
    }
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
    // Only allow canvas dragging when zoomed in and not interacting with bounding boxes
    if (zoomLevel > 1 && !isDragging && !isResizing && e.target === e.currentTarget) {
      setIsDraggingCanvas(true);
      setCanvasDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
      console.log('Started canvas drag navigation');
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDraggingCanvas && zoomLevel > 1) {
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
    if (isDraggingCanvas) {
      setIsDraggingCanvas(false);
      console.log('Ended canvas drag navigation');
    }
  };

  // Add canvas drag event listeners
  useEffect(() => {
    if (isDraggingCanvas) {
      document.addEventListener('mousemove', handleCanvasMouseMove);
      document.addEventListener('mouseup', handleCanvasMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleCanvasMouseMove);
        document.removeEventListener('mouseup', handleCanvasMouseUp);
      };
    }
  }, [isDraggingCanvas, canvasDragStart, imageOffset, zoomLevel, displaySize]);

  // Click outside to deselect
  const handleContainerClick = (e) => {
    // Deselect if clicking on container or image (but not on bounding boxes or during canvas drag)
    const isClickOnContainer = e.target === e.currentTarget;
    const isClickOnImage = e.target === imageRef.current;
    const isNotInteracting = !isDragging && !isResizing && !isDraggingCanvas;
    
    if ((isClickOnContainer || isClickOnImage) && isNotInteracting) {
      setSelectedBox(null);
      console.log('Deselected all boxes - clicked outside bounding boxes');
    }
  };

  // Also handle image clicks specifically
  const handleImageClick = (e) => {
    // Only deselect if not dragging/resizing/canvas dragging and the click didn't bubble from a bounding box
    if (!isDragging && !isResizing && !isDraggingCanvas) {
      setSelectedBox(null);
      console.log('Deselected all boxes - clicked on image');
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
      zoomed={zoomLevel > 1}
      isDraggingCanvas={isDraggingCanvas}
    >
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
      </ImageContainer>
      
      {/* XML presence and image size info (top right) */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '13px',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <span>{xmlPresent ? 'XML loaded' : 'No XML'}</span>
        <span>Image: {imageSize.width} x {imageSize.height}</span>
      </div>
    </CanvasContainer>
  );
};

export default InteractiveImageCanvas;
