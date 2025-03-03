/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try{
            function escapeXmlSymbols(input) {
                if (!input || typeof input !== "string") {
                    return input;
                }
                return input.replace(/&/g, "&amp;")
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/"/g, "&quot;")
                            .replace(/'/g, "&apos;");
            }
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
                // load PO
                var poRecord = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: recid,
                    isDynamic: false,
                });
                var subsidiari = poRecord.getValue('subsidiary');
                var currenc = poRecord.getValue('currency');
                if (currenc) {
                    var recCurrenc = record.load({
                        type: 'currency',
                        id: currenc,
                        isDynamic: false
                    });
                    var tlcCurr = recCurrenc.getValue('symbol');
                }
                log.debug('subsidiari', subsidiari)
                // load subsidiarie
                var arraySUbsidiaries = [46, 47, 48, 49]
                var isTampil = true
                var alva = false
                if (subsidiari == 46 || subsidiari == 47 || subsidiari == 48 || subsidiari == 49) {
                    alva = true
                }
                if (subsidiari) {
                    var subsidiariRec = record.load({
                        type: "subsidiary",
                        id: subsidiari,
                        isDynamic: false,
                    });
                    // load for header
                    var subsidiariId = subsidiari.id
                    var legalName = subsidiariRec.getValue('legalname');
                    var name = subsidiariRec.getValue('name');
                    var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
                    log.debug('addresSubsidiaries', addresSubsidiaries)
    
                    if (subsidiari == 47) { //froyo, bagian sites.google dihilangkan
                        var froyoAddressArr = addresSubsidiaries.split(' ')
                        var newFroyoAddr = []
                        for (let fr = 0; fr < (froyoAddressArr.length - 1); fr++) {
                            if (froyoAddressArr[fr] != "") {
                                newFroyoAddr.push(froyoAddressArr[fr])
                            }
                        }
                        var addressFroyo = newFroyoAddr.join(" ")
                    }
    
                    if (addresSubsidiaries.includes("<br>")) {
                        log.debug('masuk br')
                        addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                    }
                    if (addresSubsidiaries.includes('&')) {
                        addresSubsidiaries = addresSubsidiaries.replace(/&/g, '&amp;');
                    }
                    if (name) {
                        addresSubsidiaries = addresSubsidiaries.replace(name, "");
                    }
    
                    if (arraySUbsidiaries.includes(parseInt(subsidiari))) {
                        addresSubsidiaries = addresSubsidiaries.replace(/^\s*\S+\s*/, "").trim();
                        isTampil = false
                    }
    
                    var retEmailAddres = subsidiariRec.getValue('email');
                    var Npwp = subsidiariRec.getValue('federalidnumber');
                    var logo = subsidiariRec.getValue('logo');
                    var filelogo;
                    var urlLogo = '';
                    if (logo) {
                        filelogo = file.load({
                            id: logo
                        });
                        //get url
                        urlLogo = filelogo.url.replace(/&/g, "&amp;");
                    }
                }
                // load vendor
                var vendor_id = poRecord.getValue('entity');
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
                    for (var i = 0; i < count; i++) {
                        var subsidiary = vendorRecord.getSublistValue({
                            sublistId: 'submachine',
                            fieldId: 'subsidiary',
                            line: i
                        });
    
                        if (subsidiary == subsidiari) {
                            var balance = vendorRecord.getSublistValue({
                                sublistId: 'submachine',
                                fieldId: 'balance',
                                line: i
                            });
                            break;
                        }
                    }
                }
                if (balance) {
                    balance = format.format({
                        value: balance,
                        type: format.Type.CURRENCY
                    });
                }
                // PO data
                var tandId = poRecord.getValue('tranid');
                var POdate = poRecord.getValue('trandate');
                var terms = poRecord.getText('terms');
                var poNumber = poRecord.getValue('custbody7');
                var signedId = poRecord.getValue('custbody11');
                var nameSigned = ''
                if (signedId) {
                    var empRec = record.load({
                        type: "employee",
                        id: signedId
                    });
                    var fName = empRec.getValue('firstname');
                    var mName = empRec.getValue('middlename');
                    var lName = empRec.getValue('lastname');
                    var nameEmp = fName + " " + mName + " " + lName
                    if (nameEmp) {
                        nameSigned = nameEmp
                    }
                }
                //load sign
                log.debug('signedid',signedId)
                var signedUrl = '';
                if(signedId == 6701	){ //Iin zubaedah
                    var fileSign = file.load({
                        id: 82038
                    })
                    log.debug('filesign url', fileSign.url)
                    signedUrl = fileSign.url.replace(/&/g, "&amp;");
                } else if (signedId == 6703) { // tri s utami
                    var fileSign = file.load({
                        id: 82040	
                    })
                    log.debug('filesign url', fileSign.url)
                    signedUrl = fileSign.url.replace(/&/g, "&amp;");
                } else if(signedId == 6702){ // resty b
                    var fileSign = file.load({
                        id: 82039
                    })
                    log.debug('filesign url', fileSign.url)
                    signedUrl = fileSign.url.replace(/&/g, "&amp;");
                }
    
                // var subTotal = poRecord.getValue('subtotal') || 0;
                var poTotal = poRecord.getValue('total') || 0;
    
                var total = 0;
                var duedate = poRecord.getValue('duedate');
                var jobNumber = poRecord.getValue('custbody_abj_custom_jobnumber');
                if (jobNumber.includes('\\')) {
                    jobNumber = jobNumber.replace(/\\/g, '<br/>')
                }
                var subTotal = poRecord.getValue('subtotal') || 0;
    
                var totalWhTaxamount = 0;
                var totalWhTaxamountItem = 0;
                var totalWhTaxamountExp = 0;
                var whtaxammountItem = 0;
                var whtaxammountExp = 0;
                var whTaxCodetoPrint = ''
    
    
                var countItem = poRecord.getLineCount({
                    sublistId: 'item'
                });
                var taxRateList = [];
                if (countItem > 0) {
                    var taxpphList = [];
                    for (var i = 0; i < countItem; i++) {
                        var taxpph = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxrate',
                            line: i
                        });
                        whtaxammountItem = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxamount',
                            line: i
                        });
                        var amount = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });
                        var qty = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        });
                        var taxtRate = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        });
    
                        if (taxtRate !== 0 && taxRateList.indexOf(taxtRate) === -1) {
                            taxRateList.push(parseFloat(taxtRate));
                        }
                        var whTaxCodeI = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxcode',
                            line: i
                        });
    
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
                        var taxCode = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxcode',
                            line: i
                        })
                        var totalAmountPerline = amount;
    
                        // subTotal += totalAmountPerline
                        var tamount = whtaxammountItem
                        whtaxammountItem = Math.abs(tamount);
                        totalWhTaxamountItem += whtaxammountItem
    
                        if (taxpph && taxpphList.indexOf(taxpph) === -1) {
                            taxpphList.push(taxpph);
                        }
                    }
                }
                var countExpense = poRecord.getLineCount({
                    sublistId: 'expense'
                });
                if (countExpense > 0) {
                    var taxpphList = [];
                    for (var i = 0; i < countExpense; i++) {
                        var taxpph = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxrate_exp',
                            line: i
                        });
                        whtaxammountExp = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxamt_exp',
                            line: i
                        });
                        var amountExp = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: i
                        });
                        var whTaxCode = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'custcol_4601_witaxcode_exp',
                            line: i
                        });
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
                        var taxtRate = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'taxrate1',
                            line: i
                        });
                        log.debug('taxtRate', taxtRate)
                        if (taxtRate != 0 && taxRateList.indexOf(taxtRate) === -1) {
                            taxRateList.push(taxtRate);
                        }
                        var qtyExp = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'quantity',
                            line: i
                        });
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
                log.debug('taxRate Cek', taxtRate);
                var taxtotal = poRecord.getValue('taxtotal');
    
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
                    if (alva) {
                        subTotal = subTotal
                    } else {
                        subTotal = pembulatan(subTotal)
                    }
    
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
    
                if (taxtotal) {
                    if (alva) {
                        taxtotal = taxtotal
                    } else {
                        taxtotal = pembulatan(taxtotal)
                    }
    
                    taxtotal = format.format({
                        value: taxtotal,
                        type: format.Type.CURRENCY
                    });
                }
                if (total) {
                    if (alva) {
                        total = total
                    } else {
                        total = pembulatan(total)
                    }
    
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                }
                if (duedate) {
                    function sysDate() {
                        var date = duedate;
                        var tdate = date.getUTCDate();
                        var month = date.getUTCMonth() + 1; // jan = 0
                        var year = date.getUTCFullYear();
    
                        return tdate + '/' + month + '/' + year;
                    }
                    duedate = sysDate();
                }
                log.debug('PoDate', POdate);
                if (POdate) {
                    POdate = format.format({
                        value: POdate,
                        type: format.Type.DATE
                    });
                }
                var amountRecieved = Number(totalToCount) - Number(totalWHTaxToCount);
                if (amountRecieved) {
                    amountRecieved = pembulatan(amountRecieved);
                    amountRecieved = format.format({
                        value: amountRecieved,
                        type: format.Type.CURRENCY
                    });
                }
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '1%';
                var style = "";
                var footer = "";
                var pdfFile = null;
    
                log.debug('isTampil', isTampil)
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                if (subsidiari == 1) {
                    style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
                } else {
                    style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
                }
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_alva{align: left;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_legalName_Alva{align: left;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-jkm{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black; background-color:#eba134}";
                style += ".tg .tg-sisi{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black; background-color:#F8F40F}";
                style += ".tg .tg-alva{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black; background-color:#08B1FF}";
                style += ".tg .tg-froyo{align: left;font-size:12px;font-weight: bold; border-top: 3px solid black; border-bottom: 3px solid black; background-color:#0A65EC; color:#F9FAFC}";
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
                if (isTampil == false) {
                    body += "<tr>"
                    body += "<td style='width:45%;'></td>"
                    body += "<td style=''></td>"
                    body += "<td style=''></td>"
                    body += "</tr>"
                } else {
                    body += "<tr>"
                    body += "<td style='width:55%;'></td>"
                    body += "<td style='width:45%;'></td>"
                    // body += "<td style='width:0%;'></td>"
                    body += "</tr>"
                }
                body += "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='vertical-align:center; align:left;'><div style='display: flex; height:150px; width:150px; '><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body += "<td>";
    
                if (isTampil == true) {
                    body += "<p class='tg-headerrow_legalName' style='margin-top: 10px; margin-bottom: 10px;'>" + escapeXmlSymbols(legalName) + "</p>";
                    body += "<p class='tg-headerrow' style='margin-top: 1px; margin-bottom: 1px;'>" + escapeXmlSymbols(addresSubsidiaries) + "<br/>";
                    body += "" + escapeXmlSymbols(retEmailAddres) + "<br/>"
                    body += "NPWP : " + Npwp + "</p>";
                } else {
                    body += "<p class='tg-headerrow_legalName_Alva' style='margin-top: 10px; margin-bottom: 10px;'>" + escapeXmlSymbols(legalName) + "</p>";
                    if (subsidiari == 47) { //froyo
                        body += "<p class='tg-headerrow_alva' style='margin-top: 1px; margin-bottom: 1px;'>" + escapeXmlSymbols(addressFroyo) + "<br/>";
                    } else {
                        body += "<p class='tg-headerrow_alva' style='margin-top: 1px; margin-bottom: 1px;'>" + escapeXmlSymbols(addresSubsidiaries) + "<br/>";
                    }
                    body += "NPWP : " + Npwp + "</p>";
                }
    
                body += "</td>";
                if (isTampil == false) {
                    body += "<td style='font-size:18px; font-weight:bold; align:right;'>Purchase Order</td>";
                } else {
                    body += "<td style=''></td>"
                }
                body += "</tr>";
                body += "<tr style='height:30px;'>";
                body += "</tr>";
                body += "<tr>";
                body += "<td>";
                if (isTampil == true) {
                    body += "<p class='tg-headerrow_left'>" + escapeXmlSymbols(venName) + "<br/>"
                } else {
                    body += "<p class='tg-headerrow_left'><span style='font-size:13px; font-weight:bold'>" + escapeXmlSymbols(venName) + "</span><br/>"
                }
    
                body += "" + venAddres + "<br/>"
                if (isTampil == true) {
                    body += "NPWP : " + taxRegNo + "</p>"
                } else {
                    body += "</p>"
                }
    
                body += "</td>"
                // body += "<td></td>"
                body += "<td colspan='2'>"
                if (isTampil == true) {
                    body += "<p class='tg-headerrow_legalName'> Purchase Order # : " + tandId + "<br/>"
                    body += "" + POdate + "</p>"
                    body += "<p class='tg-headerrow' style='font-size:11px'> Terms : " + escapeXmlSymbols(terms) + "<br/>"
                    body += "Due Date :" + duedate + "</p>"
                } else {
                    log.debug('poNumber', poNumber)
                    body += "<p class='tg-headerrow_legalName' style='text-align: right; align:right;'> PO Number: " + poNumber + "<br/>";
                    body += "PO Date: " + POdate + "<br/></p>";
                }
    
                body += "</td>"
                body += "</tr>"
                body += "<tr style='height:30px;'>";
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";
    
                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;\">";
                body += "<tbody>";
                body += "<tr>"
                if (subsidiari == 46) {
                    body += "<td class='tg-alva' style='width:15%'> QTY </td>"
                    body += "<td class='tg-alva' style='width:30%'> DESCRIPTION </td>"
                    body += "<td class='tg-alva' style='align:right; width:18%'> UNIT PRICE (" + tlcCurr + ") </td>"
                    body += "<td class='tg-alva' style='align:right'> TAXED </td>"
                    body += "<td class='tg-alva' style='align:right; width:23%'> AMOUNT (" + tlcCurr + ") </td>"
                } else if (subsidiari == 47) {
                    body += "<td class='tg-froyo' style='width:15%'> QTY </td>"
                    body += "<td class='tg-froyo' style='width:30%'> DESCRIPTION </td>"
                    body += "<td class='tg-froyo' style='align:right; width:18%'> UNIT PRICE (" + tlcCurr + ") </td>"
                    body += "<td class='tg-froyo' style='align:right'> TAXED </td>"
                    body += "<td class='tg-froyo' style='align:right; width:23%'> AMOUNT (" + tlcCurr + ") </td>"
                } else if (subsidiari == 48) {
                    body += "<td class='tg-jkm' style='width:15%'> QTY </td>"
                    body += "<td class='tg-jkm' style='width:30%'> DESCRIPTION </td>"
                    body += "<td class='tg-jkm' style='align:right; width:18%'> UNIT PRICE (" + tlcCurr + ") </td>"
                    body += "<td class='tg-jkm' style='align:right'> TAXED </td>"
                    body += "<td class='tg-jkm' style='align:right; width:23%'> AMOUNT (" + tlcCurr + ") </td>"
                } else if (subsidiari == 49) {
                    body += "<td class='tg-sisi' style='width:15%'> QTY </td>"
                    body += "<td class='tg-sisi' style='width:30%'> DESCRIPTION </td>"
                    body += "<td class='tg-sisi' style='align:right; width:18%'> UNIT PRICE (" + tlcCurr + ") </td>"
                    body += "<td class='tg-sisi' style='align:right'> TAXED </td>"
                    body += "<td class='tg-sisi' style='align:right; width:23%'> AMOUNT (" + tlcCurr + ") </td>"
                } else {
                    body += "<td class='tg-head_body' style='width:15%'> QTY </td>"
                    body += "<td class='tg-head_body' style='width:30%'> DESCRIPTION </td>"
                    body += "<td class='tg-head_body' style='align:right; width:18%'> UNIT PRICE (" + tlcCurr + ") </td>"
                    body += "<td class='tg-head_body' style='align:right'> TAXED </td>"
                    body += "<td class='tg-head_body' style='align:right; width:23%'> AMOUNT (" + tlcCurr + ") </td>"
                }
    
                body += "</tr>"
                body += getPOItem(context, poRecord, alva);
                body += getPOExpense(context, poRecord, alva);
                body += "<tr>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-f_body' colspan='2'>SUBTOTAL</td>"
                body += "<td class='tg-f_body'>" + (alva ? subTotal : removeDecimalFormat(subTotal)) + "</td>"
                body += "</tr>"
                log.debug('taxRateList', taxRateList)
                if (taxRateList != '') {
                    log.debug('taxtotal', taxtotal)
                    body += "<tr>"
                    body += "<td class='tg-headerrow_left'></td>"
                    body += "<td class='tg-headerrow_left'></td>"
                    body += "<td class='tg-f_body'></td>"
                    body += "<td class='tg-f_body'>VAT </td>"
                    body += "<td class='tg-f_body'>" + (alva ? taxtotal : removeDecimalFormat(taxtotal)) + "</td>"
                    body += "</tr>"
                }
    
                body += "<tr>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-f_body'></td>"
                body += "<td class='tg-f_body'>TOTAL</td>"
                body += "<td class='tg-f_body'>" + (alva ? total : removeDecimalFormat(total)) + "</td>"
                body += "</tr>"
    
                if (whTaxCodetoPrint) {
                    body += "<tr>"
                    body += "<td class='tg-headerrow_left'></td>"
                    body += "<td class='tg-headerrow_left'></td>"
                    body += "<td style='align: right;font-size:12px;border-bottom: solid black 2px;' colspan='2'>" + whTaxCodetoPrint + "</td>"
                    body += "<td class='tg-f_body'>" + (alva ? totalWhTaxamount : removeDecimalFormat(totalWhTaxamount)) + "</td>"
                    body += "</tr>"
                }
    
                body += "<tr>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td class='tg-headerrow_left'></td>"
                body += "<td style='align: right;font-size:14px;border-top: solid black 2px; font-weight: bold;' colspan='2'>BALANCE DUE</td>"
                body += "<td style='align: right;font-size:15px;border-top: solid black 2px; font-weight: bold;'>" + (alva ? amountRecieved : removeDecimalFormat(amountRecieved)) + "</td>"
                body += "</tr>"
    
    
    
    
                body += "<tr style='height:30px;'></tr>"
                if (alva) {
                    body += "<tr>"
                    body += "<td style='margin:4%;' colspan='2'>Signed By</td>"
                    body += "</tr>"
    
                    body += "<tr style=''>"
                    log.debug('signedUrl', signedUrl)
                    if(signedId == 6701	){ //iin
                        body += "<td class='tg-headerlogo' style='width:70%;vertical-align:center; align:left;'><div style='display: flex; height:50px; width:50px; margin-left:10px;'><img class='' style='width:15%; height:15%; margin-bottom:-12px' src= '"  + (signedUrl) + "' ></img></div></td>";
                    } else if(signedId == 6702){ //resti
                        body += "<td class='tg-headerlogo' style='width:70%;vertical-align:center; align:left;' colspan='3' ><div style='display: flex; height:50px; width:50px; margin-bottom:10px; margin-left:10px;'><img class='' style='width:35%; height:35%; margin-left:15px' src= '"  + (signedUrl) + "' ></img></div></td>";
                    } else {
                        if(signedUrl){
                            body += "<td class='tg-headerlogo' style='width:70%;vertical-align:center; align:left;'><div style='display: flex; height:50px; width:50px; margin-left:10px;'><img class='' style='width:15%; height:15%;' src= '"  + (signedUrl) + "' ></img></div></td>";
                        }else{
                            body += "<td class='tg-headerlogo' style='height:50px; vertical-align:center;'></td>"
                        }
                       
                    }
                    body += "</tr>"
                    if (nameSigned) {
                        body += "<tr>"
                        body += "<td style='margin:3%;' colspan='2'>( " + escapeXmlSymbols(nameSigned) + " )</td>"
                        body += "</tr>"
                    } else {
                        body += "<tr>"
                        body += "<td style='margin:3%;' colspan='2'>( __________ )</td>"
                        body += "</tr>"
                    }
    
    
                }
                body += "<tr>"
                body += "<td style='align:left; font-size:14px; font-weight: bold;' colspan='5'>" + jobNumber + "</td>"
                body += "</tr>"
                body += "</tbody>";
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
    
            function getPOItem(context, poRecord, alva) {
                log.debug('masuk fungsing getItem')
                var itemCount = poRecord.getLineCount({
                    sublistId: 'item'
                });
    
                if (itemCount > 0) {
                    var body = "";
                    for (var index = 0; index < itemCount; index++) {
                        var qty = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: index
                        });
                        var description = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'description',
                            line: index
                        });
                        if (description.includes('\\')) {
                            description = description.replace(/\\/g, '<br/>');
                        }
                        var unit = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            line: index
                        });
                        var rate;
                        // var rateBef = poRecord.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'amount',
                        //     line: index
                        // });
                        var ammount = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: index
                        });
                        // if(rateBef){
                        //     rate = rateBef
                        // }else{
                        //     rate = Number(ammount) / Number(qty)
                        // }
                        rate = Number(ammount) / Number(qty)
                        if (rate) {
                            if (alva) {
                                rate = rate
                            } else {
                                rate = pembulatan(rate)
                            }
    
                            rate = format.format({
                                value: rate,
                                type: format.Type.CURRENCY
                            });
                        }
    
                        var taxAmt = poRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'tax1amt',
                            line: index
                        });
                        if (taxAmt) {
                            if (alva) {
                                taxAmt = taxAmt
                            } else {
                                taxAmt = pembulatan(taxAmt)
                            }
    
                            taxAmt = format.format({
                                value: taxAmt,
                                type: format.Type.CURRENCY
                            });
                        }
                        if (ammount) {
                            if (alva) {
                                ammount = ammount
                            } else {
                                ammount = pembulatan(ammount)
                            }
    
                            ammount = format.format({
                                value: ammount,
                                type: format.Type.CURRENCY
                            });
                        }
                        if (alva) {
                            body += "<tr>";
                            body += "<td class='tg-b_body'>" + qty + " - " + unit + "Pcs</td>";
                            body += "<td class='tg-b_body'>" + escapeXmlSymbols(description) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>" + rate + "</td>";
                            body += "<td class='tg-b_body' style='align:right'> X </td>";
                            body += "<td class='tg-b_body' style='align:right;'>" + ammount + "</td>";
                            body += "</tr>";
                        } else {
                            body += "<tr>";
                            body += "<td class='tg-b_body'>" + qty + " - " + unit + "Pcs</td>";
                            body += "<td class='tg-b_body'>" + escapeXmlSymbols(description) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>" + removeDecimalFormat(rate) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'> X </td>";
                            body += "<td class='tg-b_body' style='align:right;'>" + removeDecimalFormat(ammount) + "</td>";
                            body += "</tr>";
                        }
    
                    }
                    return body;
                }
    
            }
            function getPOExpense(context, poRecord, alva) {
                var expCont = poRecord.getLineCount({
                    sublistId: 'expense'
                });
                if (expCont > 0) {
                    var body = "";
                    for (var index = 0; index < expCont; index++) {
                        var qty = 1;
                        var description = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'memo',
                            line: index
                        });
                        if (description.includes('\\')) {
                            description = description.replace(/\\/g, '<br/>');
                        }
                        var amount = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'amount',
                            line: index
                        });
                        if (amount) {
                            var amountBef = amount
                            if (alva) {
                                amount = amount
                            } else {
                                amount = pembulatan(amount)
                            }
    
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                        }
                        var taxamt_exp = poRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'tax1amt',
                            line: index
                        });
                        if (taxamt_exp) {
                            if (alva) {
                                taxamt_exp = taxamt_exp
                            } else {
                                taxamt_exp = pembulatan(taxamt_exp)
                            }
    
                            taxamt_exp = format.format({
                                value: taxamt_exp,
                                type: format.Type.CURRENCY
                            });
                        }
                        var grosamt_exp = Number(amountBef) * Number(qty)
                        if (grosamt_exp) {
                            if (alva) {
                                grosamt_exp = grosamt_exp
                            } else {
                                grosamt_exp = pembulatan(grosamt_exp)
                            }
    
                            grosamt_exp = format.format({
                                value: grosamt_exp,
                                type: format.Type.CURRENCY
                            });
                        }
                        if (alva) {
                            body += "<tr>";
                            body += "<td class='tg-b_body'>" + qty + "</td>";
                            body += "<td class='tg-b_body'>" + escapeXmlSymbols(description) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>" + amount + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>X</td>";
                            body += "<td class='tg-b_body' style='align:right;'>" + grosamt_exp + "</td>";
                            body += "</tr>";
                        } else {
                            body += "<tr>";
                            body += "<td class='tg-b_body'>" + qty + "</td>";
                            body += "<td class='tg-b_body'>" + escapeXmlSymbols(description) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>" + removeDecimalFormat(amount) + "</td>";
                            body += "<td class='tg-b_body' style='align:right'>X</td>";
                            body += "<td class='tg-b_body' style='align:right;'>" + removeDecimalFormat(grosamt_exp) + "</td>";
                            body += "</tr>";
                        }
    
                    }
                    return body;
                }
    
            }
        }catch(e){
            log.debug('error', e)
        }
       
        return {
            onRequest: onRequest,
        };
    });