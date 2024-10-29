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

                var currentUser = runtime.getCurrentUser();
        
                // Mendapatkan ID peran pengguna saat ini
                var currentRoleId = currentUser.role;
                var roleName = '';
                search.create({
                    type: 'role',
                    filters: [
                        ['internalid', 'is', currentRoleId]
                    ],
                    columns: ['name']
                }).run().each(function(result) {
                    roleName = result.getValue('name');
                    return false; // Menghentikan loop setelah mendapatkan hasil pertama
                });
        

                log.debug('roleName', roleName)

                const currentDate = new Date();

                // Format day of the week
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const dayName = days[currentDate.getDay()];

                // Format date
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, "0");
                const date = String(currentDate.getDate()).padStart(2, "0");
                const formattedDate = `${dayName} ${year}/${month}/${date}`;

                const hours = String(currentDate.getHours()).padStart(2, "0");
                const minutes = String(currentDate.getMinutes()).padStart(2, "0");
                const formattedTime = `${hours}:${minutes}`;

                var recid = context.request.parameters.id;
                // load Record
                log.debug('recid', recid)
                
                var collRecord = record.load({
                    type: 'customtransaction_rda_collection_mgm',
                    id: recid,
                    isDynamic: false,
                });
                var docNo = collRecord.getValue('tranid')
                var areaToPrint
                var allData = []
                var allIdInv = collRecord.getValue('custbody_rda_invoice_number');
                log.debug('allIdInv', allIdInv);
                var invoiceSearchObj = search.create({
                    type: "invoice",
                    settings:[{"name":"consolidationtype","value":"ACCTTYPE"},{"name":"includeperiodendtransactions","value":"F"}],
                    filters:
                    [
                        ["type","anyof","CustInvc"], 
                        "AND", 
                        ["taxline","is","F"], 
                        "AND", 
                        ["cogs","is","F"],
                        "AND",
                        ["internalid", "anyof"].concat(allIdInv)
                    ],
                    columns:
                    [
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "amountremaining", label: "Amount Remaining"}),
                        search.createColumn({name: "total", label: "Amount (Transaction Total)"}),
                        search.createColumn({
                            name: "formulatext",
                            formula: "{class}",
                            label: "Class"
                        }),
                        search.createColumn({name: "entity", label: "Customer"}),
                        search.createColumn({name: "trandate", label: "Date"}),
                        search.createColumn({name: "duedate", label: "Due Date/Receive By"}),
                        search.createColumn({name: "salesrep", label: "Sales Rep"}),
                        search.createColumn({name: "custbody_rda_area", label: "RDA - AREA"}),
                        search.createColumn({name: "custbody_rda_sjp_count", label: "RDA - SJP Count"}),
                        search.createColumn({
                            name: "entityid",
                            join: "customer",
                            label: "ID"
                        }),
                        search.createColumn({name: "applyinglinkamount", label: "Applying Link Amount"}),
                        search.createColumn({name: "daysoverdue", label: "Days Overdue"})
                    
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
                log.debug("invoiceSearchObj result count",searchResultCount);
                invoiceSearchObj.run().each(function(result){
                    var docNumber = result.getValue({
                        name: "tranid"
                    })
                    var amtRemaining = result.getValue({
                        name: "amountremaining"
                    })
                    var amtTotal = result.getValue({
                        name: "total"
                    })
                    var classId = result.getValue({
                        name: "formulatext",
                        formula: "{class}",
                        label: "Class"
                    });
                    log.debug('classId', classId)
                    var cussId = result.getText({
                        name: "entity"
                    });
                    log.debug('cussId', cussId)
                    var tranDate = result.getValue({
                        name: "trandate"
                    })
                    var dueDate = result.getValue({
                        name: "duedate"
                    })
                    var salesRep = result.getValue({
                        name: "salesrep"
                    })
                    var area = result.getText({
                        name: "custbody_rda_area"
                    })
                    if(area){
                        areaToPrint = area
                    }
                    var sjpCount = result.getValue({
                        name: "custbody_rda_sjp_count"
                    })
                    var entityId = result.getValue({
                        name: "entityid",
                        join: "customer",
                    })
                    var applyingAmount = result.getValue({
                        name: "applyinglinkamount",
                    })
                    var daysOverDue = result.getValue({
                        name: "daysoverdue"
                    })
                    allData.push({
                        docNumber : docNumber,
                        amtRemaining : amtRemaining,
                        amtTotal : amtTotal,
                        classId : classId,
                        cussId : cussId,
                        tranDate : tranDate,
                        dueDate : dueDate,
                        salesRep : salesRep,
                        area : area,
                        sjpCount : sjpCount,
                        entityId : entityId,
                        applyingAmount : applyingAmount,
                        daysOverDue : daysOverDue
                    })
                    return true;
                });
                log.debug('allData', allData)
                var allClass = [];
                var groupedData = {};
                
                allData.forEach(function(data) {
                    if (data.classId && !allClass.includes(data.classId)) {
                        allClass.push(data.classId);
                    }
                
                    if (!groupedData[data.docNumber]) {
                        groupedData[data.docNumber] = {
                            ...data,
                            applyingAmount: parseFloat(data.applyingAmount) || 0 
                        };
                    } else {
                        var existingData = groupedData[data.docNumber];
                        if (!existingData.amtRemaining && data.amtRemaining) {
                            existingData.amtRemaining = data.amtRemaining;
                        }
                        if (!existingData.salesRep && data.salesRep) {
                            existingData.salesRep = data.salesRep;
                        }
                        if (!existingData.amtTotal && data.amtTotal) {
                            existingData.amtTotal = data.amtTotal;
                        }
                        if (!existingData.classId && data.classId) {
                            existingData.classId = data.classId;
                        }
                        if (!existingData.cussId && data.cussId) {
                            existingData.cussId = data.cussId;
                        }
                        if (!existingData.tranDate && data.tranDate) {
                            existingData.tranDate = data.tranDate;
                        }
                        if (!existingData.dueDate && data.dueDate) {
                            existingData.dueDate = data.dueDate;
                        }
                        if (!existingData.area && data.area) {
                            existingData.area = data.area;
                        }
                        if (!existingData.sjpCount && data.sjpCount) {
                            existingData.sjpCount = data.sjpCount;
                        }
                        if (!existingData.entityId && data.entityId) {
                            existingData.entityId = data.entityId;
                        }
                        if (!existingData.daysOverDue && data.daysOverDue) {
                            existingData.daysOverDue = data.daysOverDue;
                        }
                        existingData.applyingAmount += (parseFloat(data.applyingAmount) || 0); 
                    }
                });
                
                
                var finalData = Object.values(groupedData);

                log.debug('finalData', finalData);
                log.debug('allClass', allClass)
                var allClassString = allClass.join(', ');
                log.debug('allClassString', allClassString)
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
                var dateRec = collRecord.getValue('trandate')
                if(dateRec){
                    dateRec = format.format({
                        value: dateRec,
                        type: format.Type.DATE
                    });
                }
                log.debug('dateRec', dateRec)

                var kolektor = collRecord.getValue('custbody_rda_kolektor');
                var halaman = 1
                // page print
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '25%';
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
                header += "<td style=''>"+docNo+"</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td rowspan='3'>"+subAdders+"</td>"
                header += "<td>Tanggal Penagihan</td>"
                header += "<td>:</td>"
                header += "<td style='font-weight:bold'>"+dateRec+"</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td>Kolektor</td>"
                header += "<td>:</td>"
                header += "<td style='font-weight:bold'>"+kolektor+"</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td>Halaman</td>"
                header += "<td>:</td>"
                header += "<td style='font-weight:bold'><pagenumber/></td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td>Division: <b>"+allClassString+" </b></td>"
                header += "</tr>"

                header += "<tr style='height:20px'>"
                header += "</tr>"

                header += "</tbody>";
                header += "</table>";

                header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                header += "<tbody>";

                header += "<tr>"
                header += "<td style='width:14%;'></td>"
                header += "<td style='width:14%;'></td>"
                header += "<td style='width:6%;'></td>"
                header += "<td style='width:6%;'></td>"
                header += "<td style='width:9%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:8%;'></td>"
                header += "<td style='width:3%'></td>"
                header += "<td style='width:6%;'></td>"
                header += "<td style='width:6%;'></td>"
                header += "<td style='width:6%;'></td>"
                header += "<td style='width:13%;'></td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='border: solid black 1px; border-right:none; '>Customer</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Nomor Faktur <br/> Performa Invoice Number</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Tanggal <br/> Faktur</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Tanggal <br/> Jt Tempo</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Salesman <br/> atau No Kontra Bon</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Nilai Faktur</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Out Standing</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Over <br/> Due</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Retur</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Tunai</td>"
                header += "<td style='border: solid black 1px; border-right:none;'>Nominal</td>"
                header += "<td style='border: solid black 1px; border-left:none; '>Pembayaran Giro <br/> No Giro/Bank/Jatuh Tempo</td>"
                header += "</tr>"

                header += "<tr>"
                header += "<td style='border: solid black 1px; border-top:none; font-size:12px; font-weight:bold;' colspan='12'>"+areaToPrint+"</td>"
                header += "</tr>"

                header += "</tbody>";
                header += "</table>";

                // body
                body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
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

                

                var jumlahNota = 0
                var subTotal = 0
                finalData.forEach(item => {
                    jumlahNota ++
                    log.debug('item.cussId', item.cussId)
                    var amtCount = item.amtTotal
                    if(amtCount){
                        subTotal += Number(amtCount)
                    }
                    var amtTotal = item.amtTotal
                    if(amtTotal){
                        amtTotal = format.format({
                            value: amtTotal,
                            type: format.Type.CURRENCY
                        });
                    }

                    var amtRemaining = item.amtRemaining
                    if(amtRemaining){
                        amtRemaining = format.format({
                            value: amtRemaining,
                            type: format.Type.CURRENCY
                        });
                    }
                    var applyingAmount = item.applyingAmount
                    if(applyingAmount){
                        applyingAmount = format.format({
                            value: applyingAmount,
                            type: format.Type.CURRENCY
                        });
                    }
                    
                    body += "<tr>"
                    body += "<td style='border: solid black 1px; border-right:none; '><b>"+item.cussId+"</b><br/># "+item.entityId+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.docNumber+" ("+item.sjpCount+")<br/>-</td>";
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.tranDate+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.dueDate+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.salesRep+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+amtTotal+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+amtRemaining+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.daysOverDue+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+applyingAmount+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'></td>"
                    body += "<td style='border: solid black 1px; border-right:none;'></td>"
                    body += "<td style='border: solid black 1px; border-left:none; '></td>"
                    body += "</tr>"
                });
                log.debug('jumlahNota', jumlahNota)
                if(subTotal){
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
                body += "<tr>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; font-size:12px; font-weight:bold;' colspan='4'>Jumlah Nota :"+jumlahNota+"</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; border-left:none; font-size:10px; font-weight:bold;'>TOTAL</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; border-left:none; font-size:10px; font-weight:bold;'>"+subTotal+"</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-left:none; font-size:12px; font-weight:bold;' colspan='6'></td>"
                body += "</tr>"

                body += "</tbody>";
                body += "</table>";

                // footer
                footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:10px'>";
                footer += "<tbody>";
                footer += "<tr>"
                footer += "<td style='width:25%;'></td>"
                footer += "<td style='width:25%;'></td>"
                footer += "<td style='width:25%;'></td>"
                footer += "<td style='width:25%;'></td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; height:100px;'>Kolektor/Salesman,</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; height:100px;'>Administrasi,</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; height:100px;'>Kasir,</td>"
                footer += "<td style='border: solid black 1px; border-bottom:none; height:100px;'>menyetujui,</td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; border-top:none;'>Tgl:</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; border-top:none;'>Tgl:</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-bottom:none; border-top:none;'>Tgl:</td>"
                footer += "<td style='border: solid black 1px; border-bottom:none; border-top:none;'>Tgl:</td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='border: solid black 1px; border-right:none; border-top:none;'>Nama:</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-top:none;'>Nama:</td>"
                footer += "<td style='border: solid black 1px; border-right:none; border-top:none;'>Nama:</td>"
                footer += "<td style='border: solid black 1px; border-top:none;'>Nama:</td>"
                footer += "</tr>"

                footer += "<tr>"
                footer += "<td style='' colspan='2'><i>*/n setelah nofaktur menunjukan faktur sudah berapakali ditagih</i></td>"
                footer += "<td style='align:right;' colspan='2'>"+formattedDate+" "+formattedTime+ " " +roleName+"</td>"
                footer += "</tr>"
              
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
                xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 21cm; width: 29.7cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='20%'>";
                xml += body;
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