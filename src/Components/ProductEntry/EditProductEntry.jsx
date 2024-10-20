import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Firebase Firestore instance
import { doc, updateDoc, setDoc, deleteDoc, collection, addDoc } from "firebase/firestore"; // Firestore methods
import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase Cloud Functions
import './EditProductEntry.css'; // Import your custom CSS for styling

const EditProductEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId, productData, parameters } = location.state || {}; // 获取 productId
  
  const [productName, setProductName] = useState(productData?.productName || '');
  const [creatorId, setCreatorId] = useState(productData?.creator || '');
  const [tags, setTags] = useState(productData?.tags || new Array(5).fill(''));
  const [parameterList, setParameterList] = useState(
    parameters ? [...parameters.map(param => param.paramName), ...new Array(10 - parameters.length).fill('')] : new Array(10).fill('')
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false); // For showing loading state during submission
  const [error, setError] = useState(''); // For showing error messages
  const [success, setSuccess] = useState(''); // For showing success messages

  useEffect(() => {
    // Fetch current logged in user's UID
    const fetchUser = async () => {
      const user = await getCurrentLoggedInUser();
      if (user && user.uid !== creatorId) {
        setError("You are not authorized to edit this product.");
        navigate('/');
      }
    };
    fetchUser();
  }, [creatorId, navigate]);

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

  // Handle changes to the tags array
  const handleTagChange = (index, value) => {
    const updatedTags = [...tags];
    updatedTags[index] = value;
    setTags(updatedTags);
  };

  // Handle changes to the parameters array
  const handleParameterChange = (index, value) => {
    const updatedParameters = [...parameterList];
    updatedParameters[index] = value;
    setParameterList(updatedParameters);
  };

   // New function to handle image selection
   const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Handle form submission to update the product entry
  const handleUpdateProductEntry = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors
    setSuccess(''); // Clear success messages

    if (!productId) {
      setError('Product ID is missing. Cannot update the product.');
      setLoading(false);
      return;
    }

    try {
      // Update product entry in Firestore
      const productRef = doc(db, 'ProductEntry', productId);

      await updateDoc(productRef, {
        productName: productName,
        tags: tags.filter(Boolean),
        parameters: parameterList.filter(Boolean).map(param => ({ paramName: param })),
        lastUpdated: new Date(),
      });

      // Update Parameters collection
            const existingParameters = parameters.map(param => param.paramName);
      for (let i = 0; i < parameterList.length; i++) {
        const paramName = parameterList[i];
        if (paramName) {
          if (i < existingParameters.length) {
            // Update existing parameter
            const paramId = parameters[i].paramId;
            const paramRef = doc(db, 'Parameters', paramId);
            await updateDoc(paramRef, { paramName });
          } else {
            // Add new parameter with generated ID
            const functions = getFunctions();
            const handleIdRequest = httpsCallable(functions, 'handleIdRequest');
            const idResponse = await handleIdRequest({ action: 'generate', type: 'parameter', name: paramName });
            const newParamId = idResponse.data.idNum;
            await setDoc(doc(db, 'Parameters', newParamId), {
              productId,
              paramName,
              averageScore: {
                average: 0,
                totalScore: 0,
                totalRater: 0,
              },
            });
          }
        } else if (i < existingParameters.length) {
          // Delete parameter if removed
          const paramId = parameters[i].paramId;
          await deleteDoc(doc(db, 'Parameters', paramId));
        }
      }
      
      if (selectedImage) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result.split(',')[1]; // Get base64 part
          const functions = getFunctions();
          const handleImageRequest = httpsCallable(functions, 'handleImageRequest');
          try {
            const imageResponse = await handleImageRequest({
              action: 'upload',
              base64: base64Image,
              filename: selectedImage.name,
              productId: productId
            });
            console.log('Image uploaded:', imageResponse);
          } catch (error) {
            console.error('Error uploading image:', error);
            setError('Failed to upload image.');
          }
        };
        reader.readAsDataURL(selectedImage);
      }

      setSuccess('Product entry updated successfully!');

      setTimeout(() => {
        navigate(`/product/${productId}`, { replace: true }); // 使用 replace 参数来触发数据重新获取
        window.location.reload(); // 强制刷新页面
      }, 2000);
    } catch (err) {
      console.error('Error updating product entry:', err);
      setError('Failed to update product entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel update
  const handleCancelUpdate = () => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="edit-product-entry-container">
      <h1>Edit Product Entry</h1>

      {/* Display Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Display Success Message */}
      {success && <p className="success-message">{success}</p>}

      <form onSubmit={handleUpdateProductEntry} className="edit-product-entry-form">
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
          <p>{creatorId || 'Canceled Account'}</p>
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
          {parameterList.map((param, index) => (
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
        <label>
          Upload New Image:
          <input type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        <br />

        <div className="button-group">
          <button type="submit" disabled={loading} className="update-button">
            {loading ? 'Updating Product Entry...' : 'Update Product Entry'}
          </button>
          <button type="button" onClick={handleCancelUpdate} className="cancel-button">
            Cancel Updating
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProductEntry;