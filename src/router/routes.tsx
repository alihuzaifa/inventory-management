import { lazy } from 'react';
import Export from '../pages/DataTables/Export';
const Index = lazy(() => import('../pages/Index'));
const List = lazy(() => import('../pages/Apps/Invoice/List'));
const Preview = lazy(() => import('../pages/Apps/Invoice/Preview'));
const Add = lazy(() => import('../pages/Apps/Invoice/Add'));
const Edit = lazy(() => import('../pages/Apps/Invoice/Edit'));
const ERROR404 = lazy(() => import('../pages/Pages/Error404'));
const LoginBoxed = lazy(() => import('../pages/Authentication/LoginBoxed'));
const Error = lazy(() => import('../components/Error'));
const Validation = lazy(() => import('../pages/Forms/Validation'));

const routes = [
    // dashboard
    {
        path: '/',
        element: <Index />,
    },
    {
        path: '/apps/invoice/list',
        element: <List />,
    },
    // preview page
    {
        path: '/apps/invoice/preview',
        element: <Preview />,
    },
    {
        path: '/apps/invoice/add',
        element: <Add />,
    },
    {
        path: '/apps/invoice/edit',
        element: <Edit />,
    },
    // Data Tables
    {
        path: '/datatables/export',
        element: <Export />,
    },
    //Authentication
    {
        path: '/login',
        element: <LoginBoxed />,
        layout: 'blank',
    },
    {
        path: '/forms/validation',
        element: <Validation />,
    },
    {
        path: '*',
        element: <ERROR404 />,
        layout: 'blank',
    },
];

export { routes };
