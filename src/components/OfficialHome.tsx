import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, query, orderBy, limit, addDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Bulletin, AcademicReport } from '../types';
import { 
  Calendar, Phone, Mail, MapPin, ExternalLink, Award, FileText, 
  CheckCircle2, Search, Sparkles, BookOpen, UserCheck, 
  ChevronRight, Compass, ShieldCheck, HeartHandshake, Loader2, Info, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DownloadAppBanner from './DownloadAppBanner';

interface OfficialHomeProps {
  onNavigate: (tab: string) => void;
}

export default function OfficialHome({ onNavigate }: OfficialHomeProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Custom Detailed Bulletin Modal State
  const [activeBulletinModal, setActiveBulletinModal] = useState<Bulletin | null>(null);

  // Verification search states
  const [verificationId, setVerificationId] = useState('');
  const [verificationResult, setVerificationResult] = useState<AcademicReport | null>(null);
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Admission inquiry states
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  
  // Form states
  const [studentName, setStudentName] = useState('');
  const [gradeRequested, setGradeRequested] = useState('Grade 1');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [prevSchool, setPrevSchool] = useState('');
  const [notes, setNotes] = useState('');

  // Grades list for high school (Grade 1 - 12)
  const availableGrades = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

  useEffect(() => {
    async function fetchBulletins() {
      try {
        const bulletinsRef = collection(db, 'bulletins');
        const q = query(bulletinsRef, orderBy('createdAt', 'desc'), limit(15));
        const querySnapshot = await getDocs(q);
        const fetched: Bulletin[] = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Bulletin);
        });
        setBulletins(fetched);
      } catch (error) {
        console.error("Error fetching bulletins, using default news", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBulletins();
  }, []);

  // Filter bulletins list based on category and query search string
  const filteredBulletins = bulletins.filter(b => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculated estimated read time based on text length
  const getReadTime = (text: string) => {
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // 200 words per minute average
    return `${minutes} min read`;
  };

  // Verification lookup in Firestore reports
  async function handleVerification(e: FormEvent) {
    e.preventDefault();
    setVerificationError('');
    setVerificationResult(null);
    const searchId = verificationId.trim().toUpperCase();

    if (!searchId) {
      setVerificationError('Please supply a legitimate Scholar ID to initiate verification lookup.');
      return;
    }

    setVerifying(true);
    try {
      const reportsRef = collection(db, 'reports');
      const q = query(reportsRef, where('studentId', '==', searchId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setVerificationError(`No valid academic reports match the credentials for "${searchId}". Double check the unique school ID.`);
        setVerifying(false);
        return;
      }

      // Capture newest or latest report
      const matchedReports: AcademicReport[] = [];
      querySnapshot.forEach((doc) => {
        matchedReports.push({ id: doc.id, ...doc.data() } as AcademicReport);
      });

      // Sort matching academic reports to take the newest term/period
      matchedReports.sort((a, b) => b.academicYear.localeCompare(a.academicYear) || b.term.localeCompare(a.term));
      
      setVerificationResult(matchedReports[0]);
    } catch (err) {
      console.error(err);
      setVerificationError('Error connecting to verification databases. Retry when convenient.');
    } finally {
      setVerifying(false);
    }
  }

  // Admissions inquiry submit handler
  async function handleAdmissionsSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmittingInquiry(true);
    setInquirySuccess(false);

    try {
      const inquiryPayload = {
        studentName: studentName.trim(),
        gradeLevel: gradeRequested,
        gender,
        dob,
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        parentEmail: parentEmail.trim() || null,
        previousSchool: prevSchool.trim() || null,
        additionalNotes: notes.trim() || null,
        status: 'Pending',
        createdAt: new Date()
      };

      await addDoc(collection(db, 'inquiries'), inquiryPayload);
      setInquirySuccess(true);
      
      // Clean inputs
      setStudentName('');
      setDob('');
      setParentName('');
      setParentPhone('');
      setParentEmail('');
      setPrevSchool('');
      setNotes('');
    } catch (err) {
      console.error(err);
      alert('Error recording admissions inquiry. Please notify support or check internet.');
    } finally {
      setSubmittingInquiry(false);
    }
  }

  return (
    <div id="home-view" className="space-y-16">
      
      {/* Dynamic Native PWA Installer Trigger Banner */}
      <DownloadAppBanner />

      {/* Hero Exhibition Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-900 to-indigo-950 text-white rounded-[32px] p-8 md:p-16 shadow-xl border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-indigo-500/10 to-transparent opacity-70" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-14">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.8 }}
            className="w-40 h-40 md:w-52 md:h-52 bg-white/95 p-3.5 rounded-3xl shadow-2xl shrink-0 flex items-center justify-center border-4 border-blue-500/30 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-blue-100/10 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
            <img 
              id="school-logo-main"
              src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
              alt="Dr. Abraham S. Borbor Memorial School of Excellence Logo"
              className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
          </motion.div>
 
          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-500/25 border border-blue-400/40 rounded-full text-[11px] font-bold tracking-wider uppercase text-blue-300 font-mono">
              <Sparkles size={12} className="animate-pulse text-yellow-400" />
              Liberia's Preeminent Digital High School Interface
            </div>
            
            <h1 className="font-display text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
              Dr. Abraham S. Borbor <br className="hidden md:block"/>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Memorial School of Excellence</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-lg max-w-2xl font-light italic leading-relaxed">
              "A School of your choice that is transforming & building up the lives of our future generations. Here, learning is not just the goal, we inspire!"
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <button
                id="btn-nav-portal-main"
                onClick={() => onNavigate('portal')}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 cursor-pointer text-sm"
              >
                <UserCheck size={18} />
                Access Scholar Portal
              </button>
              <button
                id="btn-nav-bulletins-main"
                onClick={() => {
                  const element = document.getElementById('bulletins-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold rounded-2xl transition-all cursor-pointer text-sm hover:border-white/40"
              >
                Explore News Feed
              </button>
              <button
                id="btn-nav-inquiries-main"
                onClick={() => {
                  const element = document.getElementById('admissions-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 bg-indigo-650 hover:bg-indigo-650 text-indigo-200 hover:text-white font-bold rounded-2xl transition-all cursor-pointer text-sm hover:border-white/40 border border-indigo-500/20"
              >
                Apply Online
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Core Educational Pillars & Values Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
          <div className="p-3 w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Award size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Transformative Coaching</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              We inspire our scholars to move beyond conventional route learning to creative analytical structures. We develop thinkers, creators, and future global administrators.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
          <div className="p-3 w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">74% Pass Benchmark</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              We maintain rigorous, honest Liberian education guidelines. Any cumulative average below 74% activates academic intervention protocols to secure genuine success indicators.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
          <div className="p-3 w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Safe Mount Barclay Campus</h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              Providing a highly clean, disciplined, intellectual shelter in Montserrado County. Safe classrooms, structured laboratories, and supportive athletic facilities represent our standard.
            </p>
          </div>
        </div>
      </section>

      {/* Core Split Sections: Bulletins News Feed & Side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* News Feed / Bulletins Container */}
        <div id="bulletins-section" className="lg:col-span-2 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                School Bulletins & News Feeds
              </h2>
              <p className="text-xs text-slate-500 font-mono">OFFICIAL REAL-TIME ANNOUNCEMENTS & EVENTS FEED</p>
            </div>
            
            {/* Search filter input */}
            <div className="relative max-w-xs w-full">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search articles & stories..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white border rounded-xl text-xs focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Bulletins Category Filters */}
          <div className="flex flex-wrap gap-2.5">
            {['All', 'Announcement', 'Event', 'Academics', 'Notice', 'Newsletter'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-44 rounded-2xl" />
              ))}
            </div>
          ) : filteredBulletins.length === 0 ? (
            <div className="bg-white border rounded-2xl p-12 text-center text-slate-500 space-y-3">
              <Calendar size={44} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-800">No postings recorded</p>
              <p className="text-xs max-w-sm mx-auto">None of our active bulletins matches "{searchQuery}". Try typing other keyword variations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBulletins.map((bulletin) => (
                <motion.article 
                  layout
                  key={bulletin.id} 
                  className="bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all rounded-2xl overflow-hidden flex flex-col sm:flex-row group"
                >
                  {bulletin.imageUrl && (
                    <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden relative shrink-0">
                      <img 
                        src={bulletin.imageUrl} 
                        alt={bulletin.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold tracking-wider font-mono uppercase">
                          {bulletin.category}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">•</span>
                        <span className="text-slate-400 text-xs font-mono">
                          {getReadTime(bulletin.content)}
                        </span>
                        <span className="text-slate-400 text-xs font-mono hidden md:inline">•</span>
                        <span className="text-slate-400 text-xs font-mono hidden md:inline">
                          {bulletin.createdAt?.toDate ? 
                            new Date(bulletin.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                            new Date().toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="font-display font-bold text-lg md:text-xl text-slate-800 group-hover:text-blue-600 transition-colors leading-snug">
                        {bulletin.title}
                      </h3>
                      
                      <p className="text-slate-600 text-xs md:text-sm line-clamp-3 whitespace-pre-line leading-relaxed">
                        {bulletin.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-50 pt-3.5 mt-2">
                      <span className="text-[11px] text-slate-500">
                        Posted by: <strong className="text-slate-750 font-semibold">{bulletin.author}</strong>
                      </span>
                      
                      <button 
                        onClick={() => setActiveBulletinModal(bulletin)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-all cursor-pointer"
                      >
                        Read Post
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar panels: Admissions, Verification search, coordinates */}
        <div className="space-y-8">
          
          {/* Scholars Record academic Verification Check */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-white/5 space-y-5">
            <div className="space-y-1.5">
              <span className="text-[9px] text-blue-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
                <ShieldCheck size={12} /> Secure Validation Key
              </span>
              <h3 className="font-display font-bold text-lg">Scholar Record Validator</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Parents, corporate sponsors, and admissions can instantly query and validate cumulative scholar scorecards live in our system database.
              </p>
            </div>

            <form onSubmit={handleVerification} className="space-y-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Enter unique Scholar ID..." 
                  value={verificationId}
                  onChange={(e) => setVerificationId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-mono text-white"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={verifying}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-white shadow-sm"
              >
                {verifying ? <Loader2 size={12} className="animate-spin text-white" /> : 'Validate Credentials'}
              </button>
            </form>

            <AnimatePresence>
              {verificationError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 bg-red-950/40 border border-red-500/20 text-red-300 text-[11px] rounded-xl leading-normal mt-2"
                >
                  {verificationError}
                </motion.div>
              )}

              {verificationResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-800 rounded-2xl p-4 space-y-3 border border-slate-700 mt-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                    <span className="font-semibold text-slate-200">VALID REPORT FOUND</span>
                    <span className="px-2 py-0.5 bg-green-950 text-green-400 border border-green-500/20 font-bold rounded text-[9px] uppercase font-mono">
                      Authentic
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-slate-300">Name: <strong className="text-white">{verificationResult.studentName}</strong></p>
                    <p className="text-slate-300">ID: <span className="font-mono text-slate-100">{verificationResult.studentId}</span></p>
                    <p className="text-slate-300">Assessed Level: <strong className="text-slate-100">{verificationResult.gradeLevel}</strong></p>
                    <p className="text-slate-300">Period: <strong className="text-slate-100">{verificationResult.term} ({verificationResult.academicYear})</strong></p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-slate-700/60">
                      <div className="bg-slate-700/40 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">GPA Score</span>
                        <span className="text-sm font-bold text-teal-400 font-mono">{verificationResult.gpa.toFixed(2)}</span>
                      </div>
                      <div className="bg-slate-700/40 p-2 rounded-lg text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Outcome Code</span>
                        <span className={`text-sm font-bold uppercase ${verificationResult.status === 'Pass' ? 'text-green-400' : 'text-red-400'}`}>
                          {verificationResult.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Informational card */}
          <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-1.5 text-sm uppercase tracking-wide">
              <Info size={16} className="text-blue-600" />
              Administrative Contacts
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 mt-0.5 shrink-0" size={16} />
                <div className="text-xs md:text-sm">
                  <p className="font-semibold text-slate-800">School Campus</p>
                  <p className="text-slate-500 text-xs">Mount Barclay, Montserrado, Liberia</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="text-indigo-650 mt-0.5 shrink-0" size={16} />
                <div className="text-xs md:text-sm">
                  <p className="font-semibold text-slate-800">Direct Email</p>
                  <a href="mailto:dr.abrahamsborbor@gmail.com" className="text-blue-600 hover:underline text-xs">
                    dr.abrahamsborbor@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-violet-600 mt-0.5 shrink-0" size={16} />
                <div className="text-xs md:text-sm">
                  <p className="font-semibold text-slate-800">Information Line</p>
                  <a href="tel:+231775633880" className="text-slate-600 hover:underline text-xs">
                    +231 77 563 3880
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a 
                href="https://www.facebook.com/DASBMSE?mibextid=ZbWKwL" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-650 hover:bg-blue-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                <span>Browse Facebook Community</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Founder's legacy highlight */}
          <div className="bg-gradient-to-br from-blue-50/50 via-indigo-50/40 to-slate-100 rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
            <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <BookOpen size={16} className="text-indigo-600" />
              Vision & Legacy
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Dr. Abraham S. Borbor Memorial School of Excellence honors the legacy of a visionary medical & educational coordinator who committed his entire career to helping rural communities secure safe intellectual pathways. Standardized coaching keeps the legacy shining!
            </p>
          </div>
        </div>

      </div>

      {/* Online Admissions Application Form Section */}
      <section id="admissions-section" className="bg-gradient-to-b from-slate-50 to-white rounded-[32px] border p-6 md:p-12 shadow-sm space-y-8">
        
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <span className="text-[10px] text-blue-600 font-mono tracking-widest uppercase font-bold">Online Admissions Gateway</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-slate-900">
            Submit an Inquiry for the 2026 Term
          </h2>
          <p className="text-slate-500 text-xs md:text-sm">
            Interested in enrolling? Complete the admissions inquiry form for high school Grade 1 to 12. Supporting documents are queried upon administrative interview scheduling.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-sm max-w-4xl mx-auto">
          
          {inquirySuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-4 max-w-md mx-auto"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-800">Inquiry Received and Logged!</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Thank you for applying. Your primary admissions inquiry data shard has been uploaded successfully. Outschool admin operators will prioritize reviewing and contacting parents on <strong>{parentName}</strong>'s contact number <strong>{parentPhone}</strong>.
              </p>
              <button 
                onClick={() => setInquirySuccess(false)}
                className="mt-2 text-xs bg-slate-100 hover:bg-slate-250 border px-4 py-2 font-semibold text-slate-700 rounded-xl transition-all cursor-pointer"
              >
                Submit another inquiry
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleAdmissionsSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Scholar Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-1">Scholar Details</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Full Name of Student</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Samuel Gboyah"
                      value={studentName}
                      onChange={(e)=>setStudentName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Target Grade Level</label>
                      <select 
                        value={gradeRequested}
                        onChange={(e)=>setGradeRequested(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border text-xs md:text-sm rounded-xl"
                      >
                        {availableGrades.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Gender</label>
                      <select 
                        value={gender}
                        onChange={(e)=>setGender(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border text-xs md:text-sm rounded-xl"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                    <input 
                      type="date"
                      value={dob}
                      onChange={(e)=>setDob(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl text-slate-700"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Previous School Attended</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Mount Barclay Preparatory"
                      value={prevSchool}
                      onChange={(e)=>setPrevSchool(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                {/* Parent Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-1">Parent & Sponsor Contact</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Parent / Sponsor Full Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Arthur Gboyah Sr."
                      value={parentName}
                      onChange={(e)=>setParentName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Parent Contact Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +231 77 563 3880"
                      value={parentPhone}
                      onChange={(e)=>setParentPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Contact Email Address (Optional)</label>
                    <input 
                      type="email" 
                      placeholder="e.g. parent@gmail.com"
                      value={parentEmail}
                      onChange={(e)=>setParentEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs md:text-sm rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">Additional Remarks / Special Notes</label>
                    <textarea 
                      rows={3}
                      placeholder="Describe medical reports, previous grade metrics, or other requests..."
                      value={notes}
                      onChange={(e)=>setNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 focus:bg-white border text-xs rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-50 pt-5 text-right">
                <button
                  type="submit"
                  disabled={submittingInquiry}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-sm text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer float-right transition-all disabled:bg-blue-400"
                >
                  {submittingInquiry ? <Loader2 size={16} className="animate-spin" /> : 'File Admission Inquiry'}
                </button>
              </div>

            </form>
          )}

        </div>
      </section>

      {/* Advanced Detailed Article Reader Overlay Modal */}
      <AnimatePresence>
        {activeBulletinModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border p-6 md:p-8 shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => setActiveBulletinModal(null)}
                className="absolute right-6 top-6 p-1 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                <X size={20} />
              </button>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] md:text-xs text-slate-400 font-mono">
                  <span className="px-2.5 py-0.5 bg-blue-150 text-blue-700 font-bold rounded-md uppercase">
                    {activeBulletinModal.category}
                  </span>
                  <span>•</span>
                  <span>
                    {activeBulletinModal.createdAt?.toDate ? 
                      new Date(activeBulletinModal.createdAt.toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 
                      new Date().toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>{getReadTime(activeBulletinModal.content)}</span>
                </div>

                <h2 className="font-display text-xl md:text-3xl font-extrabold text-slate-900 leading-snug">
                  {activeBulletinModal.title}
                </h2>

                <div className="flex items-center gap-2 border-b border-t border-slate-50 py-3 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600">
                    {activeBulletinModal.author.charAt(0)}
                  </div>
                  <span>Posted Statement by: <strong className="text-slate-700">{activeBulletinModal.author}</strong></span>
                </div>
              </div>

              {activeBulletinModal.imageUrl && (
                <div className="w-full h-56 md:h-80 rounded-2xl overflow-hidden shadow-sm">
                  <img 
                    src={activeBulletinModal.imageUrl} 
                    alt={activeBulletinModal.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="text-slate-650 text-xs md:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {activeBulletinModal.content}
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-5">
                <p className="text-[10px] text-slate-400 font-mono">DR. ABRAHAM S. BORBOR SCHOOL OF EXCELLENCE</p>
                <button 
                  onClick={() => setActiveBulletinModal(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Dismiss Reader
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
