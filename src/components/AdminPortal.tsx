import { useState, useEffect, FormEvent } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Student, AcademicReport, Bulletin, CourseGrade } from '../types';
import { Lock, Mail, Users, FilePlus, Sparkles, Plus, Trash2, Calendar, Radio, CheckCircle, ChevronDown, Award, BookOpen, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPortal() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Admin Tab: 'students' | 'reports' | 'bulletins'
  const [activeTab, setActiveTab] = useState<'students' | 'reports' | 'bulletins'>('bulletins');

  // Database lists
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [bulletinsList, setBulletinsList] = useState<Bulletin[]>([]);
  const [reportsList, setReportsList] = useState<AcademicReport[]>([]);

  // ----------------------------------------------------
  // Forms States

  // 1. Bulletins Create
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinContent, setBulletinContent] = useState('');
  const [bulletinCategory, setBulletinCategory] = useState<'Announcement' | 'Event' | 'Academics' | 'Notice' | 'Newsletter'>('Announcement');
  const [bulletinAuthor, setBulletinAuthor] = useState('Principal Office');
  const [bulletinImgUrl, setBulletinImgUrl] = useState('');

  // 2. Students Create
  const [stuId, setStuId] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuGradeLevel, setStuGradeLevel] = useState('Grade 10');
  const [stuGender, setStuGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // 3. Reports Create (Grade & GPA Calculator)
  const [repStudentId, setRepStudentId] = useState('');
  const [repTerm, setRepTerm] = useState('1st Period');
  const [repAcademicYear, setRepAcademicYear] = useState('2025-2026');
  
  // Scoring array state (core high school courses)
  const [subjectScores, setSubjectScores] = useState<{ subject: string; score: string; comments: string }[]>([
    { subject: 'Mathematics', score: '85', comments: 'Excellent skills.' },
    { subject: 'English Language', score: '82', comments: 'Strong reading comprehension.' },
    { subject: 'General Science', score: '78', comments: 'Very good grasp of science.' },
    { subject: 'Social Studies', score: '74', comments: 'Passed, neat notebook.' },
    { subject: 'Biology', score: '70', comments: 'Failed. Must review cells & genetics.' },
  ]);

  const [repCustomSubject, setRepCustomSubject] = useState('');

  // ----------------------------------------------------
  // Helpers

  // Calculate grading details for a raw score
  function parseGradeDetails(rawScore: number): { grade: 'A' | 'B' | 'C' | 'F'; gradePoint: number } {
    if (rawScore >= 90) {
      return { grade: 'A', gradePoint: 4.0 };
    } else if (rawScore >= 80) {
      return { grade: 'B', gradePoint: 3.0 };
    } else if (rawScore >= 74) {
      return { grade: 'C', gradePoint: 2.0 };
    } else {
      return { grade: 'F', gradePoint: 0.0 }; // Under 74 fails
    }
  }

  // ----------------------------------------------------
  // Load database lists on select actions
  async function reloadAllData() {
    setLoading(true);
    try {
      // 1. Fetch Students
      const stuSnapshot = await getDocs(collection(db, 'students'));
      const stus: Student[] = [];
      stuSnapshot.forEach((d) => {
        stus.push({ id: d.id, ...d.data() } as Student);
      });
      setStudentsList(stus);

      // 2. Fetch Bulletins
      const bullSnapshot = await getDocs(collection(db, 'bulletins'));
      const bulls: Bulletin[] = [];
      bullSnapshot.forEach((d) => {
        bulls.push({ id: d.id, ...d.data() } as Bulletin);
      });
      // Sort bulletins by newest first
      bulls.sort((a, b) => b.createdAt - a.createdAt);
      setBulletinsList(bulls);

      // 3. Fetch Reports
      const repSnapshot = await getDocs(collection(db, 'reports'));
      const reps: AcademicReport[] = [];
      repSnapshot.forEach((d) => {
        reps.push({ id: d.id, ...d.data() } as AcademicReport);
      });
      setReportsList(reps);

    } catch (err) {
      console.error('Error reloading database lists:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdminLoggedIn) {
      reloadAllData();
    }
  }, [isAdminLoggedIn]);

  // ----------------------------------------------------
  // Auth Handler
  function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError('');

    const emailClean = adminEmail.trim().toLowerCase();
    const passwordClean = adminPassword.trim();

    // Check against authorized email/pass configurations
    if (
      (emailClean === 'aki.sokpah.link@gmail.com' && passwordClean === 'Admin@2026') ||
      (emailClean === 'luckyglobalnews@gmail.com' && passwordClean === 'Admin@2026') ||
      (emailClean === 'admin@school.org' && passwordClean === 'admin')
    ) {
      setIsAdminLoggedIn(true);
    } else {
      setLoginError('Invalid Administrator credentials.');
    }
  }

  function handleAdminLogout() {
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    setAdminPassword('');
  }

  // ----------------------------------------------------
  // Form Submit: Bulletin
  async function submitBulletin(e: FormEvent) {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinContent.trim()) return;

    try {
      const docData = {
        title: bulletinTitle.trim(),
        content: bulletinContent.trim(),
        category: bulletinCategory,
        author: bulletinAuthor.trim(),
        imageUrl: bulletinImgUrl.trim() || null,
        createdAt: new Date(),
      };

      // Generate a clean alphanumeric ID
      const bulletinId = 'ann-' + Math.random().toString(36).substring(2, 10);
      await setDoc(doc(db, 'bulletins', bulletinId), docData);

      // Clean inputs
      setBulletinTitle('');
      setBulletinContent('');
      setBulletinImgUrl('');
      reloadAllData();
      alert('Announcement successfully posted on homepage!');
    } catch (err) {
      console.error('Error creating bulletin:', err);
      alert('Error: ' + JSON.stringify(err));
    }
  }

  // Delete bulletin
  async function handleDeleteBulletin(id: string) {
    if (!confirm('Are you sure you want to delete this bulletin?')) return;
    try {
      await deleteDoc(doc(db, 'bulletins', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------------------------------------------
  // Form Submit: Student Registration
  async function submitStudent(e: FormEvent) {
    e.preventDefault();
    if (!stuId.trim() || !stuName.trim() || !stuPassword.trim()) {
      alert('Please fill out all student fields.');
      return;
    }

    const cleanStuId = stuId.trim().toUpperCase();

    // Check if duplicate studentId exists
    if (studentsList.some(s => s.studentId === cleanStuId)) {
      alert(`Error: A student with ID ${cleanStuId} is already registered.`);
      return;
    }

    try {
      const docData = {
        studentId: cleanStuId,
        name: stuName.trim(),
        password: stuPassword.trim(),
        gradeLevel: stuGradeLevel,
        gender: stuGender,
        createdAt: new Date()
      };

      await setDoc(doc(db, 'students', cleanStuId), docData);
      
      // Clean inputs
      setStuId('');
      setStuName('');
      setStuPassword('');
      reloadAllData();
      alert(`Student scholar ${stuName} registered on portal successfully!`);
    } catch (err) {
      console.error(err);
      alert('Error registering student.');
    }
  }

  // Delete student
  async function handleDeleteStudent(id: string) {
    if (!confirm('Are you sure you want to discard this student profile? This will not remove their report cards.')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // ----------------------------------------------------
  // Form Submit: Academic Report & GPA Engine
  async function submitReport(e: FormEvent) {
    e.preventDefault();
    if (!repStudentId) {
      alert('Please select a student first.');
      return;
    }

    const matchedStudent = studentsList.find(s => s.studentId === repStudentId);
    if (!matchedStudent) {
      alert('Student record lookup failed.');
      return;
    }

    // Process subjects
    const parsedGrades: CourseGrade[] = subjectScores.map(item => {
      const numericScore = parseFloat(item.score) || 0;
      const details = parseGradeDetails(numericScore);
      return {
        subject: item.subject,
        score: numericScore,
        grade: details.grade,
        gradePoint: details.gradePoint,
        comments: item.comments
      };
    });

    if (parsedGrades.length === 0) {
      alert('Please configure at least one course.');
      return;
    }

    // Calculations
    const aggregateScore = parsedGrades.reduce((sum, g) => sum + g.score, 0);
    const averageScore = aggregateScore / parsedGrades.length;
    const gpaResult = parsedGrades.reduce((sum, g) => sum + g.gradePoint, 0) / parsedGrades.length;

    // Fail verification: average score of 74 below fails
    const termStatus = averageScore < 74 ? 'Fail' : 'Pass';

    try {
      const reportId = `${repStudentId}-${repTerm.replace(/\s+/g, '')}-${repAcademicYear.replace(/\s+/g, '')}`;
      const reportPayload: AcademicReport = {
        studentId: repStudentId,
        studentName: matchedStudent.name,
        gradeLevel: matchedStudent.gradeLevel,
        term: repTerm,
        academicYear: repAcademicYear,
        grades: parsedGrades,
        average: averageScore,
        gpa: gpaResult,
        status: termStatus,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'reports', reportId), reportPayload);
      reloadAllData();
      alert(`Academic Report for ${matchedStudent.name} successfully updated & uploaded! Status: ${termStatus}, GPA: ${gpaResult.toFixed(2)}`);
    } catch (err) {
      console.error(err);
      alert('Error uploading academic assessment record.');
    }
  }

  // Delete Academic Report
  async function handleDeleteReport(id: string) {
    if (!confirm('Are you sure you want to delete this specific report card?')) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // Interactive dynamic score editor helpers
  const handleScoreChange = (idx: number, field: 'score' | 'comments', value: string) => {
    const updated = [...subjectScores];
    updated[idx][field] = value;
    setSubjectScores(updated);
  };

  const addSubjectRow = () => {
    if (!repCustomSubject.trim()) return;
    setSubjectScores([...subjectScores, { subject: repCustomSubject.trim(), score: '80', comments: '' }]);
    setRepCustomSubject('');
  };

  const removeSubjectRow = (idx: number) => {
    setSubjectScores(subjectScores.filter((_, i) => i !== idx));
  };


  // Report statistics calculation preview (Calculated Live in Admin View)
  const previewScores = subjectScores.map(s => parseFloat(s.score) || 0);
  const previewAverage = previewScores.length > 0 ? previewScores.reduce((a, b) => a + b, 0) / previewScores.length : 0;
  const previewGPA = subjectScores.length > 0 ? 
    subjectScores.map(s => parseGradeDetails(parseFloat(s.score) || 0).gradePoint).reduce((a,b)=>a+b, 0) / subjectScores.length : 0;

  if (!isAdminLoggedIn) {
    return (
      <div id="admin-login-view" className="max-w-md mx-auto my-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-slate-100 rounded-3xl p-8 shadow-md space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-900 text-blue-100 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-800 font-display">Administrative Gateway</h2>
            <p className="text-xs text-slate-500 font-mono tracking-wider">OFFICIAL SYSTEM OPERATION LOG</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email-input"
                  type="email"
                  placeholder="aki.sokpah.link@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-pass-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Access Token Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-pass-input"
                  type="password"
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
            >
              Sign In to System Panel
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[10px] text-slate-400">
              Authorized operators only. Operations logging actively monitored under state law.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="admin-portal-dashboard" className="space-y-8">
      
      {/* Admin Nav Card */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-950 text-white rounded-xl">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">DASBMSE Administration</h1>
            <p className="text-xs text-slate-500 font-mono">SYSTEM COCKPIT • ACTIVE ADMIN SESSION</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('bulletins')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'bulletins' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Manage Bulletins
          </button>
          <button 
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'students' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Manage Students
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'reports' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            GPA & Assessment Engine
          </button>
          <button 
            onClick={handleAdminLogout} 
            className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
          >
            Exit Cockpit
          </button>
        </div>
      </div>

      {loading && <div className="text-slate-500 text-xs font-mono animate-bounce text-center">ACCESSING DATABASE SHARDS...</div>}

      {/* RENDER ACTIVE TAB */}

      {/* 1. BULLETINS TAB */}
      {activeTab === 'bulletins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Create Bulletin Form */}
          <div className="lg:col-span-1 bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-600" />
              Compose New Bulletin
            </h2>

            <form onSubmit={submitBulletin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Category Tag</label>
                <select 
                  value={bulletinCategory} 
                  onChange={(e) => setBulletinCategory(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Event">Event</option>
                  <option value="Academics">Academics</option>
                  <option value="Notice">Notice</option>
                  <option value="Newsletter">Newsletter</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Announcement Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. End of Semester Exam timetable" 
                  value={bulletinTitle}
                  onChange={(e)=>setBulletinTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Author Statement</label>
                <input 
                  type="text" 
                  value={bulletinAuthor}
                  onChange={(e)=>setBulletinAuthor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Bulletin Content (Markdown syntax supported)</label>
                <textarea 
                  rows={5}
                  placeholder="Write the full announcement body here..." 
                  value={bulletinContent}
                  onChange={(e)=>setBulletinContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Optional Cover Image URL</label>
                <input 
                  type="text" 
                  placeholder="https://example.com/photo.jpg" 
                  value={bulletinImgUrl}
                  onChange={(e)=>setBulletinImgUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-850 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <Radio size={16} />
                Publish Live Announcement
              </button>
            </form>
          </div>

          {/* Current Bulletins Table */}
          <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100">
              Live School Bulletins & Notifications
            </h2>

            {bulletinsList.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No bulletins compiled yet.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {bulletinsList.map((bull) => (
                  <div key={bull.id} className="p-4 border rounded-xl flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded">
                          {bull.category}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {bull.createdAt?.toDate ? new Date(bull.createdAt.toDate()).toLocaleDateString() : 'Draft Date'}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-800">{bull.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 max-w-xl">{bull.content}</p>
                    </div>

                    <button 
                      onClick={()=>handleDeleteBulletin(bull.id || '')}
                      className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-md text-xs cursor-pointer block shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. STUDENTS TAB */}
      {activeTab === 'students' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Register Student profile Form */}
          <div className="lg:col-span-1 bg-white border rounded-2xl p-6 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Register New Scholar ID
            </h2>

            <form onSubmit={submitStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Student ID# (Must be unique)</label>
                <input 
                  type="text" 
                  placeholder="e.g. STU-2026-001" 
                  value={stuId}
                  onChange={(e)=>setStuId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Samuel K. Jackson" 
                  value={stuName}
                  onChange={(e)=>setStuName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Set Access Password for Scholar</label>
                <input 
                  type="text" 
                  placeholder="e.g. jacksonPass12" 
                  value={stuPassword}
                  onChange={(e)=>setStuPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Grade Level</label>
                  <select 
                    value={stuGradeLevel}
                    onChange={(e)=>setStuGradeLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Gender</label>
                  <select 
                    value={stuGender}
                    onChange={(e)=>setStuGender(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-blue-900 hover:bg-blue-850 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Create Scholar Credentials
              </button>
            </form>
          </div>

          {/* Registered Students List */}
          <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center justify-between">
              <span>Registered Student Database</span>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-full border">
                Total: {studentsList.length} Students
              </span>
            </h2>

            {studentsList.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No students registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/50 uppercase font-mono text-slate-400">
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Grade Level</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Password</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {studentsList.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-900">{stu.studentId}</td>
                        <td className="py-2 px-3 font-medium">{stu.name}</td>
                        <td className="py-2 px-3">{stu.gradeLevel}</td>
                        <td className="py-2 px-3">{stu.gender}</td>
                        <td className="py-2 px-3 font-mono text-slate-400">{stu.password}</td>
                        <td className="py-2 px-3 text-center">
                          <button 
                            onClick={()=>handleDeleteStudent(stu.id || '')}
                            className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-md cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. REPORTS & ASSESSMENTS ENGING */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          
          {/* Main Assessment row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left side parameters */}
            <div className="lg:col-span-1 bg-white border rounded-2xl p-6 shadow-sm space-y-6">
              <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100 flex items-center gap-2">
                <FilePlus size={18} className="text-indigo-600" />
                Assessment Controls
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Select Scholar ID</label>
                  <select 
                    value={repStudentId} 
                    onChange={(e)=>setRepStudentId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:border-blue-500 font-mono"
                  >
                    <option value="">-- Choose Student ID --</option>
                    {studentsList.map((st)=>(
                      <option key={st.id} value={st.studentId}>{st.studentId} - {st.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Academic Period / Term</label>
                  <select 
                    value={repTerm} 
                    onChange={(e)=>setRepTerm(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm"
                  >
                    <option value="1st Period">1st Period Assembly</option>
                    <option value="2nd Period">2nd Period Assembly</option>
                    <option value="3rd Period">3rd Period Assembly</option>
                    <option value="Mid-Term Exams">Mid-Term Exams Session</option>
                    <option value="Final Exams Semester">Final Exams Semester</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Academic School Year</label>
                  <select 
                    value={repAcademicYear} 
                    onChange={(e)=>setRepAcademicYear(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl text-sm font-mono"
                  >
                    <option value="2025-2026">2025-2026 Academic Year</option>
                    <option value="2026-2027">2026-2027 Academic Year</option>
                    <option value="2027-2028">2027-2028 Academic Year</option>
                  </select>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Custom Subject Inject</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Chemistry" 
                      value={repCustomSubject}
                      onChange={(e)=>setRepCustomSubject(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border rounded-xl text-xs focus:outline-none"
                    />
                    <button 
                      type="button"
                      onClick={addSubjectRow}
                      className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Inject
                    </button>
                  </div>
                </div>

                {/* Grade Calculation live preview widgets */}
                <div className="border-t pt-4 space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide font-mono">Real-time GPA calculation</span>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border rounded-xl">
                      <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">GPA Score</span>
                      <p className="text-lg font-bold text-blue-900 mt-1">{previewGPA.toFixed(2)}</p>
                    </div>
                    <div className={`p-3 border rounded-xl ${previewAverage < 74 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                      <span className="text-[10px] uppercase font-bold font-mono">Result Status</span>
                      <p className="text-lg font-bold mt-1">{previewAverage < 74 ? 'FAIL' : 'PASS'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assessment Scoring calculation grid */}
            <div className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <h3 className="font-display font-bold text-slate-800 text-md">Academic Courses & Grades Inputs</h3>
                <span className="text-xs text-red-500 font-mono uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">74% Minimum Passing Grade</span>
              </div>

              {subjectScores.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">No subjects configured. Try custom injecting a course above.</p>
              ) : (
                <div className="space-y-4">
                  {subjectScores.map((subj, index) => {
                    const rawVal = parseFloat(subj.score) || 0;
                    const calculated = parseGradeDetails(rawVal);
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center border-b border-dashed pb-3 border-slate-100">
                        <div className="md:col-span-3 text-xs font-bold text-slate-800">
                          {subj.subject}
                        </div>
                        
                        {/* Score parameter */}
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              min="0" 
                              max="100"
                              value={subj.score}
                              onChange={(e)=>handleScoreChange(index, 'score', e.target.value)}
                              className={`w-full p-1.5 bg-slate-50 border rounded-lg text-xs text-center font-mono focus:outline-none ${
                                rawVal < 74 ? 'border-red-400 focus:border-red-500 text-red-600 bg-red-50/50' : 'border-slate-200'
                              }`}
                              placeholder="Score"
                              required
                            />
                            <span className="text-[10px] text-slate-400 font-mono">%</span>
                          </div>
                        </div>

                        {/* Computed outcomes widget */}
                        <div className="md:col-span-2 flex items-center justify-center gap-2">
                          <span className={`px-2 py-0.5 font-bold rounded text-xs ${
                            calculated.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                            calculated.grade === 'B' ? 'bg-indigo-100 text-indigo-700' :
                            calculated.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {calculated.grade}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{calculated.gradePoint.toFixed(1)} GP</span>
                        </div>

                        <div className="md:col-span-4">
                          <input 
                            type="text" 
                            placeholder="Teacher comments/remarks" 
                            value={subj.comments}
                            onChange={(e)=>handleScoreChange(index, 'comments', e.target.value)}
                            className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="md:col-span-1 text-right">
                          <button 
                            type="button"
                            onClick={()=>removeSubjectRow(index)}
                            className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="bg-slate-50/50 p-4 rounded-xl space-y-2 border">
                    <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Global aggregate results summary</span>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500">Total Subjects count:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{subjectScores.length}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Calculated Average Grade:</span>
                        <p className={`font-bold text-sm mt-0.5 ${previewAverage < 74 ? 'text-red-600' : 'text-emerald-600'}`}>{previewAverage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-slate-500">GPA Grade Scale:</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{previewGPA.toFixed(2)} GP</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={submitReport}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-850 text-white font-medium rounded-xl transition-all cursor-pointer text-sm shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    Commit and Save Student Academic Report Card
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Submitted Academic Records archive */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100">
              Submitted Academic Assessment Records Archive
            </h2>

            {reportsList.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No reports uploaded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/50 uppercase font-mono text-slate-400">
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3 col-span-2">Term / Year</th>
                      <th className="py-2.5 px-3 text-center">Average Score</th>
                      <th className="py-2.5 px-3 text-center">Cumulative GPA</th>
                      <th className="py-2.5 px-3 text-center">Outcome Status</th>
                      <th className="py-2.5 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {reportsList.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/40">
                        <td className="py-2 px-3 font-semibold text-slate-900">{rep.studentName}</td>
                        <td className="py-2 px-3 font-mono text-slate-650">{rep.studentId}</td>
                        <td className="py-2 px-3 align-middle">{rep.term} <span className="text-[10px] text-slate-400 font-mono">({rep.academicYear})</span></td>
                        <td className="py-2 px-3 text-center font-mono font-medium">{rep.average.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-center font-mono font-semibold text-indigo-650">{rep.gpa.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rep.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button 
                            onClick={()=>handleDeleteReport(rep.id || '')}
                            className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-md cursor-pointer text-[10px]"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
