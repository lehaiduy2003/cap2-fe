import { Route } from 'react-router-dom';

import Login from '../pages/Login';

export const ROUTERS = {
    USER: {
        HOME: '/',
    },
};

// Export danh sách các Route hợp lệ
export const AppRoutes = [
    <Route key='home' path={ROUTERS.USER.HOME} element={<Login />} />,
];
