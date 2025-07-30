import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
`;

const ImageElement = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
`;

const OverlayCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 10;
`;

const BoundingBoxOverlay = styled.div`
  position: absolute;
  border: 2px solid #ff6b35;
  background: rgba(255, 107, 53, 0.1);
  pointer-events: none;
  z-index: 10;
`;

const ObjectLabel = styled.div`
  position: absolute;
  background: #ff6b35;
  color: white;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 3px;
  white-space: nowrap;
  z-index: 11;
  top: -24px;
  left: 0;
  min-width: 40px;
  text-align: center;
`;

const ImageCanvas = ({ currentImage, xmlData }) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (xmlData && imageSize.width > 0) {
      parseXMLBoundingBoxes();
    }
  }, [xmlData, imageSize]);

  // Zoom on mouse wheel, center on cursor
  useEffect(() => {
    const handleWheel = (e) => {
      if (!imageRef.current || !containerRef.current) return;
      if (e.ctrlKey) return;
      e.preventDefault();
      e.stopPropagation();


      // Mouse position relative to container
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // The image is positioned at imageOffset.x/y plus displaySize.offsetX/Y inside the container
      // Calculate the image pixel under the mouse
      const imageLeft = imageOffset.x + displaySize.offsetX;
      const imageTop = imageOffset.y + displaySize.offsetY;
      const imgX = (mouseX - imageLeft) / zoomLevel;
      const imgY = (mouseY - imageTop) / zoomLevel;

      // Calculate zoom delta
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoomLevel(prevZoom => {
        let newZoom = Math.max(1.0, Math.min(3.0, prevZoom + delta));
        setImageOffset(prevOffset => {
          // After zoom, keep imgX/imgY under mouse
          // The new image position should be (mouseX - displaySize.offsetX) - imgX * newZoom
          const newImageLeft = mouseX - imgX * newZoom;
          const newImageOffsetX = newImageLeft - displaySize.offsetX;
          const newImageTop = mouseY - imgY * newZoom;
          const newImageOffsetY = newImageTop - displaySize.offsetY;
          return { x: newImageOffsetX, y: newImageOffsetY };
        });
        return newZoom;
      });
    };
    document.addEventListener('wheel', handleWheel, { passive: false });
    return () => document.removeEventListener('wheel', handleWheel);
  }, []);

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      // Get the actual displayed size of the image
      const imgRect = img.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      
      const newImageSize = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      
      const newDisplaySize = {
        width: imgRect.width,
        height: imgRect.height,
        offsetX: imgRect.left - containerRect.left,
        offsetY: imgRect.top - containerRect.top
      };
      
      console.log('ImageCanvas: Image loaded');
      console.log('ImageCanvas: Natural size:', newImageSize);
      console.log('ImageCanvas: Display size:', newDisplaySize);
      
      setImageSize(newImageSize);
      setDisplaySize(newDisplaySize);
    }
  };

  const parseXMLBoundingBoxes = () => {
    if (!xmlData) {
      console.log('ImageCanvas: No XML data available');
      setBoundingBoxes([]);
      return;
    }

    console.log('ImageCanvas: Parsing XML data:', xmlData.substring(0, 200) + '...');
    console.log('ImageCanvas: Current image size:', imageSize);
    console.log('ImageCanvas: Current display size:', displaySize);

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XML parsing error:', parseError.textContent);
        setBoundingBoxes([]);
        return;
      }

      const objects = xmlDoc.getElementsByTagName('object');
      console.log('ImageCanvas: Found', objects.length, 'objects in XML');
      
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
          
          console.log('ImageCanvas: Object', i, ':', { name, xmin, ymin, xmax, ymax });
          
          // Calculate relative position and size
          const relativeBox = {
            id: i,
            name: name,
            x: (xmin / imageSize.width) * displaySize.width,
            y: (ymin / imageSize.height) * displaySize.height,
            width: ((xmax - xmin) / imageSize.width) * displaySize.width,
            height: ((ymax - ymin) / imageSize.height) * displaySize.height,
            originalCoords: { xmin, ymin, xmax, ymax }
          };
          
          console.log('ImageCanvas: Calculated relative box:', relativeBox);
          boxes.push(relativeBox);
        } else {
          console.warn('ImageCanvas: Object', i, 'missing name or bndbox');
        }
      }
      
      console.log('ImageCanvas: Final bounding boxes:', boxes);
      setBoundingBoxes(boxes);
      
    } catch (error) {
      console.error('Error parsing XML for bounding boxes:', error);
      setBoundingBoxes([]);
    }
  };

  // Handle window resize to recalculate positions
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setTimeout(handleImageLoad, 100); // Small delay to let layout settle
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Image info panel
  const imageInfoPanel = (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px 16px',
      borderRadius: '6px',
      fontSize: '13px',
      zIndex: 30,
      minWidth: '320px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>Image Information</div>
      <div><span style={{ fontWeight: 600 }}>Path:</span><br/>{currentImage.fullPath || currentImage.name}</div>
      <div style={{ marginTop: 6 }}><span style={{ fontWeight: 600 }}>XML:</span> {xmlData ? 'Available' : 'Not Available'}</div>
      <div style={{ marginTop: 6 }}>
        <span style={{ fontWeight: 600 }}>Natural Size:</span> {imageSize.width} x {imageSize.height}<br/>
        <span style={{ fontWeight: 600 }}>Displayed Size:</span> {Math.round(displaySize.width * zoomLevel)} x {Math.round(displaySize.height * zoomLevel)}
      </div>
    </div>
  );


  // ...existing code...
  return (
    <CanvasContainer ref={containerRef}>
      <div
        style={{
          position: 'absolute',
          left: `${imageOffset.x}px`,
          top: `${imageOffset.y}px`,
          width: `${displaySize.width * zoomLevel}px`,
          height: `${displaySize.height * zoomLevel}px`,
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <ImageElement
          ref={imageRef}
          src={window.electronAPI ?
            `file://${currentImage?.fullPath}` :
            (currentImage ? `http://localhost:5000/api/images/${currentImage.name}` : '')
          }
          alt="Current annotation"
          onLoad={handleImageLoad}
          onError={(e) => {
            console.error('Image load error:', e);
            e.target.style.display = 'none';
          }}
          style={{
            width: `${displaySize.width * zoomLevel}px`,
            height: `${displaySize.height * zoomLevel}px`,
            objectFit: 'contain',
            display: 'block',
          }}
        />
        {/* Render bounding boxes */}
        {boundingBoxes.map(box => (
          <BoundingBoxOverlay
            key={box.id}
            style={{
              left: `${box.x * zoomLevel}px`,
              top: `${box.y * zoomLevel}px`,
              width: `${box.width * zoomLevel}px`,
              height: `${box.height * zoomLevel}px`,
            }}
          >
            <ObjectLabel>
              {box.name}
            </ObjectLabel>
          </BoundingBoxOverlay>
        ))}
      </div>
      {/* Info panel and debug info */}
      {imageInfoPanel}
      {boundingBoxes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 20
        }}>
          Found {boundingBoxes.length} bounding boxes
        </div>
      )}
    </CanvasContainer>
  );

}
export default ImageCanvas;
