import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { CoupleSpaceProvider } from './contexts/CoupleSpaceContext';
import { CallProvider } from './contexts/CallContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CoupleSpaceProvider>
        <CallProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </CallProvider>
      </CoupleSpaceProvider>
    </AuthProvider>
  </StrictMode>,
);
