import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiImage, FiFileText, FiChevronLeft, FiChevronRight, FiEdit3 } from 'react-icons/fi';

const Container = styled.div`
  height: 50%;
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

const Stats = styled.div`
  font-size: 12px;
  color: var(--text-black);
  opacity: 0.8;
`;

const ImageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
`;

const ImageItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin: 4px 0;
  border-radius: 8px;
  cursor: pointer;
  background: ${props => props.selected ? 'var(--primary-orange)' : 'var(--accent-white)'};
  color: ${props => props.selected ? 'var(--accent-white)' : 'var(--text-black)'};
  border: 2px solid ${props => props.selected ? 'var(--primary-orange)' : 'var(--border-gray)'};
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.selected ? 'var(--primary-orange)' : 'var(--secondary-yellow)'};
    transform: translateX(4px);
  }
`;

const ImageIcon = styled.div`
  font-size: 18px;
  display: flex;
  align-items: center;
`;

const ImageInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ImageName = styled.div`
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const XmlStatus = styled.div`
  font-size: 12px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const EditedIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #28a745;
  font-weight: 600;
`;

const Navigation = styled.div`
  padding: 16px;
  background: var(--light-gray);
  border-top: 1px solid var(--border-gray);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NavButton = styled.button`
  background: var(--secondary-yellow);
  color: var(--text-black);
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    background: #FFE55C;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImageViewer = React.forwardRef(({ folders, selectedConfig, onImageSelected, currentImage }, ref) => {
  const [imageList, setImageList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editedImages, setEditedImages] = useState(new Set()); // Track edited images

  useEffect(() => {
    console.log('ImageViewer: folders changed:', folders);
    if (folders && (folders.images || folders.combined)) {
      loadImageList();
    }
  }, [folders]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Only handle keyboard navigation if we have images loaded
      if (imageList.length === 0) return;
      
      const key = event.key.toLowerCase();
      
      if (key === 'a') {
        event.preventDefault();
        navigatePrevious();
      } else if (key === 'd') {
        event.preventDefault();
        navigateNext();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyPress);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [imageList.length, currentIndex]); // Dependencies to ensure current state is used

  const loadImageList = async () => {
    console.log('ImageViewer: loadImageList called with folders:', folders);
    setLoading(true);
    try {
      if (window.electronAPI) {
        console.log('ImageViewer: Using Electron API');
        const imageFolderContent = await window.electronAPI.readFolderContents(folders.images);
        console.log('ImageViewer: Image folder content:', imageFolderContent);
        
        const xmlFolderContent = folders.xmls !== folders.images 
          ? await window.electronAPI.readFolderContents(folders.xmls)
          : imageFolderContent;
        console.log('ImageViewer: XML folder content:', xmlFolderContent);

        if (imageFolderContent && xmlFolderContent) {
          const images = imageFolderContent.images.map(imageFile => {
            const baseName = imageFile.split('.')[0]; // Simple basename extraction
            const xmlFile = xmlFolderContent.xmls.find(xml => 
              xml.split('.')[0] === baseName
            );
            
            return {
              name: imageFile,
              baseName,
              fullPath: `${folders.images}/${imageFile}`, // Use forward slashes for consistency
              xmlFile: xmlFile ? `${folders.xmls}/${xmlFile}` : null,
              hasXml: !!xmlFile
            };
          });

          console.log('ImageViewer: Processed images:', images);
          setImageList(images);
          if (images.length > 0) {
            selectImage(0, images[0]);
          }
        }
      } else {
        console.log('ImageViewer: Using browser API with backend');
        // Browser environment - use backend API
        // First, configure the backend with folder paths
        try {
          const configResponse = await fetch('http://localhost:5000/api/set-folders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_folder: folders.images,
              xml_folder: folders.xmls
            })
          });
          
          if (configResponse.ok) {
            console.log('ImageViewer: Backend configured with folders');
            
            // Now get the folder contents
            const imagesResponse = await fetch(`http://localhost:5000/api/get-images?folder=${encodeURIComponent(folders.images)}`);
            const xmlsResponse = await fetch(`http://localhost:5000/api/get-xmls?folder=${encodeURIComponent(folders.xmls)}`);
            
            if (imagesResponse.ok && xmlsResponse.ok) {
              const imagesData = await imagesResponse.json();
              const xmlsData = await xmlsResponse.json();
              
              const images = imagesData.images.map(imageFile => {
                const baseName = imageFile.split('.')[0];
                const xmlFile = xmlsData.xmls.find(xml => 
                  xml.split('.')[0] === baseName
                );
                
                return {
                  name: imageFile,
                  baseName,
                  fullPath: `${folders.images}/${imageFile}`,
                  xmlFile: xmlFile ? `${folders.xmls}/${xmlFile}` : null,
                  hasXml: !!xmlFile
                };
              });
              
              console.log('ImageViewer: Processed images from backend:', images);
              setImageList(images);
              if (images.length > 0) {
                selectImage(0, images[0]);
              }
            }
          }
        } catch (error) {
          console.error('ImageViewer: Backend API error:', error);
          // Fallback to mock data
          const mockImages = [
            {
              name: 'sample1.jpg',
              baseName: 'sample1',
              fullPath: '/mock/images/sample1.jpg',
              xmlFile: '/mock/xml/sample1.xml',
              hasXml: true
            }
          ];
          setImageList(mockImages);
          if (mockImages.length > 0) {
            selectImage(0, mockImages[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading image list:', error);
    }
    setLoading(false);
  };

  const selectImage = async (index, image) => {
    console.log('ImageViewer: Selecting image:', image);
    setCurrentIndex(index);
    
    let xmlContent = null;
    if (image.xmlFile) {
      if (window.electronAPI) {
        console.log('ImageViewer: Loading XML via Electron:', image.xmlFile);
        xmlContent = await window.electronAPI.readXmlFile(image.xmlFile);
      } else {
        // Load XML via Flask backend
        try {
          console.log('ImageViewer: Loading XML via Flask backend:', image.xmlFile);
          const xmlFileName = image.xmlFile.split('/').pop(); // Get just the filename
          const response = await fetch(`http://localhost:5000/api/xml/${xmlFileName}`);
          if (response.ok) {
            xmlContent = await response.text();
            console.log('ImageViewer: XML loaded successfully, length:', xmlContent.length);
          } else {
            console.warn('ImageViewer: Failed to load XML:', response.status);
          }
        } catch (error) {
          console.error('ImageViewer: Error loading XML:', error);
        }
      }
    }
    
    console.log('ImageViewer: Calling onImageSelected with XML content:', xmlContent ? 'Available' : 'None');
    onImageSelected(image, xmlContent);
  };

  // Function to mark an image as edited
  const markImageAsEdited = (imageName) => {
    setEditedImages(prev => {
      const newSet = new Set(prev);
      newSet.add(imageName);
      console.log('ImageViewer: Marked image as edited:', imageName, 'Total edited:', newSet.size);
      return newSet;
    });
  };

  // Expose the markImageAsEdited function to parent component
  React.useImperativeHandle(ref, () => ({
    markAsEdited: markImageAsEdited
  }), []);

  const navigatePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      selectImage(newIndex, imageList[newIndex]);
    }
  };

  const navigateNext = () => {
    if (currentIndex < imageList.length - 1) {
      const newIndex = currentIndex + 1;
      selectImage(newIndex, imageList[newIndex]);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Loading images...</Title>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Images</Title>
        <Stats>
          {currentIndex + 1} of {imageList.length} • {imageList.filter(img => img.hasXml).length} with XML • {editedImages.size} edited
        </Stats>
      </Header>

      <ImageList>
        {imageList.map((image, index) => (
          <ImageItem
            key={image.name}
            selected={index === currentIndex}
            onClick={() => selectImage(index, image)}
          >
            <ImageIcon>
              <FiImage />
            </ImageIcon>
            <ImageInfo>
              <ImageName>{image.name.replace(/\.[^/.]+$/, "")}</ImageName>
              {editedImages.has(image.name) && (
                <EditedIndicator>
                  <FiEdit3 size={10} />
                  Edited
                </EditedIndicator>
              )}
            </ImageInfo>
          </ImageItem>
        ))}
      </ImageList>

      <Navigation>
        <NavButton 
          onClick={navigatePrevious} 
          disabled={currentIndex === 0}
        >
          <FiChevronLeft />
          Previous
        </NavButton>
        
        <span style={{fontSize: '14px', color: 'var(--text-black)'}}>
          {currentIndex + 1} / {imageList.length}
        </span>
        
        <NavButton 
          onClick={navigateNext} 
          disabled={currentIndex === imageList.length - 1}
        >
          Next
          <FiChevronRight />
        </NavButton>
      </Navigation>
    </Container>
  );
});

export default ImageViewer;
