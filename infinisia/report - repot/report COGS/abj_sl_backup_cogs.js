/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    function getAllResults(s) {
        var results = s.run();
        var searchResults = [];
        var searchid = 0;
        do {
            var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000,
            });
            resultslice.forEach(function (slice) {
                searchResults.push(slice);
                searchid++;
            });
        } while (resultslice.length >= 1000);
        return searchResults;
    }

    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Report COGS",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });

            var locationOpt = form.addField({
                id: "custpage_bill_option",
                label: "Bill Number",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "vendorbill",
            });
            locationOpt.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var idBill = context.request.parameters.custpage_bill_option;
                log.debug('idBill', idBill);
                if(idBill){
                    var recBill = record.load({
                        type : 'vendorbill',
                        id : idBill
                    });
                    var vendor = recBill.getValue('entity');
                    log.debug('vendor', vendor);
                    var noInvoice = recBill.getValue('tranid');
                    var trandate = recBill.getValue('trandate')
                    var exchangerate = recBill.getValue('exchangerate')
                    var vendorName = '' ;
                    if(vendor){
                        var recVendor = record.load({
                            type : 'vendor',
                            id : vendor
                        });
                        var legalName = recVendor.getValue('legalname');
                        log.debug('legalName', legalName);
                        vendorName = legalName
                    }
                    var poCount = recBill.getLineCount({
                        sublistId : 'purchaseorders'
                    });
                    log.debug('poCOunt', poCount);
                    var dataPO = []
                    log.debug('vendorName', vendorName)
                    if(poCount > 0 ){
                        for(var i = 0; i  < poCount;i++){
                            var poId =  recBill.getSublistValue({
                                sublistId : 'purchaseorders',
                                fieldId: 'id',
                                line: i
                            });
                            var poNumber =  recBill.getSublistValue({
                                sublistId : 'purchaseorders',
                                fieldId: 'poid',
                                line: i
                            });
                            if(poId){
                                var poRec = record.load({
                                    type : 'purchaseorder',
                                    id : poId
                                })
                                var countLink = poRec.getLineCount({
                                    sublistId : 'links'
                                });
                                if(countLink > 0){
                                    for(var j = 0; j < countLink; j++){
                                        var type = poRec.getSublistValue({
                                            sublistId : 'links',
                                            fieldId: 'linktype',
                                            line: j
                                        })
                                        log.debug('type', type)
                                        if(type == 'Receipt/Fulfillment'){
                                            var idReceipt = poRec.getSublistValue({
                                                sublistId : 'links',
                                                fieldId: 'id',
                                                line: j
                                            });
                                            if(idReceipt){
                                                var receiptRec  = record.load({
                                                    type : 'itemreceipt',
                                                    id : idReceipt
                                                });
                                                var inbound = receiptRec.getText('inboundshipment');
                                                var receiptDate = receiptRec.getValue('trandate');
                                                if(receiptDate){
                                                    receiptDate = format.format({
                                                        value: receiptDate,
                                                        type: format.Type.DATE
                                                    });
                                                }
                                                var idInbound = receiptRec.getValue('inboundshipment');
                                                var dateInbound
                                                var billOfLoading
                                                var noPib
                                                if(idInbound){
                                                    var recInb = record.load({
                                                        type : 'inboundshipment',
                                                        id : idInbound
                                                    });
                                                    var inbDate = recInb.getValue('shipmentcreateddate');
                                                    if(inbDate){
                                                        inbDate = format.format({
                                                            value: inbDate,
                                                            type: format.Type.DATE
                                                        });
                                                        dateInbound = inbDate
                                                    }

                                                    var loading = recInb.getValue('billoflading');
                                                    if(loading){
                                                        billOfLoading = loading
                                                    }
                                                    var inbPIB = recInb.getValue('custrecord2');
                                                    if(inbPIB){
                                                        noPib = inbPIB
                                                    }
                                                }
                                                var countRecipt = receiptRec.getLineCount({
                                                    sublistId : 'item'
                                                });
                                                if(countRecipt > 0){
                                                    for(var k = 0; k < countRecipt ;k++ ){
                                                        var iteminReceipt = receiptRec.getSublistValue({
                                                            sublistId : 'item',
                                                            fieldId : 'item',
                                                            line : k
                                                        });
                                                        var isLandedCost = receiptRec.getSublistValue({
                                                            sublistId : 'item',
                                                            fieldId : 'landedcostset',
                                                            line : k
                                                        });
                                                        if(isLandedCost == "T"){
                                                            var landedCost = receiptRec.getSublistValue({
                                                                sublistId : 'item',
                                                                fieldId : 'landedcost',
                                                                line : k
                                                            });
                                                            log.debug('landedCost', landedCost)
                                                            if(landedCost){
                                                                var recLanded = record.load({
                                                                    type : 'landedcost',
                                                                    id : landedCost
                                                                });
                                                                log.debug('recLanded', recLanded);
                                                                var landedCount = recLanded.getLineCount({
                                                                    sublistId : 'landedcostdata'
                                                                });
                                                                var biayaMasuk
                                                                var biayaAngkut
                                                                var biayaPengurusan
                                                                if(landedCount > 0){
                                                                    for(var u = 0; u < landedCount; u++){
                                                                        var amount = recLanded.getSublistValue({
                                                                            sublistId : 'landedcostdata',
                                                                            fieldId : 'amount',
                                                                            line : u
                                                                        })
                                                                        var category = recLanded.getSublistText({
                                                                            sublistId : 'landedcostdata',
                                                                            fieldId : 'costcategory',
                                                                            line : u
                                                                        })
                                                                        var categoryId = recLanded.getSublistValue({
                                                                            sublistId : 'landedcostdata',
                                                                            fieldId : 'costcategory',
                                                                            line : u
                                                                        })
                                                                        if(categoryId == '2'){
                                                                            biayaMasuk = amount
                                                                        }else if(categoryId == '4'){
                                                                            biayaAngkut = amount
                                                                        }else if(categoryId == '3'){
                                                                            biayaPengurusan = amount
                                                                        }
                                                                    }

                                                                }
                                                                
                                                            }
                                                        }
                                                        dataPO.push({
                                                            iteminReceipt : iteminReceipt,
                                                            poNumber : poNumber,
                                                            inbound : inbound,
                                                            biayaMasuk : biayaMasuk,
                                                            biayaPengurusan : biayaPengurusan,
                                                            biayaAngkut : biayaAngkut,
                                                            dateInbound : dateInbound,
                                                            billOfLoading : billOfLoading,
                                                            noPib : noPib,
                                                            receiptDate : receiptDate

                                                        })
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        log.debug('dataPO', dataPO)
                        var dataItem = []
                    var itemCount = recBill.getLineCount({
                        sublistId : 'item'
                    });
                    if(itemCount > 0){
                        for(var i = 0; i < itemCount; i++){
                            var itemId = recBill.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'item',
                                line : i
                            });
                            var itemName = recBill.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'item_display',
                                line : i
                            });
                            var qty = recBill.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'quantity',
                                line : i
                            });
                            var rate = recBill.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'rate',
                                line : i
                            });
                            var amountItem = recBill.getSublistValue({
                                sublistId : 'item',
                                fieldId : 'amount',
                                line : i
                            });
                            dataItem.push({
                                itemId : itemId,
                                itemName : itemName,
                                qty : qty,
                                rate : rate,
                                amountItem : amountItem
                            })

                        }

                    }

                    var mergedData = [];
                    var totalQty = 0
                    dataPO.forEach(function(po) {
                        var iteminReceipt = po.iteminReceipt;

                        var matchedItems = dataItem.filter(function(item) {
                            return item.itemId === iteminReceipt;
                        });
                        matchedItems.forEach(function(matchedItem) {
                            var quantiTy = matchedItem.qty
                            log.debug('quantiTy', quantiTy)
                            totalQty += Number(qty)
                            var mergedObject = {
                                iteminReceipt: iteminReceipt,
                                poNumber: po.poNumber,
                                inbound: po.inbound,
                                biayaMasuk: po.biayaMasuk,
                                biayaPengurusan: po.biayaPengurusan,
                                biayaAngkut: po.biayaAngkut,
                                itemId: matchedItem.itemId,
                                itemName: matchedItem.itemName,
                                qty: matchedItem.qty,
                                rate: matchedItem.rate,
                                amountItem: matchedItem.amountItem,
                                dateInbound : po.dateInbound,
                                billOfLoading : po.billOfLoading,
                                noPib : po.noPib,
                                receiptDate : po.receiptDate
                                
                            };
                            mergedData.push(mergedObject);
                        });
                    });
                    log.debug('mergedData', mergedData)
                    var currentRecord = createSublist("custpage_sublist_item", form);
                    var no = 1
                    var i = 0
                    log.debug('totalQty', totalQty)
                    log.debug('noInvoice', noInvoice)
                    log.debug('trandate',trandate)
                    mergedData.forEach(function(data){
                        var itemName = data.itemName
                        var noPib = data.noPib
                        log.debug('noPIb', noPib)
                        var receiptDate = data.receiptDate
                        var billOfLoading = data.billOfLoading
                        var dateInbound = data.dateInbound
                        var poNumber = data.poNumber
                        var qty = data.qty
                        var rate = data.rate
                        var amountPrice = data.amountItem
                        var rateExc = exchangerate
                        var priceIdr = Number(amountPrice) * Number(rateExc)
                        var freightCharg = (1554*Number(qty))/(totalQty*exchangerate);
                        log.debug('freightCharg', freightCharg)
                        var biayaAngkut = data.biayaAngkut
                        var biayaPengurusan = data.biayaPengurusan
                        var biayaMasuk = data.biayaMasuk
                        var landed_cost = Number(priceIdr) + Number(freightCharg) + Number(biayaAngkut) + Number(biayaPengurusan) + Number(biayaMasuk)
                        var landedCostKg = Number(landed_cost) / Number(qty)
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_no",
                            value: no,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_nameitem",
                            value: itemName,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_vendor",
                            value: vendorName,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invno",
                            value: noInvoice,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invdate",
                            value: trandate,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_nopib",
                            value: noPib || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_tglpib",
                            value: dateInbound || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_tglir",
                            value: receiptDate,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_billofloading",
                            value: billOfLoading || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_bltgl",
                            value: dateInbound || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_pono",
                            value: poNumber,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_qty",
                            value: qty,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_unitprice",
                            value: rate,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_priceusd",
                            value: amountPrice,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ratepib",
                            value: exchangerate,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_priceidr",
                            value: priceIdr,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fc",
                            value: freightCharg,
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ic",
                            value: biayaMasuk || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_id",
                            value: biayaPengurusan || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_lc",
                            value: landed_cost || '-',
                            line: i,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_lckg",
                            value: landedCostKg || '-',
                            line: i,
                        });
                        no++
                        i++
                    })  
                    }
                    form.addButton({
                        id: 'custpage_button_download',
                        label: "Download",
                        functionName: "download()"
                    });
                    context.response.writePage(form);
                }
            }
            
        }catch(e){
            log.debug('error', e);
        }
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Report COGS",
        });
        sublist_in.addField({
            id: "custpage_sublist_no",
            label: "No",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_nameitem",
            label: "Product Name",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_vendor",
            label: "Name Of Principal",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_invno",
            label: "Bill Number",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_invdate",
            label: "Tgl Invoice",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_nopib",
            label: "No PIB",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_tglpib",
            label: "Tgl PIB",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_tglir",
            label: "Tgl SPPB",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_billofloading",
            label: "BL No",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_bltgl",
            label: "BL TGL",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_pono",
            label: "PO",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_qty",
            label: "QTY",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_unitprice",
            label: "Unit Price",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_priceusd",
            label: "Price/USD",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ratepib",
            label: "Rate PIB",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_priceidr",
            label: "Price/IDR",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fc",
            label: "Freight Charge",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_ic",
            label: "Import Cost",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_id",
            label: "Import Duty / BM",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_lc",
            label: "Landed Cost",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_lckg",
            label: "Landed Cost/KG",
            type: serverWidget.FieldType.TEXT,
        });

        return sublist_in;
    }
    return{
        onRequest : onRequest
    }
});