import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiSave, FiEdit3, FiCheck, FiX, FiCopy } from 'react-icons/fi';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 16px;
  background: var(--light-gray);
  border-bottom: 1px solid var(--border-gray);
`;

const Title = styled.h3`
  color: var(--text-black);
  font-size: 16px;
  margin-bottom: 8px;
`;

const SaveButton = styled.button`
  background: var(--primary-orange);
  color: var(--accent-white);
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    background: #FF7700;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h4`
  color: var(--text-black);
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--secondary-yellow);
`;

const AttributeGroup = styled.div`
  margin-bottom: 16px;
`;

const AttributeLabel = styled.label`
  display: block;
  color: var(--text-black);
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-gray);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-gray);
  border-radius: 6px;
  font-size: 14px;
  background: var(--accent-white);
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-gray);
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const ExistingObject = styled.div`
  background: var(--light-gray);
  border: 2px solid var(--border-gray);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
`;

const ObjectHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
`;

const ObjectName = styled.span`
  font-weight: 500;
  font-size: 14px;
  color: var(--primary-orange);
  background: rgba(255, 107, 53, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
`;

const EditButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const StatusIndicator = styled.div`
  padding: 16px;
  background: ${props => 
    props.type === 'success' ? '#d4edda' : 
    props.type === 'error' ? '#f8d7da' : 
    '#fff3cd'};
  color: ${props => 
    props.type === 'success' ? '#155724' : 
    props.type === 'error' ? '#721c24' : 
    '#856404'};
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
`;

const CopyButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  
  &:hover {
    background: #FFE55C;
  }
`;

const PathContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
`;

const AttributePanel = ({ selectedConfig, xmlData, currentImage, onAttributeUpdate }) => {
  const [attributes, setAttributes] = useState({});
  const [existingObjects, setExistingObjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Function to copy path to clipboard
  const copyPathToClipboard = async (path) => {
    try {
      await navigator.clipboard.writeText(path);
      setStatus({ type: 'success', message: 'Path copied to clipboard!' });
      setTimeout(() => setStatus(null), 2000);
    } catch (err) {
      console.error('Failed to copy path:', err);
      setStatus({ type: 'error', message: 'Failed to copy path' });
      setTimeout(() => setStatus(null), 2000);
    }
  };

  useEffect(() => {
    if (xmlData && selectedConfig) {
      parseXmlData();
    }
  }, [xmlData, selectedConfig]);

  const parseXmlData = () => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      // Extract existing objects
      const objects = Array.from(xmlDoc.getElementsByTagName('object')).map((obj, index) => {
        const name = obj.getElementsByTagName('name')[0]?.textContent || 'Unknown';
        const bndbox = obj.getElementsByTagName('bndbox')[0];
        
        let bbox = null;
        if (bndbox) {
          bbox = {
            xmin: bndbox.getElementsByTagName('xmin')[0]?.textContent,
            ymin: bndbox.getElementsByTagName('ymin')[0]?.textContent,
            xmax: bndbox.getElementsByTagName('xmax')[0]?.textContent,
            ymax: bndbox.getElementsByTagName('ymax')[0]?.textContent
          };
        }

        // Extract custom attributes
        const customAttrs = {};
        Object.keys(selectedConfig.asset_type.attributes).forEach(attrName => {
          const element = obj.getElementsByTagName(attrName)[0];
          if (element) {
            customAttrs[attrName] = element.textContent;
          }
        });

        return {
          id: index,
          name,
          bbox,
          customAttributes: customAttrs,
          element: obj
        };
      });

      setExistingObjects(objects);
      
      // Initialize attributes for the first object or create new
      if (objects.length > 0) {
        setAttributes(objects[0].customAttributes);
      } else {
        // Initialize empty attributes
        const emptyAttrs = {};
        Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attr]) => {
          emptyAttrs[attrName] = attr.type === 'number' ? 0 : '';
        });
        setAttributes(emptyAttrs);
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Error parsing XML:', error);
      setStatus({ type: 'error', message: 'Error parsing XML file' });
    }
  };

  const handleAttributeChange = (attrName, value) => {
    setAttributes(prev => ({
      ...prev,
      [attrName]: value
    }));
    setHasChanges(true);
  };

  const saveChanges = async () => {
    try {
      if (!xmlData || !currentImage) return;

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
      
      // Update or add custom attributes to the first object
      let targetObject = xmlDoc.getElementsByTagName('object')[0];
      
      if (!targetObject) {
        // Create new object if none exists
        const annotation = xmlDoc.getElementsByTagName('annotation')[0];
        if (annotation) {
          targetObject = xmlDoc.createElement('object');
          
          const nameElement = xmlDoc.createElement('name');
          nameElement.textContent = 'object';
          targetObject.appendChild(nameElement);
          
          annotation.appendChild(targetObject);
        }
      }

      if (targetObject) {
        // Update custom attributes
        Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attr]) => {
          let element = targetObject.getElementsByTagName(attrName)[0];
          
          if (!element) {
            element = xmlDoc.createElement(attrName);
            targetObject.appendChild(element);
          }
          
          element.textContent = attributes[attrName] || '';
        });

        // Convert back to string
        const serializer = new XMLSerializer();
        const updatedXml = serializer.serializeToString(xmlDoc);
        
        // Save to file
        if (window.require) {
          const { ipcRenderer } = window.require('electron');
          const success = await ipcRenderer.invoke('write-xml-file', currentImage.xmlFile, updatedXml);
          
          if (success) {
            setStatus({ type: 'success', message: 'Changes saved successfully!' });
            setHasChanges(false);
            onAttributeUpdate(updatedXml);
          } else {
            setStatus({ type: 'error', message: 'Failed to save changes' });
          }
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      setStatus({ type: 'error', message: 'Error saving changes: ' + error.message });
    }

    // Clear status after 3 seconds
    setTimeout(() => setStatus(null), 3000);
  };

  const renderAttributeInput = (attr) => {
    const value = attributes[attr.name] || '';

    switch (attr.type) {
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
            min={attr.min}
            max={attr.max}
            step={attr.step}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
          >
            <option value="">Select...</option>
            {attr.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </Select>
        );
      
      case 'textarea':
        return (
          <TextArea
            value={value}
            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
            placeholder={`Enter ${attr.name}...`}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
            placeholder={`Enter ${attr.name}...`}
          />
        );
    }
  };

  if (!selectedConfig || !selectedConfig.asset_type || !selectedConfig.asset_type.attributes) {
    return (
      <Container>
        <Header>
          <Title>No Configuration Selected</Title>
        </Header>
      </Container>
    );
  }

  // Convert attributes object to array for mapping
  const attributesArray = Object.entries(selectedConfig.asset_type.attributes).map(([key, attr]) => ({
    name: key,
    ...attr
  }));

  return (
    <Container>
      <Header>
        <Title>Quality Control Attributes</Title>
        <SaveButton onClick={saveChanges} disabled={!hasChanges}>
          <FiSave size={14} />
          Save Changes
        </SaveButton>
      </Header>

      <Content>
        {status && (
          <StatusIndicator type={status.type}>
            {status.message}
          </StatusIndicator>
        )}

        {existingObjects.length > 0 && (
          <Section>
            <SectionTitle>Existing Objects</SectionTitle>
            {existingObjects.map(obj => (
              <ExistingObject key={obj.id}>
                <ObjectHeader>
                  <ObjectName>{obj.name}</ObjectName>
                  <EditButton>
                    <FiEdit3 size={12} />
                    Edit
                  </EditButton>
                </ObjectHeader>
                {obj.bbox && (
                  <div style={{fontSize: '12px', color: 'var(--text-black)', opacity: 0.8}}>
                    Bbox: ({obj.bbox.xmin}, {obj.bbox.ymin}) - ({obj.bbox.xmax}, {obj.bbox.ymax})
                  </div>
                )}
              </ExistingObject>
            ))}
          </Section>
        )}

        <Section>
          <SectionTitle>Custom Attributes</SectionTitle>
          {attributesArray.map(attr => (
            <AttributeGroup key={attr.name}>
              <AttributeLabel>
                {attr.label || attr.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </AttributeLabel>
              {renderAttributeInput(attr)}
            </AttributeGroup>
          ))}
        </Section>

        {currentImage && (
          <Section>
            <SectionTitle>Image Information</SectionTitle>
            <div style={{fontSize: '14px', color: 'var(--text-black)'}}>
              <PathContainer>
                <strong>Path:</strong> 
                <span style={{marginLeft: '8px', wordBreak: 'break-all', fontSize: '12px'}}>
                  {currentImage.fullPath || currentImage.name}
                </span>
                <CopyButton 
                  onClick={() => copyPathToClipboard(currentImage.fullPath || currentImage.name)}
                  title="Copy path to clipboard"
                >
                  <FiCopy size={12} />
                  Copy
                </CopyButton>
              </PathContainer>
              <div style={{marginTop: '8px'}}>
                <strong>XML:</strong> {currentImage.hasXml ? 'Available' : 'Not found'}
              </div>
            </div>
          </Section>
        )}
      </Content>
    </Container>
  );
};

export default AttributePanel;
