import React, { useState, useEffect, useMemo, useRef } from 'react';
import { COLLEGE_DETAILS } from './constants';
import { Page, AttendanceRecord, Student } from './types';
import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { excelService } from './services/excelService';

// --- Sub-components ---

const Header: React.FC = () => (
  <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-10 px-4 mb-8 transition-all shadow-sm">
    <div className="max-w-7xl mx-auto text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-primary-600 dark:text-primary-400">
        {COLLEGE_DETAILS.department}
      </h1>
    </div>
  </header>
);

const Navbar: React.FC<{ currentPage: Page; setPage: (p: Page) => void; isDark: boolean; toggleTheme: () => void }> = ({ currentPage, setPage, isDark, toggleTheme }) => (
  <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800 px-4 transition-all">
    <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
      <div className="flex items-center space-x-1">
        <button
          onClick={() => setPage(Page.AttendanceEntry)}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${currentPage === Page.AttendanceEntry
            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          Attendance Entry
        </button>
        <button
          onClick={() => setPage(Page.StudentList)}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${currentPage === Page.StudentList
            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          Student List
        </button>
        <button
          onClick={() => setPage(Page.About)}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${currentPage === Page.About
            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          About
        </button>
      </div>
      <button
        onClick={toggleTheme}
        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400"
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fillRule="evenodd" clipRule="evenodd"></path></svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
        )}
      </button>
    </div>
  </nav>
);

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'VERIFY_HOD' | 'VERIFY_ADVISOR' | 'SET_HOD' | 'SET_ADVISOR';
  advisorId?: string;
  title?: string;
  description?: string;
  onSuccess: (code?: string) => void;
}

const PasscodeModal: React.FC<PasscodeModalProps> = ({ isOpen, onClose, mode, advisorId, title, description, onSuccess }) => {
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPasscode(['', '', '', '']);
      setError('');
      setAttempts(0);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPasscode = [...passcode];
    newPasscode[index] = value.slice(-1);
    setPasscode(newPasscode);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmitRefined();
    }
  };

  const handleSubmitRefined = () => {
    const code = passcode.join('');
    if (code.length !== 4) { setError('Enter 4 digits'); return; }

    if (mode.startsWith('SET')) {
      onSuccess(code);
      return;
    }

    // Verification Logic
    let isValid = false;
    console.log('Validating Passcode:', { mode, code });

    if (mode === 'VERIFY_HOD') {
      isValid = authService.verifyHodPasscode(code);
      console.log('HOD Verification Result:', isValid);
    }
    if (mode === 'VERIFY_ADVISOR') {
      if (advisorId) {
        isValid = authService.verifyAdvisorPasscode(advisorId, code);
      } else {
        const advisorsList = storageService.getAdvisors();
        console.log('Advisors List:', advisorsList);
        const match = advisorsList.find(a => a.passcode === code);
        if (match) isValid = true;
        console.log('Advisor Verification Result:', isValid);
      }
    }

    if (isValid) {
      // SUCCESS: Authorized
      onSuccess();
      onClose();
    } else {
      // FAILURE: Incorrect Passcode
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('❌ Invalid Passcode - Please try again');
      setPasscode(['', '', '', '']);
      inputRefs.current[0]?.focus();

      if (newAttempts >= 3) {
        setError('Maximum attempts reached.');
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }
  };

  if (!isOpen) return null;

  const displayTitle = title || (mode.includes('HOD') ? 'HOD Authorization' : 'Advisor Authorization');
  const displayDesc = description || 'Enter 4-Digit Security Code';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full border border-slate-100 dark:border-slate-700 relative overflow-hidden">
        {/* Status Indicator Bar */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${error ? 'bg-red-500' : 'bg-primary-500'}`}></div>

        <div className="text-center space-y-3 mb-8">
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">{displayTitle}</h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-4 leading-relaxed">{displayDesc}</p>
        </div>

        <div className="flex justify-center space-x-3 mb-8">
          {passcode.map((digit, idx) => (
            <input
              key={idx}
              ref={el => inputRefs.current[idx] = el}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleInput(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              disabled={attempts >= 3}
              className={`w-12 h-14 text-center text-2xl font-black bg-slate-50 dark:bg-slate-900 border-2 rounded-xl focus:ring-4 outline-none transition-all text-slate-800 dark:text-slate-100 placeholder-slate-300
                ${error ? 'border-red-200 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-primary-500/20'}
              `}
            />
          ))}
        </div>

        {error && <p className="text-center text-red-500 text-sm font-bold mb-6 animate-pulse">{error}</p>}

        <div className="space-y-3">
          <button
            onClick={handleSubmitRefined}
            disabled={attempts >= 3}
            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
          >
            {mode.startsWith('SET') ? 'Set Passcode' : 'Submit'}
          </button>
          <button onClick={onClose} className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- AUTH TYPE ---
interface AuthFlowState {
  step: 'IDLE' | 'ADVISOR_AUTH' | 'REVIEW_LIST' | 'HOD_AUTH' | 'COMPLETED';
  advisorAuthorized: boolean;
  hodAuthorized: boolean;
  advisorTimestamp?: number;
  hodTimestamp?: number;
}

const App: React.FC = () => {
  const [currentPage, setPage] = useState<Page>(Page.AttendanceEntry);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [statsMap, setStatsMap] = useState<Record<string, { leaveOpted: number; totalWorkingDays: number }>>({});
  const [globalWorkingDays, setGlobalWorkingDays] = useState(100);

  // --- SEQUENTIAL AUTH STATE ---
  // STRICT REQUIREMENT: No auto-authorization on load. Always start fresh.
  const [flowState, setFlowState] = useState<AuthFlowState>({
    step: 'IDLE',
    advisorAuthorized: false,
    hodAuthorized: false
  });

  // Reset Flow
  const resetAuthFlow = () => {
    setFlowState({ step: 'IDLE', advisorAuthorized: false, hodAuthorized: false });
  };

  // Passcode & Modal State
  const [passcodeModal, setPasscodeModal] = useState<{
    isOpen: boolean;
    mode: 'VERIFY_HOD' | 'VERIFY_ADVISOR' | 'SET_HOD' | 'SET_ADVISOR';
    advisorId?: string;
    onSuccess: (code?: string) => void;
  }>({ isOpen: false, mode: 'VERIFY_HOD', onSuccess: () => { } });

  // About Page State
  const [hodPasscodeSet, setHodPasscodeSet] = useState<boolean>(() => !!storageService.getHodPasscode());
  const [advisors, setAdvisors] = useState<{ id: string; name: string; passcode: string }[]>(() => {
    return storageService.getAdvisors();
  });
  const [newAdvisorName, setNewAdvisorName] = useState('');
  // States for Student Search in Attendance Entry
  const [selectedStudentReg, setSelectedStudentReg] = useState('');
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStudent, setNewStudent] = useState({ enrollNumber: '', registerNumber: '', name: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Click outside listener for suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAll = () => {
    const loadedStudents = storageService.getStudents();
    setStudents(loadedStudents);
    setStatsMap(storageService.getStats(loadedStudents));
    setGlobalWorkingDays(storageService.getGlobalWorkingDays());
  };

  useEffect(() => {
    loadAll();
  }, []);

  const selectedStudent = useMemo(() =>
    students.find(s => s.registerNumber === selectedStudentReg),
    [selectedStudentReg, students]);

  // Suggestions for Attendance Entry search
  const studentSuggestions = useMemo(() => {
    if (!studentSearchInput.trim()) return [];
    return students.filter(s =>
      s.name.toLowerCase().includes(studentSearchInput.toLowerCase()) ||
      s.registerNumber.toLowerCase().includes(studentSearchInput.toLowerCase())
    ).slice(0, 5); // Limit to top 5 suggestions
  }, [studentSearchInput, students]);

  const addRecord = () => {
    if (!selectedStudent || !reason || !date) return;
    const newRecord: AttendanceRecord = {
      date,
      enrollNumber: selectedStudent.enrollNumber,
      registerNumber: selectedStudent.registerNumber,
      studentName: selectedStudent.name,
      reason
    };
    setRecords(prev => {
      const filtered = prev.filter(r => r.registerNumber !== selectedStudent.registerNumber);
      return [...filtered, newRecord];
    });
    setSelectedStudentReg('');
    setStudentSearchInput('');
    setReason('');
  };

  const deleteRecord = (reg: string) => {
    // Strict Sequential Flow: If Advisor authorized, prevent modification
    if (isConfirmed && flowState.advisorAuthorized) {
      alert("Cannot modify list after Authorization started. Please Cancel Verification to edit.");
      return;
    }
    setRecords(prev => prev.filter(r => r.registerNumber !== reg));
  };


  // --- SEQUENTIAL HANDLERS ---

  const startAdvisorAuth = () => {
    const advisorsList = storageService.getAdvisors();
    if (advisorsList.length === 0) {
      setPasscodeModal({
        isOpen: true,
        mode: 'SET_ADVISOR',
        onSuccess: (code) => {
          if (!code) return;
          const newAdvisor = { id: Date.now().toString(), name: "Mrs. M. Abirami", passcode: code };
          const updated = [newAdvisor];
          setAdvisors(updated);
          storageService.saveAdvisors(updated);
          setFlowState(prev => ({
            ...prev,
            advisorAuthorized: true,
            step: 'REVIEW_LIST',
            advisorTimestamp: Date.now()
          }));
          alert("✅ Class Advisor Passcode Created & Authorized!");
        }
      });
      return;
    }

    setPasscodeModal({
      isOpen: true,
      mode: 'VERIFY_ADVISOR',
      title: 'Class Advisor Authorization',
      description: 'Enter Passcode (Mrs. M. Abirami)',
      onSuccess: () => {
        setFlowState(prev => ({
          ...prev,
          advisorAuthorized: true,
          step: 'REVIEW_LIST',
          advisorTimestamp: Date.now()
        }));
      }
    });
  };

  const handleContinue = () => {
    if (!flowState.advisorAuthorized) return;

    const hasCode = storageService.getHodPasscode();
    if (!hasCode) {
      setPasscodeModal({
        isOpen: true,
        mode: 'SET_HOD',
        onSuccess: (code) => {
          if (!code) return;
          storageService.setHodPasscode(code);
          setHodPasscodeSet(true);
          setFlowState(prev => ({
            ...prev,
            hodAuthorized: true,
            step: 'COMPLETED',
            hodTimestamp: Date.now()
          }));
          alert("✅ HOD Passcode Created & Authorized!");
          setTimeout(() => downloadCurrentReport(), 500);
        }
      });
      return;
    }

    // Transition to HOD Step & Open Modal
    setFlowState(prev => ({ ...prev, step: 'HOD_AUTH' }));

    setTimeout(() => {
      setPasscodeModal({
        isOpen: true,
        mode: 'VERIFY_HOD',
        title: 'HOD Authorization',
        description: 'Enter HOD Passcode (Dr. R. Saravanan)',
        onSuccess: () => {
          setFlowState(prev => ({
            ...prev,
            hodAuthorized: true,
            step: 'COMPLETED',
            hodTimestamp: Date.now()
          }));
          // AUTO DOWNLOAD TRIGGER
          setTimeout(() => downloadCurrentReport(), 500);
        }
      });
    }, 100);
  };

  const downloadCurrentReport = () => {
    const updatedStats = storageService.getStats(students); // Use current stats
    const excelData = records.map(r => ({
      Date: r.date,
      "Enrollment Number": r.enrollNumber,
      "Register Number": r.registerNumber,
      "Student Name": r.studentName,
      Reason: r.reason,
      "Total Leave Count": updatedStats[r.registerNumber]?.leaveOpted || 0,
      "Total Working Days": updatedStats[r.registerNumber]?.totalWorkingDays || 0
    }));
    excelService.downloadDailyReport(excelData, date);
    alert("✅ HOD Authorization Successful.\nReport downloaded successfully.");
  };

  const handleFinalizeDay = () => {
    const regs = records.map(r => r.registerNumber);
    storageService.incrementLeaves(regs);
    const wasIncremented = storageService.incrementGlobalWorkingDays(date, students);
    loadAll();

    setRecords([]);
    setIsConfirmed(false);
    resetAuthFlow();
    alert(wasIncremented ? "Day Finalized. Data updated." : "Day Finalized. Leaves updated.");
  };

  const handleCancelFlow = () => {
    if (confirm("Are you sure you want to cancel verification?")) {
      setIsConfirmed(false);
      resetAuthFlow();
    }
  };

  const updateGlobalWorkingDaysManual = (val: string) => {
    const days = parseInt(val) || 0;
    storageService.updateGlobalWorkingDays(days, students);
    loadAll();
  };

  const updateStudentLeavesManual = (reg: string, val: string) => {
    const newVal = parseInt(val) || 0;
    const oldVal = statsMap[reg]?.leaveOpted || 0;
    storageService.updateStudentStats(reg, newVal - oldVal);
    loadAll();
  };

  const filteredStudents = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.registerNumber.toLowerCase().includes(term) ||
      s.enrollNumber.toLowerCase().includes(term)
    );
  }, [searchTerm, students]);

  const overallAttendancePct = useMemo(() => {
    let totalPct = 0;
    let count = 0;
    students.forEach(s => {
      const stats = statsMap[s.registerNumber];
      if (stats && stats.totalWorkingDays > 0) {
        const attended = stats.totalWorkingDays - stats.leaveOpted;
        totalPct += (attended / stats.totalWorkingDays) * 100;
        count++;
      }
    });
    return count > 0 ? (totalPct / count).toFixed(2) : '0.00';
  }, [statsMap, students]);

  const handleSaveStudent = () => {
    if (!newStudent.enrollNumber || !newStudent.registerNumber || !newStudent.name) {
      alert("Please fill all fields.");
      return;
    }
    const updatedStudents = [...students, newStudent];
    storageService.saveStudents(updatedStudents);
    setStudents(updatedStudents);
    setNewStudent({ enrollNumber: '', registerNumber: '', name: '' });
    setShowAddForm(false);
    loadAll();
  };

  const handleDeleteStudent = () => {
    if (filteredStudents.length !== 1 || !searchTerm) return;
    const studentToDelete = filteredStudents[0];
    const updatedStudents = students.filter(s => s.registerNumber !== studentToDelete.registerNumber);
    storageService.saveStudents(updatedStudents);
    storageService.deleteStudentData(studentToDelete.registerNumber);
    setStudents(updatedStudents);
    setSearchTerm('');
    loadAll();
  };

  const handleSelectSuggestion = (s: Student) => {
    setSelectedStudentReg(s.registerNumber);
    setStudentSearchInput(s.name);
    setShowSuggestions(false);
  };

  const handleSetHodPasscode = () => {
    // If HOD passcode exists, verify old first
    const hasCode = storageService.getHodPasscode();
    if (hasCode) {
      setPasscodeModal({
        isOpen: true,
        mode: 'VERIFY_HOD',
        onSuccess: () => {
          // Verify success -> Open Set Modal
          setTimeout(() => {
            setPasscodeModal({
              isOpen: true,
              mode: 'SET_HOD',
              onSuccess: (code) => { setHodPasscodeSet(true); if (code) storageService.setHodPasscode(code); }
            });
          }, 200);
        }
      });
    } else {
      setPasscodeModal({
        isOpen: true,
        mode: 'SET_HOD',
        onSuccess: (code) => { setHodPasscodeSet(true); if (code) storageService.setHodPasscode(code); }
      });
    }
  };

  const handleDeleteHodPasscode = () => {
    // Verify first
    setPasscodeModal({
      isOpen: true,
      mode: 'VERIFY_HOD',
      onSuccess: () => {
        // Delete
        localStorage.removeItem('cce_hod_passcode'); // Direct or via storageService (which we need to add 'delete' to, or just set null)
        // I'll assume setHodPasscode('') or similar clears it, or just direct remove for now.
        // storageService does not have deleteHodPasscode.
        // I'll just use localStorage here or add it.
        // Let's use setHodPasscode('') if that works?
        // storageService.setHodPasscode('');
        // setHodPasscodeSet(false);
        // Actually, verifyHodPasscode checks exact match. '' might match empty string.
        // I should probably add removeItem.
        localStorage.removeItem('cce_hod_passcode');
        setHodPasscodeSet(false);
      }
    });
  };

  const handleAddAdvisor = () => {
    if (newAdvisorName.trim() && advisors.length < 3) {
      // Verify HOD first
      setPasscodeModal({
        isOpen: true,
        mode: 'VERIFY_HOD',
        onSuccess: () => {
          // Now Open Set Passcode for NEW advisor
          setTimeout(() => {
            setPasscodeModal({
              isOpen: true,
              mode: 'SET_ADVISOR', // We treat this as generic set
              onSuccess: (code) => {
                if (!code) return;
                const newAdvisor = { id: Date.now().toString(), name: newAdvisorName, passcode: code };
                const updated = [...advisors, newAdvisor];
                setAdvisors(updated);
                storageService.saveAdvisors(updated);
                setNewAdvisorName('');
              }
            });
          }, 200);
        }
      });
    }
  };

  const handleRemoveAdvisor = (id: string) => {
    // Verify HOD first
    setPasscodeModal({
      isOpen: true,
      mode: 'VERIFY_HOD',
      onSuccess: () => {
        const updated = advisors.filter(a => a.id !== id);
        setAdvisors(updated);
        storageService.saveAdvisors(updated);
      }
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar currentPage={currentPage} setPage={setPage} isDark={isDarkMode} toggleTheme={() => setIsDarkMode(!isDarkMode)} />
      <Header />

      <main className="max-w-7xl mx-auto px-4 pb-24">
        {currentPage === Page.AttendanceEntry && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {!isConfirmed && (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100 flex items-center">
                  <span className="w-1.5 h-6 bg-primary-500 rounded-full mr-3"></span>
                  Record Absentee
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Student Selection with Manual Typing & Autocomplete */}
                  <div className="space-y-2 relative" ref={suggestionRef}>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Student Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentSearchInput}
                        onChange={(e) => {
                          setStudentSearchInput(e.target.value);
                          setShowSuggestions(true);
                          if (selectedStudentReg) setSelectedStudentReg('');
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Type student name..."
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      />
                      {showSuggestions && studentSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1">
                          {studentSuggestions.map(s => (
                            <div
                              key={s.registerNumber}
                              onClick={() => handleSelectSuggestion(s)}
                              className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer flex justify-between items-center group transition-colors"
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">{s.name}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{s.registerNumber}</span>
                              </div>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Enrolment Number</label>
                    <input type="text" readOnly value={selectedStudent?.enrollNumber || ''} placeholder="Auto-filled" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-500 dark:text-slate-400 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Register Number</label>
                    <input type="text" readOnly value={selectedStudent?.registerNumber || ''} placeholder="Auto-filled" className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-500 dark:text-slate-400 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason for Absence</label>
                    <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Medical, Personal, etc." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Date</label>
                    <input type="date" value={date} onChange={(e) => { setDate(e.target.value); resetAuthFlow(); }} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={addRecord} disabled={!selectedStudent || !reason} className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-primary-500/10 active:scale-95">Add Record</button>
                  </div>
                </div>
              </div>
            )}

            {!isConfirmed && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Daily Attendance Log</h2>
                  {records.length > 0 && !isConfirmed && (
                    <button onClick={() => setIsConfirmed(true)} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95">Complete Entry</button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Date</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Enrolment No.</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Reg No.</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Student Name</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Reason</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Leaves</th>
                        <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {records.length === 0 ? (
                        <tr><td colSpan={7} className="px-6 py-16 text-center text-slate-400 italic text-base">No absentees recorded yet for this session.</td></tr>
                      ) : (
                        records.map(record => (
                          <tr key={record.registerNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all">
                            <td className="px-6 py-5 font-medium">{record.date}</td>
                            <td className="px-6 py-5 font-mono text-slate-500 dark:text-slate-400">{record.enrollNumber}</td>
                            <td className="px-6 py-5 font-mono font-bold text-slate-900 dark:text-slate-200">{record.registerNumber}</td>
                            <td className="px-6 py-5 font-semibold">{record.studentName}</td>
                            <td className="px-6 py-5 text-slate-600 dark:text-slate-400 font-medium">{record.reason}</td>
                            <td className="px-6 py-5"><span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg font-bold">{statsMap[record.registerNumber]?.leaveOpted || 0}</span></td>
                            <td className="px-6 py-5 text-center">
                              <button disabled={isConfirmed} onClick={() => deleteRecord(record.registerNumber)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl disabled:opacity-20 transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isConfirmed && (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">

                {/* STEP 1: ADVISOR AUTH */}
                <div className={`p-8 rounded-3xl border transition-all ${flowState.advisorAuthorized
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}`}>

                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${flowState.advisorAuthorized ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>1</div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Class Advisor Verification</h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Mrs. M. Abirami</p>
                      </div>
                    </div>
                    {flowState.advisorAuthorized ? (
                      <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black uppercase tracking-widest rounded-xl">Authorized ✓</span>
                    ) : (
                      <button onClick={startAdvisorAuth} className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold flex items-center space-x-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                        <span>Authorize Now</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* STEP 2: REVIEW LIST (Only if Advisor Authorized) */}
                {flowState.advisorAuthorized && (
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${flowState.step === 'REVIEW_LIST' ? 'bg-primary-500 text-white' : 'bg-green-500 text-white'}`}>2</div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Review Absentees & Confirm</h3>
                    </div>

                    {/* Absentees Table */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden mb-6 border border-slate-100 dark:border-slate-700">
                      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Absentees Identified: {records.length}</span>
                      </div>
                      <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <tr>
                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Reg No.</th>
                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Name</th>
                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest">Reason</th>
                            <th className="px-6 py-3 font-bold uppercase text-[10px] tracking-widest text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                          {records.map(r => (
                            <tr key={r.registerNumber}>
                              <td className="px-6 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{r.registerNumber}</td>
                              <td className="px-6 py-3 font-semibold text-slate-900 dark:text-slate-100">{r.studentName}</td>
                              <td className="px-6 py-3 text-slate-600 dark:text-slate-400">{r.reason}</td>
                              <td className="px-6 py-3 text-center">
                                {!flowState.hodAuthorized && (
                                  <button onClick={() => deleteRecord(r.registerNumber)} className="text-red-500 hover:text-red-700 font-bold text-xs uppercase hover:underline">Remove</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {!flowState.hodAuthorized ? (
                      <button onClick={handleContinue} className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.01] active:scale-95">
                        Continue to HOD Verification →
                      </button>
                    ) : (
                      <div className="text-center py-4 text-green-600 dark:text-green-500 font-bold uppercase tracking-widest text-sm bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-900/30">
                        List Verified & Locked
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 3: HOD AUTH (Visible Only after Continue / when HOD Auth starts) */}
                {(flowState.step === 'HOD_AUTH' || flowState.step === 'COMPLETED' || flowState.hodAuthorized) && (
                  <div className={`p-8 rounded-3xl border transition-all ${flowState.hodAuthorized
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black ${flowState.hodAuthorized ? 'bg-green-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>3</div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">HOD Validation</h3>
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Dr. R. Saravanan</p>
                        </div>
                      </div>
                      {flowState.hodAuthorized && (
                        <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black uppercase tracking-widest rounded-xl">Authorized ✓</span>
                      )}
                    </div>
                  </div>
                )}

                {/* FINAL ACTIONS */}
                <div className="flex justify-center pt-4">
                  {flowState.hodAuthorized ? (
                    <button onClick={handleFinalizeDay} className="px-12 py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95">
                      Finalize & Close Day
                    </button>
                  ) : (
                    <button onClick={handleCancelFlow} className="px-8 py-3 text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">
                      Cancel Verification
                    </button>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

        {currentPage === Page.StudentList && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center py-4">
              <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">Class Statistics</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Academic Year 2025-29 • Overall Performance Monitoring</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
                {/* Search Bar */}
                <div className="xl:col-span-4 relative h-16 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search name, register or enrollment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full h-full pl-11 pr-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Total Strength */}
                <div className="xl:col-span-2 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">TOTAL STRENGHT</span>
                  <span className="text-xl font-black text-primary-600 dark:text-primary-400">{students.length}</span>
                </div>

                {/* Working Days */}
                <div className="xl:col-span-2 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WORKING DAYS</span>
                  <input
                    type="number"
                    value={globalWorkingDays}
                    onChange={(e) => updateGlobalWorkingDaysManual(e.target.value)}
                    className="w-16 bg-transparent text-right text-xl font-black text-slate-900 dark:text-slate-100 outline-none focus:ring-0"
                  />
                </div>

                {/* Add Student Button */}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={`xl:col-span-2 h-16 rounded-xl border flex items-center justify-center space-x-2 transition-all text-xs font-bold uppercase tracking-wider ${showAddForm ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-500 hover:text-primary-500'}`}
                >
                  <svg className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>Add Student</span>
                </button>

                {/* Download Report Button */}
                <button
                  onClick={() => {
                    const data = students.map(s => {
                      const stats = statsMap[s.registerNumber];
                      const attended = (stats?.totalWorkingDays || 0) - (stats?.leaveOpted || 0);
                      const pct = stats?.totalWorkingDays ? ((attended / stats.totalWorkingDays) * 100).toFixed(2) : '0.00';
                      return { "Enrollment Number": s.enrollNumber, "Register Number": s.registerNumber, "Student Name": s.name, "Total Working Days": stats?.totalWorkingDays || 0, "Total Days Attended": attended, "Leave Opted": stats?.leaveOpted || 0, "Attendance Percentage": `${pct}%` };
                    });
                    excelService.downloadStudentList(data);
                  }}
                  className="xl:col-span-2 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-xl flex items-center justify-center space-x-2 transition-all text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary-500/20 active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>Report</span>
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 transition-all animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[{ id: 'enroll', label: 'Enrolment No.', val: newStudent.enrollNumber, key: 'enrollNumber' }, { id: 'reg', label: 'Register No.', val: newStudent.registerNumber, key: 'registerNumber' }, { id: 'name', label: 'Student Name', val: newStudent.name, key: 'name' }].map(field => (
                    <div key={field.id} className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                      <input type="text" value={field.val} onChange={(e) => setNewStudent({ ...newStudent, [field.key]: e.target.value })} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder={`Enter ${field.label}`} />
                    </div>
                  ))}
                  <div className="flex items-end">
                    <button onClick={handleSaveStudent} className="w-full bg-primary-600 text-white px-6 py-3 rounded-xl text-sm font-black hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/10 active:scale-95">SAVE RECORD</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Enrolment No.</th>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Reg No.</th>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700">Student Name</th>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 text-center">Leave Opted</th>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 text-center">Attended</th>
                      <th className="px-6 py-5 font-black uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-700 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredStudents.length === 0 ? (
                      <tr><td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic text-base font-medium">No students match your current search criteria.</td></tr>
                    ) : (
                      filteredStudents.map(s => {
                        const stats = statsMap[s.registerNumber];
                        const working = stats?.totalWorkingDays || 0;
                        const leaves = stats?.leaveOpted || 0;
                        const attended = working - leaves;
                        const percentage = working > 0 ? ((attended / working) * 100).toFixed(1) : '0.0';
                        const isLowAttendance = working > 0 && parseFloat(percentage) < 75;

                        return (
                          <tr key={s.registerNumber} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-all group">
                            <td className="px-6 py-5 text-xs font-mono font-bold text-slate-400 dark:text-slate-500">{s.enrollNumber}</td>
                            <td className="px-6 py-5 font-mono font-black text-slate-900 dark:text-slate-200">{s.registerNumber}</td>
                            <td className="px-6 py-5 font-bold text-slate-800 dark:text-slate-100">{s.name}</td>
                            <td className="px-6 py-5 text-center">
                              <input type="number" value={leaves} onChange={(e) => updateStudentLeavesManual(s.registerNumber, e.target.value)} className="w-16 px-2 py-1.5 text-center bg-slate-200 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-xl font-black text-primary-700 dark:text-primary-400 transition-all outline-none" />
                            </td>
                            <td className="px-6 py-5 text-center font-black text-slate-700 dark:text-slate-300">{attended}</td>
                            <td className={`px-6 py-4 text-right font-black text-lg ${isLowAttendance ? 'text-red-600 dark:text-red-500' : 'text-green-600 dark:text-green-500'}`}>{percentage}%</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-10 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="flex flex-col space-y-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Global Overview</span>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">{globalWorkingDays}</span>
                      <span className="text-sm font-bold text-slate-400">Total Working Days Active</span>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 md:items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Class Efficiency Score</span>
                    <div className="flex items-baseline space-x-3">
                      <span className="text-4xl font-black text-green-600 dark:text-green-500 tracking-tighter">{overallAttendancePct}%</span>
                      <span className="text-sm font-bold text-slate-400">Aggregated Attendance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-10 pb-12">
              <button
                disabled={filteredStudents.length !== 1 || !searchTerm}
                onClick={handleDeleteStudent}
                className="flex items-center space-x-3 text-red-700/60 dark:text-red-400/50 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-10 disabled:grayscale transition-all text-[11px] font-black uppercase tracking-[0.2em] group border border-transparent hover:border-red-100 dark:hover:border-red-900/30 px-6 py-3 rounded-2xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span>Delete Student</span>
              </button>
            </div>
          </div>
        )}

        {currentPage === Page.About && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Info */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center md:text-left">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Head of Department</h3>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{COLLEGE_DETAILS.hod}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Class Advisor(s)</h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300 font-bold">{advisors.length}/3 Assigned</span>
                  </div>
                  <ul className="space-y-1">
                    {advisors.map(advisor => (
                      <li key={advisor.id} className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between group">
                        <span>{advisor.name}</span>
                        {advisors.length > 0 && (
                          <button onClick={() => handleRemoveAdvisor(advisor.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {advisors.length < 3 && (
                    <div className="flex gap-2 mt-4 pt-2">
                      <input
                        type="text"
                        value={newAdvisorName}
                        onChange={(e) => setNewAdvisorName(e.target.value)}
                        placeholder="New Advisor Name"
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={handleAddAdvisor}
                        disabled={!newAdvisorName.trim()}
                        className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-xs font-bold uppercase disabled:opacity-50 hover:bg-slate-800 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Passcode Modal */}
            <PasscodeModal
              isOpen={passcodeModal.isOpen}
              onClose={() => setPasscodeModal({ ...passcodeModal, isOpen: false })}
              mode={passcodeModal.mode}
              advisorId={passcodeModal.advisorId}
              onSuccess={passcodeModal.onSuccess}
            />

            {/* Passcode Management */}
            <div className="text-center pb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authority Passcode Management</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* HOD Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">HOD Authority</h3>
                  <div className={`w-3 h-3 rounded-full ${hodPasscodeSet ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-4">
                  <div className={`p-4 rounded-full ${hodPasscodeSet ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
                    {hodPasscodeSet ? 'Passcode Secured' : 'No Passcode Set'}
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {!hodPasscodeSet ? (
                    <button
                      onClick={handleSetHodPasscode}
                      className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      <span>Set HOD Passcode</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleSetHodPasscode}
                        className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                        <span>Change Passcode</span>
                      </button>
                      <button
                        onClick={handleDeleteHodPasscode}
                        className="w-full py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                      >
                        <span>Remove Passcode</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Class Advisor Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Class Advisor Authority</h3>
                  <div className="flex -space-x-1">
                    {advisors.map(adv => (
                      <div key={adv.id} className="w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-green-500"></div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-3">
                  {advisors.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">No advisors registered</div>
                  ) : (
                    advisors.map(adv => (
                      <div key={adv.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <span className="font-bold text-slate-700 dark:text-slate-300">{adv.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">ACTIVE</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 py-3 text-center text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] z-40">
        CCE Attendance & Leave Management System • {new Date().getFullYear()}
      </footer>

      <PasscodeModal
        isOpen={passcodeModal.isOpen}
        onClose={() => setPasscodeModal(prev => ({ ...prev, isOpen: false }))}
        mode={passcodeModal.mode}
        advisorId={passcodeModal.advisorId}
        title={passcodeModal.title}
        description={passcodeModal.description}
        onSuccess={passcodeModal.onSuccess}
      />
    </div>
  );
};

export default App;