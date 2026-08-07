import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import { db, storage } from '../firebase.js'

const COLLECTION = 'transactions'

// Single shared collection (no per-user scoping) — this app has no login
// screen by design, so every visitor with the link shares the same data.
export function subscribeTransactions(onChange, onError) {
  const colRef = collection(db, COLLECTION)
  return onSnapshot(
    colRef,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1
        const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return bTs - aTs
      })
      onChange(items)
    },
    onError,
  )
}

async function uploadReceiptImage(file) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `receipts/${Date.now()}-${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  const url = await getDownloadURL(storageRef)
  return { url, path }
}

export async function addTransaction({
  type,
  amount,
  category,
  note,
  date,
  imageFile,
}) {
  let imageUrl = null
  let imagePath = null

  if (imageFile) {
    const uploaded = await uploadReceiptImage(imageFile)
    imageUrl = uploaded.url
    imagePath = uploaded.path
  }

  await addDoc(collection(db, COLLECTION), {
    type,
    amount: Number(amount),
    category: category || 'ไม่ระบุหมวดหมู่',
    note: note || '',
    date,
    imageUrl,
    imagePath,
    createdAt: serverTimestamp(),
  })
}

export async function updateTransaction(id, changes) {
  await updateDoc(doc(db, COLLECTION, id), changes)
}

export async function deleteTransaction(item) {
  if (item.imagePath) {
    try {
      await deleteObject(ref(storage, item.imagePath))
    } catch (err) {
      // Image may already be gone; don't block deleting the record.
      console.warn('ลบรูปภาพไม่สำเร็จ', err)
    }
  }
  await deleteDoc(doc(db, COLLECTION, item.id))
}
