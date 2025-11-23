import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BsBarChart, BsPerson, BsBook, BsGraphUp, BsCheckCircle, BsCash, BsBell, BsHospital, BsExclamationTriangle } from 'react-icons/bs';

const ParentDashboard = ({ user, onLogout }) => {
  const [data, setData] = useState({
    children: [],
    selectedChild: null,
    childData: {
      profile: null,
      courses: [],
      grades: [],
      attendance: [],
      fees: [],
      payments: [],
      notifications: [],
      healthRecords: [],
      behaviorLogs: []
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchChildren = async () => {
    try {
      // Assuming parent relationship exists in user model
      const childrenRes = await axios.get(`parent/${user.id}/children`);
      setData(prev => ({
        ...prev,
        children: childrenRes.data,
        selectedChild: childrenRes.data[0] || null
      }));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching children:', err);
      setLoading(false);
    }
  };

  const fetchChildData = useCallback(async (childId) => {
    if (!childId) return;

    try {
      const endpoints = [
        `students/${childId}`,
        `students/${childId}/courses`,
        `students/${childId}/grades`,
        `students/${childId}/attendance`,
        `students/${childId}/fees`,
        `students/${childId}/payments`,
        `students/${childId}/notifications`,
        `students/${childId}/health-records`,
        `students/${childId}/behavior-logs`
      ];

      const responses = await Promise.all(
        endpoints.map(endpoint => axios.get(endpoint))
      );

      setData(prev => ({
        ...prev,
        childData: {
          profile: responses[0].data,
          courses: responses[1].data,
          grades: responses[2].data,
          attendance: responses[3].data,
          fees: responses[4].data,
          payments: responses[5].data,
          notifications: responses[6].data,
          healthRecords: responses[7].data,
          behaviorLogs: responses[8].data
        }
      }));
    } catch (err) {
      console.error('Error fetching child data:', err);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data.selectedChild) {
      fetchChildData(data.selectedChild.id);
    }
  }, [data.selectedChild, fetchChildData]);

  const calculateAttendancePercentage = () => {
    if (data.childData.attendance.length === 0) return 0;
    const presentCount = data.childData.attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / data.childData.attendance.length) * 100);
  };

  const calculateGPA = () => {
    if (data.childData.grades.length === 0) return 0;
    const totalPoints = data.childData.grades.reduce((sum, grade) => {
      const points = grade.percentage >= 90 ? 4.0 :
                    grade.percentage >= 80 ? 3.0 :
                    grade.percentage >= 70 ? 2.0 :
                    grade.percentage >= 60 ? 1.0 : 0.0;
      return sum + points;
    }, 0);
    return (totalPoints / data.childData.grades.length).toFixed(2);
  };

  const pendingFees = data.childData.fees.filter(fee => fee.status === 'pending');
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
          <h2 className="text-2xl font-bold text-gray-800">Parent Portal</h2>
        </div>

        {/* Child Selector */}
        {data.children.length > 0 && (
          <div className="px-6 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
            <select
              value={data.selectedChild?.id || ''}
              onChange={(e) => {
                const child = data.children.find(c => c.id === parseInt(e.target.value));
                setData(prev => ({ ...prev, selectedChild: child }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {data.children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="mt-6">
          {[
            { key: 'overview', label: 'Overview', icon: <BsBarChart /> },
            { key: 'profile', label: 'Child Profile', icon: <BsPerson /> },
            { key: 'courses', label: 'Courses', icon: <BsBook /> },
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
            {activeTab === 'overview' && 'Child Progress Overview'}
            {activeTab === 'profile' && 'Child Profile'}
            {activeTab === 'courses' && 'Enrolled Courses'}
            {activeTab === 'grades' && 'Academic Performance'}
            {activeTab === 'attendance' && 'Attendance Records'}
            {activeTab === 'fees' && 'Fees & Payments'}
            {activeTab === 'notifications' && 'Notifications'}
            {activeTab === 'health' && 'Health Records'}
            {activeTab === 'behavior' && 'Behavior Logs'}
          </h1>
          <div className="relative">
            <div 
              className="flex items-center space-x-4 cursor-pointer"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <BsPerson className="text-lg text-gray-600" />
              </div>
            </div>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {!data.selectedChild ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No children found in your account.</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Child Info */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {data.childData.profile?.first_name} {data.childData.profile?.last_name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{data.childData.courses.length}</div>
                        <div className="text-sm text-gray-600">Courses</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{calculateGPA()}</div>
                        <div className="text-sm text-gray-600">GPA</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{calculateAttendancePercentage()}%</div>
                        <div className="text-sm text-gray-600">Attendance</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">${totalPendingAmount.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Pending Fees</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Academic Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Current GPA</span>
                          <span className="text-sm font-medium">{calculateGPA()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Courses Passed</span>
                          <span className="text-sm font-medium">
                            {data.childData.grades.filter(g => g.percentage >= 60).length}/{data.childData.grades.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Attendance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Overall</span>
                          <span className="text-sm font-medium">{calculateAttendancePercentage()}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Days Present</span>
                          <span className="text-sm font-medium">
                            {data.childData.attendance.filter(a => a.status === 'present').length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Financial Status</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Pending Fees</span>
                          <span className="text-sm font-medium text-red-600">${totalPendingAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Paid This Month</span>
                          <span className="text-sm font-medium text-green-600">
                            ${data.childData.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Grades</h3>
                      <div className="space-y-3">
                        {data.childData.grades.slice(0, 5).map((grade, index) => (
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
                        {data.childData.notifications.slice(0, 5).map((notification, index) => (
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
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-6">Child Profile</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="mt-1 text-sm text-gray-900">{data.childData.profile?.first_name} {data.childData.profile?.last_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student ID</label>
                      <p className="mt-1 text-sm text-gray-900">{data.childData.profile?.student_id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="mt-1 text-sm text-gray-900">{data.childData.profile?.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year</label>
                      <p className="mt-1 text-sm text-gray-900">{data.childData.profile?.year}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-sm text-gray-900">{data.childData.profile?.date_of_birth ? new Date(data.childData.profile.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <DataTable
                  title="Enrolled Courses"
                  data={data.childData.courses}
                  columns={[
                    { key: 'course_code', label: 'Course Code' },
                    { key: 'course_name', label: 'Course Name' },
                    { key: 'credits', label: 'Credits' },
                    { key: 'instructor', label: 'Instructor' },
                    { key: 'department', label: 'Department' },
                  ]}
                />
              )}

              {activeTab === 'grades' && (
                <DataTable
                  title="Academic Performance"
                  data={data.childData.grades}
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
                          {data.childData.attendance.filter(a => a.status === 'present').length}
                        </div>
                        <div className="text-sm text-gray-600">Present Days</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-red-600">
                          {data.childData.attendance.filter(a => a.status === 'absent').length}
                        </div>
                        <div className="text-sm text-gray-600">Absent Days</div>
                      </div>
                    </div>
                  </div>

                  <DataTable
                    title="Attendance Records"
                    data={data.childData.attendance}
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
                        ${data.childData.payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">{data.childData.payments.length} payments made</div>
                    </div>
                  </div>

                  <DataTable
                    title="Fee Details"
                    data={data.childData.fees}
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
                    data={data.childData.payments}
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
                  data={data.childData.notifications}
                  columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'message', label: 'Message' },
                    { key: 'type', label: 'Type' },
                    { key: 'is_read', label: 'Status', render: (value) => value ? 'Read' : 'Unread' },
                    { key: 'created_at', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                  ]}
                />
              )}

              {activeTab === 'health' && (
                <DataTable
                  title="Health Records"
                  data={data.childData.healthRecords}
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
                  data={data.childData.behaviorLogs}
                  columns={[
                    { key: 'incident_type', label: 'Type' },
                    { key: 'description', label: 'Description' },
                    { key: 'incident_date', label: 'Date', render: (value) => new Date(value).toLocaleDateString() },
                    { key: 'severity', label: 'Severity' },
                  ]}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

// Reusable DataTable component
const DataTable = ({ title, data, columns }) => (
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

export default ParentDashboard;