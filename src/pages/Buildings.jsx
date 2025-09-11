import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Buildings.css';

const Buildings = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({
    name: '',
    location: '',
    description: '',
    buildingType: 'food',
    facilities: ['toilet', 'wifi'],
    images: []
  });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback static data
  const fallbackBuildings = [

    {
      id: '01',
      name: 'Building 10',
      type: 'General Enquiries',
      locations: 3,
      paths: 12,
      lastUpdate: '12-04-2025 | 15:24'
    },
    {
      id: '02',
      name: 'Building 7',
      type: 'Multipurpose Hall',
      locations: 6,
      paths: 9,
      lastUpdate: '12-04-2025 | 15:24'
    },
    {
      id: '03',
      name: 'Building 6',
      type: 'Lecture Hall',
      locations: 4,
      paths: 23,
      lastUpdate: '12-04-2025 | 15:24'
    },
    {
      id: '04',
      name: 'Old Gate',
      type: 'Entrance',
      locations: 1,
      paths: 16,
      lastUpdate: '12-04-2025 | 15:24'
    }
  ];

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getBuildings();
        if (response.success && response.data) {
          setBuildings(response.data);
        } else {
          console.warn('API not available, using fallback data');
          setBuildings(fallbackBuildings);
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to load buildings');
        setBuildings(fallbackBuildings);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  const handleEdit = (building) => {
    setSelectedBuilding(building);
    setEditFormData({
      name: building.name,
      type: building.type,
      description: '',
      location: '',
      buildingType: building.type.toLowerCase().replace(' ', ''),
      facilities: ['toilet', 'wifi']
    });
    setShowEditModal(true);
  };

  const handleDelete = (building) => {
    setSelectedBuilding(building);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await apiService.deleteBuilding(selectedBuilding.id);
      if (response.success) {
        setBuildings(buildings.filter(b => b.id !== selectedBuilding.id));
      } else {
        // Fallback to local deletion if API fails
        setBuildings(buildings.filter(b => b.id !== selectedBuilding.id));
      }
    } catch (err) {
      console.error('Error deleting building:', err);
      // Fallback to local deletion
      setBuildings(buildings.filter(b => b.id !== selectedBuilding.id));
    }
    setShowDeleteModal(false);
    setSelectedBuilding(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        name: editFormData.name,
        type: editFormData.type,
        description: editFormData.description || '',
        location: editFormData.location || '',
        buildingType: editFormData.buildingType || editFormData.type.toLowerCase().replace(' ', ''),
        facilities: editFormData.facilities || []
      };
      
      const response = await apiService.updateBuilding(selectedBuilding.id, updateData);
      
      const updatedBuildings = buildings.map(building => 
        building.id === selectedBuilding.id 
          ? { 
              ...building, 
              name: editFormData.name,
              type: editFormData.type,
              lastUpdate: new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
            }
          : building
      );
      setBuildings(updatedBuildings);
    } catch (err) {
      console.error('Error updating building:', err);
      // Fallback to local update
      const updatedBuildings = buildings.map(building => 
        building.id === selectedBuilding.id 
          ? { 
              ...building, 
              name: editFormData.name,
              type: editFormData.type,
              lastUpdate: new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
            }
          : building
      );
      setBuildings(updatedBuildings);
    }
    setShowEditModal(false);
    setSelectedBuilding(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const facility = value;
      setAddFormData(prev => ({
        ...prev,
        facilities: checked 
          ? [...prev.facilities, facility]
          : prev.facilities.filter(f => f !== facility)
      }));
    } else {
      setAddFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    
    if (addFormData.images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      return;
    }
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            id: Date.now() + Math.random(),
            file: file,
            preview: event.target.result,
            name: file.name
          };
          setAddFormData(prev => ({
            ...prev,
            images: [...prev.images, imageData]
          }));
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select only image files.');
      }
    });
  };

  const handleRemoveImage = (imageId) => {
    setAddFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
  };

  const triggerImageUpload = () => {
    document.getElementById('imageUpload').click();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Generate a unique building code
      const codePrefix = addFormData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      const codeNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const buildingCode = codePrefix + codeNumber;
      
      const newBuilding = {
        name: addFormData.name,
        code: buildingCode,
        type: addFormData.buildingType === 'food' ? 'Other' : 
              addFormData.buildingType === 'general' ? 'Administrative' :
              addFormData.buildingType === 'offices' ? 'Administrative' :
              addFormData.buildingType === 'lecture' ? 'Academic' :
              addFormData.buildingType === 'library' ? 'Library' : 'Other',
        description: addFormData.description,
        location: {
          coordinates: {
            latitude: -25.4753,
            longitude: 30.9756
          },
          address: addFormData.location || 'University of Mpumalanga, Nelspruit',
          campus: 'Main Campus'
        },
        floors: 1,
        capacity: 100,
        facilities: addFormData.facilities.map(f => ({
          name: f.charAt(0).toUpperCase() + f.slice(1),
          type: 'Other',
          floor: 1,
          capacity: 50
        })),
        status: 'Active'
      };
      
      const response = await apiService.createBuilding(newBuilding);
      
      // Add to local state
      const buildingForDisplay = {
        id: Date.now().toString(),
        name: addFormData.name,
        type: addFormData.buildingType.charAt(0).toUpperCase() + addFormData.buildingType.slice(1),
        locations: 1,
        paths: 0,
        lastUpdate: new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
      };
      
      setBuildings(prev => [...prev, buildingForDisplay]);
      
      // Reset form and close modal
      setAddFormData({
        name: '',
        location: '',
        description: '',
        buildingType: 'food',
        facilities: ['toilet', 'wifi'],
        images: []
      });
      setShowAddModal(false);
      
    } catch (err) {
      console.error('Error creating building:', err);
      // Fallback to local addition
      const buildingForDisplay = {
        id: Date.now().toString(),
        name: addFormData.name,
        type: addFormData.buildingType.charAt(0).toUpperCase() + addFormData.buildingType.slice(1),
        locations: 1,
        paths: 0,
        lastUpdate: new Date().toLocaleDateString('en-GB') + ' | ' + new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' })
      };
      
      setBuildings(prev => [...prev, buildingForDisplay]);
      
      // Reset form and close modal
      setAddFormData({
        name: '',
        location: '',
        description: '',
        buildingType: 'food',
        facilities: ['toilet', 'wifi'],
        images: []
      });
      setShowAddModal(false);
    }
  };

  if (loading) {
    return (
      <div className="buildings-page">
        <div className="buildings-header">
          <h1>Buildings</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading buildings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="buildings-page">
        <div className="buildings-header">
          <h1>Buildings</h1>
        </div>
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="buildings-page">
      <div className="buildings-header">
        <h1>Buildings</h1>
        {buildings === fallbackBuildings && (
          <div className="fallback-notice">
            <small>Using offline data - API unavailable</small>
          </div>
        )}
      </div>

      <div className="buildings-content">
        <div className="buildings-section">
          <div className="section-header">
            <h2>Buildings</h2>
            <span className="new-buildings">● 2 new buildings this month</span>
          </div>
          
          <div className="buildings-table">
            <div className="table-header">
              <div className="col-id">#</div>
              <div className="col-building">BUILDING</div>
              <div className="col-type">BUILDING TYPE</div>
              <div className="col-locations"># OF LOCATIONS</div>
              <div className="col-paths"># OF PATHS CONNECTED</div>
              <div className="col-update">LAST UPDATE</div>
              <div className="col-action">ACTION</div>
            </div>
            
            {buildings.map((building) => (
              <div key={building.id} className="table-row">
                <div className="col-id">{building.id}</div>
                <div className="col-building">
                  <div className="building-info">
                    <div className="building-avatar"></div>
                    <span>{building.name}</span>
                  </div>
                </div>
                <div className="col-type">{building.type}</div>
                <div className="col-locations">{building.locations}</div>
                <div className="col-paths">{building.paths}</div>
                <div className="col-update">{building.lastUpdate}</div>
                <div className="col-action">
                  <button 
                    className="action-btn edit" 
                    onClick={() => handleEdit(building)}
                    title="Edit building"
                  >
                    ✏️
                  </button>
                  <button className="action-btn view" title="View building">👁️</button>
                  <button 
                    className="action-btn delete" 
                    onClick={() => handleDelete(building)}
                    title="Delete building"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          className="add-building-btn"
          onClick={() => setShowAddModal(true)}
        >
          ADD
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-building-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏢 Add Building</h2>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ❌
              </button>
            </div>
            
            <form className="add-building-form" onSubmit={handleAddSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Building</label>
                  <input 
                    type="text" 
                    name="name"
                    value={addFormData.name}
                    onChange={handleAddInputChange}
                    placeholder="Building" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Building Location (Optional)</label>
                  <input 
                    type="text" 
                    name="location"
                    value={addFormData.location}
                    onChange={handleAddInputChange}
                    placeholder="Building location (Optional)" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>📝 Describe the building</label>
                <textarea 
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddInputChange}
                  placeholder="Describe the purpose/function of the building..."
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Category/Building Type</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="food" 
                      checked={addFormData.buildingType === 'food'}
                      onChange={handleAddInputChange}
                    />
                    <span>Food</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="general" 
                      checked={addFormData.buildingType === 'general'}
                      onChange={handleAddInputChange}
                    />
                    <span>General Enquiries</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="offices" 
                      checked={addFormData.buildingType === 'offices'}
                      onChange={handleAddInputChange}
                    />
                    <span>Offices</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="lecture" 
                      checked={addFormData.buildingType === 'lecture'}
                      onChange={handleAddInputChange}
                    />
                    <span>Lecture Hall</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="library" 
                      checked={addFormData.buildingType === 'library'}
                      onChange={handleAddInputChange}
                    />
                    <span>Library</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Facilities</label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input 
                      type="checkbox" 
                      value="toilet"
                      checked={addFormData.facilities.includes('toilet')}
                      onChange={handleAddInputChange}
                    />
                    <span>Toilet</span>
                  </label>
                  <label className="checkbox-option">
                    <input 
                      type="checkbox" 
                      value="wifi"
                      checked={addFormData.facilities.includes('wifi')}
                      onChange={handleAddInputChange}
                    />
                    <span>Wifi</span>
                  </label>
                  <label className="checkbox-option">
                    <input 
                      type="checkbox" 
                      value="kitchen"
                      checked={addFormData.facilities.includes('kitchen')}
                      onChange={handleAddInputChange}
                    />
                    <span>Kitchen</span>
                  </label>
                </div>
              </div>
              
              <div className="form-group">
                <label>Images</label>
                <div className="image-upload">
                  {addFormData.images.map((image) => (
                    <div key={image.id} className="image-preview">
                      <img src={image.preview} alt={image.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                      <button 
                        type="button" 
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(image.id)}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {addFormData.images.length < 5 && (
                    <>
                      <div className="image-preview">
                        <div className="image-placeholder">📷</div>
                      </div>
                      <button type="button" className="add-image-btn" onClick={triggerImageUpload}>
                        📷 Add
                      </button>
                    </>
                  )}
                  <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Add Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedBuilding && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="add-building-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Building</h2>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ❌
              </button>
            </div>
            
            <form className="add-building-form" onSubmit={handleEditSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Building Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={editFormData.name || ''}
                    onChange={handleEditInputChange}
                    placeholder="Building Name" 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Building Location (Optional)</label>
                  <input 
                    type="text" 
                    name="location"
                    value={editFormData.location || ''}
                    onChange={handleEditInputChange}
                    placeholder="Building location (Optional)" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>📝 Describe the building</label>
                <textarea 
                  name="description"
                  value={editFormData.description || ''}
                  onChange={handleEditInputChange}
                  placeholder="Describe the purpose/function of the building..."
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label>Category/Building Type</label>
                <div className="radio-group">
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="food" 
                      checked={editFormData.buildingType === 'food'}
                      onChange={handleEditInputChange}
                    />
                    <span>Food</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="general" 
                      checked={editFormData.buildingType === 'general'}
                      onChange={handleEditInputChange}
                    />
                    <span>General Enquiries</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="offices" 
                      checked={editFormData.buildingType === 'offices'}
                      onChange={handleEditInputChange}
                    />
                    <span>Offices</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="lecture" 
                      checked={editFormData.buildingType === 'lecture'}
                      onChange={handleEditInputChange}
                    />
                    <span>Lecture Hall</span>
                  </label>
                  <label className="radio-option">
                    <input 
                      type="radio" 
                      name="buildingType" 
                      value="library" 
                      checked={editFormData.buildingType === 'library'}
                      onChange={handleEditInputChange}
                    />
                    <span>Library</span>
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && selectedBuilding && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h2>🗑️ Delete Building</h2>
            </div>
            <div className="delete-modal-content">
              <p>Are you sure you want to delete <strong>{selectedBuilding.name}</strong>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="delete-modal-actions">
              <button 
                className="cancel-btn" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn" 
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buildings;