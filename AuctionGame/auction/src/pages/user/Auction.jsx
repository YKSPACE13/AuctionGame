import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import FloatingParticles from '../../components/FloatingParticles';

const Auction = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [auction, setAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Fetch user balance
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserBalance(userData.balance || 0);
      }
    });

    return () => unsubscribeUser();
  }, [currentUser]);

  // Fetch auction data and subscribe to real-time updates
  useEffect(() => {
    const auctionRef = doc(db, 'auctions', id);
    const unsubscribeAuction = onSnapshot(auctionRef, (doc) => {
      if (doc.exists()) {
        const data = { id: doc.id, ...doc.data() };
        setAuction(data);
        setBidAmount((data.highestBid || data.startPrice) + 10);
        
        // Check if current user is the winner
        if (data.winnerId === currentUser?.uid && !data.winnerNotified) {
          setShowConfetti(true);
          // Mark as notified (in a real app, you'd update this in Firestore)
          setTimeout(() => setShowConfetti(false), 5000);
        }
        
        setLoading(false);
      } else {
        toast.error('Auction not found');
        setLoading(false);
      }
    });

    // Subscribe to bids
    const bidsQuery = query(
      collection(db, 'auctions', id, 'bids'),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribeBids = onSnapshot(bidsQuery, (snapshot) => {
      const bidsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString()
      }));
      setBids(bidsData);
    });

    // Cleanup subscriptions
    return () => {
      unsubscribeAuction();
      unsubscribeBids();
    };
  }, [id, currentUser]);

  // Countdown timer effect
  useEffect(() => {
    if (!auction?.endTime) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(auction.endTime.seconds * 1000).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction?.endTime]);

  // Finalize auction when timer ends: set winner and credit coins
  useEffect(() => {
    const finalize = async () => {
      if (!auction || !auction.endTime) return;

      const hasEnded = new Date() > new Date(auction.endTime.seconds * 1000);
      if (!hasEnded) return;
      if (auction.status === 'completed') return;
      if (!auction.highestBidder || !auction.highestBid) return;

      try {
        const auctionRef = doc(db, 'auctions', id);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(auctionRef);
          if (!snap.exists()) return;

          const data = snap.data();
          if (data.status === 'completed') return;
          if (!data.highestBidder || !data.highestBid) return;

          // Mark auction as completed and set winner
          tx.update(auctionRef, {
            status: 'completed',
            winnerId: data.highestBidder,
            winnerEmail: data.highestBidderEmail || null,
            winnerNotified: false,
          });

          // Credit winner with coins equal to winning bid
          const userRef = doc(db, 'users', data.highestBidder);
          tx.set(
            userRef,
            {
              balance: increment(data.highestBid),
              wins: increment(1),
              lastUpdated: serverTimestamp(),
            },
            { merge: true }
          );

          // Record win transaction
          const winTxRef = doc(
            collection(db, 'users', data.highestBidder, 'transactions')
          );
          tx.set(winTxRef, {
            type: 'win',
            amount: data.highestBid,
            auctionId: auctionRef.id,
            itemName: data.itemName || '',
            timestamp: serverTimestamp(),
            status: 'completed',
            description: `Won auction for ${data.itemName || 'item'}`,
          });
        });
      } catch (error) {
        console.error('Failed to finalize auction:', error);
      }
    };

    finalize();
  }, [auction, id]);

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please log in to place a bid');
      return;
    }

    const bidValue = parseInt(bidAmount);
    if (isNaN(bidValue) || bidValue <= (auction.highestBid || auction.startPrice)) {
      toast.error(`Bid must be higher than ${auction.highestBid || auction.startPrice}`);
      return;
    }

    // Check if user has enough balance
    if (bidValue > userBalance) {
      toast.error(`Insufficient balance! You have ${userBalance} coins but need ${bidValue} coins to place this bid.`);
      return;
    }

    try {
      // Use transaction to ensure balance check and bid placement are atomic
      await runTransaction(db, async (tx) => {
        // Re-check balance in transaction to prevent race conditions
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await tx.get(userRef);
        
        if (!userSnap.exists()) {
          throw new Error('User not found');
        }

        const currentBalance = userSnap.data().balance || 0;
        if (bidValue > currentBalance) {
          throw new Error(`Insufficient balance! You have ${currentBalance} coins but need ${bidValue} coins.`);
        }

        const bidData = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          amount: bidValue,
          timestamp: serverTimestamp()
        };

        // Add bid to subcollection
        const bidRef = doc(collection(db, 'auctions', id, 'bids'));
        tx.set(bidRef, bidData);

        // Update auction with new highest bid
        const auctionRef = doc(db, 'auctions', id);
        tx.update(auctionRef, {
          highestBid: bidValue,
          highestBidder: currentUser.uid,
          highestBidderEmail: currentUser.email
        });

        // Deduct coins from user balance
        tx.update(userRef, {
          balance: increment(-bidValue),
          lastUpdated: serverTimestamp(),
        });

        // Track bid transaction for the user
        const transactionRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
        tx.set(transactionRef, {
          type: 'bid',
          amount: bidValue,
          auctionId: id,
          itemName: auction.itemName || '',
          timestamp: serverTimestamp(),
          status: 'completed',
          description: `Bid on ${auction.itemName || 'item'}`,
        });
      });

      toast.success('Bid placed successfully!');
    } catch (error) {
      console.error('Error placing bid:', error);
      if (error.message.includes('Insufficient balance')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to place bid. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Auction not found</p>
      </div>
    );
  }

  const isAuctionEnded = new Date() > new Date(auction.endTime?.seconds * 1000);
  const totalSecondsLeft =
    timeLeft.days * 86400 +
    timeLeft.hours * 3600 +
    timeLeft.minutes * 60 +
    timeLeft.seconds;

  let timerColorClass = 'text-emerald-400';
  if (totalSecondsLeft <= 10 && totalSecondsLeft > 5) {
    timerColorClass = 'text-yellow-300';
  } else if (totalSecondsLeft <= 5) {
    timerColorClass = 'text-red-400';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8 relative bg-gradient-animated">
      <FloatingParticles count={12} />
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Item Details */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl neon-pulse card-hover"
            >
              <div className="bg-gray-700 rounded-xl mb-6 max-h-72 sm:max-h-80 flex items-center justify-center">
                {auction.imageUrl ? (
                  <img
                    src={auction.imageUrl}
                    alt={auction.itemName}
                    className="max-h-72 sm:max-h-80 w-auto object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">{auction.itemName}</h1>
              <p className="text-gray-300 mb-6">{auction.description}</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Starting Price</p>
                  <p className="text-2xl font-bold text-cyan-400">{auction.startPrice} coins</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Current Bid</p>
                  <p className="text-2xl font-bold text-purple-400 neon-pulse inline-block px-3 py-1 rounded-lg">
                    {auction.highestBid || auction.startPrice} coins
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Bidding Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold mb-4">Place a Bid</h2>
              
              {isAuctionEnded ? (
                <div className="text-center py-8">
                  <p className="text-xl font-medium text-red-400 mb-2">Auction has ended</p>
                  {auction.winnerId === currentUser?.uid && (
                    <p className="text-green-400 text-lg">🎉 Congratulations! You won this auction!</p>
                  )}
                  {auction.winnerId && auction.winnerId !== currentUser?.uid && (
                    <p>Winner: {auction.highestBidderEmail || 'Anonymous'}</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  {/* User Balance Display */}
                  <div className="bg-gray-700/50 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Your Balance:</span>
                      <span className={`text-lg font-bold ${userBalance < (parseInt(bidAmount) || 0) ? 'text-red-400' : 'text-emerald-400'}`}>
                        {userBalance} coins
                      </span>
                    </div>
                    {parseInt(bidAmount) > userBalance && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Insufficient balance for this bid
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-300 mb-1">
                      Your Bid (coins)
                    </label>
                    <input
                      type="number"
                      id="bidAmount"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={(auction.highestBid || auction.startPrice) + 1}
                      max={userBalance}
                      className={`w-full px-4 py-3 rounded-xl bg-gray-700 border ${
                        parseInt(bidAmount) > userBalance 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:ring-purple-500'
                      } text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent`}
                      required
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-400">
                        Minimum bid: {(auction.highestBid || auction.startPrice) + 1} coins
                      </p>
                      {parseInt(bidAmount) > userBalance && (
                        <p className="text-xs text-red-400">
                          Need {parseInt(bidAmount) - userBalance} more coins
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={parseInt(bidAmount) > userBalance}
                    className={`w-full py-3 px-6 rounded-xl font-medium transition-opacity btn-elevated btn-ripple ${
                      parseInt(bidAmount) > userBalance
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:opacity-90 neon-pulse'
                    }`}
                  >
                    {parseInt(bidAmount) > userBalance ? 'Insufficient Balance' : 'Place Bid'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>

          {/* Right Column - Bidding Info */}
          <div className="space-y-6">
            {/* Timer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-semibold mb-4">Time Remaining</h2>
              {isAuctionEnded ? (
                <p className="text-center text-red-400 text-lg py-4">Auction Ended</p>
              ) : (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold">{timeLeft.days}</div>
                    <div className="text-xs text-gray-400">Days</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold">{timeLeft.hours}</div>
                    <div className="text-xs text-gray-400">Hours</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-2xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-xs text-gray-400">Minutes</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3">
                    <motion.div
                      key={timeLeft.seconds}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`text-2xl font-bold timer-pulse ${timerColorClass}`}
                    >
                      {timeLeft.seconds}
                    </motion.div>
                    <div className="text-xs text-gray-400">Seconds</div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Bidding History */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Bidding History</h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 online-dot" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>
                    {new Set(bids.map((b) => b.userId)).size || (bids.length > 0 ? 1 : 0)} players
                  </span>
                </div>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {bids.length > 0 ? (
                  bids.map((bid, index) => (
                    <motion.div
                      key={bid.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className={`flex items-center p-3 rounded-lg ${
                        index === 0
                          ? 'bg-cyan-900/40 border border-cyan-400 shadow-glow neon-pulse'
                          : 'bg-gray-700/40'
                      } ${index > 1 ? 'opacity-70' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                        {bid.userEmail?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{bid.userEmail || 'Anonymous'}</span> bid
                        </p>
                        <p className="text-xs text-gray-400">{bid.timestamp}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{bid.amount} coins</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No bids yet</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auction;
