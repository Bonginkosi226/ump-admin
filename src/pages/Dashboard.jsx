import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Building, Users, MapPin, Plus, AlertCircle } from 'lucide-react';
import './Dashboard.css'; // Make sure this file includes the new styles below

const Dashboard = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback static data for other stats (since we only have buildings endpoint)
  const fallbackStatsData = [
    { title: 'Total Buildings', value: '0', icon: Building, color: 'orange' },
    { title: 'New Buildings', value: '0', icon: Plus, color: 'orange' },
    { title: 'Total Paths', value: '57', icon: MapPin, color: 'orange' },
    { title: 'Total Users', value: '324', icon: Users, color: 'orange' }
  ];

  const fallbackChartData = [
    { year: '2016', users: 10 },
    { year: '2017', users: 25 },
    { year: '2018', users: 45 },
    { year: '2019', users: 35 },
    { year: '2020', users: 20 },
    { year: '2021', users: 30 },
    { year: '2022', users: 55 },
    { year: '2023', users: 70 }
  ];

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch buildings directly from your API endpoint
        const response = await fetch('/api/buildings');
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Failed to fetch buildings: ${response.status} - ${text}`);
        }
        
        const json = await response.json();
        const buildingsData = Array.isArray(json) ? json : (json?.data ?? []);
        setBuildings(buildingsData);
        
      } catch (err) {
        console.error('Error fetching buildings:', err);
        setError('Failed to load buildings data');
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildings();
  }, []);

  // Calculate real stats from the buildings data
  const statsData = [
    { 
      title: 'Total Buildings', 
      value: buildings.length.toString(), 
      icon: Building, 
      color: 'orange' 
    },
    { 
      title: 'New Buildings', 
      value: buildings.filter(b => {
        // Simple heuristic: if building has recent data or specific pattern
        return b.name?.includes('New') || b.description?.includes('new') ? 1 : 0;
      }).length.toString(), 
      icon: Plus, 
      color: 'orange' 
    },
    { 
      title: 'Residential Buildings', 
      value: buildings.filter(b => 
        b.description?.toLowerCase().includes('res') || 
        b.name?.toLowerCase().includes('block') ||
        b.name?.toLowerCase().includes('onderberg') ||
        b.name?.toLowerCase().includes('letaba') ||
        b.name?.toLowerCase().includes('loskop')
      ).length.toString(), 
      icon: MapPin, 
      color: 'orange' 
    },
    { 
      title: 'Academic Buildings', 
      value: buildings.filter(b => 
        b.description?.toLowerCase().includes('lecture') || 
        b.description?.toLowerCase().includes('academic') ||
        b.description?.toLowerCase().includes('teaching') ||
        b.name?.toLowerCase().includes('building 5') ||
        b.name?.toLowerCase().includes('library')
      ).length.toString(), 
      icon: Users, 
      color: 'orange' 
    }
  ];

  const chartData = fallbackChartData;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="error-state">
          <AlertCircle size={48} color="#ef4444" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="api-status">
          <small>Connected to live API - {buildings.length} buildings loaded</small>
        </div>
      </div>

      <div className="stats-grid">
        {statsData.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <IconComponent size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-title">{stat.title}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="dashboard-content">
        <div className="analytics-section">
          <div className="chart-container">
            <h3>Building Distribution</h3>
            <div className="chart-period">Real-time data</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={[
                { category: 'Residential', count: parseInt(statsData[2].value) },
                { category: 'Academic', count: parseInt(statsData[3].value) },
                { category: 'Other', count: buildings.length - parseInt(statsData[2].value) - parseInt(statsData[3].value) }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="category" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-summary">
            <div className="summary-item">
              <h4>Total Buildings</h4>
              <div className="summary-value">{buildings.length}</div>
              <div className="summary-detail">Live from API</div>
            </div>
            <div className="summary-item">
              <h4>Residential</h4>
              <div className="summary-value">{statsData[2].value}</div>
              <div className="summary-detail">Dormitories & Housing</div>
            </div>
            <div className="summary-item">
              <h4>Academic</h4>
              <div className="summary-value">{statsData[3].value}</div>
              <div className="summary-detail">Lecture halls & Offices</div>
            </div>
          </div>
        </div>

        {/* Building List Preview */}
        <div className="buildings-preview">
          <h3>Recent Buildings</h3>
          <div className="buildings-list">
            {buildings.slice(0, 5).map((building) => (
              <a key={building._id} href="/buildings" className="building-preview-item">
                <div className="building-preview-avatar">
                  {building.icon ? (
                    <img src={building.icon} alt={building.name} />
                  ) : (
                    <span>{building.name?.charAt(0) || 'B'}</span>
                  )}
                </div>
                <div className="building-preview-info">
                  <div className="building-preview-name">{building.name}</div>
                  <div className="building-preview-desc">{building.description || 'No description available.'}</div>
                </div>
                {building.distance && (
                  <div className="building-preview-distance">{building.distance}</div>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;