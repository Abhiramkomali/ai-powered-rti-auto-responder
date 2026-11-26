# Soochna Manual Testing Checklist

Status and actual result fields are intentionally left pending.

| Test ID | Objective | Preconditions | Steps | Expected result | Actual result | Pass/fail |
|---|---|---|---|---|---|---|
| AUTH-001 | Citizen registration | Database available | Register with a unique valid email and password | Account created and login succeeds | Pending | Pending |
| AUTH-002 | Citizen login | Citizen account exists | Enter correct credentials | Citizen dashboard is accessible | Pending | Pending |
| AUTH-003 | Officer login | Officer account and membership exist | Enter officer credentials | Officer dashboard and authorized departments display | Pending | Pending |
| RTI-001 | RTI submission | Logged-in citizen | Submit a complete valid application | Application is persisted and reference number is returned | Pending | Pending |
| RTI-002 | Reference format | Submission successful | Inspect returned reference | Format matches `RTI-YYYYMMDD-XXXXXX` | Pending | Pending |
| RTI-003 | Citizen tracking | Existing application | Enter correct reference and email | Current status and submitted date display | Pending | Pending |
| RTI-004 | Citizen dashboard | Application belongs to citizen | Open citizen dashboard | Only owned applications are listed | Pending | Pending |
| OFF-001 | Officer application access | Officer membership exists | Open officer request workspace | Only assigned-department requests display | Pending | Pending |
| OFF-002 | Unauthorized department | Officer account lacks target membership | Request an application or record in another department | 403 or concealed 404 is returned | Pending | Pending |
| REC-001 | Fictional record seed | Database seeded | Inspect Public Works records | Clearly fictional records such as PWD-DEMO-001 display | Pending | Pending |
| REC-002 | Record creation | PIO or department admin membership | POST or use record-management UI with valid metadata | Record persists for its department and audit log is created | Pending | Pending |
| REC-003 | Record department isolation | Two departments and memberships | Retrieve department records | No cross-department records are returned | Pending | Pending |
| AI-001 | AI summarization | Provider configured; selected application | Ask for an application summary | Assistant summarizes authorized context without invented details | Pending | Pending |
| AI-002 | AI classification | Selected application | Ask for classification | Primary/secondary category, department suggestion, questions, records, gaps, and uncertainty are returned | Pending | Pending |
| AI-003 | Record retrieval | PWD application and fictional records | Ask about road information requirements | Matching PWD records and references are supplied; missing facts remain pending | Pending | Pending |
| AI-004 | Draft generation | Officer selected application and records | Ask for a point-wise draft | Draft cites references, marks gaps, and includes PIO review checklist | Pending | Pending |
| AI-005 | Gemini failure fallback | Gemini key invalid, Groq key valid | Send assistant request | Groq responds or fallback behavior is returned and Gemini failure is not exposed | Pending | Pending |
| AI-006 | Both providers unavailable | Invalid/no provider keys | Send assistant request | Demo response appears and AI limitation is clear | Pending | Pending |
| DRAFT-001 | Save response draft | Authorized dealing officer or PIO | Save draft content | Separate draft persists; status or citizen response does not change | Pending | Pending |
| DRAFT-002 | Unauthorized draft edit | Citizen or unauthorized officer | Call draft endpoint | 403 is returned | Pending | Pending |
| PIO-001 | PIO approval | PIO in the request department with saved draft | Approve latest draft | Draft is approved and request becomes APPROVED; audit log exists | Pending | Pending |
| PIO-002 | Unauthorized approval | Non-PIO user | Call approval endpoint | 403 is returned | Pending | Pending |
| PIO-003 | Final issue | PIO approved the draft | Issue response | Final response persists and request becomes RESPONSE_ISSUED | Pending | Pending |
| CIT-001 | Citizen final response visibility | Approved final response exists | Track application as citizen | Final response is visible | Pending | Pending |
| CIT-002 | Draft concealment | Saved but unapproved draft exists | Track application | Draft content is not exposed | Pending | Pending |
| API-001 | Invalid JSON | API route running | Send malformed JSON | 400 response is returned | Pending | Pending |
| API-002 | Invalid input | API route running | Send missing or wrong fields | 422 response or field errors are returned | Pending | Pending |
| API-003 | Unauthorized API access | No session | Call protected API | 401 response is returned | Pending | Pending |
| DB-001 | Database persistence | PostgreSQL migration applied | Submit and retrieve an application | Data remains after reload/restart | Pending | Pending |
| BUILD-001 | Production build | Environment configured | Run `npm run build` | Build succeeds or identified configuration issue is documented | Pending | Pending |
| DEPLOY-001 | Production deployment | Hosting, PostgreSQL, and environment variables configured | Deploy and open application | Application starts and database/provider configuration is verified | Pending | Pending |
