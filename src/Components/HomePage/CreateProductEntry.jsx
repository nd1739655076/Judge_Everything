import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase Cloud Functions
import './CreateProductEntry.css'; // Import your custom CSS for styling
import { Link } from 'react-router-dom';

const CreateProductEntry = () => {
  const [productName, setProductName] = useState('');
  const [creatorId, setCreatorId] = useState(null);
  const [tagLibrary, setTagLibrary] = useState([]); // Store the fetched tags and subtags
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedSubtags, setSelectedSubtags] = useState([]); // Multiple subtags
  const [parameters, setParameters] = useState(new Array(10).fill(''));
  const [loading, setLoading] = useState(false); // For showing loading state during submission
  const [error, setError] = useState(''); // For showing error messages
  const [success, setSuccess] = useState(''); // For showing success messages
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    // Fetch current logged-in user's UID
    const fetchUser = async () => {
      const user = await getCurrentLoggedInUser();
      if (user) {
        setCreatorId(user.uid);
      }
    };
    fetchUser();

    // Fetch tag library from Firestore
    const fetchTagLibrary = async () => {
      try {
        const functions = getFunctions();
        const handleTagLibraryRequest = httpsCallable(functions, 'handleTagLibraryRequest');
        const response = await handleTagLibraryRequest({ action: 'getTagLibrary' });
        
        if (response.data.success) {
          setTagLibrary(response.data.tagList); // Store the fetched tags and subtags
        } else {
          console.error('Failed to fetch tags');
        }
      } catch (error) {
        console.error('Error fetching tag library:', error);
      }
    };

    fetchTagLibrary();
  }, []);

  // Handle image file selection
  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  // Convert image file to base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]); // Only return base64 part
      };
      reader.onerror = () => reject(new Error('Error reading image file.'));
    });
  };

  const handleParameterChange = (index, value) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = value;
    setParameters(updatedParameters);
  };

  const handleSubtagChange = (subtag) => {
    if (selectedSubtags.includes(subtag)) {
      setSelectedSubtags(selectedSubtags.filter(st => st !== subtag)); // Remove if already selected
    } else if (selectedSubtags.length < 3) {
      setSelectedSubtags([...selectedSubtags, subtag]); // Add new subtag if less than 3 selected
    }
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

  const handleProductEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    setSuccess(''); // Clear success messages

    // 客户端验证
    if (!productName) {
      setError('Product name is required.');
      setLoading(false);
      return;
    }

    if (!selectedTag) {
      setError('You must select at least one tag.');
      setLoading(false);
      return;
    }

    if (selectedSubtags.length < 1 || selectedSubtags.length > 3) {
      setError('You must select 1-3 subtags.');
      setLoading(false);
      return;
    }

    const nonEmptyParameters = parameters.filter(Boolean);
    if (nonEmptyParameters.length < 1) {
      setError('You must provide at least one parameter.');
      setLoading(false);
      return;
    }

    if (!description.trim()) {
    setError('Description is required.');
    setLoading(false);
    return;
  }


    if (!creatorId) {
      setError('Please login first.');
      setLoading(false);
      return;
    }

    if (!imageFile) {
      setError('You must upload an image.');
      setLoading(false);
      return;
    }

    try {
      const functions = getFunctions();
      const generateProductEntry = httpsCallable(functions, 'handleProductEntryRequest');
      let base64Image = '';
      let imageName = '';
      if (imageFile) {
        base64Image = await convertToBase64(imageFile);
        imageName = imageFile.name;
      }

      const resultEntry = await generateProductEntry({
        action: 'generate',
        productName: productName,
        uidNum: creatorId,
        tag: selectedTag, // Send selected tag
        subtags: selectedSubtags, // Send selected subtags
        paramList: parameters.filter(Boolean),
        description: description,
        imageBase64: base64Image,
        imageName: imageName,
      });

      if (resultEntry.data.success) {
        setSuccess('Product entry created successfully!');
        setProductName('');
        setSelectedTag('');
        setSelectedSubtags([]);
        setParameters(new Array(10).fill(''));
        setDescription('');
        setImageFile(null);
      } else {
        setError('Failed to create product entry. Please try again.');
      }
    } catch (err) {
      setError('Failed to create product entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-entry-container">
      <h1>Create a New Product Entry</h1>

      {error && <p className="error-message">{error}</p>}
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

        <label>
          Creator ID:
          <p>{creatorId || 'Please login to see your ID'}</p>
        </label>

        <label>
          Tag:
          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">Select a Tag</option>
            {tagLibrary.map((tag) => (
              <option key={tag.tagName} value={tag.tagName}>
                {tag.tagName}
              </option>
            ))}
          </select>
        </label>

        {/* Subtag Dropdown: only show when a tag is selected */}
        {selectedTag && (
          <div className="subtag-container">
            <p>Select 1-3 Subtags:</p>
            {(() => {
              const tagData = tagLibrary.find((tag) => tag.tagName === selectedTag);
              return tagData && Object.values(tagData.subTag).map((subtag, index) => (
                <label key={index}>
                  <input
                    type="checkbox"
                    value={subtag}
                    checked={selectedSubtags.includes(subtag)}
                    onChange={() => handleSubtagChange(subtag)}
                  />
                  {subtag}
                </label>
              ));
            })()}
          </div>
        )}

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

        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            rows="4"
          />
        </label>

        <label>
          Upload Image:
          <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} />
        </label>

        <div className="buttons-container">
          <button type="submit" disabled={loading}>
            {loading ? 'Creating Product Entry...' : 'Create Product Entry'}
          </button>
          <Link to="/" className="button-link">Homepage</Link>
        </div>
      </form>
    </div>
  );
};

export default CreateProductEntry;
