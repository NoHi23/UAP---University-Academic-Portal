import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import theme from './theme';

import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';

import ProtectedRoute from './components/Routing/ProtectedRoute';
import BackToTopButton from './components/Common/BackToTopButton';
import { GoogleOAuthProvider } from '@react-oauth/google';

import StudentDashboard from './pages/Student/StudentDashboard';
import MaterialsPage from './components/Student/MaterialsPage';
import Timetable from './components/Student/Timetable';
import StudentLayout from './pages/Student';
import NavbarLecturer from './components/NavBar/NavbarLecturer';
import LecturerLayout from './pages/Lecturer';
import LecturerDashboard from './pages/Lecturer/LecturerDashBoard/LecturerDashboard';
import ScheduleLecturePages from './pages/Lecturer/ScheduleLecturePages';

function App() {

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-wrapper">
        <BrowserRouter>
          <GoogleOAuthProvider clientId={googleClientId}>

            <AuthProvider>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
              <Routes>
                <Route path='/' element={<LoginPage />} />

                <Route path='/register' element={<RegisterPage />} />

                <Route element={<ProtectedRoute />}>
                  <Route path="/student/" element={<StudentLayout />}>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="materials" element={<MaterialsPage />} />
                    <Route path="timetable" element={<Timetable />} />
                  </Route>
                </Route>
                <Route path="/lecturer/" element={<LecturerLayout />}>
                  <Route path="dashboard" element={<LecturerDashboard />} />
                  <Route path='view-teaching-schedule' element={<ScheduleLecturePages />} />
                </Route>
                {/* <Route element={<ProtectedRoute allowedRoles={['admin', 'moderator']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route path="figures/edit/:id" element={<AdminFigureForm />} />

                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="coupons/new" element={<AdminCouponForm />} />
                  </Route>
                </Route>
              </Route> */}

              </Routes>
              <BackToTopButton />
            </AuthProvider>
          </GoogleOAuthProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;