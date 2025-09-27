import React, { useState } from 'react';
import CascadingCategoryDropdown from '../common/CascadingCategoryDropdown';
import { Category } from '../../services/announcementService';

// Mock data for demonstration
const mockCategories: Category[] = [
  {
    category_id: 1,
    name: 'General',
    description: 'General announcements',
    color_code: '#007bff',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subcategories: [
      {
        subcategory_id: 13,
        category_id: 1,
        name: 'Campus Updates',
        color_code: '#007bff',
        display_order: 1,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        subcategory_id: 14,
        category_id: 1,
        name: 'Student Reminders',
        color_code: '#007bff',
        display_order: 2,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        subcategory_id: 15,
        category_id: 1,
        name: 'Holidays',
        color_code: '#007bff',
        display_order: 3,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]
  },
  {
    category_id: 2,
    name: 'Academic',
    description: 'Academic announcements',
    color_code: '#28a745',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subcategories: [
      {
        subcategory_id: 1,
        category_id: 2,
        name: 'Exam Schedules',
        color_code: '#28a745',
        display_order: 1,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        subcategory_id: 2,
        category_id: 2,
        name: 'Grade Release',
        color_code: '#28a745',
        display_order: 2,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]
  },
  {
    category_id: 3,
    name: 'Events',
    description: 'Event announcements',
    color_code: '#ffc107',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subcategories: [
      {
        subcategory_id: 4,
        category_id: 3,
        name: 'Cultural Events',
        color_code: '#ffc107',
        display_order: 1,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        subcategory_id: 5,
        category_id: 3,
        name: 'Workshop',
        color_code: '#ffc107',
        display_order: 2,
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ]
  },
  {
    category_id: 4,
    name: 'Emergency Notices',
    description: 'Emergency notifications',
    color_code: '#dc3545',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    subcategories: [] // No subcategories - should be selectable directly
  },
  {
    category_id: 5,
    name: 'Simple Category',
    description: 'A category without subcategories',
    color_code: '#6c757d',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z'
    // No subcategories property - should be selectable directly
  }
];

const CascadingDropdownDemo: React.FC = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | undefined>(undefined);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId || undefined);
    setSelectedSubcategoryId(undefined); // Clear subcategory when category changes
    console.log('Category selected:', categoryId);
  };

  const handleSubcategoryChange = (subcategoryId: number | null) => {
    setSelectedSubcategoryId(subcategoryId || undefined);
    console.log('Subcategory selected:', subcategoryId);
  };

  const getSelectedInfo = () => {
    if (!selectedCategoryId) return 'No selection';
    
    const category = mockCategories.find(cat => cat.category_id === selectedCategoryId);
    if (!category) return 'Invalid selection';
    
    if (selectedSubcategoryId && category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.subcategory_id === selectedSubcategoryId);
      if (subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    
    return category.name;
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '1.5rem', 
        fontWeight: '600', 
        marginBottom: '2rem',
        color: '#1f2937'
      }}>
        Cascading Category Dropdown Demo
      </h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '500', 
          marginBottom: '1rem',
          color: '#374151'
        }}>
          How it works:
        </h2>
        <ul style={{ 
          color: '#6b7280', 
          lineHeight: '1.6',
          paddingLeft: '1.5rem'
        }}>
          <li>Click the dropdown to open the main menu</li>
          <li>Hover over categories with arrows (▶) to see subcategories</li>
          <li>Categories without arrows can be selected directly</li>
          <li>Subcategories appear in a cascading menu to the right</li>
          <li>Click any item to select it</li>
        </ul>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}>
          Select Category & Subcategory:
        </label>
        
        <CascadingCategoryDropdown
          categories={mockCategories}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={handleSubcategoryChange}
          placeholder="Choose a category..."
          style={{ maxWidth: '400px' }}
        />
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          fontSize: '1rem', 
          fontWeight: '500', 
          marginBottom: '0.5rem',
          color: '#374151'
        }}>
          Current Selection:
        </h3>
        <p style={{ 
          color: '#6b7280',
          margin: 0,
          fontFamily: 'monospace',
          fontSize: '0.875rem'
        }}>
          {getSelectedInfo()}
        </p>
        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Category ID: {selectedCategoryId ?? 'undefined'} | Subcategory ID: {selectedSubcategoryId ?? 'undefined'}
        </div>
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#92400e'
      }}>
        <strong>Note:</strong> This demo uses mock data. In the actual application, 
        the categories and subcategories will be loaded from the backend API.
      </div>
    </div>
  );
};

export default CascadingDropdownDemo;
