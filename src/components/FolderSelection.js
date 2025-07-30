import React, { useState } from 'react';
import styled from 'styled-components';
import { FiFolder, FiFolderPlus } from 'react-icons/fi';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 80px);
  padding: 40px;
`;

const Card = styled.div`
  background: var(--accent-white);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 24px var(--shadow);
  max-width: 600px;
  width: 100%;
`;

const Title = styled.h2`
  color: var(--text-black);
  font-size: 24px;
  margin-bottom: 32px;
  text-align: center;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  background: ${props => props.selected ? 'var(--primary-orange)' : 'var(--light-gray)'};
  color: ${props => props.selected ? 'var(--accent-white)' : 'var(--text-black)'};
  border: 2px solid ${props => props.selected ? 'var(--primary-orange)' : 'var(--border-gray)'};
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.selected ? '#FF7700' : 'var(--secondary-yellow)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px var(--shadow);
  }
`;

const PathDisplay = styled.div`
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--light-gray);
  border-radius: 6px;
  font-size: 12px;
  color: var(--text-black);
  word-break: break-all;
`;

const ManualInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 2px solid var(--border-gray);
  border-radius: 8px;
  font-size: 14px;
  margin-top: 8px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const ToggleButton = styled.button`
  background: transparent;
  color: var(--primary-orange);
  border: 1px solid var(--primary-orange);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 12px;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary-orange);
    color: var(--accent-white);
  }
`;

const NextButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin-top: 32px;
  transition: all 0.3s ease;

  &:hover {
    background: #FFE55C;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const DefaultButton = styled.button`
  background: var(--primary-orange);
  color: var(--accent-white);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    background: #FF7700;
    transform: translateY(-2px);
  }
`;

const FolderSelection = ({ onFoldersSelected }) => {
  const [selectedMode, setSelectedMode] = useState(null);
  const [imagePath, setImagePath] = useState('');
  const [xmlPath, setXmlPath] = useState('');
  const [combinedPath, setCombinedPath] = useState('');
  const [manualInput, setManualInput] = useState(false);

  // Default paths
  const defaultImagePath = 'C:\\Users\\z-pc\\Desktop\\smart-QC\\test_data\\images';
  const defaultXmlPath = 'C:\\Users\\z-pc\\Desktop\\smart-QC\\test_data\\xml_files';

  const useDefaultPaths = () => {
    setSelectedMode('separate');
    setImagePath(defaultImagePath);
    setXmlPath(defaultXmlPath);
    setManualInput(true); // Show the manual input fields with default values
  };

  const selectFolder = async (type) => {
    console.log('FolderSelection: selectFolder called with type:', type);
    try {
      if (window.electronAPI) {
        console.log('FolderSelection: Using Electron API');
        // Electron environment - use native dialog
        const result = await window.electronAPI.selectFolder();
        console.log('FolderSelection: Folder selection result:', result);
        if (result) {
          updatePath(type, result);
        }
      } else {
        console.log('FolderSelection: Browser environment detected');
        // Browser environment - enable manual input
        setManualInput(true);
        alert('Folder selection not available in browser. Please use manual input below.');
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      setManualInput(true);
    }
  };

  const updatePath = (type, path) => {
    if (type === 'images') {
      setImagePath(path);
    } else if (type === 'xml') {
      setXmlPath(path);
    } else if (type === 'combined') {
      setCombinedPath(path);
    }
  };

  const handleManualInputChange = (type, value) => {
    updatePath(type, value);
  };

  const isReady = () => {
    if (selectedMode === 'separate') {
      return imagePath && xmlPath;
    } else if (selectedMode === 'combined') {
      return combinedPath;
    }
    return false;
  };

  const handleNext = () => {
    console.log('FolderSelection: handleNext called');
    console.log('FolderSelection: selectedMode:', selectedMode);
    console.log('FolderSelection: imagePath:', imagePath);
    console.log('FolderSelection: xmlPath:', xmlPath);
    console.log('FolderSelection: combinedPath:', combinedPath);
    
    if (isReady()) {
      if (selectedMode === 'separate') {
        const folderData = {
          images: imagePath,
          xmls: xmlPath,
          mode: 'separate'
        };
        console.log('FolderSelection: Sending folder data (separate):', folderData);
        onFoldersSelected(folderData);
      } else {
        const folderData = {
          images: combinedPath,
          xmls: combinedPath,
          mode: 'combined'
        };
        console.log('FolderSelection: Sending folder data (combined):', folderData);
        onFoldersSelected(folderData);
      }
    }
  };

  const renderFolderSelector = (type, path, label) => (
    <div>
      <SelectButton
        selected={path !== ''}
        onClick={() => selectFolder(type)}
      >
        <FiFolder size={20} />
        {label}
      </SelectButton>
      {path && <PathDisplay>{path}</PathDisplay>}
      {manualInput && (
        <ManualInput
          type="text"
          placeholder={`Enter ${label.toLowerCase()} path manually...`}
          value={path}
          onChange={(e) => handleManualInputChange(type, e.target.value)}
        />
      )}
    </div>
  );

  return (
    <Container>
      <Card>
        <Title>Select Image and XML Folders</Title>
        
        <DefaultButton onClick={useDefaultPaths}>
          Use Default Test Folders
        </DefaultButton>
        
        <ButtonGroup style={{ marginTop: '20px' }}>
          <SelectButton
            selected={selectedMode === 'separate'}
            onClick={() => setSelectedMode('separate')}
          >
            <FiFolder size={20} />
            Separate Folders for Images and XML
          </SelectButton>

          <SelectButton
            selected={selectedMode === 'combined'}
            onClick={() => setSelectedMode('combined')}
          >
            <FiFolderPlus size={20} />
            Combined Folder (Images and XML together)
          </SelectButton>
        </ButtonGroup>

        {selectedMode === 'separate' && (
          <div style={{ marginTop: '32px' }}>
            <ButtonGroup>
              {renderFolderSelector('images', imagePath, 'Select Images Folder')}
              {renderFolderSelector('xml', xmlPath, 'Select XML Folder')}
            </ButtonGroup>
          </div>
        )}

        {selectedMode === 'combined' && (
          <div style={{ marginTop: '32px' }}>
            <ButtonGroup>
              {renderFolderSelector('combined', combinedPath, 'Select Combined Folder')}
            </ButtonGroup>
          </div>
        )}

        {!manualInput && selectedMode && (
          <ToggleButton onClick={() => setManualInput(true)}>
            Use Manual Input Instead
          </ToggleButton>
        )}

        <NextButton onClick={handleNext} disabled={!isReady()}>
          Continue
        </NextButton>
      </Card>
    </Container>
  );
};

export default FolderSelection;
