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
            var recid = context.request.parameters.id;
            // load Record
            log.debug('recid', recid)
            var collRecord = record.load({
                type: 'customtransaction_rda_collection_mgm',
                id: recid,
                isDynamic: false,
            });
            var allIdInv = collRecord.getValue('custbody_rda_invoice_number');
            log.debug('allIdInv', allIdInv);
            allIdInv.forEach(id => {
                var recInv = record.load({
                    type : 'invoice',
                    id : id,
                });
                var invNumber = recInv.getValue('tranid');
                var invDate = recInv.getValue('trandate');
                var dueDate = recInv.getValue('duedate');
                var custId = recInv.getValue('entity');
                var custName
                var custCode
                if(custId){
                    var customerSearchObj = search.create({
                        type: "customer",
                        filters: [
                            ["internalid", "anyof", custId]
                        ],
                        columns: [
                            search.createColumn({
                                name: "formulatext",
                                formula: "{entityid}",
                                label: "Formula (Text)"
                            }),
                            search.createColumn({name: "altname", label: "Name"})
                        ]
                    });
                    
                    var searchResultCount = customerSearchObj.runPaged().count;
                    log.debug("customerSearchObj result count", searchResultCount);
                    
                    // Ambil hanya satu hasil pertama
                    var result = customerSearchObj.run().getRange({ start: 0, end: 1 });
                    if (result.length > 0) {
                        var entityId = result[0].getValue({ name: "formulatext" });
                        log.debug("Entity ID", entityId);
                        if(entityId){
                            custCode = entityId
                        }
                        var entityName = result[0].getValue({ name: "altname" });
                        if(entityName){
                            custName = entityName
                        }
                    }
                    
                }
                var salesName = recInv.getText('salesrep');
                var totalAmt = recInv.getValue('total');
                log.debug('totalAmt', totalAmt)
                var amtDue = recInv.getValue('amountremainingtotalbox');
                log.debug('amtDue', amtDue);
                var countPrint = recInv.getValue('custbody_rda_sjp_count');
                
            })


            var subsId = collRecord.getValue('subsidiary');
            var subAdders = ''
            if(subsId){
                var recSub = record.load({
                    type: "subsidiary",
                    id: subsId,
                })
                var addresSubsidiaries = recSub.getValue('mainaddress_text');
                log.debug('addresSubsidiaries', addresSubsidiaries)
                if(addresSubsidiaries){
                    subAdders = addresSubsidiaries
                }
            }
            var date = collRecord.getValue('trandate')
            if(date){
                date = format.format({
                    value: date,
                    type: format.Type.DATE
                });
            }
            log.debug('date', date)

            var kolektor = collRecord.getValue('custbody_rda_kolektor');
            var halaman = 1
            // page print
            var response = context.response;
            var xml = "";
            var header = "";
            var body = "";
            var headerHeight = '1%';
            var style = "";
            var footer = "";
            var pdfFile = null;

            // css
            style += "<style type='text/css'>";
            style += ".tg {border-collapse:collapse; border-spacing: 0; width: 100%;}";
            style += ".tg .tg-headerlogo{align:right; border-right: none;border-left: none;border-top: none;border-bottom: none;}";
            style += ".tg .tg-img-logo{width:195px; height:90px; object-vit:cover;}";
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

            // header
            header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
            header += "<tbody>";
            header += "<tr>"
            header += "<td style='width:30%;'></td>"
            header += "<td style='width:40%;'></td>"
            header += "<td style='width:12%;'></td>"
            header += "<td style='width:1%;'></td>"
            header += "<td style='width:17%;'></td>"
            header += "</tr>"

            header += "<tr>"
            header += "<td style='font-size:15px; font-weight:bold;'>PT. Rejeki Damai Abadi</td>"
            header += "<td style='align:center; font-size:20px; font-weight:bold;' rowspan='4'>Surat Jalan Penagihan</td>"
            header += "<td style=''>Nomor Dokumen</td>"
            header += "<td style=''>:</td>"
            header += "<td style=''>Test</td>"
            header += "</tr>"

            header += "<tr>"
            header += "<td rowspan='3'>"+subAdders+"</td>"
            header += "<td>Tanggal Penagihan</td>"
            header += "<td>:</td>"
            header += "<td style='font-weight:bold'>"+date+"</td>"
            header += "</tr>"

            header += "<tr>"
            header += "<td>Kolektor</td>"
            header += "<td>:</td>"
            header += "<td style='font-weight:bold'>"+kolektor+"</td>"
            header += "</tr>"

            header += "<tr>"
            header += "<td>Halaman</td>"
            header += "<td>:</td>"
            header += "<td style='font-weight:bold'>"+halaman+"</td>"
            header += "</tr>"

            header += "<tr>"
            header += "<td>Division:</td>"
            header += "</tr>"

            header += "</tbody>";
            header += "</table>";

            // body
            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
            body += "<tbody>";
            body += "</tbody>";
            body += "</table>";

            // footer
            footer += "<table class='tg' style='table-layout: fixed;'>";
            footer += "<tbody>";
            footer += "</tbody>";
            footer += "</table>";

            // render XML
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
            xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
            xml += body;
            xml += "\n</body>\n</pdf>";

            xml = xml.replace(/ & /g, ' &amp; ');
            response.renderPdf({
                xmlString: xml
            });
        }
        return {
            onRequest: onRequest,
        };
    }
);