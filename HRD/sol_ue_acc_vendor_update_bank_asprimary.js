/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */
define(['N/search', 'N/record', 'N/redirect'], function (search, record, redirect) {

    function beforeLoad(context) {

    }

    function beforeSubmit(context) {
        if (context.type == "delete") return;

        if((context.type == "create" || context.type == "edit") && context.newRecord.getValue('custbody_sol_si_ref')){
            var billFil = [
                ["entity","anyof",context.newRecord.getValue("entity")],"AND",
                ["custbody_sol_si_ref","is",context.newRecord.getValue('custbody_sol_si_ref')],"AND",
                ["mainline","is",true]
            ];
            if(context.newRecord.id){
                billFil.push("AND",["internalid","noneof",context.newRecord.id]);
            }
            var vendBillSearch = search.create({
                type:search.Type.VENDOR_BILL,
                columns:['internalid'],
                filters:billFil
            }).run().getRange(0,10);

            //throw the error if duplicate record found with vendor and custbody_sol_si_ref
            if(vendBillSearch.length > 0){
                throw{
                    name:"DUPLICATE_BILL_FOUND",
                    message:"Duplicate bill found with same VENDOR and SUPPLIER INVOICE #"+context.newRecord.getValue('custbody_sol_si_ref')
                }
            }
        }

        var payFileFormatId = context.newRecord.getValue('custbody_sol_payment_format');

        var billMainFil = [
            ["type", "anyof", "VendBill"],
            "AND",
            ["custbody_sol_payment_format", "noneof", "@NONE@"],
            "AND",
            ["status", "anyof", "VendBill:A"],
            "AND",
            ["custcol_15529_eft_enabled", "is", "T"],
            "AND",
            ["mainline", "is", "T"],
            "AND",
            ["vendor.internalid", "anyof", context.newRecord.getValue('entity')]
        ];

        if (context.type == "edit") {
            billMainFil.push("AND", ["internalid", "noneof", context.newRecord.id]);
        }

        var billSearch = search.create({
            type: "vendorbill",
            filters: billMainFil,
            columns: [
                search.createColumn({
                    name: "tranid",
                    label: "Document Number"
                }),
                search.createColumn({
                    name: "custbody_sol_payment_format",
                    label: "Payment file Format "
                })
            ]
        }).run().getRange(0, 10);
 
            var fileFormat = context.newRecord.getValue('custbody_sol_payment_format');
            if(fileFormat){
                if (billSearch.length > 0 && billSearch[0].getValue('custbody_sol_payment_format') != payFileFormatId) {
                    throw {
                        name: "BILL_EXIST_WITH_PAYMENT_FILE_FORMAT",
                        message: "Open bills are existed with payment file format."
                    }
                } 
            }else{
                log.debug('File Format Kosong');
            }
            
    }

    function afterSubmit(context) {
        try {
            if (context.type == "edit" || context.type == "create") {
                var PFA = context.newRecord.getValue('custbody_sol_payment_format');
                if(PFA){
                    redirect.toSuitelet({
                        scriptId: 'customscript_sol_su_acc_bank_asprimary',
                        deploymentId: 'customdeploy_sol_su_acc_bank_asprimary',
                        parameters: {
                            'custom_vendbillid': context.newRecord.id
                        }
                    });
                }
            }
        } catch (ex) {
            log.error(ex.name, ex);
        }
    }

    return {
        // beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});