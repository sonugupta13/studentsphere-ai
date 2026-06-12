import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// 1. Export Monthly Attendance Report to PDF
export const exportToPDF = (report) => {
  const doc = new jsPDF();

  // Header Style
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // indigo-600 color
  doc.text('StudentSphere AI', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`Attendance Report - ${report.month}`, 14, 28);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);

  // Divider Line
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(14, 38, 196, 38);

  // Overview Stats Block
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Monthly Overview Summary', 14, 46);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(`Overall Percentage: ${report.percentage}%`, 14, 52);
  doc.text(`Total Classes Conducted: ${report.totalClasses}`, 14, 58);
  doc.text(`Classes Attended: ${report.attended}`, 14, 64);
  doc.text(`Classes Missed: ${report.missed}`, 100, 58);
  doc.text(`Excused Leave Logs: ${report.leave}`, 100, 64);

  doc.line(14, 70, 196, 70);

  // Subject Breakdown Table
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Subject-wise Attendance Breakdown', 14, 78);

  const tableHeaders = [['Subject Name', 'Attended Classes', 'Conducted Classes', 'Attendance Rate']];
  const tableData = report.subjectsBreakdown.map((sub) => [
    sub.subjectName,
    sub.attended,
    sub.total,
    `${sub.percentage}%`,
  ]);

  autoTable(doc, {
    startY: 84,
    head: tableHeaders,
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
    styles: { fontSize: 9, font: 'Helvetica' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 40, halign: 'center' },
    },
  });

  // Save PDF
  doc.save(`Attendance_Report_${report.month.replace(' ', '_')}.pdf`);
};

// 2. Export Monthly Attendance Report to Excel
export const exportToExcel = (report) => {
  const wb = XLSX.utils.book_new();

  // Create general summary dataset sheet
  const summaryData = [
    { Label: 'Report Month', Value: report.month },
    { Label: 'Overall Attendance Percentage', Value: `${report.percentage}%` },
    { Label: 'Total Classes Conducted', Value: report.totalClasses },
    { Label: 'Classes Attended', Value: report.attended },
    { Label: 'Classes Missed', Value: report.missed },
    { Label: 'Excused Leave Logs', Value: report.leave },
    { Label: 'Generated On', Value: new Date().toLocaleDateString() },
  ];

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Overview');

  // Create subject breakdown sheet
  const subjectData = report.subjectsBreakdown.map((sub) => ({
    'Subject Name': sub.subjectName,
    'Classes Attended': sub.attended,
    'Classes Conducted': sub.total,
    'Attendance Percentage': `${sub.percentage}%`,
    'Minimum Target Required': '75%',
    'Status': sub.percentage >= 75 ? 'Excellent' : 'Needs Recovery',
  }));

  const wsSubjects = XLSX.utils.json_to_sheet(subjectData);
  XLSX.utils.book_append_sheet(wb, wsSubjects, 'Subject Breakdown');

  // Write Excel File
  XLSX.writeFile(wb, `Attendance_Report_${report.month.replace(' ', '_')}.xlsx`);
};
