export type UserRole = 'admin' | 'staff';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface Student {
  id: string;
  maHV: string;
  hoTen: string;
  ngaySinh: string;
  sdt: string;
  diaChi: string;
  khoaHocId: string;
  trangThai: 'đang học' | 'nghỉ';
}

export interface Course {
  id: string;
  maKH: string;
  tenKH: string;
  hocPhi: number;
  thoiGian: string;
}

export interface Class {
  id: string;
  maLop: string;
  tenLop: string;
  maKH: string;
  giaoVien: string;
}

export interface Tuition {
  id: string;
  maPhieu: string;
  maHV: string;
  soTien: number;
  ngayThu: any; // Firestore Timestamp
}
