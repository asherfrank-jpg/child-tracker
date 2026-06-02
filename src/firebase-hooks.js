import { useState, useEffect } from "react";
import {
  signInWithPopup, signOut, onAuthStateChanged,
} from "firebase/auth";
import {
  doc, collection, query, orderBy, limit,
  onSnapshot, setDoc, addDoc, updateDoc,
  serverTimestamp, getDoc, arrayUnion,
} from "firebase/firestore";
import { auth, db, provider } from "./firebase-config";

export function useAuth() {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [familyId, setFamilyId] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const fid = await findOrCreateFamily(u);
        setFamilyId(fid);
      } else {
        setFamilyId(null);
      }
      setLoading(false);
    });
  }, []);

  const login  = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return { user, loading, familyId, login, logout };
}

async function findOrCreateFamily(user) {
  const userRef = doc(db, "users", user.uid);
  const snap    = await getDoc(userRef);

  if (snap.exists() && snap.data().familyId) {
    return snap.data().familyId;
  }

  const familyRef = doc(collection(db, "families"));
  await setDoc(familyRef, {
    createdBy:   user.uid,
    createdAt:   serverTimestamp(),
    caretakers:  [{ uid: user.uid, name: user.displayName, email: user.email }],
    childName:   "",
    childGender: "",
    childAvatar: "🧒",
    childAge:    "",
    childWeight: "",
  });

  await setDoc(userRef, { familyId: familyRef.id, email: user.email }, { merge: true });
  return familyRef.id;
}

export async function joinFamily(familyId, user) {
  const familyRef = doc(db, "families", familyId);
  await updateDoc(familyRef, {
    caretakers: arrayUnion({ uid: user.uid, name: user.displayName, email: user.email }),
  });
  await setDoc(doc(db, "users", user.uid), { familyId }, { merge: true });
}

export function useChildProfile(familyId) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!familyId) return;
    const unsub = onSnapshot(doc(db, "families", familyId), snap => {
      if (snap.exists()) setProfile({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [familyId]);

  const updateProfile = (data) =>
    updateDoc(doc(db, "families", familyId), data);

  return { profile, updateProfile };
}

export function useMedications(familyId) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!familyId) return;
    const q = query(
      collection(db, "families", familyId, "medications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setMedications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [familyId]);

  const addMedication = async (med) => {
    await addDoc(collection(db, "families", familyId, "medications"), {
      ...med,
      createdAt:   serverTimestamp(),
      lastGivenAt: null,
      lastGivenBy: null,
      history:     [],
    });
  };

  const markDoseGiven = async (medId, user, note = "") => {
    const medRef  = doc(db, "families", familyId, "medications", medId);
    const medSnap = await getDoc(medRef);
    const med     = medSnap.data();

    if (med.lastGivenAt) {
      const elapsedMs  = Date.now() - med.lastGivenAt.toMillis();
      const intervalMs = med.intervalHours * 60 * 60 * 1000;
      if (elapsedMs < intervalMs * 0.5) {
        throw new Error(`TOO_SOON:${Math.round((intervalMs - elapsedMs) / 60000)}`);
      }
    }

    const entry = {
      time: new Date().toLocaleTimeString("he-IL", { hour:"2-digit", minute:"2-digit" }),
      who: user.displayName,
      note
    };
    await updateDoc(medRef, {
      lastGivenAt:     serverTimestamp(),
      lastGivenBy:     user.uid,
      lastGivenByName: user.displayName,
      history:         arrayUnion(entry),
    });
  };

  const updateMedication = (medId, data) =>
    updateDoc(doc(db, "families", familyId, "medications", medId), data);

  const deactivateMedication = (medId) =>
    updateDoc(doc(db, "families", familyId, "medications", medId), { active: false });

  return { medications, loading, addMedication, markDoseGiven, updateMedication, deactivateMedication };
}

export function useTemperature(familyId) {
  const [lastTemp, setLastTemp] = useState(null);

  useEffect(() => {
    if (!familyId) return;
    const q = query(
      collection(db, "families", familyId, "tempReadings"),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setLastTemp({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
    return unsub;
  }, [familyId]);

  const addReading = async (value, method, who, note) => {
    await addDoc(collection(db, "families", familyId, "tempReadings"), {
      value, method, who, note,
      createdAt: serverTimestamp(),
    });
  };

  return { lastTemp, addReading };
}