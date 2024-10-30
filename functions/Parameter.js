const admin = require('firebase-admin');

const db = admin.firestore();

class Parameter {
  constructor(paramId, productId, paramName) {
    this.paramId = paramId; // Unique ID for the parameter
    this.productId = productId; // ID of the product this parameter belongs to
    this.paramName = paramName; // Name of the parameter (e.g., "Durability")
    this.commentMap = new Map(); // Map of commenter IDs and their comments

    // New average rating structure
    this.averageScore = {
      average: 0, // Current average score for this parameter
      totalScore: 0, // Total sum of all ratings for this parameter
      totalRater: 0, // Total number of raters who rated this parameter
      scoreList: new Map(),
    };
  }

  // Method to add a comment to the parameter
  addComment(commenterId, comment) {
    this.commentMap.set(commenterId, comment); // Add comment to the map
  }

  // Method to add a rating and update the average score
  addRating(rating) {
    const newTotalRaters = this.averageScore.totalRater + 1;
    const newTotalScore = this.averageScore.totalScore + rating;
    const newAverage = newTotalScore / newTotalRaters;

    // Update the averageScore field
    this.averageScore = {
      average: newAverage,
      totalScore: newTotalScore,
      totalRater: newTotalRaters,
    };
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
        averageScore: this.averageScore, // Save the average rating information
      });
      console.log(`Parameter with ID ${this.paramId} successfully saved.`);
    } catch (error) {
      console.error(`Error saving parameter with ID ${this.paramId}:`, error);
      throw new Error(`Failed to save parameter with ID ${this.paramId}`);
    }
  }
}

module.exports = Parameter;
