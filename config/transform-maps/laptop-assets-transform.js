/**
 * Transform Map: Laptop Assets -> Hardware
 * ------------------------------------------------------------
 * Source table:  u_imp_laptop_assets   (created by the import set load)
 * Target table:  Hardware [alm_hardware]
 * Navigate:      All > System Import Sets > Load Data  (then "Create transform map")
 *
 * Field maps
 * | Source field            | Target field          | Coalesce | Notes                                   |
 * |-------------------------|-----------------------|----------|-----------------------------------------|
 * | u_serial_number         | serial_number         | TRUE     | the unique key - prevents duplicates     |
 * | u_asset_tag             | asset_tag             |          |                                         |
 * | u_model (source script) | model                 |          | SCRIPT 1 below                          |
 * | u_status (source script)| install_status        |          | SCRIPT 2 below                          |
 * | u_assigned_to           | assigned_to           |          | Referenced value field name: user_name  |
 * | u_location              | location              |          | Referenced value field name: name       |
 * | u_purchase_date         | purchase_date         |          | Date format: yyyy-MM-dd                 |
 * | u_warranty_expiration   | warranty_expiration   |          | Date format: yyyy-MM-dd                 |
 * | u_cost                  | cost                  |          |                                         |
 *
 * For reference fields set "Choice action" = ignore, so a typo in the CSV
 * doesn't silently create a junk user or location.
 */


// ------------------------------------------------------------------
// SCRIPT 1 - Field map "Use source script" -> target field: model
// Finds the hardware model by manufacturer + name; creates it if missing.
// ------------------------------------------------------------------
answer = (function transformEntry(source) {
    var modelName = source.getValue('u_model');
    var mfrName   = source.getValue('u_manufacturer');
    if (!modelName) {
        return '';
    }

    var mfr = new GlideRecord('core_company');
    if (!mfr.get('name', mfrName)) {
        mfr.initialize();
        mfr.setValue('name', mfrName);
        mfr.setValue('manufacturer', true);
        mfr.insert();
    }

    var model = new GlideRecord('cmdb_hardware_product_model');
    model.addQuery('name', modelName);
    model.addQuery('manufacturer', mfr.getUniqueValue());
    model.setLimit(1);
    model.query();
    if (model.next()) {
        return model.getUniqueValue();
    }

    model.initialize();
    model.setValue('name', modelName);
    model.setValue('manufacturer', mfr.getUniqueValue());
    return model.insert();
})(source);


// ------------------------------------------------------------------
// SCRIPT 2 - Field map "Use source script" -> target field: install_status
// Maps AssetTrack statuses to ServiceNow choice values.
// ------------------------------------------------------------------
answer = (function transformEntry(source) {
    var map = {
        'assigned': '1',   // In use
        'in stock': '6',   // In stock
        'repair':   '3',   // In maintenance
        'retired':  '7'    // Retired
    };
    var key = (source.getValue('u_status') || '').toLowerCase().trim();
    return map[key] || '6';
})(source);


// ------------------------------------------------------------------
// SCRIPT 3 - Transform script, When: onBefore
// Skips rows without a serial number (they can't be coalesced safely).
// ------------------------------------------------------------------
(function runTransformScript(source, map, log, target /* undefined onStart */) {
    if (!source.getValue('u_serial_number')) {
        ignore = true;
        log.warn('Skipped row with asset tag ' + source.getValue('u_asset_tag') + ': no serial number.');
    }
})(source, map, log, target);
