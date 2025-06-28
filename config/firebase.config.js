const Firebase = require('firebase-admin');

const serviceAccount = require('../drive-f3841-firebase-adminsdk-fbsvc-99f528393b.json');

const firebase=Firebase.initializeApp({
    credential: Firebase.credential.cert(serviceAccount),
    storageBucket: 'drive-f3841.firebasestorage.app'
})



module.exports=Firebase;