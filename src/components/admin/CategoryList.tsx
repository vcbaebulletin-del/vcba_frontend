import React, { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Plus, ChevronDown, ChevronRight, FolderTree, Tag, AlertTriangle } from 'lucide-react';

interface Subcategory {
  subcategory_id?: number;
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface Category {
  category_id?: number;
  name: string;
  description?: string;
  color_code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  subcategories?: Subcategory[];
}

interface CategoryListProps {
  categories: Category[];
  loading: boolean;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onToggleCategoryStatus: (category: Category) => void;
  onAddSubcategory: (category: Category) => void;
  onEditSubcategory: (category: Category, subcategory: Subcategory) => void;
  onDeleteSubcategory: (category: Category, subcategory: Subcategory) => void;
  onToggleSubcategoryStatus: (category: Category, subcategory: Subcategory) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  loading,
  onEditCategory,
  onDeleteCategory,
  onToggleCategoryStatus,
  onAddSubcategory,
  onEditSubcategory,
  onDeleteSubcategory,
  onToggleSubcategoryStatus
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'category' | 'subcategory'>('category');

  // Helper function to check if a category has active subcategories
  const hasActiveSubcategories = (category: Category): boolean => {
    return category.subcategories?.some(sub => sub.is_active && !sub.deleted_at) || false;
  };

  // Helper function to get active subcategories count
  const getActiveSubcategoriesCount = (category: Category): number => {
    return category.subcategories?.filter(sub => sub.is_active && !sub.deleted_at).length || 0;
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleDeleteClick = (category: Category, subcategory?: Subcategory) => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory || null);
    setDeleteType(subcategory ? 'subcategory' : 'category');
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedCategory) {
      if (deleteType === 'subcategory' && selectedSubcategory) {
        onDeleteSubcategory(selectedCategory, selectedSubcategory);
      } else {
        onDeleteCategory(selectedCategory);
      }
    }
    setShowDeleteModal(false);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        color: '#6b7280'
      }}>
        <FolderTree size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: '600' }}>
          No Categories Found
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem' }}>
          Create your first category to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {categories.map((category, index) => (
          <div
            key={category.category_id || `category-${index}`}
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}
          >
            {/* Category Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: category.subcategories && category.subcategories.length > 0 ? '1px solid #f3f4f6' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Category Info */}
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                  {/* Color Indicator */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: category.color_code,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}>
                    <FolderTree size={24} color="white" />
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1f2937'
                      }}>
                        {category.name}
                      </h3>
                      
                      {!category.is_active && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#ef4444',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          INACTIVE
                        </span>
                      )}

                      {category.subcategories && category.subcategories.length > 0 && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: hasActiveSubcategories(category) ? '#fef3c7' : '#f3f4f6',
                          color: hasActiveSubcategories(category) ? '#d97706' : '#6b7280',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          {getActiveSubcategoriesCount(category)} active / {category.subcategories.length} total subcategories
                        </span>
                      )}
                    </div>

                    {category.description && (
                      <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {category.subcategories && category.subcategories.length > 0 && (
                    <button
                      onClick={() => category.category_id && toggleCategory(category.category_id)}
                      title={category.category_id && expandedCategories.has(category.category_id) ? 'Collapse' : 'Expand'}
                      style={{
                        padding: '0.5rem',
                        background: '#f3f4f6',
                        color: '#6b7280',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {category.category_id && expandedCategories.has(category.category_id) ?
                        <ChevronDown size={16} /> :
                        <ChevronRight size={16} />
                      }
                    </button>
                  )}

                  <button
                    onClick={() => onAddSubcategory(category)}
                    title="Add Subcategory"
                    style={{
                      padding: '0.5rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={16} />
                  </button>

                  <button
                    onClick={() => onEditCategory(category)}
                    title="Edit Category"
                    style={{
                      padding: '0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    onClick={() => onToggleCategoryStatus(category)}
                    title={category.is_active ? 'Deactivate Category' : 'Activate Category'}
                    style={{
                      padding: '0.5rem',
                      background: category.is_active ? '#f59e0b' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {category.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>

                  {/* Conditionally render delete button based on active subcategories */}
                  {hasActiveSubcategories(category) ? (
                    // Show disabled button with tooltip for categories with active subcategories
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        disabled
                        title={`Cannot delete category with ${getActiveSubcategoriesCount(category)} active subcategories. Please delete or deactivate subcategories first.`}
                        style={{
                          padding: '0.5rem',
                          background: '#d1d5db',
                          color: '#9ca3af',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.6
                        }}
                      >
                        <AlertTriangle size={16} />
                      </button>
                    </div>
                  ) : (
                    // Show normal delete button for categories without active subcategories
                    <button
                      onClick={() => handleDeleteClick(category)}
                      title="Delete Category"
                      style={{
                        padding: '0.5rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Subcategories */}
            {category.subcategories &&
             category.subcategories.length > 0 &&
             category.category_id &&
             expandedCategories.has(category.category_id) && (
              <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {category.subcategories
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((subcategory, subIndex) => (
                    <div
                      key={subcategory.subcategory_id || `subcategory-${subIndex}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      {/* Subcategory Info */}
                      <div style={{ display: 'flex', gap: '0.75rem', flex: 1 }}>
                        {/* Color Indicator */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          background: subcategory.color_code,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Tag size={16} color="white" />
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '0.875rem',
                              fontWeight: '600',
                              color: '#1f2937'
                            }}>
                              {subcategory.name}
                            </h4>
                            
                            {!subcategory.is_active && (
                              <span style={{
                                padding: '0.125rem 0.375rem',
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '3px',
                                fontSize: '0.625rem',
                                fontWeight: '600'
                              }}>
                                INACTIVE
                              </span>
                            )}

                            <span style={{
                              padding: '0.125rem 0.375rem',
                              background: '#e5e7eb',
                              color: '#6b7280',
                              borderRadius: '3px',
                              fontSize: '0.625rem',
                              fontWeight: '600'
                            }}>
                              Order: {subcategory.display_order}
                            </span>
                          </div>

                          {subcategory.description && (
                            <p style={{
                              margin: 0,
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              lineHeight: '1.3'
                            }}>
                              {subcategory.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Subcategory Actions */}
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          onClick={() => onEditSubcategory(category, subcategory)}
                          title="Edit Subcategory"
                          style={{
                            padding: '0.375rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Edit size={14} />
                        </button>

                        <button
                          onClick={() => onToggleSubcategoryStatus(category, subcategory)}
                          title={subcategory.is_active ? 'Deactivate' : 'Activate'}
                          style={{
                            padding: '0.375rem',
                            background: subcategory.is_active ? '#f59e0b' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {subcategory.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>

                        <button
                          onClick={() => handleDeleteClick(category, subcategory)}
                          title="Delete Subcategory"
                          style={{
                            padding: '0.375rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              margin: '0 0 1rem',
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#dc2626'
            }}>
              Delete {deleteType === 'category' ? 'Category' : 'Subcategory'}
            </h3>
            
            <p style={{ margin: '0 0 1.5rem', color: '#6b7280' }}>
              Are you sure you want to delete{' '}
              <strong>
                {deleteType === 'category' 
                  ? selectedCategory.name 
                  : selectedSubcategory?.name
                }
              </strong>? 
              {deleteType === 'category' && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <span> This will also delete all {selectedCategory.subcategories.length} subcategories.</span>
              )}
              {' '}This action cannot be undone.
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  color: '#6b7280',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={confirmDelete}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
