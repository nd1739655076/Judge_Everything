const admin = require("firebase-admin");

const db = admin.firestore();

class Id {
  /**
   * Generates a unique ID number based on the type (user, productEntry, etc.).
   * @param {string} type - The type of entity for which to generate an ID.
   * @returns {string} - The generated ID.
   */
  async generateIdNum(type) {
    let prefix;
    switch (type.toLowerCase()) {
      case "user":
        prefix = "USE";
        break;
      case "productEntry":
        prefix = "PRO";
        break;
      case "parameter":
        prefix = "PAR";
        break;
      case "comment":
        prefix = "COM";
        break;
      default:
        throw new Error("Invalid type provided for ID generation.");
    }

    const counterRef = db.collection("Counters").doc("totalIdCounter");
    const totalIdCounterDoc = await counterRef.get();
    let updateCount = 1;
    if (totalIdCounterDoc.exists) {
      updateCount = totalIdCounterDoc.data().count + 1;
    }

    await counterRef.set({count: updateCount});
    const generatedId = `${prefix}${updateCount}`;
    return generatedId;
  }

  /**
   * Generates a unique ID and stores it in the Firestore 'Id' collection.
   * @param {string} type - The type of entity for which to generate an ID.
   * @param {string} name - The name associated with the ID.
   * @returns {object} - The generated ID and the associated name.
   */
  async generateId(type, name) {
    const idNum = await this.generateIdNum(type);
    const idDocRef = db.collection("Id").doc(idNum);
    await idDocRef.set({
      idNum: idNum,
      name: name,
    });
    return {idNum, name};
  }
}

module.exports = Id;