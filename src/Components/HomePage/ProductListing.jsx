// productListing.jsx
import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import './ProductListing.css';

const ProductListing = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [tagLibrary, setTagLibrary] = useState([]);
  const [selectedTag, setSelectedTag] = useState(''); // Main tag
  const [selectedSubtag, setSelectedSubtag] = useState(''); // Subtag
  const [searchQuery, setSearchQuery] = useState(''); // Search query
  const [sortBy, setSortBy] = useState(''); // Sorting criteria
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Products
    const fetchProducts = async () => {
      try {
        const functions = getFunctions();
        const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
        const response = await handleProductEntryRequest({ action: 'fetchProducts' });

        if (response.data.success) {
          setProducts(response.data.data); // Store all products
        } else {
          console.error("Failed to fetch product list:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching product list:", error);
      } finally {
        setLoading(false); // Stop loading once the data is fetched
      }
    };

    // Fetch Tag Library
    const fetchTagLibrary = async () => {
      try {
        const functions = getFunctions();
        const handleTagLibraryRequest = httpsCallable(functions, 'handleTagLibraryRequest');
        const response = await handleTagLibraryRequest({ action: 'getTagLibrary' });

        if (response.data.success) {
          setTagLibrary(response.data.tagList || []); // Store the fetched tags and subtags
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

  // Update filtered products whenever tag or subtag changes
  useEffect(() => {
    let filtered = products;
  
    // Filter by selected tag and subtag
    if (selectedTag) {
      filtered = filtered.filter(product => product.tagList && product.tagList.includes(selectedTag));
    }
    if (selectedSubtag) {
      filtered = filtered.filter(product => product.subtagList && product.subtagList.includes(selectedSubtag));
    }
  
    setFilteredProducts(filtered);
  }, [products, selectedTag, selectedSubtag]);

  // Filter and sort products based on the selected options and search query
  const displayedProducts = filteredProducts
    .filter(product => product.productName.toLowerCase().includes(searchQuery.toLowerCase())) // Search
    .sort((a, b) => {
      if (sortBy === 'mostPopular') {
        return b.averageScore.totalRater - a.averageScore.totalRater; // Sort by number of ratings
      }
      if (sortBy === 'highestRated') {
        return b.averageScore.average - a.averageScore.average; // Sort by average rating
      }
      return 0;
    });

  const handleSubtagChange = (subtag) => {
    setSelectedSubtag(subtag);
  };

  return (
    <div className="product-listing">
      <div className="product-listing-hrader">
        <h1>Product Listings</h1>
        
        <div className="filter-container">
          {/* Tag Dropdown */}
          <label htmlFor="tag-dropdown">Filter by Tag:</label>
          <select
            id="tag-dropdown"
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setSelectedSubtag(''); // Reset subtag when changing main tag
            }}
          >
            <option value="">Select a Tag</option>
            {tagLibrary.map((tag) => (
              <option key={tag.tagName} value={tag.tagName}>
                {tag.tagName}
              </option>
            ))}
          </select>
          {/* Subtag Dropdown */}
          {selectedTag && (
            <div className="subtag-container">
              <label>Select a Subtag:</label>
              <select
                id="subtag-dropdown"
                value={selectedSubtag}
                onChange={(e) => handleSubtagChange(e.target.value)}
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
        <div className="search-sort-container">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by product name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {/* Sort Dropdown */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="">Sort By</option>
            <option value="mostPopular">Most Popular</option>
            <option value="highestRated">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Product List */}
      <div className="product-list">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          displayedProducts.map(product => (
            <div key={product.id} className="product-item">
              <h3>{product.productName}</h3>
              <p>{product.description || "No description available"}</p>
              <div className="tag-container">
                <span className="tag">{product.tagList}</span>
                {product.subtagList && product.subtagList.length > 0 && (
                  product.subtagList.map((subtag, index) => (
                    <span key={`product-subtag-${index}`} className="tag">{subtag}</span>
                  ))
                )}
              </div>
              <p>Average Rating: {product.averageScore?.average || "No ratings yet"}</p>
              <p>Comments: {product.averageScore?.totalRater || 0}</p>
            </div>
          ))
        )}
      </div>

      <div className="load-more">
        <button onClick={() => { /* Add load more functionality */ }}>LOAD MORE ENTRIES</button>
      </div>
    </div>
  );
};

export default ProductListing;
