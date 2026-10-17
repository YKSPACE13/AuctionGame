import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  onSnapshot,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import CountUp from '../../components/CountUp';

const Wallet = () => {
  const { currentUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's transaction history
  const [transactions] = useCollectionData(
    query(
      collection(db, 'users', currentUser?.uid, 'transactions'),
      orderBy('timestamp', 'desc')
    ),
    { idField: 'id' }
  );

  // Fetch user data (balance, etc.)
  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          setUserData(snap.data());
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load wallet data');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleAddCoins = async (e) => {
    e.preventDefault();
    const coins = parseInt(amount);
    
    if (isNaN(coins) || coins <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const userRef = doc(db, 'users', currentUser.uid);

      // Add transaction record for deposit
      await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), {
        type: 'deposit',
        amount: coins,
        timestamp: serverTimestamp(),
        status: 'completed',
        description: 'Added coins to wallet'
      });
      
      // Update user balance
      await updateDoc(userRef, {
        balance: increment(coins),
        lastUpdated: serverTimestamp(),
      });
      
      toast.success(`Successfully added ${coins} coins to your wallet!`);
      setAmount('');
      
    } catch (error) {
      console.error('Error adding coins:', error);
      toast.error('Failed to add coins. Please try again.');
    }
  };

  if (loading || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
          Your Wallet
        </h1>
        
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-8 border border-white/10"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-300">Available Balance</p>
              <p className="text-4xl font-bold">
                <CountUp end={userData.balance} /> <span className="text-2xl text-gray-300">coins</span>
              </p>
              <p className="text-sm text-gray-400 mt-2">Last updated: {new Date(userData.lastUpdated).toLocaleString()}</p>
            </div>
            <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Coins Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl"
          >
            <h2 className="text-xl font-semibold mb-4">Add Coins</h2>
            <form onSubmit={handleAddCoins} className="space-y-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">
                  Amount (coins)
                </label>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[100, 500, 1000].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(value.toString())}
                    className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                  >
                    {value}+
                  </button>
                ))}
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity btn-elevated btn-ripple neon-pulse"
              >
                Add Coins
              </button>
              
              <p className="text-xs text-gray-400 text-center mt-2">
                * This is a demo. No real money will be charged.
              </p>
            </form>
          </motion.div>

          {/* Transaction History */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl p-6 shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Transaction History</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm btn-elevated">
                  All
                </button>
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm btn-elevated">
                  Deposits
                </button>
                <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm btn-elevated">
                  Bids
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                        tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {tx.type === 'deposit' ? 'Added Coins' : 'Placed Bid'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {tx.timestamp?.toDate ? 
                            new Date(tx.timestamp.toDate()).toLocaleString() : 
                            'Just now'}
                        </p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      tx.type === 'deposit' ? 'text-green-400' : 'text-purple-400'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-400">No transactions yet</p>
                  <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
