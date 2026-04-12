// Tệp này cấu hình kết nối giữa Website của bạn và Firebase của Google
// Bạn cần lấy các khóa API này từ Firebase Console: https://console.firebase.google.com/

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Thay thế các giá trị bên dưới bằng cấu hình từ dự án Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBh35IQrM-HYLHZLiZWdSXyDV5tvOT1y-8",
  authDomain: "articulate-bot-481502-h0.firebaseapp.com",
  projectId: "articulate-bot-481502-h0",
  storageBucket: "articulate-bot-481502-h0.firebasestorage.app",
  messagingSenderId: "627949468974",
  appId: "1:627949468974:web:45fbac27ba5bfaca5d8ebf",
  measurementId: "G-8SCMTD2RE8"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Khởi tạo Firestore
export const db = getFirestore(app);
