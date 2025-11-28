import { Navigate } from 'react-router-dom';
import SignUpLogin from '../pages/Signup-Login';
import CustomerDashboard from '@/pages/CustomerDashboard.tsx';
import Dashboard from '@/pages/Dashboard.tsx';

const getAuthStatus = () => {
    const rawData = localStorage.getItem("user_data");

    if (!rawData) {
        return { isLoggedIn: false, role: null };
    }
    
    try {
        const data = JSON.parse(rawData);
        const role: "agent" | "customer" |null = data.userData ? data.userData.role : null; 

        return {
            isLoggedIn: data.isLoggedIn === true,
            role: role 
        };
    } catch (e) {
        console.error("Failed to parse user_data from localStorage:", e);
        return { isLoggedIn: false, role: null };
    }
};

export function AuthPageHandler() {
    const { isLoggedIn } = getAuthStatus(); 

    if (isLoggedIn) {
        return <Navigate to={'/dashboard'} replace />;
    }
    
    console.log("AuthPageHandler: User not logged in, showing SignUpLogin page.");
    return <SignUpLogin />;
}

export function ProtectedRoute({ element }: { element: React.ReactNode }) {
    const { isLoggedIn } = getAuthStatus();

    if (isLoggedIn) {
        return element;
    }
    
    return <Navigate to={'/auth'} replace />;
}


export function DashboardPageHandler() {
    const data = getAuthStatus(); 
    
    const isLoggedIn: boolean = data.isLoggedIn;
    const role: "agent" | "customer" | null= data.role;


    if (!isLoggedIn) {
        return <Navigate to={'/auth'} replace />;
    }

    if (role === 'customer') {
        return <CustomerDashboard />;
    }
    
    if (role === 'agent') {
        return <Dashboard />;
    }

    console.warn(`DashboardPageHandler: User is logged in but has an invalid role ('${role}'). Redirecting to /auth.`);
    return <Navigate to={'/auth'} replace />;
}