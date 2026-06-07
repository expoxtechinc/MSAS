import { useState, useEffect } from 'react';
import OfficialHome from './components/OfficialHome';
import StudentPortal from './components/StudentPortal';
import AdminPortal from './components/AdminPortal';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { GraduationCap, MapPin, Mail, Phone, ShieldAlert, Facebook, Newspaper, UserCheck, Lock, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');

  // Trigger automatic initial database seedling for high-fidelity presentation
  // This ensures that when the app boots up for the first time, it has beautiful bulletins,
  // registered students, and grade records pre-seeded so the app does not look like an empty shell.
  useEffect(() => {
    async function seedDatabaseIfEmpty() {
      try {
        const bulletinsSnapshot = await getDocs(collection(db, 'bulletins'));
        if (bulletinsSnapshot.empty) {
          // Pre-seed some beautiful bulletins
          const bulletinDataList = [
            {
              title: "Welcome to the 2026 Academic Year!",
              content: "We are thrilled to welcome all new and returning scholars to the Dr. Abraham S. Borbor Memorial School of Excellence! Our campus in Mount Barclay is fully prepared to provide transformative growth opportunities. Learning is not just the goal, we inspire!",
              category: "Notice",
              author: "Principal Office",
              imageUrl: "https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg",
              createdAt: new Date()
            },
            {
              title: "Important Notice: Mid-Term Examination Timetable Released",
              content: "The official academic timetable for the Mid-Term Assessment is now published. All students are advised to access their Student Portals using their unique ID and school-provided password to view required curricula coverage. Remember that any average grade below 74% fails.",
              category: "Academics",
              author: "Registrar Office",
              imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80",
              createdAt: new Date(Date.now() - 86400000)
            },
            {
              title: "Annual Sports & Cultural Festival Announced",
              content: "Get ready for the great DASBMSE Sports & Cultural Festival next Friday. There will be competitive academic debates, football cups, and artistic performances showcasing the amazing potential of our future generations.",
              category: "Event",
              author: "Student Affairs",
              imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80",
              createdAt: new Date(Date.now() - 172800000)
            }
          ];

          for (const item of bulletinDataList) {
            const tempId = 'ann-' + Math.random().toString(36).substring(2, 10);
            await setDoc(doc(db, 'bulletins', tempId), item);
          }
        }

        const studentsSnapshot = await getDocs(collection(db, 'students'));
        if (studentsSnapshot.empty) {
          // Pre-seed premium demo students
          const demoStudents = [
            {
              studentId: "STUDENT101",
              name: "Emmanuel T. Kolleh",
              password: "studentPass123",
              gradeLevel: "Grade 11",
              gender: "Male",
              createdAt: new Date()
            },
            {
              studentId: "STUDENT102",
              name: "Blessing S. Gbayee",
              password: "excellence2026",
              gradeLevel: "Grade 12",
              gender: "Female",
              createdAt: new Date()
            }
          ];

          for (const stu of demoStudents) {
            await setDoc(doc(db, 'students', stu.studentId), stu);
          }

          // Pre-seed student report cards matching DEMO IDs
          const demoReports = [
            {
              studentId: "STUDENT101",
              studentName: "Emmanuel T. Kolleh",
              gradeLevel: "Grade 11",
              term: "1st Period",
              academicYear: "2025-2026",
              average: 81.4,
              gpa: 3.0,
              status: "Pass",
              grades: [
                { subject: "Mathematics", score: 88, grade: "B", gradePoint: 3, comments: "Excellent dynamic formulation logic." },
                { subject: "English Language", score: 81, grade: "B", gradePoint: 3, comments: "Very creative essays." },
                { subject: "General Science", score: 79, grade: "C", gradePoint: 2, comments: "Passed, needs more dedication." },
                { subject: "Social Studies", score: 85, grade: "B", gradePoint: 3, comments: "Amazing participation." },
                { subject: "Physics", score: 74, grade: "C", gradePoint: 2, comments: "Borderline pass, must study formula sheets." }
              ],
              updatedAt: new Date()
            },
            {
              studentId: "STUDENT102",
              studentName: "Blessing S. Gbayee",
              gradeLevel: "Grade 12",
              term: "1st Period",
              academicYear: "2025-2026",
              average: 72.8,
              gpa: 1.6,
              status: "Fail", // Average under 74 FAILS
              grades: [
                { subject: "Mathematics", score: 70, grade: "F", gradePoint: 0, comments: "Under 74 fails. Please join recovery classes." },
                { subject: "English Language", score: 88, grade: "B", gradePoint: 3, comments: "Excellent oratorical skill." },
                { subject: "Biology", score: 65, grade: "F", gradePoint: 0, comments: "Failed. Need better test preparation." },
                { subject: "Social Studies", score: 74, grade: "C", gradePoint: 2, comments: "Barely passed." },
                { subject: "Phonics & Speech", score: 71, grade: "F", gradePoint: 0, comments: "Failed. Focus on phoneme articulation." }
              ],
              updatedAt: new Date()
            }
          ];

          for (const rep of demoReports) {
            const reportId = `${rep.studentId}-${rep.term.replace(/\s+/g, '')}-20252026`;
            await setDoc(doc(db, 'reports', reportId), rep);
          }
        }

      } catch (err) {
        console.warn("Initial seed warning, non-blocking:", err);
      }
    }
    seedDatabaseIfEmpty();
  }, []);

  return (
    <div id="app-shell" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Banner Ticker */}
      <div className="bg-primary-950 text-white text-[11px] font-medium py-2 px-4 flex items-center justify-between border-b border-white/10 shrink-0 select-none">
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="bg-blue-605/30 px-2 py-0.5 rounded text-blue-300 font-mono text-[9px] uppercase tracking-wider font-bold">News Ticker</span>
          <p className="animate-pulse truncate">
            Welcome to the Dr. Abraham S. Borbor Memorial School of Excellence OFFICIAL website. Mount Barclay, Montserrado, Liberia.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4 text-slate-300 font-mono">
          <span>Call: +231 77 563 3880</span>
          <span>•</span>
          <span>Mon - Fri: 8:00 AM - 4:00 PM</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo Brand Brand */}
          <div 
            onClick={() => setActiveTab('home')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-white p-0.5 rounded-lg border shadow-sm flex items-center justify-center transition-all group-hover:scale-105">
              <img 
                id="school-logo-navbar"
                src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
                alt="School Logo" 
                className="w-full h-full object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 tracking-tight leading-tight block text-sm sm:text-base">
                Dr. Abraham S. Borbor Memorial
              </span>
              <span className="text-[11px] text-blue-600 uppercase font-bold tracking-wider font-mono block">
                School of Excellence
              </span>
            </div>
          </div>

          {/* Links Shell */}
          <nav className="flex items-center gap-1 sm:gap-3">
            <button
              id="btn-nav-home"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'home' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Landmark size={15} />
              <span className="hidden sm:inline">Official Home</span>
            </button>

            <button
              id="btn-nav-portal"
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'portal' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UserCheck size={15} />
              <span>Student Portal</span>
            </button>

            <button
              id="btn-nav-admin"
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'admin' 
                  ? 'bg-blue-950 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Lock size={15} />
              <span>Admin Gate</span>
            </button>
          </nav>

        </div>
      </header>

      {/* RENDER DYNAMIC PAGES */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {activeTab === 'home' && (
              <OfficialHome onNavigate={(tab) => setActiveTab(tab)} />
            )}
            
            {activeTab === 'portal' && (
              <StudentPortal />
            )}

            {activeTab === 'admin' && (
              <AdminPortal />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Editorial Styled Footer Section */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white rounded-lg p-0.5 shadow flex items-center justify-center">
                <img 
                  src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
                  alt="DASBMSE Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="font-display font-bold text-md tracking-tight">DASBMSE School</span>
            </div>
            
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              We inspire, transform and build the future generation of professionals and leaders. High standards of learning, discipline and academic excellence.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm tracking-wider uppercase text-blue-400">Campus Contact</h4>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-500" />
                <span>Mount Barclay, Montserrado, Liberia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-slate-500" />
                <a href="tel:+231775633880" className="hover:text-white transition-colors">+231 77 563 3880</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-slate-500" />
                <a href="mailto:dr.abrahamsborbor@gmail.com" className="hover:text-white transition-colors">dr.abrahamsborbor@gmail.com</a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display font-semibold text-sm tracking-wider uppercase text-blue-400">Connect & Support</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Stay in touch with daily announcements, photo galleries and academic calendars posted by our staff over on Facebook.
            </p>
            <div className="flex gap-2.5">
              <a 
                href="https://www.facebook.com/DASBMSE?mibextid=ZbWKwL" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 rounded-lg transition-all"
              >
                <Facebook size={16} />
              </a>
            </div>
          </div>

        </div>

        <div className="bg-slate-950 py-6 px-4 border-t border-slate-850 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Dr. Abraham S. Borbor Memorial School of Excellence. All Rights Reserved.</p>
        </div>
      </footer>

    </div>
  );
}
