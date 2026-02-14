import { supabase } from '../lib/supabase'
import { Employee, Attendance, LeaveRequest } from '../types/supabase'

export const supabaseService = {
  // Employees
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async addEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Attendance
  async getAttendance(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addAttendance(attendance: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .insert(attendance)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .update(attendance)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Leave Requests
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const { data, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async addLeaveRequest(leaveRequest: Omit<LeaveRequest, 'id' | 'created_at'>): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert(leaveRequest)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateLeaveRequest(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<LeaveRequest> {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}
