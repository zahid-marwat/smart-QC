import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import FolderSelection from './components/FolderSelection';
import ConfigSelection from './components/ConfigSelection';
import ImageViewer from './components/ImageViewer';
import InteractiveImageCanvas from './components/InteractiveImageCanvas';
import AttributePanel from './components/AttributePanel';
import ToolPanel from './components/ToolPanel';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, var(--primary-orange) 0%, var(--secondary-yellow) 100%);
`;

const MainContent = styled.div`
  display: flex;
  height: calc(100vh - 80px);
`;

const LeftPanel = styled.div`
  width: 300px;
  background: var(--accent-white);
  border-right: 2px solid var(--border-gray);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const ImageSection = styled.div`
  flex: 2;
  border-bottom: 1px solid var(--border-gray);
  min-height: 160px;
`;

const ToolSection = styled.div`
  flex: 1;
  min-height: 40%;
  max-height: 40%;
`;

const CenterPanel = styled.div`
  flex: 1;
  background: var(--light-gray);
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  width: 350px;
  background: var(--accent-white);
  border-left: 2px solid var(--border-gray);
  overflow-y: auto;
`;

function App() {
  const [currentStep, setCurrentStep] = useState('folder-selection');
  const [qcType, setQcType] = useState('detection'); // Default to detection (BB QC)
  const [folders, setFolders] = useState({
    images: null,
    xmls: null,
    combined: null
  });
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [xmlData, setXmlData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedObject, setSelectedObject] = useState(null);
  const [selectedObjectId, setSelectedObjectId] = useState(null); // ID for attribute panel selection
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState(null);
  const [isSelectionLocked, setIsSelectionLocked] = useState(false);
  const imageViewerRef = useRef(null);
  const canvasRef = useRef(null);
  const attributePanelRef = useRef(null);

  // Auto-save functionality with 3-second delay
  useEffect(() => {
    if (hasUnsavedChanges) {
      // Clear existing timeout
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
      
      // Set new timeout for 3 seconds
      const timeout = setTimeout(() => {
        if (attributePanelRef.current) {
          console.log('Auto-saving after 3 seconds...');
          attributePanelRef.current.saveChanges();
          setHasUnsavedChanges(false);
        }
      }, 3000);
      
      setAutoSaveTimeout(timeout);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [hasUnsavedChanges, autoSaveTimeout]);

  // Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (attributePanelRef.current) {
          console.log('Manual save triggered (Ctrl+S)');
          attributePanelRef.current.saveChanges();
          setHasUnsavedChanges(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFoldersSelected = (folderData) => {
    setFolders(folderData);
    setCurrentStep('config-selection');
  };

  const handleConfigSelected = (config) => {
    setSelectedConfig(config);
    // Determine QC type from config
    if (config && config.qc_type) {
      if (config.qc_type.key === 'seg_qc') {
        setQcType('segmentation');
      } else {
        setQcType('detection');
      }
    }
    setCurrentStep('annotation');
  };

  const handleImageSelected = (image, xmlContent) => {
    // Auto-save before changing images if there are unsaved changes
    if (hasUnsavedChanges && attributePanelRef.current) {
      console.log('Auto-saving before image change...');
      attributePanelRef.current.saveChanges();
    }
    
    // Clear auto-save timeout when changing images
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
      setAutoSaveTimeout(null);
    }
    
    setCurrentImage(image);
    setXmlData(xmlContent);
    // Temporarily reset selection - AttributePanel will manage selecting appropriate object
    setSelectedObjectId(null);
    setSelectedObject(null);
    setHasUnsavedChanges(false);
    setIsSelectionLocked(false);
  };

  const handleXmlUpdate = (updatedXml) => {
    setXmlData(updatedXml);
    
    // Mark the current image as edited
    if (currentImage && imageViewerRef.current) {
      imageViewerRef.current.markAsEdited(currentImage.name);
    }
  };

  const handleMouseMove = (position) => {
    setMousePosition(position);
  };

  const handleSelectedObjectChange = (object) => {
    if (isSelectionLocked) return;
    
    setSelectedObject(object);
    // Set the selected object ID for attribute panel
    if (object) {
      setSelectedObjectId(object.id);
    } else {
      setSelectedObjectId(null);
    }
  };

  const handleAttributePanelObjectSelect = (objectId) => {
    setSelectedObjectId(objectId);
  };

  const handleAttributeChange = (hasChanges) => {
    setHasUnsavedChanges(hasChanges);
  };

  const handleLocationUpdate = (newLocation) => {
    if (selectedObject) {
      // Update the selected object's location
      // This would be handled by the InteractiveImageCanvas to update the actual data
      console.log('Location updated:', newLocation);
    }
  };

  return (
    <ThemeProvider>
      <AppContainer>
        <Header />
        
        {currentStep === 'folder-selection' && (
          <FolderSelection 
            onFoldersSelected={handleFoldersSelected}
          />
        )}
        
        {currentStep === 'config-selection' && (
          <ConfigSelection 
            folders={folders}
            qcType={qcType}
            onConfigSelected={handleConfigSelected}
            onBack={() => setCurrentStep('folder-selection')}
          />
        )}
        
        {currentStep === 'annotation' && (
          <MainContent>
            <LeftPanel>
              <ImageSection>
                <ImageViewer
                  ref={imageViewerRef}
                  folders={folders}
                  selectedConfig={selectedConfig}
                  qcType={qcType}
                  onImageSelected={handleImageSelected}
                  currentImage={currentImage}
                />
              </ImageSection>
              <ToolSection>
                <ToolPanel
                  qcType={qcType}
                  selectedObject={selectedObject}
                  onLocationUpdate={handleLocationUpdate}
                  currentImage={currentImage}
                  mousePosition={mousePosition}
                  imageRef={canvasRef}
                />
              </ToolSection>
            </LeftPanel>
            
            <CenterPanel>
              <InteractiveImageCanvas 
                ref={canvasRef}
                currentImage={currentImage}
                xmlData={xmlData}
                qcType={qcType}
                onXmlUpdate={handleXmlUpdate}
                selectedConfig={selectedConfig}
                onMouseMove={handleMouseMove}
                onSelectedObjectChange={handleSelectedObjectChange}
                selectedObjectId={selectedObjectId}
                isSelectionLocked={isSelectionLocked}
                setIsSelectionLocked={setIsSelectionLocked}
              />
            </CenterPanel>
            
            <RightPanel>
              <AttributePanel
                ref={attributePanelRef}
                selectedConfig={selectedConfig}
                xmlData={xmlData}
                currentImage={currentImage}
                qcType={qcType}
                onAttributeUpdate={(updatedXml) => setXmlData(updatedXml)}
                selectedObjectId={selectedObjectId}
                onObjectSelect={handleAttributePanelObjectSelect}
                onAttributeChange={handleAttributeChange}
                setIsSelectionLocked={setIsSelectionLocked}
              />
            </RightPanel>
          </MainContent>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
