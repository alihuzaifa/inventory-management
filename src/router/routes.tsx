import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Invoice = lazy(() => import('../pages/Invoice'));
const KhataUser = lazy(() => import('../pages/KhataUser'));
const Sale = lazy(() => import('../pages/Sale'));
const Purchase = lazy(() => import('../pages/Purchase'));
const ERROR404 = lazy(() => import('../pages/Error404'));
const Stock = lazy(() => import('../pages/Stock'));
const LoginBoxed = lazy(() => import('../pages/LoginBoxed'));
const Supplier = lazy(() => import('../pages/Supplier'));
const SoftwareSetting = lazy(() => import('../pages/SoftwareSetting'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/supplier',
        element: <Supplier />,
    },
    {
        path: '/purchase',
        element: <Purchase />,
    },
    {
        path: '/sale',
        element: <Sale />,
    },
    // Data Tables
    {
        path: '/stock',
        element: <Stock />,
    },
    {
        path: '/invoice',
        element: <Invoice />,
    },
    {
        path: '/khataUser',
        element: <KhataUser />,
    },
    {
        path: '/setting',
        element: <SoftwareSetting />,
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
