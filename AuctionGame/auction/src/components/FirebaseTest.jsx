import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

const FirebaseTest = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Subscribe to the 'test_items' collection
        const q = query(collection(db, 'test_items'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedItems = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(fetchedItems);
        }, (err) => {
            console.error("Error fetching items:", err);
            setError("Failed to fetch items. Check console for details.");
        });

        return () => unsubscribe();
    }, []);

    const addItem = async () => {
        setLoading(true);
        setError(null);
        try {
            const newItem = {
                name: `Sample Item ${Math.floor(Math.random() * 1000)}`,
                price: Math.floor(Math.random() * 100) + 10,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, 'test_items'), newItem);
        } catch (err) {
            console.error("Error adding item:", err);
            setError("Failed to add item. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md bg-white max-w-md mx-auto my-8">
            <h2 className="text-xl font-bold mb-4">Firebase Connection Test</h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <button
                onClick={addItem}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4 w-full disabled:opacity-50"
            >
                {loading ? 'Adding...' : 'Add Sample Item'}
            </button>

            <div>
                <h3 className="font-semibold mb-2">Items from Firebase:</h3>
                {items.length === 0 ? (
                    <p className="text-gray-500 italic">No items yet.</p>
                ) : (
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {items.map(item => (
                            <li key={item.id} className="p-2 bg-gray-50 rounded border">
                                <span className="font-medium">{item.name}</span>
                                <span className="float-right text-green-600">${item.price}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default FirebaseTest;
