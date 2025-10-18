import { jsx as _jsx } from "react/jsx-runtime";
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
var router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(App, {}),
        children: [
            { path: '/', element: _jsx(Lobby, {}) },
            { path: '/game/:matchId?', element: _jsx(Game, {}) },
            { path: '/fairness', element: _jsx(Fairness, {}) },
            { path: '/practice', element: _jsx(Practice, {}) },
            { path: '/settlement/:matchId?', element: _jsx(Settlement, {}) }
        ]
    }
]);
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(ThemeProvider, { children: _jsx(RouterProvider, { router: router }) }) }));
