import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FiZoomIn, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const MagnifierContainer = styled.div`
  width: 100%;
  height: 200px;
  background: var(--light-gray);
  border: 2px solid var(--border-gray);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
`;

const MagnifierHeader = styled.div`
  padding: 8px 12px;
  background: var(--light-gray);
  border-bottom: 1px solid var(--border-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MagnifierTitle = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-black);
  display: flex;
  align-items: center;
  gap: 4px;
`;

const ToggleButton = styled.button`
  background: ${props => props.enabled ? 'var(--primary-orange)' : 'var(--border-gray)'};
  color: ${props => props.enabled ? 'white' : 'var(--text-black)'};
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const MagnifierContent = styled.div`
  width: 100%;
  height: calc(100% - 40px);
  position: relative;
`;

const MagnifierCanvas = styled.canvas`
  width: 100%;
  height: 100%;
  background: white;
  cursor: crosshair;
`;

const MagnifierPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  color: #666;
  text-align: center;
  padding: 16px;
`;

const CircularMagnifier = styled.div`
  position: fixed;
  width: 150px;
  height: 150px;
  border: 3px solid var(--primary-orange);
  border-radius: 50%;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  background-size: ${props => props.zoomLevel * 100}%;
  background-repeat: no-repeat;
  background-image: ${props => props.imageUrl ? `url(${props.imageUrl})` : 'none'};
  display: ${props => props.visible ? 'block' : 'none'};
  transform: translate(-50%, -50%);
`;

const ZoomInfo = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-black);
  z-index: 10;
`;

const Magnifier = ({ currentImage, mousePosition, imageRef }) => {
  const canvasRef = useRef(null);
  const [isMagnifierEnabled, setIsMagnifierEnabled] = useState(false);
  const [magnificationLevel] = useState(3); // 3x zoom
  const [showCircularMagnifier, setShowCircularMagnifier] = useState(false);
  const [circularMagnifierPos, setCircularMagnifierPos] = useState({ x: 0, y: 0 });
  const [imageUrl, setImageUrl] = useState('');
  const magnifierSize = 150;
  const regionSize = 50;

  // Load image URL when currentImage changes
  useEffect(() => {
    if (currentImage && currentImage.fullPath) {
      // For web environment, use the image path directly
      if (currentImage.fullPath.startsWith('http') || currentImage.fullPath.startsWith('/')) {
        setImageUrl(currentImage.fullPath);
      } else {
        // For local files, you might need to handle this differently
        setImageUrl(currentImage.fullPath);
      }
    }
  }, [currentImage]);

  // Handle mouse movement for circular magnifier
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isMagnifierEnabled || !imageRef?.current) return;

      const imageRect = imageRef.current.getBoundingClientRect();
      const isOverImage = (
        e.clientX >= imageRect.left &&
        e.clientX <= imageRect.right &&
        e.clientY >= imageRect.top &&
        e.clientY <= imageRect.bottom
      );

      if (isOverImage) {
        setShowCircularMagnifier(true);
        setCircularMagnifierPos({
          x: e.clientX + 20, // Offset to avoid cursor obstruction
          y: e.clientY - 20
        });
      } else {
        setShowCircularMagnifier(false);
      }
    };

    const handleMouseLeave = () => {
      setShowCircularMagnifier(false);
    };

    // Copy imageRef.current to a variable to avoid stale closure
    const imageElement = imageRef?.current;

    if (isMagnifierEnabled && imageElement) {
      document.addEventListener('mousemove', handleMouseMove);
      imageElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (imageElement) {
        imageElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isMagnifierEnabled, imageRef]);

  // Update canvas magnifier
  useEffect(() => {
    if (!currentImage || !mousePosition || !imageRef?.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const sourceImage = imageRef.current;

    canvas.width = magnifierSize;
    canvas.height = magnifierSize;
    ctx.clearRect(0, 0, magnifierSize, magnifierSize);

    try {
      const imageRect = sourceImage.getBoundingClientRect();
      const scaleX = sourceImage.naturalWidth / imageRect.width;
      const scaleY = sourceImage.naturalHeight / imageRect.height;
      
      const sourceX = (mousePosition.x - imageRect.left) * scaleX;
      const sourceY = (mousePosition.y - imageRect.top) * scaleY;
      
      const regionLeft = Math.max(0, sourceX - regionSize / 2);
      const regionTop = Math.max(0, sourceY - regionSize / 2);
      const regionRight = Math.min(sourceImage.naturalWidth, sourceX + regionSize / 2);
      const regionBottom = Math.min(sourceImage.naturalHeight, sourceY + regionSize / 2);
      
      const regionWidth = regionRight - regionLeft;
      const regionHeight = regionBottom - regionTop;

      if (regionWidth > 0 && regionHeight > 0) {
        ctx.imageSmoothingEnabled = false;
        
        ctx.drawImage(
          sourceImage,
          regionLeft, regionTop, regionWidth, regionHeight,
          0, 0, magnifierSize, magnifierSize
        );

        // Draw crosshair
        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(magnifierSize / 2 - 10, magnifierSize / 2);
        ctx.lineTo(magnifierSize / 2 + 10, magnifierSize / 2);
        ctx.moveTo(magnifierSize / 2, magnifierSize / 2 - 10);
        ctx.lineTo(magnifierSize / 2, magnifierSize / 2 + 10);
        ctx.stroke();
      }
    } catch (error) {
      console.error('Error drawing magnifier:', error);
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, magnifierSize, magnifierSize);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Image not ready', magnifierSize / 2, magnifierSize / 2);
    }
  }, [currentImage, mousePosition, imageRef, magnificationLevel, magnifierSize, regionSize]);

  const toggleMagnifier = () => {
    setIsMagnifierEnabled(!isMagnifierEnabled);
    if (isMagnifierEnabled) {
      setShowCircularMagnifier(false);
    }
  };

  if (!currentImage) {
    return (
      <div>
        <MagnifierContainer>
          <MagnifierHeader>
            <MagnifierTitle>
              <FiZoomIn />
              Magnifier
            </MagnifierTitle>
            <ToggleButton 
              enabled={isMagnifierEnabled} 
              onClick={toggleMagnifier}
            >
              {isMagnifierEnabled ? <FiToggleRight /> : <FiToggleLeft />}
              {isMagnifierEnabled ? 'ON' : 'OFF'}
            </ToggleButton>
          </MagnifierHeader>
          <MagnifierContent>
            <MagnifierPlaceholder>
              <FiZoomIn size={24} />
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                Load an image and hover over the canvas to magnify
              </div>
            </MagnifierPlaceholder>
          </MagnifierContent>
        </MagnifierContainer>
      </div>
    );
  }

  return (
    <>
      <div>
        <MagnifierContainer>
          <MagnifierHeader>
            <MagnifierTitle>
              <FiZoomIn />
              Magnifier (3x)
            </MagnifierTitle>
            <ToggleButton 
              enabled={isMagnifierEnabled} 
              onClick={toggleMagnifier}
            >
              {isMagnifierEnabled ? <FiToggleRight /> : <FiToggleLeft />}
              {isMagnifierEnabled ? 'ON' : 'OFF'}
            </ToggleButton>
          </MagnifierHeader>
          <MagnifierContent>
            <ZoomInfo>3x</ZoomInfo>
            <MagnifierCanvas ref={canvasRef} />
          </MagnifierContent>
        </MagnifierContainer>
      </div>

      {/* Circular Magnifier Overlay */}
      <CircularMagnifier
        visible={showCircularMagnifier && isMagnifierEnabled}
        imageUrl={imageUrl}
        zoomLevel={magnificationLevel}
        style={{
          left: `${circularMagnifierPos.x}px`,
          top: `${circularMagnifierPos.y}px`,
          backgroundPosition: mousePosition && imageRef?.current ? 
            `${-((mousePosition.x - imageRef.current.getBoundingClientRect().left) * magnificationLevel - 75)}px ${-((mousePosition.y - imageRef.current.getBoundingClientRect().top) * magnificationLevel - 75)}px` : 
            'center'
        }}
      />
    </>
  );
};

export default Magnifier;
