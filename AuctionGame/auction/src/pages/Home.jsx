import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Reveal from '../components/Reveal';
import Typewriter from '../components/Typewriter';
//import VantaBirds from '../components/VantaBirds';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const Home = () => {
  const [heroHover, setHeroHover] = useState(false);
  const [heroTimer, setHeroTimer] = useState(37);
  const [heroPlayers, setHeroPlayers] = useState(3);
  const [showButtons, setShowButtons] = useState(false);
  const [currentAuction, setCurrentAuction] = useState(null);
  const [auctionTimeLeft, setAuctionTimeLeft] = useState(0);
  const [auctionBids, setAuctionBids] = useState([]);

  // Fetch current active auction
  useEffect(() => {
    // Query without orderBy to avoid index requirement, then sort in memory
    const auctionsQuery = query(
      collection(db, 'auctions'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      auctionsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const now = new Date().getTime();
          
          // Get all active auctions, filter out ended ones, and sort by endTime
          const auctions = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
              };
            })
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
          
          if (auctions.length > 0) {
            // Get the first active auction (earliest endTime)
            const auctionData = auctions[0];
            setCurrentAuction(auctionData);
          } else {
            setCurrentAuction(null);
            setAuctionBids([]);
          }
        } else {
          setCurrentAuction(null);
          setAuctionBids([]);
        }
      },
      (error) => {
        console.error('Error fetching auctions:', error);
        setCurrentAuction(null);
        setAuctionBids([]);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fetch bids for the current auction
  useEffect(() => {
    if (!currentAuction?.id) {
      setAuctionBids([]);
      return;
    }

    const bidsQuery = query(
      collection(db, 'auctions', currentAuction.id, 'bids'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeBids = onSnapshot(bidsQuery, (snapshot) => {
      const bidsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAuctionBids(bidsData);
    });

    return () => unsubscribeBids();
  }, [currentAuction?.id]);

  // Calculate time left for real auction
  useEffect(() => {
    if (!currentAuction?.endTime) {
      setAuctionTimeLeft(0);
      return;
    }

    const updateTime = () => {
      const now = new Date().getTime();
      const endTime = currentAuction.endTime;
      
      if (endTime && endTime.seconds) {
        const endTimeMs = endTime.seconds * 1000;
        const secondsLeft = Math.floor((endTimeMs - now) / 1000);
        setAuctionTimeLeft(Math.max(0, secondsLeft));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [currentAuction]);

  useEffect(() => {
    if (!heroHover) return;

    const interval = setInterval(() => {
      // Only update timer if no real auction is set
      if (!currentAuction) {
        setHeroTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }
      // Randomly increase players up to a small cap to feel "live"
      setHeroPlayers((prev) => {
        if (prev >= 8) return prev;
        return Math.random() < 0.35 ? prev + 1 : prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [heroHover, currentAuction]);

  // Determine what to display
  const displayItemName = currentAuction?.itemName || 'Mystery Crate #214';
  const displayPrice = currentAuction?.highestBid || currentAuction?.startPrice || 420;
  const displayTimeLeft = currentAuction ? auctionTimeLeft : heroTimer;
  
  const heroMinutes = String(Math.floor(displayTimeLeft / 60)).padStart(2, '0');
  const heroSeconds = String(displayTimeLeft % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white relative z-10">
      {/* Vanta.js BIRDS background */}
      {/* <VantaBirds enabled={true} />*/}
      
      {/* Top navigation */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-gray-950/70 backdrop-blur-30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-start to-brand-end shadow-glow flex items-center justify-center text-xl">
              🏆
            </div>
            <span className="font-semibold tracking-tight text-white">Auction Platform</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
            <a href="#about" className="hover:text-white">About</a>
            <a href="#how-it-works" className="hover:text-white">How it works</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl bg-gray-800/70 border border-white/10 hover:bg-gray-800 btn-elevated"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="text-sm px-4 py-2 rounded-xl neon-btn font-medium btn-elevated"
            >
              Play now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brand-start/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-[28rem] w-[28rem] rounded-full bg-brand-end/20 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 mb-4">
                Live multiplayer · 1-minute auctions · Win coins
              </p>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight min-h-[1.2em]">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-start to-brand-end">
                  <Typewriter text="Bid. Win. Celebrate." speed={80} />
                </span>
              </h1>

              <div className="mt-4 text-gray-300 text-base sm:text-lg max-w-xl min-h-[3em]">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5, duration: 0.8 }}
                >
                  <Typewriter
                    text="Join fast-paced 60 second auctions against real players. Place smart bids, climb the leaderboard, and grow your coin balance in a neon arcade-style arena."
                    speed={30}
                    onComplete={() => setShowButtons(true)}
                  />
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showButtons ? 1 : 0, y: showButtons ? 0 : 20 }}
                transition={{ duration: 0.6 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  to="/dashboard"
                  className="px-7 py-3 rounded-xl neon-btn font-medium text-sm sm:text-base shadow-glow btn-elevated btn-ripple neon-pulse"
                >
                  Start playing
                </Link>
                <Link
                  to="/login"
                  className="px-7 py-3 rounded-xl bg-gray-900/60 border border-white/15 hover:bg-gray-900/90 text-sm sm:text-base btn-elevated"
                >
                  Sign in to continue
                </Link>
              </motion.div>

              <div className="mt-8 flex flex-wrap gap-6 text-xs sm:text-sm text-gray-400">
                <div>
                  <p className="font-semibold text-white">1-minute rounds</p>
                  <p>Perfect for quick games with friends.</p>
                </div>
                <div>
                  <p className="font-semibold text-white">Fair & transparent</p>
                  <p>All bids update in real-time.</p>
                </div>
              </div>
            </div>

            <div>
              {currentAuction ? (
                <Link to={`/auction/${currentAuction.id}`}>
                  <motion.div
                    className="rounded-2xl bg-gray-900/60 border border-white/10 p-6 shadow-glow cursor-pointer"
                    onHoverStart={() => {
                      setHeroPlayers(3);
                      setHeroHover(true);
                    }}
                    onHoverEnd={() => setHeroHover(false)}
                    whileHover={{ y: -6, scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                  >
                    <div className="grid grid-cols-5 gap-3 text-xs text-gray-300 mb-4">
                      <div className="col-span-3">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">Current auction</p>
                        <p className="font-semibold text-white mt-1">{currentAuction.itemName || 'Untitled Item'}</p>
                        {currentAuction.description && (
                          <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{currentAuction.description}</p>
                        )}
                        <div className="mt-2 space-y-1">
                          <p className="text-[11px] text-gray-400">
                            Start price:{' '}
                            <span className="text-cyan-400 font-semibold">{currentAuction.startPrice || 0} coins</span>
                          </p>
                          <p className="text-[13px] text-gray-400">
                            Highest bid:{' '}
                            <span className="text-brand-end font-semibold">
                              {displayPrice} coins
                            </span>
                          </p>
                          {currentAuction.highestBidderEmail && (
                            <p className="text-[11px] text-gray-500">
                              By: {currentAuction.highestBidderEmail}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col items-end justify-center">
                        <p className="text-[11px] uppercase tracking-wide text-gray-400">Time left</p>
                        <p className="text-2xl font-bold text-emerald-400 leading-none mt-1">
                          {heroMinutes}:{heroSeconds}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-white">Live bids</p>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                          ● {new Set(auctionBids.map(b => b.userId)).size || (auctionBids.length > 0 ? 1 : 0)} players
                        </span>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto text-xs">
                        {auctionBids.length > 0 ? (
                          auctionBids.slice(0, 3).map((bid, index) => (
                            <div key={bid.id} className={`flex items-center justify-between ${
                              index === 0 ? 'text-gray-300' : 'text-gray-400'
                            }`}>
                              <span className="truncate max-w-[140px]">{bid.userEmail || 'Anonymous'}</span>
                              <span className={`font-semibold ${index === 0 ? 'text-brand-end' : ''}`}>
                                {bid.amount} coins
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-center py-2">
                            <p className="text-[11px]">No bids yet</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <p className="line-clamp-2">
                        {currentAuction.description || 'Win this auction to earn extra coins and boost your win streak.'}
                      </p>
                      <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-gray-800/80 border border-white/10">
                        Live auction
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ) : (
                <motion.div
                  className="rounded-2xl bg-gray-900/60 border border-white/10 p-6 shadow-glow cursor-pointer"
                  onHoverStart={() => {
                    setHeroTimer(37);
                    setHeroPlayers(3);
                    setHeroHover(true);
                  }}
                  onHoverEnd={() => setHeroHover(false)}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                >
                  <div className="grid grid-cols-5 gap-3 text-xs text-gray-300 mb-4">
                    <div className="col-span-3">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Current auction</p>
                      <p className="font-semibold text-white mt-1">{displayItemName}</p>
                      <p className="text-[13px] text-gray-400 mt-1">
                        Highest bid:{' '}
                        <span className="text-brand-end font-semibold">
                          {displayPrice + (heroHover ? Math.floor((37 - heroTimer) / 3) * 5 : 0)} coins
                        </span>
                      </p>
                    </div>
                    <div className="col-span-2 flex flex-col items-end justify-center">
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">Time left</p>
                      <p className="text-2xl font-bold text-emerald-400 leading-none mt-1">
                        {heroMinutes}:{heroSeconds}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-800/80 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-white">Live bids</p>
                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        ● {heroPlayers} players
                      </span>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-hidden text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">you@example.com</span>
                        <span className="font-semibold text-brand-end">420 coins</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>rival@mail.com</span>
                        <span>390 coins</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>player3@game.com</span>
                        <span>360 coins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <p>
                      Win this auction to earn extra coins and boost your win streak.
                    </p>
                    <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-gray-800/80 border border-white/10">
                      Multiplayer auction game
                    </span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About section */}
      <section id="about" className="border-t border-white/5 bg-gray-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Reveal className="grid gap-10 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-3">
                A simple, fun way to experience live auctions
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Auction Game turns live bidding into a quick, arcade-style experience. Each
                round lasts just 60 seconds. You and other players place bids in real-time
                and the highest bid when the timer hits zero wins the item and bonus coins.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-4">
                <p className="text-2xl font-bold text-brand-end mb-1">1h</p>
                <p className="text-gray-300 text-xs uppercase tracking-wide">
                  Auction duration
                </p>
              </div>
              <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-4">
                <p className="text-2xl font-bold text-emerald-400 mb-1">Coins</p>
                <p className="text-gray-300 text-xs uppercase tracking-wide">
                  Win & grow balance
                </p>
              </div>
              <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-4">
                <p className="text-2xl font-bold text-purple-400 mb-1">Live</p>
                <p className="text-gray-300 text-xs uppercase tracking-wide">
                  Real-time bidding
                </p>
              </div>
              <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-4">
                <p className="text-2xl font-bold text-amber-300 mb-1">Friends</p>
                <p className="text-gray-300 text-xs uppercase tracking-wide">
                  Multiplayer rooms
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="border-t border-white/5 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-2">
              How the game works
            </h2>
            <p className="text-gray-300 text-center text-sm sm:text-base max-w-2xl mx-auto mb-10">
              Three simple steps to get started. All you need is an account and some coins in
              your wallet.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: '1. Sign in & load coins',
                body: 'Create an account or log in, then use the wallet page to add demo coins to your balance.',
              },
              {
                title: '2. Join a live auction',
                body: 'From your dashboard, start a quick auction or join an existing game with friends.',
              },
              {
                title: '3. Bid & win coins',
                body: 'Place bids while the 60 second timer runs. The highest bid at the end wins coins.',
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl bg-gray-950/60 border border-white/10 p-5 flex flex-col"
              >
                <div className="w-8 h-8 rounded-full bg-brand-start/20 text-brand-end flex items-center justify-center text-sm font-semibold mb-3">
                  {i + 1}
                </div>
                <h3 className="text-sm font-semibold mb-2">{step.title}</h3>
                <p className="text-xs sm:text-sm text-gray-300">{step.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="border-t border-white/5 bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Reveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">Built for speed</h2>
              <p className="text-gray-300 text-sm sm:text-base max-w-xl">
                A modern UI using Tailwind CSS and React to keep everything smooth, fast,
                and easy to understand even when the action gets intense.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex justify-center px-5 py-2 rounded-xl bg-gray-900/70 border border-white/10 text-sm hover:bg-gray-900 btn-elevated"
            >
              Go to dashboard
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="grid gap-6 md:grid-cols-3 text-sm">
            <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-5">
              <h3 className="font-semibold mb-2">Real-time updates</h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                Bids, timers, and winners are synced live using Firebase, so everyone sees
                exactly the same auction state instantly.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-5">
              <h3 className="font-semibold mb-2">Wallet & history</h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                Track your balance and see deposits, bids, and wins on your wallet page with
                a clean timeline-style transaction history.
              </p>
            </div>
            <div className="rounded-2xl bg-gray-900/60 border border-white/10 p-5">
              <h3 className="font-semibold mb-2">Admin-friendly</h3>
              <p className="text-gray-300 text-xs sm:text-sm">
                Dedicated admin views are ready so you can extend the platform with more
                control over items, users, and game rules.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ / Contact section */}
      <section id="faq" className="border-t border-white/5 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid gap-10 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Frequently asked questions</h2>
            <div className="space-y-4 text-sm">
              <div className="rounded-xl bg-gray-950/70 border border-white/10 p-4">
                <p className="font-semibold mb-1 text-white text-sm">
                  Do I play with real money?
                </p>
                <p className="text-gray-300 text-xs sm:text-sm">
                  No. This is a demo auction game that uses virtual coins only. You can add
                  coins in your wallet without any real charges.
                </p>
              </div>
              <div className="rounded-xl bg-gray-950/70 border border-white/10 p-4">
                <p className="font-semibold mb-1 text-white text-sm">
                  What happens when I win an auction?
                </p>
                <p className="text-gray-300 text-xs sm:text-sm">
                  When the timer hits 0, the highest bidder automatically wins. The game
                  credits bonus coins to the winner&apos;s account and records a win in their
                  history.
                </p>
              </div>
              <div className="rounded-xl bg-gray-950/70 border border-white/10 p-4">
                <p className="font-semibold mb-1 text-white text-sm">
                  Can I invite friends?
                </p>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Yes. Share the auction URL with friends who are logged in so they can join
                  the same room and bid with you in real time.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} id="contact" className="lg:pl-8">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Need help or have ideas?</h2>
            <p className="text-gray-300 text-sm sm:text-base mb-4">
              This project is a perfect base for a real-time auction product. You can extend
              it with custom items, leaderboards, private rooms, and more.
            </p>
            <div className="rounded-2xl bg-gray-950/70 border border-white/10 p-5 text-sm">
              <p className="text-gray-300 mb-2">
                For feedback, feature ideas, or bug reports, plug in your own support email
                or contact form here.
              </p>
              <p className="text-xs text-gray-400">
                Example: <span className="text-brand-end">support@auctiongame.dev</span>
              </p>
            </div>

            <div id="terms" className="mt-6 text-xs text-gray-500">
              <p className="font-semibold text-white mb-1">Demo terms</p>
              <p>
                All gameplay is simulated. Coins and items have no real-world value. Use this
                project for learning, prototyping, or fun.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Home;
