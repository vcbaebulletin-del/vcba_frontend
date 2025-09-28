import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, RotateCcw, Trash2, Calendar, User, Image, AlertTriangle } from 'lucide-react';
import { useAdminAuth } from '../../../contexts/AdminAuthContext';
import { welcomePageService, WelcomeCard } from '../../../services/welcomePageService';
import { API_BASE_URL } from '../../../config/constants';

interface ArchivedWelcomeCardsProps {
  onRestoreSuccess?: () => void;
}

const ArchivedWelcomeCards: React.FC<ArchivedWelcomeCardsProps> = ({ onRestoreSuccess }) => {
  const { isAuthenticated } = useAdminAuth();
  const [cards, setCards] = useState<WelcomeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [limit, setLimit] = useState(10);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Filter cards using useMemo for performance
  const filteredCards = useMemo(() => {
    if (searchQuery.trim() === '') {
      return cards;
    }

    return cards.filter(card =>
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cards, searchQuery]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCards();
    } else {
      setError('Authentication required to access archived welcome cards');
      setLoading(false);
    }
  }, [isAuthenticated]); // Load all data once, like CategoryManagement

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleRestore = async (cardId: number) => {
    if (!window.confirm('Are you sure you want to restore this welcome card?')) {
      return;
    }

    setRestoring(cardId);
    try {
      await welcomePageService.restoreCard(cardId);

      // Remove the restored card from the current list
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setTotal(prevTotal => prevTotal - 1);

      // Show success message
      setError('');

      // If current page becomes empty and it's not the first page, go to previous page
      if (cards.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

      console.log(`Card ${cardId} restored successfully`);
    } catch (error) {
      console.error('Failed to restore card:', error);
      setError('Failed to restore card. Please try again.');
    } finally {
      setRestoring(null);
    }
  };

  const loadCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await welcomePageService.getArchivedCards(1, 100); // Use reasonable limit to avoid backend validation errors
      
      if (response.success && response.data) {
        setCards(response.data.data || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } else {
        setError('Failed to load archived welcome cards');
        setCards([]);
      }
    } catch (error: any) {
      console.error('Error loading archived welcome cards:', error);
      setError('Failed to load archived welcome cards');
      setCards([]);
    } finally {
      setLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#6b7280'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p>Loading archived welcome cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#dc2626'
      }}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Search */}
      <div style={{
        position: 'relative',
        marginBottom: '24px',
        maxWidth: '400px'
      }}>
        <Search
          size={20}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280'
          }}
        />
        <input
          type="text"
          placeholder="Search archived cards..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '12px 12px 12px 44px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Cards List */}
      {filteredCards.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: '#6b7280'
        }}>
          <Image size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '500' }}>
            No archived welcome cards found
          </h3>
          <p style={{ margin: 0 }}>
            {searchQuery ? 'Try adjusting your search terms.' : 'Archived welcome cards will appear here.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {filteredCards.map((card) => (
            <div
              key={card.id}
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Card Image */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                  backgroundColor: '#f3f4f6'
                }}>
                  <img
                    src={`${API_BASE_URL}${card.image}`}
                    alt={card.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #9ca3af;"><svg width="24" height="24" fill="currentColor"><path d="M4 4h16v12H4V4zm2 2v8h12V6H6zm2 2h8v4H8V8z"/></svg></div>';
                    }}
                  />
                </div>

                {/* Card Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {card.title}
                    </h3>
                  </div>

                  <p style={{
                    color: '#6b7280',
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {card.description}
                  </p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        <span>Archived: {formatDate(card.created_at)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={14} />
                        <span>By: {card.created_by_name}</span>
                      </div>
                    </div>

                    {/* Restore Button */}
                    <button
                      onClick={() => handleRestore(card.id)}
                      disabled={restoring === card.id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: restoring === card.id ? '#9ca3af' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: restoring === card.id ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onMouseEnter={(e) => {
                        if (restoring !== card.id) {
                          e.currentTarget.style.backgroundColor = '#059669';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (restoring !== card.id) {
                          e.currentTarget.style.backgroundColor = '#10b981';
                        }
                      }}
                    >
                      {restoring === card.id ? (
                        <>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Restoring...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          Restore
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rows per page control */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px 0',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: '#6b7280'
        }}>
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => handleLimitChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: 'white'
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          Showing {cards.length} of {total} archived cards
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          marginTop: '32px'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f9fafb' : 'white',
              color: currentPage === 1 ? '#9ca3af' : '#374151',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Previous
          </button>
          
          <span style={{
            padding: '8px 16px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              padding: '8px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: currentPage === totalPages ? '#f9fafb' : 'white',
              color: currentPage === totalPages ? '#9ca3af' : '#374151',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ArchivedWelcomeCards;
