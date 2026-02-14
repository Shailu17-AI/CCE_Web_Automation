export interface Employee {
  id: string
  name: string
  email: string
  department: string
  position: string
  employee_id: string
  created_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  check_in: string | null
  check_out: string | null
  status: 'present' | 'absent' | 'late' | 'half_day'
  created_at: string
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity'
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
