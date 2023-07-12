/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(['N/runtime', 'N/log', 'N/record', 'N/search', 'N/error'], (runtime, log, record, search, error) => {

    function afterSubmit(scriptContext) {
        if (scriptContext.type === scriptContext.UserEventType.CREATE) {
        // let rec = scriptContext.newRecord;
        let rec = record.load({
            type: scriptContext.newRecord.type,
            id: scriptContext.newRecord.id,
        });
        log.debug("id", rec.id);
        if (rec.id) {
            var vendBillSearch = search.load({
            id: 'customsearch_vendor_bill_po_data'
            });
            vendBillSearch.filters.push(
            search.createFilter({
                name: "internalid",
                operator: search.Operator.IS,
                values: rec.id,
            })
            );
            var vendBillSearchSet = vendBillSearch.run();
            var vendBillSearch = vendBillSearchSet.getRange(0, 100);
            log.debug("vendBillSearch", vendBillSearch);
            if (vendBillSearch.length > 0) {
            log.debug("bill from PO", true);
            rec.setValue({
                fieldId: "custbody_has_po_interco",
                value: true,
                ignoreFieldChange: true
            })
            } else {
            log.debug("bill from PO", false);
            rec.setValue({
                fieldId: "custbody_has_po_interco",
                value: false,
                ignoreFieldChange: true
            })
            }
            rec.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
            });
        }
        }
    }

return {
    afterSubmit: afterSubmit,
};
});