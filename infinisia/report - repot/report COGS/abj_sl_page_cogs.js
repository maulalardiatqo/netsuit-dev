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

            var billFilter = form.addField({
                id: "custpage_bill_option",
                label: "Bill Number",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "vendorbill",
            });
            var itemFilter = form.addField({
                id: "custpage_item_option",
                label: "Items",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "item",
            });
            var vendorFilter = form.addField({
                id: "custpage_vendor_option",
                label: "Principal",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "vendor",
            });
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var idBill = context.request.parameters.custpage_bill_option;
                var idItem = context.request.parameters.custpage_item_option;
                var idVendor = context.request.parameters.custpage_vendor_option;
                log.debug('idBill', idBill);
                log.debug('idItem', idItem);
                log.debug('idVendor', idVendor);
                //If no filters are selected show
                if(!idBill && !idItem && !idVendor){
                    
                }else{
                    var dataSearch = search.load({
                        id: 'customsearch782',
                    });
                    if(idBill){
                        dataSearch.filters.push(search.createFilter({
                            name: 'internalid',
                            operator: search.Operator.IS,
                            values: idBill
                        }));
                    }
                    if(idItem){
                        dataSearch.filters.push(search.createFilter({
                            name: 'item',
                            operator: search.Operator.IS,
                            values: idItem
                        }));
                    }
                    if(idVendor){
                        dataSearch.filters.push(search.createFilter({
                            name: 'vendor.internalid',
                            operator: search.Operator.ANYOF,
                            values: idVendor
                        }));
                    }
                    dataSearchSet = dataSearch.run();
                    dataSearch = dataSearchSet.getRange(0, 999);
                    log.debug('dataSearch', dataSearch)
                    
                    var allData = []
                    for (var i in dataSearch) {
                        var py = dataSearch[i];
                        var itemId = py.getValue(dataSearchSet.columns[0]);
                        log.debug('itemId', itemId)
                        var vendor = py.getValue(dataSearchSet.columns[1]);
                        var billNumbe = py.getValue(dataSearchSet.columns[2]);
                        var poNumb = py.getValue(dataSearchSet.columns[3]);
                        log.debug('poNumb', poNumb)
                        var date = py.getValue(dataSearchSet.columns[4]);
                        var qty = py.getValue(dataSearchSet.columns[5]);
                        var excRate = py.getValue(dataSearchSet.columns[6]);
                        var rateItem = py.getValue(dataSearchSet.columns[7]);
                        var amount = py.getValue(dataSearchSet.columns[8]);
                        var priceIdr = Number(amount) * Number(excRate);
                        var poId = py.getValue(dataSearchSet.columns[9]);
                        log.debug('poId', poId)

                        var searchIr = search.create({
                            type: "itemreceipt",
                            filters:
                            [
                                ["type","anyof","ItemRcpt"], 
                                "AND", 
                                ["createdfrom","anyof",poId], 
                                "AND", 
                                ["mainline","is","T"]
                            ],
                            columns:
                            [
                                search.createColumn({name: "internalid"}),
                            ]
                        });
                        var searchIrSet = searchIr.run();
                        searchIr = searchIrSet.getRange({
                            start: 0,
                            end: 1
                        });
                        log.debug('searchIr', searchIr)
                        var firstResult = searchIr[0];
                        log.debug('firstResult', firstResult);
                        var idIr = firstResult.getValue({
                            name: "internalid"
                        })
                        log.debug('idIr', idIr);
                        // var fieldIr = search.lookupFields({
                        //     type: search.Type.ITEM_RECEIPT,
                        //     id: idIr,
                        //     columns: ['landedcostamount2']
                        // });
                        // log.debug('fieldIr', fieldIr)
                        var inbShipment = '-'
                        var biayaMasuk = 0
                        var biayaPengurusan = 0
                        var biayaAngkut = 0
                        var irDate = '-'
                        if(idIr){
                            var recIr = record.load({
                                type: search.Type.ITEM_RECEIPT,
                                id: idIr,
                            });
                            var shipment = recIr.getText('inboundshipment');
                            inbShipment = shipment
                            var beaMasuk = recIr.getValue('landedcostamount2');
                            biayaMasuk = beaMasuk
                            var pengImport = recIr.getValue('landedcostamount3');
                            biayaPengurusan = pengImport;
                            var angkut = recIr.getValue('landedcostamount4')
                            biayaAngkut = angkut
                            var dateIr = recIr.getValue('trandate');
                            irDate = dateIr

                        }
                        var landedCost = Number(biayaMasuk) + Number(biayaPengurusan) + Number(biayaAngkut)
                        allData.push({
                            itemId : itemId,
                            vendor : vendor,
                            billNumbe : billNumbe,
                            date : date,
                            inbShipment : inbShipment,
                            irDate : irDate,
                            poNumb : poNumb,
                            qty : qty,
                            rateItem : rateItem,
                            amount : amount,
                            excRate : excRate,
                            priceIdr : priceIdr,
                            biayaAngkut : biayaAngkut,
                            biayaMasuk : biayaMasuk,
                            biayaPengurusan : biayaPengurusan,
                            landedCost : landedCost
                        })
                        log.debug('dataIr', {inbShipment : inbShipment, biayaMasuk : biayaMasuk, biayaPengurusan : biayaPengurusan, biayaAngkut : biayaAngkut})
                        
                    }
                    
                    var currentRecord = createSublist("custpage_sublist_item", form);
                    var noset = 1
                    var line = 0
                    allData.forEach(data=>{
                        var itemId = data.itemId
                        var vendor = data.vendor
                        var billNumbe = data.billNumbe
                        var date = data.date
                        var inbShipment = data.inbShipment
                        var irDate = data.irDate
                        var poNumb = data.poNumb
                        var qty = data.qty
                        var rateItem = data.rateItem
                        if(rateItem){
                            rateItem = format.format({
                                value: rateItem,
                                type: format.Type.CURRENCY
                            });
                        }
                        
                        var amount = data.amount
                        if(amount){
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        var excRate = data.excRate
                        if(excRate){
                            excRate = format.format({
                                value: excRate,
                                type: format.Type.CURRENCY
                            });
                        }
                        var priceIdr = data.priceIdr
                        if(priceIdr){
                            priceIdr = format.format({
                                value: priceIdr,
                                type: format.Type.CURRENCY
                            });
                        }
                        var biayaAngkut = data.biayaAngkut
                        if(biayaAngkut){
                            biayaAngkut = format.format({
                                value: biayaAngkut,
                                type: format.Type.CURRENCY
                            });
                        }
                        var biayaMasuk = data.biayaMasuk
                        if(biayaMasuk){
                            biayaMasuk = format.format({
                                value: biayaMasuk,
                                type: format.Type.CURRENCY
                            });
                        }
                        var biayaPengurusan = data.biayaPengurusan
                        if(biayaPengurusan){
                            biayaPengurusan = format.format({
                                value: biayaPengurusan,
                                type: format.Type.CURRENCY
                            });
                        }
                        var landedCost = data.landedCost
                        var landedCostForCOunt = landedCost
                        if(landedCost){
                            landedCost = format.format({
                                value: landedCost,
                                type: format.Type.CURRENCY
                            });
                        }
                        log.debug('landedCost', landedCost);
                        log.debug('qty', qty)
                        var landedCostperKG = Number(landedCostForCOunt) / Number(qty)
                        if(landedCostperKG){
                            landedCostperKG = format.format({
                                value: landedCostperKG,
                                type: format.Type.CURRENCY
                            });
                        }
                        

                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_no",
                            value: noset,
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_nameitem",
                            value: itemId || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_vendor",
                            value: vendor || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invno",
                            value: billNumbe || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_invdate",
                            value: date || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_nopib",
                            value: inbShipment || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_tglpib",
                            value: '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_tglir",
                            value: irDate,
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_billofloading",
                            value: inbShipment || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_bltgl",
                            value: '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_pono",
                            value: poNumb || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_qty",
                            value: qty || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_unitprice",
                            value: rateItem || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_priceusd",
                            value: amount || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ratepib",
                            value: excRate || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_priceidr",
                            value: priceIdr || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fc",
                            value: biayaAngkut || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_ic",
                            value: biayaMasuk || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_id",
                            value: biayaPengurusan || '-',
                            line: line,
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_lc",
                            value: landedCost || '-',
                            line: line,
                        });
                        log.debug('landedCostperKG', landedCostperKG)
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_lckg",
                            value: landedCostperKG || '-',
                            line: line,
                        });
                        noset++
                        line++
                    })
                    form.addButton({
                        id: 'custpage_button_download',
                        label: "Download",
                        functionName: "downloadExcel( "+JSON.stringify(allData)+")",
                    });
                    form.clientScriptModulePath = "SuiteScripts/abj_cs_download_cogs.js";
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