export interface Student {
  id?: string; // Firestore document ID
  studentId: string; // Unique alphanumeric code
  name: string;
  password: string;
  gradeLevel: string;
  gender: 'Male' | 'Female' | 'Other';
  createdAt: any; // Timestamp
}

export interface CourseGrade {
  subject: string;
  score: number; // 0 - 100
  grade: 'A' | 'B' | 'C' | 'F'; // A (90-100), B (80-89), C (74-79), F (<74 fail)
  gradePoint: number; // A=4, B=3, C=2, F=0
  comments: string;
}

export interface AcademicReport {
  id?: string;
  studentId: string;
  studentName: string;
  gradeLevel: string;
  term: string; // "1st Period", "Mid-term", "Final Semester" etc.
  academicYear: string; // "2025-2026"
  grades: CourseGrade[];
  average: number;
  gpa: number;
  status: 'Pass' | 'Fail'; // Fail if average < 74 (or if grading fails)
  updatedAt: any; // Timestamp
}

export interface Bulletin {
  id?: string;
  title: string;
  content: string;
  category: 'Announcement' | 'Event' | 'Academics' | 'Notice' | 'Newsletter';
  author: string;
  imageUrl?: string;
  createdAt: any; // Timestamp
}
