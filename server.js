const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Puxa a chave secreta de forma invisível no Render
const serviceAccount = JSON.parse(process.env.FIREBASE_JSON);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// A rota que receberá o aviso do seu HTML
app.post('/notificar', async (req, res) => {
  const { remetenteUid, destinatarioUid, texto } = req.body;

  try {
    const destinatarioRef = await admin.firestore().collection('mesh_users').doc(destinatarioUid).get();
    const remetenteRef = await admin.firestore().collection('mesh_users').doc(remetenteUid).get();

    if (!destinatarioRef.exists || !remetenteRef.exists) {
        return res.status(404).send('Usuários não encontrados');
    }

    const fcmToken = destinatarioRef.data().fcmToken;
    const nomeRemetente = remetenteRef.data().name;

    if (!fcmToken) return res.status(400).send('Destinatário sem token');

    const payload = {
        notification: {
            title: nomeRemetente,
            body: texto
        },
        token: fcmToken
    };

    await admin.messaging().send(payload);
    res.status(200).send('Notificação disparada!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro no servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor ativo na porta ' + PORT);
});
