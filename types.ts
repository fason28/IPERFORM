
export interface User {
  username: string;
  password?: string; // Hashed password, not always present on client
  role: 'dos' | 'teacher' | 'student' | 'dod' | 'librarian' | 'bursar' | 'principal' | 'head_boy' | 'head_girl' | 'parent' | 'secretary' | 'stock_keeper';
  name: string;
  studentId?: string;
  class?: string;
  mustChangePassword?: boolean;
  parentId?: string;
}

export interface SchoolProfile {
    name: string;
    address: string;
    code: string;
    motto: string;
    logoUrl?: string; // Optional URL for later
}

export interface Class {
  id: number;
  name: string;
  status: 'Active' | 'Graduated';
  created_at: string;
}

export interface Teacher {
  id: number;
  username: string;
  name: string;
  phone: string;
  classes: string[];
  created_at: string;
}

export interface Student {
  id: number;
  username: string;
  name: string;
  studentId: string;
  class: string;
  gender: 'Male' | 'Female';
  parentId: string; // Corresponds to a parent user's username
  created_at: string;
}

export interface Mark {
  id: number;
  studentName: string;
  studentId: string;
  className: string;
  subject: string;
  mark: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ConductMark {
    id: number;
    studentId: string;
    studentName: string;
    className: string;
    score: number; // Positive adds, negative removes
    reason: string;
    recordedBy: string;
    recordedAt: string;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  className: string;
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Test {
  id: number;
  title: string;
  description: string;
  className: string;
  testType: 'Individual' | 'Group';
  filename: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Announcement {
  id: number;
  text: string;
  postedBy: string;
  postedAt: string;
  role: 'dos' | 'teacher' | 'dod' | 'librarian' | 'bursar' | 'principal' | 'secretary';
}

export interface ConductEvent {
    id: number;
    studentId: string;
    studentName: string;
    className: string;
    teacherName: string;
    reason: string;
    severity: 'minor' | 'major';
    status: 'sent_out' | 'returned';
    sentAt: string;
    returnedAt: string | null;
}

export interface Permission {
    id: number;
    studentId: string;
    studentName: string;
    type: 'Exit' | 'Temporary';
    destination: string;
    reason: string;
    grantedBy: string; // DoD username
    issuedAt: string;
    validUntil: string;
}

export interface Attendance {
    id: number;
    className: string;
    date: string;
    presentStudentIds: string[]; // List of student IDs present
    recordedBy: string; // Teacher name
}

// Library System Types
export interface Book {
  id: number;
  bookId: string; // e.g., 'MATH-001'
  title: string;
  author: string;
  isAvailable: boolean;
}

export interface BorrowedBook {
    id: number;
    bookId: string;
    bookTitle: string;
    borrowerType: 'Student' | 'Teacher' | 'Class'; // Updated to support multiple types
    borrowerName: string; // Replaces studentName for flexibility
    borrowerId: string; // Replaces studentId for flexibility
    borrowedAt: string;
    dueDate: string;
    returnedAt: string | null;
}

export interface Fine {
    id: number;
    borrowId: number;
    studentId: string;
    studentName: string;
    amount: number;
    reason: string;
    isPaid: boolean;
    issuedAt: string;
}

export interface LibrarianNote {
    id: number;
    content: string;
    createdAt: string;
}

// Bursar / Financial Types
export interface FeeAccount {
  id: number;
  studentId: string;
  studentName: string;
  className: string;
  term: string; // e.g., "Term 1 2024"
  totalFees: number;
  amountPaid: number;
  balance: number; // totalFees - amountPaid
  status: 'Paid' | 'Partial' | 'Unpaid';
}

export interface Payment {
  id: number;
  feeAccountId: number; // links to FeeAccount
  studentId: string;
  studentName: string;
  amount: number;
  method: 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Cheque';
  type: 'Tuition' | 'Boarding' | 'Exam' | 'Transport' | 'Other';
  reference: string | null;
  receiptNumber: string;
  paidAt: string; // ISO datetime string
  receivedBy: string; // Bursar's name
}

export interface Expense {
  id: number;
  category: 'Salaries' | 'Supplies' | 'Maintenance' | 'Utilities' | 'Events' | 'Tax' | 'Other';
  description: string;
  amount: number;
  date: string;
  recordedBy: string;
}

// Stock Keeper Types
export interface StockItem {
    id: number;
    itemName: string;
    category: string;
    quantity: number;
    unit: string; // e.g., 'pcs', 'boxes', 'kg'
    lastUpdated: string;
}

// DoD Facility Management Types
export interface DiningHallSeating {
  studentId: string;
  studentName: string;
  tableNumber: number;
}

export interface DormitoryAllocation {
  studentId: string;
  studentName: string;
  dormitory: string;
  chamber: number;
}

// Parent Communication
export interface Message {
    id: number;
    senderId: string; // Parent's username or Staff username
    senderName: string;
    recipientRole: 'principal' | 'dos' | 'dod' | 'teacher' | 'student' | 'parent';
    recipientId?: string; // Optional specific recipient
    content: string;
    sentAt: string;
    read: boolean;
}

export interface GroupMessage {
    id: number;
    className: string; // The class group this message belongs to
    senderName: string;
    senderId: string; // Parent username
    content: string;
    sentAt: string;
}

export interface SchoolData {
  schoolProfile: SchoolProfile; // Added school profile
  users: User[];
  classes: Class[];
  teachers: Teacher[];
  students: Student[];
  marks: Mark[];
  conductMarks: ConductMark[];
  notes: Note[];
  tests: Test[];
  announcements: Announcement[];
  conductEvents: ConductEvent[];
  permissions: Permission[];
  attendances: Attendance[];
  // Library Data
  books: Book[];
  borrowedBooks: BorrowedBook[];
  fines: Fine[];
  librarianNotes: LibrarianNote[];
  // Bursar Data
  feeAccounts: FeeAccount[];
  payments: Payment[];
  expenses: Expense[];
  // Stock Data
  stockItems: StockItem[];
  // DoD Data
  diningHallSeating: DiningHallSeating[];
  dormitoryAllocation: DormitoryAllocation[];
  // Parent Comms
  messages: Message[];
  groupMessages: GroupMessage[];
}
