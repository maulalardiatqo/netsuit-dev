/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function formatDate(date) {
        const d = date.getDate();   
        const m = date.getMonth() + 1; 
        const y = date.getFullYear();  
        return `${d}/${m}/${y}`;
    }

    function getPreviousYear(date) {
        const prevYear = new Date(date); 
        prevYear.setFullYear(date.getFullYear() - 1);
        return formatDate(prevYear);
    }

    function searchData(itemId, customerId, date) {
        console.log('Original date:', date);
        const formattedDate = formatDate(date);
        console.log('Formatted date:', formattedDate);

        const oneYearBefore = getPreviousYear(date);
        console.log('One year before:', oneYearBefore);
        var itemfulfillmentSearchObj = search.create({
        type: "itemfulfillment",
        filters:
        [
            ["type","anyof","ItemShip"], 
            "AND", 
            ["cogs","is","F"], 
            "AND", 
            ["taxline","is","F"], 
            "AND", 
            ["mainline","is","F"], 
            "AND", 
            ["trandate","within",oneYearBefore,formattedDate], 
            "AND", 
            ["item","anyof",itemId], 
            "AND", 
            ["customer.internalid","anyof",customerId]
        ],
        columns:
        [
            search.createColumn({
                name: "quantity",
                summary: "SUM",
                label: "Quantity"
            })
        ]
        });
        var qtyToSet = 0
        var searchResultCount = itemfulfillmentSearchObj.runPaged().count;
        log.debug("itemfulfillmentSearchObj result count",searchResultCount);
        itemfulfillmentSearchObj.run().each(function(result){
            var qty = result.getValue({
                name: "quantity",
                summary: "SUM",
            })
            qtyToSet = Number(qty) / 12
        return true;
        });
        return qtyToSet
    }
    function pageInit(context) {
        console.log('init masuk')
    }
    function fieldChanged(context){
        var sublistFieldName = context.fieldId;
        var sublistName = context.sublistId;
        var cekCustomForm = records.getValue('customform');
        var date = records.getValue('trandate');
        if(cekCustomForm == '138'){
            if (sublistName == 'item'){
                if(sublistFieldName == 'custcol_abj_customer_line'){
                    var itemId = records.getCurrentSublistValue({
                        sublistId : "item",
                        fieldId : "item"
                    });
                    var customerId = records.getCurrentSublistValue({
                        sublistId : "item",
                        fieldId : "custcol_abj_customer_line"
                    });
                    if(itemId && customerId){
                        console.log('dataSearch', {itemId : itemId, customerId : customerId})
                        var avgBusdev = searchData(itemId, customerId, date)
                        records.setCurrentSublistValue({
                            sublistId : "item",
                            fieldId : "custcol10",
                            value : avgBusdev
                        })
                    }
                }
            }
        }
        
    }
    return {
        pageInit: pageInit,
        fieldChanged : fieldChanged,
    };
});