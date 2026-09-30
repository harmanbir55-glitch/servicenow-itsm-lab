# INC0020004 – Laptop request SLA missing, and the task SLA doesn't pause

| Field | Value |
|---|---|
| Number | INC0020004 |
| Caller | Maria Lopez (IT Manager) |
| Category / Subcategory | Software / ServiceNow – Service Level Management |
| Configuration Item | SLA definitions: Laptop fulfillment (RITM), Hardware task response (SCTASK) |
| Impact / Urgency / Priority | 2 – Medium (SLA reporting wrong for all laptop requests) / 3 – Low / **P4** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "My dashboard shows zero laptop SLAs this week even though we had six requests. And the hardware team got a breach on a task that was sitting on 'Pending' for two days waiting for a part."

## Diagnosis – SLA never starts

| Step | Check | Result |
|---|---|---|
| 1 | RITM0010031 → Task SLAs | **Empty** → the start condition never matched. |
| 2 | SLA definition *Laptop fulfillment* | Start condition: Item is New Laptop Request **AND State is Open**. |
| 3 | RITM → History → List | In this build the RITM sits in **Pending** while awaiting approval, and the flow then sets **Work in Progress**. It's never *Open* when the SLA engine evaluates it, so the condition never matched. (Check your own record's history — don't assume a state.) |

## Diagnosis – SLA never pauses

| Step | Check | Result |
|---|---|---|
| 4 | SCTASK0010040 → Task SLAs | Stage **In progress** the whole time, then **Breached**. |
| 5 | SLA definition *Hardware task response* | Pause condition: **Approval is Requested**. |
| 6 | SCTASK state while waiting | **Pending** — the pause condition was copied from the RITM SLA and never matches a task that waits on a *state*, not an approval. |

## Root cause
Both SLA definitions had conditions that didn't match how the records actually move through states: the start condition required a state the RITM skips, and the task SLA's pause condition checked approval instead of the **Pending** state.

## Resolution
1. *Laptop fulfillment* start condition → Item is New Laptop Request **AND Active is true** (no state dependency). Pause → Approval is Requested **OR** State is Pending.
2. *Hardware task response* pause → **State is Pending**.
3. Existing records: on each affected RITM/SCTASK, context menu **Repair SLAs** (admin) to recalculate timers against the corrected definitions.
4. Verified: new RITM shows the SLA *Paused* during approval, *In progress* after; SCTASK set to Pending shows *Paused*.

## Prevention
- Write SLA conditions from the **record's real state history** (History → Calendar/List), not from assumptions.
- After changing an SLA definition, test with a new record *and* repair existing ones.
- Add a report: RITMs for this item created this week **with no task_sla** (Task SLA related query) — a zero-SLA count is itself a warning.
