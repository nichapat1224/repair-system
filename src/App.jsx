import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Monitor, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Search, 
  Filter, 
  Plus, 
  User, 
  ShieldCheck, 
  MapPin, 
  Phone,
  RefreshCw,
  LogOut,
  Lock,
  Mail
} from 'lucide-react';

const INITIAL_TICKETS = [
  {
    id: 'REP-2026-001',
    deviceType: 'Computer Set',
    deviceName: 'PC ห้องคอม 502 - เครื่อง 12',
    serialNo: 'CS-502-12',
    location: 'อาคารวิทยบริการ ชั้น 5 (ห้อง Lab 502)',
    reporterName: 'นักศึกษา สมหญิง (User)',
    reporterRole: 'นักศึกษา',
    contactTel: '081-234-5678',
    issueCategory: 'Hardware',
    description: 'เครื่องเปิดไม่ติด มีเสียงติ๊ดดังยาว 3 ครั้ง ไฟ power ติดแต่หน้าจอมืด',
    urgency: 'high',
    status: 'in_progress',
    createdAt: '2026-10-24 09:30',
    technicianNote: 'กำลังเปลี่ยน RAM ตัวใหม่ทดสอบ และทำความสะอาด Slot',
    timeline: [
      { status: 'pending', time: '2026-10-24 09:30', note: 'ส่งคำขอแจ้งซ่อมเข้าสู่ระบบเรียบร้อย' },
      { status: 'in_progress', time: '2026-10-24 13:15', note: 'ช่างสมศักดิ์ รับเรื่องและกำลังเข้าตรวจเช็คอุปกรณ์' }
    ]
  },
  {
    id: 'REP-2026-002',
    deviceType: 'Printer',
    deviceName: 'Printer HP LaserJet Pro (ห้องทะเบียน)',
    serialNo: 'PR-REG-01',
    location: 'อาคารอำนวยการ ชั้น 1 (ห้องงานทะเบียน)',
    reporterName: 'นางสาววิภาดา รักษ์ดี',
    reporterRole: 'เจ้าหน้าที่',
    contactTel: '089-999-8888',
    issueCategory: 'Hardware',
    description: 'กระดาษติดบ่อย และมีคราบหมึกดำเป็นเส้นตรงกลางแผ่น',
    urgency: 'medium',
    status: 'pending',
    createdAt: '2026-10-25 11:00',
    technicianNote: '',
    timeline: [
      { status: 'pending', time: '2026-10-25 11:00', note: 'ส่งคำขอแจ้งซ่อมเข้าสู่ระบบเรียบร้อย' }
    ]
  }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginRole, setLoginRole] = useState('user');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginName, setLoginName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState('');

  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);

  const [formData, setFormData] = useState({
    deviceType: 'Computer Set',
    deviceName: '',
    serialNo: '',
    location: '',
    reporterName: '',
    reporterRole: 'นักศึกษา',
    contactTel: '',
    issueCategory: 'Hardware',
    urgency: 'medium',
    description: ''
  });

  const [updateData, setUpdateData] = useState({
    status: 'in_progress',
    note: ''
  });

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError('');

    if (!loginEmail || !loginPassword) {
      setAuthError('กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน');
      return;
    }

    if (isRegister && !loginName) {
      setAuthError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    const nameVal = isRegister ? loginName : (loginRole === 'admin' ? 'นายช่าง สมชาย (Admin)' : 'นักศึกษา สมหญิง (User)');
    
    setCurrentUser({
      name: nameVal,
      email: loginEmail,
      role: loginRole
    });

    // กำหนดชื่อผู้แจ้งในฟอร์มให้อัตโนมัติเวลา User กดแจ้งซ่อม
    setFormData(prev => ({ ...prev, reporterName: nameVal }));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginName('');
    setAuthError('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'รอดำเนินการ' };
      case 'in_progress':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Wrench, label: 'กำลังดำเนินการซ่อม' };
      case 'completed':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'ซ่อมเสร็จสิ้น' };
      case 'cancelled':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, label: 'ยกเลิกรายการ' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', icon: AlertCircle, label: 'ไม่ทราบสถานะ' };
    }
  };

  // กรองข้อมูลตามสิทธิ์ (User จะเห็นเฉพาะของตัวเอง, Admin เห็นทั้งหมด)
  const accessibleTickets = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'admin') {
      return tickets;
    } else {
      // User เห็นเฉพาะรายการที่ตนเองเป็นผู้แจ้ง
      return tickets.filter(t => t.reporterName === currentUser.name);
    }
  }, [tickets, currentUser]);

  const stats = useMemo(() => {
    const total = accessibleTickets.length;
    const pending = accessibleTickets.filter(t => t.status === 'pending').length;
    const inProgress = accessibleTickets.filter(t => t.status === 'in_progress').length;
    const completed = accessibleTickets.filter(t => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [accessibleTickets]);

  const filteredTickets = useMemo(() => {
    return accessibleTickets.filter(ticket => {
      const matchesSearch = 
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || ticket.issueCategory === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [accessibleTickets, searchTerm, statusFilter, categoryFilter]);

  const handleCreateTicket = (e) => {
    e.preventDefault();
    const newId = `REP-2026-${String(tickets.length + 1).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    const newTicket = {
      ...formData,
      id: newId,
      reporterName: currentUser.name, // ใช้ชื่อผู้ใช้ปัจจุบัน
      status: 'pending',
      createdAt: now,
      technicianNote: '',
      timeline: [
        { status: 'pending', time: now, note: 'ส่งคำขอแจ้งซ่อมเข้าสู่ระบบเรียบร้อย' }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setIsNewTicketOpen(false);
    setFormData({
      deviceType: 'Computer Set',
      deviceName: '',
      serialNo: '',
      location: '',
      reporterName: currentUser.name,
      reporterRole: 'นักศึกษา',
      contactTel: '',
      issueCategory: 'Hardware',
      urgency: 'medium',
      description: ''
    });
  };

  const handleUpdateStatus = (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const statusText = getStatusBadge(updateData.status).label;
        const noteEntry = updateData.note 
          ? `อัปเดตเป็น [${statusText}]: ${updateData.note}`
          : `อัปเดตสถานะเป็น ${statusText}`;
        
        return {
          ...t,
          status: updateData.status,
          technicianNote: updateData.note || t.technicianNote,
          timeline: [
            ...t.timeline,
            { status: updateData.status, time: now, note: noteEntry }
          ]
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    setSelectedTicket(updatedTickets.find(t => t.id === selectedTicket.id));
    setIsUpdateStatusOpen(false);
  };

  // หน้า Login ดีไซน์พรีเมียม
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center relative">
            <div className="inline-flex p-3.5 bg-white/10 backdrop-blur-md rounded-2xl mb-3 shadow-inner border border-white/20">
              <Monitor className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black tracking-tight">Computer Repair System</h2>
            <p className="text-blue-100 text-xs mt-1">ระบบแจ้งซ่อมและติดตามสถานะครุภัณฑ์ออนไลน์</p>
          </div>

          <div className="p-8">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200/60">
              <button
                type="button"
                onClick={() => setLoginRole('user')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginRole === 'user' ? 'bg-white text-blue-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className="w-4 h-4" /> ผู้ใช้งานทั่วไป
              </button>
              <button
                type="button"
                onClick={() => setLoginRole('admin')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  loginRole === 'admin' ? 'bg-white text-indigo-600 shadow-md shadow-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4" /> ช่างซ่อม / แอดมิน
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-1">
              {isRegister ? 'สมัครสมาชิกใหม่' : 'เข้าสู่ระบบ'}
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              {isRegister ? 'กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้' : `สิทธิ์การเข้าใช้งาน: ${loginRole === 'admin' ? 'ผู้ดูแลระบบและช่างซ่อม' : 'ผู้ใช้งานทั่วไป'}`}
            </p>

            {authError && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อ-นามสกุล</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={loginName}
                      onChange={(e) => setLoginName(e.target.value)}
                      placeholder="นายสมชาย ใจดี"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">อีเมล (Email)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="user@college.ac.th"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รหัสผ่าน (Password)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 text-xs transition-all mt-2 cursor-pointer"
              >
                {isRegister ? 'ยืนยันลงทะเบียน' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีใช่หรือไม่?'}{' '}
              <button
                type="button"
                onClick={() => { setIsRegister(!isRegister); setAuthError(''); }}
                className="text-blue-600 font-bold hover:underline ml-1 cursor-pointer"
              >
                {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // หน้า Dashboard หลัก (ดีไซน์พรีเมียม สบายตา แยกสิทธิ์ชัดเจน)
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                Computer Repair Tracking System
              </h1>
              <p className="text-[11px] text-slate-400">ระบบสารสนเทศติดตามสถานะงานซ่อมครุภัณฑ์คอมพิวเตอร์ออนไลน์</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
              <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {currentUser.role === 'admin' ? '🛡️ ผู้ดูแลระบบ / ช่างซ่อม' : '👤 ผู้ใช้งานทั่วไป'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Banner แสดงสิทธิ์ */}
        <div className={`p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          currentUser.role === 'admin' ? 'bg-amber-50/80 border-amber-200/80 text-amber-900' : 'bg-blue-50/80 border-blue-200/80 text-blue-900'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl ${currentUser.role === 'admin' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-blue-600 text-white shadow-md shadow-blue-600/20'}`}>
              {currentUser.role === 'admin' ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div>
              <p className="font-extrabold text-sm">
                สิทธิ์การใช้งาน: {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ / ช่างซ่อม (Admin & Technician Portal)' : 'ผู้ใช้งานทั่วไป (Standard User Portal)'}
              </p>
              <p className="text-xs opacity-75 mt-0.5 font-medium">
                {currentUser.role === 'admin' 
                  ? 'คุณสามารถตรวจสอบสถิติภาพรวมทั้งหมด และอัปเดตสถานะขั้นตอนการซ่อมได้' 
                  : 'คุณสามารถสร้างรายการแจ้งซ่อม และติดตาม Timeline ตรวจสอบสถานะงานซ่อมเฉพาะของคุณได้'}
              </p>
            </div>
          </div>

          {currentUser.role === 'user' && (
            <button
              onClick={() => {
                setFormData(prev => ({ ...prev, reporterName: currentUser.name }));
                setIsNewTicketOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ แจ้งซ่อมอุปกรณ์ใหม่</span>
            </button>
          )}
        </div>

        {/* STATS CARDS (แสดงเฉพาะ Admin เท่านั้น เพื่อไม่ให้ User เห็นภาพรวมทั้งหมดของคนอื่น) */}
        {currentUser.role === 'admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-400">แจ้งซ่อมทั้งหมด</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{stats.total}</h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl text-slate-600 border border-slate-100 text-xl">💻</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-amber-600">รอดำเนินการ</p>
                <h3 className="text-3xl font-black text-amber-600 mt-1">{stats.pending}</h3>
              </div>
              <div className="p-4 bg-amber-50 rounded-2xl text-amber-600 border border-amber-100 text-xl">⏳</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-indigo-600">กำลังซ่อมแซม</p>
                <h3 className="text-3xl font-black text-indigo-600 mt-1">{stats.inProgress}</h3>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 text-xl">🔧</div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-emerald-600">ซ่อมเสร็จสิ้น</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-1">{stats.completed}</h3>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 text-xl">✅</div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTER */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 ค้นหารหัส, ชื่ออุปกรณ์, สถานที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-slate-50 p-1.5 border border-slate-200 rounded-2xl w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 ml-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-bold px-2 py-1.5 focus:outline-none cursor-pointer"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="in_progress">กำลังซ่อม</option>
                <option value="completed">ซ่อมเสร็จสิ้น</option>
                <option value="cancelled">ยกเลิกรายการ</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-bold px-2 py-1.5 focus:outline-none cursor-pointer border-l border-slate-200"
              >
                <option value="all">หมวดหมู่ทั้งหมด</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
              </select>
            </div>

            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCategoryFilter('all'); }}
              className="p-3 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer"
              title="ล้างตัวกรอง"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABLE LIST */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-extrabold text-slate-800 text-sm">
              {currentUser.role === 'admin' ? `รายการแจ้งซ่อมทั้งหมดในระบบ (${filteredTickets.length})` : `ประวัติการแจ้งซ่อมของคุณ (${filteredTickets.length})`}
            </h2>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">ไม่พบรายการแจ้งซ่อม</p>
              <p className="text-xs text-slate-400 mt-1">
                {currentUser.role === 'user' ? 'คุณยังไม่มีประวัติการแจ้งซ่อม ลองกดปุ่ม "แจ้งซ่อมอุปกรณ์ใหม่" ด้านบนได้เลยครับ' : 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-4 px-6">รหัสแจ้งซ่อม</th>
                    <th className="py-4 px-6">อุปกรณ์ & สถานที่</th>
                    <th className="py-4 px-6">ผู้แจ้งซ่อม</th>
                    <th className="py-4 px-6">หมวดหมู่</th>
                    <th className="py-4 px-6">สถานะ</th>
                    <th className="py-4 px-6 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => {
                    const badge = getStatusBadge(ticket.status);
                    const BadgeIcon = badge.icon;
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-blue-600">{ticket.id}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">{ticket.deviceName}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" /> {ticket.location}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-700">{ticket.reporterName}</p>
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold mt-0.5">
                            {ticket.reporterRole}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-xl font-medium">{ticket.issueCategory}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${badge.bg}`}>
                            <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                          >
                            👁️ ดู Timeline
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => { setSelectedTicket(ticket); setUpdateData({ status: ticket.status, note: '' }); setIsUpdateStatusOpen(true); }}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm cursor-pointer"
                            >
                              ⚙️ อัปเดตสถานะ
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: VIEW DETAILS & TIMELINE */}
      {selectedTicket && !isUpdateStatusOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg">{selectedTicket.id}</span>
                <h3 className="font-black text-lg text-white mt-1.5">{selectedTicket.deviceName}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer">✕</button>
            </div>
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                  <span className="text-slate-400 font-medium">สถานะปัจจุบัน:</span>
                  <span className="font-bold text-blue-600">{getStatusBadge(selectedTicket.status).label}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">สถานที่ / ห้อง</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">ผู้แจ้งซ่อม</p>
                    <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.reporterName} ({selectedTicket.reporterRole})</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">เบอร์โทรศัพท์ติดต่อ</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.contactTel || '-'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">อาการเสียที่ระบุ</p>
                  <p className="font-bold text-slate-700 mt-0.5">{selectedTicket.description}</p>
                </div>
              </div>

              {selectedTicket.technicianNote && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                  <p className="text-xs font-extrabold text-blue-800 mb-1">🛠️ หมายเหตุจากช่างซ่อม</p>
                  <p className="text-blue-900 font-medium">{selectedTicket.technicianNote}</p>
                </div>
              )}

              <div>
                <h4 className="font-black text-slate-800 text-xs mb-3">🕒 ประวัติการติดตามสถานะ (Real-time Timeline)</h4>
                <div className="space-y-4 border-l-2 border-blue-500 pl-4 ml-2">
                  {(selectedTicket.timeline || []).map((t, index) => (
                    <div key={index} className="relative">
                      <p className="text-[10px] text-slate-400 font-medium">{t.time}</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{t.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW TICKET */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
            <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
              <h3 className="font-black text-base">+ ฟอร์มแจ้งซ่อมอุปกรณ์คอมพิวเตอร์</h3>
              <button onClick={() => setIsNewTicketOpen(false)} className="text-slate-400 hover:text-white font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">ประเภทอุปกรณ์ *</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold outline-none"
                  >
                    <option value="Computer Set">Computer Set</option>
                    <option value="Notebook">Notebook</option>
                    <option value="Printer">Printer</option>
                    <option value="Network Equipment">Network</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">หมวดหมู่อาการ *</label>
                  <select
                    value={formData.issueCategory}
                    onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold outline-none"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network">Network</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">ชื่ออุปกรณ์ / เลขครุภัณฑ์ *</label>
                <input
                  type="text"
                  placeholder="เช่น PC ห้อง 502 (CS-502-01)"
                  value={formData.deviceName}
                  onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">สถานที่ตั้ง / อาคาร *</label>
                <input
                  type="text"
                  placeholder="เช่น อาคารวิทยบริการ ชั้น 5"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">ชื่อผู้แจ้งซ่อม *</label>
                  <input
                    type="text"
                    value={formData.reporterName}
                    onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none bg-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์ติดต่อ *</label>
                  <input
                    type="text"
                    placeholder="081-234-5678"
                    value={formData.contactTel}
                    onChange={(e) => setFormData({ ...formData, contactTel: e.target.value })}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">รายละเอียดอาการเสีย *</label>
                <textarea
                  rows={3}
                  placeholder="อธิบายอาการเสียเบื้องต้นอย่างละเอียด..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  บันทึกและส่งเรื่องแจ้งซ่อม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN UPDATE STATUS */}
      {isUpdateStatusOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-amber-600 text-white p-6 flex justify-between items-center shadow-md">
              <h3 className="font-black text-sm">⚙️ อัปเดตสถานะงานซ่อม: {selectedTicket.id}</h3>
              <button onClick={() => setIsUpdateStatusOpen(false)} className="text-white font-bold cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUpdateStatus} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">เปลี่ยนสถานะใหม่ *</label>
                <select
                  value={updateData.status}
                  onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none"
                >
                  <option value="pending">รอดำเนินการ (Pending)</option>
                  <option value="in_progress">กำลังดำเนินการซ่อม (In Progress)</option>
                  <option value="completed">ซ่อมเสร็จสิ้น (Completed)</option>
                  <option value="cancelled">ยกเลิกรายการ (Cancelled)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">หมายเหตุช่างซ่อม / ผลการปฏิบัติงาน</label>
                <textarea
                  rows={3}
                  placeholder="เช่น เปลี่ยน RAM ตัวใหม่ทดสอบเรียบร้อย..."
                  value={updateData.note}
                  onChange={(e) => setUpdateData({ ...updateData, note: e.target.value })}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-medium outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUpdateStatusOpen(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl font-bold shadow-lg shadow-amber-600/20 cursor-pointer"
                >
                  บันทึกการอัปเดต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
