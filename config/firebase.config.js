const Firebase = require('firebase-admin');

// Parse the Firebase credentials from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

const firebase = Firebase.initializeApp({
  credential: Firebase.credential.cert(serviceAccount),
  storageBucket: 'drive-f3841.appspot.com'  // fixed your storage bucket URL too
});

module.exports = Firebase;
