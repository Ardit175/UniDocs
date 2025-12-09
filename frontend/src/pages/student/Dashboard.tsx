import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Card from '../../components/Card';
import Button from '../../components/Button';
import api from '../../services/api';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'subjects'>('overview');
  const [stats, setStats] = useState({
    gpa: 0,
    totalCredits: 0,
    completedCredits: 0,
    currentSemester: 0,
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, documentsRes, gradesRes, subjectsRes] = await Promise.all([
        api.get('/api/students/statistics'),
        api.get('/api/documents'),
        api.get('/api/students/grades'),
        api.get('/api/students/subjects'),
      ]);

      // Backend returns: {statistics: {gpa, completed_credits, total_enrolled_credits, current_year}}
      const statistics = statsRes.data.statistics;
      setStats({
        gpa: parseFloat(Number(statistics.gpa || 0).toFixed(2)),
        totalCredits: Number(statistics.total_enrolled_credits || 0),
        completedCredits: Number(statistics.completed_credits || 0),
        currentSemester: statistics.current_year || 1,
      });

      setDocuments(documentsRes.data.documents || []);
      setGrades(gradesRes.data.grades || []);
      setSubjects(subjectsRes.data.subjects || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async (type: string) => {
    setGenerating(type);
    try {
      let response;
      if (type === 'enrollment') {
        response = await api.post('/api/documents/certificate-enrollment');
      } else if (type === 'transcript') {
        response = await api.post('/api/documents/transcript');
      } else if (type === 'verification') {
        const purpose = prompt('Please enter the purpose for this verification letter:');
        if (!purpose || purpose.length < 10) {
          alert('Purpose must be at least 10 characters');
          return;
        }
        response = await api.post('/api/documents/verification-letter', { purpose });
      }

      if (response?.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
        loadData(); // Reload to show new document
      }
    } catch (error: any) {
      console.error('Failed to generate document:', error);
      alert(error.response?.data?.error || 'Failed to generate document');
    } finally {
      setGenerating(null);
    }
  };

  const downloadDocument = async (docId: string) => {
    try {
      const response = await api.get(`/api/documents/${docId}`);
      if (response.data.downloadUrl) {
        window.open(response.data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Student Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">GPA</p>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.gpa}</p>
          <p className="text-xs text-gray-500 mt-1">Out of 10.0</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Credits</p>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalCredits}</p>
          <p className="text-xs text-gray-500 mt-1">ECTS Required</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Completed</p>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completedCredits}</p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round((stats.completedCredits / stats.totalCredits) * 100)}% Complete
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Semester</p>
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.currentSemester}</p>
          <p className="text-xs text-gray-500 mt-1">Current Period</p>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'grades'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Grades
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'subjects'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Subjects
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
      <>
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            variant="secondary" 
            className="justify-start"
            onClick={() => generateDocument('enrollment')}
            isLoading={generating === 'enrollment'}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Enrollment Certificate
          </Button>
          <Button 
            variant="secondary" 
            className="justify-start"
            onClick={() => generateDocument('transcript')}
            isLoading={generating === 'transcript'}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Transcript
          </Button>
          <Button 
            variant="secondary" 
            className="justify-start"
            onClick={() => generateDocument('verification')}
            isLoading={generating === 'verification'}
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
            </svg>
            Student Verification
          </Button>
        </div>
      </Card>

      {/* Recent Documents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        {documents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No documents yet. Generate your first document above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {doc.document_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    doc.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {doc.status === 'active' ? 'Valid' : 'Revoked'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => downloadDocument(doc.id)}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      </>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade History</h2>
          {grades.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No grades available yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedagogue</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{grade.subject_name_en}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.subject_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.credits}</td>
                      <td className="px-4 py-3 text-sm font-semibold">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          grade.grade >= 8 ? 'bg-green-100 text-green-700' :
                          grade.grade >= 6 ? 'bg-blue-100 text-blue-700' :
                          grade.grade >= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.assessment}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.viti_akademik} S{grade.semestri}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{grade.pedagogue_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Subjects Tab */}
      {activeTab === 'subjects' && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Subjects</h2>
          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No subjects enrolled yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {subjects.map((subject) => (
                <div key={subject.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{subject.name_en}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {subject.code}
                        </span>
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded">
                          {subject.credits} ECTS
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Pedagogue: {subject.pedagogue_name || 'TBA'}</p>
                        <p>Academic Year: {subject.academic_year} - Semester {subject.semestri}</p>
                        {subject.attendance && (
                          <p>Attendance: {subject.attendance}%</p>
                        )}
                      </div>
                    </div>
                    {subject.grade && (
                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-lg font-semibold ${
                          subject.grade >= 8 ? 'bg-green-100 text-green-700' :
                          subject.grade >= 6 ? 'bg-blue-100 text-blue-700' :
                          subject.grade >= 5 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {subject.grade}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{subject.assessment}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </DashboardLayout>
  );
}
