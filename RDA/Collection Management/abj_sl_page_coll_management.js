/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime'], function (serverWidget, task, search, log, record, message, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
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
            kolektor.addSelectOption({
                value: '', 
                text: '-Select-'
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

            // search sales rep
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                [
                    ["salesrep","is","T"]
                ],
                columns:
                [
                    search.createColumn({name: "entityid", label: "Name"}),
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count",searchResultCount);
            employeeSearchObj.run().each(function(result){
                var nameSales = result.getValue({
                    name: "entityid"
                });
                var idEmp = result.getValue({
                    name: "internalid"
                });
                salesMan.addSelectOption({
                    value: idEmp, 
                    text: nameSales 
                });
                kolektor.addSelectOption({
                    value: idEmp, 
                    text: nameSales 
                })
                return true;
            });
            var date_field_from = form.addField({
                id: 'custpage_date_from', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Due Date From'
            });
            var date_field_to = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Due Date To'
            });

            var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
                source: 'subsidiary'
            });
            subsidiary.isMandatory = true


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
                                allIdInv.add(context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_id_inv',
                                    line: i
                                }));
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
                                reasonSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_reason',
                                    line: i
                                }) || reasonSet;
                                actionPlanSet = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_action',
                                    line: i
                                }) || actionPlanSet;
                            }
                        }
                    }
        
                    if (isCreate) {
                        const dateConvert = convertToDate(dateSet);
                        const createRec = record.create({ type: "customtransaction_rda_collection_mgm" });
                        createRec.setValue({ fieldId: "trandate", value: dateConvert, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "currency", value: currSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "exchangerate", value: excSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "class", value: divisionSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "subsidiary", value: subsSet, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "custbody_rda_kolektor", value: kolektorSelect, ignoreFieldChange: true });
                        createRec.setValue({ fieldId: "custbody_rda_invoice_number", value: [...allIdInv], ignoreFieldChange: true });
                        
                        const saveCreate = createRec.save();
                        if (saveCreate) {
                            function removeDuplicates(array) {
                                return [...new Set(array)];
                            }
                            const uniqueAllIdInv = removeDuplicates(allIdInv);
                            uniqueAllIdInv.forEach(id => {
                                const recInv = record.load({ type: "invoice", id, isDynamic: true });
                                const cekNumber = recInv.getValue("custbody_rda_sjp_count");
                                recInv.setValue({
                                    fieldId: "custbody_rda_sjp_count",
                                    value: cekNumber ? Number(cekNumber) + 1 : 1,
                                    ignoreFieldChange: true
                                });
                                log.debug('reasonSet', reasonSet)
                                if(reasonSet){
                                    recInv.setValue({
                                        fieldId: "custbody_rda_reason",
                                        value: reasonSet,
                                        ignoreFieldChange: true
                                    });
                                }
                                log.debug('actionPlanSet', actionPlanSet)
                                recInv.setValue({
                                    fieldId: "custbody_rda_action_plan",
                                    value: actionPlanSet || '',
                                    ignoreFieldChange: true
                                });
                                recInv.save();
                            });
                            context.response.writePage(createSuccessPage(saveCreate));
                        }
                    } else {
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
            const html = `<html><body><h3>Success</h3>
                <input style="border: none; color: white; padding: 8px 30px; background-color: rgb(0, 106, 255);" 
                type="button" onclick="window.history.go(-1)" value="OK" />
                <br /><br /><a href="https://11069529.app.netsuite.com/app/accounting/transactions/custom.nl?id=${recordId}" 
                style="text-decoration:none; color:rgb(0, 106, 255); font-weight:bold;">Go to Collection Management Record</a>
                </body></html>`;
        
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