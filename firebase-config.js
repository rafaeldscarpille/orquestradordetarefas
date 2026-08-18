// Configuração do Firebase — gerada no console do projeto
(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: "AIzaSyAZqo9WucR0sRWbO_nVfcWgRSK_NcgbWPk",
    authDomain: "orquestradordetarefas.firebaseapp.com",
    projectId: "orquestradordetarefas",
    storageBucket: "orquestradordetarefas.firebasestorage.app",
    messagingSenderId: "944705032833",
    appId: "1:944705032833:web:379ea8ecb1f4473da1b380",
    measurementId: "G-ZD2EGYRYNS"
  };

  try {
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    // Cache offline: permite usar sem internet e sincronizar depois
    db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
      console.warn('Persistência offline indisponível:', err && err.code);
    });
    window.FIREBASE_DB = db;
  } catch (e) {
    console.warn('Firebase não pôde ser inicializado — usando apenas armazenamento local.', e);
    window.FIREBASE_DB = null;
  }
})();
