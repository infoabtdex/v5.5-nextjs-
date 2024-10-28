import { initializeApp, getApp, type FirebaseApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata,
  type StorageReference,
  type FirebaseStorage 
} from 'firebase/storage';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  type User,
  type Auth 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  enableIndexedDbPersistence,
  collection, 
  addDoc, 
  query, 
  getDocs, 
  deleteDoc, 
  serverTimestamp,
  where,
  type Firestore,
  type DocumentData,
  type QueryDocumentSnapshot
} from 'firebase/firestore';

// Define Media type at the top of the file
interface Media {
  id: string;
  userId: string;
  src: string;
  type: 'photo' | 'video';
  date: Date;
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only once
let app: FirebaseApp;
let storage: FirebaseStorage;
let auth: Auth;
let db: Firestore;

try {
  app = getApp();
} catch {
  app = initializeApp(firebaseConfig);
}

storage = getStorage(app);
auth = getAuth(app);
db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db, {
  forceOwnership: true
}).catch((err: { code: string }) => {
  if (err.code === 'failed-precondition') {
    console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.log("The current browser doesn't support all of the features required to enable persistence");
  }
});

// Remove enableNetwork as it's not needed
// db.enableNetwork().catch(console.error);

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

export const uploadPhoto = async (dataUrl: string, fileName: string): Promise<string> => {
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error("Failed to process photo data");
    }
    const blob = await response.blob();
    
    // Upload to storage
    const storageRef = ref(storage, `photos/${userId}/${fileName}`);
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadUrl = await getDownloadURL(storageRef);
    
    // Save to Firestore
    const mediaRef = collection(db, "media");
    await addDoc(mediaRef, {
      userId,
      id: fileName,
      src: downloadUrl,
      type: "photo",
      date: serverTimestamp(),
    });

    return downloadUrl;
  } catch (error) {
    console.error("Error in uploadPhoto:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    throw error; // Re-throw to handle in the component
  }
};

export const getPhotoUrl = async (fileName: string): Promise<string> => {
  const storageRef = ref(storage, `photos/${fileName}`);
  return await getDownloadURL(storageRef);
};

export const deletePhoto = async (photoId: string) => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const mediaRef = doc(db, "media", photoId);
  const mediaDoc = await getDoc(mediaRef);
  
  if (!mediaDoc.exists()) {
    throw new Error("Photo not found");
  }
  
  const mediaData = mediaDoc.data();
  if (mediaData.userId !== userId) {
    throw new Error("Unauthorized to delete this photo");
  }

  // Delete from storage
  const storageRef = ref(storage, `photos/${userId}/${mediaData.id}`);
  await deleteObject(storageRef);
  
  // Delete from Firestore
  await deleteDoc(mediaRef);
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
  return photos.sort((a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime());
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

export const uploadVideo = async (blob: Blob, fileName: string) => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const storageRef = ref(storage, `videos/${userId}/${fileName}`);
  await uploadBytes(storageRef, blob);
  const downloadUrl = await getDownloadURL(storageRef);

  const mediaRef = collection(db, "media");
  await addDoc(mediaRef, {
    userId,
    id: fileName,
    src: downloadUrl,
    type: "video",
    date: serverTimestamp(),
  });

  return downloadUrl;
};

export const deleteVideo = async (videoId: string) => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const mediaRef = doc(db, "media", videoId);
  const mediaDoc = await getDoc(mediaRef);
  
  if (!mediaDoc.exists()) {
    throw new Error("Video not found");
  }
  
  const mediaData = mediaDoc.data();
  if (mediaData.userId !== userId) {
    throw new Error("Unauthorized to delete this video");
  }

  // Delete from storage
  const storageRef = ref(storage, `videos/${userId}/${mediaData.id}`);
  await deleteObject(storageRef);
  
  // Delete from Firestore
  await deleteDoc(mediaRef);
};

export const getAllMedia = async (): Promise<Media[]> => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const mediaRef = collection(db, "media");
    const q = query(
      mediaRef,
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(q);
    const media = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      ...doc.data(),
      id: doc.id,
      date: doc.data().date?.toDate() || new Date(),
    })) as Media[];

    return media.sort((a, b) => b.date.getTime() - a.date.getTime());

  } catch (error: any) {
    console.error('Error in getAllMedia:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

export const getMediaUrl = async (storagePath: string): Promise<string> => {
  try {
    const storageRef = ref(storage, storagePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error("Error getting media URL:", error);
    throw error;
  }
};

// Export the Media type at the end
export type { Media };
// Add db to the exports at the bottom of the file
export { auth, db };
