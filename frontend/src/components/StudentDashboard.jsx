import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsBarChart, BsPerson, BsBook, BsGraphUp, BsCheckCircle, BsCash, BsBell, BsHospital, BsExclamationTriangle, BsCalendar, BsSun, BsMoon } from 'react-icons/bs';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const StudentDashboard = ({ user, setUser, onLogout }) => {
  const [data, setData] = useState({
    profile: null,
    courses: [],
    grades: [],
    attendance: [],
    fees: [],
    payments: [],
    notifications: [],
    healthRecords: [],
    behaviorLogs: [],
    assessments: [],
    studyMaterials: []
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [editedUser, setEditedUser] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [localProfilePicture, setLocalProfilePicture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentId = user.student.id;
        const endpoints = [
          `students/${studentId}`,
          `students/${studentId}/courses`,
          `students/${studentId}/grades`,
          `students/${studentId}/attendance`,
          `students/${studentId}/fees`,
          `students/${studentId}/payments`,
          `students/${studentId}/notifications`,
          `students/${studentId}/health-records`,
          `students/${studentId}/behavior-logs`,
          'assessments',
          'study-materials'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => axios.get(endpoint))
        );

        const courses = responses[1].data;
        const enrolledCourseIds = courses.map(c => c.id);
        const allAssessments = responses[9].data;
        const studentAssessments = allAssessments.filter(a => enrolledCourseIds.includes(a.course_id));

        setData({
          profile: responses[0].data,
          courses: courses,
          grades: responses[2].data,
          attendance: responses[3].data,
          fees: responses[4].data,
          payments: responses[5].data,
          notifications: responses[6].data,
          healthRecords: responses[7].data,
          behaviorLogs: responses[8].data,
          assessments: studentAssessments,
          studyMaterials: responses[10].data
        });
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    if (user?.student?.id) {
      fetchData();
    }
  }, [user]);

  const calculateAttendancePercentage = () => {
    if (data.attendance.length === 0) return 0;
    const presentCount = data.attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / data.attendance.length) * 100);
  };

  const calculateGPA = () => {
    if (data.grades.length === 0) return '0.00';
    const totalPercentage = data.grades.reduce((sum, grade) => sum + parseFloat(grade.percentage || 0), 0);
    const averagePercentage = totalPercentage / data.grades.length;
    const gpa = (averagePercentage / 100) * 4.0;
    return gpa.toFixed(2);
  };

  const getAttendanceChartData = () => {
    const last30Days = data.attendance.slice(-30);
    return last30Days.map((record) => ({
      date: new Date(record.date).toLocaleDateString(),
      status: record.status === 'present' ? 1 : 0
    }));
  };

  const getGradeDistributionData = () => {
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
  };

  const getFeeStatusData = () => {
    const paidFees = data.fees.filter(fee => fee.status === 'paid').length;
    const pendingFees = data.fees.filter(fee => fee.status === 'pending').length;
    return [
      { name: 'Paid', value: paidFees, color: '#059669' },
      { name: 'Pending', value: pendingFees, color: '#ea580c' }
    ];
  };

  const handleEditProfile = () => {
    setEditedProfile({ ...data.profile });
    setEditedUser({ username: user.username, email: user.email });
    setEditMode(true);
    setErrorMessage('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      console.log('Starting profile save...');
      console.log('profilePictureFile:', profilePictureFile);
      // Update user profile (username, email, profile picture)
      const userFormData = new FormData();
      userFormData.append('_method', 'PUT');
      if (editedUser.username) userFormData.append('username', editedUser.username);
      if (editedUser.email) userFormData.append('email', editedUser.email);
      if (profilePictureFile) {
        userFormData.append('profile_picture', profilePictureFile);
        console.log('Appending profile picture to form data:', profilePictureFile.name, profilePictureFile.size);
      }
      
      // Log FormData contents
      console.log('FormData contents:');
      for (let [key, value] of userFormData.entries()) {
        if (value instanceof File) {
          console.log(key, ': File -', value.name, value.size, 'bytes');
        } else {
          console.log(key, ':', value);
        }
      }
      
      console.log('Sending POST request to users/' + user.id);
      const userResponse = await axios.post(`users/${user.id}`, userFormData);
      const userData = userResponse.data;
      console.log('User update response:', userData);
      setErrorMessage('');
      // Update user state with the new data
      setUser(userData);
      // Clear localStorage after successful upload
      localStorage.removeItem(`profile_picture_${user.id}`);
      setLocalProfilePicture(null);

      // Update student profile
      await axios.put(`students/${user.student.id}`, editedProfile);
      
      setData(prev => ({ ...prev, profile: editedProfile }));
      setEditMode(false);
      setProfilePictureFile(null);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMsg = err.response?.data?.message || 
                       (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(' ')) || 
                       'Failed to update profile. Please check the file size (max 4MB) and format.';
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedProfile({});
    setEditedUser({});
    setProfilePictureFile(null);
    setErrorMessage('');
    // Clear localStorage on cancel
    localStorage.removeItem(`profile_picture_${user.id}`);
    setLocalProfilePicture(null);
  };

  const handleProfileChange = (e) => {
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`notifications/${notificationId}`, { is_read: 1 });
      // Update local state
      setData(prev => ({
        ...prev,
        notifications: prev.notifications.map(n => 
          n.id === notificationId ? { ...n, is_read: 1 } : n
        )
      }));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleDownload = async (item) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`study-materials/${item.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const { file_name, file_type, content } = response.data;
      
      // Convert base64 to blob
      const byteCharacters = atob(content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file_type });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      if (err.response?.status === 403) {
        alert('You do not have permission to download this file.');
      } else if (err.response?.status === 404) {
        alert('File not found.');
      } else {
        alert('Failed to download file. Please try again.');
      }
    }
  };

  const handleView = async (item) => {
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
        <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
          <div class="mt-3">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">${file_name}</h3>
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
          handleDownload(item);
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
  };

  const pendingFees = data.fees.filter(fee => fee.status === 'pending');
  const totalPendingAmount = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-40 w-40 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${darkMode ? 'dark' : ''} bg-custom-primary`}>
      {/* Sidebar */}
      <div 
        className={`bg-custom-secondary shadow-xl transition-all duration-300 border-r border-custom-primary ${sidebarCollapsed ? 'w-20' : 'w-80'}`}
        onMouseEnter={() => setSidebarCollapsed(false)}
        onMouseLeave={() => setSidebarCollapsed(true)}
      >
        <div className="px-8 h-[90px] flex flex-col justify-center items-center border-b border-custom-primary">
          {!sidebarCollapsed && <h2 className="text-3xl font-bold text-custom-primary">Student Portal</h2>}
        </div>
        <nav className="mt-8">
          {[
            { key: 'overview', label: 'Overview', icon: <BsBarChart /> },
            { key: 'profile', label: 'Profile', icon: <BsPerson /> },
            { key: 'courses', label: 'My Courses', icon: <BsBook /> },
            { key: 'assessments', label: 'Assessments', icon: <BsCalendar /> },
            { key: 'grades', label: 'Grades', icon: <BsGraphUp /> },
            { key: 'attendance', label: 'Attendance', icon: <BsCheckCircle /> },
            { key: 'fees', label: 'Fees & Payments', icon: <BsCash /> },
            { key: 'notifications', label: 'Notifications', icon: <BsBell /> },
            { key: 'health', label: 'Health Records', icon: <BsHospital /> },
            { key: 'behavior', label: 'Behavior Logs', icon: <BsExclamationTriangle /> },
            { key: 'study-materials', label: 'Study Materials', icon: <BsBook /> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full text-left px-8 py-6 text-custom-secondary hover:bg-custom-hover hover:text-custom-accent flex items-center transition-all duration-200 ${
                activeTab === key ? 'bg-custom-accent text-custom-accent border-r-4 border-custom-accent' : ''
              } ${sidebarCollapsed ? 'justify-center px-4' : ''}`}
            >
              <span className="mr-4 text-xl">{icon}</span>
              {!sidebarCollapsed && <span className="font-medium">{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-custom-secondary shadow-lg px-8 py-6 flex justify-between items-center border-b border-custom-primary">
          <h1 className="text-4xl font-bold text-custom-primary">
            {activeTab === 'overview' && 'Dashboard Overview'}
            {activeTab === 'profile' && 'My Profile'}
            {activeTab === 'courses' && 'My Courses'}
            {activeTab === 'assessments' && 'My Assessments'}
            {activeTab === 'grades' && 'Academic Performance'}
            {activeTab === 'attendance' && 'Attendance Records'}
            {activeTab === 'fees' && 'Fees & Payments'}
            {activeTab === 'notifications' && 'Notifications'}
            {activeTab === 'health' && 'Health Records'}
            {activeTab === 'behavior' && 'Behavior Logs'}
            {activeTab === 'study-materials' && 'Study Materials'}
          </h1>
          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 rounded-xl bg-custom-tertiary hover:bg-custom-hover transition-colors duration-200"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <BsSun className="text-2xl text-yellow-500" />
              ) : (
                <BsMoon className="text-2xl text-gray-600" />
              )}
            </button>

            <div className="relative">
              <div 
                className="flex items-center space-x-6 cursor-pointer p-3 rounded-xl hover:bg-custom-hover transition-colors"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="text-right">
                  <p className="text-base font-semibold text-custom-primary">{user?.username}</p>
                  <p className="text-sm text-custom-tertiary">{user?.email}</p>
                </div>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shadow-md border-4 border-blue-200">
                  {user?.profile_picture ? (
                    <img
                      src={`http://localhost:8000/storage/${user.profile_picture}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BsPerson className="text-5xl text-blue-600" />
                  )}
                </div>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-custom-secondary rounded-xl shadow-xl z-10 overflow-hidden border border-custom-primary">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="block w-full px-6 py-4 text-base text-custom-secondary hover:bg-custom-hover hover:text-custom-primary transition-colors text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-custom-primary p-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-custom-primary">
                  <div className="flex items-center">
                    <div className="p-6 rounded-xl bg-blue-100 text-blue-600 text-4xl shadow-md">
                      <BsBook />
                    </div>
                    <div className="ml-6">
                      <p className="text-base font-semibold text-custom-tertiary uppercase tracking-wide">Enrolled Courses</p>
                      <p className="text-4xl font-bold text-custom-primary">{data.courses.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-custom-primary">
                  <div className="flex items-center">
                    <div className="p-6 rounded-xl bg-green-100 text-green-600 text-4xl shadow-md">
                      <BsGraphUp />
                    </div>
                    <div className="ml-6">
                      <p className="text-base font-semibold text-custom-tertiary uppercase tracking-wide">Current GPA</p>
                      <p className="text-4xl font-bold text-custom-primary">{calculateGPA()}</p>
                      <p className="text-sm text-gray-500 mt-2">Simple average • 4.0 scale</p>
                    </div>
                  </div>
                </div>
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-custom-primary">
                  <div className="flex items-center">
                    <div className="p-6 rounded-xl bg-purple-100 text-purple-600 text-4xl shadow-md">
                      <BsCheckCircle />
                    </div>
                    <div className="ml-6">
                      <p className="text-base font-semibold text-custom-tertiary uppercase tracking-wide">Attendance</p>
                      <p className="text-4xl font-bold text-custom-primary">{calculateAttendancePercentage()}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-custom-primary">
                  <div className="flex items-center">
                    <div className="p-6 rounded-xl bg-orange-100 text-orange-600 text-4xl shadow-md">
                      <BsCash />
                    </div>
                    <div className="ml-6">
                      <p className="text-base font-semibold text-custom-tertiary uppercase tracking-wide">Pending Fees</p>
                      <p className="text-4xl font-bold text-custom-primary">${totalPendingAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-xl font-medium text-custom-primary mb-6 flex items-center">
                    <BsGraphUp className="mr-3 text-blue-600" />
                    Recent Grades
                  </h3>
                  <div className="space-y-4">
                    {data.grades.slice(0, 5).map((grade, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-custom-tertiary rounded-xl hover:bg-custom-hover transition-colors">
                        <span className="text-base text-custom-primary">{grade.assessment?.assessment_name}</span>
                        <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                          grade.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          grade.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {grade.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-xl font-medium text-custom-primary mb-6 flex items-center">
                    <BsBell className="mr-3 text-orange-600" />
                    Recent Notifications
                  </h3>
                  <div className="space-y-4">
                    {data.notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className="flex items-start space-x-6 p-4 bg-custom-tertiary rounded-xl hover:bg-custom-hover transition-colors">
                        <div className="shrink-0">
                          <span className="inline-block w-3 h-3 bg-blue-600 rounded-full"></span>
                        </div>
                        <div className="flex-1">
                          <p className="text-base font-medium text-custom-primary">{notification.title}</p>
                          <p className="text-sm text-custom-tertiary">{new Date(notification.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features Summary */}
              <div className="bg-custom-secondary rounded-xl shadow-md p-10 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                <h3 className="text-3xl font-bold text-custom-primary mb-10 text-center">Features Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsPerson />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Profile</p>
                        <p className="text-base text-custom-tertiary">ID: {data.profile?.student_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsBook />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">My Courses</p>
                        <p className="text-base text-custom-tertiary">{data.courses.length} courses enrolled</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsCalendar />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Assessments</p>
                        <p className="text-base text-custom-tertiary">{data.assessments.length} assessments</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsGraphUp />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Grades</p>
                        <p className="text-base text-custom-tertiary">{data.grades.length} assessments completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsCheckCircle />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Attendance</p>
                        <p className="text-base text-custom-tertiary">{data.attendance.filter(a => a.status === 'present').length} days present</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsCash />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Fees & Payments</p>
                        <p className="text-base text-custom-tertiary">{pendingFees.length} pending fees</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsBell />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Notifications</p>
                        <p className="text-base text-custom-tertiary">{data.notifications.filter(n => !n.is_read).length} unread messages</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsHospital />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Health Records</p>
                        <p className="text-base text-custom-tertiary">{data.healthRecords.length} health records</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-custom-tertiary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <div className="flex items-center mb-6">
                      <div className="p-4 rounded-xl bg-blue-100 text-blue-600 text-3xl">
                        <BsExclamationTriangle />
                      </div>
                      <div className="ml-6">
                        <p className="text-base font-semibold text-custom-primary uppercase tracking-wide">Behavior Logs</p>
                        <p className="text-base text-custom-tertiary">{data.behaviorLogs.length} behavior incidents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-2xl font-bold text-custom-primary mb-6 flex items-center">
                    <BsCheckCircle className="mr-4 text-blue-600" />
                    Attendance Trend
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={getAttendanceChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#e5e7eb"} />
                      <XAxis dataKey="date" tick={{ fontSize: 14, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 14, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#ffffff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Line type="monotone" dataKey="status" stroke="#2563eb" strokeWidth={4} dot={{ fill: '#2563eb', strokeWidth: 3, r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-2xl font-bold text-custom-primary mb-6 flex items-center">
                    <BsGraphUp className="mr-4 text-green-600" />
                    Grade Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={getGradeDistributionData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#4b5563" : "#e5e7eb"} />
                      <XAxis dataKey="range" tick={{ fontSize: 14, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                      <YAxis tick={{ fontSize: 14, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#ffffff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Bar dataKey="count" fill="#059669" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-2xl font-bold text-custom-primary mb-6 flex items-center">
                    <BsCash className="mr-4 text-orange-600" />
                    Fee Payment Status
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={getFeeStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getFeeStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: darkMode ? '#374151' : '#ffffff', 
                          border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          color: darkMode ? '#f3f4f6' : '#374151'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-custom-secondary rounded-xl shadow-md p-10 hover:shadow-lg transition-all duration-300 border border-custom-primary">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-bold text-custom-primary">Student Profile</h3>
                {!editMode ? (
                  <button
                    onClick={handleEditProfile}
                    className="px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold text-lg"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold text-lg disabled:bg-gray-400"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-8 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg font-semibold text-lg"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {errorMessage && (
                  <div className="mt-6 p-6 bg-red-100 border border-red-400 text-red-700 rounded-xl text-lg">
                    {errorMessage}
                  </div>
                )}
              </div>
              
              {/* Profile Picture Section */}
              <div className="mb-10 flex items-center space-x-10">
                <div className="w-40 h-40 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shadow-lg border-4 border-blue-200">
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
                    <BsPerson className="text-6xl text-blue-600" />
                  )}
                </div>
                {editMode && (
                  <div className="flex-1">
                    <label className="block text-xl font-semibold text-custom-primary mb-4">Profile Picture</label>
                    <label className="block w-full cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        key={editMode ? 'file-input' : 'file-input-reset'}
                        onChange={(e) => {
                          const file = e.target.files[0];
                          console.log('File selected:', file);
                          setProfilePictureFile(file);
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const dataUrl = e.target.result;
                              localStorage.setItem(`profile_picture_${user.id}`, dataUrl);
                              setLocalProfilePicture(dataUrl);
                              console.log('Profile picture saved to localStorage and state');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                      <div className="block w-full text-lg text-blue-600 file:mr-6 file:py-4 file:px-8 file:rounded-xl file:border-0 file:text-lg file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                        {profilePictureFile ? profilePictureFile.name : 'Click to select a file'}
                      </div>
                    </label>
                    <p className="mt-3 text-lg text-gray-500">PNG, JPG, GIF up to 4MB</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Student ID</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.student_id}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">First Name</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.first_name}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Last Name</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.last_name}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={editedUser.email || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 w-full text-gray-800"
                    />
                  ) : (
                    <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{user?.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Username</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="username"
                      value={editedUser.username || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                      className="text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 w-full text-gray-800"
                    />
                  ) : (
                    <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{user?.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Role</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{user?.role}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Date of Birth</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.date_of_birth ? new Date(data.profile.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Gender</label>
                  {editMode ? (
                    <select
                      name="gender"
                      value={editedProfile.gender || ''}
                      onChange={handleProfileChange}
                      className="text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 w-full text-gray-800"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.gender || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Phone</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="phone"
                      value={editedProfile.phone || ''}
                      onChange={handleProfileChange}
                      className="text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 w-full text-gray-800"
                    />
                  ) : (
                    <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.phone || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Address</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={editedProfile.address || ''}
                      onChange={handleProfileChange}
                      className="text-lg bg-white border-2 border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-4 w-full text-gray-800"
                    />
                  ) : (
                    <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.address || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Enrollment Date</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.enrollment_date ? new Date(data.profile.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Department</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Year</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.year || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Status</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.status || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-lg font-semibold text-custom-primary mb-2">Parent</label>
                  <p className="text-lg text-custom-primary bg-custom-tertiary p-4 rounded-xl">{data.profile?.parent?.username || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <DataTable
              title="My Enrolled Courses"
              data={data.courses}
              columns={[
                { key: 'course_code', label: 'Course Code' },
                { key: 'course_name', label: 'Course Name' },
                { key: 'credits', label: 'Credits' },
                { key: 'instructor', label: 'Instructor' },
                { key: 'department', label: 'Department' },
              ]}
            />
          )}

          {activeTab === 'assessments' && (
            <DataTable
              title="My Assessments"
              data={data.assessments}
              columns={[
                { key: 'assessment_name', label: 'Assessment Name' },
                { key: 'assessment_type', label: 'Type' },
                { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                { key: 'due_date', label: 'Due Date', render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
                { key: 'status', label: 'Status', render: (_, row) => {
                  const dueDate = new Date(row.due_date);
                  const today = new Date();
                  const hasGrade = data.grades.some(g => g.assessment_id === row.id);
                  if (hasGrade) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
                  if (dueDate < today) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue</span>;
                  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Upcoming</span>;
                }},
                { key: 'total_marks', label: 'Total Marks' },
                { key: 'weightage', label: 'Weightage (%)' },
              ]}
            />
          )}

          {activeTab === 'grades' && (
            <div className="space-y-8">
              {/* GPA Calculation Info */}
              <div className="bg-blue-50 border-l-8 border-blue-500 p-6 rounded-xl">
                <div className="flex">
                  <div className="shrink-0">
                    <BsGraphUp className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-blue-800">GPA Calculation Method</h3>
                    <div className="mt-3 text-lg text-blue-700">
                      <p><strong>Current GPA: {calculateGPA()}</strong></p>
                      <p>• Simple average of all assessment percentages</p>
                      <p>• Converted to 4.0 scale (100% = 4.0 GPA)</p>
                      <p>• All assessments weighted equally</p>
                    </div>
                  </div>
                </div>
              </div>

              <DataTable
                title="My Grades"
                data={data.grades}
                columns={[
                  { key: 'assessment.assessment_name', label: 'Assessment', render: (_, row) => row.assessment?.assessment_name },
                  { key: 'assessment.assessment_type', label: 'Type', render: (_, row) => row.assessment?.assessment_type },
                  { key: 'percentage', label: 'Grade (%)', render: (value) => (
                    <span className={`px-4 py-2 rounded-full text-lg font-medium ${
                      value >= 80 ? 'bg-green-100 text-green-800' :
                      value >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value}%
                    </span>
                  )},
                  { key: 'assessment.total_marks', label: 'Total Marks', render: (_, row) => row.assessment?.total_marks },
                  { key: 'assessment.due_date', label: 'Due Date', render: (_, row) => row.assessment?.due_date ? new Date(row.assessment.due_date).toLocaleDateString() : 'N/A' },
                ]}
              />
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-8">
              <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                <h3 className="text-2xl font-bold text-custom-primary mb-6">Attendance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-blue-600 mb-3">{calculateAttendancePercentage()}%</div>
                    <div className="text-lg text-custom-tertiary">Overall Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-green-600 mb-3">
                      {data.attendance.filter(a => a.status === 'present').length}
                    </div>
                    <div className="text-lg text-custom-tertiary">Present Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-5xl font-bold text-red-600 mb-3">
                      {data.attendance.filter(a => a.status === 'absent').length}
                    </div>
                    <div className="text-lg text-custom-tertiary">Absent Days</div>
                  </div>
                </div>
              </div>

              <DataTable
                title="Attendance Records"
                data={data.attendance}
                columns={[
                  { key: 'course.course_name', label: 'Course', render: (_, row) => row.course?.course_name },
                  { key: 'date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (value) => (
                    <span className={`px-4 py-2 rounded-full text-lg font-medium ${
                      value === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value}
                    </span>
                  )},
                ]}
              />
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-2xl font-bold text-custom-primary mb-6">Pending Fees</h3>
                  <div className="text-5xl font-bold text-orange-600 mb-3">${totalPendingAmount.toFixed(2)}</div>
                  <div className="text-lg text-custom-tertiary">{pendingFees.length} pending payments</div>
                </div>

                <div className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <h3 className="text-2xl font-bold text-custom-primary mb-6">Payment History</h3>
                  <div className="text-5xl font-bold text-green-600 mb-3">
                    ${data.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                  </div>
                  <div className="text-lg text-custom-tertiary">{data.payments.length} payments made</div>
                </div>
              </div>

              <DataTable
                title="Fee Details"
                data={data.fees}
                columns={[
                  { key: 'fee_type', label: 'Fee Type' },
                  { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
                  { key: 'due_date', label: 'Due Date', render: (value) => new Date(value).toLocaleDateString() },
                  { key: 'status', label: 'Status', render: (value) => (
                    <span className={`px-4 py-2 rounded-full text-lg font-medium ${
                      value === 'paid' ? 'bg-green-100 text-green-800' :
                      value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value}
                    </span>
                  )},
                ]}
              />

              <DataTable
                title="Payment History"
                data={data.payments}
                columns={[
                  { key: 'fee.fee_type', label: 'Fee Type', render: (_, row) => row.fee?.fee_type },
                  { key: 'amount', label: 'Amount', render: (value) => `$${value}` },
                  { key: 'payment_method', label: 'Method' },
                  { key: 'payment_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                ]}
              />
            </div>
          )}

          {activeTab === 'notifications' && (
            <DataTable
              title="Notifications"
              data={data.notifications}
              columns={[
                { key: 'title', label: 'Title' },
                { key: 'message', label: 'Message' },
                { key: 'type', label: 'Type' },
                { key: 'is_read', label: 'Status', render: (value) => value ? 'Read' : 'Unread' },
                { key: 'created_at', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
              ]}
              onMarkAsRead={handleMarkAsRead}
            />
          )}

          {activeTab === 'health' && (
            <DataTable
              title="Health Records"
              data={data.healthRecords}
              columns={[
                { key: 'record_type', label: 'Type' },
                { key: 'description', label: 'Description' },
                { key: 'record_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                { key: 'provider', label: 'Provider' },
              ]}
            />
          )}

          {activeTab === 'behavior' && (
            <DataTable
              title="Behavior Logs"
              data={data.behaviorLogs}
              columns={[
                { key: 'incident_type', label: 'Type' },
                { key: 'description', label: 'Description' },
                { key: 'incident_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                { key: 'severity', label: 'Severity' },
              ]}
            />
          )}

          {activeTab === 'study-materials' && (
            <div className="space-y-8">
              <div className="bg-blue-50 border-l-8 border-blue-500 p-6 rounded-xl">
                <div className="flex">
                  <div className="shrink-0">
                    <BsBook className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-bold text-blue-800">Study Materials</h3>
                    <div className="mt-3 text-lg text-blue-700">
                      <p>Access course materials uploaded by your instructors. Materials are organized by course and module. Click "Download" to save files to your device.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group materials by course and module */}
              {(() => {
                // Filter visible materials and group by course, then by module
                const visibleMaterials = data.studyMaterials.filter(material => material.is_visible);
                const groupedMaterials = visibleMaterials.reduce((acc, material) => {
                  const courseName = material.course?.course_name || 'Unknown Course';
                  const moduleName = material.module_name || 'General';

                  if (!acc[courseName]) {
                    acc[courseName] = {};
                  }
                  if (!acc[courseName][moduleName]) {
                    acc[courseName][moduleName] = [];
                  }
                  acc[courseName][moduleName].push(material);
                  return acc;
                }, {});

                return Object.entries(groupedMaterials).map(([courseName, modules]) => (
                  <div key={courseName} className="bg-custom-secondary rounded-xl shadow-md p-8 hover:shadow-lg transition-all duration-300 border border-custom-primary">
                    <h3 className="text-2xl font-bold text-custom-primary mb-6">{courseName}</h3>
                    {Object.entries(modules).map(([moduleName, materials]) => (
                      <div key={moduleName} className="mb-8 last:mb-0">
                        <h4 className="text-xl font-semibold text-custom-secondary mb-4 border-b pb-3">
                          {moduleName === 'General' ? 'General Materials' : `Module: ${moduleName}`}
                        </h4>
                        <div className="space-y-4">
                          {materials.map((material) => (
                            <div key={material.id} className="flex items-center justify-between p-6 bg-custom-tertiary rounded-xl hover:bg-custom-hover transition-colors">
                              <div className="flex-1">
                                <h5 className="text-lg font-semibold text-custom-primary">{material.title}</h5>
                                {material.description && (
                                  <p className="text-lg text-custom-tertiary mt-2">{material.description}</p>
                                )}
                                <div className="flex items-center space-x-6 mt-3 text-lg text-custom-tertiary">
                                  <span>{material.file_name}</span>
                                  <span>{material.file_type}</span>
                                  <span>{(material.file_size / 1024).toFixed(2)} KB</span>
                                  <span>Uploaded: {new Date(material.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleView(material)}
                                  className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleDownload(material)}
                                  className="px-6 py-3 bg-green-600 text-white text-lg rounded-xl hover:bg-green-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}

              {data.studyMaterials.filter(material => material.is_visible).length === 0 && (
                <div className="bg-custom-secondary rounded-xl shadow-md p-8 text-center hover:shadow-lg transition-all duration-300 border border-custom-primary">
                  <BsBook className="mx-auto h-16 w-16 text-gray-400" />
                  <h3 className="mt-4 text-xl font-bold text-custom-primary">No study materials available</h3>
                  <p className="mt-2 text-lg text-custom-tertiary">Study materials will appear here when your instructors upload them.</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// Reusable DataTable component
const DataTable = ({ title, data, columns, onMarkAsRead, onDownload }) => (
  <div className="bg-custom-secondary rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-custom-primary">
    <div className="px-10 py-8 border-b border-custom-primary bg-custom-tertiary">
      <h3 className="text-2xl font-bold text-custom-primary">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-custom-primary">
        <thead className="bg-custom-tertiary">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-10 py-6 text-left text-sm font-bold text-custom-secondary uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {(onMarkAsRead || onDownload) && (
              <th className="px-10 py-6 text-left text-sm font-bold text-custom-secondary uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-custom-secondary divide-y divide-custom-primary">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-custom-hover transition-colors duration-200">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-10 py-6 whitespace-nowrap text-lg text-custom-primary">
                  {col.render ? col.render(getNestedValue(row, col.key), row) : getNestedValue(row, col.key)}
                </td>
              ))}
              {(onMarkAsRead || onDownload) && (
                <td className="px-10 py-6 whitespace-nowrap text-lg font-medium space-x-3">
                  {onMarkAsRead && !row.is_read && (
                    <button
                      onClick={() => onMarkAsRead(row.id)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-lg font-medium rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <BsBell className="mr-2 text-xl" />
                      Mark as Read
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={() => onDownload(row)}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-lg font-medium rounded-xl hover:bg-green-700 transition-colors duration-200 shadow-md hover:shadow-lg"
                    >
                      <BsBook className="mr-2 text-xl" />
                      Download
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

// Helper function to get nested object values
const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export default StudentDashboard;