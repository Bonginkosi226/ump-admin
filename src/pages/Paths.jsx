import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Trash2, Edit, PlusCircle } from 'lucide-react';
import GoogleMap from '../components/GoogleMap';
import apiService from '../services/api';
import { kml } from 'togeojson';
import './Paths.css';

const Paths = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [selectedPath, setSelectedPath] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    transportMode: 'walking',
    start: { lat: '', lng: '' },
    end: { lat: '', lng: '' },
    coordinates: []
  });

  const campusCenter = { lat: -25.4284, lng: 30.9781 };

  const normalizePaths = (data) => data.map(p => ({
    ...p,
    startDestination: p.start,
    stopDestination: p.end,
    pathPoints: Array.isArray(p.pathPoints) && p.pathPoints.length > 0
      ? p.pathPoints
      : Array.isArray(p.coordinates) ? p.coordinates : []
  }));

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        setLoading(true);
        const res = await apiService.getPaths();
        if (res.success) setPaths(normalizePaths(res.data));
        else setError('Failed to load paths from API');
      } catch (err) {
        console.error(err);
        setError('Failed to load paths from API');
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []);

  // --- File parsing ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;

        let data;
        if (ext === 'json' || ext === 'geojson') {
          data = JSON.parse(text);
        } else if (ext === 'kml') {
          // Convert KML string to XML DOM
          const xmlDom = new window.DOMParser().parseFromString(text, 'text/xml');
          data = kml(xmlDom); // Convert to GeoJSON
        } else {
          alert('Unsupported file type. Please upload a GeoJSON (.json/.geojson) or KML (.kml) file.');
          return;
        }

        let coords = [];
        if (data.features) {
          data.features.forEach(f => {
            if (f.geometry && f.geometry.coordinates) {
              // Handle LineString or MultiLineString
              if (f.geometry.type === 'LineString') {
                f.geometry.coordinates.forEach(coord => coords.push({ lat: coord[1], lng: coord[0] }));
              } else if (f.geometry.type === 'MultiLineString') {
                f.geometry.coordinates.forEach(line =>
                  line.forEach(coord => coords.push({ lat: coord[1], lng: coord[0] }))
                );
              }
            }
          });
        }

        if (coords.length === 0) throw new Error('No coordinates found');

        setFormData(prev => ({
          ...prev,
          name: data.name || prev.name,
          start: coords[0],
          end: coords[coords.length - 1],
          coordinates: coords
        }));

        alert('Route file loaded successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to read file. Ensure it is a valid GeoJSON or KML export from Google Earth.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only include fields the backend expects
      const payload = {
        name: formData.name,
        start: {
          lat: Number(formData.start.lat),
          lng: Number(formData.start.lng)
        },
        end: {
          lat: Number(formData.end.lat),
          lng: Number(formData.end.lng)
        },
        pathPoints: formData.coordinates.map(c => ({
          lat: Number(c.lat),
          lng: Number(c.lng)
        }))
      };
      console.log('Submitting path:', payload);
      const created = await apiService.addPath(payload);
      setPaths(prev => [...prev, normalizePaths([created])[0]]);
      setShowAddModal(false);
      setAddStep(1);
      setFormData({ name: '', transportMode: 'walking', start: { lat: '', lng: '' }, end: { lat: '', lng: '' }, coordinates: [] });
    } catch (err) {
      console.error(err);
    }
  };

  // --- Edit handler ---
  const handleEdit = (path) => {
    setSelectedPath(path);
    setFormData({
      name: path.name,
      transportMode: path.transportMode || 'walking',
      start: path.startDestination || path.start,
      end: path.stopDestination || path.end,
      coordinates: path.pathPoints || []
    });
    setShowEditModal(true);
    setAddStep(3);
  };

  // --- Delete handler ---
  const handleDelete = (path) => {
    setSelectedPath(path);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedPath) return;
    try {
      await apiService.deletePath(selectedPath._id);
      setPaths(prev => prev.filter(p => p._id !== selectedPath._id));
      setShowDeleteModal(false);
      setSelectedPath(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete path.');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        transportMode: formData.transportMode,
        start: {
          lat: Number(formData.start.lat),
          lng: Number(formData.start.lng)
        },
        end: {
          lat: Number(formData.end.lat),
          lng: Number(formData.end.lng)
        },
        pathPoints: formData.coordinates.map(c => ({
          lat: Number(c.lat),
          lng: Number(c.lng)
        }))
      };
      const updated = await apiService.updatePath(selectedPath._id, payload);
      setPaths(prev => prev.map(p => p._id === selectedPath._id ? normalizePaths([updated])[0] : p));
      setShowEditModal(false);
      setSelectedPath(null);
      setFormData({ name: '', transportMode: 'walking', start: { lat: '', lng: '' }, end: { lat: '', lng: '' }, coordinates: [] });
    } catch (err) {
      console.error(err);
      alert('Failed to update path.');
    }
  };

  return (
    <div className="paths-page">
      <div className="page-header"><h1>Paths</h1></div>

      {loading && <div>Loading paths...</div>}
      {error && <div className="error-state">{error}</div>}

      {/* --- Paths Table --- */}
      {!loading && !error && (
        <table className="paths-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Start (Lat/Lng)</th>
              <th>End (Lat/Lng)</th>
              <th>Transport</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paths.map(p => (
              <tr key={p._id}>
                <td>{p.name || 'N/A'}</td>
                <td>{p.startDestination ? `(${Number(p.startDestination.lat).toFixed(5)}, ${Number(p.startDestination.lng).toFixed(5)})` : 'N/A'}</td>
                <td>{p.stopDestination ? `(${Number(p.stopDestination.lat).toFixed(5)}, ${Number(p.stopDestination.lng).toFixed(5)})` : 'N/A'}</td>
                <td>{p.transportMode || 'N/A'}</td>
                <td>{p.pathPoints?.length || 0}</td>
                <td>
                  <button className="action-btn edit-btn" title="Edit" onClick={() => handleEdit(p)}>
                    <Edit size={18} />
                  </button>
                  <button className="action-btn delete-btn" title="Delete" onClick={() => handleDelete(p)}>
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="add-button" onClick={() => { setShowAddModal(true); setAddStep(1); }}>
        <PlusCircle /> Add Path
      </button>

      {/* --- Stepwise Add Modal --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form className="styled-form" onSubmit={handleAddSubmit}>
              <div className="form-header">
                <h3>Add New Path</h3>
                <p className="info-message">
                  <strong>How to create a path:</strong><br />
                  <span>
                    You can create paths in <a href="https://earth.google.com/web/" target="_blank" rel="noopener noreferrer">Google Earth</a> or similar mapping tools.<br />
                    Draw your route, export as <strong>GeoJSON</strong> or <strong>KML</strong>, then upload the file here.
                  </span>
                </p>
              </div>

              {addStep === 1 && (
                <div className="form-step">
                  <label className="form-label">Step 1: Upload GeoJSON/KML</label>
                  <input
                    type="file"
                    accept=".json,.geojson,.kml"
                    className="form-input"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="form-btn next-btn"
                    onClick={() => formData.coordinates.length > 0 ? setAddStep(2) : alert('Upload a valid file first')}
                  >
                    Next
                  </button>
                </div>
              )}

              {addStep === 2 && (
                <div className="form-step">
                  <label className="form-label">Step 2: Preview Coordinates</label>
                  <ul className="coords-list">
                    {formData.coordinates.slice(0, 5).map((c, i) => (
                      <li key={i} className="coords-item">
                        <span>({c.lat.toFixed(5)}, {c.lng.toFixed(5)})</span>
                      </li>
                    ))}
                    {formData.coordinates.length > 5 && (
                      <li className="coords-item">
                        ...({formData.coordinates.length - 5} more points)
                      </li>
                    )}
                  </ul>
                  <div className="form-actions">
                    <button type="button" className="form-btn back-btn" onClick={() => setAddStep(1)}>Back</button>
                    <button type="button" className="form-btn next-btn" onClick={() => setAddStep(3)}>Next</button>
                  </div>
                </div>
              )}

              {addStep === 3 && (
                <div className="form-step">
                  <label className="form-label">Step 3: Confirm Details</label>
                  <div className="form-group">
                    <input
                      name="name"
                      className="form-input"
                      placeholder="Path Name"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <input
                      name="transportMode"
                      className="form-input"
                      placeholder="Transport Mode"
                      value={formData.transportMode}
                      onChange={e => setFormData(prev => ({ ...prev, transportMode: e.target.value }))}
                    />
                  </div>
                  <div className="form-summary">
                    <p><strong>Start:</strong> ({formData.start.lat.toFixed(5)}, {formData.start.lng.toFixed(5)})</p>
                    <p><strong>End:</strong> ({formData.end.lat.toFixed(5)}, {formData.end.lng.toFixed(5)})</p>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="form-btn back-btn" onClick={() => setAddStep(2)}>Back</button>
                    <button type="submit" className="form-btn confirm-btn">Submit</button>
                  </div>
                </div>
              )}

              <button type="button" className="form-btn cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
            </form>

            {formData.coordinates.length > 0 && (
              <div className="map-preview">
                <h4>Map Preview</h4>
                <GoogleMap
                  center={campusCenter}
                  zoom={16}
                  markers={formData.coordinates.map((c, i) => ({
                    lat: c.lat,
                    lng: c.lng,
                    title: `Point ${i + 1}`
                  }))}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Edit Modal --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <form className="styled-form" onSubmit={handleEditSubmit}>
              <div className="form-header">
                <h3>Edit Path</h3>
              </div>
              {/* Reuse step 3 form fields */}
              <div className="form-step">
                <label className="form-label">Edit Details</label>
                <div className="form-group">
                  <input
                    name="name"
                    className="form-input"
                    placeholder="Path Name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    name="transportMode"
                    className="form-input"
                    placeholder="Transport Mode"
                    value={formData.transportMode}
                    onChange={e => setFormData(prev => ({ ...prev, transportMode: e.target.value }))}
                  />
                </div>
                <div className="form-summary">
                  <p><strong>Start:</strong> ({formData.start.lat}, {formData.start.lng})</p>
                  <p><strong>End:</strong> ({formData.end.lat}, {formData.end.lng})</p>
                </div>
                <div className="form-actions">
                  <button type="button" className="form-btn cancel-btn" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="form-btn confirm-btn">Save</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Modal --- */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="form-header">
              <h3>Delete Path</h3>
            </div>
            <div className="form-step">
              <p>Are you sure you want to delete <strong>{selectedPath?.name}</strong>?</p>
              <div className="form-actions">
                <button className="form-btn back-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="form-btn delete-btn" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Paths;
