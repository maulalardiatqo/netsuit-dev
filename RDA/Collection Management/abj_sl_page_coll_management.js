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
                return true;
            });
           

            
            var date_field = form.addField({
                id: 'custpage_date', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Due Date'
            });
            function getCurrentDateUTC() {
                const now = new Date();
                const year = now.getUTCFullYear();
                const month = now.getUTCMonth();
                const date = now.getUTCDate();
                const hours = now.getUTCHours();
                const minutes = now.getUTCMinutes();
                const seconds = now.getUTCSeconds();
                const milliseconds = now.getUTCMilliseconds();
            
                return new Date(Date.UTC(year, month, date, hours, minutes, seconds, milliseconds));
            }
            var currDate = getCurrentDateUTC();
            function formatDate(dateString) {
                const options = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', options);
            }
            log.debug('currDate', currDate)
            date_field.defaultValue = currDate;

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
                type: serverWidget.FieldType.SELECT
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
        }else{
            try{
                function convertToDate(dateString) {
                    var dateParts = dateString.split('/');
                    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
                }

                var kolektorSelect = context.request.parameters.custpage_kolektor;
                var salesSelect = context.request.parameters.custpage_sales;
                var subsidiarySelect = context.request.parameters.custpage_subsidiary;
                var dateSelect = context.request.parameters.custpage_date;
                var lineCount = context.request.getLineCount({
                    group: 'custpage_sublist'
                });
                log.debug('Line Count', lineCount);
                
                if(lineCount > 0){
                    var allIdInv = []
                    var subsSet
                    var dateSet
                    var divisionSet
                    var currSet
                    var excSet
                    var isCreate = false
                    for (var i = 0; i < lineCount; i++) {
                        var fulfill = context.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_sublist_item_select',
                            line: i
                        });
                        log.debug('fulfill', fulfill)
                        if(fulfill == 'T'){
                            var subsId = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_subsidiary_id',
                                line: i
                            });
                            log.debug('subsId', subsId)
                            if(subsId){
                                isCreate = true
                                subsSet = subsId
                                var idInv = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_id_inv',
                                    line: i
                                });
                                if(idInv){
                                    allIdInv.push(idInv);
                                }
                                
                                var date = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_date',
                                    line: i
                                });
                                if(date){
                                    dateSet = date
                                }
    
                                var divi = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_division',
                                    line: i
                                });
                                if(divi){
                                    divisionSet = divi
                                }
    
                                var curren = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_currency_id',
                                    line: i
                                });
                                if(curren){
                                    currSet = curren
                                }
                                var exc = context.request.getSublistValue({
                                    group: 'custpage_sublist',
                                    name: 'custpage_sublist_exc_rate',
                                    line: i
                                });
                                if(exc){
                                    excSet = exc
                                }
                            }
                        }
                    }
                    log.debug('isCreate', isCreate)
                    if(isCreate == true){
                        log.debug('masuk create')
                        var dateConvert = convertToDate(dateSet);
                        log.debug('dateConvert', dateConvert)
                        var createRec = record.create({
                            type: "customtransaction_rda_collection_mgm",
                        });
                        createRec.setValue({
                            fieldId: "trandate",
                            value: dateConvert,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "currency",
                            value: currSet,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "exchangerate",
                            value: excSet,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "class",
                            value: divisionSet,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "subsidiary",
                            value: subsSet,
                            ignoreFieldChange: true,
                        });
                        log.debug('allIdInv', allIdInv)
                        createRec.setValue({
                            fieldId: "custbody_rda_invoice_number",
                            value: allIdInv,
                            ignoreFieldChange: true,
                        });
                        var saveCreate = createRec.save();
                        log.debug('saveCreate', saveCreate)
                        if(saveCreate){
                            var html = "<html><body>";
                            html += "<h3>Success</h3>";
                        
                            html += '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" ' +
                                    'type="button" onclick="window.history.go(-1)" value="OK" />';
                        
                            html += '<br /><br /><a href="https://11069529.app.netsuite.com/app/accounting/transactions/custom.nl?id=' + saveCreate + '" ' +
                                    'style="text-decoration:none; color:rgb(0, 106, 255); font-weight:bold;">Go to Collection Management Record</a>';
                        
                            html += "</body></html>";
                        
                            var form = serverWidget.createForm({
                                title: "Success Create Packing List",
                            });
                        
                            form.addPageInitMessage({
                                type: message.Type.CONFIRMATION,
                                title: "Success!",
                                message: html,
                            });
                        
                            context.response.writePage(form);
                        }
                    }else{
                        var html = "<html><body>";
                        html += "<h3>Gagal Menyimpan</h3>";
                        html +=
                            '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                            html += "</body></html>";
                    
                            var form = serverWidget.createForm({
                            title: "Gagal Menyimpan",
                            });
                        form.addPageInitMessage({
                                    type: message.Type.WARNING,
                                    title: "Success!",
                                    message: html,
                                });
                        context.response.writePage(form);
                    }
                }else{
                    var html = "<html><body>";
                    html += "<h3>No data Found</h3>";
                    html +=
                        '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                        html += "</body></html>";
                
                        var form = serverWidget.createForm({
                        title: "No data Found",
                        });
                    form.addPageInitMessage({
                                type: message.Type.WARNING,
                                title: "Warning!",
                                message: html,
                            });
                    context.response.writePage(form);
                }
                
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return {
        onRequest: onRequest
    };
});