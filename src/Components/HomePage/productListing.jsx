import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './productListing.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState(''); // For "Most Popular" or "Highest Rated"
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const functions = getFunctions();
      const handleProductEntryRequest = httpsCallable(functions, 'handleProductEntryRequest');
      const response = await handleProductEntryRequest({ action: 'fetchProducts' });

      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        console.error("Failed to fetch products:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort products based on selected sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOption === 'mostPopular') {
      // Sort by totalRater in descending order
      return (b.averageScore?.totalRater || 0) - (a.averageScore?.totalRater || 0);
    } else if (sortOption === 'highestRated') {
      // Sort by average score in descending order
      return (b.averageScore?.average || 0) - (a.averageScore?.average || 0);
    }
    return 0; // No sorting if no sort option selected
  });

  return (
    <div className="products-page">
      <h1>Products</h1>

      <div className="search-sort-bar">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search for a product"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        {/* Sorting Options */}
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="sort-dropdown">
          <option value="">Sort By</option>
          <option value="mostPopular">Most Popular</option>
          <option value="highestRated">Highest Rated</option>
        </select>
      </div>

      {/* Display Products */}
      {loading ? (
        <p>Loading products...</p>
      ) : sortedProducts.length > 0 ? (
        <div className="product-list">
          {sortedProducts.map(product => (
            <div key={product.id} className="product-item">
              <h3>{product.productName}</h3>
              <p>{product.description || "No description available"}</p>
              <p>Tags: {product.tagList?.join(", ") || "No tags"}</p>
              <p>Average Rating: {product.averageScore?.average || "No ratings yet"}</p>
              <p>Comments: {product.averageScore?.totalRater || 0}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No products found.</p>
      )}
    </div>
  );
};

export default ProductsPage;
