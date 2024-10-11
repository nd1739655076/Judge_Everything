import React, { useState, useEffect } from 'react';
import { db } from '../../firebase'; // Firebase Firestore instance
import { collection, doc, setDoc } from "firebase/firestore"; // Firestore methods
import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase Cloud Functions
import './CreatProductEntry.css'; // Import your custom CSS for styling

const CreateProductEntry = () => {
  const [productName, setProductName] = useState('');
  const [creatorId, setCreatorId] = useState(null);
  const [tags, setTags] = useState(['']);
  const [parameters, setParameters] = useState(new Array(10).fill(''));
  const [loading, setLoading] = useState(false); // For showing loading state during submission
  const [error, setError] = useState(''); // For showing error messages
  const [success, setSuccess] = useState(''); // For showing success messages

  useEffect(() => {
    // Fetch current logged in user's UID
    const fetchUser = async () => {
      const user = await getCurrentLoggedInUser();
      if (user) {
        setCreatorId(user.uid);
      }
    };
    fetchUser();
  }, []);

  // Handle changes to the tags array
  const handleTagChange = (index, value) => {
    const updatedTags = [...tags];
    updatedTags[index] = value;
    setTags(updatedTags);
  };

  // Handle changes to the parameters array
  const handleParameterChange = (index, value) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = value;
    setParameters(updatedParameters);
  };

  const getCurrentLoggedInUser = async () => {
    const localStatusToken = localStorage.getItem('authToken');
    if (localStatusToken) {
      const functions = getFunctions();
      const handleUserRequest = httpsCallable(functions, 'handleUserRequest');
      try {
        const response = await handleUserRequest({
          action: 'checkLoginStatus',
          statusToken: localStatusToken
        });
        if (response.data.success) {
          return {
            uid: response.data.uid,
            username: response.data.username
          };
        } else {
          return null;
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        return null;
      }
    } else {
      return null;
    }
  };

  // Handle form submission to create a new product entry
  const handleProductEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    setSuccess(''); // Clear success messages

    if (!creatorId) {
      setError('Please login first.');
      setLoading(false);
      return;
    }

    try {
      // Initialize Firebase Cloud Functions
      const functions = getFunctions();
      const generateProductEntry = httpsCallable(functions, 'handleProductEntryRequest');

      // Call the Cloud Function to create a product entry
      const resultEntry = await generateProductEntry({
        action: 'generate',
        productName: productName,
        uidNum: creatorId,
        tags: tags.filter(Boolean), 
        paramList: parameters.filter(Boolean), 
      });

      console.log('Product entry created:', resultEntry);

      setSuccess('Product entry created successfully!');

      setProductName('');
      setTags(new Array(5).fill(''));
      setParameters(new Array(10).fill(''));
    } catch (err) {
      console.error('Error creating product entry:', err);
      setError('Failed to create product entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-entry-container">
      <h1>Create a New Product Entry</h1>

      {/* Display Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Display Success Message */}
      {success && <p className="success-message">{success}</p>}

      <form onSubmit={handleProductEntry} className="product-entry-form">
        <label>
          Product Name:
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            placeholder="Enter product name"
          />
        </label>
        <br />
        <label>
          Creator ID:
          <p>{creatorId || 'Please login to see your ID'}</p>
        </label>
        <br />

        <label>
          Tags (up to 5):
          {tags.map((tag, index) => (
            <input
              key={index}
              type="text"
              value={tag}
              onChange={(e) => handleTagChange(index, e.target.value)}
              placeholder={`Tag ${index + 1}`}
            />
          ))}
        </label>
        <br />

        <label>
          Parameters (up to 10):
          {parameters.map((param, index) => (
            <input
              key={index}
              type="text"
              value={param}
              onChange={(e) => handleParameterChange(index, e.target.value)}
              placeholder={`Parameter ${index + 1}`}
            />
          ))}
        </label>
        <br />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating Product Entry...' : 'Create Product Entry'}
        </button>
      </form>
    </div>
  );
};

export default CreateProductEntry;