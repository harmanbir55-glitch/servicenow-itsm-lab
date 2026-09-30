/**
 * Business Rule: Validate asset tag on catalog task
 * ------------------------------------------------------------
 * Table:     Catalog Task [sc_task]
 * When:      before     Insert: true   Update: true
 * Filter:    Asset tag [u_asset_tag] changes
 * Order:     100
 * Advanced:  true
 *
 * What it does
 *   Normalises the technician's entry to upper case, rejects anything that
 *   isn't in NorthPeak's format (NP-LT-00001), and warns if the tag doesn't
 *   exist in Hardware assets yet.
 *
 * Why "before"?
 *   Before rules change `current` before it's written, so no extra update()
 *   is needed and setAbortAction() can stop a bad save.
 *
 * When NOT to use a business rule
 *   - Hiding/showing or making fields mandatory on a form -> UI policy (client side)
 *   - Multi-step processes with approvals, waits or notifications -> Flow Designer
 *   - Controlling who can read/write data -> ACLs (BRs are not security)
 *   - Never call current.update() in a before/after rule on the same table:
 *     it re-triggers rules and can cause recursion.
 */
(function executeRule(current, previous /* null when async */) {

    var tag = (current.getValue('u_asset_tag') || '').trim().toUpperCase();
    if (!tag) {
        return; // field was cleared - allowed
    }

    if (!/^NP-LT-\d{5}$/.test(tag)) {
        gs.addErrorMessage('Asset tag "' + tag + '" is not valid. Use the format NP-LT-00001.');
        current.setAbortAction(true);
        return;
    }

    current.setValue('u_asset_tag', tag);

    var hw = new GlideRecord('alm_hardware');
    hw.addQuery('asset_tag', tag);
    hw.setLimit(1);
    hw.query();
    if (!hw.hasNext()) {
        gs.addInfoMessage('Asset tag ' + tag + ' was saved but is not in Hardware assets yet. Add the asset before closing the task.');
    }

})(current, previous);
