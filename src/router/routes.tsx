import { lazy } from 'react';
import Export from '../pages/DataTables/Export';
import Suppler from '../components/Suppler';
const Index = lazy(() => import('../pages/Index'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));

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
        element: <Suppler />,
    },
    {
        path: '/sale',
        element: <Suppler />,
    },
    // Data Tables
    {
        path: '/stock',
        element: <Export />,
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
