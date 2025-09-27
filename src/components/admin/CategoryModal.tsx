import React, { useState, useEffect } from 'react';
import { X, FolderTree, Tag, Palette, FileText, Hash } from 'lucide-react';

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

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (categoryData: Category | Subcategory, parentCategory?: Category) => Promise<void>;
  category?: Category | null;
  subcategory?: Subcategory | null;
  parentCategory?: Category | null;
  mode: 'add_category' | 'edit_category' | 'add_subcategory' | 'edit_subcategory';
  loading?: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category,
  subcategory,
  parentCategory,
  mode,
  loading = false
}) => {
  const [formData, setFormData] = useState<Category | Subcategory>({
    name: '',
    description: '',
    color_code: '#3b82f6',
    is_active: true,
    ...(mode.includes('subcategory') ? { display_order: 1 } : {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isSubcategoryMode = mode.includes('subcategory');
  const isEditMode = mode.includes('edit');

  // Predefined color options
  const colorOptions = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#f43f5e', '#8b5a2b', '#64748b', '#1f2937'
  ];

  useEffect(() => {
    if (isEditMode) {
      if (isSubcategoryMode && subcategory) {
        // Ensure display_order is set for subcategories
        setFormData({
          ...subcategory,
          display_order: subcategory.display_order || 1
        });
      } else if (!isSubcategoryMode && category) {
        setFormData(category);
      }
    } else {
      // Reset form for new items
      setFormData({
        name: '',
        description: '',
        color_code: '#3b82f6',
        is_active: true,
        ...(isSubcategoryMode ? { display_order: 1 } : {})
      });
    }
    setErrors({});
  }, [category, subcategory, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = `${isSubcategoryMode ? 'Subcategory' : 'Category'} name is required`;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
    }

    // Description validation
    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    // Color validation
    if (!formData.color_code || !/^#[0-9A-F]{6}$/i.test(formData.color_code)) {
      newErrors.color_code = 'Please select a valid color';
    }

    // Display order validation (for subcategories)
    if (isSubcategoryMode) {
      const displayOrder = (formData as Subcategory).display_order;
      if (!displayOrder || displayOrder < 1 || displayOrder > 999) {
        newErrors.display_order = 'Display order must be between 1 and 999';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData, parentCategory || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getModalTitle = () => {
    switch (mode) {
      case 'add_category': return 'Add New Category';
      case 'edit_category': return 'Edit Category';
      case 'add_subcategory': return `Add Subcategory to "${parentCategory?.name}"`;
      case 'edit_subcategory': return 'Edit Subcategory';
      default: return 'Category Management';
    }
  };

  if (!isOpen) return null;

  return (
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
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {isSubcategoryMode ? <Tag size={20} /> : <FolderTree size={20} />}
            {getModalTitle()}
          </h2>
          
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <FileText size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                {isSubcategoryMode ? 'Subcategory' : 'Category'} Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.name ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                placeholder={`Enter ${isSubcategoryMode ? 'subcategory' : 'category'} name`}
              />
              {errors.name && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Description (Optional)
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: `1px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
                placeholder={`Brief description of the ${isSubcategoryMode ? 'subcategory' : 'category'}`}
              />
              {errors.description && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* Color Selection */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                <Palette size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Color *
              </label>
              
              {/* Color Preview */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: formData.color_code,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  {isSubcategoryMode ? <Tag size={20} color="white" /> : <FolderTree size={20} color="white" />}
                </div>
                
                <input
                  type="text"
                  value={formData.color_code}
                  onChange={(e) => handleInputChange('color_code', e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: `1px solid ${errors.color_code ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace'
                  }}
                  placeholder="#3b82f6"
                />
              </div>

              {/* Color Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(40px, 1fr))',
                gap: '0.5rem'
              }}>
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color_code', color)}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: color,
                      border: formData.color_code === color ? '3px solid #1f2937' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {formData.color_code === color && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        background: 'white',
                        borderRadius: '50%'
                      }} />
                    )}
                  </button>
                ))}
              </div>
              
              {errors.color_code && (
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                  {errors.color_code}
                </p>
              )}
            </div>

            {/* Display Order (for subcategories) */}
            {isSubcategoryMode && (
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  <Hash size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                  Display Order *
                </label>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={(formData as Subcategory).display_order || 1}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${errors.display_order ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '6px',
                    fontSize: '0.875rem'
                  }}
                  placeholder="1"
                />
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                  Lower numbers appear first in the list
                </p>
                {errors.display_order && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#ef4444' }}>
                    {errors.display_order}
                  </p>
                )}
              </div>
            )}

            {/* Status */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Active
                </span>
              </label>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>
                Inactive {isSubcategoryMode ? 'subcategories' : 'categories'} won't be available for selection
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {loading ? 'Saving...' : (isEditMode ? `Update ${isSubcategoryMode ? 'Subcategory' : 'Category'}` : `Create ${isSubcategoryMode ? 'Subcategory' : 'Category'}`)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
