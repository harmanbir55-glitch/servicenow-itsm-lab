/**
 * Catalog Client Script: Validate "Needed by" date
 * ------------------------------------------------------------
 * Table:        Catalog Client Scripts (catalog_script_client)
 * Applies to:   A Catalog Item -> New Laptop Request
 * Type:         onChange      Variable name: needed_by
 * UI Type:      All (tested in Service Portal and Platform UI)
 * Applies on:   Catalog Item view (Requested Items / Catalog Tasks unticked)
 * Isolate script: true (default)
 *
 * Why a client script and not a UI policy?
 *   A UI policy can only show/hide, make mandatory/read-only, or set values
 *   based on conditions. Comparing a date against *today* and showing a
 *   custom message is logic, so it needs a script. Rule of thumb:
 *   "Use a UI policy when you can; use a client script when you must."
 */
function onChange(control, oldValue, newValue, isLoading) {
    if (isLoading || newValue === '') {
        return;
    }

    g_form.hideFieldMsg('needed_by', true);

    // getDateFromFormat() and g_user_date_format are provided by the platform,
    // so this respects each user's date-format preference (e.g. dd-MM-yyyy).
    var pickedMs = getDateFromFormat(newValue, g_user_date_format);
    if (!pickedMs) {
        g_form.showFieldMsg('needed_by', 'Please pick a valid date.', 'error');
        return;
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickedMs < today.getTime()) {
        g_form.clearValue('needed_by');
        g_form.showFieldMsg('needed_by', 'The "Needed by" date can\'t be in the past.', 'error');
        return;
    }

    // Friendly warning: standard fulfillment target is 5 business days (~7 calendar days).
    var sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (pickedMs - today.getTime() < sevenDaysMs) {
        g_form.showFieldMsg('needed_by',
            'Standard delivery is 5 business days. Add the reason for urgency in Business justification.',
            'info');
    }
}
