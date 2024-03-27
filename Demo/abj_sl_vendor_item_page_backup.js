/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/file', 'N/record', 'N/format', 'N/search', 'N/runtime', 'N/ui/message'], function(serverWidget, file, record, format, search, runtime, message) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Item Vendor Price List'
            });

            var fileField = form.addField({
                id: 'custpage_file',
                type: serverWidget.FieldType.FILE,
                label: 'Upload File'
            });

            fileField.isMandatory = true;
            form.addButton({
                id: 'custpage_button_po',
                label: "Download Template",
                functionName: "download()"
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_download_temp_vend.js";
            form.addSubmitButton({
                label: 'Upload Template'
            });

            context.response.writePage(form);
        } else if (context.request.method === 'POST') {
            try{
                // var userData = runtime.getCurrentUser();
                // var userId = userData.id
                // log.debug('userId', userId)
                var userId = '352'
                var fileData = context.request.files['custpage_file'];
                log.debug('file', fileData)
                if (fileData) {
                    var success = false
                    var fileContents = fileData.getContents();
                    var lines = fileContents.split('\n');
                    lines.forEach(function(line, index) {
                        if (index > 0) {
                            var values = line.split(',');
                            if(values.length >= 2){
                                var itemId = values[0]
                                log.debug('itemId', itemId)
                                var price = values[2]
                                if(price){
                                    price = Number(price).toFixed(2)
                                }
                                log.debug('price', price)
                                var recItem = record.load({
                                    type : 'inventoryitem',
                                    id: itemId,
                                    isDynamic: false,
                                })
                                
                                var findLine = recItem.findSublistLineWithValue({
                                    sublistId : 'itemvendor',
                                    fieldId : 'vendor',
                                    value : userId
                                });
                                var sublistRecord = recItem.getSublistSubrecord({
                                    sublistId: 'itemvendor',
                                    fieldId: 'itemvendorprice',
                                    line: findLine
                                });
                                log.debug('sublistRecord', sublistRecord)
                                
                               
                                var count = sublistRecord.getLineCount({sublistId: 'itemvendorpricelines'});
                                for ( var i=0; i < count ; i++)
                                {
                                    var id = sublistRecord.getSublistValue({sublistId: 'itemvendorpricelines', fieldId: 'id', line: i});
                                    var vendorcurrency = sublistRecord.getSublistValue({sublistId: 'itemvendorpricelines', fieldId: 'vendorcurrency', line: i});
                                    var vendorcurrencytext = sublistRecord.getSublistText({sublistId: 'itemvendorpricelines', fieldId: 'vendorcurrency', line: i});
                                    var vendorprice = sublistRecord.getSublistValue({sublistId: 'itemvendorpricelines', fieldId: 'vendorprice', line: i});
                                    log.debug('vendorprice', vendorprice)
                                    sublistRecord.setSublistValue({sublistId: 'itemvendorpricelines', fieldId: 'vendorprice', line: i, value: price});

                                }
                                var saveItem = recItem.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                });
                                log.debug('saveItem', saveItem)
                                if(saveItem){
                                    success = true
                                }
                               

                            }
                            
                        }
                    }
                    )
                    if(success == true){
                        var html = `<html>
                        <h3>Success update pricelist.</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Result Download Rekap Bank",
                        });
                        form_result.addPageInitMessage({
                            type: message.Type.CONFIRMATION,
                            title: "SUCCES",
                            message: html,
                        });
                        context.response.writePage(form_result);
                    }
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
