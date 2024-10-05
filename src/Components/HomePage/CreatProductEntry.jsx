import { useState } from 'react';
import { db } from './firebase';

const CreateProductEntry = () => {

  const [productName, setProductName] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [tags, setTags] = useState(['']);
  const [parameters, setParameters] = useState(new Array(10).fill(''));
  
  const handleProductEntry = async (e) => {
    e.preventDefault();

    const idProduct = {
      //idNum: generateId(),
      idNum: 1,
      name: productName,
    };
    const idParametor = {
      //idNum: generateId(),
      idNum: 2,
      name: parametorName,
    };

    const rate = {
      average: 0,
      scoreList: {},
      totalScore: 0,
      totalRater: 0
    };

    const parameter = {
      ID: idParametor,
      parametorName,
      creator,
      averageScore: rate,
      reportList: {}
    };

    const newProductEntry = {
      ID: idProduct,
      productName,
      creator,
      tag: new Array(5).fill(null),
      averageScore: rate,
      parameterList: new Array(10),
      commentList: [],
      reportList: {}
    };

    try {
      await db.collection('Id').add(idProduct);
      console.log('Product ID added to Id collection:', idProduct);
      await db.collection('Id').add(idParametor);
      console.log('Parameter ID added to Id collection:', idParametor);
      await db.collection('ProductEntries').add(newProductEntry);
      console.log('New product entry created:', newProductEntry);
    } catch (error) {
      console.error('Error creating new product entry:', error);
    }
  };

  return (
    <div>
      <h1>Create a New Product Entry</h1>
      <form onSubmit={handleCreateEntry}>
        <label>
          Product Name:
          <input 
            type="text" 
            value={productName} 
            onChange={(e) => setProductName(e.target.value)} 
            required
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
