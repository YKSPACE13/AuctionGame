import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [auctions, setAuctions] = useState([]);
  const [formState, setFormState] = useState({
    id: null,
    itemName: '',
    description: '',
    imageUrl: '',
    startPrice: '100',
    durationMinutes: '1',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubUsers = onSnapshot(usersQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    });

    const auctionsQuery = query(collection(db, 'auctions'), orderBy('createdAt', 'desc'));
    const unsubAuctions = onSnapshot(auctionsQuery, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAuctions(list);
    });

    return () => {
      unsubUsers();
      unsubAuctions();
    };
  }, []);

  const totalCoins = users.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalWins = users.reduce((sum, u) => sum + (u.wins || 0), 0);

  const resetForm = () => {
    setFormState({
      id: null,
      itemName: '',
      description: '',
      imageUrl: '',
      startPrice: '100',
      durationMinutes: '1',
    });
  };

  const handleEdit = (auction) => {
    setFormState({
      id: auction.id,
      itemName: auction.itemName || '',
      description: auction.description || '',
      imageUrl: auction.imageUrl || '',
      startPrice: String(auction.startPrice || 100),
      durationMinutes: '1',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this auction? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'auctions', id));
    } catch (e) {
      console.error('Failed to delete auction', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id, itemName, description, imageUrl, startPrice, durationMinutes } = formState;

    if (!itemName.trim()) return;

    const startPriceNumber = parseInt(startPrice, 10) || 0;
    const duration = parseInt(durationMinutes, 10) || 1;

    try {
      setSaving(true);
      const now = Timestamp.now();
      const endTime = Timestamp.fromMillis(now.toMillis() + duration * 60 * 1000);

      if (id) {
        // Update existing auction
        await updateDoc(doc(db, 'auctions', id), {
          itemName: itemName.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          startPrice: startPriceNumber,
          // Do not reset highestBid or status here
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new auction
        await addDoc(collection(db, 'auctions'), {
          itemName: itemName.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          startPrice: startPriceNumber,
          createdAt: serverTimestamp(),
          endTime,
          highestBid: startPriceNumber,
          highestBidder: null,
          highestBidderEmail: null,
          status: 'active',
          winnerId: null,
          winnerEmail: null,
          winnerNotified: false,
        });
      }

      resetForm();
    } catch (e) {
      console.error('Failed to save auction', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-start to-brand-end">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Overview of users and live auctions in your auction game.
            </p>
          </div>
          <div className="flex gap-4 text-xs sm:text-sm">
            <div className="px-4 py-3 rounded-2xl bg-gray-900/70 border border-white/10">
              <p className="text-gray-400">Total Users</p>
              <p className="text-xl font-semibold">{users.length}</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-900/70 border border-white/10">
              <p className="text-gray-400">Total Coins</p>
              <p className="text-xl font-semibold">{totalCoins}</p>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-900/70 border border-white/10">
              <p className="text-gray-400">Total Wins</p>
              <p className="text-xl font-semibold">{totalWins}</p>
            </div>
          </div>
        </header>

        {/* Main grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users list */}
          <section className="lg:col-span-1 bg-gray-900/70 border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Users</h2>
              <span className="text-xs text-gray-400">{users.length} total</span>
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs sm:text-sm">
              {users.length === 0 && (
                <p className="text-gray-400">No users found yet.</p>
              )}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-xl bg-gray-800/70 px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-start/20 text-brand-end flex items-center justify-center font-semibold text-xs uppercase">
                      {user.email ? user.email.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="font-medium text-xs sm:text-sm">
                        {user.email || 'Unknown user'}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Balance:{' '}
                        <span className="text-emerald-300 font-semibold">
                          {user.balance ?? 0} coins
                        </span>{' '}
                        · Wins:{' '}
                        <span className="text-purple-300 font-semibold">
                          {user.wins ?? 0}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Auctions list + CRUD */}
          <section className="lg:col-span-2 bg-gray-900/70 border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {formState.id ? 'Edit auction' : 'Create new auction'}
                </h2>
                <p className="text-xs text-gray-400">
                  Admins can create, edit, and delete auctions. Players will only see active ones.
                </p>
              </div>
              {formState.id && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/10 btn-elevated"
                >
                  Cancel edit
                </button>
              )}
            </div>

            {/* Create / Edit form */}
            <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-12 text-xs sm:text-sm">
              <div className="md:col-span-3">
                <label className="block mb-1 text-gray-300">Item name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                  placeholder="Mystery Crate #1"
                  value={formState.itemName}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, itemName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="md:col-span-4">
                <label className="block mb-1 text-gray-300">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                  placeholder="Short description of this item"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-3">
                <label className="block mb-1 text-gray-300">Image URL</label>
                <input
                  type="url"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                  placeholder="https://..."
                  value={formState.imageUrl}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, imageUrl: e.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-1">
                <label className="block mb-1 text-gray-300">Start price</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                  value={formState.startPrice}
                  onChange={(e) =>
                    setFormState((s) => ({ ...s, startPrice: e.target.value }))
                  }
                />
              </div>
              {!formState.id && (
                <div className="md:col-span-1">
                  <label className="block mb-1 text-gray-300">Duration (min)</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm"
                    value={formState.durationMinutes}
                    onChange={(e) =>
                      setFormState((s) => ({
                        ...s,
                        durationMinutes: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
              <div className="md:col-span-12 flex justify-end gap-2 mt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-brand-start hover:bg-brand-start/90 text-white text-xs sm:text-sm disabled:opacity-60 btn-elevated"
                >
                  {saving
                    ? 'Saving...'
                    : formState.id
                    ? 'Save changes'
                    : 'Create auction'}
                </button>
              </div>
            </form>

            {/* Auctions list */}
            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Existing auctions</h3>
                <span className="text-xs text-gray-400">{auctions.length} total</span>
              </div>

              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 text-xs sm:text-sm">
                {auctions.length === 0 && (
                  <p className="text-gray-400">No auctions created yet.</p>
                )}
                {auctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="flex flex-col sm:flex-row gap-3 rounded-xl bg-gray-800/70 p-3"
                  >
                    <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0 flex items-center justify-center">
                      {auction.imageUrl ? (
                        <img
                          src={auction.imageUrl}
                          alt={auction.itemName || 'Auction item'}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🎁
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {auction.itemName || 'Untitled auction'}
                        </h4>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            auction.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {auction.status === 'completed' ? 'Completed' : 'Active'}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 line-clamp-2 mb-1">
                        {auction.description || 'No description provided.'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-1">
                        <span>
                          Start:{' '}
                          <span className="text-emerald-300 font-semibold">
                            {auction.startPrice} coins
                          </span>
                        </span>
                        <span>
                          Highest bid:{' '}
                          <span className="text-brand-end font-semibold">
                            {auction.highestBid || auction.startPrice} coins
                          </span>
                        </span>
                        {auction.highestBidderEmail && (
                          <span className="truncate max-w-[160px]">
                            By:{' '}
                            <span className="text-gray-200">
                              {auction.highestBidderEmail}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end sm:flex-col sm:justify-between">
                      <button
                        type="button"
                        onClick={() => handleEdit(auction)}
                        className="px-3 py-1 rounded-lg bg-gray-900 hover:bg-gray-700 text-[11px] btn-elevated"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(auction.id)}
                        className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-[11px] btn-elevated"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
