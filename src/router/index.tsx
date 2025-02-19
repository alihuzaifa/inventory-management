import { createBrowserRouter } from 'react-router-dom';
import BlankLayout from '../components/Layouts/BlankLayout';
import { routes } from './routes';

const finalRoutes = routes.map((route) => {
    return {
        ...route,
        element: route.layout === 'blank' && <BlankLayout>{route.element}</BlankLayout>,
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
