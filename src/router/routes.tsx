import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Purchase = lazy(() => import('../pages/Purchase'));
const ERROR404 = lazy(() => import('../pages/Error404'));
const Stock = lazy(() => import('../pages/Stock'));
const LoginBoxed = lazy(() => import('../pages/LoginBoxed'));
const Suppler = lazy(() => import('../pages/Suppler'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/supplier',
        element: <Suppler />,
    },
    {
        path: '/purchase',
        element: <Purchase />,
    },
    {
        path: '/sale',
        element: <Suppler />,
    },
    // Data Tables
    {
        path: '/stock',
        element: <Stock />,
    },

    {
        path: '/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '*',
        element: <ERROR404 />,
        layout: 'blank',
    },
];

export { routes };
