import React, { useState } from 'react';
import { collection, doc, setDoc } from 'firebase/firestore'; // Firestore modular API
import { db } from '../../firebase'; // Import Firestore instance from firebase.js
import Id from '../../Id'; // Import the Id class for generating IDs
import './CreateProductEntry.css'; // Import your custom CSS file

const CreateProductEntry = () => {
  const [productName, setProductName] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [tags, setTags] = useState(['']);
  const [parameters, setParameters] = useState(new Array(10).fill(''));

  // Handle changes to the tags array
  const handleTagChange = (index, value) => {
    const updatedTags = [...tags];
    updatedTags[index] = value;
    setTags(updatedTags);
    console.log(`Tag updated at index ${index}:`, updatedTags);
  };

  // Handle changes to the parameters array
  const handleParameterChange = (index, value) => {
    const updatedParameters = [...parameters];
    updatedParameters[index] = value;
    setParameters(updatedParameters);
    console.log(`Parameter updated at index ${index}:`, updatedParameters);
  };

  const handleProductEntry = async (e) => {
    e.preventDefault();
    console.log('Form submitted. Creating new product entry...');

    try {
      // Generate a new product ID
      const productId = new Id('P');
      await productId.generateId(); // Generate ID with the prefix 'P'
      console.log('Generated Product ID:', productId.getFullId());

      // For parameters, generate new IDs with 'PR' prefix
      const parameterIds = [];
      for (let i = 0; i < parameters.length; i++) {
        if (parameters[i]) {
          const parameterId = new Id('PR');
          await parameterId.generateId();
          parameterIds.push(parameterId);
          console.log(`Generated Parameter ID for Parameter ${i}:`, parameterId.getFullId());
        }
      }

      // Define the rating structure for the product
      const rate = {
        average: 0,
        scoreList: {},
        totalScore: 0,
        totalRater: 0,
      };
      console.log('Rating structure initialized:', rate);

      // Build the parameter list with IDs and other details
      const parameterList = parameterIds.map((idObj, index) => ({
        ID: idObj.getFullId(),
        parametorName: parameters[index],
        creator: creatorId,
        averageScore: rate,
        reportList: {},
      }));
      console.log('Parameter list constructed:', parameterList);

      // Build the new product entry
      const newProductEntry = {
        ID: productId.getFullId(), // Use the generated full ID
        productName,
        creator: creatorId,
        tags: tags.filter(Boolean), // Filter out any empty tags
        averageScore: rate,
        parameterList,
        commentList: [],
        reportList: {},
      };
      console.log('New product entry constructed:', newProductEntry);

      // Save the new product entry in the database using modular syntax
      const productRef = doc(collection(db, 'ProductEntries'), productId.getFullId());
      await setDoc(productRef, newProductEntry);
      console.log('New product entry saved to the database.');

      // Optionally reset form fields after submission
      setProductName('');
      setCreatorId('');
      setTags(['']);
      setParameters(new Array(10).fill(''));
      console.log('Form fields reset.');

    } catch (error) {
      console.error('Error creating new product entry:', error);
    }
  };

  return (
    <div className="product-entry-container">
      <h1>Create a New Product Entry</h1>
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
          <input
            type="text"
            value={creatorId}
            onChange={(e) => setCreatorId(e.target.value)}
            required
            placeholder="Enter creator ID"
          />
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

        <button type="submit">Create Product Entry</button>
      </form>
    </div>
  );
};

export default CreateProductEntry;
