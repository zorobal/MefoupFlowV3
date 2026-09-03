import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ConvexProvider } from 'convex/react';
import { getConvexReactClient } from './lib/convex';

const convexClient = getConvexReactClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <App />
      </ConvexProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);

