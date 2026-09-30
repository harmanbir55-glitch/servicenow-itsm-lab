# INC0020006 – Hardware asset list has duplicate laptops after an import

| Field | Value |
|---|---|
| Number | INC0020006 |
| Caller | Sara Kim (Hardware Technician) |
| Category / Subcategory | Software / ServiceNow – Data import |
| Configuration Item | Transform map: Laptop Assets → Hardware |
| Impact / Urgency / Priority | 2 – Medium (asset data unreliable for the team) / 2 – Medium / **P3** |
| Assignment group | ServiceNow Platform Admins |

## Symptoms (as reported)
> "After this morning's asset update, every laptop in the store 101 list shows up twice — one says In stock and one says In use. I don't know which one to assign."

## Diagnosis

| Step | Check | Result |
|---|---|---|
| 1 | **System Import Sets > Advanced > Transform History** (`sys_import_set_run`) for today | Inserts **5**, Updates **0**. The update file only contained existing assets, so expected Inserts 0 / Updates 5. |
| 2 | `alm_hardware.list` grouped by Serial number, count > 1 | 5 serial numbers × 2 records. |
| 3 | Transform map → Field maps | **No field has Coalesce = true**. It had been rebuilt with Mapping Assist to add the location field, and coalesce on `serial_number` wasn't re-ticked. |

## Root cause
Without a **coalesce** field, a transform map can't match incoming rows to existing records, so every row is treated as new and inserted. The rebuilt transform map lost its coalesce on `serial_number`.

## Resolution
1. Set **Coalesce = true** on the `u_serial_number → serial_number` field map.
2. Cleanup: for the 5 duplicated serials, kept the **newer** record's values (latest status and assignment) by copying them onto the **original** record (the original is referenced by existing tasks/history), then deleted the 5 duplicates created today (`sys_created_on` = today, created by the import user).
3. Re-ran the transform on the same import set → Inserts 0, Updates 5 (or *Ignored* where nothing changed).
4. Verified: grouped by serial number, every count = 1; statuses match the update file.

## Prevention
- Keep coalesce documented in the transform map description; check it after any Mapping Assist change.
- Test imports with a **small file first** and check the insert/update counts before a full load.
- Coalesce on a unique, stable key (serial number). Asset tags can be reissued; names are not unique.
- Consider a **unique index** on serial number for hardware to block duplicates at the database level.
