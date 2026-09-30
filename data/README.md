# Data files

| File | Rows | Loaded into | Used in |
|---|---|---|---|
| `users.csv` | 12 | `sys_user` (import set or manual) | Phase 0 – personas and manager hierarchy for approvals |
| `laptop-assets.csv` | 20 | `alm_hardware` via transform map **Laptop Assets → Hardware** | Phase 5 – import set with coalesce on `serial_number` |
| `laptop-assets-update.csv` | 5 | same transform map | Phase 5 / Scenario 6 – proves coalesce updates existing records instead of inserting duplicates |

The columns match the export format of my **AssetTrack** app (Node.js/Express/SQLite), so the same inventory can move from a custom app into ServiceNow Hardware Asset Management.

## Status mapping (AssetTrack → ServiceNow `install_status`)

| AssetTrack | ServiceNow |
|---|---|
| Assigned | 1 – In use |
| In Stock | 6 – In stock |
| Repair | 3 – In maintenance |
| Retired | 7 – Retired |

Implemented in [`config/transform-maps/laptop-assets-transform.js`](../config/transform-maps/laptop-assets-transform.js).

`zoe.turner` intentionally has **no manager and no company** – she's the test user for Scenarios 2 and 5.
