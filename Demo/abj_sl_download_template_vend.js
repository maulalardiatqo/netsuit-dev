/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        try{
            log.debug('masuk')
            var userData = runtime.getCurrentUser();
            var userId = userData.id
            log.debug('userId', userId)
            var itemSearchObj = search.create({
            type: "item",
            filters:
            [
                ["othervendor","noneof","@NONE@"], 
                "AND", 
                ["othervendor","anyof","352"]
            ],
            columns:
            [
                search.createColumn({
                    name: "itemid",
                    sort: search.Sort.ASC,
                    label: "Name"
                }),
                search.createColumn({name: "internalid", label: "Display Name"}),
                search.createColumn({name: "displayname", label: "Display Name"}),
                search.createColumn({name: "salesdescription", label: "Description"}),
                search.createColumn({name: "vendor", label: "Preferred Vendor"}),
                search.createColumn({name: "vendorpricecurrency", label: "Vendor Price Currency"}),
                search.createColumn({name: "vendorcost", label: "Vendor Price"})
            ]
            });
            var searchResultCount = itemSearchObj.runPaged().count;
            log.debug("itemSearchObj result count",searchResultCount);
            var allData = []
            itemSearchObj.run().each(function(result){
                var itemId = result.getValue({
                    name: "internalid"
                })
                var itemName = result.getValue({
                    name: "displayname"
                });
                var price = result.getValue({
                    name: "vendorcost"
                });
                var currency = result.getValue({
                    name: "vendorpricecurrency"
                });
                allData.push({
                    itemId : itemId,
                    itemName : itemName,
                    price : price,
                    currency : currency
                })
                return true;
            });
            log.debug('allData', allData)
            if(allData.length <= 0){
                var html = `<html>
                    <h3>No Data for this selection!.</h3>
                    <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                    <body></body></html>`;
                    var form_result = serverWidget.createForm({
                        title: "Result Download Rekap Bank",
                    });
                    form_result.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: "No Data!",
                        message: html,
                    });
                    context.response.writePage(form_result);
            }else{
                var csvStr = "itemId,itemName,price,currency\n";
                allData.forEach((data)=>{
                    var itemId = data.itemId
                    var itemName = data.itemName
                    var price = data.price
                    var currency = data.currency
                    csvStr += '"' + itemId + '",';
                    csvStr += '"' + itemName + '",';
                    csvStr += '"' + price + '",';
                    csvStr += '"' + currency + '",';
                    csvStr += '\n';
                })
                var objCsvFile = file.create({
                    name: "Template Upload Item Price List.csv",
                    fileType: file.Type.CSV,
                    contents: csvStr,
                });

                context.response.writeFile({
                    file: objCsvFile,
                });
            }
        }catch(e){
            log.debug('error', e)
        }
        
    }
    
    return {
        onRequest: onRequest
    };
});