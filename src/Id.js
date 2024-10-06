import { db } from './firebase'; // Import your Firebase configuration
import { doc, runTransaction } from "firebase/firestore"; // Import necessary Firestore methods

class Id {
  constructor(typePrefix) {
    this.typePrefix = typePrefix; // e.g., 'P' for Product
  }

  // Generates the next unique ID number for the given type
  async generateId() {
    // Use the `doc` method to reference the document in Firestore (Counters collection)
    const counterRef = doc(db, 'Counters', 'idCounters');

    const newIdNum = await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(counterRef);

      if (!docSnap.exists()) {
        // Initialize the counter for this type if it doesn't exist
        const initialData = { [this.typePrefix]: 1 };
        transaction.set(counterRef, initialData);
        return 1;
      } else {
        const data = docSnap.data();
        const currentCount = data[this.typePrefix] || 0;
        const newCount = currentCount + 1;
        transaction.update(counterRef, { [this.typePrefix]: newCount });
        return newCount;
      }
    });

    this.idNum = newIdNum;
    this.fullId = this.getFullId();
  }

  // Combines the type prefix and id number to form the full ID
  getFullId() {
    return `${this.typePrefix}${this.idNum}`;
  }

  static async getDataById(fullId) {
    // Extract the type prefix and the numeric ID
    const typePrefix = fullId.match(/^[A-Za-z]+/)[0]; // e.g., 'P'
    const idNum = fullId.match(/\d+$/)[0]; // e.g., '1'

    let collectionName = '';

    switch (typePrefix) {
      case 'P':
        collectionName = 'Products';
        break;
      case 'PR':
        collectionName = 'Parameters';
        break;
      // Add cases for other prefixes
      default:
        throw new Error(`Unknown type prefix: ${typePrefix}`);
    }

    // Get the document using the new modular API
    const docRef = doc(db, collectionName, fullId);
    const docSnap = await docRef.get();

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error(`No document found with ID: ${fullId}`);
    }
  }
}

export default Id;
