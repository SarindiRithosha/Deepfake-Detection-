import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';

console.log('Firebase Config Check:', {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? 'Loaded' : 'Missing',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ? 'Loaded' : 'Missing',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID ? 'Loaded' : 'Missing'
});

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Authentication functions
export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const registerUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const sendVerification = (user) => {
    return sendEmailVerification(user);
};

export const resetPasswordEmail = (email) => {
    return sendPasswordResetEmail(auth, email);
};

export const updateUserPassword = (user, newPassword) => {
    return updatePassword(user, newPassword);
};

export const logoutUser = () => {
    return signOut(auth);
};

export const getCurrentUser = () => {
    return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        }, reject);
    });
};