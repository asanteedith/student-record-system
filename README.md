#  Student Record System

A full-stack serverless CRUD web application built on AWS for managing student records. Built as part of the AWS Certified Cloud Practitioner learning journey.

**Live Site:** http://student-records-edith-321.s3-website-us-east-1.amazonaws.com

---

##  Project Overview

The Student Record System allows users to:
- **Create** new student records
- **Read** / view all students or search by Student ID
- **Update** existing student information
- **Delete** student records

It features a clean, responsive UI with real-time stats (total students, average GPA, number of majors), color-coded avatars, major badges, and toast notifications for all actions.

---

##  Architecture

```
User Browser (S3 Static Website)
        ↓
API Gateway (REST API)
        ↓
Lambda Functions (Python 3.12)
        ↓
DynamoDB (StudentRecords table)
```

---

##  AWS Services Used

| Service | Purpose | Cost |
|---|---|---|
| **DynamoDB** | NoSQL database to store student records | Free tier: 25GB storage |
| **Lambda** | Serverless functions for CRUD operations | Free tier: 1M requests/month |
| **API Gateway** | REST API connecting frontend to backend | Free tier: 1M requests/month |
| **S3** | Hosts the static frontend website | Free tier: 5GB storage |
| **IAM** | Permissions and security roles | Free |

---

##  Project Structure

```
student-record-system/
├── README.md               ← You are here
├── BUGS.md                 ← All bugs encountered and fixed
├── frontend/
│   ├── index.html          ← Main HTML structure
│   ├── styles.css          ← All styling and responsive design
│   └── app.js              ← All JavaScript logic and API calls
└── lambda/
    ├── GetAllStudents.py   ← Scans and returns all student records
    ├── GetStudent.py       ← Returns a single student by ID
    ├── CreateStudent.py    ← Creates a new student record
    ├── UpdateStudent.py    ← Updates an existing student record
    └── DeleteStudent.py    ← Deletes a student record
```

---

##  Database Schema

**Table name:** `StudentRecords`  
**Partition key:** `studentId` (String)

| Field | Type | Description |
|---|---|---|
| `studentId` | String | Unique student identifier (e.g. S12345) |
| `name` | String | Full name of the student |
| `email` | String | Student email address |
| `major` | String | Course of study |
| `gpa` | Number | Grade Point Average (0.0 – 4.0) |

---

##  API Endpoints

**Base URL:** `https://{api-id}.execute-api.us-east-1.amazonaws.com/prod`

| Method | Endpoint | Lambda Function | Description |
|---|---|---|---|
| `GET` | `/students` | GetAllStudents | Fetch all student records |
| `POST` | `/students` | CreateStudent | Create a new student |
| `GET` | `/students/{studentid}` | GetStudent | Get a student by ID |
| `PUT` | `/students/{studentid}` | UpdateStudent | Update a student by ID |
| `DELETE` | `/students/{studentid}` | DeleteStudent | Delete a student by ID |

### Example Request — Create Student
```json
POST /students
Content-Type: application/json

{
  "studentId": "S12345",
  "name": "Jane Smith",
  "email": "jane@university.edu",
  "major": "Computer Science",
  "gpa": 3.75
}
```

### Example Response
```json
{
  "message": "Student created successfully",
  "studentId": "S12345"
}
```

---

##  Setup Guide

### Prerequisites
- AWS Free Tier account
- Basic understanding of JSON
- Text editor (VS Code recommended)

---

### Phase 1: DynamoDB

1. Go to **AWS Console → DynamoDB → Create table**
2. Settings:
   - Table name: `StudentRecords`
   - Partition key: `studentId` (String)
   - Capacity: On-demand
3. Click **Create table** and wait for status: Active

---### Phase 2: Lambda Functions

Create **5 Lambda functions** (all Python 3.12):

`GetAllStudents` | `GetStudent` | `CreateStudent` | `UpdateStudent` | `DeleteStudent`

For **each function**:
1. Lambda → Create function → Author from scratch
2. Name: (function name above), Runtime: Python 3.12
3. Paste the corresponding code from `/lambda/` folder
4. Click **Deploy**
5. Configuration → Permissions → click role name → Add permissions → Attach `AmazonDynamoDBFullAccess`

---

### Phase 3: API Gateway

1. API Gateway → Create API → REST API → New API
2. Name: `StudentRecordAPI`, Endpoint type: Regional

**Create resources and methods:**

```
/ (root)
└── /students
    ├── GET     → GetAllStudents (Lambda Proxy: ON)
    ├── POST    → CreateStudent  (Lambda Proxy: ON)
    └── /{studentid}
        ├── GET    → GetStudent    (Lambda Proxy: ON)
        ├── PUT    → UpdateStudent (Lambda Proxy: ON)
        └── DELETE → DeleteStudent (Lambda Proxy: ON)
```

**Enable CORS** on both `/students` and `/{studentid}`:
- Click resource → Enable CORS → replace existing → Yes

**Deploy:**
- API Actions → Deploy API → Stage: `prod`
- Copy the **Invoke URL**

---

### Phase 4: Frontend

1. Open `frontend/app.js`
2. Replace line 2 with your API Gateway Invoke URL:
```javascript
const API_BASE_URL = 'https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod';
```

---

### Phase 5: S3 Static Website

1. S3 → Create bucket
   - Name: (globally unique, e.g. `student-records-yourname-123`)
   - Region: `us-east-1`
   - Uncheck **Block all public access** → acknowledge
2. Upload `index.html`, `styles.css`, `app.js`
3. Properties → Static website hosting → Enable
   - Index document: `index.html`
4. Permissions → Bucket policy → paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

5. Visit your **Bucket website endpoint URL** — you're live! 🎉

---

##  Frontend Features

- **Stats Bar** — live count of total students, average GPA, unique majors
- **Search** — search any student by their Student ID
- **Color Avatars** — auto-generated colored initials per student
- **Major Badges** — color-coded pill badges per field of study
- **Actions Dropdown** — View / Edit / Delete per student row
- **Modals** — smooth animated forms for Add, Edit, View, Delete
- **Toast Notifications** — success and error feedback
- **Pagination** — configurable rows per page (10/25/50/100)
- **Responsive** — works on mobile, tablet and desktop

---

##  Technologies Used

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript (ES6+)
- Google Fonts — DM Sans, DM Mono
- No frameworks or libraries

**Backend:**
- Python 3.12 (Lambda)
- boto3 (AWS SDK for Python)
- AWS DynamoDB, Lambda, API Gateway, S3, IAM

---

##  Author

**Edith Asante**  
AWS Certified Cloud Practitioner Project  
Built: May 2026
