import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Building, Users, MapPin, Plus, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback static data
  const fallbackStatsData = [
    { title: 'Total Buildings', value: '20', icon: Building, color: 'orange' },
    { title: 'New Buildings', value: '2', icon: Plus, color: 'orange' },
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
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const [overviewData, quickStats] = await Promise.all([
          apiService.getDashboardOverview().catch(() => null),
          apiService.getQuickStats().catch(() => null)
        ]);
        
        if (overviewData && quickStats) {
          setDashboardData({ overview: overviewData, quickStats });
        } else {
          // Use fallback data if API is not available
          console.warn('API not available, using fallback data');
          setDashboardData(null);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Use API data if available, otherwise use fallback
  const statsData = dashboardData?.quickStats?.data ? [
    { title: 'Total Buildings', value: dashboardData.quickStats.data.buildings?.total?.toString() || '0', icon: Building, color: 'orange' },
    { title: 'Active Buildings', value: dashboardData.quickStats.data.buildings?.total?.toString() || '0', icon: Plus, color: 'orange' },
    { title: 'Total Paths', value: dashboardData.quickStats.data.paths?.total?.toString() || '0', icon: MapPin, color: 'orange' },
    { title: 'Total Users', value: dashboardData.quickStats.data.users?.total?.toString() || '0', icon: Users, color: 'orange' }
  ] : fallbackStatsData;

  const chartData = dashboardData?.overview?.data?.userGrowth || fallbackChartData;

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
        {!dashboardData && (
          <div className="fallback-notice">
            <small>Using offline data - API unavailable</small>
          </div>
        )}
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
            <h3>Users</h3>
            <div className="chart-period">Yearly ▼</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="year" 
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
                  dataKey="users" 
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
              <h4>Top month</h4>
              <div className="summary-value">November</div>
              <div className="summary-detail">2018</div>
            </div>
            <div className="summary-item">
              <h4>Top year</h4>
              <div className="summary-value">2023</div>
              <div className="summary-detail">96K Users in total</div>
            </div>
            <div className="summary-item">
              <h4>Most active group</h4>
              <div className="summary-value">Male: 18 → 25</div>
              <div className="summary-detail">Mostly active during the day</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;