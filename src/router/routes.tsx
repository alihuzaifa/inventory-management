import { lazy } from 'react';

const ERROR404 = lazy(() => import('../pages/Error404'));
const LoginBoxed = lazy(() => import('../pages/LoginBoxed'));


const routes = [
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
