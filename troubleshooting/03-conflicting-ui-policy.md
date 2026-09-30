# INC0020003 – "Existing asset tag" field never appears on the laptop request

| Field | Value |
|---|---|
| Number | INC0020003 |
| Caller | Carlos Ruiz (Store Manager, Store 101) |
| Category / Subcategory | Software / ServiceNow – Service Catalog |
| Configuration Item | Catalog item: New Laptop Request |
| Impact / Urgency / Priority | 2 – Medium (all replacement requests) / 3 – Low / **P4** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "I'm requesting a replacement laptop for Emma. I pick 'Yes' for replacing a device, but there's nowhere to put the old asset tag. Hardware Fulfillment keeps asking me for it afterwards."

## Diagnosis

| Step | Check | Result |
|---|---|---|
| 1 | Reproduced as carlos.ruiz: Standard + Yes → field shows. **Executive** + Yes → field stays hidden. | Model-dependent. |
| 2 | `catalog_ui_policy_action.list`, filter Variable name = existing_asset_tag | **Two** policies act on it: *Show asset tag when replacing* (order 100, Visible = true) and *Simplify form for Executive* (order **200**, condition laptop_model = executive, Visible = **false**, Mandatory = **false**). |
| 3 | Catalog client scripts on the item | None touch this variable. |

## Root cause
Two catalog UI policies conflicted. When several policies set the same property on the same variable, they're applied in **Order** sequence and the **higher order number runs last and wins**. The "Simplify form for Executive" policy (order 200) hid the field that "Show asset tag when replacing" (order 100) had just shown.

Why it could also *submit* empty: ServiceNow won't hide a variable that is mandatory and empty, so on its own "Visible = false" wouldn't have worked. The Executive policy also set **Mandatory = false**, which removed the protection — the field disappeared and requests arrived without the tag.

## Resolution
1. Removed `existing_asset_tag` from *Simplify form for Executive* (that policy only needed to hide accessories).
2. Kept one policy responsible for the variable's visibility.
3. Retested all three models × Yes/No as carlos.ruiz: field shows and is mandatory only when replacing.

## Prevention
- **One variable, one policy** for visibility/mandatory; document ownership in the policy's short description.
- Before adding a policy, check `catalog_ui_policy_action.list` for the variable.
- Remember the order of execution on the client: client scripts first, then UI policies (policies can override scripts).
