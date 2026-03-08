// Firebase configuration for Dv's Unblocked Games
const firebaseConfig = {
  apiKey: "AIzaSyB3twD9AxnId7GKtbw9akSKVYijiHXqF2Q",
  authDomain: "dvs-unblocked-games.firebaseapp.com",
  projectId: "dvs-unblocked-games",
  storageBucket: "dvs-unblocked-games.firebasestorage.app",
  messagingSenderId: "554988863520",
  appId: "1:554988863520:web:8ed07c8afcbf76c7663c45",
  measurementId: "G-7Q4SCNHSFW"
};

// Initialize Firebase using CDN globals
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
