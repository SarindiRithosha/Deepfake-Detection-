import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function AnalysisHistory() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Mock data for analysis history
    const mockAnalysisData = [
        {
            id: 1,
            date: '2025-01-24 14:30',
            filename: 'interview_video.mp4',
            verdict: 'REAL',
            confidence: 96,
            uploadDate: '2025-01-24'
        },
        {
            id: 2,
            date: '2025-01-23 11:15',
            filename: 'news_segment.mov',
            verdict: 'FAKE',
            confidence: 87,
            uploadDate: '2025-01-23'
        },
        {
            id: 3,
            date: '2025-01-22 16:45',
            filename: 'social_media_clip.avi',
            verdict: 'FAKE',
            confidence: 92,
            uploadDate: '2025-01-22'
        },
        {
            id: 4,
            date: '2025-01-21 09:20',
            filename: 'documentary_excerpt.mp4',
            verdict: 'REAL',
            confidence: 98,
            uploadDate: '2025-01-21'
        },
        {
            id: 5,
            date: '2025-01-20 13:10',
            filename: 'vlog_content.mkv',
            verdict: 'FAKE',
            confidence: 76,
            uploadDate: '2025-01-20'
        },
        {
            id: 6,
            date: '2025-01-19 15:35',
            filename: 'tutorial_video.mp4',
            verdict: 'REAL',
            confidence: 94,
            uploadDate: '2025-01-19'
        },
        {
            id: 7,
            date: '2025-01-18 10:05',
            filename: 'promotional_video.mov',
            verdict: 'FAKE',
            confidence: 83,
            uploadDate: '2025-01-18'
        },
        {
            id: 8,
            date: '2025-01-17 17:25',
            filename: 'conference_speech.avi',
            verdict: 'REAL',
            confidence: 97,
            uploadDate: '2025-01-17'
        }
    ];

    // Redirect if not logged in
    useEffect(() => {
        if (!currentUser) {
            navigate('/login');
        }
    }, [currentUser, navigate]);

    // Calculate pagination
    const totalItems = mockAnalysisData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = mockAnalysisData.slice(startIndex, startIndex + itemsPerPage);
    const startItem = startIndex + 1;
    const endItem = Math.min(startIndex + itemsPerPage, totalItems);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleViewDetails = (analysisId) => {
        // Navigate to detailed results page (to be implemented in Phase 2)
        alert(`Viewing details for analysis ID: ${analysisId}\n\nThis feature will be available in Phase 2 with real backend integration.`);
    };

    const getVerdictStyle = (verdict) => {
        return verdict === 'REAL' ? realVerdictStyle : fakeVerdictStyle;
    };

    if (!currentUser) {
        return <div>Loading...</div>;
    }

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                {/* Page Title */}
                <div style={headerStyle}>
                    <h1 style={titleStyle}>Analysis History</h1>
                    <p style={subtitleStyle}>A record of all your video analysis reports.</p>
                </div>

                {/* Analysis Table or Empty State */}
                {mockAnalysisData.length > 0 ? (
                    <>
                        {/* Analysis Table */}
                        <div style={tableContainerStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={tableHeaderStyle}>
                                        <th style={thStyle}>DATE</th>
                                        <th style={thStyle}>FILENAME</th>
                                        <th style={thStyle}>VERDICT</th>
                                        <th style={thStyle}>CONFIDENCE</th>
                                        <th style={thStyle}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((analysis) => (
                                        <tr key={analysis.id} style={tableRowStyle}>
                                            <td style={tdStyle}>{analysis.date}</td>
                                            <td style={tdStyle}>{analysis.filename}</td>
                                            <td style={tdStyle}>
                                                <span style={getVerdictStyle(analysis.verdict)}>
                                                    {analysis.verdict}
                                                </span>
                                            </td>
                                            <td style={{...tdStyle, ...confidenceStyle}}>
                                                {analysis.confidence}%
                                            </td>
                                            <td style={tdStyle}>
                                                <button 
                                                    onClick={() => handleViewDetails(analysis.id)}
                                                    style={viewButtonStyle}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div style={paginationContainerStyle}>
                            {/* Results Count */}
                            <div style={resultsCountStyle}>
                                Showing {startItem} to {endItem} of {totalItems} results
                            </div>

                            {/* Pagination Controls */}
                            <div style={paginationControlsStyle}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={currentPage === 1 ? disabledButtonStyle : paginationButtonStyle}
                                >
                                    <FaChevronLeft style={paginationIconStyle} />
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        style={page === currentPage ? activePageButtonStyle : pageButtonStyle}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    style={currentPage === totalPages ? disabledButtonStyle : paginationButtonStyle}
                                >
                                    Next
                                    <FaChevronRight style={paginationIconStyle} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div style={emptyStateStyle}>
                        <div style={emptyContentStyle}>
                            <h3 style={emptyTitleStyle}>No Analysis History Yet</h3>
                            <p style={emptyTextStyle}>
                                You have no analysis history yet. Go to the Detection page to get started!
                            </p>
                            <button 
                                onClick={() => navigate('/detect')}
                                style={detectButtonStyle}
                            >
                                Go to Detection Page
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Styles
const pageStyle = {
    backgroundColor: '#E5E3E3',
    minHeight: '100vh',
    padding: '2rem 1rem'
};

const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    backgroundColor: '#F8F8F8',
    borderRadius: '15px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    minHeight: '60vh'
};

const headerStyle = {
    marginBottom: '2rem',
    textAlign: 'left'
};

const titleStyle = {
    color: '#013D83',
    fontWeight: 'bold',
    fontSize: '2.2rem',
    margin: '0 0 0.5rem 0'
};

const subtitleStyle = {
    color: 'rgba(109, 109, 109, 0.8)',
    fontWeight: '600',
    fontSize: '1.1rem',
    margin: '0'
};

const tableContainerStyle = {
    overflowX: 'auto',
    marginBottom: '2rem',
    border: '1px solid #e0e0e0',
    borderRadius: '7px',
    backgroundColor: '#F8F8F8'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#F8F8F8',
    borderRadius: '7px'
};

const tableHeaderStyle = {
    backgroundColor: '#A9D6E5',
    borderRadius: '7px 7px 0 0'
};

const thStyle = {
    color: '#013D83',
    fontWeight: 'bold',
    padding: '1rem',
    textAlign: 'left',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    borderBottom: 'none'
};

const tableRowStyle = {
    borderBottom: '1px solid #e0e0e0',
    backgroundColor: '#F8F8F8'
};

const tdStyle = {
    padding: '1rem',
    textAlign: 'left',
    color: 'black',
    fontWeight: 'normal'
};

const realVerdictStyle = {
    backgroundColor: 'rgba(203, 255, 209, 0.45)',
    color: '#2e7d32',
    padding: '0.3rem 0.8rem',
    borderRadius: '15px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'inline-block',
    minWidth: '70px',
    textAlign: 'center'
};

const fakeVerdictStyle = {
    backgroundColor: 'rgba(255, 214, 221, 0.45)',
    color: '#c62828',
    padding: '0.3rem 0.8rem',
    borderRadius: '15px',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'inline-block',
    minWidth: '70px',
    textAlign: 'center'
};

const confidenceStyle = {
    fontWeight: 'bold',
    fontSize: '1.1rem'
};

const viewButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    fontWeight: 'bold',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s ease'
};


const paginationContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    marginTop: '2rem'
};

const resultsCountStyle = {
    color: 'black',
    fontWeight: 'normal',
    fontSize: '0.9rem'
};

const paginationControlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
};

const paginationButtonStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    color: 'black',
    padding: '0.5rem 1rem',
    borderRadius: '5px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease'
};

const disabledButtonStyle = {
    ...paginationButtonStyle,
    color: '#999',
    cursor: 'not-allowed',
    opacity: 0.6
};

const pageButtonStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    color: 'black',
    padding: '0.5rem 0.8rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    minWidth: '40px',
    transition: 'all 0.3s ease'
};

const activePageButtonStyle = {
    ...pageButtonStyle,
    backgroundColor: '#013D83',
    color: 'white',
    borderColor: '#013D83'
};

const paginationIconStyle = {
    fontSize: '0.8rem'
};

const emptyStateStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '300px',
    textAlign: 'center'
};

const emptyContentStyle = {
    maxWidth: '400px'
};

const emptyTitleStyle = {
    color: '#666',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    fontWeight: '600'
};

const emptyTextStyle = {
    color: '#666',
    fontSize: '1rem',
    lineHeight: '1.5',
    marginBottom: '2rem'
};

const detectButtonStyle = {
    backgroundColor: '#013D83',
    color: 'white',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.3s ease'
};

// Hover effects
viewButtonStyle.onMouseOver = { backgroundColor: '#012a5c' };
viewButtonStyle.onMouseOut = { backgroundColor: '#013D83' };

paginationButtonStyle.onMouseOver = { backgroundColor: '#f5f5f5' };
paginationButtonStyle.onMouseOut = { backgroundColor: 'white' };

pageButtonStyle.onMouseOver = { backgroundColor: '#f5f5f5' };
pageButtonStyle.onMouseOut = { backgroundColor: 'white' };

detectButtonStyle.onMouseOver = { backgroundColor: '#012a5c' };
detectButtonStyle.onMouseOut = { backgroundColor: '#013D83' };

export default AnalysisHistory;