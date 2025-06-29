require('dotenv').config();
const Firebase = require('firebase-admin');

if (!process.env.FIREBASE_CONFIG) {
  throw new Error('FIREBASE_CONFIG environment variable is missing');
}

// Parse and fix the private key newlines
const serviceAccountRaw = JSON.parse(process.env.FIREBASE_CONFIG);

// Convert \n to actual newlines
serviceAccountRaw.private_key = serviceAccountRaw.private_key.replace(/\\n/g, '\n');

const firebase = Firebase.initializeApp({
  credential: Firebase.credential.cert(serviceAccountRaw),
  storageBucket: 'drive-f3841.firebasestorage.app', // fix .app to .com if needed
});  

module.exports = Firebase;
