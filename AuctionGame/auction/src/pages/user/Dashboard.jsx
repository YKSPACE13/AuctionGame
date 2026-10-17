import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { subscribeToActiveAuctions } from '../../services/auctionService';
import CountUp from '../../components/CountUp';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const userRef = doc(db, 'users', currentUser.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setUserStats(snap.data());
      }
    });

    return () => unsub();
  }, [currentUser]);

  // Live auctions subscription
  useEffect(() => {
    const unsubscribe = subscribeToActiveAuctions((auctions) => {
      setItems(auctions);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
            Auction Game
          </h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{currentUser?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800/60 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Your Profile</h2>
            <div className="space-y-4">
              <div>
                <p className="text-gray-400">Email</p>
                <p className="text-white">{currentUser?.email}</p>
              </div>
              <div>
                <p className="text-gray-400">Coins</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {userStats?.balance !== undefined ? (
                    <CountUp end={userStats.balance} />
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Wins</p>
                <p className="text-2xl font-bold text-purple-400">
                  <CountUp end={userStats?.wins || 0} />
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-gray-800/60 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Live Auctions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((auction) => (
                <div key={auction.id} className="bg-gray-700/50 rounded-xl p-4 flex flex-col card-hover">
                  <div className="h-40 bg-gray-900 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    {auction.imageUrl ? (
                      <img
                        src={auction.imageUrl}
                        alt={auction.itemName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-4xl">🎁</div>
                    )}
                  </div>
                  <h3 className="font-medium text-white mb-1">{auction.itemName}</h3>
                  <p className="text-sm text-gray-300 mb-1">
                    Current bid:{' '}
                    <span className="font-semibold text-purple-300 neon-pulse inline-block px-2 py-0.5 rounded">
                      {auction.highestBid || auction.startPrice} coins
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">
                    {auction.description}
                  </p>
                  <button
                    onClick={() => navigate(`/auction/${auction.id}`)}
                    className="mt-auto px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium btn-elevated btn-ripple card-hover"
                  >
                    Join Auction
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <p className="text-gray-400 col-span-2 text-center py-8">
                  No live auctions are available right now. Check back soon!
                </p>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
