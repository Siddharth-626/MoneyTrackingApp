import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase/config";

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
