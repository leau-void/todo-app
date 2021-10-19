import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpm6474LMPNAXzQAMGpamnooTQH4JJ0yM",
  authDomain: "organize-67e5f.firebaseapp.com",
  projectId: "organize-67e5f",
  storageBucket: "organize-67e5f.appspot.com",
  messagingSenderId: "987181803429",
  appId: "1:987181803429:web:b322e05d30f4d41b4e6a4c",
};

const app = initializeApp(firebaseConfig);

const db = getFirestore();

export { app, db };
