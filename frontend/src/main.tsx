import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AuthPageHandler, ProtectedRoute, DashboardPageHandler } from './components/auth-components.tsx';


const router = createBrowserRouter([
    {
        path: '/auth',
        element: <AuthPageHandler /> 
    },
    {
        path: '/',
        element: <Navigate to={'/auth'} replace/> // Redirects root to /auth
    },
    { 
        path: '/chat',
        element: <ProtectedRoute element={<App />} /> // Protected route
    },
    { 
        path: '/dashboard',
        element: <ProtectedRoute element={<DashboardPageHandler />} /> // Protected route
    },
]);

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>,
);