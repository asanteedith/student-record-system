#  Bug Log — Student Record System

A full record of every bug and AWS configuration issue encountered during the development of this project, what caused it, and how it was resolved. This documents the real problem-solving journey of building a serverless AWS application from scratch.

---

## Bug 1 — API Gateway: Missing `GET /students` Endpoint

**Service:** API Gateway + Lambda  
**Severity:** 🔴 Critical  
**Symptom:** Page loaded but table was always empty. Console showed `Network error: Failed to fetch`

### What happened
The initial API Gateway setup only configured routes for individual student operations:
- `POST /students` → CreateStudent
- `GET /students/{studentid}` → GetStudent
- `PUT /students/{studentid}` → UpdateStudent
- `DELETE /students/{studentid}` → DeleteStudent

There was **no `GET /students`** endpoint to fetch all students on page load. Every time the site opened, the frontend called `GET /students` and got a 404 back from API Gateway.

### Root cause
The original AWS guide did not include a `GetAllStudents` Lambda function or a `GET /students` route. This was missed during initial setup.

### Fix
1. Created a new Lambda function `GetAllStudents` using DynamoDB's `table.scan()` with pagination support for large datasets
2. In API Gateway → clicked `/students` resource → Create method → **GET** → Lambda Proxy → `GetAllStudents`
3. Re-enabled CORS on `/students`
4. Redeployed the API to the `prod` stage

### Lesson learned
Always map out **all** the API routes you need before starting. A `GET /collection` (list all) endpoint is just as important as `GET /collection/{id}` (get one).

---

## Bug 2 — API Gateway: Resource Named `/Students` Instead of `/students`

**Service:** API Gateway  
**Severity:** 🔴 Critical  
**Symptom:** All individual student operations (view, edit, delete) failed silently

### What happened
During API Gateway setup, the path parameter resource was accidentally created with a capital S — `/Students` — instead of the correct lowercase `/students`. This created two completely separate resources:

```
/students    ← GET, POST working
/Students    ← DELETE, GET, PUT — wrong path, never matched!
```

AWS API Gateway is **case-sensitive**. The frontend was calling `/students/{id}` (lowercase) but the methods were registered under `/Students/{id}` (uppercase), so every request to view, edit, or delete a student returned 404.

### Fix
1. Deleted the `/Students` resource entirely from API Gateway
2. Recreated it correctly as `/{studentid}` nested under `/students` (all lowercase)
3. Re-added all 3 methods (GET, PUT, DELETE) with correct Lambda integrations
4. Re-enabled CORS on the new `/{studentid}` resource
5. Redeployed the API to `prod`

### Lesson learned
AWS API Gateway resource paths are case-sensitive. Always double-check the exact casing of every resource path before adding methods to it.

---

## Bug 3 — Lambda: Path Parameter Case Mismatch (`studentId` vs `studentid`)

**Service:** Lambda + API Gateway  
**Severity:** 🔴 Critical  
**Symptom:** `Error: 'studentId'` when trying to view, edit, or delete any student

### What happened
When API Gateway passes path parameters to Lambda, it uses the **exact name** defined in the resource path. The resource was named `/{studentid}` (all lowercase) but the Lambda functions were reading `event['pathParameters']['studentId']` (camelCase).

```python
# BROKEN — looking for 'studentId' but API Gateway sends 'studentid'
student_id = event['pathParameters']['studentId']  # KeyError!
```

This caused a Python `KeyError` in GetStudent, UpdateStudent, and DeleteStudent every time they were invoked.

### Fix
Updated all 3 Lambda functions to read the lowercase key that matched the API Gateway resource name:

```python
# FIXED — matches the /{studentid} resource exactly
student_id = event['pathParameters']['studentid']
```

Clicked **Deploy** on each function after saving.

### Lesson learned
The path parameter name in your Lambda code must match **exactly** what is defined in the API Gateway resource path — including case. `{studentId}` and `{studentid}` are treated as completely different parameters.

---

## Bug 4 — API Gateway: CORS Not Re-enabled After Adding New Methods

**Service:** API Gateway  
**Severity:** 🔴 Critical  
**Symptom:** Browser console showed `CORS policy blocked` errors when calling the API from the S3 website

### What happened
Every time a new method was added or an existing resource was modified in API Gateway, CORS had to be re-enabled. After fixing the `/Students` vs `/students` issue and recreating resources, CORS was not re-enabled on the updated resources. The browser blocked all API calls because the `Access-Control-Allow-Origin` header was missing from responses.

### Fix
After any resource or method change in API Gateway:
1. Clicked the resource (`/students` and `/{studentid}`)
2. API Actions → **Enable CORS** → Enable CORS and replace existing CORS headers → Yes, replace existing values
3. Waited for all green checkmarks
4. **Redeployed the API** to `prod` — this step is mandatory, changes don't go live without it

### Lesson learned
In API Gateway, **CORS must be re-enabled every time you add or modify a resource or method**, and the API must be redeployed for changes to take effect. Forgetting to redeploy is the most common mistake.

---

## Bug 5 — API Gateway: Changes Not Live After Modification

**Service:** API Gateway  
**Severity:** 🟠 Medium  
**Symptom:** Fixes applied in API Gateway had no effect on the live site

### What happened
Multiple times during debugging, changes were made to API Gateway (adding methods, fixing CORS, updating integrations) but the live site continued to show the same errors. The changes were saved in the console but not deployed.

### Root cause
API Gateway uses a **staging system**. All changes are saved as drafts until explicitly deployed to a stage. The `prod` stage was running the old configuration even after updates were made.

### Fix
After every change in API Gateway:
1. API Actions → **Deploy API**
2. Deployment stage: **prod**
3. Click **Deploy**

### Lesson learned
API Gateway changes are **never live until deployed**. Always redeploy after any modification — this is different from Lambda where clicking Deploy immediately updates the function.

---

## Bug 6 — Lambda: Missing DynamoDB Permissions

**Service:** Lambda + IAM  
**Severity:** 🔴 Critical  
**Symptom:** Lambda functions returned `User is not authorized to perform: dynamodb:PutItem`

### What happened
When Lambda functions are created, they get a default execution role with basic permissions (CloudWatch logs only). They do not have permission to read from or write to DynamoDB by default.

### Fix
For each Lambda function:
1. Configuration tab → Permissions → clicked the execution role name
2. IAM opened in a new tab
3. Add permissions → Attach policies → searched for `AmazonDynamoDBFullAccess`
4. Selected it → Add permissions

### Lesson learned
In AWS, **no service has access to another service by default**. IAM permissions must be explicitly granted. This is the principle of least privilege — always check what permissions a service needs before wondering why it's failing.

---

## Bug 7 — S3: Website Showing Old Version After File Update

**Service:** S3  
**Severity:** 🟡 Minor  
**Symptom:** Uploading new frontend files to S3 but the live site still showed the old version

### What happened
After updating `app.js`, `styles.css`, or `index.html` and re-uploading to S3, the browser continued to serve the old cached version of the files.

### Fix
Two things needed to happen:
1. **Replace files in S3** — upload with the same filename to overwrite (S3 replaces the object)
2. **Hard refresh in browser** — press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac) to bypass the browser cache

### Lesson learned
Browsers aggressively cache static files. After deploying new frontend files to S3, always hard refresh or open in an incognito window to see the latest version.

---

## Bug 8 — DynamoDB: GPA Stored as Decimal Causing JSON Serialization Error

**Service:** Lambda + DynamoDB  
**Severity:** 🟠 Medium  
**Symptom:** Lambda returned a 500 error when trying to return student data containing GPA

### What happened
DynamoDB stores numbers as the `Decimal` type internally (from Python's `decimal` module). When Lambda tried to return a student record as JSON, Python's default `json.dumps()` cannot serialize `Decimal` objects and threw a `TypeError`.

```python
# BROKEN — Decimal is not JSON serializable
return json.dumps(response['Item'])  # TypeError!
```

### Fix
Added a custom `DecimalEncoder` class to all Lambda functions that read from DynamoDB:

```python
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# Use it when serializing
return json.dumps(response['Item'], cls=DecimalEncoder)
```

Also converted incoming GPA values to `Decimal` before writing to DynamoDB:
```python
body['gpa'] = Decimal(str(body['gpa']))
```

### Lesson learned
DynamoDB uses Python's `Decimal` type for all numbers. You must handle the conversion both when **writing** (float → Decimal) and **reading** (Decimal → float) to avoid serialization errors.

---

## Summary

| # | Bug | AWS Service | Severity |
|---|---|---|---|
| 1 | Missing GET /students endpoint | API Gateway + Lambda | 🔴 Critical |
| 2 | Resource named /Students instead of /students | API Gateway | 🔴 Critical |
| 3 | Path parameter case mismatch (studentId vs studentid) | Lambda + API Gateway | 🔴 Critical |
| 4 | CORS not re-enabled after resource changes | API Gateway | 🔴 Critical |
| 5 | API changes not live without redeployment | API Gateway | 🟠 Medium |
| 6 | Lambda missing DynamoDB permissions | Lambda + IAM | 🔴 Critical |
| 7 | S3 serving cached old files after update | S3 | 🟡 Minor |
| 8 | DynamoDB Decimal type not JSON serializable | Lambda + DynamoDB | 🟠 Medium |

---

*5 out of 8 bugs were Critical — all related to AWS service configuration rather than application code. This highlights how important it is to understand how AWS services communicate with each other.*
