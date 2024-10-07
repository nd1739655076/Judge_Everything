// Import the necessary Firebase functions
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

const IdGenerator = () => {
  const [type, setType] = useState(''); // State to store ID type
  const [name, setName] = useState(''); // State to store name
  const [generatedId, setGeneratedId] = useState(''); // State to store the generated ID
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(''); // Error state

  // Function to call the generateIdRequest Cloud Function
  const generateId = async () => {
    const generateIdFunction = httpsCallable(functions, 'generateIdRequest'); // Reference to Cloud Function
    
    try {
      setLoading(true); // Start loading
      setError(''); // Clear previous errors
      const result = await generateIdFunction({ type, name }); // Call the function with type and name
      setGeneratedId(result.data.idNum); // Set the generated ID
      console.log('Generated ID:', result.data.idNum); // Log result
    } catch (err) {
      console.error('Error generating ID:', err); // Handle errors
      setError('Failed to generate ID.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <div>
      <h2>Generate an ID</h2>

      <input
        type="text"
        placeholder="Enter Type (e.g., user, productEntry)"
        value={type}
        onChange={(e) => setType(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={generateId} disabled={loading}>
        {loading ? 'Generating ID...' : 'Generate ID'}
      </button>

      {/* Display generated ID */}
      {generatedId && (
        <div>
          <h3>Generated ID</h3>
          <p>{generatedId}</p>
        </div>
      )}

      {/* Display error message */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default IdGenerator;
