import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from "firebase/firestore"; // Firestore methods
import { getFunctions, httpsCallable } from "firebase/functions"; // Firebase Cloud Functions
import { db } from '../../firebase'; // Firebase Firestore instance
import './EditProductEntry.css'; // Import your custom CSS for styling

const EditProductEntry = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { productId, productData, parameters } = location.state || {}; // 获取 productId
  
  // 初始状态设置，保留现有tagList和subtagList
  const [productName, setProductName] = useState(productData?.productName || '');
  const [creatorId, setCreatorId] = useState(productData?.creator || '');
  const [tagList, setTagList] = useState(productData?.tagList || ''); // 这里使用 tagList 而不是 tags
  const [selectedSubtags, setSelectedSubtags] = useState(productData?.subtagList || []); // 这里使用 subtagList 而不是 subtags
  const [description, setDescription] = useState(productData?.description || ''); // Edit description
  const [imageFile, setImageFile] = useState(null); // Store new image file
  const [currentImage, setCurrentImage] = useState(productData?.productImage || ''); // Store current image
  const [tagLibrary, setTagLibrary] = useState([]); // Store the fetched tags and subtags
  const [parameterList, setParameterList] = useState(
    parameters ? [...parameters.map(param => param.paramName), ...new Array(10 - parameters.length).fill('')] : new Array(10).fill('')
  );
  const [loading, setLoading] = useState(false); // For showing loading state during submission
  const [error, setError] = useState(''); // For showing error messages
  const [success, setSuccess] = useState(''); // For showing success messages

  // 获取用户信息并确保当前用户是creator
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentLoggedInUser();
      if (user && user.uid !== creatorId) {
        setError("You are not authorized to edit this product.");
        navigate('/');
      }
    };

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

    fetchUser();
    fetchTagLibrary();
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

  // 修改主标签
  const handleTagChange = (e) => {
    setTagList(e.target.value);
    // 当选择新的主标签时，清空之前的 subtag 选择
    setSelectedSubtags([]);
  };

  // 修改子标签
  const handleSubtagChange = (subtag) => {
    if (selectedSubtags.includes(subtag)) {
      setSelectedSubtags(selectedSubtags.filter(st => st !== subtag)); // Remove if already selected
    } else if (selectedSubtags.length < 3) {
      setSelectedSubtags([...selectedSubtags, subtag]); // Add new subtag if less than 3 selected
    }
  };

  const handleParameterChange = (index, value) => {
    const updatedParameters = [...parameterList];
    updatedParameters[index] = value;
    setParameterList(updatedParameters);
  };

  const handleImageChange = (e) => {
    if (e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

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
      let base64Image = currentImage; // Keep the current image by default
      let imageName = '';

      // 如果上传了新图片，将其转换为base64
      if (imageFile) {
        base64Image = await convertToBase64(imageFile);
        imageName = imageFile.name;
      }

      // 更新产品信息，包含tagList和subtagList
      const productRef = doc(db, 'ProductEntry', productId);
      await updateDoc(productRef, {
        productName: productName,
        tagList: tagList, // 更新tagList
        subtagList: selectedSubtags, // 更新subtagList
        description: description, // Update the description
        productImage: base64Image, // Update image if changed
        parameters: parameterList.filter(Boolean).map(param => ({ paramName: param })),
        lastUpdated: new Date(),
      });

      setSuccess('Product entry updated successfully!');
      setTimeout(() => {
        navigate(`/product/${productId}`, { replace: true }); // Trigger data re-fetch
        window.location.reload(); // Force page refresh
      }, 2000);
    } catch (err) {
      console.error('Error updating product entry:', err);
      setError('Failed to update product entry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpdate = () => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="edit-product-entry-container">
      <h1>Edit Product Entry</h1>

      {error && <p className="error-message">{error}</p>}
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
          Tag:
          <select value={tagList} onChange={handleTagChange}>
            <option value="">Select a Tag</option>
            {tagLibrary.map((tag) => (
              <option key={tag.tagName} value={tag.tagName}>
                {tag.tagName}
              </option>
            ))}
          </select>
        </label>
        <br />

        {tagList && (
          <div className="subtag-container">
            <p>Select 1-3 Subtags:</p>
            {(() => {
              const tagData = tagLibrary.find((tag) => tag.tagName === tagList);
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
        <br />

        <label>
          Description:
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter product description"
            rows="4"
          />
        </label>
        <br />

        <label>
          Upload Image:
          <input type="file" accept="image/jpeg, image/png" onChange={handleImageChange} />
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
