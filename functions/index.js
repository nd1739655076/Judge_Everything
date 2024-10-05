const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

class Id {
  constructor(idNum = '', name = '') {
    this.idNum = idNum;
    this.name = name;
  }

  async generateId(type) {
    let prefix;
    switch (type.toLowerCase()) {
      case 'user':
        prefix = 'USE';
        break;
      case 'productEntry':
        prefix = 'PRO';
        break;
      case 'parameter':
        prefix = 'PAR';
        break;
      case 'comment':
        prefix = 'COM';
        break;
    }

    const CounterRef = db.collection('Counters').doc('totalIdCounter');
    const totalIdCounterDoc = await CounterRef.get();
    let updateCount = 0;
    if (totalIdCounterDoc.exists) {
      updateCount = totalIdCounterDoc.data().count + 1;
    } else {
      updateCount = 1;
    }
    await counterRef.set({ count: updateCount });
    this.idNum = `${prefix}${updateCount}`;
  }
}

exports.handleIdRequest = functions.https.onCall(async (data, context) => {
  const idInstance = new Id();
  switch (data.action) {
    case 'generate':
      const newId = idInstance.generateId();
      break;
  }
});
