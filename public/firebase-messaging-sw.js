importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDkVDK_JZc8erLM--XyJ727GijQ6QXpsPE",
  authDomain: "seaktrack.firebaseapp.com",
  projectId: "seaktrack",
  storageBucket: "seaktrack.firebasestorage.app",
  messagingSenderId: "316581965185",
  appId: "1:316581965185:web:2210c64a8feff1e0550c80",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  const { title, body } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: '/logo192.png',
    dir: 'rtl',
    lang: 'he',
    vibrate: [200, 100, 200],
  });
});