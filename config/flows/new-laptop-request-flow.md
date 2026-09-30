# Flow: NPK – New Laptop Request

Built in **Flow Designer** (in recent releases it opens from **All > Process Automation > Workflow Studio**; older releases: **All > Process Automation > Flow Designer**).

**Why Flow Designer and not the legacy Workflow Editor?** ServiceNow's direction for all new automation is Flow Designer: it's low-code, uses reusable actions/spokes, and has far better execution logging. Legacy workflows still run many baseline processes (for example the request-level approval workflow), so it's worth recognising them, but you shouldn't build new ones.

## Properties

| Setting | Value |
|---|---|
| Name | NPK – New Laptop Request |
| Application | Global |
| Run as | System User (so approvals and task creation don't depend on the requester's rights) |
| Trigger | **Service Catalog** |
| Attached to | Catalog item *New Laptop Request* → **Process Engine** tab → Flow = this flow |

> ⚠️ The Service Catalog trigger has no conditions: the flow runs because the **catalog item points to it**. If the item's Flow field is empty (or a legacy Workflow is set there), nothing runs. That's Scenario 1.

## Steps

| # | Type | Configuration |
|---|---|---|
| 1 | Action: **Get Catalog Variables** | Submitted Request = *Trigger → Requested Item Record*; Template Catalog Item = New Laptop Request; Catalog Variables = requested_for, laptop_model, needed_by, replacing_device, existing_asset_tag |
| 2 | Flow logic: **If** | Condition: *Step 1 → requested_for → Manager* **is empty** |
| 2a | ↳ Action: **Update Record** | RITM → Work notes: "Requested for has no manager in ServiceNow. Routed to IT Managers for approval. Please correct the user record." |
| 2b | ↳ Action: **Ask for Approval** | Record = RITM; Approval field = Approval; Journal field = Comments; Rules: *Anyone approves* from **group IT Managers** |
| 3 | Flow logic: **Else** | |
| 3a | ↳ Action: **Ask for Approval** | Record = RITM; Approval field = Approval; Journal field = Comments; Rules: *Anyone approves* — User = *Step 1 → requested_for → Manager*; Reject: *Anyone rejects* |
| 4 | Flow logic: **If** | *Approval state* (from 2b or 3a) **is Rejected** |
| 4a | ↳ Action: **Update Record** | RITM: State = Closed Incomplete; Comments = "Your laptop request was not approved. See the approver's comments above. Contact your manager if you have questions." |
| 4b | ↳ Flow logic: **End Flow** | |
| 5 | Flow logic: **If** | *Step 1 → laptop_model* **is** developer **OR** *laptop_model* **is** executive **OR** *Trigger → Requested Item → Price* **greater than** 1500 |
| 5a | ↳ Action: **Ask for Approval** | Record = RITM; Rules: *Anyone approves* from **group IT Managers** |
| 5b | ↳ Flow logic: **If** Approval state is Rejected | Update Record (same as 4a) → End Flow |
| 6 | Action: **Update Record** | RITM: State = Work in Progress |
| 7 | Action: **Create Catalog Task** | Requested Item = trigger RITM; Short description = "Image and configure laptop – *laptop_model*"; Assignment group = **Hardware Fulfillment**; Catalog variables shown on task: laptop_model, accessories, replacing_device, existing_asset_tag, needed_by; **Wait: ✔** |
| 8 | Action: **Create Catalog Task** | Short description = "Set up account and deliver laptop to *requested_for*"; Assignment group = **IT Service Desk**; variables: requested_for, needed_by; **Wait: ✔** |
| 9 | Flow logic: **If** | Step 7 Catalog Task.State **is** Closed Complete **AND** Step 8 Catalog Task.State **is** Closed Complete |
| 9a | ↳ Action: **Update Record** | RITM: State = Closed Complete (the RITM closing closes the REQ; triggers the *Ready for pickup* email) |
| 10 | Flow logic: **Else** | Update Record RITM: State = Closed Incomplete; Work notes = "A fulfillment task was closed incomplete – review tasks." |

Steps 2/2a/2b were added after **Scenario 2** (a requester with no manager).

## Choice values used

| Field | Values |
|---|---|
| `sc_req_item.state` | -5 Pending · 1 Open · 2 Work in Progress · 3 Closed Complete · 4 Closed Incomplete · 7 Closed Skipped |
| `sc_req_item.approval` | not requested · requested · approved · rejected |
| `sc_task.state` | -5 Pending · 1 Open · 2 Work in Progress · 3 Closed Complete · 4 Closed Incomplete · 7 Closed Skipped |

## ⚠️ Request-level approval

Baseline instances also have a **request (REQ) level** process. The legacy *Service Catalog Request* workflow on `sc_request` has historically auto-approved requests under $1,000 and asked the requester's manager for anything above. With laptop prices over $1,000, a user may get **two manager approvals** (REQ and RITM). Check an approved test REQ's *Approvers* related list. If you see it, decide deliberately: disable the REQ-level approval (configure which workflow/flow runs on `sc_request`), or skip the manager step in this flow.

## Test plan (impersonate each user – never test as admin)

| Test | Impersonate | Expect |
|---|---|---|
| Standard, no accessories ($1,099) | james.cole → approve as **linda.park** | 1 approval, 2 SCTASKs, closes when both tasks close |
| Standard + dock + monitor ($1,649) | james.cole → linda.park → **maria.lopez** | 2 approvals (cost rule) |
| Developer | nina.patel → maria.lopez (as manager) → maria.lopez (as IT Managers) | 2 approvals |
| Rejection | james.cole → linda.park rejects with comment | RITM Closed Incomplete, rejection email, no tasks |
| No manager | zoe.turner | Routed to IT Managers with work note |
| Task incomplete | Hardware task closed incomplete by sara.kim | RITM Closed Incomplete |

Impersonate: **user menu (top right) → Impersonate user**. Approve from **Self-Service > My Approvals** or the Service Portal *Approvals* widget.

## Reading execution details when something fails

1. Open the RITM → related link / context menu **Flows** (or *Show Flow* in newer releases) to open the flow execution for this record.
2. Or **Workflow Studio / Flow Designer → Executions** (older: *Flow Administration → Today's Executions*), filter by the flow name.
3. The execution view shows each step with a **status** (Completed, Waiting, Error, Skipped), the **inputs and outputs** of each action (the actual data pills), and the **runtime** of each step.
4. A step in **Waiting** = normal for approvals and catalog tasks with *Wait* ticked. **Error** shows the message; click the step to see the failing input (typically an empty data pill such as a missing manager).
5. **No execution at all** = the flow never started: check the item's Process Engine tab and that the flow is **Activated** (Save ≠ Activate).
6. While building, **Test** (top right in the flow editor) runs the flow against an existing RITM without submitting a new request.
