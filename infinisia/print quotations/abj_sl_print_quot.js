/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function (render, search, record, log, file, http, config, format, email, runtime) {
        try {
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
                log.debug('recid', recid);
                var quotSearch = search.create({
                    type: search.Type.ESTIMATE,
                    columns: [
                        'tranid',
                        'trandate',
                        'duedate',
                        'custbody_fcn_sales_employee',
                        'entity',
                        'custcol_price_kg_usd',
                        'item',
                        'memomain',
                        search.createColumn({
                            name: "vendorname",
                            join: "item",
                            label: "Vendor Name"
                         }),
                        search.createColumn({
                            name: 'formulatext1',
                            formula: "{item.internalid}",
                            label: 'itemid'
                        }),
                        search.createColumn({
                            name: 'formulatext2',
                            formula: "{item.description}",
                            label: 'itemdesc'
                        }),
                        search.createColumn({
                            name: 'formulatext3',
                            formula: "{rate}",
                            label: 'rate'
                        }),
                        search.createColumn({
                            name: 'formulatext4',
                            formula: "{amount}",
                            label: 'amount'
                        }),
                        search.createColumn({
                            name: 'formulatext5',
                            formula: "{customer.partner}",
                            label: 'principal'
                        }),
                        search.createColumn({
                            name: 'formulatext6',
                            formula: "{custcol1}",
                            label: 'moq'
                        }),
                        search.createColumn({
                            name: 'formulatext7',
                            formula: "{custcol2}",
                            label: 'status'
                        }),
                        search.createColumn({
                            name: 'formulatext8',
                            formula: "{custcol8}",
                            label: 'leadtime'
                        }),
                        search.createColumn({
                            name: 'formulatext9',
                            formula: "{custcol4}",
                            label: 'paymentterm'
                        }),
                    ],
                    filters: [
                        ['mainline', 'is', false],
                        'AND',
                        ['taxline', 'is', false],
                        'AND',
                        ['internalid', 'is', recid]
                    ]
                });
                var searchResultCount = quotSearch.runPaged().count;
                var searchResult = quotSearch.run().getRange(0, searchResultCount)

                var resultArray = []
                searchResult.forEach(function (result) {

                    var tranid = result.getValue('tranid')
                    var trandate = result.getValue('trandate')
                    var duedate = result.getValue('duedate')
                    var employId = result.getValue('custbody_fcn_sales_employee')
                    var entity = result.getValue('entity')
                    var itemId = result.getValue({
                        name: 'formulatext1',
                        label: 'itemid'
                    })
                    var itemdesc = result.getValue({
                        name: 'formulatext2',
                        label: 'itemdesc'
                    })
                    var itemrate = result.getValue({
                        name: 'custcol_price_kg_usd',
                        label: 'rate'
                    })
                    
                    var itemamount = result.getValue({
                        name: 'formulatext4',
                        label: 'amount'
                    })
                    var itemprincipal = result.getValue({
                        name: "vendorname",
                        join: "item",
                    })
                    log.debug('itemprincipal', itemprincipal)
                    var itemmoq = result.getValue({
                        name: 'formulatext6',
                        label: 'moq'
                    })
                    var itemstatus = result.getValue({
                        name: 'memomain',
                        label: 'status'
                    })
                    var itemLeadTime = result.getValue({
                        name: 'formulatext8',
                        label: 'leadtime'
                    })
                    var itemPaymentTerm = result.getValue({
                        name: 'formulatext9',
                        label: 'paymentterm'
                    })
                    resultArray.push({
                        tranid: tranid,
                        trandate: trandate,
                        duedate: duedate,
                        employId: employId,
                        entity: entity,
                        itemid: itemId,
                        itemdesc: itemdesc,
                        itemrate: itemrate,
                        itemamount: itemamount,
                        itemprincipal: itemprincipal,
                        itemmoq: itemmoq,
                        itemstatus: itemstatus,
                        itemleadtime: itemLeadTime,
                        itempaymentterm: itemPaymentTerm,
                    })
                    return true
                });

                log.debug('resultArray', resultArray)

                // var quotRec = record.load({
                //     type: "estimate",
                //     id: recid,
                //     isDynamic: false,
                // });
                var quotRec = resultArray
                var transDate = quotRec[0].trandate
                var expireDate = quotRec[0].duedate
                var transactionNumber = quotRec[0].tranid

                var prepared = '';
                var empId = quotRec[0].employId
                // log.debug('empId',empId)

                if (empId) {
                    var empRec = record.load({
                        type: 'employee',
                        id: empId,
                        isDynamic: false,
                    });
                    var firstName = empRec.getValue('firstname') || '';
                    var middName = empRec.getValue('middlename') || '';
                    var lastnameemp = empRec.getValue('lastname') || '';
                    prepared = firstName + ' ' + middName + ' ' + lastnameemp
                    var idImg = empRec.getValue('custentity_abj_inf_signature');
                    var signatureUrl = '';
                    var fileSignature;
                    if (idImg) {
                        fileSignature = file.load({
                            id: idImg
                        });
                        //get url
                        signatureUrl = fileSignature.url.replace(/&/g, "&amp;");
                    }
                    log.debug('signatureUrl', signatureUrl)
                }
                var companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var legalName = companyInfo.getValue("legalname");

                log.debug('legalName', legalName);
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
                log.debug('urlLogo', urlLogo);
                var addres = companyInfo.getValue("mainaddress_text");
                var customerid = quotRec[0].entity;
                log.debug('entity', customerid)
                var contactName = [];
                if (customerid) {
                    var customerRecord = record.load({
                        type: "customer",
                        id: customerid,
                        isDynamic: false,
                    });
                    var isperson = customerRecord.getValue('isperson');
                    var custID = customerRecord.getValue('entityid')
                    var custIdArray = custID.split(' ');
                    var custIdset = custIdArray[0];
                    log.debug('custidSet', custIdset);
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
                    var custEmail = customerRecord.getValue('email');
                    var taxRegNo = customerRecord.getValue('vatregnumber');

                    var lineContact = customerRecord.getLineCount({
                        sublistId: 'contactroles'
                    });
                    if (lineContact > 0) {
                        for (var index = 0; index < lineContact; index++) {
                            var cName = customerRecord.getSublistValue({
                                sublistId: 'contactroles',
                                fieldId: 'contactname',
                                line: index
                            });
                            if (cName) {
                                contactName.push(cName);
                            }
                        }
                    }
                }
                // if (transDate) {
                //     function sysDate() {
                //         var date = transDate;
                //         var tdate = date.getUTCDate();
                //         var month = date.getUTCMonth() + 1; // jan = 0
                //         var year = date.getUTCFullYear();
                //         return tdate + '/' + month + '/' + year;
                //     }
                //     transDate = sysDate();
                // }
                // if (expireDate) {
                //     function sysDate() {
                //         var date = expireDate;
                //         var tdate = date.getUTCDate();
                //         var month = date.getUTCMonth() + 1; // jan = 0
                //         var year = date.getUTCFullYear();
                //         return tdate + '/' + month + '/' + year;
                //     }
                //     expireDate = sysDate();
                // }
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
                style += ".tg .tg-img-logo{width:200px; height:70px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: center;font-size:9px;font-weight: bold; background-color: #5CCCF8;}";
                style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";


                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";

                body += "<tbody>";
                body += "<tr>";
                if (urlLogo) {
                    body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                }
                body += "<td style='align:right; font-size:20px; font-weight:bold; color:#0074a3'>QUOTATION</td>"
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:40%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:35%'></td>"
                body += "<td style='width:25%'></td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td style='font-size:14px; font-weight:bold; font-style: italic;'>" + legalName + "</td>"
                body += "<td></td>"
                body += "<td style='align:right; font-size:9px; font-weight:bold;'>No. FORM :</td>"
                body += "<td style='align:left; font-size:9px;'>003/ISS-BD/FF</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td rowspan='4'>" + addres + "</td>"
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'>DATE :</td>"
                body += "<td style='align:left;'>" + transDate + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'> Quotation No:</td>"
                body += "<td style='align:left; font-weight:bold;'>" + transactionNumber + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'> Customer ID:</td>"
                body += "<td style='align:left; font-weight:bold;'>" + custIdset + "</td>"
                body += "</tr>";

                body += "<tr style='height:10px;'>";
                body += "<td></td>"
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'></td>"
                body += "<td style='align:left; font-weight:bold;'></td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td style='font-weight:bold;'>Quotation For : </td>"
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'> Quotation Valid Until:</td>"
                body += "<td style='align:left; font-weight:bold;'>" + expireDate + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td style='font-size:13px; font-weight:bold'>" + custName + "</td>"
                body += "<td></td>"
                body += "<td style='align:right; font-weight:bold;'> Prepared by:</td>"
                body += "<td style='align:left; font-weight:bold;'>" + prepared + "</td>"
                body += "</tr>";

                body += "<tr>";
                body += "<td style='font-size:10px;'>" + custAddres + "</td>"
                body += "<td></td>"
                body += "</tr>";

                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='font-weight:bold;'>Attn : " + contactName + "</td>"
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr style='height:20px;'>";
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='font-weight:bold;'>We are pleased to quote you in the following :</td>"
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td class='tg-head_body' style='width:20%; border: 1px solid black; border-right:none;'> DESCRIPTION </td>"
                body += "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> PRINCIPLE </td>"
                body += "<td class='tg-head_body' style='width:10%; border: 1px solid black; border-right:none;'> UNIT PRICE </td>"
                body += "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> MOQ* </td>"
                body += "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> STATUS </td>"
                body += "<td class='tg-head_body' style='width:15%; border: 1px solid black; border-right:none;'> Lead Time </td>"
                body += "<td class='tg-head_body' style='width:15%; border: 1px solid black;'> Payment Term </td>"
                body += "</tr>";
                body += getPOItem(context, quotRec);
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style=''>Kurs : TT Counter Sell BCA</td>"
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr style='height:20px;'>";
                body += "</tr>";
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";
                body += "<tr>";
                body += "<td style='width:8%'></td>"
                body += "<td style='width:28%'></td>"
                body += "<td style='width:28%'></td>"
                body += "<td style='width:28%'></td>"
                body += "<td style='width:8%'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td></td>"
                body += "<td style='align: center; font-weight:bold;'>PREPARED BY</td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold;'>APPROVED BY</td>"
                body += "</tr>";

                body += "<tr style='height:40px'>"
                body += "<td></td>"
                if (signatureUrl) {
                    body += "<td style='align: center; font-weight:bold;'><img class='tg-img-logo' src= '" + signatureUrl + "' ></img></td>"
                } else {
                    body += "<td style='align: center; font-weight:bold;'></td>"
                }
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td></td>"
                body += "<td style='align: center; font-weight:bold;'>ADMIN BUSINESS DEVELOPMENT</td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold;'>BUSIDESS DEVELOPMENT</td>"
                body += "</tr>";

                body += "<tr style='height:10px'>"
                body += "<td></td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "</tr>";

                body += "<tr>"
                body += "<td></td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "<td style='align: center; font-weight:bold; color:#00b1e1;'>THANK YOU FOR YOUR BUSINESS!</td>"
                body += "<td style='align: center; font-weight:bold;'></td>"
                body += "</tr>";

                body += "</tbody>";
                body += "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";
                footer += "<tr style='height:40px;'>";
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
            function getPOItem(context, quotRec) {
                var itemCount = quotRec.length
                log.debug('itemcount', itemCount)
                if (itemCount > 0) {
                    var body = "";
                    for (var index = 0; index < itemCount; index++) {
                        // var description = quotRec.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'description',
                        //     line: index
                        // });
                        var description = quotRec[index].itemdesc
                        // var principal = quotRec.getSublistText({
                        //     sublistId: 'item',
                        //     fieldId: 'custcoliss_principal_record',
                        //     line: index
                        // });
                        var principal = quotRec[index].itemprincipal

                        // var unitPrice = quotRec.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'rate',
                        //     line: index
                        // });
                        var unitPrice = quotRec[index].itemrate

                        // var amount = quotRec.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'amount',
                        //     line: index
                        // });
                        var amount = quotRec[index].itemamount


                        // var moq = quotRec.getSublistValue({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol1',
                        //     line: index
                        // })
                        var moq = quotRec[index].itemmoq
                        
                        // var status = quotRec.getSublistText({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol2',
                        //     line: index
                        // })
                        var status = quotRec[index].itemstatus

                        // var leadTime = quotRec.getSublistText({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol3',
                        //     line: index
                        // })
                        var leadTime = quotRec[index].itemleadtime

                        // var paymentTerms = quotRec.getSublistText({
                        //     sublistId: 'item',
                        //     fieldId: 'custcol4',
                        //     line: index
                        // })
                        var paymentTerms = quotRec[index].itempaymentterm

                        if (unitPrice) {
                            unitPrice = pembulatan(unitPrice);
                            unitPrice = format.format({
                                value: unitPrice,
                                type: format.Type.CURRENCY
                            });
                            unitPrice = removeDecimalFormat(unitPrice)
                        }
                        if (amount) {
                            amount = pembulatan(amount);
                            amount = format.format({
                                value: amount,
                                type: format.Type.CURRENCY
                            });
                            amount = removeDecimalFormat(amount)
                        }
                        body += "<tr>";
                        body += "<td style='font-size: 10px; border: 1px solid black; border-right:none;'>" + description + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>" + principal + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>" + unitPrice + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>" + moq + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>" + status + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black; border-right:none;'>" + leadTime + "</td>";
                        body += "<td style='align:center; font-size:10px; border: 1px solid black;'>" + paymentTerms + "</td>";
                        body += "</tr>";

                    }
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