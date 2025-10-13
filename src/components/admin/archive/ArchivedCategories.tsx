import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, User, RotateCcw, FolderTree, Tag, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { categoryService } from '../../../services/categoryService';

interface ArchivedCategory {
  category_id: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

interface ArchivedSubcategory {
  subcategory_id: number;
  category_id: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
  category_name?: string;
  category_color?: string;
}

const ArchivedCategories: React.FC = () => {
  const [categories, setCategories] = useState<ArchivedCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ArchivedSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restoring, setRestoring] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');

  // Search states
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states
  const [categoryPage, setCategoryPage] = useState(1);
  const [subcategoryPage, setSubcategoryPage] = useState(1);
  const [categoryLimit, setCategoryLimit] = useState(10);
  const [subcategoryLimit, setSubcategoryLimit] = useState(10);
  const [categoryTotal, setCategoryTotal] = useState(0);
  const [subcategoryTotal, setSubcategoryTotal] = useState(0);

  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCategoryPage(1);
    setSubcategoryPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCategoryPage(1);
    setSubcategoryPage(1);
  };

  // Filter categories and subcategories using useMemo for performance
  const filteredCategories = useMemo(() => {
    if (searchQuery.trim() === '') {
      return categories;
    }

    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const filteredSubcategories = useMemo(() => {
    if (searchQuery.trim() === '') {
      return subcategories;
    }

    return subcategories.filter(subcategory =>
      subcategory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (subcategory.description && subcategory.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (subcategory.category_name && subcategory.category_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [subcategories, searchQuery]);

  const loadArchivedCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getArchivedCategories(categoryPage, categoryLimit);
      setCategories(response.data.categories || []);
      setCategoryTotal(response.data.pagination?.total || 0);
      setError('');
    } catch (error: any) {
      console.error('Failed to load archived categories:', error);

      // Check if API is unavailable
      const isApiUnavailable = error.response?.status === 404 ||
                              error.code === 'ECONNREFUSED' ||
                              error.message.includes('Network Error') ||
                              error.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError('Failed to load archived categories. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedSubcategories = async () => {
    try {
      setLoading(true);
      const response = await categoryService.getArchivedSubcategories(subcategoryPage, subcategoryLimit);
      setSubcategories(response.data.subcategories || []);
      setSubcategoryTotal(response.data.pagination?.total || 0);
      setError('');
    } catch (error: any) {
      console.error('Failed to load archived subcategories:', error);

      // Check if API is unavailable
      const isApiUnavailable = error.response?.status === 404 ||
                              error.code === 'ECONNREFUSED' ||
                              error.message.includes('Network Error') ||
                              error.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError('Failed to load archived subcategories. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'categories') {
      loadArchivedCategories();
    } else {
      loadArchivedSubcategories();
    }
  }, [activeTab, categoryPage, categoryLimit, subcategoryPage, subcategoryLimit]);

  const handleRestoreCategory = async (categoryId: number) => {
    if (!window.confirm('Are you sure you want to restore this category?')) {
      return;
    }

    setRestoring(categoryId);
    try {
      await categoryService.restoreCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
      setCategoryTotal(prev => prev - 1);
      setError('');
    } catch (error: any) {
      console.error('Failed to restore category:', error);

      // Check if API is unavailable
      const isApiUnavailable = error.response?.status === 404 ||
                              error.code === 'ECONNREFUSED' ||
                              error.message.includes('Network Error') ||
                              error.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError('Failed to restore category. Please try again.');
      }
    } finally {
      setRestoring(null);
    }
  };

  const handleRestoreSubcategory = async (subcategoryId: number) => {
    if (!window.confirm('Are you sure you want to restore this subcategory?')) {
      return;
    }

    setRestoring(subcategoryId);
    try {
      await categoryService.restoreSubcategory(subcategoryId);
      setSubcategories(prev => prev.filter(sub => sub.subcategory_id !== subcategoryId));
      setSubcategoryTotal(prev => prev - 1);
      setError('');
    } catch (error: any) {
      console.error('Failed to restore subcategory:', error);

      // Check if API is unavailable
      const isApiUnavailable = error.response?.status === 404 ||
                              error.code === 'ECONNREFUSED' ||
                              error.message.includes('Network Error') ||
                              error.message.includes('Failed to fetch');

      if (isApiUnavailable) {
        setError('⚠️ Backend API not available. Please ensure the server is running on port 5000.');
      } else {
        setError('Failed to restore subcategory. Please try again.');
      }
    } finally {
      setRestoring(null);
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

  const categoryTotalPages = Math.ceil(categoryTotal / categoryLimit);
  const subcategoryTotalPages = Math.ceil(subcategoryTotal / subcategoryLimit);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div>
        <div>

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '24px'
          }}>
            <button
              onClick={() => setActiveTab('categories')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'categories' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'categories' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'categories' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FolderTree size={16} />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('subcategories')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'subcategories' ? '2px solid #3b82f6' : '2px solid transparent',
                color: activeTab === 'subcategories' ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === 'subcategories' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Tag size={16} />
              Subcategories
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            marginBottom: '24px'
          }}>
            <div style={{ position: 'relative', maxWidth: '400px' }}>
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
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={handleSearchChange}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
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
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '0.25rem',
                    borderRadius: '0.25rem',
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
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '48px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #3b82f6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            </div>
          )}

          {/* Categories Tab */}
          {!loading && activeTab === 'categories' && (
            <div>
              {/* Categories Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Showing {filteredCategories.length} of {categoryTotal} archived categories
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <label style={{ color: '#6b7280', fontSize: '14px' }}>
                    Rows per page:
                  </label>
                  <select
                    value={categoryLimit}
                    onChange={(e) => {
                      setCategoryLimit(Number(e.target.value));
                      setCategoryPage(1);
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Categories List */}
              {filteredCategories.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#6b7280'
                }}>
                  <FolderTree size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>{searchQuery ? 'No categories match your search criteria' : 'No archived categories found'}</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {filteredCategories.map((category) => (
                    <div
                      key={category.category_id}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      {/* Color indicator */}
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: category.color_code,
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      />

                      {/* Category info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '4px'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {category.name}
                          </h3>
                        </div>

                        {category.description && (
                          <p style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            margin: '4px 0 0 0',
                            lineHeight: '1.4'
                          }}>
                            {category.description}
                          </p>
                        )}
                      </div>

                      {/* Deleted date */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#6b7280',
                        flexShrink: 0
                      }}>
                        <Calendar size={14} />
                        <span>Deleted: {formatDate(category.deleted_at)}</span>
                      </div>

                      {/* Restore button */}
                      <button
                        onClick={() => handleRestoreCategory(category.category_id)}
                        disabled={restoring === category.category_id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: restoring === category.category_id ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: restoring === category.category_id ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        {restoring === category.category_id ? (
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
                            <RotateCcw size={12} />
                            Restore
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Categories Pagination */}
              {categoryTotalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => setCategoryPage(prev => Math.max(1, prev - 1))}
                    disabled={categoryPage === 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: categoryPage === 1 ? '#f3f4f6' : 'white',
                      color: categoryPage === 1 ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: categoryPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <span style={{
                    padding: '8px 16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Page {categoryPage} of {categoryTotalPages}
                  </span>
                  
                  <button
                    onClick={() => setCategoryPage(prev => Math.min(categoryTotalPages, prev + 1))}
                    disabled={categoryPage === categoryTotalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: categoryPage === categoryTotalPages ? '#f3f4f6' : 'white',
                      color: categoryPage === categoryTotalPages ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: categoryPage === categoryTotalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Subcategories Tab */}
          {!loading && activeTab === 'subcategories' && (
            <div>
              {/* Subcategories Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    Showing {filteredSubcategories.length} of {subcategoryTotal} archived subcategories
                    {searchQuery && ` (filtered by "${searchQuery}")`}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <label style={{ color: '#6b7280', fontSize: '14px' }}>
                    Rows per page:
                  </label>
                  <select
                    value={subcategoryLimit}
                    onChange={(e) => {
                      setSubcategoryLimit(Number(e.target.value));
                      setSubcategoryPage(1);
                    }}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Subcategories List */}
              {filteredSubcategories.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '48px',
                  color: '#6b7280'
                }}>
                  <Tag size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>{searchQuery ? 'No subcategories match your search criteria' : 'No archived subcategories found'}</p>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginBottom: '24px'
                }}>
                  {filteredSubcategories.map((subcategory) => (
                    <div
                      key={subcategory.subcategory_id}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      {/* Color indicator */}
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: subcategory.color_code,
                          borderRadius: '4px',
                          flexShrink: 0
                        }}
                      />

                      {/* Subcategory info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '4px'
                        }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: '#1f2937',
                            margin: 0
                          }}>
                            {subcategory.name}
                          </h3>
                          <span style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            backgroundColor: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {subcategory.category_name || 'Unknown Category'}
                          </span>
                        </div>

                        {subcategory.description && (
                          <p style={{
                            color: '#6b7280',
                            fontSize: '14px',
                            margin: '4px 0 0 0',
                            lineHeight: '1.4'
                          }}>
                            {subcategory.description}
                          </p>
                        )}
                      </div>

                      {/* Deleted date */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#6b7280',
                        flexShrink: 0
                      }}>
                        <Calendar size={14} />
                        <span>Deleted: {formatDate(subcategory.deleted_at)}</span>
                      </div>

                      {/* Restore button */}
                      <button
                        onClick={() => handleRestoreSubcategory(subcategory.subcategory_id)}
                        disabled={restoring === subcategory.subcategory_id}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: restoring === subcategory.subcategory_id ? '#9ca3af' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          cursor: restoring === subcategory.subcategory_id ? 'not-allowed' : 'pointer',
                          transition: 'background-color 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          flexShrink: 0
                        }}
                      >
                        {restoring === subcategory.subcategory_id ? (
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
                            <RotateCcw size={12} />
                            Restore
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Subcategories Pagination */}
              {subcategoryTotalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '24px'
                }}>
                  <button
                    onClick={() => setSubcategoryPage(prev => Math.max(1, prev - 1))}
                    disabled={subcategoryPage === 1}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: subcategoryPage === 1 ? '#f3f4f6' : 'white',
                      color: subcategoryPage === 1 ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: subcategoryPage === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <span style={{
                    padding: '8px 16px',
                    color: '#374151',
                    fontSize: '14px'
                  }}>
                    Page {subcategoryPage} of {subcategoryTotalPages}
                  </span>

                  <button
                    onClick={() => setSubcategoryPage(prev => Math.min(subcategoryTotalPages, prev + 1))}
                    disabled={subcategoryPage === subcategoryTotalPages}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: subcategoryPage === subcategoryTotalPages ? '#f3f4f6' : 'white',
                      color: subcategoryPage === subcategoryTotalPages ? '#9ca3af' : '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: subcategoryPage === subcategoryTotalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ArchivedCategories;
