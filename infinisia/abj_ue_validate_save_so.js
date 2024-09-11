/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search", "N/config"], function(
    record,
    search,
    config
) {
    function afterSubmit(context) {
        try {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var idSO = newRecord.id;
                 var rec = context.newRecord;
                var recNew = record.load({
                    type: rec.type,
                    id: rec.id,
                    isDynamic: false
                })
                log.debug('idSo', idSO);
                var cekAtt = newRecord.getValue('custbody_abj_file_attach');
                log.debug('cekAtt', cekAtt)
                if (idSO) {
                    var isHaveFile;
                    var salesorderSearchObj = search.create({
                        type: "salesorder",
                        filters: [
                            ["type", "anyof", "SalesOrd"],
                            "AND",
                            ["mainline", "is", "T"],
                            "AND",
                            ["internalid", "anyof", idSO]
                        ],
                        columns: [
                            search.createColumn({ name: "tranid", label: "Document Number" }),
                            search.createColumn({
                                name: "formulatext",
                                formula: "case when {file.internalid} is Null then '0' Else '1' End",
                                label: "is have file"
                            })
                        ]
                    });
                    var searchResult = salesorderSearchObj.run().getRange({ start: 0, end: 1 });
                    if (searchResult.length > 0) {
                        var file = searchResult[0].getValue({
                            name: "formulatext",
                            formula: "case when {file.internalid} is Null then '0' Else '1' End"
                        });
                        if (file) {
                            isHaveFile = file;
                        }
                    }
                    if (isHaveFile == '0') {
                        recNew.setValue({
                            fieldId: "custbody_abj_file_attach",
                            value : false,
                            ignoreFieldChange: true,
                        })
                    }else{
                        recNew.setValue({
                            fieldId: "custbody_abj_file_attach",
                            value : true,
                            ignoreFieldChange: true,
                        })
                    }
                    var saveSo = recNew.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveSo', saveSo)
                }
            }
        } catch (e) {
            log.debug('error', e);
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
