# Build guide

Phase-by-phase build on a **ServiceNow PDI (Australia release)**. Every step gives the navigation path, the table behind it (type `<table>.list` in the navigator filter if a menu has moved), and **why** it's done. ⚠️ = common mistake.

**Release note:** ServiceNow renamed/moved several UIs over recent releases: Flow Designer now opens from **Workflow Studio**, reporting and dashboards are moving to the **Platform Analytics** experience, and the Next Experience header replaced UI16. The concepts and tables are identical; only menus differ. If a path doesn't exist on your instance, use the table name.

**Contents:** [Phase 0](#phase-0--foundations) · [Phase 1](#phase-1--service-catalog-new-laptop-request) · [Phase 2](#phase-2--approval-and-fulfillment-flow) · [Phase 3](#phase-3--slas) · [Phase 4](#phase-4--knowledge-management) · [Phase 5](#phase-5--reporting-and-platform-basics)

---

## Phase 0 – Foundations

### 0.1 Navigation

| Concept | Where | Why it matters |
|---|---|---|
| Application navigator | **All** menu (top left) | Every module lives here; type to filter |
| Favorites / History | **Favorites** and **History** tabs in the header | Star modules you use daily (Catalog Items, Flow Designer, Update Sets) |
| Table shortcuts | Type `sc_req_item.list` or `sc_req_item.form` in the navigator filter | Opens any table directly; `.LIST` / `.FORM` open in a new tab |
| Update set & scope picker | Globe icon in the header (enable under **user menu > Preferences > Developer** if hidden) | Always shows which update set is capturing your changes |

**Personalize vs configure:**

| | Personalize | Configure |
|---|---|---|
| Who sees it | Only you | Everyone |
| List | Gear icon on the list → pick columns | List header menu → **Configure > List Layout** |
| Form | Form menu → *Personalize form* (hide non-mandatory fields for yourself) | Form menu → **Configure > Form Layout / Form Design** |
| Captured in update set | No (stored as user preferences) | **Yes** |

### 0.2 Update set

**Why:** an update set records every configuration change (catalog items, flows, notifications, ACLs…) so it can be moved to another instance as one unit and backed up as XML.

1. **All > System Update Sets > Local Update Sets > New**
2. Name `Laptop Request v1`, Description "New laptop request: catalog, flow, SLAs, knowledge base setup, reports, ACL, import" → **Submit and Make Current**.
3. Confirm the header picker shows **Laptop Request v1**.

> ⚠️ **Working in "Default"** is the most common admin mistake: your changes still save, but you can't export them cleanly. Check the picker every time you log in; it can reset after a session times out.
>
> ⚠️ **Update sets capture configuration, not data.** Users, groups, group members, companies, locations and KB articles are **data** — export those separately as XML (see Phase 5.7).

### 0.3 Company, locations, departments, cost center

| Record | Navigation (table) | Values |
|---|---|---|
| Company | **All > Organization > Companies** (`core_company`) | NorthPeak Home Supply |
| Locations | **All > Organization > Locations** (`cmn_location`) | Head Office (Portland, OR) · Store 101 (Tacoma, WA) · Store 102 (Salem, OR) |
| Departments | **All > Organization > Departments** (`cmn_department`) | Information Technology · Finance · Operations · Store Operations |
| Cost center | `cmn_cost_center.list` | CC-4100 IT Hardware → set on the IT department |

**Why:** locations drive where laptops are delivered and power "by location" reporting; company is used by user criteria in Phase 4.

### 0.4 Groups and roles

**All > User Administration > Groups** (`sys_user_group`)

| Group | Manager | Roles (on the **group**) | Purpose |
|---|---|---|---|
| IT Service Desk | maria.lopez | itil | Account setup and delivery tasks; KB contributors |
| Hardware Fulfillment | maria.lopez | itil | Imaging and configuring laptops |
| IT Managers | robert.hayes | itil, approver_user, catalog_admin, knowledge_admin | Second-level approval; owns the catalog item and KB |
| Store Managers | robert.hayes | approver_user | Approve requests for store staff |

**Why roles on groups, not users:** when someone joins or leaves a team you change one group membership and every role follows. Roles granted via a group show as **Inherited = true** on the user's Roles tab.

| Role | What it grants |
|---|---|
| itil | Fulfiller: work incidents, requests, tasks |
| approver_user | Approve/reject without a full fulfiller role |
| catalog_admin | Create and manage catalog items, categories, variables |
| knowledge_admin | Manage knowledge bases, categories and settings |

### 0.5 Users

Create the 12 users in [data/users.csv](../data/users.csv): manually (**All > User Administration > Users > New**) or with **System Import Sets > Load Data** (good practice for Phase 5). Set **Manager**, **Department**, **Location**, **Company**, and add them to groups (Groups related list on the user, or Members on the group).

> ⚠️ Leave **zoe.turner** without a manager and without a company on purpose — she's the test user for Scenarios 2 and 5.
>
> ⚠️ **Testing as admin** hides real problems: admin passes most ACLs and sees everything. Use **user menu > Impersonate user** for every test.

### ✅ Done when

- [ ] `Laptop Request v1` is current and the picker shows it
- [ ] 1 company, 3 locations, 4 departments, 1 cost center exist
- [ ] 4 groups with roles; 12 users with managers (except zoe.turner) and group memberships
- [ ] Impersonating kevin.osei shows the itil modules; impersonating emma.wright shows only self-service

---

## Phase 1 – Service Catalog: New Laptop Request

### 1.1 Catalog and category

**All > Service Catalog > Catalogs** (`sc_catalog`): use the baseline **Service Catalog**. **All > Service Catalog > Catalog Definitions > Maintain Categories** (`sc_category`): use or create **Hardware**.

### 1.2 Reusable variable set "Requester Info"

**All > Service Catalog > Catalog Variables > Variable Sets > New** → *Single-Row Variable Set*, name `Requester Info`, internal name `requester_info`.

| Order | Question | Name | Type | Settings |
|---|---|---|---|---|
| 100 | Requested for | requested_for | Reference → sys_user | Mandatory; Default value `javascript:gs.getUserID()`; Reference qualifier `active=true` |
| 200 | Location | requester_location | Reference → cmn_location | **Auto-populate**: Dependent question = requested_for, Dot walk path = Location |
| 300 | Contact phone | contact_phone | Single Line Text | Optional |

**Why a variable set:** define once, reuse on many items. A fix to the set fixes every item that uses it.

### 1.3 The catalog item

**All > Service Catalog > Catalog Definitions > Maintain Items > New** (`sc_cat_item`)

| Field | Value |
|---|---|
| Name | New Laptop Request |
| Catalogs / Category | Service Catalog / Hardware |
| Short description | Request a new or replacement company laptop |
| Description | Who it's for, the three models, approval rules, 5-business-day target, link to the KB article *How to request and set up a new laptop* |
| Picture | Any laptop image (fictional) |
| Price | 0.00 (price comes from the variables) |
| Fulfillment group | Hardware Fulfillment |
| Process Engine → Flow | set in Phase 2 |

**Variables** (Variables related list):

| Order | Question | Name | Type | Settings |
|---|---|---|---|---|
| — | *Requester Info* | — | Variable set | Variable Sets related list → Add |
| 100 | Laptop model | laptop_model | Select Box | Mandatory; choices: Standard – Dell Latitude (`standard`, **price 1099**), Developer – Lenovo ThinkPad P16s (`developer`, **1899**), Executive – MacBook Pro 14 (`executive`, **2399**) |
| 200 | Business justification | business_justification | Multi Line Text | **Mandatory** |
| 300 | Needed by | needed_by | Date | Mandatory |
| 400 | Replacing an existing device? | replacing_device | Yes / No | Default No |
| 500 | Existing asset tag | existing_asset_tag | Single Line Text | Hidden by default (UI policy); Example text NP-LT-00001 |
| 600 | Accessories | accessories_label | Label | — |
| 610 | Docking station | accessory_dock | CheckBox | **Price if checked 229** |
| 620 | Monitor | accessory_monitor | CheckBox | **Price if checked 279** |
| 630 | Headset | accessory_headset | CheckBox | **Price if checked 99** |

Standard + dock + monitor = $1,607 → crosses the $1,500 threshold in Phase 2, so the cost rule is testable.

### 1.4 Catalog UI policies

**Catalog item > Catalog UI Policies related list > New** (`catalog_ui_policy`)

| Policy | Condition | Action | Applies on |
|---|---|---|---|
| Show asset tag when replacing | replacing_device **is** Yes | existing_asset_tag: Visible **true**, Mandatory **true**; **Reverse if false** ✔; On load ✔ | Catalog item view, Requested Items, Catalog Tasks |
| Lock request details for fulfillers | *(no condition)* | laptop_model, business_justification, needed_by: Read only **true** | Requested Items, Catalog Tasks only (**not** Catalog item view) |

### 1.5 Catalog client script

**Catalog item > Catalog Client Scripts > New** → onChange, variable `needed_by`, UI Type **All**. Code: [config/client-scripts/validate-needed-by.js](../config/client-scripts/validate-needed-by.js).

| Use a UI policy when… | Use a client script when… |
|---|---|
| Showing/hiding, mandatory, read-only based on field values | You need logic: comparisons, calculations, messages, calls to the server (GlideAjax) |
| No code needed; easier to maintain | A policy can't express it |
| Runs on load and on change automatically | You control exactly when (onLoad, onChange, onSubmit) |

UI policies run **after** client scripts, so a policy can override what a script did — relevant for Scenario 3.

### 1.6 Second item using the variable set

Create **Accessory Request** (Hardware category) with the *Requester Info* set plus a Select Box `accessory` (Dock 229 / Monitor 279 / Headset 99 / Mouse & keyboard 59). Proves the set is reusable.

### 1.7 The data model

Submit a test request (impersonate james.cole, Service Portal `/sp` → Hardware → New Laptop Request → Order Now):

| Record | Table | Open with |
|---|---|---|
| REQ0010xxx | `sc_request` | `sc_request.list` |
| RITM0010xxx | `sc_req_item` (variables in the **Variables** editor on the form) | `sc_req_item.list` |
| SCTASK0010xxx | `sc_task` (created in Phase 2) | `sc_task.list` |
| Variable values | `sc_item_option`, linked to the RITM by `sc_item_option_mtom` | used for reporting in Phase 5 |

One REQ can contain several RITMs (one per cart item); one RITM can have many SCTASKs.

### ✅ Done when

- [ ] The item shows in the portal under Hardware with a picture, and the **price updates** as you change the model and accessories
- [ ] "Existing asset tag" appears and becomes mandatory only when replacing = Yes
- [ ] A past "Needed by" date is cleared with an error message
- [ ] Accessory Request shows the same Requester Info section
- [ ] Submitting creates a REQ and RITM with all variables visible on the RITM

---

## Phase 2 – Approval and fulfillment flow

Build the flow exactly as specified in [config/flows/new-laptop-request-flow.md](../config/flows/new-laptop-request-flow.md), then:

1. **Activate** the flow (Save alone does not run it).
2. Catalog item → **Process Engine** tab → Flow = *NPK – New Laptop Request*; Workflow field empty.
3. Create the **email script** and **4 notifications** in [config/notifications/](../config/notifications/README.md).
4. Run the **test plan** in the flow spec, impersonating each persona.

> ⚠️ Check the request-level approval note in the flow spec, otherwise testers see a surprise second manager approval.
>
> ⚠️ Approvers need to be able to see the approval: users with only **approver_user** approve from **Self-Service > My Approvals** or the portal.

### ✅ Done when

- [ ] All 6 test-plan cases behave as expected
- [ ] Rejection closes the RITM with comments and emails the requester
- [ ] Two SCTASKs are created in order and the RITM closes when both close
- [ ] Emails appear in **System Mailboxes > Outbound** with variables printed
- [ ] You can open a flow execution and explain every step's status

---

## Phase 3 – SLAs

### 3.1 Schedules

**All > System Scheduler > Schedules > Schedules** (`cmn_schedule`)

| Schedule | Time zone | Entries |
|---|---|---|
| **NPK Business Hours – Pacific** | America/Los_Angeles | "Business hours": 09:00–17:00, repeats **weekly Mon–Fri** |
| **NPK Holidays** (child, type **Exclude**) | America/Los_Angeles | Thanksgiving 2026-11-26, Christmas 2026-12-25, New Year 2027-01-01, Memorial Day 2027-05-31, Independence Day (observed) 2027-07-05, Labor Day 2027-09-06 — or reuse the baseline *U.S. Holidays* schedule as the child |

Add NPK Holidays under **Child Schedules** of the business-hours schedule. **Why a separate time zone field:** the SLA counts 9–5 *Pacific* even when the agent or user is elsewhere.

### 3.2 SLA definitions

**All > Service Level Management > SLA > SLA Definitions** (`contract_sla`)

| | Laptop fulfillment | Hardware task response | P1 incident resolution |
|---|---|---|---|
| Type | SLA | SLA | SLA |
| Table | Requested Item | Catalog Task | Incident |
| Duration | **40 hours** (= 5 × 8-hour business days) | 4 hours | 4 hours |
| Schedule | NPK Business Hours – Pacific | NPK Business Hours – Pacific | **none (24x7)** |
| Start | Item **is** New Laptop Request **AND** Active is true | Assignment group **is** Hardware Fulfillment **AND** State **is** Open | Priority **is** 1 – Critical |
| Pause | Approval **is** Requested **OR** State **is** Pending | State is Pending | State is On Hold |
| Stop | State **is one of** Closed Complete, Closed Incomplete, Closed Skipped | State **is** Work in Progress **OR** State is one of the closed states | State is one of Resolved, Closed |
| Cancel | Start conditions are not met | Start conditions are not met | Priority changes from 1 (start not met) |
| Retroactive start | — | — | ✔, **Set start to: Created** |

> ⚠️ **Duration on a schedule:** with a schedule, "1 Day" means 24 hours of *schedule* time, which is 3 working days on a 9–5 schedule. For business days, enter the duration in **hours** (5 days × 8 = 40 h).

**Retroactive start explained:** an incident logged at 09:00 as P3 is raised to P1 at 11:00. Without retroactive start, the 4-hour clock starts at 11:00. With *Set start to: Created*, it starts at 09:00 — only 2 hours remain, because the customer has been affected since 09:00.

**Why the RITM SLA pauses during approval:** IT shouldn't be measured on time the request spent waiting for the requester's own manager.

### 3.3 Seeing SLAs

| Where | What you see |
|---|---|
| RITM / SCTASK / Incident form → **Task SLAs** related list | SLA definition, Stage (In progress / Paused / Completed / Cancelled), **Has breached**, **Business elapsed %** (colour bar), Business time left, Planned end time |
| `task_sla.list` | Every SLA timer on every task — filter Has breached = true for breaches |
| Form context menu → **Show SLA timeline** (where available) | When each timer started, paused and stopped |

**Connection to my service desk metrics:** "96% SLA compliance" is the share of `task_sla` records for my group's tickets that completed with **Has breached = false**. As a fulfiller I saw the coloured timer on the form; as an admin I now define the start/pause/stop conditions that make that number fair.

### ✅ Done when

- [ ] A laptop RITM shows the fulfillment SLA **Paused** while awaiting approval and **In progress** after
- [ ] The Hardware Fulfillment SCTASK SLA completes when a technician sets Work in Progress
- [ ] A P3 incident raised to P1 shows an SLA with start time = created time
- [ ] A test SLA can be made to breach (temporarily set a 5-minute duration, then restore it)

---

## Phase 4 – Knowledge management

### 4.1 User criteria

**All > Knowledge > Administration > User Criteria** (`user_criteria`)

| Criteria | Matches |
|---|---|
| NorthPeak Employees | Company = NorthPeak Home Supply |
| IT Knowledge Contributors | Groups = IT Service Desk, IT Managers |

User criteria fields are **OR** within one record by default (any matching condition counts); tick **Match all** to require every condition.

### 4.2 Knowledge base

**All > Knowledge > Administration > Knowledge Bases > New** (`kb_knowledge_base`)

| Field | Value |
|---|---|
| Title | IT Self-Service |
| Owner / Managers | maria.lopez / kevin.osei |
| Publish workflow | **Knowledge - Approval Publish** (draft → review → published after approval) |
| Retire workflow | **Knowledge - Approval Retire** |
| Can Read | NorthPeak Employees |
| Can Contribute | IT Knowledge Contributors |

Categories (Categories related list): Accounts & Passwords · Hardware · Network & Wi-Fi · Email & Collaboration · Remote Access.

**Article lifecycle:** Draft → (Publish) → **Review** (approval by KB owner/managers) → **Published** → (Checkout = new version) → old version **Outdated** · (Retire) → Pending retirement → **Retired**. Versioning is controlled by the property `glide.knowman.versioning.enabled`.

### 4.3 Articles

Impersonate **kevin.osei** and create the 5 articles in [/kb](../kb) (**All > Knowledge > Create New**, or Knowledge homepage → Create an Article). Publish each; approve as **maria.lopez** or **kevin.osei** as KB manager.

### 4.4 Link knowledge to the catalog item and to incidents

| Link | How |
|---|---|
| Catalog item → KB | Link to *How to request and set up a new laptop* in the item's Description (portal URL `/sp?id=kb_article&sysparm_article=KB00xxxxx`) |
| KB → catalog item | In the article, link to `/sp?id=sc_cat_item&sys_id=<item sys_id>` |
| KB → incident (agent workflow) | Incident form → **book icon** next to Short description or the **Contextual Search** results → **Attach**. The article is copied into Additional comments and listed in the **Attached Knowledge** related list (`m2m_kb_task`) — this is how KB usage is measured |
| Incident → new KB | Tick **Knowledge** on the resolution tab; closing the incident creates a draft article for review |

### 4.5 Version and retire

- **Version:** open the Wi-Fi article → **Checkout** → edit (e.g. new SSID) → Publish → v2.0 published, v1.0 **Outdated**.
- **Retire:** Outlook article → **Retire** → approve → Retired (hidden from readers, kept for history).

### ✅ Done when

- [ ] KB, criteria and 5 categories exist; 5 articles published through the approval workflow
- [ ] emma.wright (store employee) can read articles; zoe.turner can't (no company → Scenario 5)
- [ ] emma.wright **cannot** create articles; kevin.osei can
- [ ] One article has v2.0 and one is retired
- [ ] A KB article is attached to a test incident

---

## Phase 5 – Reporting and platform basics

### 5.1 Reports

**All > Reports > Create New** (or **Platform Analytics > Data visualization** on newer UIs)

| Report | Source table | Filter | Type / group by |
|---|---|---|---|
| Open requests by state | Requested Item | Active = true | Bar, group by State |
| SLA breaches by group | Task SLA | Has breached = true | Bar, group by **Task → Assignment group** |
| Approvals pending over 2 days | Approval | State = Requested **AND** Created **before** 2 days ago | List, group by Approver |
| Requests by laptop model | Variable Ownership (`sc_item_option_mtom`) | Variable → Question = Laptop model | Pie, group by **Variable → Value** |

**Dashboard:** create **IT Manager – Laptop Requests**, add all four, share with the IT Managers group.

### 5.2 Dictionary and a custom field

**All > System Definition > Tables** → Catalog Task → Columns → **New**: Type String, Label *Asset tag*, Column name `u_asset_tag`, Max length 20. Add it to the SCTASK form (**Configure > Form Layout**).

| | Extended table | Custom table |
|---|---|---|
| Example | `sc_task` extends `task` | `u_imp_laptop_assets`, `u_something` |
| Inherits | All parent fields (number, state, SLAs, approvals, assignment) | Nothing unless it extends a table |
| Naming | ServiceNow tables have no prefix | Global: `u_`; scoped apps: `x_<vendor>_<app>_` |
| Licensing | — | Custom tables can count toward licensed table limits in production |

Custom **fields** on baseline tables always start with `u_` in global scope.

### 5.3 ACL

Elevate: **user menu > Elevate role > security_admin**. **All > System Security > Access Control (ACL) > New**:

| ACL | Operation | Requires role | Script |
|---|---|---|---|
| sc_task.u_asset_tag | read | itil | — |
| sc_task.u_asset_tag | write | itil | [config/acls/sc_task-u_asset_tag-write.js](../config/acls/sc_task-u_asset_tag-write.js) |

Test: impersonate **sara.kim** (Hardware Fulfillment) → can edit; **kevin.osei** (Service Desk) → read-only. The evaluation order is explained in the script header. Newer releases also support **Deny-Unless** ACLs, evaluated before Allow-If ACLs.

### 5.4 Business rule

**All > System Definition > Business Rules > New** → table Catalog Task, before, insert + update, condition *Asset tag changes*. Code: [config/business-rules/sc_task-validate-asset-tag.js](../config/business-rules/sc_task-validate-asset-tag.js) (includes when **not** to use a business rule).

### 5.5 Import set and transform map

1. **All > System Import Sets > Load Data** → Create table, label *Laptop Assets*, upload [data/laptop-assets.csv](../data/laptop-assets.csv), header row 1 → Submit.
2. **Create transform map** → Target table Hardware [alm_hardware] → **Mapping Assist** → configure field maps and scripts per [config/transform-maps/laptop-assets-transform.js](../config/transform-maps/laptop-assets-transform.js).
3. Set **Coalesce = true** on `serial_number`.
4. **Transform** → Import log: expect **20 inserted**.
5. Load [data/laptop-assets-update.csv](../data/laptop-assets-update.csv) into the same import table and transform → expect **5 updated, 0 inserted**. Scenario 6 shows what happens without coalesce.

**Why coalesce:** coalesce tells the transform "if a record with this value already exists, update it instead of creating a new one." Choose a field that is unique and stable (serial number, not asset tag if tags get reissued).

### 5.6 Close and export the update set

1. Review **Local Update Sets > Laptop Request v1 > Customer Updates**: every catalog item, variable, UI policy, client script, flow, notification, email script, SLA definition, schedule, KB base setting, report, dictionary entry, ACL, business rule and transform map should appear. Anything missing was probably made in another update set — use the record's **Update Sets** related list / *Move to update set*.
2. Set **State = Complete** → related link **Export to XML** → save the XML.

### 5.7 Export data (not in the update set)

For each table: open the filtered list → list header menu → **Export > XML**.

| Data | Filter |
|---|---|
| Users (`sys_user`) | User ID in the 12 users |
| Groups, group members, group roles | Name in the 4 groups |
| Companies, locations, departments, cost center | NorthPeak records |
| KB articles (`kb_knowledge`) | Knowledge base = IT Self-Service |

Keep these files with the update set XML.

### 5.8 Prove it's portable

Use a **second clean instance** — or, after checking every export opens correctly, **reset your PDI** from the Developer portal (*Manage instance > Reset*).

1. Import the data XML first: list header menu → **Import XML** (users, groups, locations…).
2. **System Update Sets > Retrieved Update Sets > Import Update Set from XML** → open it → **Preview Update Set** → resolve any preview problems → **Commit Update Set**.
3. Re-run the Phase 2 test plan.

> ⚠️ Preview errors like "Could not find a record in sys_user_group" mean the data wasn't loaded first — the configuration references data that must already exist.

### ✅ Done when

- [ ] 4 reports and the dashboard, visible to IT Managers
- [ ] `u_asset_tag` on SCTASK, protected by the ACL, validated by the business rule
- [ ] 20 hardware assets imported; re-import updates 5 without duplicates
- [ ] Update set exported, data exported, re-imported into a clean instance and the test plan passes
