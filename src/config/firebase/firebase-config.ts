import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccountPath = path.join('src', 'config', 'firebase', 'serviceAccountKey.json');

const firebaseConfig = {
    credential: admin.credential.cert(serviceAccountPath),
};

admin.initializeApp(firebaseConfig);

export default admin;
