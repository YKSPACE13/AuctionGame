import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Test Firestore connection
const testFirestore = async () => {
  try {
    console.log('Testing Firestore connection...');
    const querySnapshot = await getDocs(collection(db, 'test'));
    console.log('✅ Firestore connection successful!');
    console.log(`Found ${querySnapshot.size} test documents`);
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
  }
};

testFirestore();
