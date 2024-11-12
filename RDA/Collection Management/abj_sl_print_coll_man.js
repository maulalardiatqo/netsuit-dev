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
        

                const currentDate = new Date();

                // Format day of the week
                const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                const dayName = days[currentDate.getDay()];

                // Format date
                const year = currentDate.getUTCFullYear();
                const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
                const date = String(currentDate.getUTCDate()).padStart(2, "0");
                const formattedDate = `${dayName} ${year}/${month}/${date}`;

                const timezoneOffset = currentDate.getTimezoneOffset() * 60000; // Mengubah offset ke milidetik
                const localTime = new Date(currentDate.getTime() - timezoneOffset);
                
                const hours = String(localTime.getHours()).padStart(2, "0");
                const minutes = String(localTime.getMinutes()).padStart(2, "0");
                const formattedTime = `${hours}:${minutes}`;



                var recid = context.request.parameters.id;
                var searchCreate = search.load({
                    id: "customsearch875",
                });
                if(recid){
                    searchCreate.filters.push(search.createFilter({name: "internalid", operator: search.Operator.ANYOF, values: recid}));
                }
                var searchCreateSet = searchCreate.run();
                var result = searchCreateSet.getRange(0, 1);
                var collRecord = result[0];

                var docNo = collRecord.getValue({name :'tranid'})
                var areaToPrint = ''
                var allData = []
                var allIdInv = collRecord.getValue({ name :'custbody_rda_invoice_number'});
                var allIdInvArray = allIdInv.split(',').map(function(id) {
                    return id.trim(); // Menghapus spasi jika ada
                });
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
                        ["mainline","is","F"],
                        "AND",
                        ["internalid", "anyof"].concat(allIdInvArray)
                    ],
                    columns:
                    [
                        search.createColumn({name: "tranid", label: "Document Number"}),
                        search.createColumn({name: "amountremaining", label: "Amount Remaining"}),
                        search.createColumn({name: "total", label: "Amount (Transaction Total)"}),
                        search.createColumn({name: "classnohierarchy", label: "Division (no hierarchy)"}),
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
                        search.createColumn({name: "daysoverdue", label: "Days Overdue"}),
                        search.createColumn({
                            name: "recordtype",
                            join: "applyingTransaction",
                            label: "Record Type"
                        })
                    
                    ]
                });
                var searchResultCount = invoiceSearchObj.runPaged().count;
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
                    var classId = result.getText({
                        name : "classnohierarchy"
                    });
                    log.debug('classId', classId)
                    var cussId = result.getText({
                        name: "entity"
                    });
                    var tranDate = result.getValue({
                        name: "trandate"
                    })
                    var dueDate = result.getValue({
                        name: "duedate"
                    })
                    var salesRep = result.getText({
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
                    var applyingAmount = 0
                    var applyingTrans = result.getValue({
                        name: "recordtype",
                        join: "applyingTransaction",
                    });
                    if(applyingTrans == 'creditmemo'){
                        applyingAmount = result.getValue({
                            name: "applyinglinkamount",
                        })
                    }
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
                var allClass = [];
                var groupedData = {};   
                log.debug('allData', allData)
                
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

                var allClassString = allClass.join(', ');
                var subsId = collRecord.getValue({name : 'subsidiary'});
                var subAdders = ''
                if(subsId){
                    var recSub = record.load({
                        type: "subsidiary",
                        id: subsId,
                    })
                    var addresSubsidiaries = recSub.getValue('mainaddress_text');
                    if(addresSubsidiaries){
                        subAdders = addresSubsidiaries
                    }
                }
                var dateRec = collRecord.getValue({name : 'trandate'})

                var kolektor = collRecord.getText({name :'custbody_rda_kolektor'});
                var halaman = 1
                // page print
                var response = context.response;
                var xml = "";
                var header = "";
                var body = "";
                var headerHeight = '26%';
                var style = "";
                var footer = "";
                var pdfFile = null;
                
                // css
                style += "<style type='text/css'>";
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
                header += "<tr><td style='width:30%;'></td><td style='width:40%;'></td><td style='width:12%;'></td><td style='width:1%;'></td><td style='width:17%;'></td></tr>";
                
                header += "<tr><td style='font-size:15px; font-weight:bold;'>PT. Rejeki Damai Abadi</td>";
                header += "<td rowspan='4' style='align:center; font-size:20px; font-weight:bold;'>Surat Jalan Penagihan</td>";
                header += "<td>Nomor Dokumen</td><td>:</td><td>" + escapeXmlSymbols(docNo) + "</td></tr>";
                
                header += "<tr><td rowspan='3'>" + escapeXmlSymbols(subAdders) + "</td><td>Tanggal Penagihan</td><td>:</td><td style='font-weight:bold'>" + dateRec + "</td></tr>";
                header += "<tr><td>Kolektor</td><td>:</td><td style='font-weight:bold'>" + escapeXmlSymbols(kolektor) + "</td></tr>";
                header += "<tr><td>Halaman</td><td>:</td><td style='font-weight:bold'><pagenumber/></td></tr>";
                header += "<tr><td colspan='5'>Division: <b>" + escapeXmlSymbols(allClassString) + " </b></td></tr>";
                header += "<tr style='height:20px'></tr>";
                
                header += "</tbody>";
                header += "</table>";
                
                // Kolom header tabel
                header += "<table class='tg' width='100%' style='table-layout:fixed; font-size:10px;'>";
                header += "<tbody>";
                header += "<tr><td style='width:14%;'></td><td style='width:14%;'></td><td style='width:6%;'></td><td style='width:6%;'></td>";
                header += "<td style='width:9%;'></td><td style='width:8%;'></td><td style='width:8%;'></td><td style='width:3%'></td>";
                header += "<td style='width:6%;'></td><td style='width:6%;'></td><td style='width:6%;'></td><td style='width:13%;'></td></tr>";
                
                // Kolom header baris isi tabel
                header += "<tr><td style='border: solid black 1px; border-right:none;'>Customer</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Nomor Faktur<br/>Performa Invoice Number</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Tanggal Faktur</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Tanggal Jt Tempo</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Salesman atau No Kontra Bon</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Nilai Faktur</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Out Standing</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Over Due</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Retur</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Tunai</td>";
                header += "<td style='border: solid black 1px; border-right:none;'>Nominal</td>";
                header += "<td style='border: solid black 1px; border-left:none;'>Pembayaran Giro<br/>No Giro/Bank/Jatuh Tempo</td></tr>";
                header += "<tr><td colspan='12' style='border: solid black 1px; border-top: none; font-size:12px; font-weight:bold;'>" + escapeXmlSymbols(areaToPrint) + "</td></tr>";
                
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
                var totalOutstand = 0
                finalData.forEach(item => {
                    jumlahNota ++
                    var amtCount = item.amtTotal
                    if(amtCount){
                        subTotal += Number(amtCount)
                    }
                    var amtRemainCount = item.amtRemaining
                    if(amtRemainCount){
                        totalOutstand += Number(amtRemainCount)
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
                    body += "<td style='border: solid black 1px; border-right:none; '><b>"+escapeXmlSymbols(item.cussId)+"</b><br/># "+escapeXmlSymbols(item.entityId)+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+escapeXmlSymbols(item.docNumber)+" ("+item.sjpCount+")<br/>-</td>";
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.tranDate+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.dueDate+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+escapeXmlSymbols(item.salesRep)+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none; align:right;'>"+amtTotal+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none; align:right;'>"+amtRemaining+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'>"+item.daysOverDue+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none; align:right;'>"+applyingAmount+"</td>"
                    body += "<td style='border: solid black 1px; border-right:none;'></td>"
                    body += "<td style='border: solid black 1px; border-right:none;'></td>"
                    body += "<td style='border: solid black 1px; border-left:none; '></td>"
                    body += "</tr>"
                });
                if(subTotal){
                    subTotal = format.format({
                        value: subTotal,
                        type: format.Type.CURRENCY
                    });
                }
                if(totalOutstand){
                    totalOutstand = format.format({
                        value: totalOutstand,
                        type: format.Type.CURRENCY
                    });
                }
                body += "<tr>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; font-size:12px; font-weight:bold;' colspan='4'>Jumlah Nota :"+jumlahNota+"</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; border-left:none; font-size:10px; font-weight:bold;'>TOTAL</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; font-size:10px; font-weight:bold; align:right;'>"+subTotal+"</td>"
                body += "<td style='border: solid black 1px; border-top:none; border-right: none; font-size:10px; font-weight:bold; align:right;'>"+totalOutstand+"</td>"
                body += "<td style='border: solid black 1px; border-top:none; font-size:12px; font-weight:bold;' colspan='5'></td>"
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
                footer += "<td style='border: solid black 1px; border-bottom:none; height:100px;'>Menyetujui,</td>"
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
                footer += "<td style='align:right;' colspan='2'>"+formattedDate+" "+formattedTime+ " " +escapeXmlSymbols(roleName)+"</td>"
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