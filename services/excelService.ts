
declare const XLSX: any;

export const excelService = {
  downloadDailyReport: (data: any[], date: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Absentees");
    XLSX.writeFile(workbook, `${date}.xlsx`);
  },

  downloadStudentList: (data: any[]) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Master List");
    XLSX.writeFile(workbook, `Student_List_${new Date().toLocaleDateString()}.xlsx`);
  }
};
