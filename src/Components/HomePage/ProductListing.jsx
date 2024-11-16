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
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showCheckboxes, setShowCheckboxes] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [parameterData, setParameterData] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

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

    const storedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
    setSearchHistory(storedHistory);
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

  const handleSearchClick = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput); // Update the search query

      // Save to search history
      const updatedHistory = [searchInput, ...searchHistory.filter(term => term !== searchInput)].slice(0, 10); // Keep only the latest 5 unique entries
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory)); // Save to local storage
    }
  }
  const handleResetClick = () => {
    setSearchInput(''); // Clear the search input
    setSearchQuery(''); // Clear the search query to show all content
    setSelectedTag(''); // Clear any selected tag filters if you have them
    setSelectedSubtag(''); // Clear any selected subtag filters
  };
  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
    setShowHistoryDropdown(false);
  };
  const handleSearchInputClick = () => {
    setShowHistoryDropdown(true); // Show the dropdown when the input is clicked
  };

  const handleHistoryItemClick = (term) => {
    setSearchInput(term); // Fill the input with the selected history term
    setShowHistoryDropdown(false); // Hide the dropdown
  };

  const handleSearchInputBlur = () => {
    setTimeout(() => setShowHistoryDropdown(false), 150); // Delay hiding to allow item click
  };
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

  useEffect(() => {
    if (selectedProducts.length === 2) {
      const fetchParameters = async () => {
        const functions = getFunctions();
        const handleParameterRequest = httpsCallable(functions, 'handleParameterRequest');

        console.log("Fetching parameters for selected products...");

        // 打印 selectedProducts 的内容
        console.log("Selected products:", selectedProducts);

        let allParameters = {};

        // 遍历 selectedProducts，获取每个 product 的参数列表
        for (let product of selectedProducts) {
          console.log("Current product:", product);  // 打印当前的 product 信息
          const parameterList = Array.isArray(product.parametorList) ? product.parametorList : [];
          console.log("Parameter list for product:", parameterList);  // 打印当前 product 的 parameterList
          // 遍历 parameterList，逐个请求参数信息
          for (let paramId of parameterList) {
            if (!allParameters[paramId]) {
              try {
                console.log(`Fetching parameter with ID: ${paramId}`);  // 打印当前正在请求的 paramId

                const response = await handleParameterRequest({ paramId });

                console.log(`Parameter fetch response for ID ${paramId}:`, response);  // 打印参数请求的响应

                if (response.data.success) {
                  allParameters[paramId] = response.data.parameter;
                  console.log(`Parameter data for ID ${paramId}:`, response.data.parameter);  // 打印成功获取的参数数据
                } else {
                  console.error(`Failed to retrieve parameter with ID ${paramId}`);
                }
              } catch (error) {
                console.error(`Error fetching parameter with ID ${paramId}:`, error);
              }
            }
          }
        }

        console.log("All fetched parameters:", allParameters);  // 打印所有已获取的参数数据
        setParameterData(allParameters);
      };

      fetchParameters();
    }
  }, [selectedProducts]);


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
          {/* Group the input box and dropdown menu */}
          <div className="input-dropdown-group">
            <div className="Search-History">
              <input
                type="text"
                placeholder="Search by product name"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onClick={handleSearchInputClick}
                onBlur={handleSearchInputBlur}
              />
              {showHistoryDropdown && searchHistory.length > 0 && (
                <div className="search-history-dropdown">
                  {searchHistory.map((term, index) => (
                    <div
                      key={index}
                      className="search-history-item"
                      onClick={() => handleHistoryItemClick(term)}
                    >
                      {term}
                    </div>
                  ))}
                  {/* Clear History Button */}
                  <div
                    className="clear-history-button"
                    onClick={handleClearHistory}
                  >
                    Clear History
                  </div>
                </div>
              )}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="highestRated">Highest Rated</option>
              <option value="postTime">Post Time</option>
              <option value="mostPopular">Most Reviews</option>
            </select>
          </div>

          {/* Group the buttons together */}
          <div className="button-group">
            <button
              style={buttonStyles}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onClick={handleSearchClick}
            >
              Search
            </button>
            <button
              style={buttonStyles}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
              onClick={handleResetClick} // New function to handle reset
            >
              Reset
            </button>
          </div>
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
          displayedProducts.length > 0 ? (
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
                <p>Tags: {product.tagList || "No tag yet"}</p>
                <p>Average Rating: {product.averageScore?.average || "No ratings yet"}</p>
                <button onClick={() => navigate(`/product/${product.id}`)}>View</button>
              </div>
            ))
          ) : (

            <p>No products available in the current category.</p>
          )
        )}

      </div>
      {showComparison && (
        <>
          <div className="overlay"></div>
          <div className="comparison-modal">
            <div className="comparison-content">
              <div className="product-comparison">
                {selectedProducts.map((product, index) => (
                  <div key={index} className="product-details">
                    <h2>{product.productName}</h2>
                    <p>Average Score: {product.averageScore?.average || 'N/A'}</p>
                    <p>Tags: {product.tagList || "No tag yet"}</p>
                    <h3>Parameters:</h3>
                    <ul>
                      {(Array.isArray(product.parametorList) ? product.parametorList : []).map((paramId) => {
                        const paramData = parameterData[paramId];
                        console.log(`Parameter ID: ${paramId}`, paramData);
                        return (
                          <li key={paramId}>
                            <strong>{paramData?.paramName || 'Loading...'}</strong>:
                            Average Score: {paramData?.averageScore?.average || 'N/A'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
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
