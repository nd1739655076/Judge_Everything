import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import './ProductListing.css';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [tagLibrary, setTagLibrary] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedSubtag, setSelectedSubtag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const functions = getFunctions();
        const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
        const response = await handleProductEntryRequest({ action: 'fetchProducts' });

        if (response.data.success) {
          setProducts(response.data.data);
        } else {
          console.error("Failed to fetch product list:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching product list:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTagLibrary = async () => {
      try {
        const functions = getFunctions();
        const handleTagLibraryRequest = httpsCallable(functions, 'handleTagLibraryRequest');
        const response = await handleTagLibraryRequest({ action: 'getTagLibrary' });

        if (response.data.success) {
          setTagLibrary(response.data.tagList || []);
        } else {
          console.error('Failed to fetch tags');
        }
      } catch (error) {
        console.error('Error fetching tag library:', error);
      }
    };

    fetchProducts();
    fetchTagLibrary();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (selectedTag) {
      filtered = filtered.filter(product => product.tagList && product.tagList.includes(selectedTag));
    }
    if (selectedSubtag) {
      filtered = filtered.filter(product => product.subtagList && product.subtagList.includes(selectedSubtag));
    }
    setFilteredProducts(filtered);
  }, [products, selectedTag, selectedSubtag]);

  const displayedProducts = filteredProducts
    .filter(product => product.productName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'mostPopular') {
        return b.averageScore.totalRater - a.averageScore.totalRater;
      }
      if (sortBy === 'highestRated') {
        return b.averageScore.average - a.averageScore.average;
      }
      if (sortBy === 'postTime') {
        const aTime = a.createdAt ? a.createdAt._seconds : 0;
        const bTime = b.createdAt ? b.createdAt._seconds : 0;
        return bTime - aTime;
      }
      return b.averageScore.average - a.averageScore.average;
    });

  const handleSelectProduct = (product) => {
    setSelectedProducts(prevSelected => {
      if (prevSelected.some(selected => selected.id === product.id)) {
        return prevSelected.filter(selected => selected.id !== product.id);
      } else if (prevSelected.length < 2) {
        return [...prevSelected, product];
      }
      return prevSelected;
    });
  };

  const buttonStyles = {
    padding: '12px 25px',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#fff',
    background: 'linear-gradient(135deg, #42a5f5, #64b5f6)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    margin: '15px 5px',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  };

  const handleButtonHover = (e) => {
    e.target.style.transform = 'translateY(-3px)';
    e.target.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
  };

  const handleButtonLeave = (e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  };

  return (
    <div className="product-listing">
      <div className="product-listing-header">
        <h1>Product Listings</h1>
        
        <div className="search-sort-container">
          <input
            type="text"
            placeholder="Search by product name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="highestRated">Highest Rated</option>
            <option value="postTime">Post Time</option>
            <option value="mostPopular">Most Reviews</option>
          </select>
        </div>

        <div className="filter-container">
          <label htmlFor="tag-dropdown">Filter by Tag:</label>
          <select
            id="tag-dropdown"
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setSelectedSubtag('');
            }}
          >
            <option value="">Select a Tag</option>
            {tagLibrary.map((tag) => (
              <option key={tag.tagName} value={tag.tagName}>
                {tag.tagName}
              </option>
            ))}
          </select>

          {selectedTag && (
            <div className="subtag-container">
              <label>Select a Subtag:</label>
              <select
                id="subtag-dropdown"
                value={selectedSubtag}
                onChange={(e) => setSelectedSubtag(e.target.value)}
              >
                <option value="">Select a Subtag</option>
                {tagLibrary.find(tag => tag.tagName === selectedTag)?.subTag &&
                  Object.entries(tagLibrary.find(tag => tag.tagName === selectedTag).subTag).map(([id, subtag]) => (
                    <option key={id} value={subtag}>{subtag}</option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons Container */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <button
            style={buttonStyles}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
            onClick={() => {
              setShowCheckboxes(true);
              setSelectedProducts([]);
            }}
          >
            Compare Two Products
          </button>
          {showCheckboxes && selectedProducts.length === 2 && (
            <button
              style={buttonStyles}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onClick={() => setShowComparison(true)}
            >
              Finished
            </button>
          )}
        </div>
      </div>

      <div className="product-list">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          displayedProducts.map(product => (
            <div key={product.id} className="product-card">
              {showCheckboxes && (
                <input
                  type="checkbox"
                  checked={selectedProducts.some(selected => selected.id === product.id)}
                  onChange={() => handleSelectProduct(product)}
                />
              )}
              <img src={product.productImage || 'default.jpg'} alt={product.productName} className="product-image" />
              <h3 onClick={() => navigate(`/product/${product.id}`)}>{product.productName}</h3>
              <p>{product.description || "No description available"}</p>
              <p>Tags: {(Array.isArray(product.tagList) ? product.tagList : []).join(', ')}</p>
              <p>Average Rating: {product.averageScore?.average || "No ratings yet"}</p>
              <button onClick={() => navigate(`/product/${product.id}`)}>View</button>
            </div>
          ))
        )}
      </div>

      {showComparison && (
        <>
          <div className="overlay"></div>
          <div className="comparison-modal">
            <div className="comparison-content">
              <div className="product-comparison">
                <div className="product-details">
                  <h2>{selectedProducts[0].productName}</h2>
                  <p>Average Score: {selectedProducts[0].averageScore?.average || 'N/A'}</p>
                  <p>Tags: {selectedProducts[0].tagList || 'N/A'}</p>
                </div>
                <div className="divider"></div>
                <div className="product-details">
                  <h2>{selectedProducts[1].productName}</h2>
                  <p>Average Score: {selectedProducts[1].averageScore?.average || 'N/A'}</p>
                  <p>Tags: {selectedProducts[1].tagList || 'N/A'}</p>
                </div>
              </div>
              <button className="close-button" onClick={() => setShowComparison(false)}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductListing;
