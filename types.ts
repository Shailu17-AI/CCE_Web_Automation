
export interface Student {
  enrollNumber: string;
  registerNumber: string;
  name: string;
}

export interface AttendanceRecord {
  date: string;
  enrollNumber: string;
  registerNumber: string;
  studentName: string;
  reason: string;
}

export interface StudentStats extends Student {
  leaveOpted: number;
  totalWorkingDays: number;
}

export enum Page {
  AttendanceEntry = 'AttendanceEntry',
  StudentList = 'StudentList',
  About = 'About',
}