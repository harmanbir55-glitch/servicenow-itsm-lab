# INC0020001 – New Laptop Request submitted, but nothing happens

| Field | Value |
|---|---|
| Number | INC0020001 |
| Caller | Linda Park (Finance Manager) on behalf of James Cole |
| Category / Subcategory | Software / ServiceNow – Service Catalog |
| Configuration Item | Catalog item: New Laptop Request; Flow: NPK – New Laptop Request |
| Impact / Urgency / Priority | 2 – Medium (every laptop request) / 2 – Medium / **P3** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "James requested a laptop two days ago. I never got an approval email, and when I look at his request it just says Open. Nobody seems to be working on it."

## Diagnosis

| Step | Check | Result |
|---|---|---|
| 1 | RITM0010014 → Approvers related list | Empty |
| 2 | RITM → context menu → **Flows** / Workflow Studio → Executions filtered on the flow name | **No execution** for this RITM. Flow never started (not a flow error – that would show an execution with a failed step). |
| 3 | Catalog item → **Process Engine** tab | Flow field **empty**. Earlier the flow was copied to a new version for testing and the item was never pointed at the copy. |
| 4 | Flow Designer → NPK – New Laptop Request | Status **Draft / not active**. The copy was saved but never activated. |

## Root cause
The catalog item wasn't linked to an active flow. The Service Catalog trigger only runs when the catalog item's **Process Engine → Flow** field points to an **activated** flow.

## Resolution
1. Opened the flow → **Activate**.
2. Catalog item → Process Engine → Flow = *NPK – New Laptop Request*, Workflow empty → Save.
3. Existing stuck RITMs don't start the flow retroactively. For RITM0010014: cancelled with a comment and resubmitted on James's behalf (in production you could also start the flow for existing records with a background/fix script, under a change).
4. Retested as james.cole → execution appears, approval sent to linda.park.

## Prevention
- Test plan now includes "open the RITM → a flow execution exists" as step 1.
- When copying a flow for testing, rename it clearly (`… – TEST COPY`) and delete it after.
- Report: RITMs for this item, Active, **Approval = Not Yet Requested**, created more than 1 hour ago → catches this within the hour.

## Other causes that look the same
| Cause | How to tell |
|---|---|
| Legacy **Workflow** set on the item instead of a flow | Process Engine shows a Workflow; RITM → *Show Workflow* has a context |
| Flow activated in a different **application scope** / not committed on this instance | Flow missing entirely on this instance after an update set move |
| Record producer (not a catalog item) | Record producers create records via script, they don't use the item's flow |
