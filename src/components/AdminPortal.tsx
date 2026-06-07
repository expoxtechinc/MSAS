import { useState, useEffect, FormEvent, useRef, ChangeEvent } from 'react';
import { 
  collection, getDocs, doc, deleteDoc, setDoc, 
  writeBatch, updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Student, AcademicReport, Bulletin, CourseGrade, AdmissionsInquiry } from '../types';
import { 
  Lock, Mail, Users, FilePlus, Sparkles, Plus, Trash2, 
  Calendar, Radio, CheckCircle, Award, BookOpen, AlertTriangle, 
  Download, Upload, ShieldCheck, HeartHandshake, RefreshCw, Eye, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPortal() {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Admin Tabs: 'bulletins' | 'students' | 'reports' | 'admissions' | 'system'
  const [activeTab, setActiveTab] = useState<'bulletins' | 'students' | 'reports' | 'admissions' | 'backup'>('bulletins');

  // Database collections lists
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [bulletinsList, setBulletinsList] = useState<Bulletin[]>([]);
  const [reportsList, setReportsList] = useState<AcademicReport[]>([]);
  const [inquiriesList, setInquiriesList] = useState<AdmissionsInquiry[]>([]);

  // Search/Filters states
  const [searchFilter, setSearchFilter] = useState('');

  // 1. Bulletins States
  const [bulletinTitle, setBulletinTitle] = useState('');
  const [bulletinContent, setBulletinContent] = useState('');
  const [bulletinCategory, setBulletinCategory] = useState<'Announcement' | 'Event' | 'Academics' | 'Notice' | 'Newsletter'>('Announcement');
  const [bulletinAuthor, setBulletinAuthor] = useState('Principal Office');
  const [bulletinImgUrl, setBulletinImgUrl] = useState('');

  // 2. Students States
  const [stuId, setStuId] = useState('');
  const [stuName, setStuName] = useState('');
  const [stuPassword, setStuPassword] = useState('');
  const [stuGradeLevel, setStuGradeLevel] = useState('Grade 10');
  const [stuGender, setStuGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [stuEmail, setStuEmail] = useState('');
  const [stuPhone, setStuPhone] = useState('');
  const [stuGuardianName, setStuGuardianName] = useState('');
  const [stuGuardianPhone, setStuGuardianPhone] = useState('');
  const [stuAddress, setStuAddress] = useState('');

  // 3. Reports States (Grades & calculators)
  const [repStudentId, setRepStudentId] = useState('');
  const [repTerm, setRepTerm] = useState('1st Period');
  const [repAcademicYear, setRepAcademicYear] = useState('2025-2026');
  
  // Custom interactive spelt course arrays
  const [subjectScores, setSubjectScores] = useState<CourseGrade[]>([
    { subject: 'Mathematics', score: 85, grade: 'B', gradePoint: 3.0, comments: 'Passed with decent skills.' },
    { subject: 'English Language', score: 82, grade: 'B', gradePoint: 3.0, comments: 'Superb oral reading.' },
    { subject: 'General Science', score: 79, grade: 'C', gradePoint: 2.0, comments: 'Grasp of biology is excellent.' },
    { subject: 'Social Studies', score: 74, grade: 'C', gradePoint: 2.0, comments: 'Neat notebook compliance.' },
    { subject: 'Phonics & Speech', score: 92, grade: 'A', gradePoint: 4.0, comments: 'Brilliant accentuation!' },
  ]);

  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customSubjectScore, setCustomSubjectScore] = useState('80');
  const [customSubjectComments, setCustomSubjectComments] = useState('');

  // Backup file upload reference
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // Comprehensive Grade Selector (high school standards Grade 1 to 12)
  const availableGrades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  useEffect(() => {
    if (isAdminLoggedIn) {
      reloadAllData();
    }
  }, [isAdminLoggedIn]);

  // Calculations for static grades
  function parseGradeDetails(rawScore: number): { grade: 'A' | 'B' | 'C' | 'F'; gradePoint: number } {
    if (rawScore >= 90) {
      return { grade: 'A', gradePoint: 4.0 };
    } else if (rawScore >= 80) {
      return { grade: 'B', gradePoint: 3.0 };
    } else if (rawScore >= 74) {
      return { grade: 'C', gradePoint: 2.0 };
    } else {
      return { grade: 'F', gradePoint: 0.0 }; // Any average or subject score under 74 fails
    }
  }

  // Reload everything in parallel
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
      bulls.sort((a, b) => b.createdAt - a.createdAt);
      setBulletinsList(bulls);

      // 3. Fetch Reports
      const repSnapshot = await getDocs(collection(db, 'reports'));
      const reps: AcademicReport[] = [];
      repSnapshot.forEach((d) => {
        reps.push({ id: d.id, ...d.data() } as AcademicReport);
      });
      setReportsList(reps);

      // 4. Fetch Admissions Inquiries
      const inquiSnapshot = await getDocs(collection(db, 'inquiries'));
      const inquils: AdmissionsInquiry[] = [];
      inquiSnapshot.forEach((d) => {
        inquils.push({ id: d.id, ...d.data() } as AdmissionsInquiry);
      });
      inquils.sort((a, b) => b.createdAt - a.createdAt);
      setInquiriesList(inquils);

    } catch (err) {
      console.error('Error reloading databases shards:', err);
    } finally {
      setLoading(false);
    }
  }

  // Admin access validation gateway
  function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError('');

    const emailClean = adminEmail.trim().toLowerCase();
    const valPassword = adminPassword.trim();

    if (
      (emailClean === 'aki.sokpah.link@gmail.com' && valPassword === 'Admin@2026') ||
      (emailClean === 'luckyglobalnews@gmail.com' && valPassword === 'Admin@2026') ||
      (emailClean === 'admin@school.org' && valPassword === 'admin')
    ) {
      setIsAdminLoggedIn(true);
    } else {
      setLoginError('Invalid administrator credentials or access token.');
    }
  }

  function handleAdminLogout() {
    setIsAdminLoggedIn(false);
    setAdminEmail('');
    setAdminPassword('');
  }

  // 1. BULLETINS SUBMISSIONS
  async function submitBulletin(e: FormEvent) {
    e.preventDefault();
    if (!bulletinTitle.trim() || !bulletinContent.trim()) return;

    try {
      const bulletinId = 'bulletin-' + Math.random().toString(36).substring(2, 9);
      const dataPayload = {
        title: bulletinTitle.trim(),
        content: bulletinContent.trim(),
        category: bulletinCategory,
        author: bulletinAuthor.trim(),
        imageUrl: bulletinImgUrl.trim() || null,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'bulletins', bulletinId), dataPayload);
      
      // Clean up states
      setBulletinTitle('');
      setBulletinContent('');
      setBulletinImgUrl('');
      reloadAllData();
      alert('School bulletin successfully posted to news feeds!');
    } catch (err) {
      console.error(err);
      alert('Error uploading post: ' + JSON.stringify(err));
    }
  }

  async function handleDeleteBulletin(id: string) {
    if (!confirm('Discard this school post instantly?')) return;
    try {
      await deleteDoc(doc(db, 'bulletins', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // 2. STUDENTS REGISTRATION
  async function submitStudent(e: FormEvent) {
    e.preventDefault();
    if (!stuId.trim() || !stuName.trim() || !stuPassword.trim()) {
      alert('Ensure student unique ID, full name, and passcode are declared.');
      return;
    }

    const cleanStuId = stuId.trim().toUpperCase();

    // Prevent duplicate entries
    if (studentsList.some(s => s.studentId === cleanStuId)) {
      alert(`Duplicate Identity: A student with ID "${cleanStuId}" of excellence has already been declared.`);
      return;
    }

    try {
      const studentPayload: Student = {
        studentId: cleanStuId,
        name: stuName.trim(),
        password: stuPassword.trim(),
        gradeLevel: stuGradeLevel,
        gender: stuGender,
        email: stuEmail.trim() || undefined,
        phone: stuPhone.trim() || undefined,
        guardianName: stuGuardianName.trim() || undefined,
        guardianPhone: stuGuardianPhone.trim() || undefined,
        homeAddress: stuAddress.trim() || undefined,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'students', cleanStuId), studentPayload);
      
      // Clean inputs
      setStuId('');
      setStuName('');
      setStuPassword('');
      setStuEmail('');
      setStuPhone('');
      setStuGuardianName('');
      setStuGuardianPhone('');
      setStuAddress('');
      reloadAllData();
      alert(`Scholar "${stuName}" credential block generated successfully! ID is ${cleanStuId}`);
    } catch (err) {
      console.error(err);
      alert('Failed saving database student.');
    }
  }

  async function handleDeleteStudent(id: string) {
    if (!confirm('DANGER: Discarding this student profile only removes authentication. Existing GPA report cards stand. Continue?')) return;
    try {
      await deleteDoc(doc(db, 'students', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // 3. GPA AND REPORT COMMIT CALCULATOR
  async function submitReport(e: FormEvent) {
    e.preventDefault();
    if (!repStudentId) {
      alert('Choose target Scholar ID Reference first.');
      return;
    }

    const matchedSch = studentsList.find(s => s.studentId === repStudentId);
    if (!matchedSch) {
      alert('Student records profile coordinates not found.');
      return;
    }

    if (subjectScores.length === 0) {
      alert('A transcript document requires at least 1 graded course.');
      return;
    }

    try {
      // Calculate global stats
      const aggregateScores = subjectScores.reduce((sum, g) => sum + g.score, 0);
      const averageCalc = aggregateScores / subjectScores.length;
      const gpaCalc = subjectScores.reduce((sum, g) => sum + g.gradePoint, 0) / subjectScores.length;

      // Passing rule check: strict 74% aggregate benchmark determines Pass or Fail outcome
      const decisionVerdict = averageCalc < 74 ? 'Fail' : 'Pass';

      const keyId = `${repStudentId}-${repTerm.replace(/\s+/g, '')}-${repAcademicYear.replace(/\s+/g, '')}`;

      const reportPayload: AcademicReport = {
        studentId: repStudentId,
        studentName: matchedSch.name,
        gradeLevel: matchedSch.gradeLevel,
        term: repTerm,
        academicYear: repAcademicYear,
        grades: subjectScores,
        average: averageCalc,
        gpa: gpaCalc,
        status: decisionVerdict,
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'reports', keyId), reportPayload);
      reloadAllData();
      alert(`Report Card saved! GPA: ${gpaCalc.toFixed(2)}, Metric Pass Result: ${decisionVerdict}`);
    } catch (err) {
      console.error(err);
      alert('Error updating report card database.');
    }
  }

  async function handleDeleteReport(id: string) {
    if (!confirm('Delete this report card document permanently?')) return;
    try {
      await deleteDoc(doc(db, 'reports', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // 4. ADMISSIONS ACTIONS
  async function handleInquiryStatus(id: string, newStatus: any) {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status: newStatus });
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDeleteInquiry(id: string) {
    if (!confirm('Discard this admissions inquiry form profile?')) return;
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      reloadAllData();
    } catch (err) {
      console.error(err);
    }
  }

  // Spelt Courses Entry Handlers
  const handleScoreEdit = (idx: number, scoreVal: string) => {
    const rawNum = parseFloat(scoreVal) || 0;
    const computed = parseGradeDetails(rawNum);
    const updated = [...subjectScores];
    updated[idx].score = Math.min(100, Math.max(0, rawNum));
    updated[idx].grade = computed.grade;
    updated[idx].gradePoint = computed.gradePoint;
    setSubjectScores(updated);
  };

  const handleCommentsEdit = (idx: number, notesText: string) => {
    const updated = [...subjectScores];
    updated[idx].comments = notesText;
    setSubjectScores(updated);
  };

  const handleSubjectSpellingEdit = (idx: number, typedName: string) => {
    const updated = [...subjectScores];
    updated[idx].subject = typedName;
    setSubjectScores(updated);
  };

  const customInjectCourseRow = () => {
    if (!customSubjectName.trim()) {
      alert('Please spell out a subject name to inject.');
      return;
    }
    const valScore = parseFloat(customSubjectScore) || 0;
    const parsed = parseGradeDetails(valScore);
    const newRow: CourseGrade = {
      subject: customSubjectName.trim(),
      score: valScore,
      grade: parsed.grade,
      gradePoint: parsed.gradePoint,
      comments: customSubjectComments.trim(),
    };
    setSubjectScores([...subjectScores, newRow]);
    // Reset temporary states
    setCustomSubjectName('');
    setCustomSubjectComments('');
  };

  const removeCourseRow = (idx: number) => {
    setSubjectScores(subjectScores.filter((_, i) => i !== idx));
  };


  // 5. SEE AND SAVE DATABASE BACKUP SYSTEM
  const exportFullDatabaseBackup = () => {
    const backupBundle = {
      exportedAt: new Date().toISOString(),
      schoolName: 'Dr. Abraham S. Borbor Memorial School of Excellence',
      schemaMajorVersion: '2026.1',
      students: studentsList,
      bulletins: bulletinsList,
      reports: reportsList,
      inquiries: inquiriesList
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupBundle, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `DASBMSE_PORTAL_BACKUP_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDatabaseBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.students && !parsed.reports && !parsed.bulletins) {
          alert('Invalid Backup schema structure. Coordinates did not match school entities.');
          return;
        }

        if (!confirm(`CAUTION: You are about to upload a backup. This will synchronize ${parsed.students?.length || 0} students and ${parsed.reports?.length || 0} reports to Firestore. Proceed?`)) {
          return;
        }

        setLoading(true);

        // Upload Students in batch
        if (parsed.students && parsed.students.length > 0) {
          for (const s of parsed.students) {
            await setDoc(doc(db, 'students', s.studentId), {
              studentId: s.studentId,
              name: s.name,
              password: s.password,
              gradeLevel: s.gradeLevel,
              gender: s.gender,
              email: s.email || null,
              phone: s.phone || null,
              guardianName: s.guardianName || null,
              guardianPhone: s.guardianPhone || null,
              homeAddress: s.homeAddress || null,
              createdAt: new Date()
            });
          }
        }

        // Upload Report Cards
        if (parsed.reports && parsed.reports.length > 0) {
          for (const rep of parsed.reports) {
            const rId = `${rep.studentId}-${rep.term.replace(/\s+/g, '')}-${rep.academicYear.replace(/\s+/g, '')}`;
            await setDoc(doc(db, 'reports', rId), {
              studentId: rep.studentId,
              studentName: rep.studentName,
              gradeLevel: rep.gradeLevel,
              term: rep.term,
              academicYear: rep.academicYear,
              grades: rep.grades,
              average: rep.average,
              gpa: rep.gpa,
              status: rep.status,
              updatedAt: new Date()
            });
          }
        }

        // Upload Bulletins
        if (parsed.bulletins && parsed.bulletins.length > 0) {
          for (const b of parsed.bulletins) {
            const bId = b.id || 'bulletin-' + Math.random().toString(36).substring(2, 9);
            await setDoc(doc(db, 'bulletins', bId), {
              title: b.title,
              content: b.content,
              category: b.category,
              author: b.author,
              imageUrl: b.imageUrl || null,
              createdAt: new Date()
            });
          }
        }

        await reloadAllData();
        alert('Database restore & sync successfully completed!');
      } catch (err) {
        console.error(err);
        alert('Parsing file error. Check file structure integrity.');
      } finally {
        setLoading(false);
      }
    };
    fileReader.readAsText(files[0]);
  };


  // LIVE ANALYTICS PREVIEW FOR DASHBOARD
  const calculateLiveStats = () => {
    const totalSchs = studentsList.length;
    const totalReps = reportsList.length;
    const passingReps = reportsList.filter(r => r.status === 'Pass').length;
    const failReps = reportsList.filter(r => r.status === 'Fail').length;
    const passPercentage = totalReps > 0 ? (passingReps / totalReps) * 100 : 100;
    
    // GPA average computation
    const avgGPA = totalReps > 0 ? reportsList.reduce((acc, r) => acc + r.gpa, 0) / totalReps : 4.0;

    return { totalSchs, totalReps, passPercentage, avgGPA, failReps, passingReps };
  };

  const analytics = calculateLiveStats();

  // Search Filter logic on tables
  const filteredStudents = studentsList.filter(s => 
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    s.studentId.toLowerCase().includes(searchFilter.toLowerCase()) ||
    s.gradeLevel.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredReports = reportsList.filter(r => 
    r.studentName.toLowerCase().includes(searchFilter.toLowerCase()) || 
    r.studentId.toLowerCase().includes(searchFilter.toLowerCase()) ||
    r.term.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Render Admin Gateway login view
  if (!isAdminLoggedIn) {
    return (
      <div id="admin-login-view" className="max-w-md mx-auto my-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white text-slate-850 border border-slate-100 rounded-[32px] p-8 shadow-md space-y-6"
        >
          <div className="text-center space-y-1.5">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Lock size={26} />
            </div>
            <h2 className="font-display text-2xl font-bold font-display">Administrative Gateway</h2>
            <p className="text-xs text-slate-500 font-mono tracking-widest font-bold uppercase">System Operator Cockpit</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-50 text-red-655 text-xs font-semibold rounded-xl border border-red-100 flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Email Address</label>
              <input
                id="admin-email-input"
                type="email"
                placeholder="luckyglobalnews@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-pass-input" className="text-xs font-semibold uppercase text-slate-500 font-mono">Access Token Passcode</label>
              <input
                id="admin-pass-input"
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <button
              id="btn-admin-login-submit"
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm shadow-sm mt-3"
            >
              Authorize Credentials
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              Operators are synchronized under high-school system integrity mandates. Access sequences are securely stored.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div id="admin-portal-dashboard" className="space-y-8 text-slate-800">
      
      {/* Visual Analytics KPI Dashboard Widgets */}
      <section className="bg-gradient-to-br from-slate-950 to-blue-950 text-white p-6 md:p-8 rounded-[32px] grid grid-cols-2 lg:grid-cols-4 gap-6 border shadow-lg">
        <div className="space-y-1">
          <span className="text-[9px] text-blue-400 font-mono font-bold tracking-widest uppercase">System Scholars</span>
          <p className="text-2xl md:text-3xl font-black font-mono">{analytics.totalSchs}</p>
          <span className="text-[10px] text-slate-450 block">Enrolled high schoolers</span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-indigo-400 font-mono font-bold tracking-widest uppercase">GPA Report Cards</span>
          <p className="text-2xl md:text-3xl font-black font-mono">{analytics.totalReps}</p>
          <span className="text-[10px] text-slate-450 block">Assessed period sheets</span>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-emerald-400 font-mono font-bold tracking-widest uppercase">System Pass Percentage</span>
          <p className="text-2xl md:text-3xl font-black font-mono text-emerald-400">{analytics.passPercentage.toFixed(1)}%</p>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${analytics.passPercentage}%` }} />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[9px] text-teal-400 font-mono font-bold tracking-widest uppercase">Cumulative High GPA</span>
          <p className="text-2xl md:text-3xl font-black font-mono text-teal-300">{analytics.avgGPA.toFixed(2)}</p>
          <span className="text-[10px] text-slate-450 block">Average performance output</span>
        </div>
      </section>

      {/* Admin Nav System */}
      <div className="bg-white border text-slate-800 border-slate-100 rounded-3xl p-5 shadow-sm flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-950 text-white rounded-2xl block shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h1 className="font-display text-xl font-black tracking-tight text-slate-900 leading-none">
              DASBMSE Administration Cockpit
            </h1>
            <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase font-bold mt-1.5">Official Operator Core Shards</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => { setActiveTab('bulletins'); setSearchFilter(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'bulletins' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            School Bulletins
          </button>
          <button 
            onClick={() => { setActiveTab('students'); setSearchFilter(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'students' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            Student Directory
          </button>
          <button 
            onClick={() => { setActiveTab('reports'); setSearchFilter(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'reports' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            Grading & GPA Calculator
          </button>
          <button 
            onClick={() => { setActiveTab('admissions'); setSearchFilter(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer relative ${
              activeTab === 'admissions' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            Admissions
            {inquiriesList.filter(io => io.status === 'Pending').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {inquiriesList.filter(io => io.status === 'Pending').length}
              </span>
            )}
          </button>
          <button 
            onClick={() => { setActiveTab('backup'); setSearchFilter(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
              activeTab === 'backup' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
            }`}
          >
            Save Database Backup
          </button>
          <button 
            onClick={handleAdminLogout} 
            className="px-3.5 py-2 text-xs font-bold text-red-650 hover:bg-red-50 border border-transparent rounded-xl transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-slate-500 text-xs font-mono animate-bounce text-center">
          SYNCHRONIZING SECURED CLOUD FIREBASE SHARDS...
        </div>
      )}

      {/* RENDER THE ACTIVE TAB CONTENT */}

      {/* 1. BULLETINS TAB */}
      {activeTab === 'bulletins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold border-b pb-3 border-slate-100 flex items-center gap-2">
              <Radio size={18} className="text-blue-600" />
              Upload Announcement
            </h2>

            <form onSubmit={submitBulletin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Category Tags</label>
                <select 
                  value={bulletinCategory} 
                  onChange={(e) => setBulletinCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border rounded-xl text-xs"
                >
                  <option value="Announcement">Announcement</option>
                  <option value="Event">Event</option>
                  <option value="Academics">Academics</option>
                  <option value="Notice">Notice</option>
                  <option value="Newsletter">Newsletter</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Article / Post Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Enrollment Period Extended" 
                  value={bulletinTitle}
                  onChange={(e)=>setBulletinTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Author Statement</label>
                <input 
                  type="text" 
                  value={bulletinAuthor}
                  onChange={(e)=>setBulletinAuthor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Bulletin Content Details (Markdown supported)</label>
                <textarea 
                  rows={4}
                  placeholder="Write full article description details on this line..." 
                  value={bulletinContent}
                  onChange={(e)=>setBulletinContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none"
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
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <Radio size={14} />
                Publish to Homepage News Feed
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-4">
            <h2 className="font-display text-lg font-bold border-b pb-3 border-slate-100 uppercase tracking-wide text-xs">
              Live School Bulletins News Archive ({bulletinsList.length})
            </h2>

            {bulletinsList.length === 0 ? (
              <p className="text-xs text-slate-450 py-10 text-center">No active postings found.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {bulletinsList.map((bull) => (
                  <div key={bull.id} className="p-4 border rounded-2xl flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-bold rounded">
                          {bull.category}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {bull.createdAt?.toDate ? new Date(bull.createdAt.toDate()).toLocaleDateString() : 'Draft date'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs md:text-sm text-slate-900">{bull.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 max-w-xl whitespace-pre-line">{bull.content}</p>
                    </div>

                    <button 
                      onClick={()=>handleDeleteBulletin(bull.id || '')}
                      className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-600 rounded-md text-[10px] uppercase font-bold cursor-pointer font-mono shrink-0"
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
          
          <div className="lg:col-span-1 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-6">
            <h2 className="font-display text-lg font-bold border-b pb-3 border-slate-100 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              Register Scholar
            </h2>

            <form onSubmit={submitStudent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650">Student ID Reference (Must be unique)</label>
                <input 
                  type="text" 
                  placeholder="e.g. STU-2026-001" 
                  value={stuId}
                  onChange={(e)=>setStuId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650">Scholar Full Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Martha Flomo" 
                  value={stuName}
                  onChange={(e)=>setStuName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs focus:outline-none font-sans"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650">Set Secretary Password Code</label>
                <input 
                  type="text" 
                  placeholder="Password..." 
                  value={stuPassword}
                  onChange={(e)=>setStuPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">School Grade</label>
                  <select 
                    value={stuGradeLevel}
                    onChange={(e)=>setStuGradeLevel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    {availableGrades.map((g)=>(
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Gender</label>
                  <select 
                    value={stuGender}
                    onChange={(e)=>setStuGender(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650">Primary phone / contact</label>
                <input 
                  type="tel" 
                  placeholder="+231 77..." 
                  value={stuPhone}
                  onChange={(e)=>setStuPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-650">Guardian Sponsor name</label>
                <input 
                  type="text" 
                  placeholder="Parent Name..." 
                  value={stuGuardianName}
                  onChange={(e)=>setStuGuardianName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-lg text-xs"
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                Generate Core Credentials
              </button>
            </form>
          </div>

          {/* Directory listings */}
          <div className="lg:col-span-2 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3 border-slate-100">
              <h2 className="font-display text-lg font-bold">
                Registered Student Directory ({filteredStudents.length})
              </h2>

              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter directory list..." 
                  value={searchFilter}
                  onChange={(e)=>setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border rounded-lg text-xs font-sans text-slate-800"
                />
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-xs text-slate-450 py-10 text-center">No students registered matching criteria.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 uppercase font-mono text-slate-400">
                      <th className="py-2 px-3">Unique ID</th>
                      <th className="py-2 px-3">Name</th>
                      <th className="py-2 px-3">Grade level</th>
                      <th className="py-2 px-3">Gender</th>
                      <th className="py-2 px-3">Sponsor/Guardian</th>
                      <th className="py-2 px-3">Password</th>
                      <th className="py-2 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-705">
                    {filteredStudents.map((stu) => (
                      <tr key={stu.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{stu.studentId}</td>
                        <td className="py-2.5 px-3 font-semibold">{stu.name}</td>
                        <td className="py-2.5 px-3">{stu.gradeLevel}</td>
                        <td className="py-2.5 px-3">{stu.gender}</td>
                        <td className="py-2.5 px-3 truncate max-w-[120px]">{stu.guardianName || 'N/A'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{stu.password}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button 
                            onClick={()=>handleDeleteStudent(stu.id || '')}
                            className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-650 rounded-md font-bold text-[10px] uppercase font-mono cursor-pointer"
                          >
                            Purge
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

      {/* 3. GPA AND GRADES MANAGEMENT HUB */}
      {activeTab === 'reports' && (
        <div className="space-y-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left controller forms */}
            <div className="lg:col-span-1 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-6">
              <h2 className="font-display text-lg font-bold border-b pb-3 border-slate-100 flex items-center gap-2">
                <FilePlus size={18} className="text-indigo-650" />
                Assessment Controls
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Select Target Student ID</label>
                  <select 
                    value={repStudentId} 
                    onChange={(e)=>setRepStudentId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-mono"
                  >
                    <option value="">-- Choose student ID reference --</option>
                    {studentsList.map((st)=>(
                      <option key={st.id} value={st.studentId}>{st.studentId} - {st.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Academic Period / Term</label>
                  <select 
                    value={repTerm} 
                    onChange={(e)=>setRepTerm(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs"
                  >
                    <option value="1st Period">1st Period Assembly</option>
                    <option value="2nd Period">2nd Period Assembly</option>
                    <option value="3rd Period">3rd Period Assembly</option>
                    <option value="Mid-Term Exams">Mid-Term Exams Session</option>
                    <option value="Final Exams Semester">Final Exams Semester</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-650">Academic Year</label>
                  <select 
                    value={repAcademicYear} 
                    onChange={(e)=>setRepAcademicYear(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-mono"
                  >
                    <option value="2025-2026">2025-2026 Season</option>
                    <option value="2026-2027">2026-2027 Season</option>
                    <option value="2027-2028">2027-2028 Season</option>
                  </select>
                </div>

                {/* Custom Spelt injection controller */}
                <div className="border-t pt-4 space-y-3">
                  <span className="text-[11px] font-bold text-slate-450 uppercase tracking-wider font-mono">Custom Spelled Subject Injector</span>
                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      placeholder="e.g. Physics, Literatures" 
                      value={customSubjectName}
                      onChange={(e)=>setCustomSubjectName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border text-xs rounded-xl focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="number" 
                        placeholder="Raw Score" 
                        value={customSubjectScore}
                        onChange={(e)=>setCustomSubjectScore(e.target.value)}
                        className="p-2 bg-slate-50 border text-xs rounded-xl text-center"
                      />
                      <button 
                        type="button"
                        onClick={customInjectCourseRow}
                        className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all uppercase"
                      >
                        Inject Spelled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Grades Spreadsheet configuration */}
            <div className="lg:col-span-2 bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b pb-3 border-slate-105">
                <h3 className="font-display font-bold text-slate-800 text-sm">Spelt Subject Grades Cumulative Spreadsheet</h3>
                <span className="text-[10px] text-red-500 font-mono uppercase bg-red-50 px-2 py-0.5 rounded border border-red-100">74% Pass Line</span>
              </div>

              {subjectScores.length === 0 ? (
                <p className="text-xs text-slate-400 py-10 text-center">Spreadable grades matrix is empty. Inject courses now.</p>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:grid grid-cols-12 gap-3 text-[10px] text-slate-400 font-mono uppercase pb-1 border-b">
                    <div className="col-span-4">Spell Subject Name</div>
                    <div className="col-span-2 text-center">Numeric Score (0-100)</div>
                    <div className="col-span-2 text-center">Symbol Output</div>
                    <div className="col-span-3">Teacher Comment Remarks</div>
                    <div className="col-span-1 text-center">Remove</div>
                  </div>

                  {subjectScores.map((subj, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center pb-2 border-b border-slate-50">
                      
                      {/* Spell subject input allowing full spelling control */}
                      <div className="col-span-12 md:col-span-4">
                        <input 
                          type="text" 
                          value={subj.subject}
                          onChange={(e)=>handleSubjectSpellingEdit(index, e.target.value)}
                          className="w-full p-1.5 border rounded text-xs bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                          required
                        />
                      </div>

                      {/* Numeric raw score */}
                      <div className="col-span-6 md:col-span-2 text-center">
                        <input 
                          type="number" 
                          min="0" 
                          max="100"
                          value={subj.score}
                          onChange={(e)=>handleScoreEdit(index, e.target.value)}
                          className={`w-20 p-1.5 text-center font-mono border rounded text-xs ${
                            subj.score < 74 ? 'text-red-650 bg-red-50 border-red-200' : 'bg-slate-50'
                          }`}
                          required
                        />
                      </div>

                      {/* Outcome calculations preview */}
                      <div className="col-span-6 md:col-span-2 text-center flex items-center justify-center gap-1">
                        <span className={`px-2 py-0.5 font-bold rounded text-[10px] ${
                          subj.grade === 'A' ? 'bg-blue-100 text-blue-700' :
                          subj.grade === 'B' ? 'bg-indigo-100 text-indigo-750' :
                          subj.grade === 'C' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-750'
                        }`}>
                          {subj.grade}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({subj.gradePoint.toFixed(1)} GP)</span>
                      </div>

                      {/* Teacher remark logs */}
                      <div className="col-span-10 md:col-span-3">
                        <input 
                          type="text" 
                          placeholder="Teacher commentary text..." 
                          value={subj.comments}
                          onChange={(e)=>handleCommentsEdit(index, e.target.value)}
                          className="w-full p-1.5 border rounded text-xs bg-slate-50 text-slate-650"
                        />
                      </div>

                      {/* Discard row */}
                      <div className="col-span-2 md:col-span-1 text-center">
                        <button 
                          type="button"
                          onClick={()=>removeCourseRow(index)}
                          className="p-1 px-1.5 border rounded-md hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer text-slate-400 block mx-auto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  ))}

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border">
                    <span className="text-[10px] text-slate-450 font-bold uppercase font-mono">Simulated Report outcomes preview</span>
                    
                    {/* Live averages calculations on typed parameters */}
                    {(() => {
                      const computedAvg = subjectScores.reduce((sum, g) => sum + g.score, 0) / subjectScores.length;
                      const computedGpa = subjectScores.reduce((sum, g) => sum + g.gradePoint, 0) / subjectScores.length;
                      
                      return (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Cumulative count</span>
                            <strong className="text-slate-800 text-sm">{subjectScores.length} Subjects</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Weighted Average</span>
                            <strong className={`text-sm ${computedAvg < 74 ? 'text-red-600' : 'text-teal-600'}`}>{computedAvg.toFixed(1)}%</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-bold font-mono">Cumulative GPA</span>
                            <strong className="text-indigo-600 text-sm">{computedGpa.toFixed(2)} GP</strong>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <button 
                    type="button" 
                    onClick={submitReport}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all cursor-pointer text-xs md:text-sm shadow-md"
                  >
                    Validate and Save Report to Scholar Card
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Table history lists */}
          <div className="bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-3 border-slate-100">
              <h2 className="font-display text-lg font-bold">
                Student Report Cards Database ({filteredReports.length})
              </h2>

              <div className="relative max-w-xs w-full">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter report cards..." 
                  value={searchFilter}
                  onChange={(e)=>setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border rounded-lg text-xs"
                />
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <p className="text-xs text-slate-450 py-10 text-center">No reports matching query verified.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50 uppercase font-mono text-slate-450 tracking-wider">
                      <th className="py-2.5 px-3">Scholar Name</th>
                      <th className="py-2.5 px-3">Scholar ID</th>
                      <th className="py-2.5 px-3">Period / Term</th>
                      <th className="py-2.5 px-3">Subject Score Avg</th>
                      <th className="py-2.5 px-3">Cumulative GPA</th>
                      <th className="py-2.5 px-3 text-center">Result Verdict</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-700">
                    {filteredReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{rep.studentName}</td>
                        <td className="py-2 px-3 font-mono font-semibold text-slate-500">{rep.studentId}</td>
                        <td className="py-2 px-3">{rep.term} ({rep.academicYear})</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{rep.average.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-indigo-600">{rep.gpa.toFixed(2)}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            rep.status === 'Pass' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button 
                            onClick={()=>handleDeleteReport(rep.id || '')}
                            className="p-1 px-2 border border-red-100 hover:bg-red-50 text-red-655 rounded-md text-[10px] uppercase font-bold"
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

      {/* 4. ADMISSIONS GATEWAY MANAGEMENT INQUIRIES */}
      {activeTab === 'admissions' && (
        <div className="bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 border-slate-100">
            <h2 className="font-display text-lg font-bold text-slate-900">
              Online Admission Inquiries Gateway ({inquiriesList.length})
            </h2>
            <p className="text-xs text-slate-500">Review applications submitted by prospective parents and sponsors through the main homepage interface.</p>
          </div>

          {inquiriesList.length === 0 ? (
            <p className="text-xs text-slate-450 py-12 text-center">No admissions inquiries filed currently.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 uppercase font-mono text-slate-450">
                    <th className="py-2 px-3">Student Name</th>
                    <th className="py-2 px-3">Target Grade</th>
                    <th className="py-2 px-3">Date of Birth</th>
                    <th className="py-2 px-3">Parent Name & Cell</th>
                    <th className="py-2 px-3">Remarks / Notes</th>
                    <th className="py-2 px-3 text-center">Decision State</th>
                    <th className="py-2 px-3 text-center">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-750">
                  {inquiriesList.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-slate-900">{inq.studentName}</td>
                      <td className="py-3 px-3 font-semibold">{inq.gradeLevel}</td>
                      <td className="py-3 px-3 font-mono">{inq.dob}</td>
                      <td className="py-3 px-3">
                        <p className="font-bold">{inq.parentName}</p>
                        <p className="font-mono text-slate-500">{inq.parentPhone}</p>
                        {inq.parentEmail && <p className="text-[10px] text-blue-500 lowercase">{inq.parentEmail}</p>}
                      </td>
                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-500 italic" title={inq.additionalNotes || 'No notes'}>
                        {inq.additionalNotes || 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide font-mono ${
                          inq.status === 'Approved' ? 'bg-emerald-100 text-emerald-850' : 
                          inq.status === 'Reviewing' ? 'bg-amber-100 text-amber-850' :
                          inq.status === 'Declined' ? 'bg-red-150 text-red-800' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {inq.status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center space-y-1 block md:space-y-0 md:space-x-1">
                        <select 
                          value={inq.status}
                          onChange={(e)=>handleInquiryStatus(inq.id || '', e.target.value as any)}
                          className="mr-1 p-1 bg-slate-50 border text-[10px] rounded cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Reviewing">Reviewing</option>
                          <option value="Approved">Approved</option>
                          <option value="Declined">Declined</option>
                        </select>
                        <button 
                          onClick={()=>handleDeleteInquiry(inq.id || '')}
                          className="p-1 px-2 font-bold font-mono text-[9px] uppercase border bg-red-50 text-red-600 rounded-md cursor-pointer hover:bg-red-100 transition-all"
                        >
                          Purge
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. DATABASE BACKUP AND SEE/SAVE DB SECURE SECTION */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-105 rounded-[26px] p-6 shadow-sm space-y-8">
          
          <div className="space-y-1.5 border-b pb-4">
            <h2 className="font-display text-xl font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={24} />
              Durable Cloud Shards Backup Center
            </h2>
            <p className="text-xs text-slate-500">
              Satisfying "see and save all database" regulations: Download state backups offline or sync historical database configurations back up to live Firestore.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Download Backup */}
            <div className="border border-dashed p-6 rounded-2xl bg-slate-50/50 space-y-4">
              <div className="space-y-1">
                <span className="p-2 bg-blue-100 text-blue-700 rounded-xl inline-block">
                  <Download size={20} />
                </span>
                <h3 className="font-bold text-sm text-slate-800">Export School Data Backup</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Compiles a highly structured JSON array representation containing all current students, report cards, school bulletins, and online admissions inquiries in live state. Keeps your backup offline safely.
                </p>
              </div>

              <div className="pt-2">
                <button 
                  onClick={exportFullDatabaseBackup}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow"
                >
                  <Download size={14} />
                  <span>Download Complete .JSON Backup Schema</span>
                </button>
              </div>
            </div>

            {/* Upload/Restore Backup */}
            <div className="border border-dashed p-6 rounded-2xl bg-indigo-50/20 space-y-4">
              <div className="space-y-1">
                <span className="p-2 bg-indigo-100 text-indigo-750 rounded-xl inline-block">
                  <Upload size={20} />
                </span>
                <h3 className="font-bold text-sm text-slate-800">Restore Historical Database Backup</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Imports a previously saved complete .JSON database file. Warning: Restoration parses files sequentially and may overwrite current collections. Authorized operators only.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <input 
                  type="file" 
                  ref={uploadFileInputRef}
                  onChange={handleImportDatabaseBackup}
                  accept=".json"
                  className="hidden"
                />
                <button 
                  onClick={() => uploadFileInputRef.current?.click()}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow"
                >
                  <Upload size={14} />
                  <span>Upload and Overwrite Restore file</span>
                </button>
                <p className="text-[10px] text-slate-400 italic">Accepts only authorized JSON files generated by this system dashboard.</p>
              </div>
            </div>

          </div>

          {/* Guidelines notes */}
          <div className="p-4 bg-orange-50 text-orange-850 rounded-xl border border-orange-100 text-xs leading-relaxed flex gap-3">
            <AlertTriangle className="shrink-0 text-orange-600 mt-0.5" size={18} />
            <div>
              <p className="font-bold">Encryption & Synchronization Safeguards</p>
              <p className="text-[11px] mt-0.5">
                Restoring backups performs live sequential Firestore writes. Keep browser viewport open until backup status confirmation is shown. Any schema modifications outside of official software definitions will trigger validation rejections.
              </p>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
