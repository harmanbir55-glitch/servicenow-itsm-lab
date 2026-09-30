/**
 * Email Script: npk_laptop_request_summary
 * ------------------------------------------------------------
 * Navigate: All > System Notification > Email > Notification Email Scripts > New
 * Use in any notification body with:   ${mail_script:npk_laptop_request_summary}
 *
 * Works for notifications on sc_req_item (current = the RITM) AND on
 * sysapproval_approver (current = the approval; the RITM is current.sysapproval).
 */
(function runMailScript(current, template, email, email_action, event) {

    var ritm = current;
    if (current.getTableName() === 'sysapproval_approver') {
        ritm = new GlideRecord('sc_req_item');
        if (!ritm.get(current.getValue('sysapproval'))) {
            return;
        }
    }

    var v = ritm.variables;
    var accessories = [];
    if (v.accessory_dock == 'true')    accessories.push('Docking station');
    if (v.accessory_monitor == 'true') accessories.push('Monitor');
    if (v.accessory_headset == 'true') accessories.push('Headset');

    var rows = [
        ['Request',              ritm.getValue('number')],
        ['Requested for',        v.requested_for.getDisplayValue()],
        ['Laptop model',         v.laptop_model.getDisplayValue()],
        ['Accessories',          accessories.length ? accessories.join(', ') : 'None'],
        ['Needed by',            v.needed_by.getDisplayValue()],
        ['Replacing a device',   v.replacing_device.getDisplayValue() +
                                 (v.replacing_device == 'yes' ? ' (' + v.existing_asset_tag + ')' : '')],
        ['Estimated cost',       ritm.getDisplayValue('price')],
        ['Business justification', v.business_justification.getDisplayValue()]
    ];

    template.print('<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">');
    for (var i = 0; i < rows.length; i++) {
        template.print('<tr><td style="padding:4px 12px 4px 0;color:#555"><b>' + rows[i][0] +
                       '</b></td><td style="padding:4px 0">' + GlideStringUtil.escapeHTML(String(rows[i][1] || '')) +
                       '</td></tr>');
    }
    template.print('</table>');

})(current, template, email, email_action, event);
