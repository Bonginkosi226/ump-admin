import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Buildings.css';
import { campusFetch } from '../services/campusApi';

const createImageStatus = () => ({
  uploading: false,
  error: null,
  success: false
});

const Buildings = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [viewBuilding, setViewBuilding] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const initialAddFormState = {
    name: '',
    description: '',
    distance: '',
    contact: '',
    operatingHours: '8:00 AM - 5:00 PM',
    icon: null
  };
  const [addFormData, setAddFormData] = useState(initialAddFormState);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addStep, setAddStep] = useState(1);
  const [addImageStatus, setAddImageStatus] = useState(createImageStatus());
  const [editImageStatus, setEditImageStatus] = useState(createImageStatus());

  const resetAddState = () => {
    setAddFormData(initialAddFormState);
    setAddStep(1);
    setAddImageStatus(createImageStatus());
  };

  const openAddModal = () => {
    resetAddState();
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddState();
  };

  const resetEditState = () => {
    setEditFormData({});
    setSelectedBuilding(null);
    setEditImageStatus(createImageStatus());
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    resetEditState();
  };

  // Fetch buildings + images
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);

        const buildingsRes = await campusFetch('/buildings');
        if (!buildingsRes.ok) {
          const text = await buildingsRes.text();
          throw new Error(`Failed to fetch buildings: ${buildingsRes.status} - ${text}`);
        }
        const buildingsJson = await buildingsRes.json();
        let buildingsData = Array.isArray(buildingsJson) ? buildingsJson : (buildingsJson?.data ?? []);
        try {
          const linksRes = await campusFetch('/links');
          if (linksRes.ok) {
            const linksData = await linksRes.json();
            if (Array.isArray(linksData)) {
              const imageMap = new Map(
                linksData
                  .filter(l => l.imageurl)
                  .map(l => [l.name.toLowerCase().trim(), l.imageurl])
              );
              buildingsData = buildingsData.map(building => ({
                ...building,
                icon: imageMap.get(building.name.toLowerCase().trim()) || building.icon || null
              }));
            }
          } else {
            console.warn('Could not fetch image links:', linksRes.status, await linksRes.text());
          }
        } catch (e) {
          console.warn('Error fetching image links, proceeding without them:', e);
        }

        setBuildings(buildingsData);
      } catch (err) {
        console.error('Error fetching building data:', err);
        setError('Failed to load building data from API');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // EDIT BUILDING
  const handleEdit = building => {
    setSelectedBuilding(building);
    setEditFormData({
      name: building.name || '',
      description: building.description || '',
      distance: building.distance || '',
      contact: (building.contact && typeof building.contact === 'object' ? building.contact.phone : building.contact) || '',
      operatingHours: building.operatingHours || building.hours || '8:00 AM - 5:00 PM',
      icon: building.icon || null
    });
    setEditImageStatus(createImageStatus());
    setShowEditModal(true);
  };

  const uploadImageToCloudinary = async (file, setStatus) => {
    setStatus(prev => ({ ...prev, uploading: true, error: null, success: false }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    if (import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER) {
      formData.append('folder', import.meta.env.VITE_CLOUDINARY_UPLOAD_FOLDER);
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      const message = 'Cloudinary cloud name is not configured';
      setStatus({ uploading: false, error: message, success: false });
      throw new Error(message);
    }

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (!response.ok || !data?.secure_url) {
        throw new Error(data?.error?.message || 'Image upload failed');
      }

      setStatus({ uploading: false, error: null, success: true });
      return data.secure_url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Image upload failed';
      setStatus({ uploading: false, error: message, success: false });
      throw error;
    }
  };

  const handleAddImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToCloudinary(file, setAddImageStatus);
      setAddFormData((prev) => ({ ...prev, icon: url }));
    } catch (error) {
      console.error('Add image upload failed:', error);
    } finally {
      event.target.value = '';
    }
  };

  const handleEditImageSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageToCloudinary(file, setEditImageStatus);
      setEditFormData((prev) => ({ ...prev, icon: url }));
    } catch (error) {
      console.error('Edit image upload failed:', error);
    } finally {
      event.target.value = '';
    }
  };

  const handleAddDetailsChange = (event) => {
    const { name, value } = event.target;
    setAddFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditDetailsChange = (event) => {
    const { name, value } = event.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  const clearAddImage = () => {
    setAddFormData((prev) => ({ ...prev, icon: null }));
    setAddImageStatus(createImageStatus());
  };

  const clearEditImage = () => {
    setEditFormData((prev) => ({ ...prev, icon: null }));
    setEditImageStatus(createImageStatus());
  };

  const canAdvanceAdd = Boolean(addFormData.icon) && addImageStatus.success && !addImageStatus.uploading;

  // Handle image upload for EDIT
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuilding) return;
  
    try {
      const iconUrl = editFormData.icon;

      const rawId = selectedBuilding._id || selectedBuilding.id || selectedBuilding.providedid;
      const id = String(rawId || '').trim();
      if (!id) {
        throw new Error('No building ID available on selected item');
      }
      if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        alert('This building cannot be updated because its ID is not a valid Mongo ObjectId.');
        return;
      }
  
      const payload = {
        name: editFormData.name,
        description: editFormData.description,
        distance: editFormData.distance,
        contact: editFormData.contact,
        operatingHours: editFormData.operatingHours,
      };
      if (iconUrl) {
        payload.icon = iconUrl;
        await campusFetch('/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editFormData.name, imageurl: iconUrl })
        });
      }
  
      // Verify the building exists on the remote API
      const preCheck = await campusFetch(`/buildings?id=${id}`);
      if (!preCheck.ok) {
        const text = await preCheck.text();
        throw new Error(`Cannot update: building not found (${preCheck.status} - ${text})`);
      }
  
      // Perform the update using the remote API contract
      const res = await campusFetch(`/buildings?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resText = await res.text();
      if (!res.ok) {
        throw new Error(`Failed to update building: ${res.status} - ${resText}`);
      }
  
      let updated;
      try {
        updated = JSON.parse(resText);
      } catch {
        updated = null;
      }
      const updatedDoc = updated || { ...selectedBuilding, ...payload };
  
      setBuildings(prev =>
        prev.map(b => ((b._id || b.id || b.providedid) === id ? { ...b, ...updatedDoc, icon: iconUrl || b.icon } : b))
      );
  
      setShowEditModal(false);
      setSelectedBuilding(null);
      alert('Building updated successfully!');
    } catch (err) {
      console.error('Error updating building:', err);
      alert(`Error: ${err.message}`);
    }
  };


  // DELETE BUILDING
  const handleDelete = building => {
    setSelectedBuilding(building);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBuilding) return;

    try {
      const deleteEndpoints = [
        `/buildings/${selectedBuilding._id}`,
        `/buildings?id=${selectedBuilding._id}`
      ];
      let deleteResponse;
      let deleteErrorText = '';
      for (const url of deleteEndpoints) {
        const res = await campusFetch(url, { method: 'DELETE' });
        if (res.ok) { deleteResponse = res; break; }
        deleteErrorText = await res.text();
      }
      if (!deleteResponse) {
        throw new Error(`Failed to delete building: 404/Bad Request - ${deleteErrorText}`);
      }

      setBuildings(prev => prev.filter(b => b._id !== selectedBuilding._id));
      setShowDeleteModal(false);
      setSelectedBuilding(null);
    } catch (err) {
      console.error('Error deleting building:', err);
    }
  };

  const handleAddSubmit = async e => {
    e.preventDefault();
    try {
      const imageUrl = addFormData.icon;

      // 1️⃣ Create building
      const response = await campusFetch('/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addFormData.name,
          description: addFormData.description,
          distance: addFormData.distance,
          contact: addFormData.contact,
          operatingHours: addFormData.operatingHours,
          icon: addFormData.icon // <-- send the URL
        })
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create building: ${response.status} - ${text}`);
      }

      const responseData = await response.json();
      const createdBuilding = responseData?.data ?? responseData ?? {};
      const normalizedBuilding = {
        ...createdBuilding,
        name: createdBuilding.name ?? addFormData.name,
        description: createdBuilding.description ?? addFormData.description,
        distance: createdBuilding.distance ?? addFormData.distance,
        contact: createdBuilding.contact ?? addFormData.contact,
        operatingHours: createdBuilding.operatingHours ?? addFormData.operatingHours,
        icon: createdBuilding.icon || imageUrl || addFormData.icon || null,
        createdAt: createdBuilding.createdAt ?? new Date().toISOString(),
        updatedAt: createdBuilding.updatedAt ?? new Date().toISOString(),
      };

      // 2️⃣ Save image URL in 'links'
      if (imageUrl) {
        await campusFetch('/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizedBuilding.name, imageurl: imageUrl })
        });
      }

      // 3️⃣ Update local state with server-provided metadata (timestamps)
      setBuildings(prev => [...prev, normalizedBuilding]);

      // 4️⃣ Reset form
      setAddFormData({
        name: '',
        description: '',
        distance: '',
        contact: '',
        operatingHours: '8:00 AM - 5:00 PM',
        icon: null
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error creating building:', err);
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
        <div className="api-status">
          <small>Connected to live API</small>
        </div>
      </div>

      <div className="buildings-content">
        <div className="buildings-section">
          <div className="section-header">
            <h2>Buildings</h2>
            <span className="buildings-count">● {buildings.length} buildings total</span>
          </div>
          
          <div className="buildings-table">
            <div className="table-header">
              <div className="col-name">BUILDING NAME</div>
              <div className="col-description">DESCRIPTION</div>
              <div className="col-distance">DISTANCE</div>
              <div className="col-contact">CONTACT</div>
              <div className="col-hours">OPERATING HOURS</div>
              <div className="col-action">ACTION</div>
            </div>
            
            {buildings.map((building) => (
              <div key={building._id} className="table-row">
                <div className="col-name">
                  <div className="building-info">
                    <div className="building-avatar">
                      {building.icon && <img src={building.icon} alt={building.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />}
                    </div>
                    <span>{building.name}</span>
                  </div>
                </div>
                <div className="col-description">{building.description}</div>
                <div className="col-distance">{building.distance}</div>
                <div className="col-contact">{typeof building.contact === 'object' ? (building.contact?.phone || '') : (building.contact || '')}</div>
                <div className="col-hours">{building.operatingHours || building.hours}</div>
                <div className="col-action">
                  <button 
                    type="button"
                    className="action-btn edit" 
                    onClick={() => handleEdit(building)}
                    title="Edit building"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="action-btn view"
                    title="View building"
                    onClick={() => setViewBuilding(building)}
                  >
                    👁️
                  </button>
                  <button 
                    type="button"
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
          onClick={openAddModal}
        >
          ADD NEW BUILDING
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="add-building-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏢 Add Building</h2>
              <button className="close-btn" onClick={closeAddModal}>
                ❌
              </button>
            </div>

            <div className="modal-body">
              <div className="stepper">
                <div className={`step ${addStep === 1 ? 'active' : addStep > 1 ? 'completed' : ''}`}>
                  <span>1</span>
                  <p>Upload Image</p>
                </div>
                <div className={`step ${addStep === 2 ? 'active' : addStep > 2 ? 'completed' : ''}`}>
                  <span>2</span>
                  <p>Building Details</p>
                </div>
              </div>

              {addStep === 1 ? (
                <div className="step-pane">
                  <div className="upload-card">
                    <div className="upload-preview">
                      {addFormData.icon ? (
                        <img src={addFormData.icon} alt="Building preview" />
                      ) : (
                        <div className="upload-placeholder">
                          <span role="img" aria-label="image">🖼️</span>
                          <p>Select an image to begin</p>
                        </div>
                      )}
                      {addFormData.icon && (
                        <button type="button" className="remove-image-btn" onClick={clearAddImage}>
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="upload-actions">
                      <label className="upload-button">
                        <input type="file" accept="image/*" onChange={handleAddImageSelect} hidden />
                        {addFormData.icon ? 'Replace image' : 'Choose image'}
                      </label>
                      <p className="upload-hint">We’ll store the Cloudinary link for this building.</p>
                    </div>

                    <div className="upload-status">
                      {addImageStatus.uploading && <p className="info">Uploading to Cloudinary…</p>}
                      {addImageStatus.success && !addImageStatus.uploading && <p className="success">Image uploaded successfully.</p>}
                      {addImageStatus.error && <p className="error">{addImageStatus.error}</p>}
                    </div>
                  </div>

                  <div className="step-actions">
                    <button type="button" className="cancel-btn" onClick={closeAddModal}>Cancel</button>
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => setAddStep(2)}
                      disabled={!canAdvanceAdd}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              ) : (
                <form className="add-building-form" onSubmit={handleAddSubmit}>
                  <div className="step-pane">
                    {addFormData.icon && (
                      <div className="uploaded-summary">
                        <img src={addFormData.icon} alt="Building" />
                        <div>
                          <p className="label">Image link</p>
                          <a href={addFormData.icon} target="_blank" rel="noreferrer">View on Cloudinary</a>
                        </div>
                        <button type="button" className="link-button" onClick={() => {
                          setAddImageStatus(createImageStatus());
                          setAddStep(1);
                        }}>
                          Change image
                        </button>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Building Name</label>
                      <input
                        type="text"
                        name="name"
                        value={addFormData.name}
                        onChange={handleAddDetailsChange}
                        placeholder="Building name"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={addFormData.description}
                        onChange={handleAddDetailsChange}
                        placeholder="Describe the building..."
                        rows="3"
                        required
                      ></textarea>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Distance</label>
                        <input
                          type="text"
                          name="distance"
                          value={addFormData.distance}
                          onChange={handleAddDetailsChange}
                          placeholder="e.g., 3km"
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact</label>
                        <input
                          type="text"
                          name="contact"
                          value={addFormData.contact}
                          onChange={handleAddDetailsChange}
                          placeholder="e.g., 013 002 000"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Operating Hours</label>
                      <input 
                        type="text" 
                        name="operatingHours"
                        value={addFormData.operatingHours}
                        onChange={handleAddDetailsChange}
                        placeholder="e.g., 8:00 AM - 5:00 PM" 
                      />
                    </div>

                    <div className="form-actions">
                      <button type="button" className="cancel-btn" onClick={closeAddModal}>
                        Cancel
                      </button>
                      <button type="submit" className="save-btn" disabled={!addFormData.icon}>
                        Add Building
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedBuilding && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="add-building-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Building</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                ❌
              </button>
            </div>
            
            <form className="add-building-form" onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Building Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={editFormData.name || ''}
                  onChange={handleEditDetailsChange}
                  placeholder="Building name" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description"
                  value={editFormData.description || ''}
                  onChange={handleEditDetailsChange}
                  placeholder="Describe the building..."
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Distance</label>
                  <input 
                    type="text" 
                    name="distance"
                    value={editFormData.distance || ''}
                    onChange={handleEditDetailsChange}
                    placeholder="e.g., 3km" 
                  />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={editFormData.contact || ''}
                    onChange={handleEditDetailsChange}
                    placeholder="e.g., 013 002 000" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Operating Hours</label>
                <input 
                  type="text" 
                  name="operatingHours"
                  value={editFormData.operatingHours || ''}
                  onChange={handleEditInputChange}
                  placeholder="e.g., 8:00 AM - 5:00 PM" 
                />
              </div>
              
              <div className="form-group">
                <label>Building Image</label>
                <div>
                    {editFormData.icon && (
                      <img src={editFormData.icon} alt="Current building" style={{width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px'}}/>
                    )}
                </div>
                <input
                  type="file"
                  name="icon"
                  onChange={handleEditImageSelect}
                  accept="image/*"
                />
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
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className="delete-confirm-btn" onClick={confirmDelete}>
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
