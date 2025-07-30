import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import Header from './components/Header';
import FolderSelection from './components/FolderSelection';
import ConfigSelection from './components/ConfigSelection';
import ImageViewer from './components/ImageViewer';
import InteractiveImageCanvas from './components/InteractiveImageCanvas';
import ImageCanvas from './components/ImageCanvas';
import AttributePanel from './components/AttributePanel';
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
  const [folders, setFolders] = useState({
    images: null,
    xmls: null,
    combined: null
  });
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [imageList, setImageList] = useState([]);
  const [xmlData, setXmlData] = useState(null);
  const imageViewerRef = useRef(null);

  const handleFoldersSelected = (folderData) => {
    setFolders(folderData);
    setCurrentStep('config-selection');
  };

  const handleConfigSelected = (config) => {
    setSelectedConfig(config);
    setCurrentStep('annotation');
  };

  const handleImageSelected = (image, xmlContent) => {
    setCurrentImage(image);
    setXmlData(xmlContent);
  };

  const handleXmlUpdate = (updatedXml) => {
    setXmlData(updatedXml);
    
    // Mark the current image as edited
    if (currentImage && imageViewerRef.current) {
      imageViewerRef.current.markAsEdited(currentImage.name);
    }
  };

  return (
    <ThemeProvider>
      <AppContainer>
        <Header />
        
        {currentStep === 'folder-selection' && (
          <FolderSelection onFoldersSelected={handleFoldersSelected} />
        )}
        
        {currentStep === 'config-selection' && (
          <ConfigSelection 
            folders={folders}
            onConfigSelected={handleConfigSelected}
            onBack={() => setCurrentStep('folder-selection')}
          />
        )}
        
        {currentStep === 'annotation' && (
          <MainContent>
            <LeftPanel>
              <ImageViewer
                ref={imageViewerRef}
                folders={folders}
                selectedConfig={selectedConfig}
                onImageSelected={handleImageSelected}
                currentImage={currentImage}
              />
            </LeftPanel>
            
            <CenterPanel>
              <InteractiveImageCanvas 
                currentImage={currentImage}
                xmlData={xmlData}
                onXmlUpdate={handleXmlUpdate}
                selectedConfig={selectedConfig}
              />
            </CenterPanel>
            
            <RightPanel>
              <AttributePanel
                selectedConfig={selectedConfig}
                xmlData={xmlData}
                currentImage={currentImage}
                onAttributeUpdate={(updatedXml) => setXmlData(updatedXml)}
              />
            </RightPanel>
          </MainContent>
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
