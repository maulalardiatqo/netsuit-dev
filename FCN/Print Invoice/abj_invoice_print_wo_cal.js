/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try {
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
    
            function decimalRemove(number) {
                if (number != 0) {
                    return number.substring(0, number.length - 3);
                } else {
                    return "0.00";
                }
            }
            function removeDecimalFormat(number) {
                return number.toString().substring(0, number.toString().length - 3);
            }
            function removeDuplicates(array) {
                return array.filter((value, index, self) => {
                    return self.indexOf(value) === index;
                });
            }
            function numberWithCommas(x) {
                x = x.toString();
                var pattern = /(-?\d+)(\d{3})/;
                while (pattern.test(x)) x = x.replace(pattern, "$1,$2");
                return x;
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

                // load SO
                var invoiceRecord = record.load({
                    type: "invoice",
                    id: recid,
                    isDynamic: false,
                });
                var currenc = invoiceRecord.getValue('currency');
                if (currenc) {
                    var recCurrenc = record.load({
                        type: 'currency',
                        id: currenc,
                        isDynamic: false
                    });
                    var tlcCurr = recCurrenc.getValue('symbol');

                }

                var subsidiari = invoiceRecord.getValue('subsidiary');
                // load subsidiarie
                if (subsidiari) {
                    var subsidiariRec = record.load({
                        type: "subsidiary",
                        id: subsidiari,
                        isDynamic: false,
                    });
                    // load for header
                    var legalName = subsidiariRec.getValue('legalname');
                    var addresSubsidiaries = subsidiariRec.getValue('mainaddress_text');
                    var name = subsidiariRec.getValue('name');
                    var retEmailAddres = subsidiariRec.getValue('email');
                    var Npwp = subsidiariRec.getValue('federalidnumber');

                    var bankName = subsidiariRec.getValue('custrecord_fcn_sub_bank_name');
                    var swiftCode = subsidiariRec.getValue('custrecord_fcn_sub_swift_code');
                    var bankBranch = subsidiariRec.getValue('custrecord_fcn_sub_bank_branch');
                    var accountNo = subsidiariRec.getValue('custrecord_fcn_sub_account_number');
                    var bankName2 = subsidiariRec.getValue('custrecord_fcn_sub_bank_name2');
                    var swiftCode2 = subsidiariRec.getValue('custrecord_fcn_sub_swift_code2');
                    var bankBranch2 = subsidiariRec.getValue('custrecord_fcn_sub_bank_branch2');
                    var accountNo2 = subsidiariRec.getValue('custrecord_fcn_sub_account_number2');

                    var paymentReferences = subsidiariRec.getValue('custrecord_fcn_sub_payment_reference');
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

                    if (addresSubsidiaries.includes("<br>")) {
                        addresSubsidiaries = addresSubsidiaries.replace(/<br>/g, "");
                    }
                    if (name) {
                        addresSubsidiaries = addresSubsidiaries.replace(name, "");
                    }
                }

                // load vendor
                var customer_id = invoiceRecord.getValue('entity');
                if (customer_id) {
                    var customerRecord = record.load({
                        type: "customer",
                        id: customer_id,
                        isDynamic: false,
                    });
                    var isperson = customerRecord.getValue('isperson');
                    var custName = ''
                    if (isperson == 'T') {
                        var firstname = customerRecord.getValue('firstname') || ''
                        var middleName = customerRecord.getValue('middlename') || ''
                        var lastname = customerRecord.getValue('lastname') || ''
                        custName = firstname + ' ' + middleName + ' ' + lastname

                    } else {
                        var check = customerRecord.getValue('isautogeneratedrepresentingentity');


                        if (check === true) {
                            custName = customerRecord.getValue('comments')
                        } else {
                            custName = customerRecord.getValue('companyname');
                        }
                    }
                    var custAddres = customerRecord.getValue('billaddr1');
                    if (custAddres === '') {

                        custAddres = customerRecord.getValue('defaultaddress');

                    }
                    if (custAddres.includes('&')) {
                        custAddres = custAddres.replace(/&/g, 'dan');
                    }
                    var custEmail = customerRecord.getValue('email');
                    var taxRegNo = customerRecord.getValue('vatregnumber');
                    var count = customerRecord.getLineCount({
                        sublistId: 'submachine'
                    });

                    for (var i = 0; i < count; i++) {
                        var subsidiary = customerRecord.getSublistValue({
                            sublistId: 'submachine',
                            fieldId: 'subsidiary',
                            line: i
                        });

                        if (subsidiary == subsidiari) {
                            var balance = customerRecord.getSublistValue({
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
                    balance = removeDecimalFormat(balance);
                }
                // PO data
                var tandId = invoiceRecord.getValue('tranid');
                var InvDate = invoiceRecord.getValue('trandate');
                var memo = invoiceRecord.getValue('memo');
                var quoteNumber = invoiceRecord.getValue('custbody_abj_quotation_from_sales')
                var terms = invoiceRecord.getText('terms');
                var fakturPajak = invoiceRecord.getValue('custbody_fcn_faktur_pajak');
                var subTotal = invoiceRecord.getValue('subtotal') || 0;
                var taxtotal = invoiceRecord.getValue('taxtotal') || 0;
                var taxtotalCount = 0;
                var poTotal = invoiceRecord.getValue('total') || 0;
                var total = 0;
                var amountReceive = 0;
                var duedate = invoiceRecord.getValue('duedate');
                var prosentDiscount = invoiceRecord.getValue('discountrate');
                var discount = invoiceRecord.getValue('discounttotal') || 0;
                var subTotal2 = Number(subTotal) + Number(discount);
                var jobNumber = invoiceRecord.getValue('custbody_abj_custom_jobnumber');
                if (jobNumber) {
                    if (jobNumber.includes('\\')) {
                        jobNumber = jobNumber.replace(/\\/g, '<br/>');
                    }
                }

                var otehrRefNum = invoiceRecord.getValue('otherrefnum');
                discount = Math.abs(discount);
                prosentDiscount = Math.abs(prosentDiscount);
                var totalWhTaxamount = 0;
                var totalWhTaxamountItem = 0;
                var whtaxammountItem = 0;
                var whTaxCodetoPrint = ''

                var countItem = invoiceRecord.getLineCount({
                    sublistId: 'item'
                });
                var taxText = []
                if (countItem > 0) {
                    var taxpphList = [];
                    for (var i = 0; i < countItem; i++) {
                        var taxpph = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxrate',
                            line: i
                        });
                        whtaxammountItem = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_4601_witaxamount',
                            line: i
                        });
                        var taxItem = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxrate1',
                            line: i
                        });
                        if(taxItem){
                            taxText.push(taxItem)
                        }
                        var ammount = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });
                        var whTaxCodeI = invoiceRecord.getSublistValue({
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
                        var qty = invoiceRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i
                        })
                        var tamount = whtaxammountItem
                        whtaxammountItem = Math.abs(tamount);
                        totalWhTaxamountItem += whtaxammountItem

                        if (taxpph) {
                            if (taxpphList.indexOf(taxpph) == -1) {
                                taxpphList.push(taxpph);
                            }
                        }
                    }

                }
                var taxTextConvert = [...new Set(taxText)].map(item => `${item}%`).join(", ");
                log.debug('taxTextConvert', taxTextConvert);
                var whtaxToCount = whtaxammountItem;
                totalWhTaxamount = totalWhTaxamountItem;
                if (taxpphList.length > 0) {
                    var taxpphToPrint = taxpphList.join(' & ');
                }
                var subBefore = subTotal
                var taxtotalBefor = taxtotal
                total = Number(subTotal2) + Number(taxtotalBefor);
                amountReceive = total
                if (taxpphToPrint) {
                    amountReceive = amountReceive - totalWhTaxamount;
                }
                if (totalWhTaxamount) {
                    totalWhTaxamount = pembulatan(totalWhTaxamount)
                    totalWhTaxamount = format.format({
                        value: totalWhTaxamount,
                        type: format.Type.CURRENCY
                    });
                    totalWhTaxamount = removeDecimalFormat(totalWhTaxamount)
                }
                if (amountReceive) {
                    amountReceive = pembulatan(amountReceive)
                    amountReceive = format.format({
                        value: amountReceive,
                        type: format.Type.CURRENCY
                    });
                    amountReceive = removeDecimalFormat(amountReceive)
                }
                if (poTotal) {
                    poTotal = pembulatan(poTotal)
                    poTotal = format.format({
                        value: poTotal,
                        type: format.Type.CURRENCY
                    });
                    poTotal = removeDecimalFormat(poTotal)
                }
                if (discount) {
                    discount = pembulatan(discount);
                    discount = format.format({
                        value: discount,
                        type: format.Type.CURRENCY
                    });
                    discount = removeDecimalFormat(discount)
                }

                if (subTotal) {
                    subTotal = pembulatan(subTotal);
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                    subTotal = removeDecimalFormat(subTotal)
                }

                if (taxtotal) {
                    taxtotal = pembulatan(taxtotal);
                    taxtotal = format.format({
                        value: taxtotal,
                        type: format.Type.CURRENCY
                    });
                    taxtotal = removeDecimalFormat(taxtotal)
                }

                if (total) {
                    total = pembulatan(total)
                    total = format.format({
                        value: total,
                        type: format.Type.CURRENCY
                    });
                    total = removeDecimalFormat(total)
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
                if (InvDate) {
                    InvDate = format.format({
                        value: InvDate,
                        type: format.Type.DATE
                    });
                }
                var itemCount = invoiceRecord.getLineCount({
                    sublistId: "item",
                });
                var totalDiscount = 0
                var totalCost = 0
                if (itemCount > 0) {
                    for (var index = 0; index < itemCount; index++) {
                        var discLine = invoiceRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "custcol_abj_disc_line",
                            line: index,
                        }) || 0
                        totalDiscount += parseFloat(discLine)
                        var itemId = invoiceRecord.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: index,
                        });
                        if (itemId != '2880') {
                            var itemPrice = invoiceRecord.getSublistValue({
                                sublistId: "item",
                                fieldId: "amount",
                                line: index,
                            }) || 0;
                            totalCost += parseFloat(itemPrice)
                        }

                    }
                }
                //added by kurnia
                totalCost = pembulatan(totalCost);
                //
                var currSymb
                var currency = invoiceRecord.getValue('currency');
                if (currency) {
                    var currRec = record.load({
                        type: "currency",
                        id: currency,
                        isDynamic: false,
                    });
                    var symb = currRec.getValue('displaysymbol');
                    log.debug('symb', symb)
                    if (symb) {
                        currSymb = symb
                    }
                }
                var discountHeader = invoiceRecord.getValue("discountrate") || 0;

                log.debug('discountheader', discountHeader)
                discountHeader = discountHeader.toString();
                if (discountHeader.includes('%')) {
                    log.debug('mengandung prosent')
                    var ubahProsent = parseFloat(discountHeader.replace('%', ''));
                    var ubahmin = Math.abs(ubahProsent);
                    var hitungUlang = parseFloat(totalCost) * parseFloat(ubahmin) / 100
                    log.debug('hitungUlang', hitungUlang);
                    discountHeader = pembulatan(hitungUlang)
                }
                totalDiscount = parseFloat(totalDiscount) + parseFloat(discountHeader)
                var taxTotalRate = (parseFloat(totalCost) - parseFloat(totalDiscount)) * 11 / 100;
                var customForm = invoiceRecord.getValue('customform');
                var createdFrom = invoiceRecord.getText('createdfrom')
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '1%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                if (jobNumber) {
                    if (jobNumber.includes('&')) {
                        jobNumber = jobNumber.replace(/&/g, '&amp;');
                    }
                }

                var contPerson = invoiceRecord.getValue('custbody_abj_cp_name');
                var cpEmail = invoiceRecord.getValue('custbody_abj_cp_email');
                var cpPhone = invoiceRecord.getValue('custbody_abj_cp_phone');


                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                if (subsidiari == 1) {
                    style += ".tg .tg-img-logo{width:150px; height:111px; object-vit:cover;}";
                } else {
                    style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
                }
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: center;font-size:10px;font-weight: bold; border-top: 1px solid black; border-bottom: 1px solid black; color:#fcfafa}";
                style += ".tg .tg-b_body{align: left;font-size:10px;}";
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
                body += "<p class='tg-headerrow_legalName' style='margin-top: 10px; margin-bottom: 10px;'>" + escapeXmlSymbols(legalName) + "</p>";
                body += "<p class='tg-headerrow' style='margin-top: 1px; margin-bottom: 1px;'>" + escapeXmlSymbols(addresSubsidiaries) + "<br/>";
                body += "" + escapeXmlSymbols(retEmailAddres) + "<br/>"
                body += "NPWP : " + escapeXmlSymbols(Npwp) + "</p>";
                body += "</td>";
                body += "</tr>";
                body += "<tr style='height:5px;'>";
                body += "</tr>";
                body += "<tr>";
                body += "<td>";
                body += "<p class='tg-headerrow_left'>" + escapeXmlSymbols(custName) + "<br/>"
                body += "NPWP : " + escapeXmlSymbols(taxRegNo) + "</p>"
                body += "</td>"
                body += "<td>"
                body += "<p class='tg-headerrow_legalName'> Invoice # : " + escapeXmlSymbols(tandId) + "<br/>"
                body += "" + InvDate + "</p>"
                body += "<p class='tg-headerrow' style='font-size:11px'> Terms : " + escapeXmlSymbols(terms) + "<br/>"
                body += "Due Date :" + escapeXmlSymbols(duedate) + "</p>"
                // body+= "<p class='tg-headerrow_Total'> Rp."+ balance + "</p>"
                body += "</td>"
                body += "</tr>"
                body += "<tr>";
                body += "<td>CONTACT PERSON : " + escapeXmlSymbols(contPerson) + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td>EMAIL : " + escapeXmlSymbols(cpEmail) + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td>PHONE : " + escapeXmlSymbols(cpPhone) + "</td>"
                body += "</tr>";
                body += "<tr style='height:10px;'>";
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";
                if (customForm == 152) {
                    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
                    body += "<tbody>";
                    body += "<tr>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> No </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='30%'> Description </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='20%'> Complexity Level </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='21%'> Item Price </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> QTY </td>";
                    body += "<td class='tg-head_body' style='border-right: 1px solid black; border-left: 1px solid black; background-color:#757575'  width='24%'> Total Costs </td>";
                    body += "</tr>";
                    body += getPOItemRateCard(context, invoiceRecord);
                    body += "<tr>";
                    body += "<td style='border-top: 1px solid black;' colspan='6'></td>";
                    body += "</tr>";

                    body += "<tr style='height:20px;'></tr>";
                    body += "</tbody>";
                    body += "</table>";

                    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
                    body += "<tbody>";

                    body += "<tr>";
                    body += "<td style='width:55%'></td>"
                    body += "<td style='width:5%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "</tr>";

                    body += "<tr>";

                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>TOTAL COST</td>"
                    body += "<td style='align:right'>" + currSymb + ". " + numberWithCommas(totalCost) + "</td>"
                    body += "</tr>";
                    log.debug('totalDiscount', totalDiscount)
                    if (totalDiscount != 0 || totalDiscount != '0') {
                        body += "<tr>";
                        body += "<td></td>"
                        body += "<td></td>"
                        body += "<td style='align:right'>TOTAL DISCOUNT</td>"
                        body += "<td style='align:right'>Rp. (" + numberWithCommas(Math.abs(totalDiscount)) + ")</td>"
                        body += "</tr>";

                        body += "<tr>";
                        body += "<td></td>"
                        body += "<td></td>"
                        body += "<td style='align:right'>SUB TOTAL</td>"

                        body += "<td style='align:right'>Rp. " + numberWithCommas(subTotal2) + "</td>"
                        body += "</tr>";
                    }

                    body += "<tr>";
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>VAT"+escapeXmlSymbols(taxTextConvert)+"</td>"
                    body += "<td style='align:right'>Rp. " + numberWithCommas(taxtotal) + "</td>"
                    // body += "<td style='align:right'>Rp. "+numberWithCommas(taxTotalRate)+"</td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>GRAND TOTAL</td>"
                    body += "<td style='align:right'>Rp. " + numberWithCommas(total) + "</td>"
                    body += "</tr>";


                    body += "</tbody>";
                    body += "</table>";
                } else {
                    body += "<table class='tg' style=\"table-layout:fixed;\">";
                    body += "<thead>";
                    body += "<tr>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='5%'> No </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='40%'> Description </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='25%'> Item Price </td>";
                    body += "<td class='tg-head_body' style='border-left: 1px solid black; background-color:#757575' width='10%'> QTY </td>";
                    body += "<td class='tg-head_body' style='border-right: 1px solid black; border-left: 1px solid black; background-color:#757575'  width='25%'> Total Costs </td>";
                    body += "</tr>";
                    body += "</thead>";
                    body += "<tbody>";
                    body += getPOItem(context, invoiceRecord);
                    body += "<tr>";
                    body += "<td style='border-top: 1px solid black;' colspan='5'></td>";
                    body += "</tr>";

                    body += "<tr style='height:20px;'></tr>";
                    body += "</tbody>";
                    body += "</table>";

                    body += '<table class=\'tg\' width="100%" style="table-layout:fixed;">';
                    body += "<tbody>";

                    body += "<tr>";
                    body += "<td style='width:55%'></td>"
                    body += "<td style='width:5%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "</tr>";

                    body += "<tr>";

                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>TOTAL COST</td>"
                    body += "<td style='align:right'>" + currSymb + ". " + numberWithCommas(totalCost) + "</td>"
                    body += "</tr>";
                    log.debug('totalDiscount', totalDiscount)
                    if (totalDiscount != 0 || totalDiscount != '0') {
                        body += "<tr>";
                        body += "<td></td>"
                        body += "<td></td>"
                        body += "<td style='align:right'>TOTAL DISCOUNT</td>"
                        body += "<td style='align:right'>Rp. (" + numberWithCommas(Math.abs(totalDiscount)) + ")</td>"
                        body += "</tr>";

                        body += "<tr>";
                        body += "<td></td>"
                        body += "<td></td>"
                        body += "<td style='align:right'>SUB TOTAL</td>"

                        body += "<td style='align:right'>" + currSymb + ". " + numberWithCommas(subTotal2) + "</td>"
                        body += "</tr>";
                    }




                    body += "<tr>";
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>VAT</td>"
                    body += "<td style='align:right'>" + currSymb + ". " + numberWithCommas(taxtotal) + "</td>"
                    // body += "<td style='align:right'>Rp. "+numberWithCommas(taxTotalRate)+"</td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:right'>GRAND TOTAL</td>"
                    body += "<td style='align:right'>" + currSymb + ". " + numberWithCommas(total) + "</td>"
                    body += "</tr>";


                    body += "</tbody>";
                    body += "</table>";
                }

                if (subsidiari == 18 || subsidiari == 17 || subsidiari == 35 || subsidiari == 15) { //Maleo, Finch, FTW, Flock
                    body += "<table class='tg' width=\"100%\">";
                    body += "<tr style='height:30px;'></tr>";
                    body += "<tr>"
                    body += "<td style='width:24%'></td>"
                    body += "<td style='width:1%'></td>"
                    body += "<td style='width:25%'></td>"
                    body += "<td style='width:24%'></td>"
                    body += "<td style='width:1%'></td>"
                    body += "<td style='width:25%'></td>"
                    body += "</tr>"

                    body += "<tr>";
                    body += "<td style='align:left; font-weight: bold;' colspan='2'>Other Information</td>";
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='align:left;'>Quote </td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;' colspan='4'>" + escapeXmlSymbols(quoteNumber) + "</td>";
                    body += "</tr>";

       //             body += "<tr>";
       //             body += "<td style='align:left;'>Created From</td>";
       //             body += "<td>:</td>";
       //             body += "<td style='align:left;' colspan='4'>" + createdFrom + "</td>";
       //             body += "</tr>";

                    body += "<tr>";
                    body += "<td style='align:left;'>PO# </td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;' colspan='4'>" + escapeXmlSymbols(otehrRefNum) + "</td>";
                    body += "</tr>";


                    body += "<tr style='height: 15px;'></tr>"
                    body += "<tr>";
                    body += "<td style='align:left; font-weight: bold;'>Payment Detail</td>";
                    body += "</tr>";
                    body += "<tr>";
                    body += "<td style='align:left;'>Account Name</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;' colspan='4'>" + escapeXmlSymbols(legalName) + "</td>";
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='align:left;'>Payment References</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;' colspan='4'>" + escapeXmlSymbols(tandId) + "</td>";
                    body += "</tr>";

                    body += "<tr style='height: 12px;'></tr>"


                    body += "<tr>";
                    body += "<td style='align:left;'>Bank Name</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankName) + "</td>";
                    body += "<td style='align:left;'>Bank Name</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankName2) + "</td>";
                    body += "</tr>";
                    
                    body += "<tr>";
                    body += "<td style='align:left;'>Bank/Swift Code</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(swiftCode) + "</td>";
                    body += "<td style='align:left;'>Bank/Swift Code</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(swiftCode2) + "</td>";
                    body += "</tr>";
                    
                    body += "<tr>";
                    body += "<td style='align:left;'>Bank Branch</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankBranch )+ "</td>";
                    body += "<td style='align:left;'>Bank Branch</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankBranch2) + "</td>";
                    body += "</tr>";


                    body += "<tr>";
                    body += "<td style='align:left;'>Account Number</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(accountNo) + "</td>";
                    body += "<td style='align:left;'>Account Number</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(accountNo2) + "</td>";
                    body += "</tr>";

                    body += "<tr style='height: 50px;'></tr>"
                    body += "<tr>";
                    body += "<td style='align:left; font-size:14px; font-weight: bold;' colspan='5'>" + escapeXmlSymbols(jobNumber) + "</td>";
                    body += "</tr>";


                    body += "</table>";
                } else {

                    body += "<table class='tg' width=\"100%\">";
                    body += "<tr style='height:30px;'></tr>";
                    body += "<tr>"
                    body += "<td style='width:35%'></td>"
                    body += "<td style='width:1%'></td>"
                    body += "<td style='width:64%'></td>"
                    body += "</tr>"
    
                    body += "<tr>";
                    body += "<td style='align:left; font-weight: bold;' colspan='2'>Other Information</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Quote </td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(quoteNumber) + "</td>";
                    body += "</tr>";
    
     //               body += "<tr>";
     //               body += "<td style='align:left;'>Created From</td>";
     //               body += "<td>:</td>";
     //               body += "<td style='align:left;'>" + createdFrom + "</td>";
     //               body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>PO# </td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(otehrRefNum) + "</td>";
                    body += "</tr>";
    
    
    
                    body += "<tr>";
                    body += "<td style='align:left; font-weight: bold;'>Payment Detail</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Bank Name</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankName) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Bank Branch</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(bankBranch) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Bank/Swift Code</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(swiftCode) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Account Name</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(legalName) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Account Number</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(accountNo) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left;'>Payment References</td>";
                    body += "<td>:</td>";
                    body += "<td style='align:left;'>" + escapeXmlSymbols(tandId) + "</td>";
                    body += "</tr>";
    
                    body += "<tr>";
                    body += "<td style='align:left; font-size:14px; font-weight: bold;' colspan='5'>" + escapeXmlSymbols(jobNumber) + "</td>";
                    body += "</tr>";
    
    
                    body += "</table>";
                }


                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
                footer += "</tr>";
                footer += "</tbody>";
                footer += "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr class='tg-foot'>";
                footer += "<td style='align:left'>Sales Invoice # " + escapeXmlSymbols(tandId) + "</td>"
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";

                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }

            function generateTableHTMLSO(items) {
                let html = "";
                let no = 1;
                items.forEach((item, index) => {
                    // html += `<tr>
                    //             <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
                    //             <td class='tg-b_body'>${item.description}</td>
                    //             <td class='tg-b_body' align="right">Rp. ${numberWithCommas(item.itemPrice)}</td>
                    //             <td class='tg-b_body' style='align:center'>${item.quantity}</td>
                    //             <td class='tg-b_body' style="border-right: 1px solid black; align:right;">Rp. ${removeDecimalFormat(item.totalCost)}</td>
                    //         </tr>`;
                    //added by kurnia
                    html += `<tr>
                                <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
                                <td class='tg-b_body'>${escapeXmlSymbols(item.description)}</td>
                                <td class='tg-b_body' align="right">${item.currSymb}. ${(numberWithCommas(item.itemPrice))}</td>
                                <td class='tg-b_body' style='align:center'>${item.quantity}</td>
                                <td class='tg-b_body' style="border-right: 1px solid black; align:right;">${item.currSymb}. ${numberWithCommas(item.totalCost)}</td>
                            </tr>`;
                    //

                    if (item.discLine && item.discLine != 0) {
                        html += `<tr>
                                    <td class='tg-b_body' style='border-left: 1px solid black'></td>
                                    <td class='tg-b_body' style=''>[Discount - ${item.prosDiscLine}%]</td>
                                    <td class='tg-b_body' colspan="2"></td>
                                    <td class='tg-b_body' style='border-right: 1px solid black; align:right;'>${item.currSymb}. (${numberWithCommas(item.discLine)})</td>
                                </tr>`;
                    }

                    no++;
                });
                return html;
            }
            let dataItemSO = []
            function getPOItem(context, soRecord) {
                dataRec = soRecord
                var currSymb
                var currency = dataRec.getValue('currency');
                if (currency) {
                    var currRec = record.load({
                        type: "currency",
                        id: currency,
                        isDynamic: false,
                    });
                    var symb = currRec.getValue('displaysymbol');
                    log.debug('symb', symb)
                    if (symb) {
                        currSymb = symb
                    }
                }
                log.debug('currency', currency)
                const itemCount = dataRec.getLineCount({ sublistId: "item" });
                if (itemCount > 0) {
                    let body = "";
                    for (let index = 0; index < itemCount; index++) {
                        const account = dataRec.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: index,
                        });
                        const itemId = dataRec.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: index,
                        });
                        if (itemId != '2880') {
                            if (account) {
                                const itemText = dataRec.getSublistText({
                                    sublistId: "item",
                                    fieldId: "item",
                                    line: index,
                                });
                                const description = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "description",
                                    line: index,
                                });
                                const remarks = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_rate_card_line_item_rmrks",
                                    line: index,
                                });
                                let itemPrice = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "rate",
                                    line: index,
                                });
                                //added by kurnia
                                itemPrice = pembulatan(itemPrice)
                                //
                                const quantity = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "quantity",
                                    line: index,
                                });
                                // let totalCost = dataRec.getSublistText({
                                //     sublistId: "item",
                                //     fieldId: "amount",
                                //     line: index,
                                // });
                                //added by kurnia
                                let totalCost = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "amount",
                                    line: index,
                                });
                                totalCost = pembulatan(totalCost);
                                //
                                log.debug('totalCost', totalCost)
                                const discLine = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_disc_line",
                                    line: index,
                                }) || 0;
                                const prosDiscLine = Number(discLine) / Number(itemPrice) * 100;
                                log.debug('cek currSymb', currSymb)
                                dataItemSO.push({
                                    itemText: itemText,
                                    description: description,
                                    remarks: remarks,
                                    itemPrice: itemPrice,
                                    quantity: quantity,
                                    totalCost: totalCost,
                                    discLine: discLine,
                                    prosDiscLine: prosDiscLine,
                                    currSymb: currSymb
                                });
                                log.debug('dataItemSO', dataItemSO)

                            }
                        }


                    }

                    let tableHTML = generateTableHTMLSO(dataItemSO);
                    body += tableHTML;
                    return body;
                }
            }

            function generateTableHTML(sectionID, items) {
                var fieldLookUpSection = search.lookupFields({
                    type: "customlist_abj_rate_card_section",
                    id: sectionID,
                    columns: ["name"],
                });
                var sectionName = fieldLookUpSection.name;
                let html = `<tr><td colspan="6" class='tg-b_body' style="border-right: 1px solid black; border-left: 1px solid black; background-color:#adacac">${sectionName}</td></tr>`;
                var no = 1;
                items.forEach((item, index) => {
                    html += `<tr>
                                <td class='tg-b_body' style='border-left:1px solid black'>${no}</td>
                                <td class='tg-b_body'>${escapeXmlSymbols(item.description)}</td>
                                <td class='tg-b_body' style='align:center'>${item.complexityLevel}</td>
                                <td class='tg-b_body' align="right">${item.currSymb}. ${numberWithCommas(item.itemPrice)}</td>
                                <td class='tg-b_body' style='align:center'>${item.quantity}</td>
                                ${index === 0 ? `<td class='tg-b_body' style="border-right: 1px solid black; align:right;" rowspan="${items.length}">${item.currSymb}. ${numberWithCommas(item.totalCost)}</td>` : `<td class='tg-b_body' style="border-right: 1px solid black; align:right;" rowspan="${items.length}"></td>`}
            
                            </tr>
                            <tr>
                                <td class='tg-b_body' style='border-left: 1px solid black'></td>
                                <td class='tg-b_body' style='font-weight:bold;'>${escapeXmlSymbols(item.remarks)}</td>
                                <td class='tg-b_body' style='border-right: 1px solid black' colspan="4"></td>
                            </tr>`;

                    if (item.discLine && item.discLine != 0) {
                        html += `<tr>
                                    <td class='tg-b_body' style='border-left: 1px solid black'></td>
                                    <td class='tg-b_body' style=''>[Discount - ${item.prosDiscLine}%]</td>
                                    <td class='tg-b_body' colspan="3"></td>
                                    <td class='tg-b_body' style='border-right: 1px solid black; align:right;'>${item.currSymb}. (${numberWithCommas(item.discLine)})</td>
                                </tr>`;
                    }

                    no++;
                });
                return html;
            }
            var dataSection = [];
            var dataItem = [];
            function getPOItemRateCard(context, dataRec) {
                var currSymb
                var currency = dataRec.getValue('currency');
                if (currency) {
                    var currRec = record.load({
                        type: "currency",
                        id: currency,
                        isDynamic: false,
                    });
                    var symb = currRec.getValue('displaysymbol');
                    log.debug('symb', symb)
                    if (symb) {
                        currSymb = symb
                    }
                }
                log.debug('currency', currency)
                var itemCount = dataRec.getLineCount({
                    sublistId: "item",
                });
                if (itemCount > 0) {
                    var body = "";
                    for (var index = 0; index < itemCount; index++) {
                        var account = dataRec.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: index,
                        });
                        var itemId = dataRec.getSublistValue({
                            sublistId: "item",
                            fieldId: "item",
                            line: index,
                        });

                        if (itemId != '2880') {
                            log.debug('itemId', itemId)
                            if (account) {
                                var itemText = dataRec.getSublistText({
                                    sublistId: "item",
                                    fieldId: "item",
                                    line: index,
                                });
                                var description = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "description",
                                    line: index,
                                });
                                var remarks = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_rate_card_line_item_rmrks",
                                    line: index,
                                });
                                var complexityLevel = dataRec.getSublistText({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_complexity_level_line",
                                    line: index,
                                });
                                var itemPrice = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "rate",
                                    line: index,
                                });
                                //added by kurnia
                                itemPrice = pembulatan(itemPrice);
                                //
                                var quantity = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "quantity",
                                    line: index,
                                });
                                // var totalCost = dataRec.getSublistText({
                                //   sublistId: "item",
                                //   fieldId: "amount",
                                //   line: index,
                                // });
                                //added by kurnia
                                var totalCost = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "amount",
                                    line: index,
                                });
                                totalCost = pembulatan(totalCost);
                                //
                                var sectionID = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_rate_card_section_list",
                                    line: index,
                                });
                                var sectionName = dataRec.getSublistText({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_rate_card_section_list",
                                    line: index,
                                });
                                var discLine = dataRec.getSublistValue({
                                    sublistId: "item",
                                    fieldId: "custcol_abj_disc_line",
                                    line: index,
                                }) || 0
                                var prosDiscLine = Number(discLine) / Number(itemPrice) * 100
                                dataSection.push(sectionName);
                                dataItem.push({
                                    itemText: itemText,
                                    description: description,
                                    remarks: remarks,
                                    sectionID: sectionID,
                                    complexityLevel: complexityLevel,
                                    itemPrice: itemPrice,
                                    quantity: quantity,
                                    totalCost: totalCost,
                                    discLine: discLine,
                                    prosDiscLine: prosDiscLine
                                });
                            }
                        }

                    }
                    dataSection = removeDuplicates(dataSection);
                    const groupedItems = {};
                    dataItem.forEach((item) => {
                        if (!groupedItems[item.sectionID]) {
                            groupedItems[item.sectionID] = [];
                        }
                        groupedItems[item.sectionID].push(item);
                    });
                    let tableHTML = "";
                    for (const sectionID in groupedItems) {
                        tableHTML += generateTableHTML(sectionID, groupedItems[sectionID]);
                    }
                    body += tableHTML;
                    return body;
                }
            }
        } catch (e) {
            log.debug('error', e)
        }



        return {
            onRequest: onRequest,
        };
    });