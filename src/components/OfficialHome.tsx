import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Bulletin } from '../types';
import { Calendar, Phone, Mail, MapPin, ExternalLink, Award, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface OfficialHomeProps {
  onNavigate: (tab: string) => void;
}

export default function OfficialHome({ onNavigate }: OfficialHomeProps) {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBulletins() {
      try {
        const bulletinsRef = collection(db, 'bulletins');
        const q = query(bulletinsRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        const fetched: Bulletin[] = [];
        querySnapshot.forEach((doc) => {
          fetched.push({ id: doc.id, ...doc.data() } as Bulletin);
        });
        setBulletins(fetched);
      } catch (error) {
        console.error("Error fetching bulletins, using default news", error);
        // Fallback to high-quality template news if empty or permissions require seeding initial state
      } finally {
        setLoading(false);
      }
    }
    fetchBulletins();
  }, []);

  return (
    <div id="home-view" className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-8 md:p-16 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent opacity-60" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-36 h-36 md:w-48 md:h-48 bg-white p-3 rounded-2xl shadow-lg shrink-0 flex items-center justify-center border-4 border-blue-500/30"
          >
            <img 
              id="school-logo-main"
              src="https://www.image2url.com/r2/default/images/1780845091129-72ef205c-ec0e-4094-ab80-0cd92282f531.jpg" 
              alt="Dr. Abraham S. Borbor Memorial School of Excellence Logo"
              className="w-full h-full object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="inline-block px-4 py-1.5 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold tracking-wider uppercase text-blue-300">
              Transforming & Building Generations
            </div>
            
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight leading-tight">
              Dr. Abraham S. Borbor Memorial <br className="hidden md:block"/>
              <span className="text-blue-400">School of Excellence</span>
            </h1>

            <p className="text-slate-300 text-sm md:text-lg max-w-2xl font-light italic leading-relaxed">
              "A School of your choice that is transforming & building up the lives of our future generations. Here, learning is just not the goal, we also inspire!"
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <button
                id="btn-nav-portal-main"
                onClick={() => onNavigate('portal')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
              >
                <FileText size={18} />
                Access Student Portal
              </button>
              <button
                id="btn-nav-bulletins-main"
                onClick={() => {
                  const element = document.getElementById('bulletins-section');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-medium rounded-xl transition-all cursor-pointer"
              >
                View Announcements
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Value Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800">Transformative Goals</h3>
            <p className="text-slate-500 text-sm mt-1">We inspire our scholars to move beyond conventional memorization to comprehensive critical thinking.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800">Academic Rigor</h3>
            <p className="text-slate-500 text-sm mt-1">Our comprehensive 74% strict pass benchmark ensures excellence and authentic learning indicators.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800">Vibrant Location</h3>
            <p className="text-slate-500 text-sm mt-1">Located in Mount Barclay, Montserrado, Liberia – providing a peaceful and centered intellectual environment.</p>
          </div>
        </div>
      </section>

      {/* Main Core Content: Bulletins & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* News Feed / Bulletins */}
        <div id="bulletins-section" className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
                School Bulletins & Announcements
              </h2>
              <p className="text-xs text-slate-500 font-mono">LIVE OFFICAL UPDATES AND ACADEMIC CALENDARS</p>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 w-12 rounded" />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-slate-100 h-36 rounded-2xl" />
              ))}
            </div>
          ) : bulletins.length === 0 ? (
            <div className="bg-white border rounded-2xl p-8 text-center text-slate-500 space-y-3">
              <Calendar size={40} className="mx-auto text-slate-400" />
              <p className="font-medium text-slate-700">No active bulletins right now</p>
              <p className="text-sm">Administrative posts will display here immediately when uploaded.</p>
              <button 
                onClick={() => onNavigate('admin')}
                className="mt-2 text-xs text-blue-600 font-semibold hover:underline"
              >
                Log in as Admin to post bulletin
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {bulletins.map((bulletin) => (
                <article 
                  key={bulletin.id} 
                  id={`bulletin-${bulletin.id}`}
                  className="bg-white border border-slate-100 hover:border-slate-200 transition-all rounded-2xl shadow-sm hover:shadow overflow-hidden flex flex-col md:flex-row"
                >
                  {bulletin.imageUrl && (
                    <div className="md:w-1/3 h-48 md:h-auto overflow-hidden relative shrink-0">
                      <img 
                        src={bulletin.imageUrl} 
                        alt={bulletin.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        referrerPolicy="referrer"
                      />
                    </div>
                  )}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {bulletin.category}
                        </span>
                        <span className="text-slate-400 text-xs">
                          {bulletin.createdAt?.toDate ? 
                            new Date(bulletin.createdAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
                            new Date().toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xl text-slate-800 mb-2 leading-snug">
                        {bulletin.title}
                      </h3>
                      <p className="text-slate-600 text-sm line-clamp-3 whitespace-pre-line leading-relaxed">
                        {bulletin.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 text-xs text-slate-500">
                      <span>Posted by: <strong className="text-slate-700">{bulletin.author}</strong></span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* School Information Sidebar */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="font-display text-lg font-bold text-slate-800 border-b pb-3 border-slate-100">
              Official Contact & Info
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-blue-600 mt-0.5 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-semibold text-slate-800">School Campus</p>
                  <p className="text-slate-500">Mount Barclay, Montserrado, Liberia</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="text-indigo-600 mt-0.5 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-semibold text-slate-800">Email Address</p>
                  <a href="mailto:dr.abrahamsborbor@gmail.com" className="text-blue-600 hover:underline">
                    dr.abrahamsborbor@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="text-violet-600 mt-0.5 shrink-0" size={18} />
                <div className="text-sm">
                  <p className="font-semibold text-slate-800">Contact Number</p>
                  <a href="tel:+231775633880" className="text-slate-600 hover:underline">
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white font-medium text-sm rounded-xl hover:opacity-90 transition-all cursor-pointer"
              >
                <span>Follow us on Facebook</span>
                <ExternalLink size={14} />
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h4 className="font-display font-bold text-slate-800 mb-2">Our Founder's Legacy</h4>
            <p className="text-slate-600 text-xs leading-relaxed">
              Dr. Abraham S. Borbor Memorial School of Excellence honors the memory of a profound leader committed to transforming communities through accessible, world-class education. We ensure every child receives quality coaching and personal motivation.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
