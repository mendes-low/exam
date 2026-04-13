import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// вставь свой config сюда
const firebaseConfig = {
    apiKey: "AIzaSyChG4FJ_qoXq_HekFbONxbcub0tA-mwkgo",
    authDomain: "exam-e6875.firebaseapp.com",
    projectId: "exam-e6875",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

