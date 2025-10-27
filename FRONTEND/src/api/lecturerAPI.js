import api from '../services/api';

/**
 * API wrapper for lecturer-related endpoints (frontend client)
 * All functions return the axios response.data object.
 */

const getSemesters = async () => {
  const res = await api.get('/lecturer/semesters');
  return res.data;
};

const getSemesterOptions = async (semesterId) => {
  const res = await api.get(`/lecturer/semester-options?semesterId=${semesterId}`);
  return res.data;
};

const getStudentsByClass = async (classId, scheduleId) => {
  const url = scheduleId ? `/lecturer/studentsbyclass/${classId}?scheduleId=${scheduleId}` : `/lecturer/studentsbyclass/${classId}`;
  const res = await api.get(url);
  return res.data;
};

const getClassesBySemester = async (semesterId) => {
  const url = (semesterId === undefined || semesterId === null || semesterId === '')
    ? '/lecturer/classes-by-semester'
    : `/lecturer/classes-by-semester?semesterId=${semesterId}`;
  const res = await api.get(url);
  return res.data;
};

const lecturerAPI = {
  getSemesters,
  getSemesterOptions,
  getStudentsByClass,
  getClassesBySemester
};

export default lecturerAPI;
