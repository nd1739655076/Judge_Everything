const admin = require('firebase-admin');

const db = admin.firestore();

class TagLibrary {

  // action == 'initializeTagLibrary'
  static async initializeTagLibrary() {
    const tagList = [
      {
        tagName: 'Technology',
        subTag: {
          subTagId1: 'Smartphones',
          subTagId2: 'Laptops',
          subTagId3: 'AI',
          subTagId4: 'Wearables',
          subTagId5: 'Drones',
          subTagId6: 'Smart Home Devices',
          subTagId7: 'Gaming Consoles',
        }
      },
      {
        tagName: 'Fashion',
        subTag: {
          subTagId1: 'Clothing',
          subTagId2: 'Accessories',
          subTagId3: 'Footwear',
          subTagId4: 'Jewelry',
          subTagId5: 'Handbags',
          subTagId6: 'Watches',
          subTagId7: 'Hats',
        }
      },
      {
        tagName: 'Food',
        subTag: {
          subTagId1: 'Pizza',
          subTagId2: 'Burger',
          subTagId3: 'Pasta',
          subTagId4: 'Vegan',
          subTagId5: 'Seafood',
          subTagId6: 'Snacks',
          subTagId7: 'Desserts',
        }
      },
      {
        tagName: 'Home Appliances',
        subTag: {
          subTagId1: 'Refrigerators',
          subTagId2: 'Washing Machines',
          subTagId3: 'Microwaves',
          subTagId4: 'Air Conditioners',
          subTagId5: 'Vacuum Cleaners',
          subTagId6: 'Dishwashers',
          subTagId7: 'Ovens',
        }
      },
      {
        tagName: 'Automobiles',
        subTag: {
          subTagId1: 'Electric Cars',
          subTagId2: 'Hybrid Cars',
          subTagId3: 'Motorcycles',
          subTagId4: 'Tires',
          subTagId5: 'Car Batteries',
          subTagId6: 'Car Accessories',
        }
      },
      {
        tagName: 'Health & Beauty',
        subTag: {
          subTagId1: 'Skincare',
          subTagId2: 'Haircare',
          subTagId3: 'Makeup',
          subTagId4: 'Supplements',
          subTagId5: 'Fitness Equipment',
          subTagId6: 'Wellness Devices',
        }
      },
      {
        tagName: 'Sports & Outdoors',
        subTag: {
          subTagId1: 'Bicycles',
          subTagId2: 'Tents',
          subTagId3: 'Fishing Gear',
          subTagId4: 'Hiking Boots',
          subTagId5: 'Sports Equipment',
          subTagId6: 'Kayaks',
          subTagId7: 'Camping Gear',
        }
      },
      {
        tagName: 'Toys & Games',
        subTag: {
          subTagId1: 'Action Figures',
          subTagId2: 'Board Games',
          subTagId3: 'Educational Toys',
          subTagId4: 'Puzzles',
          subTagId5: 'Outdoor Toys',
          subTagId6: 'Dolls',
        }
      },
      {
        tagName: 'Furniture',
        subTag: {
          subTagId1: 'Sofas',
          subTagId2: 'Chairs',
          subTagId3: 'Tables',
          subTagId4: 'Beds',
          subTagId5: 'Mattresses',
          subTagId6: 'Office Furniture',
          subTagId7: 'Outdoor Furniture',
        }
      },
      {
        tagName: 'Books & Stationery',
        subTag: {
          subTagId1: 'Fiction',
          subTagId2: 'Non-Fiction',
          subTagId3: 'Educational Books',
          subTagId4: 'Notebooks',
          subTagId5: 'Pens',
          subTagId6: 'Calendars',
          subTagId7: 'Art Supplies',
        }
      }
    ];

    const tagLibraryRef = db.collection('TagLibrary');
    const existingTagListSnapshot = await tagLibraryRef.get();
    const batchDelete = db.batch();
    existingTagListSnapshot.forEach((doc) => {
      batchDelete.delete(doc.ref);
    });
    await batchDelete.commit();
    const batchWrite = db.batch();
    tagList.forEach(tag => {
      const newTagRef = tagLibraryRef.doc();
      batchWrite.set(newTagRef, tag);
    });
    await batchWrite.commit();

    return { status: 'success', message: 'TagLibrary initialized successfully with new data.' };
  }

  // action == 'getTagLibrary'
  static async getTagLibrary() {
    const tagLibraryRef = db.collection('TagLibrary');
    const querySnapshot = await tagLibraryRef.get();
    const tagList = [];
    querySnapshot.forEach(doc => {
      tagList.push({ ...doc.data() });
    });
    return { status: 'success', tagList };
  }

}

module.exports = TagLibrary;
