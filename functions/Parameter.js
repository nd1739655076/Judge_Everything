const admin = require('firebase-admin');
const db = admin.firestore();

class Parameter {
  constructor(paramId, productId, paramName) {
    this.paramId = paramId; // Unique ID for the parameter
    this.productId = productId; // ID of the product this parameter belongs to
    this.paramName = paramName; // Name of the parameter (e.g., "Durability")
    this.commentMap = new Map(); // Map of commenter IDs and their comments
  }

  // Method to add a comment to the parameter
  addComment(commenterId, comment) {
    this.commentMap.set(commenterId, comment); // Add comment to the map
  }

  // Save the parameter to Firestore
  async save() {
    console.log(`Saving parameter with ID: ${this.paramId} for product ID: ${this.productId}`);

    const paramDocRef = db.collection('Parameters').doc(this.paramId);

    try {
      // Convert the commentMap from a Map to a regular object to store in Firestore
      await paramDocRef.set({
        paramId: this.paramId,
        productId: this.productId,
        paramName: this.paramName, // Store the parameter name
        comments: Object.fromEntries(this.commentMap), // Convert Map to object to store in Firestore
      });
      console.log(`Parameter with ID ${this.paramId} successfully saved.`);
    } catch (error) {
      console.error(`Error saving parameter with ID ${this.paramId}:`, error);
      throw new Error(`Failed to save parameter with ID ${this.paramId}`);
    }
  }
}

module.exports = Parameter;
