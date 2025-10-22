import React, { useState, useEffect } from 'react';
import './Coordinates.css';

const Coordinates = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCoordsModal, setShowCoordsModal] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [coordsForm, setCoordsForm] = useState({ buildingId: '', latitude: '', longitude: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // fetch buildings
        const bRes = await fetch('/api/buildings');
        if (!bRes.ok) throw new Error(`Buildings fetch failed: ${bRes.status}`);
        const bJson = await bRes.json();
        const buildingsList = Array.isArray(bJson) ? bJson : (bJson.data || []);

        // fetch coordinates collection (returns all docs)
        const cRes = await fetch('/api/coordinates');
        if (!cRes.ok) {
          console.warn('Coordinates fetch failed, continuing without coords:', await cRes.text());
          setBuildings(buildingsList);
          return;
        }
        const coordsList = await cRes.json();

        // build map by buildingId or by normalized name
        const coordByBuildingId = new Map();
        const coordByName = new Map();
        (coordsList || []).forEach(c => {
          if (c.buildingId) coordByBuildingId.set(String(c.buildingId), c);
          if (c.name) coordByName.set(String(c.name).toLowerCase().trim(), c);
        });

        // merge coords into buildings
        const merged = buildingsList.map(b => {
          const id = String(b._id || b.id || b.providedid || '');
          const byId = coordByBuildingId.get(id);
          const byName = coordByName.get(String(b.name || '').toLowerCase().trim());
          const coordDoc = byId || byName || null;
          return {
            ...b,
            latitude: coordDoc?.latitude ?? b.latitude ?? b.lat ?? null,
            longitude: coordDoc?.longitude ?? b.longitude ?? b.lng ?? null
          };
        });

        setBuildings(merged);
      } catch (err) {
        console.error('Error loading buildings/coordinates:', err);
        setError('Unable to load buildings/coordinates');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openCoordsModal = (building) => {
    const id = building._id || building.id || building.providedid || '';
    setSelectedBuilding(building);
    setCoordsForm({
      buildingId: id,
      latitude: building.latitude ?? building.lat ?? '',
      longitude: building.longitude ?? building.lng ?? ''
    });
    setShowCoordsModal(true);
  };

  const handleCoordsChange = (e) => {
    const { name, value } = e.target;
    setCoordsForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCoordsSubmit = async (e) => {
    e.preventDefault();
    if (!coordsForm.buildingId) {
      alert('No building selected');
      return;
    }
    const id = String(coordsForm.buildingId).trim();
    const latitude = Number(coordsForm.latitude);
    const longitude = Number(coordsForm.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      alert('Latitude and Longitude must be valid numbers');
      return;
    }

    try {
      console.log(`Saving coords for ${id}:`, { latitude, longitude });
      const payload = { latitude, longitude };
      const res = await fetch(`/api/buildings?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const text = await res.text();
      if (!res.ok) {
        console.error('Save failed:', res.status, text);
        throw new Error(`Failed to save coordinates: ${res.status} - ${text}`);
      }
      let updated;
      try { updated = JSON.parse(text); } catch { updated = null; }
      setBuildings(prev => prev.map(b => ((b._id || b.id || b.providedid) === id ? { ...b, latitude, longitude, ...updated } : b)));
      setShowCoordsModal(false);
      setSelectedBuilding(null);
      alert('Coordinates saved');
    } catch (err) {
      console.error('Error saving coordinates:', err);
      alert('Error saving coordinates: ' + err.message);
    }
  };

  if (loading) return <div className="coords-page"><h2>Coordinates</h2><p>Loading...</p></div>;
  if (error) return <div className="coords-page"><h2>Coordinates</h2><p className="error">{error}</p></div>;

  return (
    <div className="coords-page">
      <div className="coords-header">
        <h1>Set Building Coordinates</h1>
        <p className="hint">
          Select a building and set its latitude / longitude. You can copy coords from Google Maps / Earth.
        </p>
      </div>

      <div className="coords-list">
        <div className="coords-row header">
          <div className="c-name">Building</div>
          <div className="c-lat">Latitude</div>
          <div className="c-lng">Longitude</div>
          <div className="c-action">Action</div>
        </div>

        {buildings.map(b => (
          <div className="coords-row" key={b._id || b.id || b.providedid}>
            <div className="c-name">{b.name || '—'}</div>
            <div className="c-lat">{(b.latitude ?? b.lat ?? '').toString() || '—'}</div>
            <div className="c-lng">{(b.longitude ?? b.lng ?? '').toString() || '—'}</div>
            <div className="c-action">
              <button className="btn coords-btn" onClick={() => openCoordsModal(b)}>Set Coordinates</button>
            </div>
          </div>
        ))}
      </div>

      {showCoordsModal && selectedBuilding && (
        <div className="coords-modal-overlay" onClick={() => setShowCoordsModal(false)}>
          <div className="coords-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h3>Set Coordinates for</h3>
                <strong>{selectedBuilding.name}</strong>
              </div>
              <button className="close" onClick={() => setShowCoordsModal(false)}>✕</button>
            </div>

            <form className="coords-form" onSubmit={handleCoordsSubmit}>
              <label>Latitude</label>
              <input name="latitude" value={coordsForm.latitude} onChange={handleCoordsChange} placeholder="-25.436834" required />

              <label>Longitude</label>
              <input name="longitude" value={coordsForm.longitude} onChange={handleCoordsChange} placeholder="30.982381" required />

              <div className="form-actions">
                <button type="button" className="btn cancel" onClick={() => setShowCoordsModal(false)}>Cancel</button>
                <button type="submit" className="btn save">Save Coordinates</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coordinates;