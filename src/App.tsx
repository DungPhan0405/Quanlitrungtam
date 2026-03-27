import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  School, 
  CreditCard, 
  LogOut, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import Swal from 'sweetalert2';
import { auth, db } from './firebase';
import { cn, formatCurrency, formatDate } from './lib/utils';
import { User, Student, Course, Class, Tuition, UserRole } from './types';

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, onLogout }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  user: User | null,
  onLogout: () => void
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Học viên', icon: Users },
    { id: 'courses', label: 'Khóa học', icon: BookOpen },
    { id: 'classes', label: 'Lớp học', icon: School },
    { id: 'tuition', label: 'Thu học phí', icon: CreditCard },
  ];

  return (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col w-64">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
            <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Nam Phương</h1>
            <p className="text-xs text-slate-500 font-medium">Education System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-blue-50 text-blue-600 font-semibold" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon size={20} className={cn(
              "transition-transform duration-200 group-hover:scale-110",
              activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span>{item.label}</span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeTab"
                className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white">
              {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'Staff'}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-red-600 bg-white border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ students, courses, tuition }: { 
  students: Student[], 
  courses: Course[], 
  tuition: Tuition[] 
}) => {
  const totalRevenue = tuition.reduce((sum, t) => sum + t.soTien, 0);
  const activeStudents = students.filter(s => s.trangThai === 'đang học').length;
  
  // Chart data: Revenue by month
  const monthlyRevenue = tuition.reduce((acc: any, t) => {
    const date = t.ngayThu.toDate();
    const month = `${date.getMonth() + 1}/${date.getFullYear()}`;
    acc[month] = (acc[month] || 0) + t.soTien;
    return acc;
  }, {});

  const chartData = Object.keys(monthlyRevenue).map(month => ({
    name: month,
    revenue: monthlyRevenue[month]
  })).sort((a, b) => {
    const [ma, ya] = a.name.split('/').map(Number);
    const [mb, yb] = b.name.split('/').map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  const stats = [
    { label: 'Tổng học viên', value: students.length, icon: Users, color: 'blue' },
    { label: 'Đang theo học', value: activeStudents, icon: UserCheck, color: 'emerald' },
    { label: 'Khóa học', value: courses.length, icon: BookOpen, color: 'amber' },
    { label: 'Tổng doanh thu', value: formatCurrency(totalRevenue), icon: TrendingUp, color: 'indigo' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
              stat.color === 'blue' && "bg-blue-50 text-blue-600",
              stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
              stat.color === 'amber' && "bg-amber-50 text-amber-600",
              stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
            )}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Doanh thu theo tháng</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000000}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Trạng thái học viên</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Đang học', value: activeStudents },
                    { name: 'Nghỉ học', value: students.length - activeStudents }
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#2563eb" />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-slate-600">Đang học</span>
              </div>
              <span className="font-bold text-slate-800">{activeStudents}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-slate-600">Nghỉ học</span>
              </div>
              <span className="font-bold text-slate-800">{students.length - activeStudents}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [tuition, setTuition] = useState<Tuition[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as User);
        } else {
          // Create new user if not exists
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: firebaseUser.email === 'hungdung5a4@gmail.com' ? 'admin' : 'staff',
            displayName: firebaseUser.displayName || ''
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });
    const unsubCourses = onSnapshot(collection(db, 'courses'), (snap) => {
      setCourses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    });
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snap) => {
      setClasses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class)));
    });
    const unsubTuition = onSnapshot(query(collection(db, 'tuition'), orderBy('ngayThu', 'desc')), (snap) => {
      setTuition(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tuition)));
    });

    return () => {
      unsubStudents();
      unsubCourses();
      unsubClasses();
      unsubTuition();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      Swal.fire({
        icon: 'success',
        title: 'Đăng nhập thành công',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Lỗi', 'Không thể đăng nhập', 'error');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      maHV: formData.get('maHV') as string,
      hoTen: formData.get('hoTen') as string,
      ngaySinh: formData.get('ngaySinh') as string,
      sdt: formData.get('sdt') as string,
      diaChi: formData.get('diaChi') as string,
      khoaHocId: formData.get('khoaHocId') as string,
      trangThai: formData.get('trangThai') as 'đang học' | 'nghỉ'
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'students', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'students'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      Swal.fire('Thành công', 'Đã lưu thông tin học viên', 'success');
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu dữ liệu', 'error');
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Hành động này không thể hoàn tác!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Xóa ngay',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, coll, id));
        Swal.fire('Đã xóa', '', 'success');
      } catch (error) {
        Swal.fire('Lỗi', 'Không có quyền thực hiện', 'error');
      }
    }
  };

  const handleAddCourse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      maKH: formData.get('maKH') as string,
      tenKH: formData.get('tenKH') as string,
      hocPhi: Number(formData.get('hocPhi')),
      thoiGian: formData.get('thoiGian') as string
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'courses', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'courses'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      Swal.fire('Thành công', 'Đã lưu thông tin khóa học', 'success');
    } catch (error) {
      Swal.fire('Lỗi', 'Không có quyền thực hiện', 'error');
    }
  };

  const handleAddClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      maLop: formData.get('maLop') as string,
      tenLop: formData.get('tenLop') as string,
      maKH: formData.get('maKH') as string,
      giaoVien: formData.get('giaoVien') as string
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'classes', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'classes'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      Swal.fire('Thành công', 'Đã lưu thông tin lớp học', 'success');
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu dữ liệu', 'error');
    }
  };

  const handleAddTuition = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      maPhieu: formData.get('maPhieu') as string,
      maHV: formData.get('maHV') as string,
      soTien: Number(formData.get('soTien')),
      ngayThu: Timestamp.fromDate(new Date(formData.get('ngayThu') as string))
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, 'tuition', editingItem.id), data);
      } else {
        await addDoc(collection(db, 'tuition'), data);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      Swal.fire('Thành công', 'Đã ghi nhận học phí', 'success');
    } catch (error) {
      Swal.fire('Lỗi', 'Không thể lưu dữ liệu', 'error');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-blue-100 border border-slate-100 text-center"
        >
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-blue-200">
            <GraduationCap size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Nam Phương Education</h1>
          <p className="text-slate-500 mb-10 font-medium">Hệ thống quản lý trung tâm đào tạo chuyên nghiệp</p>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-6 h-6 bg-white rounded-full p-1" alt="Google" />
            Đăng nhập với Google
          </button>
          
          <p className="mt-8 text-xs text-slate-400 font-medium uppercase tracking-widest">
            Secure Management System
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredStudents = students.filter(s => 
    s.hoTen.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.sdt.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          <header className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-800 capitalize">
                {activeTab === 'dashboard' ? 'Tổng quan hệ thống' : 
                 activeTab === 'students' ? 'Quản lý học viên' :
                 activeTab === 'courses' ? 'Danh mục khóa học' :
                 activeTab === 'classes' ? 'Quản lý lớp học' : 'Thu học phí'}
              </h2>
              <p className="text-slate-500 font-medium mt-1">
                Chào mừng trở lại, <span className="text-blue-600 font-bold">{user.displayName}</span>
              </p>
            </div>

            {activeTab !== 'dashboard' && (
              <button 
                onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 active:scale-95"
              >
                <Plus size={20} />
                Thêm mới
              </button>
            )}
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard students={students} courses={courses} tuition={tuition} />}

              {activeTab === 'students' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm học viên theo tên hoặc SĐT..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-8 py-4">Mã HV</th>
                          <th className="px-8 py-4">Họ tên</th>
                          <th className="px-8 py-4">SĐT</th>
                          <th className="px-8 py-4">Khóa học</th>
                          <th className="px-8 py-4">Trạng thái</th>
                          <th className="px-8 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 font-mono text-xs text-slate-500">{s.maHV}</td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-800">{s.hoTen}</p>
                              <p className="text-xs text-slate-500">{s.diaChi}</p>
                            </td>
                            <td className="px-8 py-5 text-sm font-medium text-slate-600">{s.sdt}</td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">
                                {courses.find(c => c.id === s.khoaHocId)?.tenKH || 'N/A'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold",
                                s.trangThai === 'đang học' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                              )}>
                                {s.trangThai}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => { setEditingItem(s); setIsModalOpen(true); }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDelete('students', s.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((c) => (
                    <motion.div 
                      layout
                      key={c.id} 
                      className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                          <BookOpen size={24} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingItem(c); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete('courses', c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-2">{c.tenKH}</h4>
                      <p className="text-slate-500 text-sm mb-6 font-medium">Mã: {c.maKH} • {c.thoiGian}</p>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Học phí</span>
                        <span className="text-xl font-black text-blue-600">{formatCurrency(c.hocPhi)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {activeTab === 'classes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((cl) => (
                    <div key={cl.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <School size={24} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditingItem(cl); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete('classes', cl.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold text-slate-800 mb-1">{cl.tenLop}</h4>
                      <p className="text-blue-600 text-sm font-bold mb-4">{courses.find(c => c.id === cl.maKH)?.tenKH}</p>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                          <Users size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Giáo viên</p>
                          <p className="text-sm font-bold text-slate-700">{cl.giaoVien}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'tuition' && (
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-8 py-4">Mã phiếu</th>
                          <th className="px-8 py-4">Học viên</th>
                          <th className="px-8 py-4">Số tiền</th>
                          <th className="px-8 py-4">Ngày thu</th>
                          <th className="px-8 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tuition.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 font-mono text-xs text-slate-500">{t.maPhieu}</td>
                            <td className="px-8 py-5">
                              <p className="font-bold text-slate-800">
                                {students.find(s => s.id === t.maHV)?.hoTen || 'N/A'}
                              </p>
                            </td>
                            <td className="px-8 py-5 font-black text-blue-600">{formatCurrency(t.soTien)}</td>
                            <td className="px-8 py-5 text-sm text-slate-500">{formatDate(t.ngayThu.toDate())}</td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingItem(t); setIsModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete('tuition', t.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- Modals --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-800">
                  {editingItem ? 'Cập nhật thông tin' : 'Thêm mới dữ liệu'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={
                  activeTab === 'students' ? handleAddStudent :
                  activeTab === 'courses' ? handleAddCourse :
                  activeTab === 'classes' ? handleAddClass : handleAddTuition
                }
                className="p-8 space-y-6"
              >
                {activeTab === 'students' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã học viên</label>
                      <input name="maHV" defaultValue={editingItem?.maHV} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</label>
                      <input name="hoTen" defaultValue={editingItem?.hoTen} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">SĐT</label>
                      <input name="sdt" defaultValue={editingItem?.sdt} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày sinh</label>
                      <input type="date" name="ngaySinh" defaultValue={editingItem?.ngaySinh} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khóa học</label>
                      <select name="khoaHocId" defaultValue={editingItem?.khoaHocId} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.tenKH}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</label>
                      <select name="trangThai" defaultValue={editingItem?.trangThai} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="đang học">Đang học</option>
                        <option value="nghỉ">Nghỉ</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ</label>
                      <input name="diaChi" defaultValue={editingItem?.diaChi} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                )}

                {activeTab === 'courses' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã khóa học</label>
                        <input name="maKH" defaultValue={editingItem?.maKH} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên khóa học</label>
                        <input name="tenKH" defaultValue={editingItem?.tenKH} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học phí (VND)</label>
                      <input type="number" name="hocPhi" defaultValue={editingItem?.hocPhi} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian học</label>
                      <input name="thoiGian" defaultValue={editingItem?.thoiGian} placeholder="VD: 3 tháng" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                )}

                {activeTab === 'classes' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã lớp</label>
                        <input name="maLop" defaultValue={editingItem?.maLop} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tên lớp</label>
                        <input name="tenLop" defaultValue={editingItem?.tenLop} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Khóa học</label>
                      <select name="maKH" defaultValue={editingItem?.maKH} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        {courses.map(c => <option key={c.id} value={c.id}>{c.tenKH}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Giáo viên</label>
                      <input name="giaoVien" defaultValue={editingItem?.giaoVien} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                )}

                {activeTab === 'tuition' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã phiếu</label>
                        <input name="maPhieu" defaultValue={editingItem?.maPhieu} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Học viên</label>
                        <select name="maHV" defaultValue={editingItem?.maHV} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                          {students.map(s => <option key={s.id} value={s.id}>{s.hoTen}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số tiền (VND)</label>
                      <input type="number" name="soTien" defaultValue={editingItem?.soTien} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày thu</label>
                      <input type="date" name="ngayThu" defaultValue={editingItem?.ngayThu ? new Date(editingItem.ngayThu.toDate()).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} required className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
