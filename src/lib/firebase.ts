import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDizwTxVYMfpwTai6XTAFGXhNZqoyBiZxM",
    authDomain: "stockpilot-l48gt.firebaseapp.com",
    databaseURL: "https://stockpilot-l48gt-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "stockpilot-l48gt",
    storageBucket: "stockpilot-l48gt.firebasestorage.app",
    messagingSenderId: "374734522729",
    appId: "1:374734522729:web:aa816337c79368a7ccd5f8",
    measurementId: "G-W1N3BW4FB3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
