import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

const AUCTIONS_COLLECTION = 'auctions';

/**
 * Create a quick 1-minute auction for a demo/random item.
 * Returns the created document reference.
 */
export const createQuickAuction = async (overrides = {}) => {
  const now = Timestamp.now();
  const endTime = Timestamp.fromMillis(now.toMillis() + 60 * 1000); // 1 minute

  const randomId = Math.floor(Math.random() * 1000);

  const auction = {
    itemName: overrides.itemName || `Mystery Crate #${randomId}`,
    description:
      overrides.description ||
      'Join this 1-minute flash auction. Highest bid when the timer hits 0 wins the crate and bonus coins!',
    startPrice: overrides.startPrice || 100,
    imageUrl:
      overrides.imageUrl ||
      'https://images.pexels.com/photos/3605915/pexels-photo-3605915.jpeg?auto=compress&cs=tinysrgb&w=800',
    createdAt: serverTimestamp(),
    endTime,
    highestBid: overrides.startPrice || 100,
    highestBidder: null,
    highestBidderEmail: null,
    status: 'active', // active | completed
    winnerId: null,
    winnerEmail: null,
    winnerNotified: false,
  };

  const docRef = await addDoc(collection(db, AUCTIONS_COLLECTION), auction);
  return docRef;
};

/**
 * Subscribe to all active auctions.
 * Returns an unsubscribe function.
 * Filters out auctions that have ended.
 */
export const subscribeToActiveAuctions = (callback) => {
  const q = query(
    collection(db, AUCTIONS_COLLECTION),
    where('status', '==', 'active')
  );

  return onSnapshot(q, (snapshot) => {
    const now = new Date().getTime();
    const auctions = snapshot.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      .filter((auction) => {
        // Filter out auctions that have ended
        if (!auction.endTime || !auction.endTime.seconds) {
          return false;
        }
        const endTime = auction.endTime.seconds * 1000;
        return endTime > now;
      })
      .sort((a, b) => {
        // Sort by endTime (earliest first)
        const aTime = a.endTime?.seconds || 0;
        const bTime = b.endTime?.seconds || 0;
        return aTime - bTime;
      });
    callback(auctions);
  });
};


