import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL, deleteObject, listAll, StorageReference, getMetadata } from 'firebase/storage';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, enableIndexedDbPersistence } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.log("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
    } else if (err.code == 'unimplemented') {
        console.log("The current browser does not support all of the features required to enable persistence");
    }
});

export const signUp = async (email: string, password: string, username: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    return userCredential.user;  // Return the User object instead of UserCredential
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<void> => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const signOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthStateChange = (callback: (user: User | null) => void): () => void => {
  return onAuthStateChanged(auth, callback);
};

export const uploadPhoto = async (photoDataUrl: string, fileName: string): Promise<string> => {
  const storageRef = ref(storage, `photos/${fileName}`);
  await uploadString(storageRef, photoDataUrl, 'data_url');
  return await getDownloadURL(storageRef);
};

export const getPhotoUrl = async (fileName: string): Promise<string> => {
  const storageRef = ref(storage, `photos/${fileName}`);
  return await getDownloadURL(storageRef);
};

export const deletePhoto = async (fileName: string): Promise<void> => {
  const storageRef = ref(storage, `photos/${fileName}`);
  await deleteObject(storageRef);
};

export const getAllPhotos = async (): Promise<{ id: string; src: string; date: Date }[]> => {
  const storageRef = ref(storage, 'photos');
  const result = await listAll(storageRef);
  const photos = await Promise.all(result.items.map(async (itemRef: StorageReference) => {
    const url = await getDownloadURL(itemRef);
    const metadata = await getMetadata(itemRef);
    return {
      id: itemRef.name,
      src: url,
      date: new Date(metadata.timeCreated)
    };
  }));
  return photos.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const logout = async () => {
  const auth = getAuth()
  await firebaseSignOut(auth)
}

export const getUserProfile = async (): Promise<{ username: string; email: string } | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  console.log('Current user:', user);
  if (!user) return null;

  try {
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    console.log('User document exists:', userDoc.exists());
    if (!userDoc.exists()) {
      console.log('Creating default profile for user');
      const defaultProfile = { username: user.displayName || 'New User', email: user.email || '' };
      await setDoc(doc(db, 'users', user.uid), defaultProfile);
      return defaultProfile;
    }

    const userData = userDoc.data();
    console.log('User data:', userData);
    return userData as { username: string; email: string };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Return null if there's an error (including offline scenarios)
    return null;
  }
};

export const updateUserProfile = async (profile: { username: string; email: string }): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const db = getFirestore();
  await updateDoc(doc(db, 'users', user.uid), profile);
};

export const uploadVideo = async (videoBlob: Blob, fileName: string): Promise<string> => {
  const storageRef = ref(storage, `videos/${fileName}`);
  await uploadBytes(storageRef, videoBlob);
  return await getDownloadURL(storageRef);
};

export const deleteVideo = async (fileName: string): Promise<void> => {
  const storageRef = ref(storage, `videos/${fileName}`);
  await deleteObject(storageRef);
};

export const getAllMedia = async (): Promise<{ id: string; src: string; type: 'photo' | 'video'; date: Date }[]> => {
  const photoStorageRef = ref(storage, 'photos');
  const videoStorageRef = ref(storage, 'videos');
  const [photoResult, videoResult] = await Promise.all([listAll(photoStorageRef), listAll(videoStorageRef)]);
  
  const photoPromises = photoResult.items.map(async (itemRef: StorageReference) => {
    const url = await getDownloadURL(itemRef);
    const metadata = await getMetadata(itemRef);
    return {
      id: itemRef.name,
      src: url,
      type: 'photo' as const,
      date: new Date(metadata.timeCreated)
    };
  });

  const videoPromises = videoResult.items.map(async (itemRef: StorageReference) => {
    const url = await getDownloadURL(itemRef);
    const metadata = await getMetadata(itemRef);
    return {
      id: itemRef.name,
      src: url,
      type: 'video' as const,
      date: new Date(metadata.timeCreated)
    };
  });

  const allMedia = await Promise.all([...photoPromises, ...videoPromises]);
  return allMedia.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const getMediaUrl = async (fileName: string): Promise<string> => {
  const isPhoto = fileName.startsWith('photo_');
  const folder = isPhoto ? 'photos' : 'videos';
  const storageRef = ref(storage, `${folder}/${fileName}`);
  return await getDownloadURL(storageRef);
};
