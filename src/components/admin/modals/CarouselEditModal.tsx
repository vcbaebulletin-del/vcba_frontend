import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../../../config/constants';

interface CarouselImage {
  id: number;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

interface CarouselEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: CarouselImage | null;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const CarouselEditModal: React.FC<CarouselEditModalProps> = ({
  isOpen,
  onClose,
  image,
  onSuccess,
  onError
}) => {
  const [formData, setFormData] = useState({
    order_index: 0,
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize form data when image changes
  useEffect(() => {
    if (image) {
      setFormData({
        order_index: image.order_index,
        is_active: image.is_active
      });
      setPreviewUrl(`${API_BASE_URL}${image.image}`);
    }
  }, [image]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        onError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        onError('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const formDataToSend = new FormData();

      // Add form fields
      formDataToSend.append('order_index', formData.order_index.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      // Add image file if selected
      if (selectedFile) {
        formDataToSend.append('carouselImage', selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel/${image.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update carousel image');
      }

      const result = await response.json();
      onSuccess('Carousel image updated successfully');
      onClose();
    } catch (err: any) {
      onError(err.message || 'Failed to update carousel image');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen || !image) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content carousel-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Carousel Image</h2>
          <button onClick={handleClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Image Preview */}
          <div className="form-group">
            <label>Current Image</label>
            <div className="image-preview-container">
              {previewUrl && (
                <img 
                  src={previewUrl} 
                  alt="Carousel preview" 
                  className="image-preview"
                />
              )}
            </div>
          </div>

          {/* File Upload */}
          <div className="form-group">
            <label htmlFor="carouselImage">Replace Image (Optional)</label>
            <div className="file-upload-container">
              <input
                type="file"
                id="carouselImage"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="carouselImage" className="file-upload-label">
                <Upload size={20} />
                Choose New Image
              </label>
            </div>
            <small className="form-help">
              Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB
            </small>
          </div>

          {/* Order Index */}
          <div className="form-group">
            <label htmlFor="order_index">Display Order</label>
            <input
              type="number"
              id="order_index"
              min="0"
              value={formData.order_index}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                order_index: parseInt(e.target.value) || 0
              }))}
              className="form-input"
            />
            <small className="form-help">
              Lower numbers appear first in the carousel
            </small>
          </div>

          {/* Active Status */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  is_active: e.target.checked
                }))}
                className="checkbox-input"
              />
              <span className="checkbox-custom">
                {formData.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
              </span>
              <span className="checkbox-text">
                {formData.is_active ? 'Active (Visible)' : 'Inactive (Hidden)'}
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Image'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .carousel-edit-modal {
          max-width: 600px;
          width: 90%;
        }

        .image-preview-container {
          margin-top: 0.5rem;
          border: 2px dashed #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          text-align: center;
        }

        .image-preview {
          max-width: 100%;
          max-height: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .file-upload-container {
          position: relative;
          margin-top: 0.5rem;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-upload-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          background-color: #f9fafb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .file-upload-label:hover {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          margin-top: 0.5rem;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          transition: all 0.2s;
        }

        .checkbox-input:checked + .checkbox-custom {
          background-color: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .checkbox-text {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default CarouselEditModal;
