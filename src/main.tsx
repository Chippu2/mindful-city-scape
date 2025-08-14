import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerNotificationServiceWorker } from '@/components/notifications/NotificationManager'

// Register service worker for notifications and offline support
registerNotificationServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
