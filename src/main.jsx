import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { validateEnvironment } from '@/lib/environment'

const root = ReactDOM.createRoot(document.getElementById('root'));
const environment = validateEnvironment();

root.render(environment.valid ? <App /> : (
  <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '10vh auto', padding: 24 }}>
    <h1>Pathfinder configuration required</h1>
    <p>Set the following environment values, then restart the development server:</p>
    <ul>
      {environment.errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
    <p>For local Base44 development, use <code>base44 dev</code> so the platform injects these values.</p>
  </main>
));
