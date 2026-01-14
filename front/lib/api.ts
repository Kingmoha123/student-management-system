const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export const api = {
  // Auth endpoints
  register: (data: any) =>
    fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  // User endpoints
  getUsers: (token: string) =>
    fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUser: (id: string, token: string) =>
    fetch(`${API_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateUser: (id: string, data: any, token: string) =>
    fetch(`${API_URL}/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Student endpoints
  getStudents: (token: string) =>
    fetch(`${API_URL}/students`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createStudent: (data: any, token: string) =>
    fetch(`${API_URL}/students`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  updateStudent: (id: string, data: any, token: string) =>
    fetch(`${API_URL}/students/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Class endpoints
  getClasses: (token: string) =>
    fetch(`${API_URL}/classes`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createClass: (data: any, token: string) =>
    fetch(`${API_URL}/classes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Attendance endpoints
  getAttendance: (classId: string, token: string) =>
    fetch(`${API_URL}/attendance/class/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  recordAttendance: (data: any, token: string) =>
    fetch(`${API_URL}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Grade endpoints
  getGrades: (studentId: string, token: string) =>
    fetch(`${API_URL}/grades/student/${studentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createGrade: (data: any, token: string) =>
    fetch(`${API_URL}/grades`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Assignment endpoints
  getAssignments: (classId: string, token: string) =>
    fetch(`${API_URL}/assignments/class/${classId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createAssignment: (data: any, token: string) =>
    fetch(`${API_URL}/assignments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  submitAssignment: (assignmentId: string, data: any, token: string) =>
    fetch(`${API_URL}/assignments/submit/${assignmentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),

  // Communication endpoints
  getMessages: (userId: string, token: string) =>
    fetch(`${API_URL}/communication/inbox/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  sendMessage: (data: any, token: string) =>
    fetch(`${API_URL}/communication`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }),
}
