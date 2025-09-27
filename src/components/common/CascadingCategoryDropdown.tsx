import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Category } from '../../services/announcementService';

interface CascadingCategoryDropdownProps {
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

const CascadingCategoryDropdown: React.FC<CascadingCategoryDropdownProps> = ({
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
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debug categories
  useEffect(() => {
    console.log('🔍 CascadingCategoryDropdown - Categories received:', {
      count: categories?.length || 0,
      categories: categories?.map(cat => ({ id: cat.category_id, name: cat.name, hasSubcategories: cat.subcategories?.length || 0 }))
    });
  }, [categories]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredCategory(null);
        setSubmenuPosition(null);
        // Clear any pending timeout
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cleanup timeout on unmount
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Get display text for selected items
  const getDisplayText = () => {
    if (!selectedCategoryId) return placeholder;
    
    const category = categories.find(cat => cat.category_id === selectedCategoryId);
    if (!category) return placeholder;
    
    if (selectedSubcategoryId && category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.subcategory_id === selectedSubcategoryId);
      if (subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    
    return category.name;
  };

  const handleCategorySelect = (categoryId: number) => {
    console.log('🎯 CascadingCategoryDropdown - Category selected:', categoryId);
    onCategoryChange(categoryId);
    onSubcategoryChange(null); // Clear subcategory when category changes
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const handleSubcategorySelect = (subcategoryId: number) => {
    // Find the parent category of the selected subcategory
    const parentCategory = categories.find(cat =>
      cat.subcategories?.some(sub => sub.subcategory_id === subcategoryId)
    );

    if (parentCategory) {
      // Automatically select the parent category when subcategory is selected
      onCategoryChange(parentCategory.category_id);
    }

    onSubcategoryChange(subcategoryId);
    setIsOpen(false);
    setHoveredCategory(null);
  };

  const handleCategoryHover = (categoryId: number, event: React.MouseEvent<HTMLDivElement>) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    const category = categories.find(cat => cat.category_id === categoryId);
    if (category && category.subcategories && category.subcategories.length > 0) {
      console.log('🎯 Hovering category with subcategories:', category.name, category.subcategories.length);
      setHoveredCategory(categoryId);

      // Calculate submenu position using viewport coordinates for fixed positioning
      const rect = event.currentTarget.getBoundingClientRect();
      const dropdownRect = dropdownRef.current?.getBoundingClientRect();

      if (dropdownRect) {
        const viewportWidth = window.innerWidth;
        const submenuWidth = 200; // Approximate submenu width
        let leftPosition = dropdownRect.right + 4; // Position to the right of dropdown with 4px gap

        // Check if submenu would go off-screen and adjust if needed
        if (leftPosition + submenuWidth > viewportWidth) {
          leftPosition = dropdownRect.left - submenuWidth - 4; // Position to the left instead
        }

        setSubmenuPosition({
          top: rect.top, // Use viewport coordinates for fixed positioning
          left: leftPosition
        });
      }
    } else {
      console.log('🎯 Hovering category without subcategories:', category?.name || 'Unknown');
      setHoveredCategory(null);
      setSubmenuPosition(null);
    }
  };

  const handleCategoryLeave = () => {
    console.log('🚪 Leaving category, setting timeout...');
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set a longer delay to allow moving to submenu
    hoverTimeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout triggered, closing submenu');
      setHoveredCategory(null);
      setSubmenuPosition(null);
    }, 300); // Increased delay to 300ms
  };

  const handleSubmenuEnter = () => {
    console.log('🎯 Entering submenu, clearing timeout');
    // Clear timeout when entering submenu
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const handleSubmenuLeave = () => {
    console.log('🚪 Leaving submenu, closing immediately');
    // Immediately close submenu when leaving it
    setHoveredCategory(null);
    setSubmenuPosition(null);
  };

  // Styles
  const dropdownStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
    ...style
  };

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.75rem 1rem',
    border: error ? '2px solid #ef4444' : '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: disabled ? '#f9fafb' : 'white',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem',
    color: selectedCategoryId ? '#374151' : '#9ca3af',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxShadow: isOpen ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none'
  };

  const menuStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 10001,
    marginTop: '4px',
    overflow: 'hidden' // Remove scrollbar completely
  };

  const menuItemStyle: React.CSSProperties = {
    padding: '0.875rem 1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s ease',
    position: 'relative'
  };

  const submenuStyle: React.CSSProperties = {
    position: 'fixed',
    top: submenuPosition?.top || 0,
    left: submenuPosition?.left || 0,
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 10002,
    minWidth: '200px',
    overflow: 'hidden' // Remove scrollbar from submenu as well
  };

  const submenuItemStyle: React.CSSProperties = {
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.15s ease'
  };

  return (
    <div ref={dropdownRef} style={dropdownStyle} className={className}>
      {/* Trigger Button */}
      <div
        style={triggerStyle}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <span>{getDisplayText()}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }} 
        />
      </div>

      {/* Main Menu */}
      {isOpen && (
        <div style={menuStyle} role="listbox">
          {categories.map((category) => {
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const isSelected = selectedCategoryId === category.category_id;
            
            return (
              <div
                key={category.category_id}
                style={{
                  ...menuItemStyle,
                  backgroundColor: isSelected ? '#eff6ff' : 
                                 hoveredCategory === category.category_id ? '#f9fafb' : 'transparent'
                }}
                onClick={() => handleCategorySelect(category.category_id)}
                onMouseEnter={(e) => handleCategoryHover(category.category_id, e)}
                onMouseLeave={handleCategoryLeave}
                role="option"
                aria-selected={isSelected}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: category.color_code,
                      marginRight: '0.75rem'
                    }}
                  />
                  <span>{category.name}</span>
                </div>
                {hasSubcategories && (
                  <ChevronRight size={14} style={{ color: '#9ca3af' }} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submenu */}
      {isOpen && hoveredCategory && submenuPosition && (
        <>
          {/* Invisible bridge to prevent submenu from disappearing */}
          <div
            style={{
              position: 'fixed',
              top: submenuPosition.top,
              left: submenuPosition.left > 0 ? submenuPosition.left - 8 : submenuPosition.left + 200,
              width: '8px',
              height: '40px',
              zIndex: 10001,
              backgroundColor: 'transparent'
            }}
            onMouseEnter={handleSubmenuEnter}
          />
          <div
            ref={submenuRef}
            style={submenuStyle}
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          >
          {categories
            .find(cat => cat.category_id === hoveredCategory)
            ?.subcategories?.map((subcategory) => {
              const isSelected = selectedSubcategoryId === subcategory.subcategory_id;
              
              return (
                <div
                  key={subcategory.subcategory_id}
                  style={{
                    ...submenuItemStyle,
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent'
                  }}
                  onClick={() => handleSubcategorySelect(subcategory.subcategory_id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? '#eff6ff' : '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isSelected ? '#eff6ff' : 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: subcategory.color_code,
                        marginRight: '0.75rem'
                      }}
                    />
                    <span>{subcategory.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '0.25rem',
          fontSize: '0.75rem',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default CascadingCategoryDropdown;
