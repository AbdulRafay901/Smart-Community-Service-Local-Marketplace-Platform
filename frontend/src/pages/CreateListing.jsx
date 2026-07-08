import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, Upload, Save, X, Trash } from 'lucide-react';
import api from '../utils/api';

const CreateListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams(); // For editing a listing
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  
  // Categories
  const categories = {
    service: ['Web Development', 'Photography', 'Graphic Designing', 'Home Services', 'Tutoring', 'Content Writing', 'Digital Marketing', 'Video Editing'],
    product: ['Electronics', 'Fashion', 'Home & Living', 'Books', 'Sports & Outdoors', 'Others']
  };

  // Form Fields
  const [type, setType] = useState('service');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  
  // Service specific
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [availability, setAvailability] = useState('Available');

  // Images upload
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // Images already stored on the server (for editing)

  // Fetch listing data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchListing = async () => {
        setFetching(true);
        try {
          const response = await api.get(`/listings/${id}`);
          const l = response.data;
          
          // Verify owner
          if (l.user_id !== user.id && user.role !== 'admin') {
            navigate('/');
            return;
          }

          setType(l.type);
          setTitle(l.title);
          setDescription(l.description);
          setCategory(l.category);
          setPrice(l.price);
          setLocation(l.location || '');
          setEstimatedDelivery(l.estimated_delivery || '');
          setAvailability(l.availability || 'Available');
          setExistingImages(l.images || []);
        } catch (err) {
          console.error("Failed to fetch listing for editing:", err);
          setError("Failed to load listing details.");
        } finally {
          setFetching(false);
        }
      };

      if (user) {
        fetchListing();
      }
    }
  }, [id, isEditMode, user]);

  // Handle files select
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove selected file preview
  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== index));
    setPreviews(prev => prev.filter((_, idx) => idx !== index));
  };

  // Remove existing image
  const removeExistingImage = (index) => {
    setExistingImages(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !category || !price) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('price', price);
      formData.append('location', location);

      if (type === 'service') {
        formData.append('estimated_delivery', estimatedDelivery);
        formData.append('availability', availability);
      }

      // If editing, send existing images we want to keep
      if (isEditMode) {
        existingImages.forEach((img, idx) => {
          formData.append(`existing_images[${idx}]`, img);
        });
      }

      // Append new files
      selectedFiles.forEach((file) => {
        formData.append('images[]', file);
      });

      let response;
      if (isEditMode) {
        // Use POST with a hidden method field or just POST since we mapped Route::post('/listings/{id}', ...)
        response = await api.post(`/listings/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/listings', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      navigate(`/listings/${response.data.listing.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the listing.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <p style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading listing data...</p>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="card glass animate-fade-in" style={{ width: '100%', maxWidth: '720px', padding: '2.5rem 2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PlusCircle style={{ color: 'var(--accent-primary)' }} />
          {isEditMode ? 'Edit Listing' : 'Create Listing'}
        </h2>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)',
            padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
            marginBottom: '1.5rem', fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Listing Type Choice */}
          {!isEditMode && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">What are you listing?</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{
                  flex: 1, padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600,
                  backgroundColor: type === 'service' ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  borderColor: type === 'service' ? 'var(--accent-primary)' : 'var(--border-color)',
                  transition: 'all 0.15s ease'
                }}>
                  <input type="radio" name="listing_type" value="service" checked={type === 'service'} onChange={() => { setType('service'); setCategory(''); }} style={{ accentColor: 'var(--accent-primary)' }} />
                  A Professional Service (e.g. Freelancing, Gardening)
                </label>
                <label style={{
                  flex: 1, padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600,
                  backgroundColor: type === 'product' ? 'rgba(14, 165, 233, 0.08)' : 'transparent',
                  borderColor: type === 'product' ? 'var(--accent-secondary)' : 'var(--border-color)',
                  transition: 'all 0.15s ease'
                }}>
                  <input type="radio" name="listing_type" value="product" checked={type === 'product'} onChange={() => { setType('product'); setCategory(''); }} style={{ accentColor: 'var(--accent-secondary)' }} />
                  A Product for Sale (e.g. iPhone, Furniture, Clothing)
                </label>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="title">Listing Title *</label>
            <input 
              type="text" 
              id="title"
              className="form-input" 
              placeholder={type === 'service' ? 'e.g. Professional Portrait Photography session' : 'e.g. Brand New Mechanical Gaming Keyboard'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-two">
            {/* Category selection */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category *</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)} required>
                <option value="">Select Category</option>
                {type === 'service' ? (
                  categories.service.map(c => <option key={c} value={c}>{c}</option>)
                ) : (
                  categories.product.map(c => <option key={c} value={c}>{c}</option>)
                )}
              </select>
            </div>

            {/* Price */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Price ($) *</label>
              <input 
                type="number" 
                className="form-input" 
                placeholder="0.00" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Service specific options */}
          {type === 'service' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-two">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Estimated Delivery / Duration</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 3 Days, 2 Hours" 
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Availability</label>
                <select className="form-select" value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Location / Neighborhood</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Downtown, West End" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="description">Detailed Description *</label>
            <textarea 
              id="description"
              className="form-textarea" 
              placeholder="Describe the item or service you are providing. Mention features, conditions, terms..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Images Upload Area */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Media Upload (Upload Multiple Images)</label>
            
            {/* Box area */}
            <div style={{
              border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: '2rem',
              textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s ease',
              backgroundColor: 'rgba(255,255,255,0.01)', position: 'relative'
            }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
              <Upload style={{ margin: '0 auto 0.75rem', strokeWidth: 1.5, color: 'var(--text-muted)' }} size={36} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Drag and drop images here, or click to browse</p>
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>PNG, JPG, JPEG up to 4MB each</small>
              <input type="file" multiple onChange={handleFileChange} accept="image/*" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>

            {/* Render Existing Images (For Edit Mode) */}
            {isEditMode && existingImages.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Currently Uploaded Images</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {existingImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={img.startsWith('http') ? img : `http://localhost:8000${img}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => removeExistingImage(idx)}
                        style={{
                          position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Render File Previews */}
            {previews.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>New Images Selected</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {previews.map((src, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        type="button" 
                        onClick={() => removeSelectedFile(idx)}
                        style={{
                          position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.9)',
                          color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Saving Listing...' : (
              <>
                <Save size={18} />
                {isEditMode ? 'Update Listing' : 'Publish Listing'}
              </>
            )}
          </button>
        </form>
      </div>
      <style>{`
        @media (max-width: 600px) {
          .grid-two {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateListing;
