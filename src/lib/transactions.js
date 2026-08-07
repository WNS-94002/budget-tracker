import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { compressImageToDataUrl } from './imageCompress.js'

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

export async function addTransaction({
  type,
  amount,
  category,
  note,
  date,
  imageFile,
}) {
  let image = null
  if (imageFile) {
    image = await compressImageToDataUrl(imageFile)
  }

  await addDoc(collection(db, COLLECTION), {
    type,
    amount: Number(amount),
    category: category || 'ไม่ระบุหมวดหมู่',
    note: note || '',
    date,
    image,
    createdAt: serverTimestamp(),
  })
}

export async function updateTransaction(id, changes) {
  await updateDoc(doc(db, COLLECTION, id), changes)
}

export async function deleteTransaction(item) {
  await deleteDoc(doc(db, COLLECTION, item.id))
}
