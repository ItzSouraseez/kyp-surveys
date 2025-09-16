// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCk0s0Z3fecIacu5Pgq8y5i_3gTYF5SgCU",
  authDomain: "knowyourplate-sourashisco.firebaseapp.com",
  projectId: "knowyourplate-sourashisco",
  storageBucket: "knowyourplate-sourashisco.firebasestorage.app",
  messagingSenderId: "406980911464",
  appId: "1:406980911464:web:4fc9ab2b604d018546f6dd",
  measurementId: "G-YW66MJ2Q55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
export default db;
