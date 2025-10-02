import React, { useState, useEffect } from 'react'; 
import { FaBell, FaChartLine, FaUsers, FaChartBar, FaUserFriends, FaBullseye, FaArrowUp, FaArrowDown, FaMinus, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const [kpiData, setKpiData] = useState({
    totalAnalysis: { value: 0, trend: '+0%', trendType: 'up' },
    activeUsers: { value: 0 },
    modelAccuracy: { value: '90%', trend: '+3%', trendType: 'up' }
  });

    const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:8000/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        
        // Update KPI data with real values
        setKpiData({
          totalAnalysis: { 
            value: data.total_analyses, 
            trend: data.analysis_trend.trend_display, 
            trendType: data.analysis_trend.trend_type 
          },
          activeUsers: { value: data.active_users },
          modelAccuracy: { value: '90%', trend: '+3%', trendType: 'up' }
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };


    useEffect(() => {
        const checkAdminAuth = async () => {
        const token = localStorage.getItem('adminToken');
        const storedAdmin = localStorage.getItem('adminUser');

        if (!token || !storedAdmin) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/auth/admin/verify?token=${token}`); 


            if (response.ok) {
            setAdminUser(JSON.parse(storedAdmin));
            await fetchDashboardData();
            } else {
            // Invalid token, redirect to login
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/login');
            }
        } catch (error) {
            console.error('Admin verification failed:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            navigate('/login');
        } finally {
            setIsLoading(false);
        }
        };

        checkAdminAuth();
    }, [navigate]);

     useEffect(() => {
    if (activeNav === 'dashboard' && adminUser) {
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000); 

      return () => {
        clearInterval(interval);
      };
    }
  }, [activeNav, adminUser]);

    const handleLogout = async () => {
        const token = localStorage.getItem('adminToken');
        
        if (token) {
        try {
            await fetch('http://localhost:8000/auth/admin-logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token })
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        }

        // Clear admin session
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    if (isLoading) {
        return (
        <div style={adminLayoutStyle}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>Loading Admin Dashboard...</p>
            </div>
        </div>
        );
    }

    if (!adminUser) {
        return null;
    }

    // Mock data for charts
    const accuracyData = [
        { month: 'Jan', accuracy: 85 },
        { month: 'Feb', accuracy: 87 },
        { month: 'Mar', accuracy: 89 },
        { month: 'Apr', accuracy: 88 },
        { month: 'May', accuracy: 91 },
        { month: 'Jun', accuracy: 90 }
    ];

    const cpuUsage = 65; // 65%

    const getTrendIcon = (trendType) => {
        switch (trendType) {
            case 'up': return <FaArrowUp style={{ color: '#28a745', fontSize: '12px' }} />;
            case 'down': return <FaArrowDown style={{ color: '#dc3545', fontSize: '12px' }} />;
            default: return <FaMinus style={{ color: '#ffc107', fontSize: '12px' }} />;
        }
    };

    const getTrendColor = (trendType) => {
        switch (trendType) {
            case 'up': return '#28a745';
            case 'down': return '#dc3545';
            default: return '#ffc107';
        }
    };

    return (
        <div style={adminLayoutStyle}>
            <header style={headerWrapperStyle}>
                {/* Left (Logo) Section */}
                <div style={headerLeftStyle}>
                    <img
                    src={process.env.PUBLIC_URL + "/admin logo2.png"}
                    alt="Verity-X Admin"
                    style={logoStyle}
                    />
                </div>

                {/* Right (User + Notifications) Section */}
                <div style={headerRightStyle}>
                    <button style={iconButtonStyle}>
                    <FaBell style={bellIconStyle} />
                    </button>

                    <div style={verticalSeparatorStyle}></div>

                    <div style={userDropdownContainerStyle}>
                    <button
                        style={userButtonStyle}
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                    >
                        <FaUserCircle style={userCircleStyle} />
                        <span style={adminNameStyle}>Admin</span>
                    </button>
                    {showUserDropdown && (
                        <div style={dropdownMenuStyle}>
                        <button style={dropdownItemStyle} onClick={handleLogout} >
                            Logout
                        </button>
                        </div>
                    )}
                    </div>
                </div>
            </header>


            <div style={mainContainerStyle}>
                {/* Fixed Navigation Sidebar */}
                <nav style={sidebarStyle}>
                    <button 
                        onClick={() => setActiveNav('dashboard')}
                        style={activeNav === 'dashboard' ? activeNavButtonStyle : navButtonStyle}
                    >
                        <FaChartLine style={navIconStyle} />
                        Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveNav('users')}
                        style={activeNav === 'users' ? activeNavButtonStyle : navButtonStyle}
                    >
                        <FaUsers style={navIconStyle} />
                        User Management
                    </button>
                </nav>

                {/* Main Content Area */}
                <main style={contentStyle}>
                    {activeNav === 'dashboard' ? (
                        /* Dashboard Content */
                        <div>
                            {/* Page Header */}
                            <div style={pageHeaderStyle}>
                                <h1 style={pageTitleStyle}>Admin Dashboard</h1>
                                <p style={pageSubtitleStyle}>Overview of system performance and analytics
                                     <span style={{ 
                                        fontSize: '0.9rem', 
                                        color: '#28a745', 
                                        marginLeft: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: '#28a745',
                                        animation: 'pulse 2s infinite'
                                        }}></div>
                                        Auto-updating every 30 seconds
                                    </span>
                                </p>
                            </div>

                            {/* KPI Cards */}
                            <div style={kpiGridStyle}>
                                {/* Total Analysis Card */}
                                <div style={kpiCardStyle}>
                                    <div style={kpiContentStyle}>
                                        <div>
                                            <p style={kpiLabelStyle}>Total Analysis</p>
                                            <h2 style={kpiValueStyle}>{kpiData.totalAnalysis.value}</h2>
                                            <div style={{...trendStyle, color: getTrendColor(kpiData.totalAnalysis.trendType)}}>
                                                {getTrendIcon(kpiData.totalAnalysis.trendType)}
                                                <span style={trendTextStyle}>{kpiData.totalAnalysis.trend}</span>
                                            </div>
                                        </div>
                                        <FaChartBar style={kpiIconStyle} />
                                    </div>
                                </div>

                                {/* Active Users Card */}
                                <div style={kpiCardStyle}>
                                    <div style={kpiContentStyle}>
                                        <div>
                                            <p style={kpiLabelStyle}>Active Users</p>
                                            <h2 style={kpiValueStyle}>{kpiData.activeUsers.value}</h2>
                                        </div>
                                        <FaUserFriends style={kpiIconStyle} />
                                    </div>
                                </div>

                                {/* Model Accuracy Card */}
                                <div style={kpiCardStyle}>
                                    <div style={kpiContentStyle}>
                                        <div>
                                            <p style={kpiLabelStyle}>Model Accuracy</p>
                                            <h2 style={kpiValueStyle}>{kpiData.modelAccuracy.value}</h2>
                                            <div style={{...trendStyle, color: getTrendColor(kpiData.modelAccuracy.trendType)}}>
                                                {getTrendIcon(kpiData.modelAccuracy.trendType)}
                                                <span style={trendTextStyle}>{kpiData.modelAccuracy.trend}</span>
                                            </div>
                                        </div>
                                        <FaBullseye style={kpiIconStyle} />
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Performance Visualizations */}
                            <div style={visualizationGridStyle}>
                                {/* Model Accuracy Statistics */}
                                <div style={visualizationCardStyle}>
                                    <h3 style={cardTitleStyle}>Model Accuracy Trends</h3>
                                    <div style={chartContainerStyle}>
                                        {/* Mock Line Chart */}
                                        <div style={lineChartStyle}>
                                            <div style={chartYAxisStyle}>
                                                <span>100%</span>
                                                <span>95%</span>
                                                <span>90%</span>
                                                <span>85%</span>
                                            </div>
                                            <div style={chartAreaStyle}>
                                                <div style={chartLineStyle}>
                                                    {accuracyData.map((point, index) => (
                                                        <div 
                                                            key={index}
                                                            style={{
                                                                ...dataPointStyle,
                                                                left: `${(index / (accuracyData.length - 1)) * 100}%`,
                                                                bottom: `${((point.accuracy - 85) / 15) * 100}%`
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <div style={chartXAxisStyle}>
                                                    {accuracyData.map(point => (
                                                        <span key={point.month} style={xAxisLabelStyle}>
                                                            {point.month}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* System Performance Metrics */}
                                <div style={visualizationCardStyle}>
                                    <h3 style={cardTitleStyle}>System Performance</h3>
                                    <div style={donutChartContainerStyle}>
                                        {/* Mock Half Donut Chart */}
                                        <div style={donutChartStyle}>
                                            <div style={donutFillStyle(cpuUsage)}></div>
                                            <div style={donutCenterStyle}>
                                                <div style={cpuPercentageStyle}>{cpuUsage}%</div>
                                                <div style={cpuLabelStyle}>CPU Usage</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* User Management Content */
                        <UserManagement />
                    )}
                </main>
            </div>

            {/* Fixed Footer */}
            <footer style={footerStyle}>
                <p style={footerTextStyle}>© 2025 Verity-X. All rights reserved.</p>
            </footer>
        </div>
    );
}

// User Management Component
function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (search = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = search 
        ? `http://localhost:8000/admin/users?search=${encodeURIComponent(search)}`
        : 'http://localhost:8000/admin/users';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsersData(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(searchQuery);
    };

    const getStatusStyle = (status) => {
        return status === 'Active' ? activeStatusStyle : inactiveStatusStyle;
    };

    if (loading) {
        return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <p>Loading users...</p>
        </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div style={pageHeaderStyle}>
                <h1 style={pageTitleStyle}>User Management</h1>
            </div>

            {/* Search Bar */}
            <div style={searchContainerStyle}>
                <div style={searchBarStyle}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={searchInputStyle}
                    />
                    <button style={searchButtonStyle}>
                        Search
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div style={tableCardStyle}>
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={tableHeaderStyle}>
                                <th style={thStyle}>ID</th>
                                <th style={thStyle}>NAME</th>
                                <th style={thStyle}>EMAIL</th>
                                <th style={thStyle}>ANALYSES</th>
                                <th style={thStyle}>STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersData.map((user, index) => (
                                <tr key={user.uid} style={index % 2 === 0 ? evenRowStyle : oddRowStyle}>
                                    <td style={tdStyle}>{user.id.toString().padStart(3, '0')}</td>
                                    <td style={{...tdStyle, ...nameCellStyle}}>{user.name}</td>
                                    <td style={{...tdStyle, ...emailCellStyle}}>{user.email}</td>
                                    <td style={{...tdStyle, ...analysesCellStyle}}>{user.analyses}</td>
                                    <td style={tdStyle}>
                                        <span style={getStatusStyle(user.status)}>
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Styles
const adminLayoutStyle = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh'
};

const headerWrapperStyle = {
  display: "flex",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  height: "70px",
  zIndex: 1000
};

// Left (logo) container
const headerLeftStyle = {
  width: "240px",
  backgroundColor: "#013D83",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 1rem"
};

const logoStyle = {
  height: "50px"
};

// Right container (notifications + user)
const headerRightStyle = {
  flex: 1,
  backgroundColor: "#E5E3E3",  
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: "0 2rem",
  //boxShadow: "0 2px 6px rgba(199, 199, 199, 0.98)"
};

const iconButtonStyle = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0.5rem"
};

const bellIconStyle = {
  color: "#444", 
  fontSize: "1.4rem"
};

const verticalSeparatorStyle = {
  width: "1px",
  height: "24px",
  backgroundColor: "#2b2b2b60",
  margin: "0 1rem"
};

const userDropdownContainerStyle = {
  position: "relative"
};

const userButtonStyle = {
  background: "none",
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
  padding: "0.5rem"
};

const userCircleStyle = {
  fontSize: "1.6rem",
  color: "#444" 
};

const adminNameStyle = {
  fontWeight: "500",
  color: "#444" 
};

const dropdownMenuStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '5px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    minWidth: '120px',
    zIndex: 1001
};

const dropdownItemStyle = {
    width: '100%',
    padding: '0.75rem 1rem',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#333'
};

const mainContainerStyle = {
    display: 'flex',
    flex: 1,
    marginTop: '70px'
};

const sidebarStyle = {
    backgroundColor: '#013D83',
    width: '240px',
    padding: '2rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    position: 'fixed',
    height: 'calc(100vh - 70px)',
    left: 0
};

const navButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#013D83',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '5px',
    fontSize: '1rem',
    transition: 'all 0.3s ease'
};

const activeNavButtonStyle = {
    ...navButtonStyle,
    backgroundColor: 'white',
    color: '#013D83'
};

const navIconStyle = {
    fontSize: '1.1rem'
};

const contentStyle = {
    flex: 1,
    backgroundColor: '#E5E3E3',
    paddingRight: '2rem',
    paddingLeft: '2rem',
    paddingTop: '0rem',
    paddingBottom: '2rem',
    marginLeft: '240px',
    minHeight: 'calc(100vh - 140px)'
};

const footerStyle = {
    backgroundColor: '#E5E3E3',
    padding: '1rem',
    textAlign: 'center',
    marginLeft: '250px'
};

const footerTextStyle = {
    color: 'rgba(81, 80, 80, 0.7)',
    margin: 0,
    fontSize: '0.9rem'
};

const pageHeaderStyle = {
    marginBottom: '2rem'
};

const pageTitleStyle = {
    color: '#013D83',
    fontWeight: 'bold',
    fontSize: '2.5rem',
    margin: '0 0 0.5rem 0'
};

const pageSubtitleStyle = {
    color: '#666',
    fontSize: '1.1rem',
    margin: 0
};

const kpiGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
};

const kpiCardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};

const kpiContentStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
};

const kpiLabelStyle = {
    color: '#666',
    margin: '0 0 0.5rem 0',
    fontSize: '1rem'
};

const kpiValueStyle = {
    color: '#013D83',
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0'
};

const trendStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
    fontWeight: '600'
};

const trendTextStyle = {
    marginLeft: '0.25rem'
};

const kpiIconStyle = {
    color: '#013D83',
    fontSize: '2rem',
    opacity: 0.7
};

const visualizationGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '1.5rem'
};

const visualizationCardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '1.5rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};

const cardTitleStyle = {
    color: '#013D83',
    fontWeight: '600',
    fontSize: '1.3rem',
    margin: '0 0 1.5rem 0'
};

const chartContainerStyle = {
    height: '250px'
};

const lineChartStyle = {
    display: 'flex',
    height: '90%',
    position: 'relative'
};

const chartYAxisStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingRight: '1rem',
    fontSize: '0.8rem',
    color: '#666'
};

const chartAreaStyle = {
    flex: 1,
    position: 'relative',
    borderLeft: '1px solid #e0e0e0',
    borderBottom: '1px solid #e0e0e0'
};

const chartLineStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '20px'
};

const dataPointStyle = {
    position: 'absolute',
    width: '8px',
    height: '8px',
    backgroundColor: '#013D83',
    borderRadius: '50%',
    transform: 'translate(-50%, 50%)'
};

const chartXAxisStyle = {
    position: 'absolute',
    bottom: '-25px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 10px'
};

const xAxisLabelStyle = {
    fontSize: '0.8rem',
    color: '#666'
};

const donutChartContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
};

const donutChartStyle = {
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    background: 'conic-gradient(#013D83 0% 65%, #e0e0e0 65% 100%)',
    position: 'relative',
    transform: 'rotate(-90deg)'
};

const donutFillStyle = (percentage) => ({
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    bottom: '10px',
    backgroundColor: 'white',
    borderRadius: '50%',
    transform: 'rotate(90deg)'
});

const donutCenterStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(90deg)',
    textAlign: 'center'
};

const cpuPercentageStyle = {
    color: '#013D83',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
};

const cpuLabelStyle = {
    color: '#666',
    fontSize: '0.8rem',
    margin: 0
};

// User Management Styles
const searchContainerStyle = {
    marginBottom: '2rem'
};

const searchBarStyle = {
    display: 'flex',
    gap: '0.5rem',
    maxWidth: '400px'
};

const searchInputStyle = {
    flex: 1,
    padding: '0.75rem',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '1rem'
};

const searchButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem'
};

const tableCardStyle = {
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    overflow: 'hidden'
};

const tableContainerStyle = {
    maxHeight: '600px',
    overflowY: 'auto'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
};

const tableHeaderStyle = {
    backgroundColor: '#A9D6E5',
    position: 'sticky',
    top: 0,
    zIndex: 10
};

const thStyle = {
    color: '#013D83',
    fontWeight: 'bold',
    padding: '1rem',
    textAlign: 'left',
    textTransform: 'uppercase',
    fontSize: '0.9rem'
};

const evenRowStyle = {
    backgroundColor: '#FFFFFF'
};

const oddRowStyle = {
    backgroundColor: '#F8F8F8'
};

const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid #e0e0e0'
};

const nameCellStyle = {
    color: '#013D83',
    fontWeight: 'normal'
};

const emailCellStyle = {
    color: '#666'
};

const analysesCellStyle = {
    fontWeight: 'bold',
    color: 'black'
};

const activeStatusStyle = {
    backgroundColor: 'rgba(191, 253, 198, 0.7)',
    color: '#2e7d32',
    padding: '0.3rem 0.8rem',
    borderRadius: '15px',
    fontWeight: '600',
    fontSize: '0.8rem',
    display: 'inline-block',
    minWidth: '70px',
    textAlign: 'center'
};

const inactiveStatusStyle = {
    backgroundColor: 'rgba(255, 178, 191, 0.7)',
    color: '#c62828',
    padding: '0.3rem 0.8rem',
    borderRadius: '15px',
    fontWeight: '600',
    fontSize: '0.8rem',
    display: 'inline-block',
    minWidth: '70px',
    textAlign: 'center'
};

export default AdminDashboard;