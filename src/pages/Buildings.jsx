import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Buildings.css';
import { campusFetch } from '../services/campusApi';

const Buildings = () => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    distance: '',
    contact: '',
    operatingHours: '8:00 AM - 5:00 PM',
    icon: null
  });
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      icon: building.icon || null,
      iconFile: null
    });
    setShowEditModal(true);
  };

  // Handle image upload for EDIT
  const handleEditInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'icon' && files && files[0]) {
      const file = files[0];
      console.log('Selected file:', file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          const res = await campusFetch('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          const data = await res.json();
          console.log('Upload response:', data);
          if (data.url) {
            setEditFormData(prev => ({ ...prev, icon: data.url, iconFile: null }));
          } else {
            alert('Image upload failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Image upload error:', err);
          alert('Image upload error: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBuilding) return;
  
    try {
      let iconUrl = editFormData.icon;
  
      // Upload new image if selected
      if (editFormData.iconFile) {
        const formData = new FormData();
        formData.append('image', editFormData.iconFile);
        const uploadRes = await campusFetch('/uploads', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        iconUrl = uploadData.url;
  
        // Update 'links' collection
        await campusFetch('/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: editFormData.name, imageurl: iconUrl })
        });
      }
  
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

  // ADD BUILDING
  // Handle image upload for ADD
  const handleAddInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'icon' && files && files[0]) {
      const file = files[0];
      console.log('Selected file:', file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(',')[1];
        try {
          const res = await campusFetch('/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });
          const data = await res.json();
          console.log('Upload response:', data);
          if (data.url) {
            setAddFormData(prev => ({ ...prev, icon: data.url }));
          } else {
            alert('Image upload failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('Image upload error:', err);
          alert('Image upload error: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setAddFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubmit = async e => {
    e.preventDefault();
    try {
      let imageUrl = null;

      // 1️⃣ Upload image if exists
      if (addFormData.icon) {
        const formData = new FormData();
        formData.append('image', addFormData.icon);

        const uploadRes = await campusFetch('/uploads', { method: 'POST', body: formData });
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // 2️⃣ Create building
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

      // 3️⃣ Save image URL in 'links'
      if (imageUrl) {
        await campusFetch('/links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: normalizedBuilding.name, imageurl: imageUrl })
        });
      }

      // 4️⃣ Update local state with server-provided metadata (timestamps)
      setBuildings(prev => [...prev, normalizedBuilding]);

      // 5️⃣ Reset form
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
          ADD NEW BUILDING
        </button>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="add-building-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🏢 Add Building</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ❌
              </button>
            </div>
            
            <form className="add-building-form" onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Building Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={addFormData.name}
                  onChange={handleAddInputChange}
                  placeholder="Building name" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description"
                  value={addFormData.description}
                  onChange={handleAddInputChange}
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
                    onChange={handleAddInputChange}
                    placeholder="e.g., 3km" 
                  />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={addFormData.contact}
                    onChange={handleAddInputChange}
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
                  onChange={handleAddInputChange}
                  placeholder="e.g., 8:00 AM - 5:00 PM" 
                />
              </div>
              
              <div className="form-group">
                <label>Building Image</label>
                {addFormData.icon && (
                  <img src={addFormData.icon} alt="Preview" style={{width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px'}}/>
                )}
                <input
                  type="file"
                  name="icon"
                  onChange={handleAddInputChange}
                  accept="image/*"
                />
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
                  onChange={handleEditInputChange}
                  placeholder="Building name" 
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description"
                  value={editFormData.description || ''}
                  onChange={handleEditInputChange}
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
                    onChange={handleEditInputChange}
                    placeholder="e.g., 3km" 
                  />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input 
                    type="text" 
                    name="contact"
                    value={editFormData.contact || ''}
                    onChange={handleEditInputChange}
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
                  onChange={handleEditInputChange}
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
