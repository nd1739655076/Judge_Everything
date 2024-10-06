import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyBxBQM90NsShamiCz9pTxn8ZLhyqkMEcsg",
    authDomain: "judge-everything.firebaseapp.com",
    projectId: "judge-everything",
    storageBucket: "judge-everything.appspot.com",
    messagingSenderId: "420905221956",
    appId: "1:420905221956:web:32b585073ef8f9db90a111",
    measurementId: "G-JP6GCEFBKC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

export { db, auth };
export { functions };