const admin = require('firebase-admin');

const db = admin.firestore();

class Id {
  // helper
  async generateIdNum(type) {
    let prefix;
    switch (type.toLowerCase()) {
      case 'user':
        prefix = 'USE';
        break;
      case 'productentry':
        prefix = 'PRO';
        break;
      case 'parameter':
        prefix = 'PAR';
        break;
      case 'comment':
        prefix = 'COM';
        break;
      case 'admin':
        prefix = 'ADM';
        break;
      default:
        throw new Error("Invalid type provided for ID generation.");
    }
    const counterRef = db.collection('Counters').doc('totalIdCounter');
    const totalIdCounterDoc = await counterRef.get();
    let updateCount = 0;
    if (totalIdCounterDoc.exists) {
      updateCount = totalIdCounterDoc.data().count + 1;
    } else {
      updateCount = 1;
    }
    await counterRef.set({ count: updateCount });
    const generatedId = `${prefix}${updateCount}`;
    return generatedId;
  }

  // action === 'generate'
  async generateId(type, name) {
    const idNum = await this.generateIdNum(type);
    const idDocRef = db.collection('Id').doc(idNum);
    await idDocRef.set({
      idNum: idNum,
      name: name
    });
    return {idNum, name};
  }
}

module.exports = Id;