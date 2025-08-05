import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import { FiSave, FiEdit3, FiCheck, FiX, FiCopy, FiMapPin } from 'react-icons/fi';

const Container = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 4px;
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
  padding: 8px 12px;
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
  margin-bottom: 4px;
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
  margin-bottom: 1px;
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
  background: ${props => props.selected ? 'rgba(255, 107, 53, 0.1)' : 'var(--light-gray)'};
  border: 2px solid ${props => props.selected ? 'var(--primary-orange)' : 'var(--border-gray)'};
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.selected ? 'rgba(255, 107, 53, 0.15)' : 'rgba(255, 107, 53, 0.05)'};
    border-color: var(--primary-orange);
  }
`;

const ObjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0px;
`;

const ObjectName = styled.span`
  font-weight: 500;
  font-size: 14px;
  color: var(--primary-orange);
  background: rgba(255, 107, 53, 0.1);
  padding: 1px 4px;
  border-radius: 8px;
  flex: 1;
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
  margin-left: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    background: #FFE55C;
  }
`;

// const ObjectDetails = styled.div`
//   margin-top: 8px;
// `;

const CustomAttributes = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 107, 53, 0.05);
  border-radius: 4px;
`;

const AttributeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
`;

const AttributeName = styled.span`
  font-weight: 500;
  color: var(--text-black);
`;

const AttributeValue = styled.span`
  color: #666;
  font-style: italic;
`;

const LatLngDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
`;

const EditDialog = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 300px;
`;

const EditDialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
`;

const DialogTitle = styled.h4`
  margin: 0 0 16px 0;
  color: var(--text-black);
`;

const DialogInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-gray);
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const DialogSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 2px solid var(--border-gray);
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: var(--primary-orange);
  }
`;

const DialogButtons = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const DialogButton = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  
  &.primary {
    background: var(--primary-orange);
    color: white;
    
    &:hover {
      background: #FF7700;
    }
  }
  
  &.secondary {
    background: var(--light-gray);
    color: var(--text-black);
    
    &:hover {
      background: var(--border-gray);
    }
  }
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

const ObjectTag = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
  display: inline-block;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const AttributePanel = forwardRef(({ selectedConfig, xmlData, currentImage, qcType, onAttributeUpdate, selectedObjectId, onObjectSelect, onAttributeChange, selectionSource }, ref) => {
  const [attributes, setAttributes] = useState({});
  const [existingObjects, setExistingObjects] = useState([]);
  const [status, setStatus] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', customAttributes: {} });

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

  // Handle external object selection changes (from canvas)
  useEffect(() => {
    if (selectionSource === 'canvas' && selectedObjectId !== null && selectedObjectId !== undefined && existingObjects.length > 0) {
      const selectedObj = existingObjects.find(obj => obj.id === selectedObjectId);
      if (selectedObj) {
        const mergedAttributes = mergeAttributesWithDefaults(selectedObj.customAttributes);
        setAttributes(mergedAttributes);
        setHasChanges(false);
      }
    }
  }, [selectedObjectId, existingObjects, selectionSource]);

  useEffect(() => {
    if (xmlData && selectedConfig && currentImage) {
      // Only parse when the image or xmlData actually changes
      parseXmlData();
    }
  }, [xmlData, selectedConfig, currentImage]);

  // Initialize attributes with default values when config changes
  useEffect(() => {
    if (selectedConfig?.asset_type?.attributes) {
      const defaultAttributes = {};
      Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attrConfig]) => {
        defaultAttributes[attrName] = attrConfig.default || '';
      });
      setAttributes(defaultAttributes);
    }
  }, [selectedConfig]);

  // Expose save function to parent via ref
  useImperativeHandle(ref, () => ({
    saveChanges: saveChanges
  }));

  // Helper function to merge existing attributes with defaults
  const mergeAttributesWithDefaults = (existingAttributes) => {
    const mergedAttributes = {};
    
    // First, set all default values from config
    if (selectedConfig?.asset_type?.attributes) {
      Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attrConfig]) => {
        mergedAttributes[attrName] = attrConfig.default || '';
      });
    }
    
    // Then, override with existing values where they exist
    Object.entries(existingAttributes).forEach(([attrName, value]) => {
      if (value && value.trim() !== '') { // Only use existing value if it's not empty
        mergedAttributes[attrName] = value;
      }
    });
    
    return mergedAttributes;
  };

  const parseXmlData = () => {
    try {
      if (qcType === 'detection') {
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

          // Extract lat/lng
          const latLngElement = obj.getElementsByTagName('latLng')[0];
          let latLng = null;
          if (latLngElement) {
            const latLngText = latLngElement.textContent;
            const match = latLngText.match(/\((.*?),\s*(.*?)\)/);
            if (match) {
              latLng = {
                lat: parseFloat(match[1]),
                lng: parseFloat(match[2])
              };
            }
          }

          // Extract custom attributes (excluding standard ones)
          const customAttrs = {};
          const standardTags = ['name', 'bndbox', 'latLng'];
          
          if (selectedConfig?.asset_type?.attributes) {
            Object.keys(selectedConfig.asset_type.attributes).forEach(attrName => {
              const element = obj.getElementsByTagName(attrName)[0];
              if (element) {
                customAttrs[attrName] = element.textContent;
              }
            });
          }

          // Also extract any other custom attributes not in config
          for (let i = 0; i < obj.children.length; i++) {
            const child = obj.children[i];
            if (!standardTags.includes(child.tagName) && !customAttrs[child.tagName]) {
              customAttrs[child.tagName] = child.textContent;
            }
          }

          return {
            id: index,
            name,
            bbox,
            latLng,
            customAttributes: customAttrs,
            element: obj
          };
        });

        setExistingObjects(objects);
        
        // Initialize attributes for the first object or create new with defaults
        if (objects.length > 0) {
          const firstObjectId = 0;
          if (onObjectSelect) {
            onObjectSelect(firstObjectId); // Notify parent about selection
          }
          const mergedAttributes = mergeAttributesWithDefaults(objects[0].customAttributes);
          setAttributes(mergedAttributes);
        }
      } else if (qcType === 'segmentation') {
        // Parse JSON data for segmentation
        let jsonData = xmlData;
        if (typeof xmlData === 'string') {
          jsonData = JSON.parse(xmlData);
        }
        
        if (jsonData.shapes) {
          const objects = jsonData.shapes.map((shape, index) => {
            const latLng = shape.LatLng ? {
              lat: shape.LatLng[0],
              lng: shape.LatLng[1]
            } : null;

            const customAttrs = shape.flags || {};

            return {
              id: index,
              name: shape.label,
              latLng,
              customAttributes: customAttrs,
              element: shape
            };
          });

          setExistingObjects(objects);
          
          if (objects.length > 0) {
            const firstObjectId = 0;
            if (onObjectSelect) {
              onObjectSelect(firstObjectId); // Notify parent about selection
            }
            const mergedAttributes = mergeAttributesWithDefaults(objects[0].customAttributes);
            setAttributes(mergedAttributes);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      setStatus({ type: 'error', message: 'Error parsing annotation file' });
    }
  };

  const handleAttributeChange = (attrName, value) => {
    // Immediately update the UI state
    setAttributes(prev => {
      const updated = {
        ...prev,
        [attrName]: value
      };
      return updated;
    });
    
    const newHasChanges = true;
    setHasChanges(newHasChanges);
    
    // Notify parent about changes
    if (onAttributeChange) {
      onAttributeChange(newHasChanges);
    }
    
    // Immediately update the selected object's attributes in memory
    if (selectedObjectId !== null && existingObjects.length > 0) {
      const updatedObjects = existingObjects.map(obj => {
        if (obj.id === selectedObjectId) {
          return {
            ...obj,
            customAttributes: {
              ...obj.customAttributes,
              [attrName]: value
            }
          };
        }
        return obj;
      });
      setExistingObjects(updatedObjects);
    }
  };

  // Handle object selection for attribute viewing
  const handleObjectSelect = (obj) => {
    // Save current changes to the previously selected object
    if (hasChanges && selectedObjectId !== null) {
      saveAttributesToObject(selectedObjectId);
    }
    
    // Select new object and load its attributes
    const newObjectId = obj.id;
    if (onObjectSelect && selectionSource !== 'canvas') {
      onObjectSelect(newObjectId);
    }
    
    const mergedAttributes = mergeAttributesWithDefaults(obj.customAttributes);
    setAttributes(mergedAttributes);
    setHasChanges(false);
  };

  // Save attributes to a specific object
  const saveAttributesToObject = (objectId) => {
    if (qcType === 'detection') {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
        const objects = xmlDoc.getElementsByTagName('object');
        const targetObject = objects[objectId];

        if (targetObject && selectedConfig?.asset_type?.attributes) {
          Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attr]) => {
            let element = targetObject.getElementsByTagName(attrName)[0];
            
            if (!element) {
              element = xmlDoc.createElement(attrName);
              targetObject.appendChild(element);
            }
            
            element.textContent = attributes[attrName] || '';
          });

          const serializer = new XMLSerializer();
          const updatedXml = serializer.serializeToString(xmlDoc);
          onAttributeUpdate(updatedXml);
        }
      } catch (error) {
        console.error('Error saving attributes to object:', error);
      }
    }
  };

  // Edit object handlers
  const handleEditObject = (obj) => {
    setEditingObject(obj);
    setEditForm({
      name: obj.name,
      customAttributes: {} // Only editing name, custom attributes handled by main panel
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditAttributeChange = (attrName, value) => {
    setEditForm(prev => ({
      ...prev,
      customAttributes: {
        ...prev.customAttributes,
        [attrName]: value
      }
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingObject) return;

    try {
      if (qcType === 'detection') {
        // Update XML data - only updating the name
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlData, 'text/xml');
        const objects = xmlDoc.getElementsByTagName('object');
        const targetObject = objects[editingObject.id];

        if (targetObject) {
          // Update name only
          const nameElement = targetObject.getElementsByTagName('name')[0];
          if (nameElement) {
            nameElement.textContent = editForm.name;
          }

          // Serialize and update
          const serializer = new XMLSerializer();
          const updatedXml = serializer.serializeToString(xmlDoc);
          onAttributeUpdate(updatedXml);
          setStatus({ type: 'success', message: 'Object name updated successfully!' });
        }
      } else if (qcType === 'segmentation') {
        // Update JSON data - only updating the name
        let jsonData = typeof xmlData === 'string' ? JSON.parse(xmlData) : xmlData;
        
        if (jsonData.shapes && jsonData.shapes[editingObject.id]) {
          jsonData.shapes[editingObject.id].label = editForm.name;
          
          onAttributeUpdate(jsonData);
          setStatus({ type: 'success', message: 'Object name updated successfully!' });
        }
      }

      setEditingObject(null);
      setTimeout(() => setStatus(null), 2000);
    } catch (error) {
      console.error('Error updating object:', error);
      setStatus({ type: 'error', message: 'Failed to update object name' });
      setTimeout(() => setStatus(null), 2000);
    }
  };

  const handleCancelEdit = () => {
    setEditingObject(null);
    setEditForm({ name: '', customAttributes: {} });
  };

  const saveChanges = async () => {
    try {
      if (!selectedConfig || !currentImage) return;

      let dataToSave = xmlData;
      
      if (qcType === 'detection') {
        // Handle XML data for bounding box QC
        if (!xmlData) {
          // Create new XML if none exists
          dataToSave = `<?xml version="1.0" encoding="UTF-8"?>
<annotation>
  <folder>${currentImage.folder || 'images'}</folder>
  <filename>${currentImage.name}</filename>
  <path>${currentImage.path}</path>
  <source>
    <database>Unknown</database>
  </source>
  <size>
    <width>1</width>
    <height>1</height>
    <depth>3</depth>
  </size>
  <segmented>0</segmented>
</annotation>`;
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(dataToSave, 'text/xml');
        
        // Save attributes to the currently selected object
        if (selectedObjectId !== null) {
          let targetObject = xmlDoc.getElementsByTagName('object')[selectedObjectId];
          
          if (targetObject) {
            // Update/add custom attributes with current values (including defaults)
            Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attrConfig]) => {
              let element = targetObject.getElementsByTagName(attrName)[0];
              
              if (!element) {
                element = xmlDoc.createElement(attrName);
                targetObject.appendChild(element);
              }
              
              // Use current attribute value or default if empty
              const currentValue = attributes[attrName];
              const defaultValue = attrConfig.default || '';
              element.textContent = currentValue || defaultValue;
            });
          }
        }

        // Convert back to string
        const serializer = new XMLSerializer();
        dataToSave = serializer.serializeToString(xmlDoc);
        
      } else if (qcType === 'segmentation') {
        // Handle JSON data for segmentation QC
        if (!dataToSave) {
          // Create new JSON structure if none exists
          dataToSave = JSON.stringify({
            image: currentImage.name,
            objects: []
          }, null, 2);
        }

        try {
          const jsonData = JSON.parse(dataToSave);
          
          // Save attributes to the currently selected object
          if (selectedObjectId !== null && jsonData.objects && jsonData.objects[selectedObjectId]) {
            const targetObject = jsonData.objects[selectedObjectId];
            
            // Update/add custom attributes with current values (including defaults)
            if (!targetObject.attributes) {
              targetObject.attributes = {};
            }
            
            Object.entries(selectedConfig.asset_type.attributes).forEach(([attrName, attrConfig]) => {
              // Use current attribute value or default if empty
              const currentValue = attributes[attrName];
              const defaultValue = attrConfig.default || '';
              targetObject.attributes[attrName] = currentValue || defaultValue;
            });
          }
          
          dataToSave = JSON.stringify(jsonData, null, 2);
        } catch (jsonError) {
          console.error('Error parsing JSON data:', jsonError);
          setStatus({ type: 'error', message: 'Invalid JSON data format' });
          return;
        }
      }

      // Save to file
      if (window.require) {
        const { ipcRenderer } = window.require('electron');
        const fileExtension = qcType === 'detection' ? '.xml' : '.json';
        const filePath = currentImage.xmlFile || currentImage.path.replace(/\.(jpg|jpeg|png|bmp|gif)$/i, fileExtension);
        
        const success = await ipcRenderer.invoke('write-xml-file', filePath, dataToSave);
        
        if (success) {
          setStatus({ type: 'success', message: 'Changes saved successfully!' });
          setHasChanges(false);
          
          // Notify parent about changes and reset change state
          if (onAttributeChange) {
            onAttributeChange(false);
          }
          
          onAttributeUpdate(dataToSave);
        } else {
          setStatus({ type: 'error', message: 'Failed to save changes' });
        }
      } else {
        // Fallback for development without Electron
        setStatus({ type: 'success', message: 'Changes would be saved in production!' });
        setHasChanges(false);
        
        if (onAttributeChange) {
          onAttributeChange(false);
        }
        
        onAttributeUpdate(dataToSave);
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
        <Title>Attributes</Title>
        <SaveButton onClick={saveChanges} disabled={!hasChanges}>
          <FiSave size={14} />
          Save Changes
          {existingObjects.length > 0 && selectedObjectId !== null && (
            <span style={{ fontSize: '10px', opacity: 0.8 }}>
              (for "{existingObjects[selectedObjectId]?.name}")
            </span>
          )}
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
              <ExistingObject 
                key={obj.id} 
                selected={selectedObjectId === obj.id}
              >
                <ObjectHeader>
                  <ObjectName>{obj.name} {selectedObjectId === obj.id && '(Selected)'}</ObjectName>
                  <EditButton onClick={(e) => {
                    e.stopPropagation(); // Prevent object selection when clicking edit
                    handleEditObject(obj);
                  }}>
                    <FiEdit3 size={12} />
                    Edit Name
                  </EditButton>
                </ObjectHeader>
{/*                 
                {obj.bbox && (
                  <ObjectDetails>
                    <div style={{fontSize: '12px', color: 'var(--text-black)', opacity: 0.8}}>
                      Bbox: ({obj.bbox.xmin}, {obj.bbox.ymin}) - ({obj.bbox.xmax}, {obj.bbox.ymax})
                    </div>
                  </ObjectDetails>
                )}
                 */}
                {/* {obj.latLng && (
                  <LatLngDisplay>
                    <FiMapPin size={12} />
                    Lat: {obj.latLng.lat.toFixed(6)}, Lng: {obj.latLng.lng.toFixed(6)}
                  </LatLngDisplay>
                )} */}
                

              </ExistingObject>
            ))}
          </Section>
        )}

        <Section>
          <SectionTitle>
            Custom Attributes 
            {existingObjects.length > 0 && selectedObjectId !== null && (
              <span style={{ color: 'var(--primary-orange)', fontWeight: 'normal', fontSize: '12px' }}>
                (for "{existingObjects[selectedObjectId]?.name}")
              </span>
            )}
          </SectionTitle>
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
            </div>
          </Section>
        )}
      </Content>
      
      {/* Edit Dialog - Name Only */}
      {editingObject && (
        <>
          <EditDialogOverlay onClick={handleCancelEdit} />
          <EditDialog>
            <DialogTitle>Edit Object Name</DialogTitle>
            
            <AttributeLabel>Object Name</AttributeLabel>
            <DialogInput
              type="text"
              value={editForm.name}
              onChange={(e) => handleEditFormChange('name', e.target.value)}
              placeholder="Enter object name"
            />
            
            <DialogButtons>
              <DialogButton className="secondary" onClick={handleCancelEdit}>
                Cancel
              </DialogButton>
              <DialogButton className="primary" onClick={handleSaveEdit}>
                Save Name
              </DialogButton>
            </DialogButtons>
          </EditDialog>
        </>
      )}
    </Container>
  );
});

export default AttributePanel;
