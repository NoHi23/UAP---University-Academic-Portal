
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
import StudentDashboard from './pages/Student/Dashboard';
import MaterialsPage from './pages/Student/MaterialsPage';
import Timetable from './pages/Student/Timetable';
import ExamSchedule from './pages/Student/ExamSchedule';
import CurriculumsPage from './pages/Student/CurriculumsPage';
import CurriculumDetailsPage from './pages/Student/CurriculumDetailsPage';
import StudentAnnouncements from './pages/Student/StudentAnnouncements';
import StudentAnnouncementDetail from './pages/Student/StudentAnnouncementDetail';

import StudentLayout from './pages/Student';
import LecturerLayout from './pages/Lecturer/LectureLayout';
import LecturerDashboard from './pages/Lecturer/LecturerDashBoard/index';
import LecturerProfile from './pages/Lecturer/LecturerProfile';
import ScheduleLecturePages from './pages/Lecturer/ScheduleLecturePages';
import DetailSlotPage from './pages/Lecturer/DetailSlotPage/index';
import Feedback from './pages/Lecturer/Feedback';
import Evaluations from './pages/Lecturer/Evaluations';
import EnterGrades from './pages/Lecturer/EnterGrades';
import StudentGrades from './pages/Lecturer/StudentGrades';
import PayTuitionPage from './pages/Student/PayTuitionPage';
import TransactionHistoryPage from './pages/Student/TransactionHistoryPage';
import RequestsPage from './pages/Student/SupportRequest/RequestsPage';
import EvaluationPage from './pages/Student/EvaluationPage';
import SlotNotificationsPage from './pages/Student/SlotNotificationsPage';
import LecturerAnnouncements from './pages/Lecturer/ViewAnoucement/AnnoucementList';
import LecturerAnnouncementDetail from './pages/Lecturer/ViewAnoucement/AnnoucementDetail';
import StaffLayout from './pages/Staff/StaffLayout';
import StudentAccount from './pages/Staff/accountManagement/StudentAccount';
import LectureAccount from './pages/Staff/accountManagement/LectureAccount';
import SupportRequestList from './pages/Staff/SupportRequest/RequestList';
import AnswerSupport from './pages/Staff/SupportRequest/Answer';
import SchedulingPage from './pages/Staff/SchedulingPage/SchedulingPage';
import MaterialManager from './pages/Staff/MaterialManager';
import SubjectDetail from './pages/Staff/MaterialManager/SubjectDetail';

import LecturerTimetablePage from './pages/Lecturer/LecturerTimetablePage';
import AttendancePage from './pages/Lecturer/AttendancePage/AttendancePage';
import LecturerMaterialManager from './pages/Lecturer/MaterialManager';
import ViewGrades from './pages/Lecturer/ViewGrades';

import ExamSchedulePage from './pages/Staff/ExamSchedulePage';
import StudentTimetablePage from './pages/Student/StudentTimetablePage'

import RequestAbsenceList from "./pages/Student/RequestAbsenceList";
import RequestAbsenceCreate from "./pages/Student/RequestAbsenceCreate";

import AbsenceList from "./pages/Staff/AbsenceList";
import AbsenceReview from "./pages/Staff/AbsenceReview";
import AttendanceList from './pages/Lecturer/AttendanceListPages/AttendanceList';
import ClassesBySemesterPage from './pages/Lecturer/ClassesBySemester/Index';
// import SupportRequestPage from './pages/Lecturer/SupportRequest';
import AnnouncementList from "./pages/Staff/AnnouncementList";

import SupportListLecturer from './pages/Lecturer/SupportRequest/SupportList';
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminAccountList from "./pages/Admin/AdminAccountList";



import ManualClassPage from './pages/Staff/ManualClassPage';
import StudentClassmatesPage from './pages/Student/StudentClassmatesPage';
import StudentSlotNotificationPage from './pages/Student/StudentSlotNotificationPage';
import AttendanceReport from './pages/Student/AttendanceReport';
import ChatBubble from './components/Common/ChatBubble';
import AiToolManagementPage from './pages/Staff/AiToolManagementPage';
import AiChatPage from './pages/Student/AiChatPage';
import AiChatLayout from './pages/Student/AiChatLayout';
import SubjectDetailPublic from './pages/Shared/SubjectDetailPublic';
import SemesterManagementPage from './pages/Staff/SemesterManagementPage';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import ResetPasswordPage from './components/Auth/ResetPasswordPage';
import StudentMaterialDetail from './pages/Student/StudentMaterialDetail';

import TuitionConfigPage from './pages/Staff/TuitionConfigPage';
import TuitionGenerationPage from './pages/Staff/TuitionGenerationPage';
import TuitionManagementPage from './pages/Staff/TuitionManagementPage';

import StaffDashboard from './pages/Staff/StaffDashboard';
import StaffProfile from './pages/Staff/StaffProfile';
import AdminMajorPage from './pages/Admin/MajorAdminPage';

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
                <Route path='/forgot-password' element={<ForgotPasswordPage />} />
                <Route path='/reset-password/:token' element={<ResetPasswordPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/student" element={<StudentLayout />}>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="materials" element={<MaterialsPage />} />
                    <Route path="payment" element={<PayTuitionPage />} />
                    <Route path="transactions" element={<TransactionHistoryPage />} />
                    <Route path="requests" element={<SupportListLecturer />} />
                    <Route path="evaluation" element={<EvaluationPage />} />
                    <Route path="notifications" element={<SlotNotificationsPage />} />
                    <Route path="chat" element={<AiChatPage />} />
                    <Route path="timetable" element={<Timetable />} />
                    <Route path="curriculums" element={<CurriculumsPage />} />
                    <Route path="curriculums/:id" element={<CurriculumDetailsPage />} />
                    <Route path="announcements" element={<StudentAnnouncements />} />
                    <Route path="announcements/:id" element={<StudentAnnouncementDetail />} />
                    <Route path="attendance" element={<AttendanceReport />} />
                  </Route>
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/materials" element={<MaterialsPage />} />
                  <Route path="/student/payment" element={<PayTuitionPage />} />
                  <Route path="/student/transactions" element={<TransactionHistoryPage />} />
                  <Route path="/student/requests" element={<SupportListLecturer />} />
                  <Route path="/student/evaluation" element={<EvaluationPage />} />
                  <Route path="/student/notifications" element={<SlotNotificationsPage />} />
                  <Route path="/student/schedule" element={<StudentTimetablePage />} />
                  <Route path="/student/announcements" element={<StudentAnnouncements />} />
                  <Route path="/student/announcements/:id" element={<StudentAnnouncementDetail />} />
                  <Route path="/student/absence" element={<RequestAbsenceList />} />
                  <Route path="/student/absence/new" element={<RequestAbsenceCreate />} />
                  <Route path="/student/classmates/:classId" element={<StudentClassmatesPage />} />
                  <Route path="/student/notifications/slot/:scheduleId" element={<StudentSlotNotificationPage />} />
                  <Route path="/student/scheduleExam" element={<ExamSchedule />} />
                  <Route
                    path="/student/materials/:id"
                    element={<StudentMaterialDetail />}
                  />
                  <Route path="chat" element={<AiChatLayout />}>
                    <Route index element={<AiChatPage />} />
                    <Route path=":chatId" element={<AiChatPage />} />
                  </Route>
                </Route>
                <Route element={<ProtectedRoute />}>
                  <Route path="/subject/:id" element={<SubjectDetail />} />
                </Route>
                <Route path="/staff/" element={<StaffLayout />}>
                  <Route path="dashboard" element={<StaffDashboard />} />
                  <Route path="students" element={<StudentAccount />} />
                  <Route path="lectures" element={<LectureAccount />} />
                  <Route path="supports" element={<SupportRequestList />} />
                  <Route path="support/:id" element={<AnswerSupport />} />
                  <Route path="scheduling" element={<SchedulingPage />} />
                  <Route path="material" element={<MaterialManager />} />
                  <Route path="material/:id" element={<SubjectDetail />} />
                  <Route path="exam-schedule" element={<ExamSchedulePage />} />
                  <Route path="material/:id" element={<SubjectDetail />} />
                  <Route path="semesters" element={<SemesterManagementPage />} />
                  <Route path="ai-tools" element={<AiToolManagementPage />} />
                  <Route path="absence" element={<AbsenceList />} />
                  <Route path="absence/:id" element={<AbsenceReview />} />
                  <Route path="manual-class" element={<ManualClassPage />} />
                  <Route path="tuition-config" element={<TuitionConfigPage />} />
                  <Route path="tuition-generate" element={<TuitionGenerationPage />} />
                  <Route path="tuition-manage" element={<TuitionManagementPage />} />
                  <Route path="announcements" element={<AnnouncementList />} />
                  <Route path="profile" element={<StaffProfile />} />
                </Route>

                <Route path="/lecturer/" element={<LecturerLayout />}>
                  <Route path="dashboard" element={<LecturerDashboard />} />
                  <Route path="profile" element={<LecturerProfile />} />
                  <Route path='view-teaching-schedule' element={<ScheduleLecturePages />} />
                  <Route path='view-detail-schedule/:id' element={<DetailSlotPage />} />
                  <Route path='feedback' element={<Feedback />} />
                  <Route path='evaluations' element={<Evaluations />} />
                  <Route path='enter-grades' element={<EnterGrades />} />
                  <Route path='student-grades' element={<StudentGrades />} />
                  <Route path='view-grades' element={<ViewGrades />} />
                  <Route path='attendance-list' element={<AttendanceList />} />
                  <Route path='attendance-list' element={<AttendanceList />} />
                  <Route path="announcements" element={<LecturerAnnouncements />} />
                  <Route path='my-list-class-charge' element={<ClassesBySemesterPage />} />
                  <Route path="announcements/:id" element={<LecturerAnnouncementDetail />} />
                  <Route path="supports" element={<SupportListLecturer />} />
                  <Route path="schedule" element={<LecturerTimetablePage />} />
                  <Route path="attendance/:scheduleId" element={<AttendancePage />} />
                  <Route path="material" element={<LecturerMaterialManager />} />
                  <Route path="material/:id" element={<SubjectDetailPublic />} />
                  <Route path="view-attendance-list" element={<AttendanceList />} />
                </Route>



                <Route path="/admin/" element={<AdminLayout />}>
                  <Route path="" element={<AdminAccountList />} /> 
                  <Route path="majors" element={<AdminMajorPage />} />
                  <Route path="accounts" element={<AdminAccountList />} />
                </Route>





              </Routes>
              <ChatBubble />
              <BackToTopButton />
            </AuthProvider>
          </GoogleOAuthProvider >
        </BrowserRouter >
      </div >
    </ThemeProvider >
  );
}
export default App;