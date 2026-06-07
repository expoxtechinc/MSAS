# Firestore Security Specification - Dr. Abraham S. Borbor Memorial School of Excellence Portal

This specification defines the security invariants and rules applied to protect school and student data.

## 1. Data Invariants

1. **Bulletins/Announcements**:
   - Must be publicly readable by anyone (visitors, parents, students).
   - Can ONLY be created, updated, or deleted by authenticated Administrators.
   - All bulletin posts must have a valid title, category, author, and content.

2. **Student Accounts (`/students/{studentId}`)**:
   - Readable by authenticated clients (to permit student looking up their name and verifying password).
   - Can ONLY be added, updated, or deleted by authenticated Administrators.
   - Student passwords and profile records are PII and must not be exposed in blanket list queries.

3. **Academic Reports (`/reports/{reportId}`)**:
   - Academic reports belong to specific students.
   - Students can query/view only their own reports matching their `studentId`.
   - Can ONLY be created, updated, or deleted by authenticated Administrators.
   - Scoring below 74 must result in `status` being "Fail", calculated and verified dynamically.

---

## 2. The "Dirty Dozen" (Attack Vector Payloads)

Here are the twelve malicious or invalid update payloads that are mathematically blocked by our security layers:

1. **Anonymous Bulletin Overwrite**: An unauthenticated attacker attempts to post a fake announcement. (Blocked: requires `isAdmin()`)
2. **Student Self-Promotion**: A logged-in student attempts to modify their grade-level or name in the `/students/{studentId}` collection. (Blocked: `allow write: if isAdmin()`)
3. **Grade Tampering**: A student attempts to update their academic report score or GPA. (Blocked: `allow write: if isAdmin()`)
4. **ID Poisoning in Post**: Creating a bulletin with an oversized, junk ID (longer than 128 characters) to bloat project storage. (Blocked: `isValidId(bulletinId)`)
5. **PII Blanket Scraping**: Attempting to list all student records to harvest student passwords and IDs. (Blocked: `allow list` is restricted or requires exact ID verification)
6. **Ghost Bulletin Inject**: Submitting a bulletin post with negative/empty parameters or ghost fields (e.g., `hacked: true`). (Blocked: exact key size matching in validation helper)
7. **Report Creation Bypass**: Attempting to create an academic report with missing fields (like missing GPA). (Blocked: `isValidReport` schemas)
8. **Malicious File/Image Injection**: Attempting to post a bulletin with an excessively long title or non-standard category. (Blocked: character size constraints)
9. **Admin Spoofing**: Attempting to sign in or write data with a forged email claiming to be `luckyglobalnews@gmail.com` with `email_verified = false`. (Blocked: we require `request.auth.token.email_verified == true`)
10. **Report Hijacking**: Student A attempting to fetch Student B's academic report card. (Blocked: Student filtered queries verified on client and guarded by ID)
11. **Future Timestamp Forgery**: Forging a bulletin with a future post date. (Blocked: `incoming().createdAt == request.time`)
12. **Status Shortcutting**: Attempting to bypass failure grades by updating average < 74 to `status = "Pass"`. (Blocked: `isValidReport` enforcing average rule)

---

## 3. Security Rules Draft Code

The rules are formally written and deployed via `firestore.rules`.
