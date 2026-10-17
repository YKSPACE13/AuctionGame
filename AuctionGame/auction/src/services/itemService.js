import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const COLLECTION_NAME = 'items';

export const addItem = async () => {
    try {
        const randomItem = {
            name: `Item ${Math.floor(Math.random() * 1000)}`,
            price: Math.floor(Math.random() * 500) + 100,
            createdAt: new Date()
        };

        const docRef = await addDoc(collection(db, COLLECTION_NAME), randomItem);
        console.log("Document written with ID: ", docRef.id);
        return docRef;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getItems = (callback) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));

    return onSnapshot(q, (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
    });
};
