/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
            function removeDecimalFormat(value) {
                return value.split('.')[0];
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
                    type: "vendorpayment",
                    id: recid,
                    isDynamic: false,
                });
               
                // load subsidiarie
                
                // PO data
                var tandId = invoiceRecord.getValue('tranid');
                var InvDate = invoiceRecord.getValue('trandate');
                if(InvDate){
                    InvDate = format.format({
                        value: InvDate,
                        type: format.Type.DATE
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
                style += "<style type='text/css'>";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
                style += ".tg .tg-img-logo{width:180px; height:50px; object-vit:cover;}";
                style += ".tg .tg-img-logo-a{width:150px; height:70px; object-vit:cover;}";
                style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                style += ".tg .tg-head_body{align: left;font-size:10px; border-top: 3px solid black; border-bottom: 3px solid black;}";
                style += ".tg .tg-b_body{align: left;font-size:10px; border-bottom: solid black 2px;}";
                style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += ".second-table { page-break-before: always; }";
                style += "</style>";
                
    
                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                header += "<tbody>";
                header += "</tbody>";
                header += "</table>";
                
                body += "<table class='tg second-table' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='font-weight:bold; font-size:14; width:50%;'>BANK KELUAR</td>"
                body += "<td style='font-weight:bold; font-size:14; width:50%; align:right;'>"+tandId+"</td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:8px\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='height:20px'></td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:12px;\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:5%;font-weight:bold;'></td>"
                body += "<td style='width:15%;font-weight:bold;'>Received From</td>"
                body += "<td style='width:1%; font-weight:bold;'>:</td>"
                body += "<td style='width:29%; font-weight:bold;'></td>"
                body += "<td style='width:15%; font-weight:bold;'>Date</td>"
                body += "<td style='width:1%; font-weight:bold;'>:</td>"
                body += "<td style='width:34; font-weight:bold;'>"+InvDate+"</td>"
                body += "</tr>"
                body += "<tr>"
                body += "<td style='width:5%;font-weight:bold;'></td>"
                body += "<td style='width:15%;font-weight:bold;'>IDGL/Reff #</td>"
                body += "<td style='width:1%; font-weight:bold;'>:</td>"
                body += "<td style='width:29%; font-weight:bold;'>"+tandId+"</td>"
                body += "<td style='width:20%; font-weight:bold;'></td>"
                body += "<td style='width:1%; font-weight:bold;'></td>"
                body += "<td style='width:29; font-weight:bold;'></td>"
                body += "</tr>"
                body += "</tbody>";
                body += "</table>";

                body += "<table class='tg' width=\"100%\" style=\"table-layout:fixed;font-size:10px\">";
                body += "<tbody>";
                body += "<tr>"
                body += "<td style='width:10%'></td>"
                body += "<td style='width:25%'></td>"
                body += "<td style='width:5%'></td>"
                body += "<td style='width:30%'></td>"
                body += "<td style='width:20%'></td>"
                body += "<td style='width:20%'></td>"
                body += "</tr>"

                body += "<tr>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>GL Code</td>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Account Name</td>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'></td>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Description</td>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Debit</td>"
                body += "<td style='align:left; border-top: 1px solid black; border-bottom: 1px solid black; font-weight:bold;'>Credit</td>"
                body += "</tr>"

                body += getGL(recid)
                body += "</tbody>";
                body += "</table>";

                footer += "<table class='tg' style='table-layout: fixed;'>";
                footer += "<tbody>";

                footer += "<tr>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:21%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:21%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:21%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "<td style='width:21%;'></td>";
                footer += "<td style='width:2%;'></td>";
                footer += "</tr>";

                footer += "<tr>"
                footer += "<td></td>"
                footer += "<td style='align:center'>Posted By:</td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center'>Checked By:</td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center'>Approved By:</td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center'>Acknowledged By:</td>"
                footer += "<td></td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='height:80px' colspan='12'></td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td></td>"
                footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                footer += "<td></td>"
                footer += "<td></td>"
                footer += "<td style='align:center; border-bottom:1px solid black'></td>"
                footer += "<td></td>"
                footer += "</tr>"
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='35%'>";
                xml += body;
                xml += "\n</body>\n</pdf>";
    
                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }
            
            function getGL(recId){
                var recId = recId
                var allData = []
                var invoiceSearchObj = search.create({
                    type: "vendorpayment",
                    filters:
                    [
                        ["type","anyof","VendPymt"], 
                        "AND", 
                        ["internalid","anyof",recId]
                    ],
                    columns:
                    [
                        search.createColumn({name: "creditamount", label: "Amount (Credit)"}),
                        search.createColumn({name: "debitamount", label: "Amount (Debit)"}),
                        search.createColumn({name: "account", label: "Account"}),
                        search.createColumn({name: "memo", label: "Memo"})
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count",searchResultCount);
                invoiceSearchObj.run().each(function(result){
                    var account = result.getValue({
                        name : "account"
                    });
                    var numberAccount
                    var accountName
                    if(account){
                        var accountSearchObj = search.create({
                            type: "account",
                            filters:
                            [
                                ["internalid","anyof",account]
                            ],
                            columns:
                            [
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                }),
                                search.createColumn({name: "displayname", label: "Display Name"}),
                                search.createColumn({name: "number", label: "Number"})
                            ]
                        });
                        var searchResultCount = accountSearchObj.runPaged().count;
                        log.debug("accountSearchObj result count",searchResultCount);
                        accountSearchObj.run().each(function(result){
                            var accNumb = result.getValue({
                                name : "number"
                            });
                            var accName = result.getValue({
                                name : "name"
                            })
                            if(accNumb){
                                numberAccount = accNumb
                            }
                            if(accName){
                                accountName = accName
                            }
                            return true;
                        });
                    }
                    var memo = result.getValue({
                        name : "memo"
                    });
                    var creditamount = result.getValue({
                        name : "creditamount"
                    });
                    var debitAmount = result.getValue({
                        name : "debitamount"
                    });
                    allData.push({
                        numberAccount : numberAccount,
                        accountName : accountName,
                        memo : memo,
                        creditamount : creditamount,
                        debitAmount : debitAmount
                    })
                    return true;
                });
                var body = "";
                var totalDebit = 0
                var totalCredit = 0
                allData.forEach((data)=>{
                    var numberAccount = data.numberAccount;
                    var accountName = data.accountName;
                    var memo = data.memo;
                    var creditamount = data.creditamount;
                    var debitAmount = data.debitAmount;
                    if (creditamount || debitAmount) {
                        if(creditamount){
                            totalCredit += parseFloat(creditamount);
                            creditamount = pembulatan(creditamount)
                            creditamount = format.format({
                                value: creditamount,
                                type: format.Type.CURRENCY
                            });
                        }
                        if(debitAmount){
                            totalDebit +=  parseFloat(debitAmount);
                            debitAmount = pembulatan(debitAmount)
                            debitAmount = format.format({
                                value: debitAmount,
                                type: format.Type.CURRENCY
                            });
                        }
                            body += "<tr>";
                            body += "<td>"+numberAccount+"</td>";
                            body += "<td>"+accountName+"</td>";
                            body += "<td></td>";
                            body += "<td>"+memo+"</td>";
                            body += "<td>"+removeDecimalFormat(debitAmount)+"</td>";
                            body += "<td>"+removeDecimalFormat(creditamount)+"</td>";
                            body += "</tr>";
                    }
                    
                })
                if(totalCredit){
                    totalCredit = pembulatan(totalCredit)
                    totalCredit = format.format({
                        value: totalCredit,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalDebit){
                    totalDebit = pembulatan(totalDebit)
                    totalDebit = format.format({
                        value: totalDebit,
                        type: format.Type.CURRENCY
                    });
                }
                body += "<tr>";
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                body += "<td style='border-top: 1px solid black; border-bottom: 1px solid black;'></td>";
                body += "<td style='font-size: 12px; font-weight:bold; border-top: 1px solid black; border-bottom: 1px solid black;'>"+removeDecimalFormat(totalDebit)+"</td>";
                body += "<td style='font-size: 12px; font-weight:bold; border-top: 1px solid black; border-bottom: 1px solid black;'>"+removeDecimalFormat(totalCredit)+"</td>";
                body += "</tr>";
                return body;
            }
            
        }catch(e){
            log.debug('error', e)
        }
       
            
        
    return {
        onRequest: onRequest,
    };
});