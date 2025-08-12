import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSettings, FiCheck, FiArrowLeft, FiBox, FiLayers } from 'react-icons/fi';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--light-gray);
  border: 2px solid var(--border-gray);
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-black);
  transition: all 0.3s ease;

  &:hover {
    background: var(--secondary-yellow);
    transform: translateY(-2px);
  }
`;

const Title = styled.h2`
  color: var(--text-black);
  font-size: 28px;
  margin: 0;
`;

const StepContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const StepCard = styled.div`
  background: var(--accent-white);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 8px 24px var(--shadow);
  border: 2px solid ${props => props.selected ? 'var(--primary-orange)' : 'var(--border-gray)'};
`;

const StepTitle = styled.h3`
  color: var(--text-black);
  font-size: 20px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StepDescription = styled.p`
  color: var(--text-black);
  opacity: 0.8;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
`;

const OptionCard = styled.div`
  background: ${props => props.selected ? 'var(--primary-orange)' : 'var(--light-gray)'};
  color: ${props => props.selected ? 'var(--accent-white)' : 'var(--text-black)'};
  border: 2px solid ${props => props.selected ? 'var(--primary-orange)' : 'var(--border-gray)'};
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.selected ? 'var(--primary-orange)' : 'var(--secondary-yellow)'};
    transform: translateY(-2px);
  }
`;

const OptionIcon = styled.div`
  font-size: 24px;
  margin-bottom: 8px;
`;

const OptionTitle = styled.h4`
  font-size: 16px;
  margin-bottom: 8px;
  margin-top: 0;
`;

const OptionDescription = styled.p`
  font-size: 12px;
  opacity: 0.9;
  margin: 0;
  line-height: 1.4;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  background: var(--light-gray);
  border-radius: 12px;
  margin-top: 20px;
  font-size: 16px;
  color: var(--text-black);
`;

const ContinueButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  margin-top: 32px;
  align-self: center;
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

const ConfigSelection = ({ folders, onConfigSelected, onBack }) => {
  const [selectedQCType, setSelectedQCType] = useState(null);
  const [selectedAssetType, setSelectedAssetType] = useState(null);
  const [assetConfig, setAssetConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadAssetConfig();
  }, []);

  const loadAssetConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/config/asset_config.json');
      if (response.ok) {
        const config = await response.json();
        console.log('ConfigSelection: Loaded asset config:', config);
        setAssetConfig(config);
      } else {
        console.error('ConfigSelection: Failed to load asset config. Response status:', response.status);
        console.error('ConfigSelection: Response details:', response);
      }
    } catch (error) {
      console.error('ConfigSelection: Error loading asset config:', error);
    }
    setLoading(false);
  };

  const handleQCTypeSelect = (qcTypeKey) => {
    setSelectedQCType(qcTypeKey);
    setSelectedAssetType(null);
  };

  const handleAssetTypeSelect = (assetTypeKey) => {
    setSelectedAssetType(assetTypeKey);
  };

  const handleContinue = async () => {
    if (selectedQCType && selectedAssetType && assetConfig) {
      const qcType = assetConfig.qc_types[selectedQCType];
      const assetType = qcType.asset_types[selectedAssetType];
      
      const configData = {
        qc_type: {
          key: selectedQCType,
          name: qcType.name,
          description: qcType.description,
          file_format: qcType.file_format
        },
        asset_type: {
          key: selectedAssetType,
          name: assetType.name,
          description: assetType.description,
          attributes: assetType.attributes
        }
      };
      
      console.log('ConfigSelection: Selected configuration:', configData);
      
      // Save default attributes for all files in the label folder
      setSavingDefaults(true);
      setSaveMessage('Processing existing annotation files with default attributes...');
      
      try {
        console.log('ConfigSelection: Saving default attributes for existing annotation files...');
        const response = await fetch('http://localhost:5000/api/save-default-attributes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderPath: qcType.file_format === 'xml' ? folders.xmls : folders.xmls, // Annotation folder path
            imagesFolderPath: folders.images, // Images folder path
            qcType: selectedQCType,
            assetType: selectedAssetType,
            fileFormat: qcType.file_format
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('ConfigSelection: Successfully processed default attributes:', result);
          setSaveMessage(`✅ Successfully processed ${result.files_processed} annotation files and updated ${result.files_updated} files with default attributes for ${assetType.name}`);
          
          // Wait a moment to show the success message
          setTimeout(() => {
            setSavingDefaults(false);
            onConfigSelected(configData);
          }, 2000);
        } else {
          const errorText = await response.text();
          console.error('ConfigSelection: Failed to save default attributes:', errorText);
          setSaveMessage('❌ Failed to process annotation files. Please check your folder permissions.');
          setTimeout(() => setSavingDefaults(false), 3000);
        }
      } catch (error) {
        console.error('ConfigSelection: Error processing default attributes:', error);
        setSaveMessage('❌ Error connecting to backend. Please ensure the server is running.');
        setTimeout(() => setSavingDefaults(false), 3000);
      }
    }
  };

  if (loading) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading configuration...</p>
        </div>
      </Container>
    );
  }

  if (!assetConfig) {
    return (
      <Container>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Error loading configuration. Please check the asset_config.json file.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>
          <FiArrowLeft size={16} />
          Back to Folders
        </BackButton>
        <Title>Configure Quality Control</Title>
      </Header>

      <StepContainer>
        <StepCard selected={selectedQCType !== null}>
          <StepTitle>
            <FiSettings size={24} />
            Step 1: Select QC Type
          </StepTitle>
          <StepDescription>
            Choose the type of quality control analysis you want to perform.
          </StepDescription>
          <OptionGrid>
            {assetConfig && Object.entries(assetConfig.qc_types).map(([key, qcType]) => (
              <OptionCard
                key={key}
                selected={selectedQCType === key}
                onClick={() => handleQCTypeSelect(key)}
              >
                <OptionIcon>
                  {key === 'bb_qc' ? <FiBox /> : <FiLayers />}
                </OptionIcon>
                <OptionTitle>{qcType.name}</OptionTitle>
                <OptionDescription>
                  {qcType.description} • Format: {qcType.file_format.toUpperCase()}
                </OptionDescription>
              </OptionCard>
            ))}
          </OptionGrid>
        </StepCard>

        {selectedQCType && (
          <StepCard selected={selectedAssetType !== null}>
            <StepTitle>
              <FiCheck size={24} />
              Step 2: Select Asset Type
            </StepTitle>
            <StepDescription>
              Choose the specific type of asset you want to analyze.
            </StepDescription>
            <OptionGrid>
              {Object.entries(assetConfig.qc_types[selectedQCType].asset_types).map(([key, assetType]) => (
                <OptionCard
                  key={key}
                  selected={selectedAssetType === key}
                  onClick={() => handleAssetTypeSelect(key)}
                >
                  <OptionTitle>{assetType.name}</OptionTitle>
                  <OptionDescription>
                    {assetType.description}
                  </OptionDescription>
                </OptionCard>
              ))}
            </OptionGrid>
          </StepCard>
        )}

        {selectedQCType && selectedAssetType && (
          <>
            <ContinueButton onClick={handleContinue} disabled={savingDefaults}>
              {savingDefaults ? 'Initializing...' : 'Start Quality Control Analysis'}
            </ContinueButton>
            
            {savingDefaults && (
              <LoadingMessage>
                {saveMessage}
              </LoadingMessage>
            )}
          </>
        )}
      </StepContainer>
    </Container>
  );
};

export default ConfigSelection;
