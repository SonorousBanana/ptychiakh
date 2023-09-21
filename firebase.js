// Import the functions you need from the SDKs you need
//import * as firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { FieldValue } from 'firebase/firestore';
//import Constants from "expo-constants";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-jrw1E9HJ3RFQKEwHhw04qLvaI-cafOM",
  authDomain: "fir-ath-60feb.firebaseapp.com",
  projectId: "fir-ath-60feb",
  storageBucket: "fir-ath-60feb.appspot.com",
  messagingSenderId: "843833529594",
  appId: "1:843833529594:web:b4d4476749d47a2627e543",
  measurementId: "G-R9GK9XC4R3"
};

initializeApp(firebaseConfig);
export const auth = getAuth();
export const database = getFirestore();
