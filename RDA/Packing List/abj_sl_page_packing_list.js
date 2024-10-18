/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message'], function (serverWidget, task, search, log, record, message) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Packing List'
            });
            var valueRedord = form.addFieldGroup({
                id: "valueRedord",
                label: "Record",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
           
            var currentRecord = createSublist("custpage_sublist_item", form);
            var customerField = form.addField({
                id: 'custpage_customer', 
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                container: "filteroption",
                source: 'customer'
            });
            var nopolList = form.addField({
                id: 'custpage_nopol', 
                type: serverWidget.FieldType.SELECT,
                container: "valueRedord",
                label: 'Nopol'
            });
            nopolList.addSelectOption({
                value: '', 
                text: '-Select-'
            });
            var allAsset = []
            var customrecord_ncfar_assetSearchObj = search.create({
                type: "customrecord_ncfar_asset",
                filters:
                [
                ],
                columns:
                [
                    search.createColumn({name: "custrecord_rda_nopol_", label: "NOPOL"}),
                    search.createColumn({name: "altname", label: "Name"})
                ]
            });
            var searchResultCount = customrecord_ncfar_assetSearchObj.runPaged().count;
            log.debug("customrecord_ncfar_assetSearchObj result count",searchResultCount);
            customrecord_ncfar_assetSearchObj.run().each(function(result){
                var nopol = result.getValue({
                    name: "custrecord_rda_nopol_"
                });
                allAsset.push(nopol)
                return true;
            });
            
            allAsset.forEach(data =>{
                nopolList.addSelectOption({
                    value: data,
                    text: data
                });
            })
            var accountingPeriod = form.addField({
                id: 'custpage_accperiod', 
                type: serverWidget.FieldType.SELECT,
                label: 'Accounting Period',
                container: "filteroption",
                source: 'accountingperiod'
            });
            var armada = form.addField({
                id: 'custpage_armada', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Armada'
            });
            var date_field = form.addField({
                id: 'custpage_date', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date'
            });
            var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
                source: 'subsidiary'
            });
            var supir = form.addField({
                id: 'custpage_supir', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Supir'
            });
            var gudang = form.addField({
                id: 'custpage_gudang', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Gudang'
            });
            var orderNumber = form.addField({
                id: 'custpage_order_number', 
                type: serverWidget.FieldType.TEXT,
                container: "filteroption",
                label: 'Select Order Number'
            });
            form.addSubmitButton({
                label: 'Submit'
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_page_packing_list.js";
            context.response.writePage(form);
        }else{

        }
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Orders",
            tab: "matchedtab",
        });
        sublist_in.addMarkAllButtons();
    
        sublist_in.addField({
            id: "custpage_sublist_item_select",
            label: "Fulfill",
            type: serverWidget.FieldType.CHECKBOX,
        });
    
        sublist_in.addField({
            id: "custpage_sublist_process",
            label: "Process",
            type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
            id: "custpage_sublist_transaction_type",
            label: "Transaction Type",
            type: serverWidget.FieldType.TEXT,
        });
    
        sublist_in.addField({
            id: "custpage_sublist_no_so",
            label: "No Sales Order",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist_in;
    }
    
    return {
        onRequest: onRequest
    };
});