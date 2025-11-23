import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { BsBarChart, BsPeople, BsBook, BsPencilSquare, BsClipboardData, BsMortarboard, BsCheckCircle, BsCash, BsCreditCard, BsCalendar, BsBell, BsExclamationTriangle, BsHospital, BsXCircle, BsPerson, BsGraphUp, BsSun, BsMoon } from 'react-icons/bs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = ({ onLogout }) => {
  const [data, setData] = useState({
    students: [],
    courses: [],
    enrollments: [],
    attendance: [],
    applications: [],
    assessments: [],
    grades: [],
    fees: [],
    payments: [],
    schedules: [],
    notifications: [],
    behaviorLogs: [],
    healthRecords: [],
    users: [],
    studyMaterials: []
  });
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, type: '', mode: 'create', item: null });
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Memoized filtered data
  const filteredStudents = useMemo(() => {
    if (!debouncedSearch) return data.students;
    return data.students.filter(s =>
      `${s.first_name} ${s.last_name} ${s.student_id} ${s.email}`.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [data.students, debouncedSearch]);

  const fetchData = useCallback(async () => {
    try {
      const endpoints = [
        'students', 'courses', 'enrollments', 'attendance', 'applications',
        'assessments', 'grades', 'fees', 'payments', 'schedules', 'notifications',
        'behavior-logs', 'health-records', 'users', 'study-materials'
      ];

      // Fetch data in smaller batches to avoid overwhelming the browser
      const batchSize = 5;
      const batches = [];
      for (let i = 0; i < endpoints.length; i += batchSize) {
        batches.push(endpoints.slice(i, i + batchSize));
      }

      const newData = {};
      for (const batch of batches) {
        const batchPromises = batch.map(endpoint => axios.get(endpoint));
        const batchResponses = await Promise.all(batchPromises);

        batch.forEach((endpoint, index) => {
          const key = endpoint.replace('-', '');
          newData[key] = batchResponses[index].data;
        });

        // Small delay between batches to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setData(newData);

      // Get current user data
      const userResponse = await axios.get('/user');
      setUser(userResponse.data);

      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error('Error loading data:', err);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  const handleCreate = useCallback((type) => {
    setModal({ open: true, type, mode: 'create', item: null });
  }, []);

  const handleEdit = useCallback((type, item) => {
    setModal({ open: true, type, mode: 'edit', item });
  }, []);

  const handleDelete = useCallback(async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${type}/${id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  }, [fetchData]);

  const handleSave = useCallback(async (formData) => {
    try {
      const endpoint = modal.type;
      const isFormData = formData.file instanceof File;

      if (modal.mode === 'create') {
        if (isFormData) {
          const data = new FormData();
          Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
              data.append(key, formData[key]);
            }
          });
          await axios.post(endpoint, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await axios.post(endpoint, formData);
        }
      } else {
        if (isFormData) {
          const data = new FormData();
          data.append('_method', 'PUT');
          Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
              data.append(key, formData[key]);
            }
          });
          await axios.post(`${endpoint}/${modal.item.id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await axios.put(`${endpoint}/${modal.item.id}`, formData);
        }
      }

      setModal({ open: false, type: '', mode: 'create', item: null });
      fetchData();
    } catch (err) {
      console.error('Error saving:', err);
      throw err;
    }
  }, [modal.type, modal.mode, modal.item, fetchData]);

  const handleView = useCallback(async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`study-materials/${item.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const { file_name, file_type, content } = response.data;

      // Create a modal to display the content
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
      modal.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-cream max-h-screen overflow-y-auto">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-baltic-blue">${file_name}</h3>
              <button id="closeModal" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <div class="mb-4">
              ${file_type.startsWith('image/') ?
                `<img src="data:${file_type};base64,${content}" alt="${file_name}" class="max-w-full h-auto" />` :
                file_type === 'application/pdf' ?
                `<embed src="data:${file_type};base64,${content}" type="${file_type}" width="100%" height="600px" />` :
                `<div class="text-center py-8">
                  <p class="text-gray-600">Preview not available for this file type.</p>
                  <p class="text-sm text-gray-500 mt-2">File type: ${file_type}</p>
                  <button id="downloadBtn" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Download File
                  </button>
                </div>`
              }
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Close modal functionality
      const closeModal = () => {
        document.body.removeChild(modal);
      };

      modal.querySelector('#closeModal').addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Download button if present
      const downloadBtn = modal.querySelector('#downloadBtn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
          // For admin, we can add a download function here, but since it's not defined, just close
          closeModal();
        });
      }

    } catch (err) {
      console.error('Error viewing file:', err);
      if (err.response?.status === 403) {
        alert('You do not have permission to view this file.');
      } else if (err.response?.status === 404) {
        alert('File not found.');
      } else {
        alert('Failed to view file. Please try again.');
      }
    }
  }, []);

  const getStudentDepartmentData = useMemo(() => {
    if (!data.students) return [];
    const departmentCount = data.students.reduce((acc, student) => {
      const dept = student.department || 'Not Assigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(departmentCount).map(([department, count]) => ({
      department,
      count
    }));
  }, [data.students]);

  const getApplicationStatusData = useMemo(() => {
    if (!data.applications) return [];
    const statusCount = data.applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      color: status === 'approved' ? '#028090' : status === 'rejected' ? '#f0f3bd' : '#02c39a'
    }));
  }, [data.applications]);

  const getGradeDistributionData = useMemo(() => {
    if (!data.grades) return [];
    const gradeRanges = { 'A (90-100)': 0, 'B (80-89)': 0, 'C (70-79)': 0, 'D (60-69)': 0, 'F (0-59)': 0 };
    data.grades.forEach(grade => {
      const percentage = parseFloat(grade.percentage || 0);
      if (percentage >= 90) gradeRanges['A (90-100)']++;
      else if (percentage >= 80) gradeRanges['B (80-89)']++;
      else if (percentage >= 70) gradeRanges['C (70-79)']++;
      else if (percentage >= 60) gradeRanges['D (60-69)']++;
      else gradeRanges['F (0-59)']++;
    });
    return Object.entries(gradeRanges).map(([range, count]) => ({ range, count }));
  }, [data.grades]);

  const getFeeStatusData = useMemo(() => {
    if (!data.fees) return [];
    const statusCount = data.fees.reduce((acc, fee) => {
      acc[fee.status] = (acc[fee.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      color: status === 'paid' ? '#028090' : status === 'pending' ? '#f0f3bd' : '#02c39a'
    }));
  }, [data.fees]);

  const getAttendanceTrendData = useMemo(() => {
    if (!data.attendance) return [];
    const last30Days = data.attendance.slice(-30);
    const dailyData = {};

    last30Days.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      if (!dailyData[date]) {
        dailyData[date] = { present: 0, absent: 0 };
      }
      if (record.status === 'present') {
        dailyData[date].present++;
      } else {
        dailyData[date].absent++;
      }
    });

    return Object.entries(dailyData).map(([date, counts]) => ({
      date,
      present: counts.present,
      absent: counts.absent,
      total: counts.present + counts.absent
    }));
  }, [data.attendance]);

  const getAssessmentTypeData = useMemo(() => {
    if (!data.assessments) return [];
    const typeCount = data.assessments.reduce((acc, assessment) => {
      acc[assessment.assessment_type] = (acc[assessment.assessment_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCount).map(([type, count]) => ({ type, count }));
  }, [data.assessments]);

  const getUserRoleData = useMemo(() => {
    if (!data.users) return [];
    const roleCount = data.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(roleCount).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count
    }));
  }, [data.users]);

  const getBehaviorTypeData = useMemo(() => {
    if (!data.behaviorlogs) return [];
    const typeCount = data.behaviorlogs.reduce((acc, log) => {
      acc[log.incident_type] = (acc[log.incident_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count
    }));
  }, [data.behaviorlogs]);

  const getHealthRecordTypeData = useMemo(() => {
    if (!data.healthrecords) return [];
    const typeCount = data.healthrecords.reduce((acc, record) => {
      acc[record.record_type] = (acc[record.record_type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(typeCount).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      count
    }));
  }, [data.healthrecords]);

  const stats = useMemo(() => [
    { title: 'Total Students', value: data.students?.length || 0, icon: <BsPeople />, color: 'bg-blue-500' },
    { title: 'Total Courses', value: data.courses?.length || 0, icon: <BsBook />, color: 'bg-green-500' },
    { title: 'Applications', value: data.applications?.length || 0, icon: <BsPencilSquare />, color: 'bg-purple-500' },
    { title: 'Pending Fees', value: data.fees?.filter(f => f.status === 'pending').length || 0, icon: <BsCash />, color: 'bg-red-500' },
  ], [data.students?.length, data.courses?.length, data.applications?.length, data.fees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''} bg-custom-primary`}>
      {/* Sidebar */}
      <div 
        className={`bg-custom-secondary shadow-lg transition-all duration-300 border-r border-custom-primary ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
      >
        <div className="px-6 h-16 flex flex-col justify-center items-center border-b border-custom-primary">
          {!sidebarCollapsed && <h2 className="text-2xl font-bold text-custom-primary">Admin Panel</h2>}
        </div>
        <nav className="mt-6">
          {[
            { key: 'overview', label: 'Overview', icon: <BsBarChart /> },
            { key: 'profile', label: 'Profile', icon: <BsPerson /> },
            { key: 'students', label: 'Students', icon: <BsPeople /> },
            { key: 'courses', label: 'Courses', icon: <BsBook /> },
            { key: 'applications', label: 'Applications', icon: <BsPencilSquare /> },
            { key: 'assessments', label: 'Assessments', icon: <BsClipboardData /> },
            { key: 'grades', label: 'Grades', icon: <BsPencilSquare /> },
            { key: 'enrollments', label: 'Enrollments', icon: <BsMortarboard /> },
            { key: 'attendance', label: 'Attendance', icon: <BsCheckCircle /> },
            { key: 'fees', label: 'Fees', icon: <BsCash /> },
            { key: 'payments', label: 'Payments', icon: <BsCreditCard /> },
            { key: 'schedules', label: 'Schedules', icon: <BsCalendar /> },
            { key: 'notifications', label: 'Notifications', icon: <BsBell /> },
            { key: 'behavior', label: 'Behavior Logs', icon: <BsExclamationTriangle /> },
            { key: 'health', label: 'Health Records', icon: <BsHospital /> },
            { key: 'study-materials', label: 'Study Materials', icon: <BsBook /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => { setActiveTab(key); setSearch(''); }}
              className={`w-full text-left px-6 py-4 text-custom-secondary hover:bg-custom-hover hover:text-custom-accent flex items-center transition-all duration-200 ${
                activeTab === key ? 'bg-custom-accent text-custom-accent border-r-4 border-custom-accent shadow-sm' : ''
              } ${sidebarCollapsed ? 'justify-center px-3' : ''}`}
            >
              <span className="mr-3 text-lg">{icon}</span>
              {!sidebarCollapsed && <span className="font-medium">{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-custom-secondary shadow-sm px-6 py-4 flex justify-between items-center border-b border-custom-primary">
          <h1 className="text-3xl font-bold text-custom-primary">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'profile' && 'My Profile'}
            {activeTab === 'students' && 'Student Management'}
            {activeTab === 'courses' && 'Course Management'}
            {activeTab === 'applications' && 'Admissions Management'}
            {activeTab === 'assessments' && 'Assessment Management'}
            {activeTab === 'grades' && 'Grade Management'}
            {activeTab === 'enrollments' && 'Enrollment Management'}
            {activeTab === 'attendance' && 'Attendance Management'}
            {activeTab === 'fees' && 'Fee Management'}
            {activeTab === 'payments' && 'Payment Management'}
            {activeTab === 'schedules' && 'Schedule Management'}
            {activeTab === 'notifications' && 'Notification Management'}
            {activeTab === 'behavior' && 'Behavior Management'}
            {activeTab === 'health' && 'Health Records Management'}
            {activeTab === 'study-materials' && 'Study Materials Management'}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-custom-tertiary text-custom-secondary hover:bg-custom-hover transition-colors"
            >
              {darkMode ? <BsSun className="text-xl" /> : <BsMoon className="text-xl" />}
            </button>
            <div className="relative">
              <div 
                className="flex items-center space-x-4 cursor-pointer p-2 rounded-lg hover:bg-custom-hover transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="text-right">
                  <p className="text-sm font-semibold text-custom-primary">admin</p>
                  <p className="text-xs text-custom-tertiary">admin@example.com</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center overflow-hidden shadow-md">
                  {user?.profile_picture ? (
                    <img
                      src={`http://localhost:8000/storage/${user.profile_picture}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BsPerson className="text-xl text-white" />
                  )}
                </div>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-custom-secondary rounded-xl shadow-xl z-10 border border-custom-primary overflow-hidden">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="block w-full px-4 py-3 text-sm text-custom-secondary hover:bg-custom-hover hover:text-custom-primary transition-colors text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-custom-primary p-6">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-custom-secondary rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 border border-custom-primary">
                    <div className="flex items-center">
                      <div className={`p-4 rounded-xl ${stat.color} text-white text-3xl shadow-sm`}>
                        {stat.icon}
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-semibold text-custom-tertiary uppercase tracking-wide">{stat.title}</p>
                        <p className="text-3xl font-bold text-custom-primary">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* System Features Overview */}
              <div className="bg-custom-secondary rounded-xl shadow-sm p-8 border border-custom-primary">
                <h3 className="text-2xl font-bold text-custom-primary mb-8 text-center">System Features Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsPeople className="text-blue-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Student Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Manage student profiles, enrollment, and personal information. Track student progress and maintain comprehensive student records.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-green-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsBook className="text-green-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Course Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Create and manage courses, assign instructors, set credits, and organize course offerings by department and academic year.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-purple-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsPencilSquare className="text-purple-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Admissions</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Handle student applications, review submissions, and manage the admission process from application to enrollment.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-indigo-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsClipboardData className="text-indigo-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Assessments</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Create and manage assessments, quizzes, and exams. Set due dates, weightage, and track assessment schedules.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsPencilSquare className="text-blue-600 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Grade Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Record and manage student grades, calculate GPA, and maintain detailed academic performance records.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-cyan-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsMortarboard className="text-cyan-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Enrollments</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Manage course enrollments, track student registrations, and handle enrollment changes and withdrawals.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-emerald-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsCheckCircle className="text-emerald-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Attendance Tracking</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Monitor student attendance, record daily presence, and generate attendance reports for academic tracking.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-red-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsCash className="text-red-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Fee Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Set up fee structures, track outstanding payments, and manage tuition and other educational fees.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-orange-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsCreditCard className="text-orange-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Payment Processing</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Process payments, track payment history, and manage financial transactions for fees and services.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-pink-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsCalendar className="text-pink-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Schedule Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Create class schedules, manage timetables, and organize academic calendars and course timings.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-gray-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsBell className="text-gray-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Notifications</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Send announcements, alerts, and important messages to students, staff, and parents.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-amber-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsExclamationTriangle className="text-amber-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Behavior Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Track student behavior incidents, maintain disciplinary records, and manage behavioral interventions.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-teal-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsHospital className="text-teal-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">Health Records</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Maintain student health information, track medical records, and manage health-related documentation.</p>
                  </div>

                  <div className="border border-custom-primary rounded-xl p-6 hover:shadow-md transition-all duration-300 hover:border-violet-300 bg-custom-secondary">
                    <div className="flex items-center mb-4">
                      <BsPerson className="text-violet-500 text-2xl mr-4" />
                      <h4 className="text-xl font-semibold text-custom-primary">User Management</h4>
                    </div>
                    <p className="text-sm text-custom-secondary leading-relaxed">Manage system users, roles, and permissions. Handle authentication and access control for the platform.</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-custom-secondary rounded-xl shadow-sm p-8 border border-custom-primary">
                <h3 className="text-2xl font-bold text-custom-primary mb-6 text-center">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <button
                    onClick={() => handleCreate('students')}
                    className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                  >
                    <BsPeople className="mr-3 text-xl" />
                    <span>Add Student</span>
                  </button>
                  <button
                    onClick={() => handleCreate('courses')}
                    className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                  >
                    <BsBook className="mr-3 text-xl" />
                    <span>Add Course</span>
                  </button>
                  <button
                    onClick={() => handleCreate('assessments')}
                    className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                  >
                    <BsClipboardData className="mr-3 text-xl" />
                    <span>Create Assessment</span>
                  </button>
                  <button
                    onClick={() => handleCreate('notifications')}
                    className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md font-semibold"
                  >
                    <BsBell className="mr-3 text-xl" />
                    <span>Send Notification</span>
                  </button>
                </div>
              </div>

              {/* Data Visualization Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Department Distribution */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsBarChart className="mr-3 text-blue-500" />
                    Students by Department
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getStudentDepartmentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="department" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Application Status Distribution */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsPencilSquare className="mr-3 text-green-500" />
                    Application Status
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getApplicationStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {getApplicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Grade Distribution */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsGraphUp className="mr-3 text-purple-500" />
                    Grade Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getGradeDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="range" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Fee Payment Status */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsCash className="mr-3 text-red-500" />
                    Fee Payment Status
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getFeeStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {getFeeStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Attendance Trend */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsCheckCircle className="mr-3 text-cyan-500" />
                    Attendance Trend (Last 30 Days)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getAttendanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Area type="monotone" dataKey="present" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                      <Area type="monotone" dataKey="absent" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.8} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Assessment Types */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsClipboardData className="mr-3 text-indigo-500" />
                    Assessment Types
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getAssessmentTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* User Roles Distribution */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsPerson className="mr-3 text-blue-600" />
                    User Roles
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getUserRoleData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                      >
                        {getUserRoleData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#8B5CF6'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Behavior Incidents */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsExclamationTriangle className="mr-3 text-red-500" />
                    Behavior Incidents by Type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getBehaviorTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Health Records */}
                <div className="bg-custom-secondary rounded-xl shadow-sm p-6 border border-custom-primary hover:shadow-md transition-shadow duration-300 col-span-1 lg:col-span-2">
                  <h3 className="text-xl font-bold text-custom-primary mb-4 flex items-center">
                    <BsHospital className="mr-3 text-emerald-500" />
                    Health Records by Type
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={getHealthRecordTypeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#f0f0f0"} />
                      <XAxis dataKey="type" tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <YAxis tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#374151' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#fff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '8px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && user && (
            <AdminProfile user={user} onUserUpdate={setUser} />
          )}

          {activeTab === 'students' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleCreate('students')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Student
                </button>
              </div>
              <DataTable
                title="Students"
                data={filteredStudents}
                columns={[
                  { key: 'student_id', label: 'ID' },
                  { key: 'first_name', label: 'First Name' },
                  { key: 'last_name', label: 'Last Name' },
                  { key: 'department', label: 'Department' },
                  { key: 'year', label: 'Year' },
                ]}
                onEdit={(item) => handleEdit('students', item)}
                onDelete={(id) => handleDelete('students', id)}
              />
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('courses')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Course
                </button>
              </div>
              <DataTable
                title="Courses"
                data={data.courses}
                columns={[
                  { key: 'course_code', label: 'Code' },
                  { key: 'course_name', label: 'Name' },
                  { key: 'credits', label: 'Credits' },
                  { key: 'department', label: 'Department' },
                  { key: 'instructor', label: 'Instructor' },
                ]}
                onEdit={(item) => handleEdit('courses', item)}
                onDelete={(id) => handleDelete('courses', id)}
              />
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('applications')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Application
                </button>
              </div>
              <DataTable
                title="Applications"
                data={data.applications}
                columns={[
                  { key: 'application_number', label: 'Application #' },
                  { key: 'first_name', label: 'First Name' },
                  { key: 'last_name', label: 'Last Name' },
                  { key: 'email', label: 'Email' },
                  { key: 'department', label: 'Department' },
                  { key: 'status', label: 'Status', render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      value === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {value}
                    </span>
                  )},
                ]}
                onEdit={(item) => handleEdit('applications', item)}
                onDelete={(id) => handleDelete('applications', id)}
              />
            </div>
          )}

          {activeTab === 'assessments' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('assessments')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Assessment
                </button>
              </div>
              <DataTable
                title="Assessments"
                data={data.assessments}
                columns={[
                  { key: 'assessment_name', label: 'Name' },
                  { key: 'assessment_type', label: 'Type' },
                  { key: 'total_marks', label: 'Total Marks' },
                  { key: 'weightage', label: 'Weightage (%)' },
                  { key: 'due_date', label: 'Due Date', render: (value) => new Date(value).toLocaleDateString() },
                ]}
                onEdit={(item) => handleEdit('assessments', item)}
                onDelete={(id) => handleDelete('assessments', id)}
              />
            </div>
          )}

          {activeTab === 'grades' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('grades')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Grade
                </button>
              </div>
              <DataTable
                title="Student Grades"
                data={data.grades}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'assessment.assessment_name', label: 'Assessment', render: (_, row) => row.assessment?.assessment_name },
                  { key: 'percentage', label: 'Grade (%)', render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      value >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {value}%
                    </span>
                  )},
                  { key: 'score', label: 'Marks Obtained' },
                  { key: 'assessment.total_marks', label: 'Total Marks', render: (_, row) => row.assessment?.total_marks },
                  { key: 'date', label: 'Graded Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
                ]}
                onEdit={(item) => handleEdit('grades', item)}
                onDelete={(id) => handleDelete('grades', id)}
              />
            </div>
          )}

          {activeTab === 'enrollments' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('enrollments')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Enrollment
                </button>
              </div>
              <DataTable
                title="Enrollments"
                data={data.enrollments}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                  { key: 'enrollment_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                ]}
                onEdit={(item) => handleEdit('enrollments', item)}
                onDelete={(id) => handleDelete('enrollments', id)}
              />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('attendance')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Attendance
                </button>
              </div>
              <DataTable
                title="Attendance Records"
                data={data.attendance}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                  { key: 'date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {value}
                    </span>
                  )},
                ]}
                onEdit={(item) => handleEdit('attendance', item)}
                onDelete={(id) => handleDelete('attendance', id)}
              />
            </div>
          )}

          {activeTab === 'fees' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('fees')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Fee
                </button>
              </div>
              <DataTable
                title="Fees"
                data={data.fees}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'fee_type', label: 'Type' },
                  { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
                  { key: 'due_date', label: 'Due Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      value === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {value}
                    </span>
                  )},
                ]}
                onEdit={(item) => handleEdit('fees', item)}
                onDelete={(id) => handleDelete('fees', id)}
              />
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('payments')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Payment
                </button>
              </div>
              <DataTable
                title="Payments"
                data={data.payments}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'fee.fee_type', label: 'Fee Type', render: (_, row) => row.fee?.fee_type },
                  { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
                  { key: 'payment_method', label: 'Method' },
                  { key: 'payment_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                ]}
                onEdit={(item) => handleEdit('payments', item)}
                onDelete={(id) => handleDelete('payments', id)}
              />
            </div>
          )}

          {activeTab === 'schedules' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('schedules')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Schedule
                </button>
              </div>
              <DataTable
                title="Class Schedules"
                data={data.schedules}
                columns={[
                  { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                  { key: 'day_of_week', label: 'Day' },
                  { key: 'start_time', label: 'Start Time' },
                  { key: 'end_time', label: 'End Time' },
                  { key: 'room', label: 'Room' },
                  { key: 'semester', label: 'Semester' },
                ]}
                onEdit={(item) => handleEdit('schedules', item)}
                onDelete={(id) => handleDelete('schedules', id)}
              />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('notifications')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Notification
                </button>
              </div>
              <DataTable
                title="Notifications"
                data={data.notifications}
                columns={[
                  { key: 'user.username', label: 'User', render: (_, row) => row.user?.username },
                  { key: 'title', label: 'Title' },
                  { key: 'type', label: 'Type' },
                  { key: 'is_read', label: 'Read', render: (value) => value ? <BsCheckCircle className="text-green-500 dark:text-green-400" /> : <BsXCircle className="text-red-500 dark:text-red-400" /> },
                  { key: 'created_at', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                ]}
                onEdit={(item) => handleEdit('notifications', item)}
                onDelete={(id) => handleDelete('notifications', id)}
              />
            </div>
          )}

          {activeTab === 'behavior' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('behavior-logs')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Behavior Log
                </button>
              </div>
              <DataTable
                title="Behavior Logs"
                data={data.behaviorlogs}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'incident_type', label: 'Type' },
                  { key: 'description', label: 'Description' },
                  { key: 'incident_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'severity', label: 'Severity' },
                ]}
                onEdit={(item) => handleEdit('behavior-logs', item)}
                onDelete={(id) => handleDelete('behavior-logs', id)}
              />
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('health-records')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Add New Health Record
                </button>
              </div>
              <DataTable
                title="Health Records"
                data={data.healthrecords}
                columns={[
                  { key: 'student.first_name', label: 'Student', render: (_, row) => `${row.student?.first_name} ${row.student?.last_name}` },
                  { key: 'record_type', label: 'Type' },
                  { key: 'description', label: 'Description' },
                  { key: 'record_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'provider', label: 'Provider' },
                ]}
                onEdit={(item) => handleEdit('health-records', item)}
                onDelete={(id) => handleDelete('health-records', id)}
              />
            </div>
          )}

          {activeTab === 'study-materials' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => handleCreate('study-materials')}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
                >
                  Upload Study Material
                </button>
              </div>
              <DataTable
                title="Study Materials"
                data={data.studymaterials}
                columns={[
                  { key: 'title', label: 'Title' },
                  { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                  { key: 'module_name', label: 'Module' },
                  { key: 'file_name', label: 'File Name' },
                  { key: 'file_type', label: 'Type' },
                  { key: 'file_size', label: 'Size (KB)', render: (value) => `${(value / 1024).toFixed(2)} KB` },
                  { key: 'is_visible', label: 'Visible', render: (value) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      value ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {value ? 'Yes' : 'No'}
                    </span>
                  )},
                  { key: 'created_at', label: 'Uploaded', render: (value) => new Date(value).toLocaleDateString() },
                ]}
                onView={(item) => handleView(item)}
                onEdit={(item) => handleEdit('study-materials', item)}
                onDelete={(id) => handleDelete('study-materials', id)}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modal.open && (
        <Modal
          type={modal.type}
          mode={modal.mode}
          item={modal.item}
          onClose={() => setModal({ open: false, type: '', mode: 'create', item: null })}
          onSave={handleSave}
          courses={data.courses}
          students={data.students}
          assessments={data.assessments}
          fees={data.fees}
          users={data.users}
        />
      )}
    </div>
  );
};

// Reusable DataTable component
const DataTable = ({ title, data, columns, onEdit, onDelete, onView }) => (
  <div className="bg-custom-secondary rounded-xl shadow-sm overflow-hidden border border-custom-primary hover:shadow-md transition-shadow duration-300">
    <div className="px-8 py-6 border-b border-custom-primary bg-custom-tertiary">
      <h3 className="text-xl font-bold text-custom-primary">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
        <thead className="bg-custom-tertiary">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-8 py-4 text-left text-xs font-bold text-custom-secondary uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || onView) && (
              <th className="px-8 py-4 text-left text-xs font-bold text-custom-secondary uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-custom-secondary divide-y divide-custom-primary">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-custom-hover transition-colors duration-200">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-8 py-4 whitespace-nowrap text-sm text-custom-primary">
                  {col.render ? col.render(getNestedValue(row, col.key), row) : getNestedValue(row, col.key)}
                </td>
              ))}
              {(onEdit || onDelete || onView) && (
                <td className="px-8 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(row)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                    >
                      <BsBarChart className="mr-1" />
                      View
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(row)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 dark:bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors duration-200 shadow-sm"
                    >
                      <BsPencilSquare className="mr-1" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(row.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-600 dark:bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors duration-200 shadow-sm"
                    >
                      <BsXCircle className="mr-1" />
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
// Modal component for CRUD operations
const Modal = ({ type, mode, item, onClose, onSave, courses, students, assessments, fees, users }) => {
  const [formData, setFormData] = useState(item || {});
  const [errors, setErrors] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      // Auto-populate fields for grades when assessment is selected
      if (name === 'assessment_id' && value && type === 'grades') {
        const selectedAssessment = assessments?.find(a => a.id == value);
        if (selectedAssessment) {
          newData.course_id = selectedAssessment.course_id;
          newData.assessment_type = selectedAssessment.assessment_type;
          newData.assessment_name = selectedAssessment.assessment_name;
          newData.max_score = selectedAssessment.total_marks;
        }
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      await onSave(formData);
    } catch (err) {
      if (err.response && err.response.status === 422) {
        setErrors(err.response.data.errors);
      } else {
        console.error('Error saving:', err);
      }
    }
  };

  const getFields = (formData) => {
    switch (type) {
      case 'students': {
        const baseFields = [
          { name: 'username', label: 'Username', type: 'text', required: mode === 'create', readonly: mode === 'edit' },
          { name: 'email', label: 'Email', type: 'email', required: mode === 'create', readonly: mode === 'edit' },
        ];
        if (mode === 'create') {
          baseFields.push({ name: 'password', label: 'Password', type: 'password', required: true });
        }
        baseFields.push(
          { name: 'student_id', label: 'Student ID', type: 'text', required: true },
          { name: 'first_name', label: 'First Name', type: 'text', required: true },
          { name: 'last_name', label: 'Last Name', type: 'text', required: true },
          { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'department', label: 'Department', type: 'text', required: false },
          { name: 'year', label: 'Year', type: 'number', required: false }
        );
        return baseFields;
      }
      case 'courses':
        return [
          { name: 'course_code', label: 'Course Code', type: 'text', required: true },
          { name: 'course_name', label: 'Course Name', type: 'text', required: true },
          { name: 'credits', label: 'Credits', type: 'number', required: true },
          { name: 'department', label: 'Department', type: 'text', required: false },
          { name: 'instructor', label: 'Instructor', type: 'text', required: false },
        ];
      case 'applications':
        return [
          { name: 'first_name', label: 'First Name', type: 'text', required: true },
          { name: 'last_name', label: 'Last Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'text', required: false },
          { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
          { name: 'address', label: 'Address', type: 'text', required: true },
          { name: 'department', label: 'Department', type: 'text', required: true },
          { name: 'year', label: 'Year', type: 'number', required: true },
        ];
      case 'assessments':
        return [
          { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.map(c => ({ value: c.id, label: `${c.course_code} - ${c.course_name}` })) },
          { name: 'assessment_name', label: 'Assessment Name', type: 'text', required: true },
          { name: 'assessment_type', label: 'Assessment Type', type: 'text', required: true },
          { name: 'total_marks', label: 'Total Marks', type: 'number', required: true },
          { name: 'weightage', label: 'Weightage', type: 'number', required: true },
          { name: 'due_date', label: 'Due Date', type: 'date', required: true },
          { name: 'description', label: 'Description', type: 'text', required: false },
        ];
      case 'grades':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'assessment_id', label: 'Assessment', type: 'select', required: true, options: assessments?.map(a => ({ value: a.id, label: `${a.assessment_name} (${a.assessment_type}) - ${a.course?.course_name || 'Course'}` })) || [] },
          { name: 'course_id', label: 'Course ID', type: 'text', required: true, readonly: true },
          { name: 'assessment_type', label: 'Assessment Type', type: 'text', required: true, readonly: true },
          { name: 'assessment_name', label: 'Assessment Name', type: 'text', required: true, readonly: true },
          { name: 'score', label: 'Marks Obtained', type: 'number', required: true },
          { name: 'max_score', label: 'Max Score', type: 'number', required: true, readonly: true },
          { name: 'date', label: 'Graded Date', type: 'date', required: true },
          { name: 'remarks', label: 'Comments', type: 'text', required: false },
        ];
      case 'enrollments':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.map(c => ({ value: c.id, label: `${c.course_code} - ${c.course_name}` })) },
          { name: 'enrollment_date', label: 'Enrollment Date', type: 'date', required: false },
          { name: 'status', label: 'Status', type: 'text', required: false },
        ];
      case 'attendance':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.map(c => ({ value: c.id, label: `${c.course_code} - ${c.course_name}` })) },
          { name: 'date', label: 'Date', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', required: true, options: [
            { value: 'present', label: 'Present' },
            { value: 'absent', label: 'Absent' },
            { value: 'late', label: 'Late' },
            { value: 'excused', label: 'Excused' }
          ] },
          { name: 'remarks', label: 'Remarks', type: 'text', required: false },
        ];
      case 'fees':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'fee_type', label: 'Fee Type', type: 'text', required: true },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'due_date', label: 'Due Date', type: 'date', required: true },
          { name: 'status', label: 'Status', type: 'select', required: false, options: [
            { value: 'pending', label: 'Pending' },
            { value: 'paid', label: 'Paid' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'partial', label: 'Partial' }
          ] },
          { name: 'description', label: 'Description', type: 'text', required: false },
        ];
      case 'payments':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'fee_id', label: 'Fee', type: 'select', required: true, options: fees?.filter(f => !formData.student_id || f.student_id == formData.student_id).map(f => ({ value: f.id, label: `${f.fee_type} - $${f.amount} (${f.student?.first_name} ${f.student?.last_name})` })) || [] },
          { name: 'amount', label: 'Amount', type: 'number', required: true },
          { name: 'payment_method', label: 'Payment Method', type: 'select', required: true, options: [
            { value: 'cash', label: 'Cash' },
            { value: 'credit_card', label: 'Credit Card' },
            { value: 'debit_card', label: 'Debit Card' },
            { value: 'bank_transfer', label: 'Bank Transfer' },
            { value: 'check', label: 'Check' },
            { value: 'online', label: 'Online Payment' }
          ] },
          { name: 'payment_date', label: 'Payment Date', type: 'date', required: true },
          { name: 'transaction_id', label: 'Transaction ID', type: 'text', required: false },
          { name: 'notes', label: 'Notes', type: 'text', required: false },
        ];
      case 'schedules':
        return [
          { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.map(c => ({ value: c.id, label: `${c.course_code} - ${c.course_name}` })) },
          { name: 'day_of_week', label: 'Day of Week', type: 'select', required: true, options: [
            { value: 'Monday', label: 'Monday' },
            { value: 'Tuesday', label: 'Tuesday' },
            { value: 'Wednesday', label: 'Wednesday' },
            { value: 'Thursday', label: 'Thursday' },
            { value: 'Friday', label: 'Friday' },
            { value: 'Saturday', label: 'Saturday' },
            { value: 'Sunday', label: 'Sunday' }
          ] },
          { name: 'start_time', label: 'Start Time', type: 'time', required: true },
          { name: 'end_time', label: 'End Time', type: 'time', required: true },
          { name: 'room', label: 'Room', type: 'text', required: false },
          { name: 'semester', label: 'Semester', type: 'select', required: true, options: [
            { value: 'Fall', label: 'Fall' },
            { value: 'Spring', label: 'Spring' },
            { value: 'Summer', label: 'Summer' },
            { value: 'Winter', label: 'Winter' }
          ] },
          { name: 'year', label: 'Year', type: 'number', required: true },
        ];
      case 'notifications':
        return [
          { name: 'user_id', label: 'User', type: 'select', required: true, options: users.map(u => ({ value: u.id, label: `${u.username} (${u.email})` })) },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'message', label: 'Message', type: 'text', required: true },
          { name: 'type', label: 'Type', type: 'select', required: true, options: [
            { value: 'info', label: 'Info' },
            { value: 'warning', label: 'Warning' },
            { value: 'success', label: 'Success' },
            { value: 'error', label: 'Error' }
          ] },
          { name: 'is_read', label: 'Is Read', type: 'select', required: false, options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'Yes' }
          ] },
        ];
      case 'behavior-logs':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'reported_by', label: 'Reported By', type: 'select', required: true, options: users.map(u => ({ value: u.id, label: `${u.username} (${u.email})` })) },
          { name: 'incident_type', label: 'Incident Type', type: 'select', required: true, options: [
            { value: 'bullying', label: 'Bullying' },
            { value: 'fighting', label: 'Fighting' },
            { value: 'disruption', label: 'Disruption' },
            { value: 'theft', label: 'Theft' },
            { value: 'vandalism', label: 'Vandalism' },
            { value: 'truancy', label: 'Truancy' },
            { value: 'other', label: 'Other' }
          ] },
          { name: 'description', label: 'Description', type: 'text', required: true },
          { name: 'incident_date', label: 'Incident Date', type: 'date', required: true },
          { name: 'severity', label: 'Severity', type: 'select', required: false, options: [
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ] },
          { name: 'action_taken', label: 'Action Taken', type: 'text', required: false },
          { name: 'follow_up', label: 'Follow Up', type: 'text', required: false },
        ];
      case 'health-records':
        return [
          { name: 'student_id', label: 'Student', type: 'select', required: true, options: students.map(s => ({ value: s.id, label: `${s.student_id} - ${s.first_name} ${s.last_name}` })) },
          { name: 'record_type', label: 'Record Type', type: 'select', required: true, options: [
            { value: 'medical', label: 'Medical' },
            { value: 'dental', label: 'Dental' },
            { value: 'vision', label: 'Vision' },
            { value: 'mental_health', label: 'Mental Health' },
            { value: 'immunization', label: 'Immunization' },
            { value: 'other', label: 'Other' }
          ] },
          { name: 'description', label: 'Description', type: 'text', required: true },
          { name: 'record_date', label: 'Record Date', type: 'date', required: true },
          { name: 'provider', label: 'Provider', type: 'text', required: false },
          { name: 'treatment', label: 'Treatment', type: 'text', required: false },
          { name: 'notes', label: 'Notes', type: 'text', required: false },
          { name: 'emergency_contact', label: 'Emergency Contact', type: 'select', required: false, options: [
            { value: 0, label: 'No' },
            { value: 1, label: 'Yes' }
          ] },
        ];
      case 'study-materials':
        return [
          { name: 'course_id', label: 'Course', type: 'select', required: true, options: courses.map(c => ({ value: c.id, label: `${c.course_code} - ${c.course_name}` })) },
          { name: 'module_name', label: 'Module', type: 'text', required: false },
          { name: 'title', label: 'Title', type: 'text', required: true },
          { name: 'description', label: 'Description', type: 'textarea', required: false },
          { name: 'file', label: 'File', type: 'file', required: mode === 'create', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif' },
          { name: 'is_visible', label: 'Visible to Students', type: 'select', required: false, options: [
            { value: 1, label: 'Yes' },
            { value: 0, label: 'No' }
          ] },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" onClick={onClose}>
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-custom-secondary" onClick={(e) => e.stopPropagation()}>
        <div className="mt-3">
          <h3 className="text-lg font-medium text-custom-primary mb-4">
            {mode === 'create' ? 'Add New' : 'Edit'} {type.slice(0, -1)}
          </h3>
          <form onSubmit={handleSubmit}>
            {getFields(formData).map((field) => (
              <div key={field.name} className="mb-4">
                <label className="block text-sm font-medium text-custom-secondary">{field.label}</label>
                {field.type === 'select' ? (
                  <select
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'file' ? (
                  <input
                    type="file"
                    name={field.name}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setFormData(prev => ({ ...prev, [field.name]: file }));
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={field.required}
                    accept={field.accept}
                  />
                ) : field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required={field.required}
                    readOnly={field.readonly}
                  />
                )}
              </div>
            ))}
            {Object.keys(errors).length > 0 && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <ul>
                  {Object.entries(errors).map(([field, messages]) => (
                    <li key={field}>{field}: {messages.join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {mode === 'create' ? 'Create' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Admin Profile Component
const AdminProfile = ({ user, onUserUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [localProfilePicture, setLocalProfilePicture] = useState(null);

  const handleEditProfile = () => {
    setEditedUser({ ...user });
    setEditMode(true);
  };

  const handleSaveProfile = async () => {
    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      
      // Add user data
      Object.keys(editedUser).forEach(key => {
        if (editedUser[key] !== null && editedUser[key] !== undefined && key !== 'profile_picture') {
          formData.append(key, editedUser[key]);
        }
      });

      // Add profile picture if selected
      if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
      }

      // Update user profile
      const response = await axios.post(`users/${user.id}`, formData);

      onUserUpdate(response.data);
      setEditMode(false);
      setProfilePictureFile(null);
      setLocalProfilePicture(null);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedUser({});
    setProfilePictureFile(null);
    setLocalProfilePicture(null);
  };

  const handleUserChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-custom-secondary rounded-lg shadow p-6 border border-custom-primary">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-custom-primary">Admin Profile</h3>
        {!editMode ? (
          <button
            onClick={handleEditProfile}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Edit Profile
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      
      {/* Profile Picture Section */}
      <div className="mb-6 flex items-center space-x-6">
        <div className="w-24 h-24 rounded-full bg-custom-tertiary flex items-center justify-center overflow-hidden">
          {localProfilePicture ? (
            <img
              src={localProfilePicture}
              alt="Profile Preview"
              className="w-full h-full object-cover"
            />
          ) : user?.profile_picture ? (
            <img
              src={`http://localhost:8000/storage/${user.profile_picture}`}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <BsPerson className="text-3xl text-gray-600 dark:text-gray-400" />
          )}
        </div>
        {editMode && (
          <div>
            <label className="block text-sm font-medium text-custom-secondary mb-2">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                setProfilePictureFile(file);
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (e) => {
                    const dataUrl = e.target.result;
                    setLocalProfilePicture(dataUrl);
                  };
                  reader.readAsDataURL(file);
                } else {
                  setLocalProfilePicture(null);
                }
              }}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 dark:file:bg-blue-500 file:text-white hover:file:bg-blue-700 dark:hover:file:bg-blue-600"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 2MB</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-custom-secondary">Username</label>
          {editMode ? (
            <input
              type="text"
              name="username"
              value={editedUser.username || ''}
              onChange={handleUserChange}
              className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-custom-secondary text-custom-primary"
            />
          ) : (
            <p className="mt-1 text-sm text-custom-primary">{user?.username}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-custom-secondary">Email</label>
          {editMode ? (
            <input
              type="email"
              name="email"
              value={editedUser.email || ''}
              onChange={handleUserChange}
              className="mt-1 block w-full px-3 py-2 border border-custom-primary rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-custom-secondary text-custom-primary"
            />
          ) : (
            <p className="mt-1 text-sm text-custom-primary">{user?.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-custom-secondary">Role</label>
          <p className="mt-1 text-sm text-custom-primary">{user?.role}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-custom-secondary">Account Created</label>
          <p className="mt-1 text-sm text-custom-primary">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;