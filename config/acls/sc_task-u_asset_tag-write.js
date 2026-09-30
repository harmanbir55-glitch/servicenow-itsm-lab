/**
 * ACL: sc_task.u_asset_tag  (write)
 * ------------------------------------------------------------
 * Navigate: All > System Security > Access Control (ACL) > New
 *           (elevate to security_admin first: user menu > Elevate role)
 * Type:        record          Operation: write
 * Name:        Catalog Task [sc_task] . Asset tag [u_asset_tag]
 * Requires role: itil
 * Advanced:    true   (script below)
 *
 * Paired read ACL (no script): sc_task.u_asset_tag, read, requires role itil.
 *
 * Result: every fulfiller can SEE the asset tag, but only Hardware Fulfillment
 * (and admins) can CHANGE it.
 *
 * How ACLs are evaluated (field-level request on sc_task.u_asset_tag)
 *   1. Table (row) ACL must pass first, most specific match wins:
 *        sc_task  ->  task (parent)  ->  *  (wildcard)
 *   2. Then the field ACL, most specific first:
 *        sc_task.u_asset_tag -> task.u_asset_tag -> sc_task.* -> task.* -> *.u_asset_tag -> *.*
 *   3. Within the first matching name, the user needs to pass at least ONE ACL.
 *      To pass an ACL, the user must meet ALL of: required roles, condition, script.
 *   4. The admin role passes most ACLs automatically ("Admin overrides"),
 *      which is why you must TEST BY IMPERSONATING a non-admin user.
 */
answer = (function () {
    if (gs.hasRole('admin')) {
        return true;
    }
    return gs.getUser().isMemberOf('Hardware Fulfillment');
})();
