/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime', 'N/format', 'N/config'], function (serverWidget, task, search, log, record, message, runtime, format, config) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            let currentUser = runtime.getCurrentUser();
            let subsidiaryId = currentUser.subsidiary;
            log.debug('subsidiaryId', subsidiaryId)
            var form = serverWidget.createForm({
                title: 'Collection Management'
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var valueRedord = form.addFieldGroup({
                id: "valueRedord",
                label: "Record",
            });

            var kolektor = form.addField({
                id: 'custpage_kolektor', 
                type: serverWidget.FieldType.SELECT,
                container: "valueRedord",
                label: 'Kolektor'
            });
            
            
            var salesMan = form.addField({
                id: 'custpage_sales', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Salesman'
            });
            salesMan.addSelectOption({
                value: '', 
                text: '-Select-'
            });
            var customer = form.addField({
                id: 'custpage_customer', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Customer',
                source: 'customer'
            });
            // search sales rep
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                [
                    ["salesrep","is","T"]
                ],
                columns:
                [
                    search.createColumn({name: "altname", label: "Name"}),
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count",searchResultCount);
            employeeSearchObj.run().each(function(result){
                var nameSales = result.getValue({
                    name: "altname"
                });
                var idEmp = result.getValue({
                    name: "internalid"
                });
                salesMan.addSelectOption({
                    value: idEmp, 
                    text: nameSales 
                });
                return true;
            });
            kolektor.isMandatory = true
            // var date_field_from = form.addField({
            //     id: 'custpage_date_from', 
            //     type: serverWidget.FieldType.DATE,
            //     container: "filteroption",
            //     label: 'Due Date From'
            // });
            var date_field_to = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Due Date'
            });

            var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
            });
            subsidiary.isMandatory = true
            if(subsidiaryId){
                var subsidiarySearchObj = search.create({
                    type: "subsidiary",
                    filters: [
                        ["internalid", "anyof", subsidiaryId]
                    ],
                    columns: [
                        search.createColumn({name: "namenohierarchy", label: "Name (no hierarchy)"})
                    ]
                });
                 
                 // Ambil satu hasil saja
                var result = subsidiarySearchObj.run().getRange({start: 0, end: 1})[0];
                
                if (result) {
                    var nameG = result.getValue("namenohierarchy")
                    if(nameG){
                        nameGudang = 'InTransit Outbound - ' + nameG
                    }
                }
            }

            // create sublist
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Orders'
            });
            sublist
            .addField({
                id: "custpage_sublist_item_select",
                label: "Select",
                type: serverWidget.FieldType.CHECKBOX,
            })
            .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
            });
            sublist.addField({
                id: 'custpage_sublist_date',
                label: 'Date Due',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_type',
                label: 'Type',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_vendor',
                label: 'Vendor',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_vendor_id',
                label: 'Vendor_id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_refno',
                label: 'Ref No.',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_currency',
                label: 'Currency',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_currency_id',
                label: 'Currency',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_exc_rate',
                label: 'Exchange Rate',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_org_amt',
                label: 'Original Amount',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_amt_due',
                label: 'Amount Due',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_retur',
                label: 'Retur',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_sales',
                label: 'Salesman',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_sales_id',
                label: 'Salesman_id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_subsidiary',
                label: 'Subsidiary',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_subsidiary_id',
                label: 'Subsidiary_id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            })
            var reasonOption = sublist.addField({
                id: 'custpage_sublist_reason',
                label: 'Reason (Kenapa Belum Tertagih)',
                type: serverWidget.FieldType.SELECT,
                source : 'customlist_rda_reason_sjp'
            })
            sublist.addField({
                id: 'custpage_sublist_action',
                label: 'Action Plan',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_id_inv',
                label: 'Id Inv',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_division',
                label: 'division',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addButton({
                id: "markall",
                label: "Mark All",
                functionName: "markAll",
            });
            sublist.addButton({
                id: "unmarkall",
                label: "Unmark All",
                functionName: "unmarkAll",
            });
            form.addButton({ id: 'custpage_prev', label: 'Prev', functionName: 'prevPage' });
            form.addButton({ id: 'custpage_next', label: 'Next', functionName: 'nextPage' });
            var inlineHtml = form.addField({
                id: 'custpage_buttonhtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: "filteroption",
            });
            
            inlineHtml.defaultValue = `
                <button type="button" value="Search" onclick="onCustomButtonClick(); return false;" style="margin-top: 10px; padding:5px;">Search</button>
            `;
            form.addSubmitButton({
                label: 'Submit'
            });
            form.addResetButton({
                label: "Clear",
            });
            
            form.clientScriptModulePath = "SuiteScripts/abj_cs_coll_management.js";
            context.response.writePage(form);
        } else {
            try {
                function convertToDate(dateString) {
                    const [day, month, year] = dateString.split('/');
                    return new Date(year, month - 1, day); 
                }
        
                const kolektorSelect = context.request.parameters.custpage_kolektor;
                const salesSelect = context.request.parameters.custpage_sales;
                const subsidiarySelect = context.request.parameters.custpage_subsidiary;
                const dateSelect = context.request.parameters.custpage_date;
                const lineCount = context.request.getLineCount({ group: 'custpage_sublist' });
                log.debug('Line Count', lineCount);
        
                if (lineCount > 0) {
                    let allIdInv = new Set(), isCreate = false, subsSet, dateSet, divisionSet, currSet, excSet, reasonSet, actionPlanSet;
                    var dataLinetoSet = [];
                    
                    for (let i = 0; i < lineCount; i++) {
                        const fulfill = context.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_sublist_item_select',
                            line: i
                        });
                    
                        if (fulfill === 'T') {
                            const subsId = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_subsidiary_id',
                                line: i
                            });
                    
                            if (subsId) {
                                isCreate = true;
                                subsSet = subsId;
                                const idInv = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_id_inv',
                                    line: i
                                });
                                allIdInv.add(idInv);
                                
                                const reason = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_reason',
                                    line: i
                                });
                                const actionPlan = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_action',
                                    line: i
                                });
                                
                                dataLinetoSet.push({
                                    idInv,
                                    reason,
                                    actionPlan
                                });
                    
                                dateSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_date',
                                    line: i
                                }) || dateSet;
                                divisionSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_division',
                                    line: i
                                }) || divisionSet;
                                currSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_currency_id',
                                    line: i
                                }) || currSet;
                                excSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_exc_rate',
                                    line: i
                                }) || excSet;
                            }
                        }
                    }
                    
                    // Remove duplicates based on idInv
                    dataLinetoSet = dataLinetoSet.filter((value, index, self) =>
                        index === self.findIndex((t) => t.idInv === value.idInv)
                    );
                    log.debug('dataLinetoSet', dataLinetoSet)
                    
                    if (isCreate) {
                        function getCurrentUTC7() {
                            var now = new Date();
                    
                            // Dapatkan nilai UTC
                            var utcYear = now.getUTCFullYear();
                            var utcMonth = now.getUTCMonth(); // 0-indexed, Januari = 0
                            var utcDate = now.getUTCDate();
                            var utcHours = now.getUTCHours() + 7; // Tambahkan 7 jam untuk WIB
                    
                            // Jika penambahan jam menyebabkan perubahan hari
                            if (utcHours >= 24) {
                                utcHours -= 24;
                                utcDate += 1;
                            }
                    
                            return new Date(utcYear, utcMonth, utcDate, utcHours, now.getUTCMinutes(), now.getUTCSeconds());
                        }
                        var currentDate = getCurrentUTC7();
                        log.debug('currentDate', currentDate)
                        // currentDate.setHours(currentDate.getUTCHours() + 7);
                        // var formattedDate = format.parse({
                        //     value: currentDate,
                        //     type: format.Type.DATE
                        // });
                        // log.debug('formattedDate', formattedDate)
                        const dateConvert = convertToDate(dateSet);
                        const createRec = record.create({ type: "customtransaction_rda_collection_mgm" });
                        createRec.setValue({ fieldId: "trandate", value: currentDate, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "currency", value: currSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "exchangerate", value: excSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "class", value: divisionSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "subsidiary", value: subsSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "custbody_rda_kolektor", value: kolektorSelect, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "custbody_rda_invoice_number", value: [...allIdInv], ignoreFieldChange: true });
                    
                        for (let lineData of dataLinetoSet) {
                            createRec.insertLine({ sublistId: 'recmachcustrecord_transaction', line: 0 });
                            createRec.setSublistValue({
                                sublistId: 'recmachcustrecord_transaction',
                                fieldId: 'custrecord_invoice_number',
                                line: 0,
                                value: lineData.idInv
                            });
                            createRec.setSublistValue({
                                sublistId: 'recmachcustrecord_transaction',
                                fieldId: 'custrecord_rda_reason',
                                line: 0,
                                value: lineData.reason
                            });
                            createRec.setSublistValue({
                                sublistId: 'recmachcustrecord_transaction',
                                fieldId: 'custrecord_rda_action',
                                line: 0,
                                value: lineData.actionPlan
                            });
                        }
                    
                        const saveCreate = createRec.save();
                        log.debug('saveCreate', saveCreate)
                        if (saveCreate) {
                            context.response.writePage(createSuccessPage(saveCreate));
                        }
                    }else {
                        context.response.writePage(createErrorPage("Gagal Menyimpan"));
                    }
                } else {
                    context.response.writePage(createErrorPage("No data Found"));
                }
            } catch (e) {
                log.debug('error', e);
            }
            const scriptObj = runtime.getCurrentScript();
            log.debug({ title: "Remaining usage units: ", details: scriptObj.getRemainingUsage() });
        }
        
        function createSuccessPage(recordId) {
            var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            var accountId = companyInfo.getValue("companyid");
            if(accountId == '11069529_SB1'){
                log.debug('masuk replace url')
                accountId = '11069529-sb1'
            }
            log.debug('accountId', accountId);

            var html = "<html><body>";
            html += "<h3>Success</h3>";
            html += '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" ' +
                                    'type="button" onclick="window.history.go(-1)" value="OK" />';
            var url = 'https://' + accountId + '.app.netsuite.com';
            html += '<br /><br /><a href="'+ url +'/app/accounting/transactions/custom.nl?id=' + recordId + '" ' +
                    'style="text-decoration:none; color:rgb(0, 106, 255); font-weight:bold;">Go to Collection Management Record</a>';

            html += "</body></html>";
         
        
            const form = serverWidget.createForm({ title: "Success Create Collection Management" });
            form.addPageInitMessage({ type: message.Type.CONFIRMATION, title: "Success!", message: html });
            return form;
        }
        
        function createErrorPage(title) {
            const html = `<html><body><h3>${title}</h3>
                <input style="border: none; color: white; padding: 8px 30px; background-color: rgb(0, 106, 255);" 
                type="button" onclick="window.history.go(-1)" value="OK" /></body></html>`;
        
            const form = serverWidget.createForm({ title });
            form.addPageInitMessage({ type: message.Type.WARNING, title: "Warning!", message: html });
            return form;
        }
        
    }
    return {
        onRequest: onRequest
    };
});