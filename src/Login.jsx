import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Mail, Wrench, ArrowRight } from 'lucide-react';
// import { auth } from './firebase'; // ปลดคอมเมนต์เมื่อเชื่อม Firebase จริง
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState('user'); // 'user' หรือ 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    // จำลองการเข้าสู่ระบบ (สำหรับทดสอบในเครื่อง)
    // ในงานจริงจะใช้: signInWithEmailAndPassword(auth, email, password)
    const userData = {
      email: email,
      name: isRegister ? name : (role === 'admin' ? 'นายช่าง สมชาย (Admin)' : 'นักศึกษา สมหญิง (User)'),
      role: role // 'user' หรือ 'admin'
    };

    onLoginSuccess(userData);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header ส่วนหัว */}
        <div className="bg-slate-900 p-8 text-white text-center relative">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl mb-3 shadow-lg shadow-blue-500/30">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Repair Tracking System</h2>
          <p className="text-slate-400 text-sm mt-1">ระบบรับแจ้งซ่อมและติดตามสถานะครุภัณฑ์ออนไลน์</p>
        </div>

        {/* ฟอร์ม Login / Register */}
        <div className="p-8">
          {/* ปุ่มสลับ Role (ผู้ใช้ / แอดมิน) */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('user')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'user' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <User className="w-4 h-4" /> ผู้ใช้งานทั่วไป
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                role === 'admin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> ช่างซ่อม / แอดมิน
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-1">
            {isRegister ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {isRegister ? 'กรอกข้อมูลด้านล่างเพื่อลงทะเบียน' : `เข้าใช้งานในสิทธิ์: ${role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้ทั่วไป'}`}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <div className="relative">
                  <User className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="นายสมชาย ใจดี"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล (Email)</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.ac.th"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {isRegister ? 'ลงทะเบียน' : 'เข้าสู่ระบบ'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* สลับหน้าสมัครสมาชิก / เข้าสู่ระบบ */}
          <div className="mt-6 text-center text-sm text-slate-500">
            {isRegister ? 'มีบัญชีอยู่แล้ว?' : 'ยังไม่มีบัญชีใช่หรือไม่?'}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              {isRegister ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}