# Notifications – New Laptop Request

Navigate: **All > System Notification > Email > Notifications > New** (switch to Advanced view).

Baseline instances already send generic catalog emails (e.g. "Request Opened on Your Behalf", "Approval Request"). Test first; if a baseline email duplicates one of these, add a condition to the baseline notification to exclude this item rather than deleting it (configure, don't customize).

All bodies use the email script [`npk_laptop_request_summary`](npk_laptop_request_summary.js), which prints the variables as a table.

---

## 1. Laptop request submitted

| Setting | Value |
|---|---|
| Table | Requested Item [sc_req_item] |
| When to send | Record inserted |
| Conditions | Item **is** New Laptop Request |
| Who will receive | Requested for; Opened by |
| Subject | `${number} – We've received your laptop request` |

```html
<p>Hi ${requested_for.first_name},</p>
<p>Thanks – we've received your request for a new laptop. Here's what you asked for:</p>
${mail_script:npk_laptop_request_summary}
<p><b>What happens next:</b> your manager will be asked to approve it. Developer and Executive models,
or requests over $1,500, also need IT Manager approval. We'll email you at each step.</p>
<p>Track it any time: ${URI_REF}</p>
<p>NorthPeak IT Service Desk</p>
```

## 2. Approval requested (to the approver)

| Setting | Value |
|---|---|
| Table | Approval [sysapproval_approver] |
| When to send | Record inserted or updated |
| Conditions | State **is** Requested **AND** Source table **is** sc_req_item **AND** Approval for.Short description **is** New Laptop Request |
| Who will receive | Approver |
| Subject | `Approval needed: laptop request ${sysapproval.number}` |

```html
<p>Hi ${approver.first_name},</p>
<p>A new laptop request (${sysapproval.number}) needs your approval.</p>
${mail_script:npk_laptop_request_summary}
<p>${mailto:mailto.approval} &nbsp;|&nbsp; ${mailto:mailto.rejection}</p>
<p>Or review it in ServiceNow: ${URI_REF}</p>
```

`Approval for` references the generic Task table, so you can only dot-walk to Task fields (number, short description). The email script looks up the RITM to print the variables.

`${mailto:mailto.approval}` / `${mailto:mailto.rejection}` are the baseline email templates that let approvers reply by email; the inbound action "Update Approval Request" processes the reply.

## 3. Approved / Rejected (to the requester)

Two notifications, or one with the approval outcome in the body.

| Setting | Approved | Rejected |
|---|---|---|
| Table | Requested Item [sc_req_item] | Requested Item [sc_req_item] |
| When to send | Record updated | Record updated |
| Conditions | Item is New Laptop Request **AND** Approval **changes to** Approved | Item is New Laptop Request **AND** Approval **changes to** Rejected |
| Recipients | Requested for | Requested for; Opened by |
| Subject | `${number} – Your laptop request is approved` | `${number} – Your laptop request was not approved` |

Rejected body:

```html
<p>Hi ${requested_for.first_name},</p>
<p>Your laptop request ${number} was not approved. The approver's comments:</p>
<blockquote>${comments}</blockquote>
<p>If you have questions, reply to this email or contact your manager.</p>
```

## 4. Ready for pickup

| Setting | Value |
|---|---|
| Table | Requested Item [sc_req_item] |
| When to send | Record updated |
| Conditions | Item is New Laptop Request **AND** State **changes to** Closed Complete |
| Recipients | Requested for |
| Subject | `${number} – Your new laptop is ready` |

```html
<p>Hi ${requested_for.first_name},</p>
<p>Good news – your new laptop is imaged, set up and ready.</p>
${mail_script:npk_laptop_request_summary}
<p><b>Pickup:</b> IT Service Desk, ${requested_for.location}. Bring your old device if you're replacing one.</p>
<p>First time signing in? See <i>KB – How to request and set up a new laptop</i>.</p>
```

## Testing

PDIs don't send real email by default. Check what would have been sent in **All > System Mailboxes > Outbound > Outbox / Sent**, or **System Logs > Emails**. Open an email record and use **Preview HTML Body**.
