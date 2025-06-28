const multer = require('multer');
const firebaseStorage = require('multer-firebase-storage');
const firebase = require('./firebase.config');
const serviceAccount= require('../drive-f3841-firebase-adminsdk-fbsvc-99f528393b.json')


const storage = firebaseStorage({
    credentials:firebase.credential.cert(serviceAccount),
    bucketName:'drive-f3841.firebasestorage.app',
    unique:true
})


const upload =multer({
    storage: storage, 
})


module.exports=upload;