import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Student, AcademicReport } from '../types';
import { Lock, User, LogOut, FileText, TrendingUp, AlertTriangle, CheckCircle, Search, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function StudentPortal() {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Logged in student state
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<AcademicReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Authenticate student locally via Firestore credentials
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!studentIdInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Please enter both student ID and password.');
      return;
    }

    setIsLoggingIn(true);
    setErrorMsg('');

    try {
      // Query the student collection in Firestore
      const studentIdClean = studentIdInput.trim().toUpperCase();
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('studentId', '==', studentIdClean));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMsg('Invalid Student ID or Password. Please try again.');
        setIsLoggingIn(false);
        return;
      }

      let foundStudent: Student | null = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === passwordInput) {
          foundStudent = { id: doc.id, ...data } as Student;
        }
      });

      if (!foundStudent) {
        setErrorMsg('Invalid Student ID or Password. Please try again.');
        setIsLoggingIn(false);
        return;
      }

      // Success! Lock session
      setStudent(foundStudent);
      fetchStudentReports(foundStudent.studentId);
    } catch (error) {
      console.error('Error during student login:', error);
      setErrorMsg('An error occurred. Check connection or try again.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function fetchStudentReports(stuId: string) {
    setReportsLoading(true);
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('studentId', '==', stuId));
      const querySnapshot = await getDocs(q);
      
      const fetched: AcademicReport[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as AcademicReport);
      });

      // Sort by academic year and term
      fetched.sort((a, b) => b.academicYear.localeCompare(a.academicYear) || b.term.localeCompare(a.term));
      
      setReports(fetched);
      if (fetched.length > 0) {
        setSelectedReportId(fetched[0].id || null);
      }
    } catch (err) {
      console.error('Error getting reports:', err);
    } finally {
      setReportsLoading(false);
    }
  }

  function handleLogout() {
    setStudent(null);
    setReports([]);
    setSelectedReportId(null);
    setStudentIdInput('');
    setPasswordInput('');
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Render Login state
  if (!student) {
    return (
      <div id="student-login-view" className="max-w-md mx-auto my-12">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-800">Student Portal Login</h2>
            <p className="text-sm text-slate-500">Enter your official credentials to view your reports and GPA</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-medium rounded-xl border border-red-100 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="stu-id-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Student ID</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="stu-id-input"
                  type="text"
                  placeholder="e.g. STU-2026-001"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stu-pass-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Secret Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="stu-pass-input"
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              id="btn-student-login-submit"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              {isLoggingIn ? 'Verifying...' : 'Access My Portal'}
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Credentials are set up and provided only by the school registrar's office.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render Logged in Student Dashboard
  return (
    <div id="student-portal-dashboard" className="space-y-8">
      {/* Student Welcome Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg">
              {student.name.charAt(0)}
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">
                Welcome, {student.name}!
              </h1>
              <p className="text-xs text-slate-500 font-mono tracking-wider">INDIVIDUAL STUDENT SCHOLAR ACCESS</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border">
              ID#: <strong className="font-mono text-slate-700">{student.studentId}</strong>
            </span>
            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border">
              Grade: <strong className="text-slate-700">{student.gradeLevel}</strong>
            </span>
            <span className="bg-slate-50 px-2.5 py-1 rounded-lg border">
              Gender: <strong className="text-slate-700">{student.gender}</strong>
            </span>
          </div>
        </div>

        <button 
          id="btn-student-logout"
          onClick={handleLogout}
          className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {reportsLoading ? (
        <div className="animate-pulse bg-white border h-60 rounded-2xl" />
      ) : reports.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 space-y-4">
          <FileText size={48} className="mx-auto text-slate-300" />
          <h2 className="font-display text-lg font-bold text-slate-800">No report cards available</h2>
          <p className="text-sm max-w-md mx-auto">
            Your assessments and report cards are currently being calculated by the academic board. Please check back soon or notify your classroom teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar selector for academic term report cards */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wider font-mono">Available Reports</h3>
            <div className="space-y-2">
              {reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id || null)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedReportId === rep.id 
                      ? 'border-blue-500 bg-blue-50/50 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-sm">{rep.term}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      rep.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>Year: {rep.academicYear}</span>
                    <span>GPA: <strong className="text-slate-700 font-mono">{rep.gpa.toFixed(2)}</strong></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active selected report display card */}
          {selectedReport && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Summary row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Average score</span>
                    <p className={`text-2xl font-bold mt-1 ${selectedReport.average < 74 ? 'text-red-600' : 'text-blue-600'}`}>
                      {selectedReport.average.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${selectedReport.average < 74 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <TrendingUp size={20} />
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Calculated GPA</span>
                    <p className="text-2xl font-bold mt-1 text-indigo-700">
                      {selectedReport.gpa.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <CheckCircle size={20} />
                  </div>
                </div>

                <div className={`border rounded-xl p-5 flex items-center justify-between shadow-sm ${
                  selectedReport.status === 'Pass' ? 'bg-emerald-50/55 border-emerald-100' : 'bg-red-50/55 border-red-100'
                }`}>
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">Assessment Result</span>
                    <p className={`text-2xl font-bold mt-1 ${selectedReport.status === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {selectedReport.status}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${selectedReport.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-850'}`}>
                    {selectedReport.status === 'Pass' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                  </div>
                </div>
              </div>

              {/* Fail safety message */}
              {selectedReport.average < 74 && (
                <div className="p-4 bg-red-100/60 border border-red-200 text-red-800 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="shrink-0 text-red-600 mt-0.5" size={18} />
                  <div>
                    <p className="font-bold text-sm">Academic Warning Indicator</p>
                    <p className="text-xs mt-0.5">
                      Your average score of {selectedReport.average.toFixed(1)}% is below our school's 74% passing threshold. Please configure additional tutoring or meet with your grade instructor. <strong>Learning is not just the goal, we also inspire!</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Grades Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h4 className="font-display font-bold text-slate-800">Academic Grading Breakdown</h4>
                  <span className="text-slate-400 text-xs font-mono">{selectedReport.term} ({selectedReport.academicYear})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs text-slate-400 uppercase font-mono bg-slate-50/20">
                        <th className="py-3 px-5 font-semibold">Subject / course</th>
                        <th className="py-3 px-5 font-semibold text-center">Score (0-100)</th>
                        <th className="py-3 px-5 font-semibold text-center">Letter Grade</th>
                        <th className="py-3 px-5 font-semibold text-center">Grade Point</th>
                        <th className="py-3 px-5 font-semibold">Comments / Suggestions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {selectedReport.grades.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/30">
                          <td className="py-3.5 px-5 font-semibold text-slate-800">{g.subject}</td>
                          <td className="py-3.5 px-5 text-center font-mono font-medium">
                            <span className={g.score < 74 ? 'text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100' : 'text-slate-800'}>
                              {g.score}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <span className={`px-2 py-0.5 font-bold rounded-md ${
                              g.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                              g.grade === 'B' ? 'bg-indigo-100 text-indigo-700' :
                              g.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {g.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center font-mono font-semibold text-slate-600">{g.gradePoint.toFixed(1)}</td>
                          <td className="py-3.5 px-5 text-slate-500 italic text-xs max-w-xs truncate" title={g.comments}>
                            {g.comments || 'No remarks provided.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Liberian High School Grading Framework Legend */}
              <div className="bg-slate-50 border rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">DASBMSE Grading Scale</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
                    <span>A: 90 - 100 (4.0 GP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-505 shrink-0" style={{backgroundColor: '#6366f1'}} />
                    <span>B: 80 - 89 (3.0 GP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span className="w-2.5 h-2.5 rounded" style={{backgroundColor: '#f59e0b'}} />
                    <span>C: 74 - 79 (2.0 GP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded bg-red-600 shrink-0" />
                    <span>F: Below 74 (0.0 Fail)</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
