/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime'], function (serverWidget, task, search, log, record, message, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            let currentUser = runtime.getCurrentUser();
            // let subsidiaryId = currentUser.subsidiary;
            // log.debug('subsidiaryId', subsidiaryId)

            var form = serverWidget.createForm({
                title: 'Packing List'
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var valueRedord = form.addFieldGroup({
                id: "valueRedord",
                label: "Record",
            });
           
            var customerField = form.addField({
                id: 'custpage_customer', 
                type: serverWidget.FieldType.SELECT,
                label: 'Customer',
                container: "filteroption",
                source: 'customer'
            });
            var area = form.addField({
                id: 'custpage_area', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Area',
                source: 'customlist_rda_are_so'
            });
            var subArea = form.addField({
                id: 'custpage_sub_area', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Sub Area',
            });
            var salesMan = form.addField({
                id: 'custpage_sales', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Sales Rep',
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
            var nopolList = form.addField({
                id: 'custpage_nopol', 
                type: serverWidget.FieldType.SELECT,
                container: "valueRedord",
                label: 'Nopol'
            });
            nopolList.isMandatory = true
           
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
            var armadaId = form.addField({
                id: 'custpage_armada_id', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Armada'
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            var orderNumber = form.addField({
                id: 'custpage_order_number', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Select Order Number',
                source: 'salesorder'
            });
            var date_field = form.addField({
                id: 'custpage_date', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date'
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
            var formatedDateConv = formatDate(currDate);
            log.debug('formatedDateConv', formatedDateConv)
            if(formatedDateConv){
                var accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters:
                    [
                        ["periodname","is",formatedDateConv]
                    ],
                    columns:
                    [
                        search.createColumn({name: "internalid", label: "Internal ID"})
                    ]
                });
                var searchResults = accountingperiodSearchObj.run().getRange({ start: 0, end: 1 });
                if (searchResults.length > 0) {
                    var accountingperiodId = searchResults[0].getValue("internalid");
                    log.debug('accountingperiodId', accountingperiodId)
                    accountingPeriod.defaultValue = accountingperiodId;
                }
            }
            var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
                source: 'subsidiary'
            });
            subsidiary.isMandatory = true;
            var nameGudang = ''
            var subsidiaryId = 7
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
                subsidiary.defaultValue = subsidiaryId
            }
            var supir = form.addField({
                id: 'custpage_supir', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Supir'
            });
            var helper = form.addField({
                id: 'custpage_helper', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Helper'
            });
            var gudang = form.addField({
                id: 'custpage_gudang', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Gudang'
            });
            if(nameGudang){
                gudang.defaultValue = nameGudang
            }
           
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Orders'
            });
            sublist
            .addField({
                id: "custpage_sublist_item_select",
                label: "Fulfill",
                type: serverWidget.FieldType.CHECKBOX,
            })
            .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
            });
            sublist.addField({
                id: 'custpage_sublist_transaction_type',
                label: 'transaction type',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_no_so',
                label: 'No Sales Order',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_no_fulfill',
                label: 'No Fulfillment',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_date',
                label: 'Date',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_customer',
                label: 'Customer Project Name',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_memo',
                label: 'Memo',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_curr',
                label: 'Currency',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_subsidiary',
                label: 'Subsidiari',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_idcus',
                label: 'Cusid',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_perid',
                label: 'perrid',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_idfulfill',
                label: 'idful',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_area',
                label: 'area',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
            });
            sublist.addField({
                id: 'custpage_sublist_sub_area',
                label: 'subarea',
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
            form.clientScriptModulePath = "SuiteScripts/abj_cs_page_packing_list.js";
            context.response.writePage(form);
        }else{
            function convertToDate(dateString) {
                var dateParts = dateString.split('/');
                return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
            }
            function formatFulfillmentText(fulfillText) {
                return fulfillText.map(number => `${number}`).join(', ');
            }
            try{
                var supir = context.request.parameters.custpage_supir;
                var helper = context.request.parameters.custpage_helper;
                var armada = context.request.parameters.custpage_armada_id;
                var nopol = context.request.parameters.custpage_nopol;
                var salesRep = context.request.parameters.custpage_sales;
                var subAreaId = context.request.parameters.custpage_sub_area;
                var lineCount = context.request.getLineCount({
                    group: 'custpage_sublist'
                });
                log.debug('Line Count', lineCount);
                
                if(lineCount > 0){
                    var allIdFul = []
                    var fulfillText = []
                    var dateSet
                    var postingSet
                    var subsSet
                    var memoSet
                    var areaSet
                    var subAreaSet
                    var isCreate = false
                    for (var i = 0; i < lineCount; i++) {
                        var fulfill = context.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_sublist_item_select',
                            line: i
                        });
                        log.debug('fulfill', fulfill)
                        if(fulfill == 'T'){
                            log.debug('masuk fulfill true', fulfill)
                            isCreate = true
                            var noFulfill = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_no_fulfill',
                                line: i
                            });
                            if(noFulfill){
                                fulfillText.push(noFulfill)
                            }
                            var date = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_date',
                                line: i
                            });
                            if(date){
                                dateSet = date
                            }
                    
                            var memo = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_memo',
                                line: i
                            });
                            if(memo){
                                memoSet = memo
                            }
                            var idSubs = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_subsidiary',
                                line: i
                            });
                            if(idSubs){
                                subsSet = idSubs
                            }
                            var idPer = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_perid',
                                line: i
                            });
                            if(idPer){
                                postingSet = idPer
                            }
                            var idFul = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_idfulfill',
                                line: i
                            });
                            if(idFul){
                                allIdFul.push(idFul)
                            }
                            var area = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_area',
                                line: i
                            });
                            if(area){
                                areaSet = area
                            }
                            var subArea = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_sub_area',
                                line: i
                            });
                            if(subArea){
                                subAreaSet = subArea
                            }
                            
                        }
 
                    }
                    log.debug('isCreate', isCreate)
                    if(isCreate == true){
                        log.debug('masuk create');
                        log.debug('dateSet', dateSet)
                        var dateConvert = convertToDate(dateSet);
                        log.debug('dateConvert', dateConvert)
                        log.debug('allIdFul', allIdFul)
                        var createRec = record.create({
                            type: "customtransaction_rda_packing_list",
                        });
                        createRec.setValue({
                            fieldId: "trandate",
                            value: dateConvert,
                            ignoreFieldChange: true,
                        });
                        log.debug('postingSet', postingSet)
                        createRec.setValue({
                            fieldId: "postingperiod",
                            value: postingSet,
                            ignoreFieldChange: true,
                        }); 
                        log.debug('subsSet', subsSet)
                        createRec.setValue({
                            fieldId: "subsidiary",
                            value: subsSet,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_kendaraan",
                            value: armada || '',
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_nopol",
                            value: nopol || '',
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_supir",
                            value: supir || '',
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_rit",
                            value: helper || '',
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_do_number",
                            value: allIdFul,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_area",
                            value: areaSet,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_rda_packlist_subarea",
                            value: subAreaId || '',
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_from_script",
                            value: true,
                            ignoreFieldChange: true,
                        });
                        
                        var formatFulfill = formatFulfillmentText(fulfillText)
                        log.debug('formatFulfill', formatFulfill)
                        createRec.setValue({
                            fieldId: "custbody_rda_do_number_text",
                            value: formatFulfill,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "memo",
                            value: memoSet || '',
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
                                    'style="text-decoration:none; color:rgb(0, 106, 255); font-weight:bold;">Go to Packing List</a>';
                        
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
                        else{
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