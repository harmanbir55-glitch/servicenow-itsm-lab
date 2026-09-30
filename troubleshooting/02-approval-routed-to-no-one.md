# INC0020002 – Laptop request approval not going to anyone

| Field | Value |
|---|---|
| Number | INC0020002 |
| Caller | Ahmed Hassan (Store Manager, Store 102) |
| Category / Subcategory | Software / ServiceNow – Approvals |
| Configuration Item | Flow: NPK – New Laptop Request |
| Impact / Urgency / Priority | 3 – Low (one requester, but any user without a manager is affected) / 2 – Medium / **P4** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "Zoe, one of our seasonal associates, requested a laptop for the stockroom last week. It still says 'awaiting approval' but I'm her manager and I never got anything."

## Diagnosis

| Step | Check | Result |
|---|---|---|
| 1 | RITM0010022 → Approvers related list | Empty, although the RITM's Approval field shows **Requested** |
| 2 | Flow execution → *Ask for Approval* step | Step **Waiting**. Approver input (data pill *requested_for → Manager*) is **empty** → zero approvers generated. |
| 3 | `sys_user` zoe.turner | **Manager empty**, Company empty. Created manually by a store manager's request, not via the HR onboarding feed. |
| 4 | Report: active users with no manager | 2 users (zoe.turner, robert.hayes – the director, expected) |

## Root cause
The approval rule uses the requester's **manager**, and the requester had no manager in ServiceNow. The flow asked for approval from nobody, so the request waited forever without anyone knowing. (Depending on the release and the approval rule, an empty approver list can also complete without a real approval, which is worse: an unapproved laptop gets ordered.)

## Resolution
1. Data fix: set zoe.turner's Manager = ahmed.hassan and Company = NorthPeak Home Supply.
2. Stuck request: cancelled and resubmitted (or, in production, a fix script to restart approval under a change).
3. **Flow guard added** (steps 2/2a/2b in the [flow spec](../config/flows/new-laptop-request-flow.md)): *If requested_for.Manager is empty* → work note + approval routed to the **IT Managers** group.
4. Retested as zoe.turner **before** the data fix was applied (on a second test user without a manager) → approval routed to IT Managers with a work note.

## Prevention
- Report *Active users with empty Manager* added to the IT Manager dashboard.
- Approval flows should always have a fallback approver path; never trust reference data to be complete.
- Escalated the data-quality issue: users created outside the HR feed.
