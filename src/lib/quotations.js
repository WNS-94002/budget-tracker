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

const COLLECTION = 'quotations'

export function subscribeQuotations(onChange, onError) {
  return onSnapshot(
    collection(db, COLLECTION),
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => {
        const aTs = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0
        const bTs = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0
        return bTs - aTs
      })
      onChange(items)
    },
    onError,
  )
}

export async function addQuotation(data) {
  await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateQuotation(id, changes) {
  await updateDoc(doc(db, COLLECTION, id), changes)
}

export async function deleteQuotation(id) {
  await deleteDoc(doc(db, COLLECTION, id))
}
