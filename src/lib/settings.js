import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase.js'

const DOC_PATH = ['meta', 'company']

export function subscribeCompanyProfile(onChange, onError) {
  return onSnapshot(doc(db, ...DOC_PATH), (snap) => onChange(snap.data() || null), onError)
}

export async function saveCompanyProfile(profile) {
  await setDoc(doc(db, ...DOC_PATH), profile)
}
