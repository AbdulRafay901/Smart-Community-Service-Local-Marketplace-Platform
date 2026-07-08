import React, { useState, useEffect } from 'react';
import ListingCard from '../components/ListingCard';
import { Search, MapPin, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import api from '../utils/api';

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState({
    service: ['Web Development', 'Photography', 'Graphic Designing', 'Home Services', 'Tutoring', 'Content Writing', 'Digital Marketing', 'Video Editing'],
    product: ['Electronics', 'Fashion', 'Home & Living', 'Books', 'Sports & Outdoors', 'Others']
  });

  // Filter States
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Trigger search params
  const [appliedFilters, setAppliedFilters] = useState({
    q: '', type: '', category: '', location: '', min_price: '', max_price: '', rating: '', sort: 'latest', page: 1
  });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.keys(appliedFilters).forEach(key => {
        if (appliedFilters[key] !== '') {
          params[key] = appliedFilters[key];
        }
      });
      const response = await api.get('/listings', { params });
      setListings(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (error) {
      console.error("Failed to load listings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [appliedFilters]);

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    setAppliedFilters({
      q: search,
      type,
      category,
      location,
      min_price: minPrice,
      max_price: maxPrice,
      rating,
      sort,
      page: 1 // Reset to page 1 on new search
    });
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setAppliedFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setCategory('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSort('latest');
    setPage(1);
    setAppliedFilters({
      q: '', type: '', category: '', location: '', min_price: '', max_price: '', rating: '', sort: 'latest', page: 1
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero Banner Section */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: '1.2' }}>
          Discover Trusted Local <span style={{ background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Services & Products</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', fontSize: '1.05rem' }}>
          Hire professional freelancers, book home services, or buy and sell items directly within your local neighborhood.
        </p>

        {/* Global Search Bar */}
        <form onSubmit={handleApplyFilters} style={{
          display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '700px', backgroundColor: 'var(--bg-secondary)',
          padding: '0.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-focus)',
          boxShadow: 'var(--shadow-md)', marginTop: '1rem'
        }} className="hero-search">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0 0.5rem' }}>
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="What are you looking for today?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'none', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 0.8, padding: '0 0.5rem', borderLeft: '1px solid var(--border-color)' }} className="search-loc">
            <MapPin size={18} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Location/Neighborhood" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'none', outline: 'none', fontSize: '0.95rem' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-md)', padding: '0.6rem 1.5rem' }}>
            Search
          </button>
        </form>
      </section>

      {/* Main Browse Grid */}
      <div className="grid-cols-12" style={{ display: 'grid' }}>
        
        {/* Filters Sidebar */}
        <aside style={{ gridColumn: 'span 3' }} className="filters-sidebar">
          <div className="card glass" style={{ padding: '1.5rem', position: 'sticky', top: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} />
                Filters
              </h3>
              <button 
                onClick={clearFilters} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
              >
                Clear All
              </button>
            </div>

            <form onSubmit={handleApplyFilters} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Type Filter */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Listing Type</label>
                <select className="form-select" value={type} onChange={(e) => { setType(e.target.value); setCategory(''); }}>
                  <option value="">All Listings</option>
                  <option value="service">Services Only</option>
                  <option value="product">Products Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select Category</option>
                  {/* Render based on selected listing type */}
                  {(!type || type === 'service') && (
                    <optgroup label="Services">
                      {categories.service.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  )}
                  {(!type || type === 'product') && (
                    <optgroup label="Products">
                      {categories.product.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Location Input (Backup) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. West End, Downtown" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Price Range Filter */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Price Range ($)</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Min" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  />
                  <span style={{ color: 'var(--text-muted)' }}>-</span>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Max" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ padding: '0.5rem' }}
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Provider Rating</label>
                <select className="form-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="">Any Rating</option>
                  <option value="5">5 Stars only</option>
                  <option value="4">4 Stars & up</option>
                  <option value="3">3 Stars & up</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Apply Filters
              </button>
            </form>
          </div>
        </aside>

        {/* Listings Display */}
        <main style={{ gridColumn: 'span 9' }} className="listings-grid-container">
          {/* Header Actions */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem',
            backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{listings.length}</span> items
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={16} style={{ color: 'var(--text-muted)' }} />
              <select 
                className="form-select" 
                value={sort} 
                onChange={(e) => { setSort(e.target.value); setAppliedFilters(prev => ({ ...prev, sort: e.target.value })); }}
                style={{ padding: '0.4rem 2rem 0.4rem 1rem', width: 'auto', borderRadius: 'var(--radius-sm)' }}
              >
                <option value="latest">Sort by: Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <p style={{ color: 'var(--text-muted)' }}>Loading items...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="card glass animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <SlidersHorizontal style={{ margin: '0 auto 1rem', strokeWidth: 1.5, color: 'var(--text-muted)' }} size={48} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No Listings Found</h3>
              <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto' }}>
                We couldn't find any items matching your selected criteria. Try resetting filters or using different keywords.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {listings.map(item => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>

              {/* Pagination Handles */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                  <button 
                    onClick={() => handlePageChange(page - 1)} 
                    disabled={page === 1}
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`btn ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.5rem 1rem', minWidth: '40px' }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button 
                    onClick={() => handlePageChange(page + 1)} 
                    disabled={page === totalPages}
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Embedded CSS overrides for layout */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 992px) {
          .grid-cols-12 {
            display: flex !important;
            flex-direction: column !important;
          }
          .filters-sidebar {
            display: none !important; /* In small screens user relies on search bar */
          }
        }
        @media (max-width: 600px) {
          .hero-search {
            flex-direction: column !important;
            padding: 0.75rem !important;
          }
          .search-loc {
            border-left: none !important;
            border-top: 1px solid var(--border-color) !important;
            padding-top: 0.5rem !important;
            margin-top: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
