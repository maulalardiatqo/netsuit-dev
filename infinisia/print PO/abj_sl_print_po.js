/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        function removeDecimalFormat(number) {
            return number.toString().substring(0, number.toString().length - 3);
        }
        function pembulatan(angka) {
            if (angka >= 0) {
                var bulat = Math.floor(angka);
                var desimal = angka - bulat;

                if (desimal >= 0.5) {
                    return Math.ceil(angka);
                } else {
                    return Math.floor(angka);
                }
            } else {
                return Math.ceil(angka);
            }
        }
        function onRequest(context) {
            var recid = context.request.parameters.id;
            log.debug('recid', recid)
            // load PO


            var poSearch = search.create({
                type: search.Type.PURCHASE_ORDER,
                columns: [
                    'internalid',
                    'currency',
                    'entity',
                    'tranid',
                    'trandate',
                    'terms',
                    'amount',
                    'total',
                    'duedate',
                    'exchangerate',
                    'custbody_abj_custom_jobnumber',
                    'custcol_4601_witaxrate',
                    'custcol_4601_witaxamount',
                    'custcol_4601_witaxcode',
                    'custcol_4601_witaxrate_exp',
                    'custcol_4601_witaxamt_exp',
                    'custcol_4601_witaxcode_exp',
                    'item',
                    'quantityuom',
                    'unit',
                    'memo',
                    'taxamount',
                    search.createColumn({name: "rate", label: "Item Rate"}),
                    search.createColumn({
                        name: 'formulatext1',
                        formula: "{vendor.internalid}",
                        label: 'vendorid'
                    }),
                    search.createColumn({
                        name: 'formulatext2',
                        formula: "{item.internalid}",
                        label: 'itemid'
                    }),
                    search.createColumn({
                        name: 'formulatext3',
                        formula: "{item.description}",
                        label: 'itemdesc'
                    }),
                    search.createColumn({
                        name: 'formulanumeric1',
                        formula: "{amount} - nvl({taxtotal},0) - nvl({shippingamount},0)",
                        label: 'subtotal'
                    }),
                    search.createColumn({
                        name: 'formulanumeric5',
                        formula: "{taxitem.rate}",
                        label: 'taxrate'
                    }),

                ],
                filters: [
                    ['mainline', 'is', 'any'],
                    'AND',
                    ['taxline', 'is', false],
                    'AND',
                    ['internalid', 'is', recid]
                ]
            })

            var searchResultCount = poSearch.runPaged().count;
            var searchResult = poSearch.run().getRange(0, searchResultCount)
            var resultArray = []
            searchResult.forEach(function (result) {
                var internalid = result.getValue('internalid')
                var currency = result.getValue('currency')
                var tranid = result.getValue('tranid')
                var trandate = result.getValue('trandate')
                var duedate = result.getValue('duedate')
                var terms = result.getValue('terms')
                var total = result.getValue('total')
                var jobnumber = result.getValue('custbody_abj_custom_jobnumber')
                var entity = result.getText('entity')
                var exchangerate = result.getValue('exchangerate')
                var amountBef = result.getValue('amount')
                var amount = Number(amountBef) / Number(exchangerate)
                var quantity = result.getValue('quantityuom')
                var unit = result.getValue('unit')
               
                var vendorId = result.getValue({
                    name: 'formulatext1',
                    label: 'vendorid'
                })
                var itemid = result.getValue({
                    name: 'formulatext2',
                    label: 'itemid'
                })
                var itemdesc = result.getValue({
                    name: 'formulatext3',
                    label: 'itemdesc'
                })
                var subtotal = result.getValue({
                    name: 'formulanumeric1',
                    label: 'subtotal'
                })
                var witaxrate = result.getValue('custcol_4601_witaxrate')
                var witaxamount = result.getValue('custcol_4601_witaxamount')
                var witaxcode = result.getValue('custcol_4601_witaxcode')
                var taxrate = result.getValue({
                    name: 'formulanumeric5',
                    label: 'taxrate'
                })
                var witaxrateExp = result.getValue('custcol_4601_witaxrate_exp')
                var witaxamountExp = result.getValue('custcol_4601_witaxamt_exp')
                var witaxcodeExp = result.getValue('custcol_4601_witaxcode_exp')
                var itemName = result.getValue('item')
                var memo = result.getValue('memo')
                var taxamount = result.getValue('taxamount')
                var rate = Number(amount) / Number(quantity)
                resultArray.push({
                    internalid: internalid,
                    currency: currency,
                    tranid: tranid,
                    trandate: trandate,
                    duedate: duedate,
                    entity: entity,
                    terms: terms,
                    amount: amount,
                    total: total,
                    exchangerate: exchangerate,
                    jobnumber: jobnumber,
                    vendorId: vendorId,
                    subtotal: subtotal,
                    witaxrate: witaxrate,
                    witaxamount: witaxamount,
                    witaxcode: witaxcode,
                    taxrate: taxrate,
                    witaxrateExp,
                    witaxamountExp,
                    witaxcodeExp,
                    itemName: itemName,
                    itemid: itemid,
                    quantity: quantity,
                    unit: unit,
                    itemdesc: itemdesc,
                    memo: memo,
                    taxamount: taxamount,
                    rate : rate

                })
                return true
            })

            log.debug('resultArray', resultArray)

            // var poRecord = record.load({
            //     type: record.Type.PURCHASE_ORDER,
            //     id: recid,
            //     isDynamic: false,
            // });

            // var currenc = poRecord.getValue('currency');
            var poRecord = resultArray
            var currenc = poRecord[0].currency
            if (currenc) {
                var recCurrenc = record.load({
                    type: 'currency',
                    id: currenc,
                    isDynamic: false
                });
                var tlcCurr = recCurrenc.getValue('symbol');
            }


            // load subsidiarie
            var companyInfo = config.load({
                type: config.Type.COMPANY_INFORMATION
            });
            var legalName = companyInfo.getValue("legalname");
            var logo = companyInfo.getValue('formlogo');
            var filelogo;
            var urlLogo = '';
            if (logo) {
                filelogo = file.load({
                    id: logo
                });
                //get url
                urlLogo = filelogo.url.replace(/&/g, "&amp;");
            }
            var addres = companyInfo.getValue("mainaddress_text")
            var retEmailAddres = companyInfo.getValue('email')
            var Npwp = companyInfo.getValue('employerid')
            // var vendor_id = poRecord.getValue('entity');
            var vendor_id = poRecord[0].vendorId
            if (vendor_id) {
                var vendorRecord = record.load({
                    type: record.Type.VENDOR,
                    id: vendor_id,
                    isDynamic: false,
                });
                var venName
                var isperson = vendorRecord.getValue('isperson');
                if (isperson == 'T') {
                    var firstname = vendorRecord.getValue('firstname') || ''
                    var middleName = vendorRecord.getValue('middlename') || '';
                    var lastname = vendorRecord.getValue('lastname') || ''
                    venName = firstname + ' ' + middleName + ' ' + lastname;
                } else {
                    var isChecklist = vendorRecord.getValue('isautogeneratedrepresentingentity');

                    if (isChecklist === true) {
                        venName = vendorRecord.getValue('comments');
                    } else {
                        venName = vendorRecord.getValue('companyname');
                    }

                }
                var venAddres = vendorRecord.getValue('billaddr1');
                if (venAddres === '') {
                    venAddres = vendorRecord.getValue('defaultaddress');
                }
                if (venAddres) {
                    if (venAddres.includes('&')) {
                        venAddres = venAddres.replace(/&/g, ' dan ')
                    }
                }
                var taxRegNo = vendorRecord.getValue('vatregnumber');
                var count = vendorRecord.getLineCount({
                    sublistId: 'submachine'
                });

            }

            // PO data
            var tandId = poRecord[0].tranid
            var POdate = poRecord[0].trandate
            var terms = poRecord[0].terms
            var poTotal = poRecord[0].total

            var total = 0;
            var duedate = poRecord[0].duedate

            var jobNumber = poRecord[0].jobnumber
            if (jobNumber.includes('\\')) {
                jobNumber = jobNumber.replace(/\\/g, '<br/>')
            }

            var subTotal = poRecord[0].subtotal / poRecord[0].exchangerate || 0;
            poTotal = poTotal / poRecord[0].exchangerate

            var totalWhTaxamount = 0;
            var totalWhTaxamountItem = 0;
            var totalWhTaxamountExp = 0;
            var whtaxammountItem = 0;
            var whtaxammountExp = 0;
            var whTaxCodetoPrint = ''


            // var poRecord = record.load({
            //     type: record.Type.PURCHASE_ORDER,
            //     id: recid,
            //     isDynamic: false,
            // });
            // var countItem = poRecord.getLineCount({
            //     sublistId: 'item'
            // });
            var countItem = poRecord.length
            var taxRateList = [];
            // var poRecord = record.load({
            //     type: record.Type.PURCHASE_ORDER,
            //     id: recid,
            //     isDynamic: false,
            // });

            if (countItem > 0) {
                var taxpphList = [];
                for (var i = 1; i < countItem; i++) { //line 0 adalah mainline
                    if (poRecord[i].itemName != '') { //khusus sublistId=item

                        var taxpph = poRecord[i].witaxrate

                        var whtaxammountItem = poRecord[i].witaxamount
                        var amount = poRecord[i].amount / poRecord[i].exchangerate

                        var taxtRate = parseInt(poRecord[i].taxrate)

                        if (taxtRate !== 0 && taxRateList.indexOf(taxtRate) === -1) {
                            taxRateList.push(parseFloat(taxtRate));
                        }
                        var whTaxCodeI = poRecord[i].witaxcode

                        if (whTaxCodeI) {
                            var whRecI = record.load({
                                type: 'customrecord_4601_witaxcode',
                                id: whTaxCodeI,
                                isDynamic: false,
                            });
                            whTaxCodetoPrint = whRecI.getValue('custrecord_4601_wtc_name');
                            if (whTaxCodetoPrint.includes('Prepaid Tax') || whTaxCodetoPrint.includes('Tax Article')) {
                                whTaxCodetoPrint = whTaxCodetoPrint.replace('Prepaid Tax', 'PPH').replace('Tax Article', 'PPH');
                            }
                        }
                        var totalAmountPerline = amount;
                        var tamount = whtaxammountItem
                        whtaxammountItem = Math.abs(tamount);
                        totalWhTaxamountItem += whtaxammountItem

                        if (taxpph && taxpphList.indexOf(taxpph) === -1) {
                            taxpphList.push(taxpph);
                        }
                    }
                }
            }
            var countExpense = poRecord.length
            if (countExpense > 0) { 
                var taxpphList = [];
                for (var i = 1; i < countExpense; i++) {
                    if (poRecord[i].itemName == '') { //expense tidak ada itemName

                        var taxpph = poRecord[i].witaxrateExp
                        whtaxammountExp = poRecord[i].witaxamountExp
                        
                        var amountExp = poRecord[i].amount / poRecord[i].exchangerate
                        var whTaxCode = poRecord[i].witaxcodeExp
                        if (whTaxCode) {
                            var whRec = record.load({
                                type: 'customrecord_4601_witaxcode',
                                id: whTaxCode,
                                isDynamic: false,
                            });
                            whTaxCodetoPrint = whRec.getValue('custrecord_4601_wtc_name');
                            if (whTaxCodetoPrint.includes('Prepaid Tax') || whTaxCodetoPrint.includes('Tax Article')) {
                                whTaxCodetoPrint = whTaxCodetoPrint.replace('Prepaid Tax', 'PPH').replace('Tax Article', 'PPH');
                            }
                        }
                        var taxtRate = parseInt(poRecord[i].taxrate)
                        if (taxtRate != 0 && taxRateList.indexOf(taxtRate) === -1) {
                            taxRateList.push(taxtRate);
                        }
                        // var qtyExp = poRecord.getSublistValue({
                        //     sublistId: 'expense',
                        //     fieldId: 'quantity',
                        //     line: i
                        // });
                        var totalAmountPerlineExp = amountExp;
                        // subTotal += totalAmountPerlineExp
                        var tamountExp = whtaxammountExp
                        whtaxammountExp = Math.abs(tamountExp);
                        totalWhTaxamountExp += whtaxammountExp

                        if (taxpph && taxpphList.indexOf(taxpph) === -1) {
                            taxpphList.push(taxpph);
                        }
                    }
                }
            }
            if (taxpphList.length > 0) {
                var taxpphToPrint = taxpphList.join(' & ');
            }

            var whtaxToCount = whtaxammountItem + whtaxammountExp;
            totalWhTaxamount = totalWhTaxamountItem + totalWhTaxamountExp;
            var totalWHTaxToCount = totalWhTaxamount
            if (totalWhTaxamount) {
                totalWhTaxamount = pembulatan(totalWhTaxamount);
                totalWhTaxamount = format.format({
                    value: totalWhTaxamount,
                    type: format.Type.CURRENCY
                });
            }
            var taxtotal = taxtRate / 100 * Number(subTotal);

            total = Number(subTotal) + Number(taxtotal);
            var totalToCount = total
            if (poTotal) {
                poTotal = parseFloat(poTotal);
                poTotal = poTotal.toFixed(2);
                poTotal = format.format({
                    value: poTotal,
                    type: format.Type.CURRENCY
                });
            }
            if (subTotal) {
                subTotal = pembulatan(subTotal)
                subTotal = format.format({
                    value: subTotal,
                    type: format.Type.CURRENCY
                });
            }

            if (taxtotal) {
                taxtotal = pembulatan(taxtotal)
                taxtotal = format.format({
                    value: taxtotal,
                    type: format.Type.CURRENCY
                });
            }
            if (total) {
                total = pembulatan(total)
                total = format.format({
                    value: total,
                    type: format.Type.CURRENCY
                });
            }
            
            // if (duedate) {
            //     function sysDate() {
            //         var date = duedate;
            //         var tdate = date.getUTCDate();
            //         var month = date.getUTCMonth() + 1; // jan = 0
            //         var year = date.getUTCFullYear();

            //         return tdate + '/' + month + '/' + year;
            //     }
            //     duedate = sysDate();
            // }
            // if (POdate) {
            //     POdate = format.format({
            //         value: POdate,
            //         type: format.Type.DATE
            //     });
            // }
            var amountRecieved = Number(totalToCount) - Number(totalWHTaxToCount);
            if (amountRecieved) {
                amountRecieved = pembulatan(amountRecieved);
                amountRecieved = format.format({
                    value: amountRecieved,
                    type: format.Type.CURRENCY
                });
            }

            // var itemCount = poRecord.getLineCount({
            //     sublistId: 'item'
            // });
            var itemCount = poRecord.length
            var allDataCharge = []
            if (itemCount > 0) {
                var idItemOtherCharge = []
                var otherchargeitemSearchObj = search.create({
                    type: "otherchargeitem",
                    filters:
                        [
                            ["type", "anyof", "OthCharge"]
                        ],
                    columns:
                        [
                            search.createColumn({ name: "internalid", label: "Internal ID" })
                        ]
                });
                var searchResultCount = otherchargeitemSearchObj.runPaged().count;
                otherchargeitemSearchObj.run().each(function (result) {
                    var itemOtherChacge = result.getValue({
                        name: "internalid"
                    })
                    if (itemOtherChacge) {
                        idItemOtherCharge.push(itemOtherChacge)
                    }
                    return true;
                });

                for (var index = 1; index < itemCount; index++) {
                    if(poRecord[index].itemName != ''){//sublistId = item aja

                        var itemId = poRecord[index].itemid
                        var itemText = poRecord[index].itemName
                        var amount = poRecord[index].amount
                        if (idItemOtherCharge.includes(itemId)) {
                            log.debug('Skip itemId', itemId);
                            allDataCharge.push({
                                itemText: itemText,
                                amount: amount
                            })
                        }
                    } 
                }
            }
            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '1%';
            var style = "";
            var footer = "";
            var pdfFile = null;


            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-img-logo{width:280px; height:90px; object-vit:cover;}";
            style += ".tg .tg-headerrow{align: right;font-size:12px;}";
            style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
            style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
            style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
            style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
            style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
            style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
            style += "</style>";


            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            header += "<tbody>";
            header += "</tbody>";
            header += "</table>";

            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<tbody>";
            body += "<tr>";
            if (urlLogo) {
                body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left;'><div style='display: flex; height:150px; width:150px;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
            }
            body += "<td>";

            body += "<p class='tg-headerrow_legalName' style='margin-top: 10px; margin-bottom: 10px;'>" + legalName + "</p>";
            body += "<p class='tg-headerrow' style='margin-top: 1px; margin-bottom: 1px;'>" + addres + "<br/>";
            body += "" + retEmailAddres + "<br/>"
            body += "NPWP : " + Npwp + "</p>";
            body += "</td>";
            body += "</tr>";
            body += "<tr style='height:30px;'>";
            body += "</tr>";
            body += "<tr>";
            body += "<td>";
            body += "<p class='tg-headerrow_left'>" + venName + "<br/>"
            body += "" + venAddres + "<br/></p>"
            body += "</td>"
            body += "<td>"
            body += "<p class='tg-headerrow_legalName'> Purchase Order # : " + tandId + "<br/>"
            body += "" + POdate + "</p>"
            body += "<p class='tg-headerrow' style='font-size:11px'> Terms : " + terms + "<br/></p>"
            body += "</td>"
            body += "</tr>"
            body += "<tr style='height:30px;'>";
            body += "</tr>";
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<tbody>";
            body += "<tr>"
            body += "<td class='tg-head_body' style='width:35%'> DESCRIPTION </td>"
            body += "<td class='tg-head_body' style='width:15%'> PACK SIZE </td>"
            body += "<td class='tg-head_body' style='width:10%'> QTY </td>"
            body += "<td class='tg-head_body' style='align:right; width:20%'> UNIT PRICE (" + tlcCurr + ") </td>"
            body += "<td class='tg-head_body' style='align:right; width:20%'> AMOUNT (" + tlcCurr + ") </td>"
            body += "</tr>"
            body += getPOItem(context, poRecord);
            body += getPOExpense(context, poRecord);
            body += "<tr>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-f_body'>SUBTOTAL</td>"
            body += "<td class='tg-f_body'>" + removeDecimalFormat(subTotal) + "</td>"
            body += "</tr>"
            if (taxRateList != '') {
                body += "<tr>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-f_body'>VAT " + taxtRate + " %</td>"
                body += "<td class='tg-f_body'>" + removeDecimalFormat(taxtotal) + "</td>"
                body += "</tr>"
            }
            if (allDataCharge || allDataCharge.length > 0) {
                allDataCharge.forEach(function (charge) {
                    body += "<tr>";
                    body += "<td class='tg-headerrow_left'></td>";
                    body += "<td class='tg-headerrow_left'></td>";
                    body += "<td class='tg-headerrow_left'></td>"
                    body += "<td class='tg-f_body'>" + charge.itemText + "</td>";
                    body += "<td class='tg-f_body'>" + charge.amount + "</td>";
                    body += "</tr>";
                });
            }
            body += "<tr>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-f_body'>TOTAL</td>"
            body += "<td class='tg-f_body'>" + removeDecimalFormat(total) + "</td>"
            body += "</tr>"


            if (whTaxCodetoPrint) {
                body += "<tr>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td style='align: right;font-size:12px;border-bottom: solid black 2px;'>" + whTaxCodetoPrint + "</td>"
                body += "<td class='tg-f_body'>" + removeDecimalFormat(totalWhTaxamount) + "</td>"
                body += "</tr>"
            }

            body += "<tr>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td class='tg-headerrow_left'></td>"
            body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;'>BALANCE DUE</td>"
            body += "<td style='align: right;font-size:15px;border-top: solid black 2px; font-weight: bold;'>" + removeDecimalFormat(amountRecieved) + "</td>"
            body += "</tr>"
            body += "<tr style='height:30px;'></tr>"
            body += "<tr>"
            body += "<td style='align:left; font-size:14px; font-weight: bold;' colspan='5'>" + jobNumber + "</td>"
            body += "</tr>"
            body += "</tbody>";
            body += "</table>";

            body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
            body += "<tr>"
            body += "<td style='width:15%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:27%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:16%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:27%'></td>"
            body += "<td style='width:1%'></td>"
            body += "<td style='width:15%'></td>"
            body += "</tr>"

            body += "<tr>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style='align:center'>Vendor/Principal</td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style='align:center'>Purchasing</td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "</tr>"

            body += "<tr>"
            body += "<td style='height:40px' colspan='9'></td>"
            body += "</tr>"

            body += "<tr>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style='align:center; border-bottom:1px solid black;'></td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "<td style='align:center;'>PT. Infinisia Sumber Semesta</td>"
            body += "<td style=''></td>"
            body += "<td style=''></td>"
            body += "</tr>"

            body += "</table>";

            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "<tr class='tg-foot'>";
            footer += "<td style='align:left'>Purchase Order # " + tandId + "</td>"
            footer += "<td style='align:right'></td>"
            footer += "</tr>";
            footer += "</tbody>";
            footer += "</table>";

            var xml = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
            xml += "<pdf>";
            xml += "<head>";
            xml += style;
            xml += "<macrolist>";
            xml += "<macro id=\"nlheader\">";
            xml += header;
            xml += "</macro>";
            xml += "<macro id=\"nlfooter\">";
            xml += footer;
            xml += "</macro>";
            xml += "</macrolist>";
            xml += "</head>"
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        }

        function getPOItem(context, poRecord) {
            var itemCount = poRecord.length;
        
            if (itemCount > 0) {
                var idItemOtherCharge = [];
                var otherchargeitemSearchObj = search.create({
                    type: "otherchargeitem",
                    filters: [
                        ["type", "anyof", "OthCharge"]
                    ],
                    columns: [
                        search.createColumn({ name: "internalid", label: "Internal ID" })
                    ]
                });
        
                var searchResultCount = otherchargeitemSearchObj.runPaged().count;
                otherchargeitemSearchObj.run().each(function(result) {
                    var itemOtherChacge = result.getValue({
                        name: "internalid"
                    });
                    if (itemOtherChacge) {
                        idItemOtherCharge.push(itemOtherChacge);
                    }
                    return true;
                });
        
                var body = "";
                var items = {};
        
                for (var index = 1; index < itemCount; index++) {
                    if (poRecord[index].itemName != '') {
        
                        var itemId = poRecord[index].itemid;
                        var unit = poRecord[index].unit;
        
                        if (idItemOtherCharge.includes(itemId)) {
                            // Handle other charges if necessary
                        } else {
                            var qty = poRecord[index].quantity;
                            var description = poRecord[index].itemdesc;
                            var amount = poRecord[index].amount
                            var rate = poRecord[index].rate;
                            log.debug('rate', rate);
        
                            // Create a unique key combining itemId and unit
                            var itemKey = itemId + '_' + unit;
        
                            if (!items[itemKey]) {
                                items[itemKey] = {
                                    description: description,
                                    unit: unit,
                                    qty: 0,
                                    amount: 0,
                                    rate: 0
                                };
                            }
        
                            items[itemKey].qty += Number(qty);
                            items[itemKey].amount += Number(amount);
                            items[itemKey].rate = rate;
                        }
                    }
                }
        
                log.debug('items', items);
                for (var itemKey in items) {
                    var item = items[itemKey];
        
                    if (item.description.includes('\\')) {
                        item.description = item.description.replace(/\\/g, '<br/>');
                    }
        
                    var rateFormatted = format.format({
                        value: item.rate, 
                        type: format.Type.CURRENCY
                    });
        
                    var amountFormatted = pembulatan(item.amount);
                    amountFormatted = format.format({
                        value: amountFormatted,
                        type: format.Type.CURRENCY
                    });
        
                    body += "<tr>";
                    body += "<td class='tg-b_body'>" + item.description + "</td>";
                    body += "<td class='tg-b_body'>" + item.unit + "</td>";
                    body += "<td class='tg-b_body'>" + item.qty + "</td>";
                    body += "<td class='tg-b_body' style='align:right'>" + removeDecimalFormat(rateFormatted) + "</td>";
                    body += "<td class='tg-b_body' style='align:right;'>" + removeDecimalFormat(amountFormatted) + "</td>";
                    body += "</tr>";
                }
        
                return body;
            }
        }
        

        function getPOExpense(context, poRecord) {
            // var expCont = poRecord.getLineCount({
            //     sublistId: 'expense'
            // });
            var expCont = poRecord.length
            if (expCont > 0) {
                var body = "";
                for (var index = 1; index < expCont; index++) {
                    if(poRecord[index].itemName == ''){ 

                        var qty = 1; 
                        var description = poRecord[index].memo
                        if (description.includes('\\')) {
                            description = description.replace(/\\/g, '<br/>');
                        }
                        var amount = poRecord[index].amount / poRecord[index].exchangerate
                        if (amount) {
                            var amountBef = amount
    
                            amount = pembulatan(amount)
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        var taxamt_exp = poRecord[index].taxamount
                        if (taxamt_exp) {
                            taxamt_exp = pembulatan(taxamt_exp)
                            taxamt_exp = format.format({
                                value: taxamt_exp,
                                type: format.Type.CURRENCY
                            });
                        }
                        var grosamt_exp = Number(amountBef) * Number(qty)
                        if (grosamt_exp) {
                            grosamt_exp = pembulatan(grosamt_exp)
                            grosamt_exp = format.format({
                                value: grosamt_exp,
                                type: format.Type.CURRENCY
                            });
                        }
                        body += "<tr>";
                        body += "<td class='tg-b_body'>" + description + "</td>";
                        body += "<td class='tg-b_body'>" + qty + "</td>";
                        body += "<td class='tg-b_body' style='align:right'>" + removeDecimalFormat(amount) + "</td>";
                        body += "<td class='tg-b_body' style='align:right;'>" + removeDecimalFormat(grosamt_exp) + "</td>";
                        body += "</tr>";
                    }
                }
                return body;
            }

        }
        return {
            onRequest: onRequest,
        };
    });