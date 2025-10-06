/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime'], function (serverWidget, task, search, log, record, message, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            let currentUser = runtime.getCurrentUser();
            let subsidiaryId = currentUser.subsidiary;

            var form = serverWidget.createForm({
                title: 'DO List'
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
            var orderType = form.addField({
                id: 'custpage_order_type',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Order Type',
                container: 'filteroption' 
            });

            orderType.addSelectOption({
                value: '',
                text: ''
            });

            orderType.addSelectOption({
                value: '1',
                text: 'Sales Order'
            });

            orderType.addSelectOption({
                value: '2',
                text: 'Transfer Order'
            });
            var orderNumber = form.addField({
                id: 'custpage_order_number_so',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Order Number',
                container: 'filteroption',
                source : 'salesorder'
            });
             var orderNumber = form.addField({
                id: 'custpage_order_number_to',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Order Number',
                container: 'filteroption',
                source : 'transferorder'
            });

             var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
                source: 'subsidiary'
            });
            subsidiary.isMandatory = true;
            var date_from = form.addField({
                id: 'custpage_date_from', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date From'
            });
            date_from.isMandatory = true;
            var date_to = form.addField({
                id: 'custpage_date_to', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Date To'
            });
            date_to.isMandatory = true;
            var date_trandate = form.addField({
                id: 'custpage_date_trandate', 
                type: serverWidget.FieldType.DATE,
                container: "valueRedord",
                label: 'Ship Date'
            });
            date_trandate.isMandatory = true;
            var memo = form.addField({
                id: 'custpage_memo', 
                type: serverWidget.FieldType.TEXT,
                container: "valueRedord",
                label: 'Memo'
            });
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
                id: 'custpage_sublist_pack_carton',
                label: 'Pack Carton',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_pack_carton_id',
                label: 'packcarton_id',
                type: serverWidget.FieldType.TEXT
            }).updateDisplayType({
                displayType: serverWidget.FieldDisplayType.HIDDEN,
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
                id: 'custpage_sublist_idfulfill',
                label: 'idful',
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
            form.clientScriptModulePath = "SuiteScripts/abj_cs_page_do_list.js";
            context.response.writePage(form);
        }else{
            function convertDate(dateStr) {
                log.debug('DATE STRING', dateStr);
                const [d, m, y] = dateStr.split('/');

                // Buat Date object dengan urutan YYYY, MM - 1, DD
                const date = new Date(y, m - 1, d);

                log.debug('DATE', date);
            
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0'); 
                const year = date.getFullYear();
                // return `${day}/${month}/${year}`;
                return date;
            }
            try{
                var subsidiary = context.request.parameters.custpage_subsidiary;
                var shipDate = convertDate(context.request.parameters.custpage_date_trandate);
                var memo = context.request.parameters.custpage_memo
                // var shipDate = context.request.parameters.custpage_date_trandate;
                log.debug('shipDate', shipDate)
                var lineCount = context.request.getLineCount({
                    group: 'custpage_sublist'
                });
                log.debug('Line Count', lineCount);
                
                if(lineCount > 0){
                    var allIdFul = [];
                    var allBoxList = [];
                    var isCreate = false
                    for (var i = 0; i < lineCount; i++) {
                        var fulfill = context.request.getSublistValue({
                            group: 'custpage_sublist',
                            name: 'custpage_sublist_item_select',
                            line: i
                        });
                        log.debug('fulfill', fulfill)
                        if(fulfill == 'T'){
                            isCreate = true
                            var idFul = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_idfulfill',
                                line: i
                            });
                            var idCarton = context.request.getSublistValue({
                                group: 'custpage_sublist',
                                name: 'custpage_sublist_pack_carton_id',
                                line: i
                            });
                            if(idFul){
                                allIdFul.push(idFul)
                                allBoxList.push(idCarton)
                            }
                        }
                    }
                    if(isCreate == true){
                        var createRec = record.create({
                            type: "customtransaction_sos_packing_list",
                        });
                        createRec.setValue({
                            fieldId: "subsidiary",
                            value: subsidiary,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "custbody_do_list",
                            value: allIdFul,
                            ignoreFieldChange: true,
                        });
                         createRec.setValue({
                            fieldId: "custbody_sos_box_list",
                            value: allBoxList,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "memo",
                            value: memo,
                            ignoreFieldChange: true,
                        });
                        createRec.setValue({
                            fieldId: "trandate",
                            value: shipDate,
                            ignoreFieldChange: true,
                        });
                        var saveCreate = createRec.save();
                        log.debug('saveCreate', saveCreate)
                        if(saveCreate){
                        
                            var html = "<html><body>";
                            html += "<h3>Success</h3>";
                        
                            html += '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" ' +
                                    'type="button" onclick="window.history.go(-1)" value="OK" />';
                        
                            html += '<br /><br /><a href="https://9484296.app.netsuite.com/app/accounting/transactions/custom.nl?id=' + saveCreate + '" ' +
                                    'style="text-decoration:none; color:rgb(0, 106, 255); font-weight:bold;">Go to DO List</a>';
                        
                            html += "</body></html>";
                        
                            var form = serverWidget.createForm({
                                title: "Success Create DO List",
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