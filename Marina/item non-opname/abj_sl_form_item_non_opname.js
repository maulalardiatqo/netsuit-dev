/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime', 'N/format', 'N/config', 'N/query'], function (serverWidget, task, search, log, record, message, runtime, format, config, query) {
    function formatDate(inputDate) {
        if (!inputDate) return '';
        const parts = inputDate.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return inputDate; // fallback
    }
    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Item Non-Opname'
            });
            form.addSubmitButton({
                label: 'Generate'
            });
            form.addButton({ id: 'custpage_excel', label: 'List Excel Preview', functionName: 'generateExcel' });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var date_field_from = form.addField({
                id: 'custpage_date_from', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'From'
            });
            date_field_from.isMandatory = true
            var date_field_to = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'To'
            });
            date_field_to.isMandatory = true
            var location = form.addField({
                id: 'custpage_location', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Location',
                source: 'location'
            });
            location.isMandatory = true

            var bin = form.addField({
                id: 'custpage_bins', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Bins',
                source: 'bin'
            });
            context.response.writePage(form);
        } else {
            try {
                var locationId = context.request.parameters.custpage_location;
                var dateTo = context.request.parameters.custpage_date_to;
                var dateFrom = context.request.parameters.custpage_date_from;
                var binId = context.request.parameters.custpage_bins;
                log.debug('dataFilter', {
                    'locationId': locationId,
                    'dateTo': dateTo,
                    'dateFrom': dateFrom,
                    'binId': binId
                });
                var formattedDateFrom = formatDate(dateFrom);
                var formattedDateTo = formatDate(dateTo);

            //     const suiteql = `
            //     SELECT i.id AS itemid, ib.quantityonhand, i.usebins
            //     FROM item i
            //     JOIN inventorybalance ib ON ib.item = i.id
            //     WHERE i.itemtype IN ('InvtPart', 'Assembly')
            //     AND i.isinactive = 'F'
            //     AND ib.location = ${locationId}
            //     AND ib.quantityonhand > 0
            //     AND i.id NOT IN (
            //         SELECT DISTINCT t.item
            //         FROM transactionline t
            //         JOIN transaction tr ON t.transaction = tr.id
            //         WHERE tr.type = 'InvAdjst'
            //         AND t.location = ${locationId}
            //         AND tr.trandate BETWEEN TO_DATE('${formattedDateFrom}', 'YYYY-MM-DD') AND TO_DATE('${formattedDateTo}', 'YYYY-MM-DD')
            //         AND t.item IS NOT NULL
            //     )
            // `;
            
            // const resultSet = query.runSuiteQL({ query: suiteql });
            // const results = resultSet.asMappedResults();
            
            
            log.debug('items with qty', results.map(r => `Item ID: ${r.itemid}, Qty: ${r.quantityonhand}`));
            log.debug('result length', results.length);
            if(results.length > 0){
                const invAdj = record.create({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    isDynamic: true
                });
        
                invAdj.setValue({ fieldId: 'subsidiary', value: 1 }); 
                invAdj.setValue({ fieldId: 'account', value: 123 }); 
                invAdj.setValue({ fieldId: 'location', value: locationId });
        
                results.slice(0, 10).forEach(item => {
                    invAdj.selectNewLine({ sublistId: 'inventory' });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'item', value: item.itemid });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'location', value: locationId });
                    invAdj.setCurrentSublistValue({ sublistId: 'inventory', fieldId: 'adjustqtyby', value: -1 });
        
                    if (item.usebins === 'T') {
                        const inventoryDetail = invAdj.getCurrentSublistSubrecord({
                            sublistId: 'inventory',
                            fieldId: 'inventorydetail'
                        });
        
                        inventoryDetail.selectNewLine({ sublistId: 'inventoryassignment' });
                        inventoryDetail.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'binnumber',
                            value: 1 // <- Ganti sesuai bin yang valid
                        });
                        inventoryDetail.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: -1
                        });
                        inventoryDetail.commitLine({ sublistId: 'inventoryassignment' });
                    }
        
                    invAdj.commitLine({ sublistId: 'inventory' });
                });
        
                const invAdjId = invAdj.save();
            }

            }catch(e){
                log.debug('error', e)
            }
            const scriptObj = runtime.getCurrentScript();
            log.debug({ title: "Remaining usage units: ", details: scriptObj.getRemainingUsage() });
        }
    }
    return {
        onRequest: onRequest
    };
});