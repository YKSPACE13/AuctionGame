import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Check if user is admin
  const checkAdmin = (user) => {
    if (user && user.email === 'admin@admin.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  };

  // Sign in with email and password
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign in with Google
  const signInWithGoogle = () => {
    // Always show account chooser
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(auth, googleProvider);
  };

  // Sign out
  const logout = async () => {
    try {
      // Clear any admin override flag that might keep routes open
      if (typeof window !== 'undefined') {
        localStorage.removeItem('isAdmin');
      }
      await signOut(auth);
    } catch (e) {
      throw e;
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const run = async () => {
        setCurrentUser(user);
        checkAdmin(user);

        if (user) {
          try {
            setProfileLoading(true);
            const userRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userRef);

            if (!snap.exists()) {
              await setDoc(
                userRef,
                {
                  email: user.email || '',
                  balance: 1000,
                  wins: 0,
                  createdAt: serverTimestamp(),
                  lastUpdated: serverTimestamp(),
                },
                { merge: true }
              );
            }
          } catch (e) {
            console.error('Failed to ensure user profile:', e);
          } finally {
            setProfileLoading(false);
          }
        }

        setLoading(false);
      };

      run();
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isAdmin,
    login,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
