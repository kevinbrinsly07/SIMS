import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import request from 'superagent';
import { BsBarChart, BsPerson, BsBook, BsGraphUp, BsCheckCircle, BsCash, BsBell, BsHospital, BsExclamationTriangle, BsCalendar } from 'react-icons/bs';
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
    assessments: []
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
          'assessments'
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
          assessments: studentAssessments
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
      { name: 'Paid', value: paidFees, color: '#10B981' },
      { name: 'Pending', value: pendingFees, color: '#EF4444' }
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

  const pendingFees = data.fees.filter(fee => fee.status === 'pending');
  const totalPendingAmount = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
              {localProfilePicture ? (
                <img
                  src={localProfilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : user?.profile_picture ? (
                <img
                  src={`http://localhost:8000/storage/${user.profile_picture}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <BsPerson className="text-2xl text-gray-600" />
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-800">Student Portal</h2>
              <p className="text-sm text-gray-600 mt-2">
                {data.profile?.first_name} {data.profile?.last_name}
              </p>
              <p className="text-xs text-gray-500">{data.profile?.student_id}</p>
            </div>
          </div>
        </div>
        <nav className="mt-6">
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
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center ${
                activeTab === key ? 'bg-gray-200 text-gray-900 border-r-4 border-indigo-600' : ''
              }`}
            >
              <span className="mr-3">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
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
          </h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-500 text-white text-2xl"><BsBook /></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                      <p className="text-2xl font-semibold text-gray-900">{data.courses.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-500 text-white text-2xl"><BsGraphUp /></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Current GPA</p>
                      <p className="text-2xl font-semibold text-gray-900">{calculateGPA()}</p>
                      <p className="text-xs text-gray-500 mt-1">Simple average • 4.0 scale</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-500 text-white text-2xl"><BsCheckCircle /></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Attendance</p>
                      <p className="text-2xl font-semibold text-gray-900">{calculateAttendancePercentage()}%</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-500 text-white text-2xl"><BsCash /></div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Fees</p>
                      <p className="text-2xl font-semibold text-gray-900">${totalPendingAmount.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Grades</h3>
                  <div className="space-y-3">
                    {data.grades.slice(0, 5).map((grade, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{grade.assessment?.assessment_name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    {data.notifications.slice(0, 5).map((notification, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="shrink-0">
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Features Summary */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Features Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-blue-500 text-white text-2xl"><BsPerson /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Profile</p>
                        <p className="text-sm text-gray-900">ID: {data.profile?.student_id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-green-500 text-white text-2xl"><BsBook /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">My Courses</p>
                        <p className="text-sm text-gray-900">{data.courses.length} courses enrolled</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-500 text-white text-2xl"><BsCalendar /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Assessments</p>
                        <p className="text-sm text-gray-900">{data.assessments.length} assessments</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-purple-500 text-white text-2xl"><BsGraphUp /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Grades</p>
                        <p className="text-sm text-gray-900">{data.grades.length} assessments completed</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-yellow-500 text-white text-2xl"><BsCheckCircle /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Attendance</p>
                        <p className="text-sm text-gray-900">{data.attendance.filter(a => a.status === 'present').length} days present</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-red-500 text-white text-2xl"><BsCash /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Fees & Payments</p>
                        <p className="text-sm text-gray-900">{pendingFees.length} pending fees</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-indigo-500 text-white text-2xl"><BsBell /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Notifications</p>
                        <p className="text-sm text-gray-900">{data.notifications.filter(n => !n.is_read).length} unread messages</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-teal-500 text-white text-2xl"><BsHospital /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Health Records</p>
                        <p className="text-sm text-gray-900">{data.healthRecords.length} health records</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <div className="p-3 rounded-full bg-orange-500 text-white text-2xl"><BsExclamationTriangle /></div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Behavior Logs</p>
                        <p className="text-sm text-gray-900">{data.behaviorLogs.length} behavior incidents</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={getAttendanceChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="status" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={getGradeDistributionData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Fee Payment Status</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={getFeeStatusData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {getFeeStatusData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Student Profile</h3>
                {!editMode ? (
                  <button
                    onClick={handleEditProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {errorMessage && (
                  <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errorMessage}
                  </div>
                )}
              </div>
              
              {/* Profile Picture Section */}
              <div className="mb-6 flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                  {localProfilePicture ? (
                    <img
                      src={localProfilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profile_picture ? (
                    <img
                      src={`http://localhost:8000/storage/${user.profile_picture}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BsPerson className="text-3xl text-gray-600" />
                  )}
                </div>
                {editMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
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
                      <div className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {profilePictureFile ? profilePictureFile.name : 'Click to select a file'}
                      </div>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 4MB</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.student_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.first_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.last_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {editMode ? (
                    <input
                      type="email"
                      name="email"
                      value={editedUser.email || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="username"
                      value={editedUser.username || ''}
                      onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.role}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.date_of_birth ? new Date(data.profile.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  {editMode ? (
                    <select
                      name="gender"
                      value={editedProfile.gender || ''}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{data.profile?.gender || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="phone"
                      value={editedProfile.phone || ''}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{data.profile?.phone || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  {editMode ? (
                    <input
                      type="text"
                      name="address"
                      value={editedProfile.address || ''}
                      onChange={handleProfileChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{data.profile?.address || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enrollment Date</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.enrollment_date ? new Date(data.profile.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.department || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.year || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.status || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent</label>
                  <p className="mt-1 text-sm text-gray-900">{data.profile?.parent?.username || 'N/A'}</p>
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
            <div className="space-y-6">
              {/* GPA Calculation Info */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="shrink-0">
                    <BsGraphUp className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">GPA Calculation Method</h3>
                    <div className="mt-2 text-sm text-blue-700">
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{calculateAttendancePercentage()}%</div>
                    <div className="text-sm text-gray-600">Overall Attendance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {data.attendance.filter(a => a.status === 'present').length}
                    </div>
                    <div className="text-sm text-gray-600">Present Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {data.attendance.filter(a => a.status === 'absent').length}
                    </div>
                    <div className="text-sm text-gray-600">Absent Days</div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Fees</h3>
                  <div className="text-3xl font-bold text-red-600 mb-2">${totalPendingAmount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">{pendingFees.length} pending payments</div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${data.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">{data.payments.length} payments made</div>
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
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
        </main>
      </div>
    </div>
  );
};

// Reusable DataTable component
const DataTable = ({ title, data, columns, onMarkAsRead }) => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-200">
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {col.label}
              </th>
            ))}
            {onMarkAsRead && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(getNestedValue(row, col.key), row) : getNestedValue(row, col.key)}
                </td>
              ))}
              {onMarkAsRead && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {!row.is_read && (
                    <button
                      onClick={() => onMarkAsRead(row.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Mark as Read
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