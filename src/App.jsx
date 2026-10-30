import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  collection, 
  addDoc, 
  deleteDoc,
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from './firebase';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isRegister, setIsRegister] = useState(false);
  const [loginRole, setLoginRole] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('tickets'); // 'tickets' หรือ 'users'
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminUpdateTicket, setAdminUpdateTicket] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [updateStatusVal, setUpdateStatusVal] = useState('In Progress');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const [newDevice, setNewDevice] = useState('');
  const [newCategory, setNewCategory] = useState('Hardware');
  const [newLocation, setNewLocation] = useState('');
  const [newSymptom, setNewSymptom] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    
    // ดึงข้อมูลรายการแจ้งซ่อม
    const qTickets = query(collection(db, "tickets"), orderBy("createdAt", "desc"));
    const unsubscribeTickets = onSnapshot(qTickets, (snapshot) => {
      const ticketsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setTickets(ticketsData);
    }, (error) => {
      console.error("Firestore Tickets Error:", error);
    });

    // ดึงข้อมูลผู้ใช้งาน (เก็บใน collection ชื่อ users)
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setUsersList(usersData);
    }, (error) => {
      console.error("Firestore Users Error:", error);
    });

    return () => {
      unsubscribeTickets();
      unsubscribeUsers();
    };
  }, [currentUser]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      let userRes;
      if (isRegister) {
        if (!name) {
          setAuthError('กรุณากรอกชื่อ-นามสกุล');
          setLoading(false);
          return;
        }
        userRes = await createUserWithEmailAndPassword(auth, email, password);
        
        // บันทึกข้อมูลผู้ใช้ลงใน Firestore collection "users"
        await addDoc(collection(db, "users"), {
          uid: userRes.user.uid,
          name: name,
          email: email,
          role: loginRole,
          createdAt: serverTimestamp()
        });
      } else {
        userRes = await signInWithEmailAndPassword(auth, email, password);
      }

      setCurrentUser({
        uid: userRes.user.uid,
        email: userRes.user.email,
        name: isRegister ? name : (loginRole === 'admin' ? `ผู้ดูแลระบบ (${email.split('@')[0]})` : `ผู้ใช้งาน (${email.split('@')[0]})`),
        role: loginRole
      });
    } catch (err) {
      setAuthError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีนี้ยังไม่ได้ลงทะเบียน');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();
    if (!newDevice || !newLocation || !newSymptom) return;

    setLoading(true);
    const dateStr = new Date().toLocaleString('th-TH');

    try {
      await addDoc(collection(db, "tickets"), {
        ticketCode: `REP-${Date.now().toString().slice(-4)}`,
        device: newDevice,
        category: newCategory,
        location: newLocation,
        symptom: newSymptom,
        reporter: currentUser.name,
        reporterEmail: currentUser.email,
        date: dateStr,
        status: 'Pending',
        note: '',
        createdAt: serverTimestamp(),
        timeline: [
          { status: 'รอดำเนินการ', date: dateStr, detail: 'ส่งคำขอแจ้งซ่อมเข้าสู่ระบบเรียบร้อย' }
        ]
      });

      setShowAddModal(false);
      setNewDevice('');
      setNewLocation('');
      setNewSymptom('');
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdminUpdate = async (e) => {
    e.preventDefault();
    if (!adminUpdateTicket) return;

    setLoading(true);
    const dateStr = new Date().toLocaleString('th-TH');

    let statusText = 'รอดำเนินการ';
    if (updateStatusVal === 'In Progress') statusText = 'กำลังดำเนินการซ่อม';
    if (updateStatusVal === 'Completed') statusText = 'ซ่อมเสร็จสิ้น';
    if (updateStatusVal === 'Cancelled') statusText = 'ยกเลิกรายการ';

    const updatedTimeline = [
      ...(adminUpdateTicket.timeline || []),
      { 
        status: statusText, 
        date: dateStr, 
        detail: newNote ? `หมายเหตุช่าง: ${newNote}` : `อัปเดตสถานะเป็น ${statusText}` 
      }
    ];

    try {
      const ticketRef = doc(db, "tickets", adminUpdateTicket.id);
      await updateDoc(ticketRef, {
        status: updateStatusVal,
        note: newNote || adminUpdateTicket.note,
        timeline: updatedTimeline
      });

      setAdminUpdateTicket(null);
      setNewNote('');
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งซ่อมนี้ออกจากระบบ?")) return;
    try {
      await deleteDoc(doc(db, "tickets", ticketId));
    } catch (err) {
      alert("ไม่สามารถลบข้อมูลได้: " + err.message);
    }
  };

  // ฟังก์ชันลบผู้ใช้งานออกจากระบบ
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้ออกจากระบบ?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (err) {
      alert("ไม่สามารถลบผู้ใช้งานได้: " + err.message);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = (t.device || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.ticketCode || t.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.reporter || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesUser = currentUser?.role === 'admin' || t.reporterEmail === currentUser?.email || t.reporter === currentUser?.name;
    return matchesSearch && matchesStatus && matchesUser;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen flex font-sans bg-slate-100">
        <div 
          className="hidden lg:flex lg:w-3/5 p-16 flex-col justify-between relative overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1920&auto=format&fit=crop')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-indigo-900/60 to-slate-900/40 backdrop-blur-[3px]"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl shadow-lg">🛠️</div>
            <span className="font-extrabold text-white text-xs tracking-widest uppercase">VOCATIONAL DIPLOMA PROJECT</span>
          </div>

          <div className="relative z-10 space-y-6 my-auto max-w-xl">
            <span className="px-4 py-1.5 bg-blue-500/30 text-blue-100 border border-blue-300/40 rounded-full text-xs font-bold backdrop-blur-md inline-block shadow-sm">
              ✨ SMART REPAIR & TRACKING SYSTEM
            </span>
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
              Computer Repair & <br />Asset Tracking
            </h1>
            <p className="text-slate-100 text-sm leading-relaxed drop-shadow bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15">
              ระบบสารสนเทศเพื่อการจัดการและติดตามสถานะงานซ่อมอุปกรณ์คอมพิวเตอร์และครุภัณฑ์แบบเรียลไทม์ รองรับสิทธิ์การใช้งานแยกส่วนระหว่างผู้ใช้และช่างเทคนิค พร้อมเชื่อมต่อ Cloud Database
            </p>
          </div>

          <div className="relative z-10 text-xs text-slate-300 font-medium">
            © 2026 Vocational Diploma Project. Designed for Excellence.
          </div>
        </div>

        <div className="w-full lg:w-2/5 flex items-center justify-center p-8 sm:p-12 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-slate-200/80 text-slate-800">
            <div className="text-center mb-6">
              <div className="inline-flex p-3.5 bg-blue-600 rounded-2xl mb-3 text-white text-xl shadow-lg shadow-blue-500/30 lg:hidden">🛠️</div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">เข้าสู่ระบบ</h2>
              <p className="text-slate-400 text-xs mt-1">กรุณากรอกข้อมูลบัญชีเพื่อเข้าใช้งานระบบ</p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => setLoginRole('user')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${loginRole === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                👤 ผู้ใช้งานทั่วไป
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('admin')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${loginRole === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🛡️ ช่างซ่อม / แอดมิน
              </button>
            </div>

            {authError && <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-xl text-xs font-medium border border-rose-100">{authError}</div>}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="สมชาย ใจดี" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@college.ac.th" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-xs">
                {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีใช่หรือไม่?'}{' '}
              <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-bold hover:underline">
                {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิกใหม่'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <nav className="bg-white text-slate-800 px-8 py-4 shadow-sm flex justify-between items-center border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md text-lg">🛠️</div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-slate-900">REPAIR TRACKING SYSTEM</h1>
            <p className="text-[10px] text-slate-400">ระบบสารสนเทศติดตามงานซ่อมครุภัณฑ์ (Cloud Real-time)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700">{currentUser.name}</p>
            <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold mt-0.5 ${
              currentUser.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {currentUser.role === 'admin' ? '🛡️ ผู้ดูแลระบบ / ช่างซ่อม' : '👤 ผู้ใช้งานทั่วไป'}
            </span>
          </div>
          <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 rounded-xl text-xs border border-rose-200 transition-all font-semibold">
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm mb-6 flex justify-between items-center">
          <div>
            <p className="text-xs font-extrabold uppercase text-blue-600 tracking-wider">
              สิทธิ์การใช้งาน: {currentUser.role === 'admin' ? 'Administrator & Technician Portal' : 'Standard User Portal'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.role === 'admin' 
                ? 'คุณมีสิทธิ์จัดการภาพรวมระบบ ตรวจสอบสถิติ จัดการผู้ใช้งาน และอัปเดตขั้นตอนการซ่อมทั้งหมด' 
                : 'คุณสามารถสร้างรายการแจ้งซ่อม และเปิดหน้าต่างดู Timeline ติดตามความคืบหน้าได้ทันที'}
            </p>
          </div>
          {currentUser.role === 'user' && (
            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
              + แจ้งซ่อมอุปกรณ์ใหม่
            </button>
          )}
        </div>

        {/* เมนูแท็บสลับสำหรับ Admin (จัดการงานซ่อม vs จัดการผู้ใช้งาน) */}
        {currentUser.role === 'admin' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div><p className="text-[11px] text-slate-400 font-bold uppercase">แจ้งซ่อมทั้งหมด</p><h3 className="text-3xl font-black text-slate-800 mt-1">{tickets.length}</h3></div>
                <div className="p-4 bg-slate-50 rounded-2xl text-xl border border-slate-100">💻</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div><p className="text-[11px] text-amber-600 font-bold uppercase">รอดำเนินการ</p><h3 className="text-3xl font-black text-amber-600 mt-1">{tickets.filter(t => t.status === 'Pending').length}</h3></div>
                <div className="p-4 bg-amber-50 rounded-2xl text-xl border border-amber-100">⏳</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div><p className="text-[11px] text-blue-600 font-bold uppercase">กำลังซ่อมแซม</p><h3 className="text-3xl font-black text-blue-600 mt-1">{tickets.filter(t => t.status === 'In Progress').length}</h3></div>
                <div className="p-4 bg-blue-50 rounded-2xl text-xl border border-blue-100">🔧</div>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div><p className="text-[11px] text-emerald-600 font-bold uppercase">ซ่อมเสร็จสิ้น</p><h3 className="text-3xl font-black text-emerald-600 mt-1">{tickets.filter(t => t.status === 'Completed').length}</h3></div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-xl border border-emerald-100">✅</div>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setActiveTab('tickets')}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${activeTab === 'tickets' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                🛠️ จัดการรายการแจ้งซ่อม ({tickets.length})
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shadow-sm ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                👥 จัดการรายชื่อผู้ใช้งานระบบ ({usersList.length})
              </button>
            </div>
          </>
        )}

        {/* แสดงส่วนจัดการรายการแจ้งซ่อม */}
        {activeTab === 'tickets' && (
          <>
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm mb-6 flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <input type="text" placeholder="🔍 ค้นหารหัส, ชื่ออุปกรณ์, ผู้แจ้ง..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 outline-none font-semibold">
                  <option value="All">สถานะทั้งหมด</option>
                  <option value="Pending">รอดำเนินการ</option>
                  <option value="In Progress">กำลังซ่อม</option>
                  <option value="Completed">เสร็จสิ้น</option>
                </select>
              </div>
              {currentUser.role === 'admin' && (
                <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md transition-all">
                  + แจ้งซ่อมอุปกรณ์ใหม่
                </button>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase font-extrabold text-slate-400">
                  <tr>
                    <th className="p-4">รหัสแจ้งซ่อม</th>
                    <th className="p-4">อุปกรณ์ & สถานที่</th>
                    <th className="p-4">อาการเสีย</th>
                    <th className="p-4">ผู้แจ้ง / วันที่</th>
                    <th className="p-4">สถานะ</th>
                    <th className="p-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">ไม่พบข้อมูลการแจ้งซ่อมในระบบ</td></tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-all">
                        <td className="p-4 font-mono font-bold text-slate-800">{t.ticketCode || t.id.slice(0, 8)}</td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{t.device}</div>
                          <div className="text-[11px] text-slate-400">{t.location}</div>
                        </td>
                        <td className="p-4 max-w-xs truncate text-slate-600">{t.symptom}</td>
                        <td className="p-4">
                          <div className="text-slate-700 font-medium">{t.reporter}</div>
                          <div className="text-[11px] text-slate-400">{t.date}</div>
                        </td>
                        <td className="p-4">
                          {t.status === 'Pending' && <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">รอดำเนินการ</span>}
                          {t.status === 'In Progress' && <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">กำลังซ่อม</span>}
                          {t.status === 'Completed' && <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">เสร็จสิ้น</span>}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => setSelectedTicket(t)} className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm">
                            👁️ ดูรายละเอียด
                          </button>
                          {currentUser.role === 'admin' && (
                            <>
                              <button onClick={() => { setAdminUpdateTicket(t); setUpdateStatusVal(t.status); setNewNote(t.note || ''); }} className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm">
                                ⚙️ อัปเดต
                              </button>
                              <button onClick={() => handleDeleteTicket(t.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm">
                                🗑️ ลบ
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* แสดงส่วนจัดการรายชื่อผู้ใช้งาน (เฉพาะ Admin) */}
        {activeTab === 'users' && currentUser.role === 'admin' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800">รายชื่อผู้ใช้งานทั้งหมดในระบบ</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">คุณสามารถตรวจสอบสิทธิ์และลบบัญชีผู้ใช้ที่ไม่ต้องการได้จากที่นี่</p>
              </div>
            </div>
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-extrabold text-slate-400">
                <tr>
                  <th className="p-4">ชื่อ-นามสกุล</th>
                  <th className="p-4">อีเมลบัญชี</th>
                  <th className="p-4">สิทธิ์การใช้งาน (Role)</th>
                  <th className="p-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.length === 0 ? (
                  <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">ยังไม่มีข้อมูลผู้ใช้งานในระบบ (ผู้ใช้จะถูกบันทึกอัตโนมัติเมื่อมีการสมัครสมาชิกใหม่)</td></tr>
                ) : (
                  usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="p-4 font-bold text-slate-800">{u.name}</td>
                      <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-4">
                        {u.role === 'admin' ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">🛡️ ผู้ดูแลระบบ / ช่าง</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">👤 ผู้ใช้งานทั่วไป</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteUser(u.id)} className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm">
                          🗑️ ลบบัญชีผู้ใช้
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal ดูรายละเอียด */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-slate-100">
            <button onClick={() => setSelectedTicket(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold text-base">✕</button>

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{selectedTicket.ticketCode || selectedTicket.id}</span>
                <h3 className="text-xl font-black text-slate-800 mt-2">{selectedTicket.device}</h3>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-5 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="text-slate-400 font-medium">สถานะปัจจุบัน:</span>
                <span className="font-bold text-blue-600">{selectedTicket.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">สถานที่ / ห้องปฏิบัติการ</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.location}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">ผู้แจ้งซ่อม</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.reporter}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold">อาการเสียที่ระบุ</p>
                <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.symptom}</p>
              </div>
            </div>

            {selectedTicket.note && (
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 text-xs">
                <p className="text-xs font-extrabold text-blue-800 mb-1">🛠️ หมายเหตุจากช่างซ่อม</p>
                <p className="text-blue-900 font-medium">{selectedTicket.note}</p>
              </div>
            )}

            <div className="mb-2">
              <h4 className="font-black text-slate-800 text-xs mb-4">🕒 ประวัติการติดตามสถานะ (Real-time Timeline)</h4>
              <div className="space-y-4 border-l-2 border-blue-500 ml-2 pl-4">
                {(selectedTicket.timeline || []).map((item, idx) => (
                  <div key={idx} className="relative">
                    <p className="text-[10px] text-slate-400 font-medium">{item.date}</p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{item.status}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal อัปเดตสถานะ (Admin) */}
      {adminUpdateTicket && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-slate-100">
            <button onClick={() => setAdminUpdateTicket(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold">✕</button>
            <div className="bg-amber-500 text-white p-5 rounded-2xl mb-6 shadow-md shadow-amber-500/20">
              <h3 className="font-black text-sm">⚙️ อัปเดตสถานะงานซ่อม (Admin Panel)</h3>
              <p className="text-[11px] text-amber-100 mt-1">อุปกรณ์: {adminUpdateTicket.device}</p>
            </div>
            <form onSubmit={handleSaveAdminUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">เปลี่ยนสถานะเป็น *</label>
                <select value={updateStatusVal} onChange={(e) => setUpdateStatusVal(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none">
                  <option value="Pending">รอดำเนินการ (Pending)</option>
                  <option value="In Progress">กำลังดำเนินการซ่อม (In Progress)</option>
                  <option value="Completed">ซ่อมเสร็จสิ้น (Completed)</option>
                  <option value="Cancelled">ยกเลิกรายการ (Cancelled)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุช่างซ่อม / บันทึกการปฏิบัติงาน</label>
                <textarea rows="3" placeholder="เช่น กำลังเปลี่ยน RAM ตัวใหม่ทดสอบ..." value={newNote} onChange={(e) => setNewNote(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none font-medium"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setAdminUpdateTicket(null)} className="px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
                <button type="submit" disabled={loading} className="px-6 py-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-2xl shadow-lg shadow-amber-600/20">
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการอัปเดต'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal เพิ่มแจ้งซ่อม */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative border border-slate-100">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 font-bold">✕</button>
            <h3 className="text-lg font-black text-slate-800 mb-5">+ ฟอร์มแจ้งซ่อมอุปกรณ์คอมพิวเตอร์</h3>
            <form onSubmit={handleAddTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / เลขครุภัณฑ์ *</label>
                <input type="text" required placeholder="เช่น PC ห้องคอม 502 - เครื่อง 12" value={newDevice} onChange={(e) => setNewDevice(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">หมวดหมู่อาการ</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none font-semibold">
                    <option value="Hardware">Hardware (อุปกรณ์ชำรุด)</option>
                    <option value="Software">Software (ซอฟต์แวร์)</option>
                    <option value="Network">Network (ระบบเน็ตเวิร์ก)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">สถานที่ / อาคาร *</label>
                  <input type="text" required placeholder="เช่น อาคารวิทยบริการ ชั้น 5" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none font-medium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รายละเอียดอาการเสีย *</label>
                <textarea required rows="3" placeholder="ระบุอาการเสียอย่างละเอียด..." value={newSymptom} onChange={(e) => setNewSymptom(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none font-medium"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
                <button type="submit" disabled={loading} className="px-6 py-3 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-600/20">
                  {loading ? 'กำลังส่งข้อมูล...' : 'บันทึกและส่งเรื่องแจ้งซ่อม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
