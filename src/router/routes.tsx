import { lazy } from 'react';
const Index = lazy(() => import('../pages/Index'));
const Expense = lazy(() => import('../pages/expense'));
const KhataHistory = lazy(() => import('../pages/khataHistory'));
const KhataSale = lazy(() => import('../pages/khataSale'));
const InvoiceHistory = lazy(() => import('../pages/invoiceHistory'));
const User = lazy(() => import('../pages/user'));
const InvoiceForm = lazy(() => import('../pages/InvoiceForm'));
const Purchase = lazy(() => import('../pages/Purchase'));
const ERROR404 = lazy(() => import('../pages/Error404'));
const Stock = lazy(() => import('../pages/Stock'));
const LoginBoxed = lazy(() => import('../pages/LoginBoxed'));
const SoftwareSetting = lazy(() => import('../pages/SoftwareSetting'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/purchase',
        element: <Purchase />,
    },
    {
        path: '/invoice',
        element: <InvoiceForm />,
    },
    // Data Tables
    {
        path: '/stock',
        element: <Stock />,
    },
   
    {
        path: '/user',
        element: <User />,
    },
    {
        path: '/khata-sale',
        element: <KhataSale />,
    },
    {
        path: '/khata-history',
        element: <KhataHistory />,
    },
    {
        path: '/setting',
        element: <SoftwareSetting />,
    },
    {
        path: '/invoiceHistory',
        element: <InvoiceHistory />,
    },

    {
        path: '/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/expense',
        element: <Expense />,
    },
    {
        path: '*',
        element: <ERROR404 />,
        layout: 'blank',
    },
];

export { routes };
