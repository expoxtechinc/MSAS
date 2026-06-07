import { useState, FormEvent } from 'react';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, AcademicReport } from '../types';
import { 
  Lock, User, LogOut, FileText, TrendingUp, AlertTriangle, 
  CheckCircle, Plus, Info, Printer, ShieldAlert, Sparkles, 
  Smartphone, Mail, Calendar, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentPortal() {
  // Login State
  const [studentIdInput, setStudentIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Tab within authentication screen: 'login' | 'signup'
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');

  // Sign Up form states
  const [signUpName, setSignUpName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpGrade, setSignUpGrade] = useState('Grade 10');
  const [signUpGender, setSignUpGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpDob, setSignUpDob] = useState('');
  const [signUpGuardianName, setSignUpGuardianName] = useState('');
  const [signUpGuardianPhone, setSignUpGuardianPhone] = useState('');
  const [signUpAddress, setSignUpAddress] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccessPayload, setRegisterSuccessPayload] = useState<Student | null>(null);

  // Logged in student state
  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<AcademicReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // List of high school grades
  const availableGrades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  // Authentication Login Handler
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (!studentIdInput.trim() || !passwordInput.trim()) {
      setLoginError('Please supply both Student ID and your Password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      const studentIdClean = studentIdInput.trim().toUpperCase();
      const studentsRef = collection(db, 'students');
      const q = query(studentsRef, where('studentId', '==', studentIdClean));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setLoginError('Scholar ID lookup failed. Please double-check credentials.');
        setIsLoggingIn(false);
        return;
      }

      let foundStudent: Student | null = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.password === passwordInput.trim()) {
          foundStudent = { id: doc.id, ...data } as Student;
        }
      });

      if (!foundStudent) {
        setLoginError('Incorrect password code. Access to grades denied.');
        setIsLoggingIn(false);
        return;
      }

      // Login success
      setStudent(foundStudent);
      fetchStudentReports(foundStudent.studentId);
    } catch (error) {
      console.error('Error during student log:', error);
      setLoginError('Database timeout. Please check your network and retry.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  // Self Registration Signup Handler
  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    if (!signUpName.trim() || !signUpPassword.trim()) {
      alert('Please fill out all mandatory signup parameters.');
      return;
    }

    setIsRegistering(true);

    try {
      // Auto generate official structured unique Scholar ID
      const yearPrefix = new Date().getFullYear();
      const randomSuf = Math.floor(100 + Math.random() * 900); // 3 digit unique
      const generatedStuId = `STU-${yearPrefix}-${randomSuf}`;

      const studentPayload: Student = {
        studentId: generatedStuId,
        name: signUpName.trim(),
        password: signUpPassword.trim(),
        gradeLevel: signUpGrade,
        gender: signUpGender,
        email: signUpEmail.trim() || undefined,
        phone: signUpPhone.trim() || undefined,
        guardianName: signUpGuardianName.trim() || undefined,
        guardianPhone: signUpGuardianPhone.trim() || undefined,
        dateOfBirth: signUpDob || undefined,
        homeAddress: signUpAddress.trim() || undefined,
        createdAt: new Date()
      };

      // Push to Firestore database with the Student ID as document reference
      await setDoc(doc(db, 'students', generatedStuId), studentPayload);
      
      setRegisterSuccessPayload(studentPayload);

      // Reset signup inputs
      setSignUpName('');
      setSignUpPassword('');
      setSignUpEmail('');
      setSignUpPhone('');
      setSignUpDob('');
      setSignUpGuardianName('');
      setSignUpGuardianPhone('');
      setSignUpAddress('');
    } catch (err) {
      console.error(err);
      alert('Error creating your scholar credentials. Retry when network is live.');
    } finally {
      setIsRegistering(false);
    }
  }

  // Fetch report cards from db
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
    setRegisterSuccessPayload(null);
  }

  const selectedReport = reports.find(r => r.id === selectedReportId);

  // Trigger print-ready official transcript window printing
  const handlePrint = () => {
    window.print();
  };

  // Render Authentication Section (Login & Signup)
  if (!student) {
    return (
      <div id="student-login-view" className="max-w-2xl mx-auto my-12">
        
        {/* Registration Success Overlay Dialog */}
        <AnimatePresence>
          {registerSuccessPayload && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 shadow-2xl mb-8 space-y-6 text-center"
            >
              <div className="w-16 h-16 bg-blue-950 text-blue-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Sparkles size={30} className="animate-spin-slow" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase font-bold">Registration Complete</span>
                <h3 className="font-display text-2xl font-extrabold">Welcome to the Portal!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Excellent! Your scholar profile was compiled safely. Keep your unique official ID and passcode written somewhere safe to avoid lockout.
                </p>
              </div>

              {/* ID Badge Container */}
              <div className="bg-slate-850 p-6 rounded-2xl border border-slate-800 max-w-md mx-auto space-y-3 text-left">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-400 font-mono">OFFICIAL SCHOLAR ID</span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-400 px-2 py-0.5 font-bold rounded">Active</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Name: <strong className="text-white text-sm">{registerSuccessPayload.name}</strong></p>
                  <p className="text-xs text-slate-400">Assigned ID: <strong className="font-mono text-blue-400 text-sm tracking-wider">{registerSuccessPayload.studentId}</strong></p>
                  <p className="text-xs text-slate-400">Grade Level: <strong className="text-white">{registerSuccessPayload.gradeLevel}</strong></p>
                  <p className="text-xs text-slate-400">Passcode: <strong className="text-slate-300 font-mono">{registerSuccessPayload.password}</strong></p>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button 
                  onClick={() => {
                    setStudentIdInput(registerSuccessPayload.studentId);
                    setPasswordInput(registerSuccessPayload.password);
                    setAuthTab('login');
                    setRegisterSuccessPayload(null);
                  }}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Confirm and Log In
                </button>
                <button 
                  onClick={() => setRegisterSuccessPayload(null)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Dismiss Badge
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white border text-slate-800 border-slate-100 rounded-[32px] overflow-hidden shadow-md">
          
          {/* Header Switch Toggles */}
          <div className="flex border-b border-slate-100 text-sm">
            <button 
              onClick={() => { setAuthTab('login'); setLoginError(''); }}
              className={`flex-1 py-4 font-bold text-center border-b-2 transition-all cursor-pointer ${
                authTab === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In to My Portal
            </button>
            <button 
              onClick={() => { setAuthTab('signup'); setLoginError(''); }}
              className={`flex-1 py-4 font-bold text-center border-b-2 transition-all cursor-pointer ${
                authTab === 'signup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Self-Register / Scholar Signup
            </button>
          </div>

          <div className="p-8 md:p-10 space-y-6">

            {/* ERROR STATEMENTS */}
            {loginError && (
              <div className="p-3 bg-red-50 text-red-650 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            {/* TAB 1: PORTAL LOGIN */}
            {authTab === 'login' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Lock size={24} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-850">Student Portal Entrance</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Access your official performance evaluations, term trends, and printable grade sheets.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto">
                  <div className="space-y-1.5">
                    <label htmlFor="stu-id-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Scholar ID Reference</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="stu-id-input"
                        type="text"
                        placeholder="e.g. STU-2026-101"
                        value={studentIdInput}
                        onChange={(e) => setStudentIdInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="stu-pass-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Secured Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        id="stu-pass-input"
                        type="password"
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    id="btn-student-login-submit"
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-xs md:text-sm mt-3"
                  >
                    {isLoggingIn ? 'Verifying Account...' : 'Lock Session & Login'}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: PORTAL SIGNUP */}
            {authTab === 'signup' && (
              <div className="space-y-6">
                <div className="text-center space-y-1.5">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                    <Plus size={24} />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-slate-850">Scholar Self-Registration</h2>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">Create your official digital records portal profile immediately to query grades on the fly.</p>
                </div>

                <form onSubmit={handleSignUp} className="space-y-5">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Basic info */}
                    <div className="space-y-4">
                      <h4 className="text-slate-800 text-xs font-bold font-mono tracking-wider uppercase border-b pb-1">Essential Scholar Profile</h4>
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Full Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Martha Gboyah"
                          value={signUpName}
                          onChange={(e)=>setSignUpName(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Secure Access Passcode</label>
                        <input 
                          type="password" 
                          placeholder="Create strong password..."
                          value={signUpPassword}
                          onChange={(e)=>setSignUpPassword(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600">Grade Level</label>
                          <select 
                            value={signUpGrade}
                            onChange={(e)=>setSignUpGrade(e.target.value)}
                            className="w-full p-2 bg-slate-50 border text-xs rounded-lg"
                          >
                            {availableGrades.map((g)=>(
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-600">Gender</label>
                          <select 
                            value={signUpGender}
                            onChange={(e)=>setSignUpGender(e.target.value as any)}
                            className="w-full p-2 bg-slate-50 border text-xs rounded-lg"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Date of Birth</label>
                        <input 
                          type="date"
                          value={signUpDob}
                          onChange={(e)=>setSignUpDob(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs text-slate-700 rounded-lg"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Scholar Email Address</label>
                        <input 
                          type="email" 
                          placeholder="e.g. student@gmail.com"
                          value={signUpEmail}
                          onChange={(e)=>setSignUpEmail(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Contact & Guardians info */}
                    <div className="space-y-4">
                      <h4 className="text-slate-800 text-xs font-bold font-mono tracking-wider uppercase border-b pb-1">Emergency & Address Info</h4>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Primary Contact Phone</label>
                        <input 
                          type="tel" 
                          placeholder="e.g. +231 77 563 3880"
                          value={signUpPhone}
                          onChange={(e)=>setSignUpPhone(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Guardian / Sponsor Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Philip Gboyah"
                          value={signUpGuardianName}
                          onChange={(e)=>setSignUpGuardianName(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Guardian Contact phone</label>
                        <input 
                          type="tel" 
                          placeholder="e.g. +231 77 563 3880"
                          value={signUpGuardianPhone}
                          onChange={(e)=>setSignUpGuardianPhone(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600">Home Physical Address</label>
                        <textarea 
                          rows={3}
                          placeholder="Enter complete village/community location info..."
                          value={signUpAddress}
                          onChange={(e)=>setSignUpAddress(e.target.value)}
                          className="w-full p-2 bg-slate-50 border text-xs rounded-lg focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                  </div>

                  <div className="pt-2 border-t text-right">
                    <button 
                      type="submit"
                      disabled={isRegistering}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer float-right transition-all shadow-sm"
                    >
                      <Plus size={14} />
                      {isRegistering ? 'Generating Official ID Shard...' : 'Create My Scholar Profile'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="border-t border-slate-150 pt-4 text-center">
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                Official grading accounts and terminal GPA calculations are authenticated securely. Fraudulent registrations are actively purged.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Render Logged in Student Dashboard
  return (
    <div id="student-portal-dashboard" className="space-y-8">
      
      {/* Printable Report Header Block (Only visible during @media print) */}
      <div className="hidden print:block space-y-6 max-w-3xl mx-auto font-sans text-black pt-4">
        <div className="flex justify-between items-center border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <img 
              src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
              alt="School Crest" 
              className="w-16 h-16 object-contain"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Dr. Abraham S. Borbor Memorial</h1>
              <h2 className="text-sm font-bold tracking-wider text-slate-700">SCHOOL OF EXCELLENCE</h2>
              <p className="text-[10px] italic">Mount Barclay, Montserrado, Liberia | dr.abrahamsborbor@gmail.com</p>
            </div>
          </div>
          <div className="text-right">
            <span className="border-2 border-black px-3 py-1 text-xs font-black rounded uppercase font-mono">Official Transcript</span>
            <p className="text-[9px] mt-1 font-mono text-slate-500">PRINT DATE: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Scholar Meta details */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <p>SCHOLAR NAME: <strong className="text-sm">{student.name}</strong></p>
            <p>SCHOLAR ID: <strong className="font-mono">{student.studentId}</strong></p>
            <p>GRADE REGISTERED: <strong>{student.gradeLevel}</strong></p>
            <p>SEX: <strong>{student.gender}</strong></p>
          </div>
          <div className="text-right">
            <p>GUARDIAN: <strong>{student.guardianName || 'N/A'}</strong></p>
            <p>GUARDIAN CELL: <strong>{student.guardianPhone || 'N/A'}</strong></p>
            <p>DATE OF BIRTH: <strong>{student.dateOfBirth || 'N/A'}</strong></p>
            <p>CONTACT EMAIL: <strong className="font-mono">{student.email || 'N/A'}</strong></p>
          </div>
        </div>
      </div>

      {/* Student Welcome Header Card (Screen view only) */}
      <div className="bg-white border text-slate-800 border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-md border border-white/5">
              {student.name.charAt(0)}
            </span>
            <div>
              <h1 className="font-display text-2xl font-black text-slate-900 leading-none">
                Welcome, {student.name}!
              </h1>
              <p className="text-[10px] text-blue-600 font-mono tracking-widest uppercase font-bold mt-1">Scholar Digital Records Portal</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2.5 text-xs text-slate-500 pt-1">
            <span className="bg-slate-50 px-3 py-1 rounded-lg border">
              ID Reference: <strong className="font-mono text-slate-700">{student.studentId}</strong>
            </span>
            <span className="bg-slate-50 px-3 py-1 rounded-lg border">
              Enrolled Grade: <strong className="text-slate-700">{student.gradeLevel}</strong>
            </span>
            <span className="bg-slate-50 px-3 py-1 rounded-lg border">
              Parent Sponsor: <strong className="text-slate-700">{student.guardianName || 'N/A'}</strong>
            </span>
            {student.phone && (
              <span className="bg-slate-50 px-3 py-1 rounded-lg border">
                Contact: <strong className="text-slate-700 font-mono">{student.phone}</strong>
              </span>
            )}
          </div>
        </div>

        <button 
          id="btn-student-logout"
          onClick={handleLogout}
          className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <LogOut size={14} />
          Sign Out of Session
        </button>
      </div>

      {reportsLoading ? (
        <div className="animate-pulse bg-white border h-60 rounded-3xl" />
      ) : reports.length === 0 ? (
        <div className="bg-white border rounded-3xl p-12 text-center text-slate-500 space-y-4">
          <FileText size={48} className="mx-auto text-slate-350" />
          <h2 className="font-display text-xl font-extrabold text-slate-800">No report cards uploaded</h2>
          <p className="text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Your assessments, examination records, and term cumulative statistics are currently being calculated by the academic board. Please check back shortly or meet with your grade teacher.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Sidebar selector for academic term report cards */}
          <div className="space-y-4 lg:col-span-1 print:hidden">
            <h3 className="font-bold text-slate-750 text-xs uppercase tracking-wider font-mono">Performance Terms Archive</h3>
            <div className="space-y-2">
              {reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReportId(rep.id || null)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                    selectedReportId === rep.id 
                      ? 'border-blue-500 bg-blue-50/40 shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs md:text-sm">{rep.term}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold font-mono uppercase ${
                      rep.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Year: {rep.academicYear}</span>
                    <span>GPA: <strong className="text-slate-800 font-mono font-bold">{rep.gpa.toFixed(2)}</strong></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active selected report display card */}
          {selectedReport && (
            <div className="lg:col-span-2 space-y-6">
              
              {/* Quick Summary row (Hidden during print since print is compact) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
                <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Average score</span>
                    <p className={`text-2xl font-black mt-1 ${selectedReport.average < 74 ? 'text-red-600' : 'text-blue-600'}`}>
                      {selectedReport.average.toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${selectedReport.average < 74 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <TrendingUp size={18} />
                  </div>
                </div>

                <div className="bg-white border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Calculated GPA</span>
                    <p className="text-2xl font-black mt-1 text-slate-800">
                      {selectedReport.gpa.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-55 text-slate-600 rounded-xl">
                    <CheckCircle size={18} />
                  </div>
                </div>

                <div className={`border rounded-2xl p-5 flex items-center justify-between shadow-sm ${
                  selectedReport.status === 'Pass' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">Portal Verdict</span>
                    <p className={`text-2xl font-black mt-1 ${selectedReport.status === 'Pass' ? 'text-emerald-700' : 'text-red-700'}`}>
                      {selectedReport.status}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${selectedReport.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {selectedReport.status === 'Pass' ? <CheckCircle size={18} /> : <ShieldAlert size={18} />}
                  </div>
                </div>
              </div>

              {/* Warnings and print buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 print:hidden">
                <div className="flex items-center gap-2">
                  <Printer className="text-slate-400" size={16} />
                  <span className="text-xs text-slate-500">Need hardcopy for visa, scholarship, or family record?</span>
                </div>
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Printer size={13} />
                  Print Official Transcript
                </button>
              </div>

              {selectedReport.average < 74 && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-800 rounded-2xl flex items-start gap-3 print:hidden">
                  <ShieldAlert className="shrink-0 text-red-650 mt-0.5" size={18} />
                  <div className="space-y-0.5">
                    <p className="font-bold text-xs md:text-sm">Academic Alert Protocol</p>
                    <p className="text-xs leading-normal">
                      Your cumulative grade point of {selectedReport.average.toFixed(1)}% falls below our school's 74% strict pass benchmark. Meet with your coordinator to activate additional course evaluations.
                    </p>
                  </div>
                </div>
              )}

              {/* Grades Table */}
              <div className="bg-white border text-slate-800 border-slate-105 rounded-2xl overflow-hidden shadow-sm print:border-none print:shadow-none">
                <div className="p-5 border-b bg-slate-50/50 flex justify-between items-center print:bg-white print:px-2 print:border-b-2">
                  <h4 className="font-display font-extrabold text-slate-850 text-sm md:text-base">
                    Academic Grading Sheet
                  </h4>
                  <span className="text-[10px] md:text-xs text-slate-500 font-mono font-bold uppercase">
                    {selectedReport.term} ({selectedReport.academicYear})
                  </span>
                </div>

                <div className="overflow-x-auto text-slate-800">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50/20 text-[10px] uppercase font-mono text-slate-450 tracking-wider">
                        <th className="py-2.5 px-4 font-semibold">Spelled Course Name</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Numeric Score (0-100)</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Letter Symbol</th>
                        <th className="py-2.5 px-4 font-semibold text-center">Value GP</th>
                        <th className="py-2.5 px-4 font-semibold">Teacher Remarks and Coordinator Diagnostics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-sans">
                      {selectedReport.grades.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/20">
                          <td className="py-3 px-4 font-bold text-slate-800">{g.subject}</td>
                          <td className="py-3 px-4 text-center font-mono font-semibold">
                            <span className={g.score < 74 ? 'text-red-600 bg-red-50/70 border border-red-100 px-1.5 py-0.5 rounded' : 'text-slate-800'}>
                              {g.score}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 font-bold rounded ${
                              g.grade === 'A' ? 'bg-blue-55 text-blue-700' :
                              g.grade === 'B' ? 'bg-indigo-55 text-indigo-750' :
                              g.grade === 'C' ? 'bg-amber-55 text-amber-700' :
                              'bg-red-55 text-red-700'
                            }`}>
                              {g.grade}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">{g.gradePoint.toFixed(1)}</td>
                          <td className="py-3 px-4 text-slate-500 italic text-[11px] leading-relaxed max-w-xs truncate" title={g.comments}>
                            {g.comments || 'No remarks provided.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Print view cumulative summary */}
                <div className="hidden print:block border-t-2 border-black p-4 mt-6 bg-slate-50">
                  <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                    <p className="font-bold">TOTAL COURSES COUNT: {selectedReport.grades.length}</p>
                    <p className="font-bold">CUMULATIVE AVERAGE: {selectedReport.average.toFixed(1)}%</p>
                    <p className="font-bold text-slate-900">ACADEMIC DECISION: {selectedReport.status} (GPA: {selectedReport.gpa.toFixed(2)})</p>
                  </div>
                </div>

                {/* Print View Signature Seals */}
                <div className="hidden print:block mt-16 pt-8">
                  <div className="grid grid-cols-2 gap-12 text-xs">
                    <div className="text-center">
                      <div className="border-b border-black h-12 w-48 mx-auto" />
                      <p className="mt-2 font-bold uppercase tracking-wider text-[10px]">Office of Registrar & Admin</p>
                      <p className="text-[9px] text-slate-500">Dr. Abraham S. Borbor Memorial School</p>
                    </div>
                    <div className="text-center">
                      <div className="border-b border-black h-12 w-48 mx-auto" />
                      <p className="mt-2 font-bold uppercase tracking-wider text-[10px]">Academic Board Principal Signature</p>
                      <p className="text-[9px] text-slate-500">Seal of Excellence Certification Authorized</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liberian High School Grading Framework Legend */}
              <div className="bg-slate-50 border rounded-2xl p-5 space-y-3 print:hidden">
                <span className="text-[9px] font-bold text-slate-450 uppercase font-mono tracking-widest block">Authorized Grading Framework Legend</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
                    <span>A: 90 - 100 (4.0 GP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-500 shrink-0" />
                    <span>B: 80 - 89 (3.0 GP)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500 shrink-0" />
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
