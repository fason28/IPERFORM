
import { GoogleGenAI } from "@google/genai";
import type { SchoolData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const model = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `You are an intelligent, multi-faceted college management assistant for the "I Perform" school management system. Your role is to support various users including Principals, Directors of Studies (DOS), Directors of Discipline (DOD), Bursars, Teachers, Librarians, Secretaries, Stock Keepers, and Parents. You must process data update requests and return the complete, updated database state as a single, valid JSON object.

--- Your Core Responsibilities ---

**1. Principal Support**
*   **Global Oversight**: Provide access to summarized academic, financial, and disciplinary data.
*   **Role Assignment**: Handle requests to assign student leadership roles.
*   **Communication**: Handle bulk messaging requests.

**2. Director of Studies (DOS) Support**
*   **Academic Management**: Manage classes, teachers, students, and academic records.
*   **Staff Management**: Create accounts for Librarians, Secretaries, and Stock Keepers.
*   **Timetabling**: You may be asked to generate a text-based timetable.
*   **Communication**: Send academic updates to parents.

**3. Director of Discipline (DOD) Support**
*   **Permissions**: Grant 'Exit' or 'Temporary' permissions to students.
*   **Reporting**: Send conduct reports to parents via messages.
*   **Communication**: Send disciplinary notices to parents.

**4. Bursar Support**
*   **Fee Management**: Manage student fee accounts and payments.
*   **Tax Management**: Calculate and record taxes.
*   **Communication**: Send fee reminders to parents.

**5. Teachers**
*   **Attendance Management**: Record daily attendance for classes. Create new 'Attendance' objects with unique IDs, date, class name, and list of present student IDs.
*   **Grading & Discipline**: Manage marks and conduct events.
*   **Resources**: Upload class notes and resources.

**6. Other Staff (Librarian, etc.)**
*   Standard duties as defined previously.

--- Messaging Logic Rules (CRITICAL) ---
*   **"Send message to ALL parents"**: Iterate through ALL students. For each student, find their \`parentId\`. Create a new message object for that \`parentId\`.
*   **"Send message to parents of Class [X]"**: Iterate through students where \`class\` equals [X]. For each, find their \`parentId\` and create a message.
*   **"Send message to parent of [Student Name]"**: Find the student, get \`parentId\`, create one message.
*   **Message Object Format**: { "id": number (unique), "senderId": string, "senderName": string, "recipientRole": "parent", "recipientId": string (the parentId), "content": string, "sentAt": ISOString, "read": false }.
*   **Group Messages**: If request is for a "Class Group", add to \`groupMessages\` array.

--- General Data Processing Rules ---
1.  **Return Full State**: You MUST return the entire database object, not just the modified part.
2.  **Format**: Return ONLY valid, raw JSON. Do NOT wrap it in markdown code blocks (like \`\`\`json). Do NOT add any preamble or postscript text.
3.  **Unique IDs**: When adding new items, generate a new unique ID.
4.  **Timestamps**: Always include a realistic, current ISO 8601 timestamp.
`;

const LAB_SYSTEM_INSTRUCTION = `You are an advanced virtual science laboratory assistant with expertise in Chemistry, Biology, Physics, and interdisciplinary research. You provide realistic lab simulations, safety guidance, and educational support for students conducting experiments.

Core Capabilities:
1. Analyze chemical, biological, and physical interactions between items.
2. Calculate realistic measurements (pH, Temp, Voltage).
3. Detect safety hazards (Explosions, toxicity, short circuits).
4. Provide educational theory.

Output Format:
Return a JSON object with the following structure:
{
  "status": "SAFE" | "CAUTION" | "DANGER" | "CRITICAL",
  "observation": "Detailed description of what is happening visually and physically.",
  "measurements": {
    "temperature": "e.g. 25°C",
    "ph": "e.g. 7.0",
    "voltage": "e.g. 0V",
    "time": "e.g. 2 mins",
    "other": "Any other relevant metric"
  },
  "safetyAssessment": "Assessment of current danger level and required precautions.",
  "nextSteps": ["Suggestion 1", "Suggestion 2"],
  "theory": "Brief explanation of the scientific principles at work."
}
`;

const TIMETABLE_SYSTEM_INSTRUCTION = `You are an expert school timetable scheduler.
Your task is to generate a comprehensive weekly timetable based on the provided constraints (classes, subjects, teachers, specific requests).

Output Format:
Return a well-structured MARKDOWN table or list.
Do NOT return JSON. Return readable text/markdown.
Include columns for Time, Monday, Tuesday, Wednesday, Thursday, Friday.
Ensure the schedule is balanced and logical.
`;

const DATA_STRUCTURE_TEMPLATE = `
The output MUST be a valid JSON object matching this structure:
{
  "schoolProfile": { "name": "...", "address": "...", "code": "...", "motto": "..." },
  "users": [{ "username": "...", "password": "...", "role": "...", "name": "...", "studentId": "...", "class": "...", "mustChangePassword": true/false }],
  "classes": [{ "id": 1, "name": "...", "status": "Active/Graduated", "created_at": "..." }],
  "teachers": [{ "id": 1, "username": "...", "name": "...", "phone": "...", "classes": ["..."], "created_at": "..." }],
  "students": [{ "id": 1, "username": "...", "name": "...", "studentId": "...", "class": "...", "gender": "Male/Female", "parentId": "...", "created_at": "..." }],
  "marks": [],
  "conductMarks": [],
  "notes": [],
  "tests": [],
  "announcements": [],
  "conductEvents": [],
  "permissions": [],
  "attendances": [],
  "books": [{ "id": 1, "bookId": "...", "title": "...", "author": "...", "isAvailable": true }],
  "borrowedBooks": [],
  "fines": [],
  "librarianNotes": [],
  "feeAccounts": [{ "id": 1, "studentId": "...", "studentName": "...", "className": "...", "term": "...", "totalFees": 0, "amountPaid": 0, "balance": 0, "status": "Paid/Partial/Unpaid" }],
  "payments": [],
  "expenses": [],
  "stockItems": [{ "id": 1, "itemName": "...", "category": "...", "quantity": 0, "unit": "...", "lastUpdated": "..." }],
  "diningHallSeating": [],
  "dormitoryAllocation": [],
  "messages": [],
  "groupMessages": []
}
`;

// Helper function to clean markdown code blocks from response
const cleanJSON = (text: string): string => {
  let cleaned = text.trim();
  // Find first { and last } to extract pure JSON
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  // Fallback cleanup
  return cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
};

// Fallback data to prevent application crash
const FALLBACK_DATA: SchoolData = {
    schoolProfile: {
        name: "I Perform Demo School",
        address: "123 Education Lane",
        code: "IPERF",
        motto: "Excellence in Everything"
    },
    users: [
        { username: 'principal', password: 'prin123', role: 'principal', name: 'Dr. Principal', mustChangePassword: false },
        { username: 'dos', password: 'dos123', role: 'dos', name: 'Mr. Academic', mustChangePassword: false },
        { username: 'dod', password: 'dod123', role: 'dod', name: 'Mrs. Discipline', mustChangePassword: false },
        { username: 'bursar', password: 'bur123', role: 'bursar', name: 'Mr. Finance', mustChangePassword: false },
        { username: 'librarian', password: 'lib123', role: 'librarian', name: 'Ms. Reader', mustChangePassword: false },
        { username: 'teacher1', password: '012', role: 'teacher', name: 'Mr. Smith', studentId: '', class: '', mustChangePassword: false },
        { username: 'student1', password: '123', role: 'student', name: 'John Student', studentId: 'S001', class: 'S4', parentId: 'parent1', mustChangePassword: false },
        { username: 'head_boy', password: 'hb123', role: 'head_boy', name: 'James Prefect', studentId: 'S002', class: 'S6', parentId: 'parent2', mustChangePassword: false },
        { username: 'head_girl', password: 'hg123', role: 'head_girl', name: 'Jane Prefect', studentId: 'S003', class: 'S6', parentId: 'parent3', mustChangePassword: false },
        { username: 'parent1', password: 'parent123', role: 'parent', name: 'Mr. StudentParent', mustChangePassword: false },
    ],
    classes: [
        { id: 1, name: "S1", status: "Active", created_at: new Date().toISOString() },
        { id: 2, name: "S4", status: "Active", created_at: new Date().toISOString() },
        { id: 3, name: "S6", status: "Active", created_at: new Date().toISOString() }
    ],
    teachers: [
        { id: 1, username: 'teacher1', name: 'Mr. Smith', phone: '0700000000', classes: ['S1', 'S4'], created_at: new Date().toISOString() }
    ],
    students: [
        { id: 1, username: 'student1', name: 'John Student', studentId: 'S001', class: 'S4', gender: 'Male', parentId: 'parent1', created_at: new Date().toISOString() },
        { id: 2, username: 'head_boy', name: 'James Prefect', studentId: 'S002', class: 'S6', gender: 'Male', parentId: 'parent2', created_at: new Date().toISOString() },
        { id: 3, username: 'head_girl', name: 'Jane Prefect', studentId: 'S003', class: 'S6', gender: 'Female', parentId: 'parent3', created_at: new Date().toISOString() }
    ],
    marks: [
        { id: 1, studentName: 'John Student', studentId: 'S001', className: 'S4', subject: 'Math', mark: 85, uploadedBy: 'Mr. Smith', uploadedAt: new Date().toISOString() }
    ],
    conductMarks: [],
    notes: [],
    tests: [],
    announcements: [
        { id: 1, text: "Welcome to the system. This is fallback data because the AI server was unreachable.", postedBy: "System", postedAt: new Date().toISOString(), role: "principal" }
    ],
    conductEvents: [],
    permissions: [],
    attendances: [],
    books: [
        { id: 1, bookId: 'B001', title: 'Calculus I', author: 'Newton', isAvailable: true },
        { id: 2, bookId: 'B002', title: 'Biology Basics', author: 'Darwin', isAvailable: true }
    ],
    borrowedBooks: [],
    fines: [],
    librarianNotes: [],
    feeAccounts: [
        { id: 1, studentId: 'S001', studentName: 'John Student', className: 'S4', term: 'Term 1', totalFees: 50000, amountPaid: 30000, balance: 20000, status: 'Partial' }
    ],
    payments: [],
    expenses: [],
    stockItems: [],
    diningHallSeating: [],
    dormitoryAllocation: [],
    messages: [],
    groupMessages: []
};

export const generateInitialData = async (schoolName?: string, adminDetails?: {name: string, password: string, email: string}): Promise<SchoolData> => {
    let specificRequirements = "";
    
    if (schoolName && adminDetails) {
        specificRequirements = `
        **CUSTOM REGISTRATION REQUEST**:
        Generate data for a NEW school named "${schoolName}".
        The Principal user MUST be: Name: '${adminDetails.name}', Username: 'principal', Password: '${adminDetails.password}'.
        Create a unique 'code' for this school in 'schoolProfile'.
        Ensure all generated data (students, classes, expenses) looks realistic for "${schoolName}".
        `;
    } else {
        specificRequirements = `
        **DEFAULT DEMO DATA**:
        Generate data for "I Perform Demo School".
        1.  **Users**: Create specific users with these EXACT usernames to ensure login works:
            - Principal: username 'principal', password 'prin123'
            - DOS: username 'dos', password 'dos123'
            - DoD: username 'dod', password 'dod123'
            - Librarian: username 'librarian', password 'lib123'
            - Bursar: username 'bursar', password 'bur123'
            - Secretary: username 'secretary', password 'sec123'
            - Stock Keeper: username 'stock_keeper', password 'stock123'
            - Head Boy: username 'head_boy', password 'hb123'
            - Head Girl: username 'head_girl', password 'hg123'
        2.  **Teachers**: Create 1 teacher (username 'teacher1', password '012').
        3.  **Students & Parents**: 
            *   Create 5-8 students. 
            *   For EACH student, assign a 'gender' ('Male' or 'Female') and a unique 'parentId'.
            *   Create corresponding 'parent' users for a few students. Parent password 'parent123'.
        `;
    }

    const prompt = `
    Generate a realistic and consistent initial dataset for a school management system named "I Perform".
    
    ${DATA_STRUCTURE_TEMPLATE}
    
    ${specificRequirements}
    
    4.  **Academic**: 2-3 classes. Some marks.
    5.  **Financial**: Fee accounts for students.
    6.  **Consistency**: Ensure all IDs are unique.
    
    Return ONLY valid JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            },
        });
        const jsonString = cleanJSON(response.text.trim());
        return JSON.parse(jsonString) as SchoolData;
    } catch (error) {
        console.error("Error generating initial data with Gemini:", error);
        console.warn("Using Fallback Data due to API error.");
        
        // If registration fails, we still return fallback but maybe modify the name to indicate failure
        if (schoolName) {
            return {
                ...FALLBACK_DATA,
                schoolProfile: { ...FALLBACK_DATA.schoolProfile, name: schoolName, code: "FALLBACK" }
            }
        }
        return FALLBACK_DATA;
    }
};

export const updateDataWithGemini = async (currentData: SchoolData, action: string): Promise<SchoolData> => {
    const prompt = `
    CURRENT DATABASE STATE:
    ${JSON.stringify(currentData)}

    REQUESTED ACTION:
    ${action}

    ${DATA_STRUCTURE_TEMPLATE}

    Return the updated JSON object representing the full SchoolData.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
            },
        });
        const jsonString = cleanJSON(response.text.trim());
        return JSON.parse(jsonString) as SchoolData;
    } catch (error) {
        console.error("Error updating data with Gemini:", error);
        throw new Error("An error occurred while processing your request. Please try again.");
    }
};

export const simulateLabExperiment = async (items: string[]): Promise<any> => {
    const prompt = `
    User has combined the following items in the virtual lab workstation: ${items.join(', ')}.
    
    Analyze this combination based on Chemistry, Biology, or Physics principles.
    Determine if a reaction occurs, checking for safety hazards.
    Provide a realistic simulation result.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: LAB_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
            },
        });
        const jsonString = cleanJSON(response.text.trim());
        return JSON.parse(jsonString);
    } catch (error) {
        console.error("Error simulating lab experiment:", error);
        throw new Error("Failed to simulate experiment.");
    }
};

export const generateTimetable = async (constraints: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: constraints,
            config: {
                systemInstruction: TIMETABLE_SYSTEM_INSTRUCTION,
            },
        });
        return response.text || "Failed to generate timetable";
    } catch (error) {
         return "Failed to generate timetable. Error: " + (error instanceof Error ? error.message : 'Unknown');
    }
};
