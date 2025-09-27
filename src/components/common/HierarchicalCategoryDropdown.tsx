import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Category, Subcategory } from '../../services/announcementService';

interface HierarchicalCategoryDropdownProps {
  categories: Category[];
  selectedCategoryId?: number;
  selectedSubcategoryId?: number;
  onCategoryChange: (categoryId: number | null) => void;
  onSubcategoryChange: (subcategoryId: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

interface DropdownItem {
  id: number;
  name: string;
  type: 'category' | 'subcategory';
  categoryId?: number;
  color?: string;
  hasSubcategories?: boolean;
}

const HierarchicalCategoryDropdown: React.FC<HierarchicalCategoryDropdownProps> = ({
  categories,
  selectedCategoryId,
  selectedSubcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  placeholder = 'Select Category',
  disabled = false,
  error,
  required = false,
  style,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setExpandedCategories(new Set());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-expand category if subcategory is selected
  useEffect(() => {
    if (selectedSubcategoryId && selectedCategoryId) {
      setExpandedCategories(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedCategoryId);
        return newSet;
      });
    }
  }, [selectedCategoryId, selectedSubcategoryId]);

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId: number) => {
    onCategoryChange(categoryId);
    onSubcategoryChange(null); // Clear subcategory when category changes
    setIsOpen(false);
    setExpandedCategories(new Set());
  };

  const handleSubcategorySelect = (subcategoryId: number, categoryId: number) => {
    onCategoryChange(categoryId);
    onSubcategoryChange(subcategoryId);
    setIsOpen(false);
    setExpandedCategories(new Set());
  };

  const getDisplayText = () => {
    if (selectedSubcategoryId && selectedCategoryId) {
      const category = categories.find(c => c.category_id === selectedCategoryId);
      const subcategory = category?.subcategories?.find(s => s.subcategory_id === selectedSubcategoryId);
      return subcategory ? `${category?.name} > ${subcategory.name}` : placeholder;
    } else if (selectedCategoryId) {
      const category = categories.find(c => c.category_id === selectedCategoryId);
      return category?.name || placeholder;
    }
    return placeholder;
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    ...style
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
    outline: 'none',
    backgroundColor: disabled ? '#f9fafb' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    color: selectedCategoryId || selectedSubcategoryId ? '#111827' : '#6b7280'
  };

  const dropdownMenuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    maxHeight: '300px',
    overflowY: 'auto',
    marginTop: '4px'
  };

  const categoryItemStyle: React.CSSProperties = {
    padding: '0.75rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease'
  };

  const subcategoryItemStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem 0.5rem 2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #f9fafb',
    fontSize: '0.875rem',
    color: '#6b7280',
    transition: 'background-color 0.2s ease'
  };

  return (
    <div ref={dropdownRef} style={dropdownStyle} className={className}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={buttonStyle}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = '#22c55e';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? '#ef4444' : '#d1d5db';
          e.currentTarget.style.boxShadow = 'none';
        }}
        disabled={disabled}
      >
        <span>{getDisplayText()}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </button>

      {isOpen && (
        <div style={dropdownMenuStyle}>
          {categories.map((category) => (
            <div key={category.category_id}>
              {/* Category Item */}
              <div
                style={{
                  ...categoryItemStyle,
                  backgroundColor: hoveredItem === category.category_id ? '#f3f4f6' : 'transparent'
                }}
                onMouseEnter={() => setHoveredItem(category.category_id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                  onClick={() => handleCategorySelect(category.category_id)}
                >
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: category.color_code,
                      marginRight: '0.5rem'
                    }}
                  />
                  <span style={{ fontWeight: '500' }}>{category.name}</span>
                </div>
                
                {category.subcategories && category.subcategories.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.category_id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#6b7280'
                    }}
                  >
                    <ChevronRight
                      size={16}
                      style={{
                        transform: expandedCategories.has(category.category_id) ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </button>
                )}
              </div>

              {/* Subcategory Items */}
              {expandedCategories.has(category.category_id) && category.subcategories && (
                <div>
                  {category.subcategories.map((subcategory) => (
                    <div
                      key={subcategory.subcategory_id}
                      style={{
                        ...subcategoryItemStyle,
                        backgroundColor: hoveredItem === subcategory.subcategory_id ? '#f9fafb' : 'transparent'
                      }}
                      onMouseEnter={() => setHoveredItem(subcategory.subcategory_id)}
                      onMouseLeave={() => setHoveredItem(null)}
                      onClick={() => handleSubcategorySelect(subcategory.subcategory_id, category.category_id)}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: subcategory.color_code || category.color_code,
                          marginRight: '0.5rem'
                        }}
                      />
                      <span>{subcategory.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default HierarchicalCategoryDropdown;
