import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject, listAll, StorageReference } from 'firebase/storage';

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

export const getAllPhotos = async (): Promise<string[]> => {
  const storageRef = ref(storage, 'photos');
  const result = await listAll(storageRef);
  const urls = await Promise.all(result.items.map((itemRef: StorageReference) => getDownloadURL(itemRef)));
  return urls;
};
