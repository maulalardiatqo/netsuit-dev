/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {

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

        function onRequest(context) {
            try{
                var recid = context.request.parameters.id;
                log.debug('recId', recid)
                // searchHeader
                var searchHeader = search.load({
                    id: "customsearch_header_print_inv",
                });
                if(recid){
                    searchHeader.filters.push(search.createFilter({name: "internalid", operator: search.Operator.ANYOF, values: recid}));
                }
                var searchHeaderSet = searchHeader.run();
                var result = searchHeaderSet.getRange(0, 1);
                var headerRec = result[0];
                var donorName = headerRec.getValue({ 
                    name: "altname",
                    join: "customerMain"
                })
                var donorAddres = headerRec.getValue({
                    name: "address",
                    join: "customerMain",
                })
                var dContactName = headerRec.getValue({
                    name: "entityid",
                    join: "CUSTBODY_STC_ATTENTION",
                })
                var dContactTitle = headerRec.getValue({
                    name: "title",
                    join: "CUSTBODY_STC_ATTENTION",
                })
                var tranId = headerRec.getValue({name : "tranid"})
                var sof = headerRec.getValue({ name : "cseg_stc_sof"});
                var tranDate = headerRec.getValue({ name : "trandate"});
                var coaId = headerRec.getValue({name : "custbodystc_bank_account"});
                log.debug('coaId', coaId)
                var bankName = ""
                var bankAddress = ""
                var accountName = ""
                var accountNumber = ""
                var swiftCode = ""
                if(coaId){
                    var recCoa = record.load({
                        type : "account",
                        id : coaId
                    });
                    bankName = recCoa.getValue('sbankname');
                    bankAddress = recCoa.getValue('custrecordstc_bank_address')
                    accountName = recCoa.getValue('custrecord_stc_account_name');
                    accountNumber = recCoa.getValue('sbankcompanyid');
                    swiftCode = recCoa.getValue('custrecord_stc_swift_code')
                }
                log.debug('coa data', {bankName : bankName, bankAddress : bankAddress, accountName : accountName, accountNumber : accountNumber, swiftCode : swiftCode})
                var status = headerRec.getValue({ name : "statusref"});
                var empId = headerRec.getValue({ name : "createdby"});
                var empName = ""
                var empSignature = ""
                var fileTTD;
                var urlTTD = '';
                if(empId){
                    var recEmp = record.load({
                        type : "employee",
                        id : empId
                    });
                    empName = recEmp.getValue("nameorig");
                    log.debug('empName', empName)
                    empSignature = recEmp.getValue("custentity_stc_signature")
                    log.debug('empSignature', empSignature)
                    if (empSignature) {
                        fileTTD = file.load({
                            id: empSignature
                        });
                        //get url
                        urlTTD = fileTTD.url.replace(/&/g, "&amp;");
                    }
                }
                log.debug('urlTTD', urlTTD)
                // comp information
                var companyInfo = config.load({
                    type: config.Type.COMPANY_INFORMATION
                });
                var logo = companyInfo.getValue('pagelogo');
                var filelogo;
                var urlLogo = '';
                if (logo) {
                    filelogo = file.load({
                        id: 1933
                    });
                    //get url
                    urlLogo = filelogo.url.replace(/&/g, "&amp;");
                    log.debug("urlLogo", urlLogo);
                }
                var dataLine = [];

                // search Line
                var searchLine = search.load({
                    id : "customsearch260"
                });  

                if (recid) {
                    searchLine.filters.push(search.createFilter({
                        name: "internalid",
                        operator: search.Operator.ANYOF,
                        values: recid
                    }));
                }

                var searchLineSet = searchLine.run();
                var results = searchLineSet.getRange({ start: 0, end: 500 });

                if (results && results.length > 0) {
                    for (var i = 0; i < results.length; i++) {
                        var res = results[i];
                        var descItem = res.getValue({ name: 'memo' });
                        var currency = res.getText({ name: 'currency' });
                        var amount = res.getValue({ name: 'grossamount' });

                        dataLine.push({
                            descItem: descItem,
                            currency: currency,
                            amount: amount
                        });
                    }
                }

                log.debug("dataLine", dataLine);

                // page print
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '0%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                
                // css
                style += "<style type='text/css'>";
                style += "*{padding : 0; margin:0;}";
                style += "body{padding-left : 5px; padding-right : 5px;}";
                style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
                style += ".tg .tg-headerlogo {align:right; border:none;}";
                style += ".tg .tg-img-logo {width:195px; height:90px; object-fit:cover;}";
                style += ".tg .tg-headerrow, .tg .tg-headerrow_alva {align: right; font-size:12px;}";
                style += ".tg .tg-headerrow_legalName, .tg .tg-headerrow_legalName_Alva {align: left; font-size:13px; font-weight: bold;}";
                style += ".tg .tg-headerrow_Total {align: right; font-size:16px; font-weight: bold;}";
                style += ".tg .tg-head_body {align: left; font-size:12px; font-weight: bold; border-top:3px solid black; border-bottom:3px solid black;}";
                style += ".tg .tg-jkm {background-color:#eba134;}";
                style += ".tg .tg-sisi {background-color:#F8F40F;}";
                style += ".tg .tg-alva {background-color:#08B1FF;}";
                style += ".tg .tg-froyo {background-color:#0A65EC; color:#F9FAFC;}";
                style += ".tg .tg-b_body {align:left; font-size:12px; border-bottom:2px solid black;}";
                style += ".tg .tg-f_body {align:right; font-size:14px; border-bottom:2px solid black;}";
                style += ".tg .tg-foot {font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                style += "</style>";
                
                // header
                header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                header += "<tbody>";
                header += "<tr>"
                header += "<td style='width:50%'></td>"
                header += "<td style='width:50%'></td>"
                header += "</tr>"
                header += "<tr>"
                header += "<td></td>"
                if (urlLogo) {
                    header += "<td><img style='width:60px; height:50px; object-fit:cover;' src= '" + urlLogo + "' ></img> </td>";
                }
                header += "</tr>"
                
                
                header += "</tbody>";
                header += "</table>";

                header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                header += "<tbody>";
                header += "<tr>"
                header += "<td style='width:50%'></td>"
                header += "<td style='width:50%'></td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='font-size:18px; font-weight:bold; align:center' colspan='2'>REQUEST FOR FUNDS</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='font-size:18px; font-weight:bold; align:center' colspan='2'>REQUEST FOR FUNDS</td>"
                header += "</tr>"
                header += "</tbody>";
                header += "</table>";
                

                // body
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                body += "<tbody>";

                body += "<tr>"
                body += "<td style='width:14%;'></td>"
                body += "<td style='width:14%;'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:9%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:8%;'></td>"
                body += "<td style='width:3%'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:6%;'></td>"
                body += "<td style='width:13%;'></td>"
                body += "</tr>"

                
                body += "</tbody>";
                body += "</table>";

                // footer
                footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:10px'>";
                footer += "<tbody>";
              
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
                xml += "</macrolist>";
                xml += "</head>";

                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "'>";
                xml += body;
                xml += footer;

                xml += "\n</body>\n</pdf>";


                xml = xml.replace(/ & /g, ' &amp; ');
                response.renderPdf({
                    xmlString: xml
                });
            }catch(e){
                log.error("Error", e);
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);