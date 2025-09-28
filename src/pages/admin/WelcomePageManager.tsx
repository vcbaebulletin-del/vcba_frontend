import React, { useState, useEffect } from 'react';
import './WelcomePageManager.css';
import { API_BASE_URL } from '../../config/constants';
import {
  Upload,
  Image as ImageIcon,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  X,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WelcomePageData {
  background: {
    id: number;
    background_image: string;
    is_active: boolean;
    created_at: string;
    created_by_name: string;
  };
  cards: WelcomeCard[];
}

interface WelcomeCard {
  id: number;
  title: string;
  description: string;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

interface CarouselImage {
  id: number;
  image: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  created_by_name: string;
}

// Sortable Card Component
interface SortableCardProps {
  card: WelcomeCard;
  onToggle: (id: number) => void;
  onEdit: (card: WelcomeCard) => void;
  onDelete: (id: number) => void;
  apiBaseUrl: string;
}

const SortableCard: React.FC<SortableCardProps> = ({ card, onToggle, onEdit, onDelete, apiBaseUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-item ${!card.is_active ? 'inactive' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="card-image">
        <img
          src={`${apiBaseUrl}${card.image}`}
          alt={card.title}
        />
        <div className="card-overlay">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={20} />
          </div>
          <div className="action-buttons">
            <button
              onClick={() => onToggle(card.id)}
              className={`toggle-btn ${card.is_active ? 'active' : 'inactive'}`}
              title={card.is_active ? 'Hide card' : 'Show card'}
            >
              {card.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button
              onClick={() => onEdit(card)}
              className="edit-btn"
              title="Edit card"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(card.id)}
              className="delete-btn"
              title="Delete card"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="card-content">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>
    </div>
  );
};

// Sortable Carousel Item Component
interface SortableCarouselItemProps {
  image: CarouselImage;
  onToggle: (id: number) => void;
  onEdit: (image: CarouselImage) => void;
  onDelete: (id: number) => void;
  apiBaseUrl: string;
}

const SortableCarouselItem: React.FC<SortableCarouselItemProps> = ({ image, onToggle, onEdit, onDelete, apiBaseUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`carousel-item ${!image.is_active ? 'inactive' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="carousel-image">
        <img
          src={`${apiBaseUrl}${image.image}`}
          alt={`Carousel ${image.id}`}
        />
        <div className="carousel-overlay">
          <div className="drag-handle" {...attributes} {...listeners}>
            <GripVertical size={20} />
          </div>
          <div className="action-buttons">
            <button
              onClick={() => onToggle(image.id)}
              className={`toggle-btn ${image.is_active ? 'active' : 'inactive'}`}
              title={image.is_active ? 'Hide image' : 'Show image'}
            >
              {image.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>

            {/* I want to hide this edit button because I dont want to use it */}
            {/* <button
            onClick={() => onEdit(image)}
            className="edit-btn"
            title="Edit image"
          >
            <Edit size={16} />
          </button> */}
            <button
              onClick={() => onDelete(image.id)}
              className="delete-btn"
              title="Delete image"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const WelcomePageManager: React.FC = () => {
  const { user } = useAdminAuth();

  // API base URL - Now imported from constants

  const [activeTab, setActiveTab] = useState<'background' | 'cards' | 'carousel'>('background');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Background state
  const [currentBackground, setCurrentBackground] = useState<WelcomePageData['background'] | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);

  // Cards state
  const [cards, setCards] = useState<WelcomeCard[]>([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<WelcomeCard | null>(null);
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    image: null as File | null,
    is_active: true
  });

  // Carousel state
  const [carouselImages, setCarouselImages] = useState<CarouselImage[]>([]);
  const [carouselFile, setCarouselFile] = useState<File | null>(null);
  const [carouselPreview, setCarouselPreview] = useState<string | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadWelcomePageData();
    loadCarouselImages();
  }, []);

  // Custom confirmation function
  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Helper function to check if response is JSON
  const isJsonResponse = (response: Response): boolean => {
    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json') ?? false;
  };

  const loadWelcomePageData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');

      // Load background from public endpoint (backgrounds don't have admin-specific endpoint)
      const backgroundResponse = await fetch(`${API_BASE_URL}/api/welcome-page/data`);

      // Load cards from admin endpoint to get all cards (including inactive ones)
      const cardsResponse = await fetch(`${API_BASE_URL}/api/welcome-page/admin/cards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!backgroundResponse.ok || !cardsResponse.ok) {
        throw new Error(`HTTP error! Background: ${backgroundResponse.status}, Cards: ${cardsResponse.status}`);
      }

      if (!isJsonResponse(backgroundResponse) || !isJsonResponse(cardsResponse)) {
        throw new Error('Server returned HTML instead of JSON. Check if the API endpoints are correct.');
      }

      const [backgroundData, cardsData] = await Promise.all([
        backgroundResponse.json(),
        cardsResponse.json()
      ]);

      if (backgroundData.success && cardsData.success) {
        setCurrentBackground(backgroundData.data.background);
        setCards(cardsData.data.cards || []);
      } else {
        setError(backgroundData.message || cardsData.message || 'Failed to load welcome page data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load welcome page data';
      setError(errorMessage);
      console.error('Error loading welcome page data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCarouselImages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!isJsonResponse(response)) {
        throw new Error('Server returned HTML instead of JSON. Check if the API endpoint is correct.');
      }

      const data = await response.json();

      if (data.success) {
        setCarouselImages(data.data.images);
      } else {
        setError(data.message || 'Failed to load carousel images');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load carousel images';
      setError(errorMessage);
      console.error('Error loading carousel images:', err);
    }
  };

  const handleBackgroundUpload = async () => {
    if (!backgroundFile) {
      setError('Please select a background image');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', backgroundFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/backgrounds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Background uploaded successfully');
        setBackgroundFile(null);
        setBackgroundPreview(null);
        loadWelcomePageData();
      } else {
        setError(data.message || 'Failed to upload background');
      }
    } catch (err) {
      setError('Failed to upload background');
      console.error('Error uploading background:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBackgroundFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cardForm.title || !cardForm.description || (!cardForm.image && !editingCard)) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', cardForm.title);
      formData.append('description', cardForm.description);
      formData.append('is_active', cardForm.is_active.toString());
      
      if (cardForm.image) {
        formData.append('image', cardForm.image);
      }

      const token = localStorage.getItem('adminToken');
      const url = editingCard
        ? `${API_BASE_URL}/api/welcome-page/admin/cards/${editingCard.id}`
        : `${API_BASE_URL}/api/welcome-page/admin/cards`;

      const response = await fetch(url, {
        method: editingCard ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(editingCard ? 'Card updated successfully' : 'Card created successfully');
        setShowCardModal(false);
        setEditingCard(null);
        setCardForm({ title: '', description: '', image: null, is_active: true });
        loadWelcomePageData();
      } else {
        setError(data.message || 'Failed to save card');
      }
    } catch (err) {
      setError('Failed to save card');
      console.error('Error saving card:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCarouselUpload = async () => {
    if (!carouselFile) {
      setError('Please select a carousel image');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', carouselFile);

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Carousel image uploaded successfully');
        setCarouselFile(null);
        setCarouselPreview(null);
        loadCarouselImages();
      } else {
        setError(data.message || 'Failed to upload carousel image');
      }
    } catch (err) {
      setError('Failed to upload carousel image');
      console.error('Error uploading carousel image:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCarouselFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarouselFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCarouselPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCardStatus = async (cardId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/cards/${cardId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Card status updated');
        loadWelcomePageData();
      } else {
        setError(data.message || 'Failed to update card status');
      }
    } catch (err) {
      setError('Failed to update card status');
      console.error('Error updating card status:', err);
    }
  };

  const deleteCard = async (cardId: number) => {
    showConfirmation('Are you sure you want to delete this card?', async () => {
      await performDeleteCard(cardId);
    });
  };

  const performDeleteCard = async (cardId: number) => {

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Card deleted successfully');
        loadWelcomePageData();
      } else {
        setError(data.message || 'Failed to delete card');
      }
    } catch (err) {
      setError('Failed to delete card');
      console.error('Error deleting card:', err);
    }
  };

  const toggleCarouselStatus = async (imageId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel/${imageId}/toggle`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Carousel image status updated');
        loadCarouselImages();
      } else {
        setError(data.message || 'Failed to update carousel image status');
      }
    } catch (err) {
      setError('Failed to update carousel image status');
      console.error('Error updating carousel image status:', err);
    }
  };

  const deleteCarouselImage = async (imageId: number) => {
    showConfirmation('Are you sure you want to delete this carousel image?', async () => {
      await performDeleteCarouselImage(imageId);
    });
  };

  const performDeleteCarouselImage = async (imageId: number) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Carousel image deleted successfully');
        loadCarouselImages();
      } else {
        setError(data.message || 'Failed to delete carousel image');
      }
    } catch (err) {
      setError('Failed to delete carousel image');
      console.error('Error deleting carousel image:', err);
    }
  };

  // Reorder cards
  const reorderCards = async (cardOrders: { id: number; order_index: number }[]) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/cards/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cardOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder cards');
      }

      setSuccess('Cards reordered successfully');
      loadWelcomePageData(); // Reload to get updated order
    } catch (err) {
      setError('Failed to reorder cards');
      console.error('Error reordering cards:', err);
    }
  };

  // Reorder carousel images
  const reorderCarouselImages = async (imageOrders: { id: number; order_index: number }[]) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/welcome-page/admin/carousel/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ imageOrders })
      });

      if (!response.ok) {
        throw new Error('Failed to reorder carousel images');
      }

      setSuccess('Carousel images reordered successfully');
      loadCarouselImages(); // Reload to get updated order
    } catch (err) {
      setError('Failed to reorder carousel images');
      console.error('Error reordering carousel images:', err);
    }
  };

  // Handle drag end for cards
  const handleCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Create reorder data
        const cardOrders = newItems.map((item, index) => ({
          id: item.id,
          order_index: index
        }));

        // Call API to update order
        reorderCards(cardOrders);

        return newItems;
      });
    }
  };

  // Handle drag end for carousel
  const handleCarouselDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCarouselImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Create reorder data
        const imageOrders = newItems.map((item, index) => ({
          id: item.id,
          order_index: index
        }));

        // Call API to update order
        reorderCarouselImages(imageOrders);

        return newItems;
      });
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'background' ? 'active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          <ImageIcon size={20} />
          Background Image
        </button>
        <button 
          className={`tab-button ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          <GripVertical size={20} />
          Welcome Cards
        </button>
        <button 
          className={`tab-button ${activeTab === 'carousel' ? 'active' : ''}`}
          onClick={() => setActiveTab('carousel')}
        >
          <ImageIcon size={20} />
          Login Carousel
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'background' && (
          <div className="background-manager">
            <div className="section-header">
              <h2>Background Image Management</h2>
              <p>Upload and manage the welcome page background image</p>
            </div>

            {/* Current Background */}
            {currentBackground && (
              <div className="current-background">
                <h3>Current Background</h3>
                <div className="background-preview">
                  <img 
                    src={`${API_BASE_URL}${currentBackground.background_image}`}
                    alt="Current background"
                    className="background-image"
                  />
                  <div className="background-info">
                    <p><strong>Uploaded:</strong> {new Date(currentBackground.created_at).toLocaleDateString()}</p>
                    <p><strong>By:</strong> {currentBackground.created_by_name}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upload New Background */}
            <div className="upload-section">
              <h3>Upload New Background</h3>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundFileChange}
                  className="file-input"
                  id="background-upload"
                />
                <label htmlFor="background-upload" className="upload-label">
                  <Upload size={24} />
                  <span>Choose Background Image</span>
                </label>
                
                {backgroundPreview && (
                  <div className="preview-container">
                    <img src={backgroundPreview} alt="Preview" className="preview-image" />
                    <div className="preview-actions">
                      <button 
                        onClick={handleBackgroundUpload}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Uploading...' : 'Upload Background'}
                      </button>
                      <button 
                        onClick={() => {
                          setBackgroundFile(null);
                          setBackgroundPreview(null);
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="cards-manager">
            <div className="section-header">
              <h2>Welcome Cards Management</h2>
              <p>Manage the four cards displayed on the welcome page</p>
              <button 
                onClick={() => {
                  setShowCardModal(true);
                  setEditingCard(null);
                  setCardForm({ title: '', description: '', image: null, is_active: true });
                }}
                className="btn btn-primary"
              >
                <Plus size={20} />
                Add New Card
              </button>
            </div>

            {/* Cards Grid with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCardDragEnd}
            >
              <SortableContext
                items={cards.map(card => card.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="cards-grid">
                  {cards.map((card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      onToggle={toggleCardStatus}
                      onEdit={(card) => {
                        setEditingCard(card);
                        setCardForm({
                          title: card.title,
                          description: card.description,
                          image: null,
                          is_active: card.is_active
                        });
                        setShowCardModal(true);
                      }}
                      onDelete={deleteCard}
                      apiBaseUrl={API_BASE_URL}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {activeTab === 'carousel' && (
          <div className="carousel-manager">
            <div className="section-header">
              <h2>Login Carousel Management</h2>
              <p>Manage images displayed in the login page carousel</p>
            </div>

            {/* Upload New Carousel Image */}
            <div className="upload-section">
              <h3>Upload New Carousel Image</h3>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCarouselFileChange}
                  className="file-input"
                  id="carousel-upload"
                />
                <label htmlFor="carousel-upload" className="upload-label">
                  <Upload size={24} />
                  <span>Choose Carousel Image</span>
                </label>
                
                {carouselPreview && (
                  <div className="preview-container">
                    <img src={carouselPreview} alt="Preview" className="preview-image" />
                    <div className="preview-actions">
                      <button 
                        onClick={handleCarouselUpload}
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {loading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <button 
                        onClick={() => {
                          setCarouselFile(null);
                          setCarouselPreview(null);
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Carousel Images Grid with Drag and Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCarouselDragEnd}
            >
              <SortableContext
                items={carouselImages.map(image => image.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="carousel-grid">
                  {carouselImages.map((image) => (
                    <SortableCarouselItem
                      key={image.id}
                      image={image}
                      onToggle={toggleCarouselStatus}
                      onEdit={(image) => {
                        // TODO: Implement carousel edit modal
                        console.log('Edit carousel image:', image);
                      }}
                      onDelete={deleteCarouselImage}
                      apiBaseUrl={API_BASE_URL}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Card Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCard ? 'Edit Card' : 'Add New Card'}</h3>
              <button 
                onClick={() => setShowCardModal(false)}
                className="btn btn-icon"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCardSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="card-title">Title *</label>
                <input
                  type="text"
                  id="card-title"
                  value={cardForm.title}
                  onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-description">Description *</label>
                <textarea
                  id="card-description"
                  value={cardForm.description}
                  onChange={(e) => setCardForm({ ...cardForm, description: e.target.value })}
                  required
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-image">Image {!editingCard && '*'}</label>
                <input
                  type="file"
                  id="card-image"
                  accept="image/*"
                  onChange={(e) => setCardForm({ ...cardForm, image: e.target.files?.[0] || null })}
                  className="form-input"
                />
                {editingCard && (
                  <small className="form-help">Leave empty to keep current image</small>
                )}
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={cardForm.is_active}
                    onChange={(e) => setCardForm({ ...cardForm, is_active: e.target.checked })}
                  />
                  <span>Active (visible on welcome page)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Saving...' : (editingCard ? 'Update Card' : 'Create Card')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .welcome-page-manager {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-header h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: #6b7280;
          font-size: 1rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }

        .alert button {
          background: none;
          border: none;
          cursor: pointer;
          margin-left: auto;
          color: inherit;
        }

        .tab-navigation {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #374151;
        }

        .tab-button.active {
          color: #22c55e;
          border-bottom-color: #22c55e;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .section-header p {
          color: #6b7280;
        }

        .current-background {
          margin-bottom: 2rem;
        }

        .current-background h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .background-preview {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .background-image {
          width: 300px;
          height: 200px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .background-info {
          flex: 1;
        }

        .background-info p {
          margin-bottom: 0.5rem;
          color: #6b7280;
        }

        .upload-section {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .upload-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .upload-area {
          text-align: center;
        }

        .file-input {
          display: none;
        }

        .upload-label {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          color: #6b7280;
        }

        .upload-label:hover {
          border-color: #22c55e;
          color: #22c55e;
        }

        .preview-container {
          margin-top: 1rem;
        }

        .preview-image {
          max-width: 300px;
          max-height: 200px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .preview-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          text-decoration: none;
        }

        .btn-primary {
          background: #22c55e;
          color: white;
        }

        .btn-primary:hover {
          background: #16a34a;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-icon {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.9);
          color: #374151;
        }

        .btn-icon:hover {
          background: white;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .card-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .card-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .card-item.inactive {
          opacity: 0.6;
        }

        .card-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-overlay {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .card-item:hover .card-overlay {
          opacity: 1;
        }

        .card-content {
          padding: 1rem;
        }

        .card-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }

        .card-content p {
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        .carousel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .carousel-item {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .carousel-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .carousel-item.inactive {
          opacity: 0.6;
        }

        .carousel-image {
          position: relative;
          height: 150px;
          overflow: hidden;
        }

        .carousel-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-overlay {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.5rem;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .carousel-item:hover .carousel-overlay {
          opacity: 1;
        }

        .carousel-meta {
          padding: 0.75rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #9ca3af;
        }

        /* Drag and Drop Styles */
        .card-item.dragging,
        .carousel-item.dragging {
          opacity: 0.5;
          transform: rotate(5deg);
          z-index: 1000;
        }

        .drag-handle {
          position: absolute;
          top: 8px;
          left: 8px; /* Explicitly set to top-left */
          right: auto; /* Remove any right positioning */
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px;
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 1001; /* Ensure it’s above the dragging card */
        }

        .drag-handle:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .card-overlay,
        .carousel-overlay {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .toggle-btn,
        .edit-btn,
        .delete-btn {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toggle-btn:hover,
        .edit-btn:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .delete-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .toggle-btn.active {
          background: #059669;
        }

        .toggle-btn.inactive {
          background: #6b7280;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .form-help {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto;
        }

        .modal-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        @media (max-width: 768px) {
          .welcome-page-manager {
            padding: 1rem;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
          }

          .background-preview {
            flex-direction: column;
          }

          .background-image {
            width: 100%;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .carousel-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .modal {
            width: 95%;
            margin: 1rem;
          }
        }

        /* Confirmation Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirmation-modal {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 400px;
          width: 90%;
          max-height: 90vh;
          overflow: hidden;
        }

        .confirmation-modal .modal-header {
          padding: 1.5rem 1.5rem 0;
          border-bottom: none;
        }

        .confirmation-modal .modal-header h3 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .confirmation-modal .modal-body {
          padding: 1rem 1.5rem;
        }

        .confirmation-modal .modal-body p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .confirmation-modal .modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
          border: 1px solid #ef4444;
        }

        .btn-danger:hover {
          background: #dc2626;
          border-color: #dc2626;
        }
      `}</style>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Action</h3>
            </div>
            <div className="modal-body">
              <p>{confirmMessage}</p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePageManager;