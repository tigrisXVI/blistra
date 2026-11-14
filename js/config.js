// Project-wide settings.
//
// The Firebase values below are public by design: every web app that uses
// Firebase ships them to the browser. What protects the data is not secrecy
// of these values but the security rules in firestore.rules, which Google
// enforces on its own servers for every single read and write.

export const VERSION = "3.3.1";

/** Public contact shown on the project page. */
export const CONTACT = "tigrisedicesimo@gmail.com";

/** The administrator is shown with this name, never with an email. */
export const ADMIN_NAME = "Vasco";

export const firebaseConfig = {
  apiKey: "AIzaSyD0EfM1Mgn3MC7_N0iqWaBkS0Mc8F3I4Vk",
  authDomain: "blistra-64e03.firebaseapp.com",
  projectId: "blistra-64e03",
  storageBucket: "blistra-64e03.firebasestorage.app",
  messagingSenderId: "335211743540",
  appId: "1:335211743540:web:14aa397b0ae679d0dafd61"
};

/** Days of dose history kept in view (older days stay in the database). */
export const HISTORY_DAYS = 8;

/** Size limits, mirrored in firestore.rules. */
export const LIMITS = {
  medPhotoChars: 280000,   // a compressed photo of a pill or box
  siteImageChars: 600000,  // one image uploaded from Studio
  siteImages: 12
};
