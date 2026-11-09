// Loads Firebase once, from this site's own /vendor folder (no third-party CDN),
// and hands out the same app, auth and database objects to whoever asks.

import { firebaseConfig } from "./config.js";

let ready = null;

export function firebase() {
  if (!ready) ready = (async () => {
    const [appM, authM, fs] = await Promise.all([
      import("../vendor/firebase/firebase-app.js"),
      import("../vendor/firebase/firebase-auth.js"),
      import("../vendor/firebase/firebase-firestore.js")
    ]);
    const app = appM.initializeApp(firebaseConfig);
    const auth = authM.getAuth(app);
    auth.languageCode = "it";
    let db;
    try {
      // Keeps a copy on the device so the app opens offline and syncs later.
      db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
    } catch (e) {
      db = fs.getFirestore(app);
    }
    return { app, auth, db, authM, fs };
  })();
  return ready;
}
