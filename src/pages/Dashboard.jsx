import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Building, Users, MapPin, AlertCircle, Download } from 'lucide-react';
import './Dashboard.css'; // Make sure this file includes the new styles below

const Dashboard = () => {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Fallback static data for other stats (since we only have buildings endpoint)
  const fallbackStatsData = [
    { title: 'Total Buildings', value: '0', icon: Building },
    { title: 'Residential Buildings', value: '0', icon: MapPin },
    { title: 'Academic Buildings', value: '0', icon: Users },
    { title: 'Other Buildings', value: '0', icon: AlertCircle }
  ];

  const fallbackCategoryData = [
    { category: 'Residential', count: 18 },
    { category: 'Academic', count: 22 },
    { category: 'Other', count: 15 }
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

  const statsSummary = useMemo(() => {
    if (!buildings.length) {
      const totalBuildings = Number(fallbackStatsData[0].value) || 0;
      const residential = fallbackCategoryData[0].count;
      const academic = fallbackCategoryData[1].count;
      const other = fallbackCategoryData[2].count;
      return {
        cards: fallbackStatsData,
        chart: fallbackCategoryData,
        numeric: { totalBuildings, residential, academic, other }
      };
    }

    const totalBuildings = buildings.length;
    const residential = buildings.filter(b =>
      b.description?.toLowerCase().includes('res') ||
      b.name?.toLowerCase().includes('block') ||
      b.name?.toLowerCase().includes('onderberg') ||
      b.name?.toLowerCase().includes('letaba') ||
      b.name?.toLowerCase().includes('loskop')
    ).length;
    const academic = buildings.filter(b =>
      b.description?.toLowerCase().includes('lecture') ||
      b.description?.toLowerCase().includes('academic') ||
      b.description?.toLowerCase().includes('teaching') ||
      b.name?.toLowerCase().includes('building 5') ||
      b.name?.toLowerCase().includes('library')
    ).length;
    const other = Math.max(0, totalBuildings - residential - academic);

    return {
      cards: [
        { title: 'Total Buildings', value: totalBuildings.toString(), icon: Building },
        { title: 'Residential Buildings', value: residential.toString(), icon: MapPin },
        { title: 'Academic Buildings', value: academic.toString(), icon: Users },
        { title: 'Other Buildings', value: other.toString(), icon: AlertCircle }
      ],
      chart: [
        { category: 'Residential', count: residential },
        { category: 'Academic', count: academic },
        { category: 'Other', count: other }
      ],
      numeric: { totalBuildings, residential, academic, other }
    };
  }, [buildings, fallbackCategoryData, fallbackStatsData]);

  const statsData = statsSummary.cards;
  const chartData = statsSummary.chart;
  const statsNumbers = statsSummary.numeric;

  const handleDownloadReport = () => {
    try {
      setReportLoading(true);
      const rows = [];
      const timestamp = new Date().toISOString();

      rows.push(['Dashboard report generated at', timestamp]);
      rows.push([]);
      rows.push(['Key Metrics', 'Value']);
      statsData.forEach(stat => {
        rows.push([stat.title, stat.value]);
      });

      rows.push([]);
      rows.push(['Chart Category', 'Count']);
      chartData.forEach(item => {
        rows.push([item.category, item.count]);
      });

      const csv = rows
        .map(row => row
          .map(cell => {
            const value = cell == null ? '' : String(cell);
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeTimestamp = timestamp.replace(/[:T]/g, '-').split('.')[0];
      link.href = url;
      link.setAttribute('download', `ump-dashboard-report-${safeTimestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setReportLoading(false);
    }
  };

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

      <div className="dashboard-main">
        <section className="dashboard-panel primary-panel">
          <div className="chart-container">
            <div className="chart-header">
              <h3>Building Distribution</h3>
              <span className="chart-period">Real-time data</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
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

          <div className="stats-report-grid">
            <div className="stats-summary">
              <div className="summary-item">
                <h4>Total Buildings</h4>
                <div className="summary-value">{statsNumbers.totalBuildings}</div>
                <div className="summary-detail">Live from API</div>
              </div>
              <div className="summary-item">
                <h4>Residential</h4>
                <div className="summary-value">{statsNumbers.residential}</div>
                <div className="summary-detail">Dormitories & Housing</div>
              </div>
              <div className="summary-item">
                <h4>Academic</h4>
                <div className="summary-value">{statsNumbers.academic}</div>
                <div className="summary-detail">Lecture halls & Offices</div>
              </div>
              <div className="summary-item">
                <h4>Other</h4>
                <div className="summary-value">{statsNumbers.other}</div>
                <div className="summary-detail">Uncategorised stock</div>
              </div>
            </div>

            <div className="reports-card">
              <div className="reports-header">
                <div>
                  <h3>Data Report</h3>
                  <p className="reports-subtitle">Snapshot of your dashboard metrics</p>
                </div>
                <button
                  type="button"
                  className="reports-download-button"
                  onClick={handleDownloadReport}
                  disabled={reportLoading}
                >
                  <Download size={16} />
                  <span>{reportLoading ? 'Preparing…' : 'Download CSV'}</span>
                </button>
              </div>

              <div className="reports-body">
                {statsData.map(stat => (
                  <div className="reports-row" key={stat.title}>
                    <span className="reports-label">{stat.title}</span>
                    <span className="reports-value">{stat.value}</span>
                  </div>
                ))}
              </div>

              <div className="reports-chart-summary">
                <h4>Chart distribution</h4>
                <ul>
                  {chartData.map(item => (
                    <li key={item.category}>
                      <span>{item.category}</span>
                      <strong>{item.count}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;