importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCRhjUGAAwWDrxA3AAv5EJuehulBk5hn9E",
  authDomain: "seificontas.firebaseapp.com",
  projectId: "seificontas",
  storageBucket: "seificontas.firebasestorage.app",
  messagingSenderId: "454487656313",
  appId: "1:454487656313:web:bbc2fe6d220068bdc7d1a8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logoseifi192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
