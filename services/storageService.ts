
import { Student } from '../types';
import { MASTER_STUDENT_LIST } from '../constants';

const LEAVE_COUNTS_KEY = 'cce_leave_counts';
const WORKING_DAYS_KEY = 'cce_working_days';
const GLOBAL_WORKING_DAYS_KEY = 'cce_global_working_days';
const LAST_INCREMENT_DATE_KEY = 'cce_last_increment_date';
const STUDENTS_KEY = 'cce_dynamic_students';
const HOD_PASSCODE_KEY = 'cce_hod_passcode';
const ADVISORS_DATA_KEY = 'cce_advisors_data_v2';

export const storageService = {
  getStudents: (): Student[] => {
    const stored = localStorage.getItem(STUDENTS_KEY);
    if (stored) return JSON.parse(stored);
    // Initialize with master list if nothing is stored
    return MASTER_STUDENT_LIST;
  },

  saveStudents: (students: Student[]) => {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  },

  getGlobalWorkingDays: (): number => {
    return parseInt(localStorage.getItem(GLOBAL_WORKING_DAYS_KEY) || '100');
  },

  getStats: (currentStudents: Student[]): Record<string, { leaveOpted: number; totalWorkingDays: number }> => {
    const counts = JSON.parse(localStorage.getItem(LEAVE_COUNTS_KEY) || '{}');
    const workingDaysMap = JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) || '{}');
    const globalDays = storageService.getGlobalWorkingDays();

    const stats: Record<string, { leaveOpted: number; totalWorkingDays: number }> = {};
    currentStudents.forEach(s => {
      stats[s.registerNumber] = {
        leaveOpted: counts[s.registerNumber] || 0,
        totalWorkingDays: workingDaysMap[s.registerNumber] !== undefined ? workingDaysMap[s.registerNumber] : globalDays
      };
    });
    return stats;
  },

  updateStudentStats: (registerNumber: string, leaveDelta: number, workingDays?: number) => {
    const counts = JSON.parse(localStorage.getItem(LEAVE_COUNTS_KEY) || '{}');
    const daysMap = JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) || '{}');

    if (leaveDelta !== 0) {
      counts[registerNumber] = (counts[registerNumber] || 0) + leaveDelta;
      localStorage.setItem(LEAVE_COUNTS_KEY, JSON.stringify(counts));
    }

    if (workingDays !== undefined) {
      daysMap[registerNumber] = workingDays;
      localStorage.setItem(WORKING_DAYS_KEY, JSON.stringify(daysMap));
    }
  },

  updateGlobalWorkingDays: (newVal: number, currentStudents: Student[]) => {
    localStorage.setItem(GLOBAL_WORKING_DAYS_KEY, newVal.toString());
    const daysMap = JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) || '{}');
    currentStudents.forEach(s => {
      daysMap[s.registerNumber] = newVal;
    });
    localStorage.setItem(WORKING_DAYS_KEY, JSON.stringify(daysMap));
  },

  incrementLeaves: (registerNumbers: string[]) => {
    const counts = JSON.parse(localStorage.getItem(LEAVE_COUNTS_KEY) || '{}');
    registerNumbers.forEach(reg => {
      counts[reg] = (counts[reg] || 0) + 1;
    });
    localStorage.setItem(LEAVE_COUNTS_KEY, JSON.stringify(counts));
  },

  incrementGlobalWorkingDays: (date: string, currentStudents: Student[]): boolean => {
    const lastDate = localStorage.getItem(LAST_INCREMENT_DATE_KEY);
    if (lastDate === date) {
      return false;
    }

    const currentGlobal = storageService.getGlobalWorkingDays();
    const newGlobal = currentGlobal + 1;
    localStorage.setItem(GLOBAL_WORKING_DAYS_KEY, newGlobal.toString());
    localStorage.setItem(LAST_INCREMENT_DATE_KEY, date);

    const daysMap = JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) || '{}');
    currentStudents.forEach(s => {
      const current = daysMap[s.registerNumber] !== undefined ? daysMap[s.registerNumber] : currentGlobal;
      daysMap[s.registerNumber] = current + 1;
    });
    localStorage.setItem(WORKING_DAYS_KEY, JSON.stringify(daysMap));

    return true;
  },

  deleteStudentData: (registerNumber: string) => {
    const counts = JSON.parse(localStorage.getItem(LEAVE_COUNTS_KEY) || '{}');
    const daysMap = JSON.parse(localStorage.getItem(WORKING_DAYS_KEY) || '{}');
    delete counts[registerNumber];
    delete daysMap[registerNumber];
    localStorage.setItem(LEAVE_COUNTS_KEY, JSON.stringify(counts));
    localStorage.setItem(WORKING_DAYS_KEY, JSON.stringify(daysMap));
  },

  // --- Role-Based Passcode Persistence ---
  // Stores numeric passcodes for HOD and Class Advisors.
  // NOTE: This is a frontend-only implementation using localStorage.

  getHodPasscode: (): string | null => {
    return localStorage.getItem(HOD_PASSCODE_KEY);
  },

  setHodPasscode: (passcode: string) => {
    localStorage.setItem(HOD_PASSCODE_KEY, passcode);
  },

  // Returns list of advisors with their passcodes
  getAdvisors: (): { id: string; name: string; passcode: string }[] => {
    const stored = localStorage.getItem(ADVISORS_DATA_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return []; }
    }
    return [];
  },

  saveAdvisors: (advisors: { id: string; name: string; passcode: string }[]) => {
    localStorage.setItem(ADVISORS_DATA_KEY, JSON.stringify(advisors));
  }
};
