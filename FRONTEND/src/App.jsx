import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';


import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';


import ProtectedRoute from './components/Routing/ProtectedRoute';
import BackToTopButton from './components/Common/BackToTopButton';
import { GoogleOAuthProvider } from '@react-oauth/google';

import StudentDashboard from './components/Student/Dashboard';
import MaterialsPage from './components/Student/MaterialsPage';


function App() {

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

  return (
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
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/materials" element={<MaterialsPage />} />

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
  );
}

export default App;