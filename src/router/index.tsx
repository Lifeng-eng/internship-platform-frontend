import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import JobDetailPage from '../pages/JobDetailPage';
import StudentApplicationsPage from '../pages/student/ApplicationsPage';
import StudentProfilePage from '../pages/student/ProfilePage';
import CompanyJobsPage from '../pages/company/JobsPage';
import CompanyApplicationsPage from '../pages/company/ApplicationsPage';
import CompanyStatsPage from '../pages/company/StatsPage';
import CompanyProfilePage from '../pages/company/ProfilePage';
import AdminReviewPage from '../pages/admin/ReviewPage';
import AdminUsersPage from '../pages/admin/UsersPage';
import AdminStatsPage from '../pages/admin/StatsPage';
import AdminProfilePage from '../pages/admin/ProfilePage';
import NotificationsPage from '../pages/NotificationsPage';
import ChatPage from '../pages/ChatPage';

// 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register/student', element: <RegisterPage role="student" /> },
      { path: 'register/company', element: <RegisterPage role="company" /> },
      { path: 'jobs/:id', element: <JobDetailPage /> },
      { path: 'student/applications', element: <StudentApplicationsPage /> },
      { path: 'student/profile', element: <StudentProfilePage /> },
      { path: 'company/jobs', element: <CompanyJobsPage /> },
      { path: 'company/jobs/new', element: <CompanyJobsPage /> },
      { path: 'company/jobs/:id/edit', element: <CompanyJobsPage /> },
      { path: 'company/applications', element: <CompanyApplicationsPage /> },
      { path: 'company/stats', element: <CompanyStatsPage /> },
      { path: 'company/profile', element: <CompanyProfilePage /> },
      { path: 'admin/jobs', element: <AdminReviewPage /> },
      { path: 'admin/users', element: <AdminUsersPage /> },
      { path: 'admin/stats', element: <AdminStatsPage /> },
      { path: 'admin/profile', element: <AdminProfilePage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'chat', element: <ChatPage /> },
    ],
  },
]);

export default router;
