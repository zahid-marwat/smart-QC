import React from 'react';
import styled from 'styled-components';
import MapWidget from './MapWidget';
import Magnifier from './Magnifier';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--accent-white);
`;

const WidgetSection = styled.div`
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1px;
    `;
    
    
const ToolPanel = ({ 
  qcType, 
  selectedObject,
  onLocationUpdate,
  currentImage,
  mousePosition,
  imageRef 
}) => {
  return (
    <Container>
      <WidgetSection>
        <MapWidget 
          selectedObject={selectedObject}
          onLocationUpdate={onLocationUpdate}
        />
        
        <Magnifier 
          currentImage={currentImage}
          mousePosition={mousePosition}
          imageRef={imageRef}
        />
      </WidgetSection>
    </Container>
  );
};

export default ToolPanel;
