import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Lobby from './routes/Lobby';
import Game from './routes/Game';
import Fairness from './routes/Fairness';
import Practice from './routes/Practice';
import Settlement from './routes/Settlement';
import ThemeProvider from './components/ThemeProvider';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Lobby /> },
      { path: '/game/:matchId?', element: <Game /> },
      { path: '/fairness', element: <Fairness /> },
      { path: '/practice', element: <Practice /> },
      { path: '/settlement/:matchId?', element: <Settlement /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
