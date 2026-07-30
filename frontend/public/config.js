// Runtime configuration - this file gets replaced at container startup
// Assigned to `self` so the service worker can importScripts() it too;
// in a page self === window, so window.APP_CONFIG still works.
self.APP_CONFIG = {
  // API URLs
  API_URL: "http://localhost:8000/api/v1",
  WS_URL: "ws://localhost:8000",
  WIDGET_URL: "http://localhost:8000",
  
  // Firebase Configuration
  FIREBASE_API_KEY: "",
  FIREBASE_AUTH_DOMAIN: "",
  FIREBASE_PROJECT_ID: "",
  FIREBASE_MESSAGING_SENDER_ID: "680125690355",
  FIREBASE_APP_ID: "",
  FIREBASE_STORAGE_BUCKET: "",
  FIREBASE_MEASUREMENT_ID: "",
  FIREBASE_VAPID_KEY: "",
  
  // Razorpay Checkout
  RAZORPAY_KEY_ID: "rzp_test_T92OR9gqPBht0N",
  GTM_ID: "",

  // Google Fonts API
  GOOGLE_FONTS_API_KEY: "",
  
  // Node Environment
  NODE_ENV: "development",
  HOST: "0.0.0.0"
}; 