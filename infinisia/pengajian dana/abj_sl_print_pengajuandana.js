/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
        try{
            function formatRupiah(angka) {
                if (!angka) return "0,-";

                return angka
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ",-";
            }
            function removeDecimalFormat(number) {
                return number.toString().substring(0, number.toString().length - 3);
            }
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
                if(recid){
                    var recLoad = record.load({
                        type : 'customrecord_request_for_fund',
                        id : recid
                    });
                    var empIds = {
                        approveSPV: recLoad.getValue('custrecord19'),
                        approveFinance: recLoad.getValue('custrecord20'),
                        approveAccounting: recLoad.getValue('custrecord21'),
                        approveFinal: recLoad.getValue('custrecord22'),
                        knowledgeBy: recLoad.getValue('custrecord23'),
                        requestor: recLoad.getValue('custrecord_fund_employee')
                    };

                    var employeeCache = {};

                    function getEmployeeName(empId) {
                        if (!empId) return '';

                        if (!employeeCache[empId]) {
                            var empData = search.lookupFields({
                                type: search.Type.EMPLOYEE,
                                id: empId,
                                columns: ['altname', 'supervisor']
                            });

                            employeeCache[empId] = {
                                name: empData.altname || '',
                                supervisor: empData.supervisor && empData.supervisor.length
                                    ? empData.supervisor[0].value
                                    : ''
                            };
                        }

                        return employeeCache[empId];
                    }
                    var approveSPV = getEmployeeName(empIds.approveSPV).name;
                    var approveFinance = getEmployeeName(empIds.approveFinance).name;
                    var approveAccounting = getEmployeeName(empIds.approveAccounting).name;
                    var approveFinal = getEmployeeName(empIds.approveFinal).name;
                    var knowledgeBy = getEmployeeName(empIds.knowledgeBy).name;
                  

                    var empData = getEmployeeName(empIds.requestor);
                    var nameEmp = empData.name;
                    var supervisorId = empData.supervisor;

                    // var spv = searchName.supervisor;
                    // log.debug('spv', spv)
                    // var spvId = spv && spv.length > 0 ? spv[0].value : null;
                    // log.debug('spvId', spvId)
                    // var spvName = ''
                    // if(spvId){
                    //     var searchSvp = search.lookupFields({
                    //         type: "employee",
                    //         id: spvId,
                    //         columns: ["altname"],
                    //     });
                    //     spvName = searchSvp.altname;
                    //     log.debug('spvName', spvName)
                    // }
                    var date = recLoad.getText('custrecord_fund_date');
                    var noForm = recLoad.getValue('custrecord_fund_docnumb');
                    var department = recLoad.getText('custrecord_fund_department');
                    var totalPengajuan = recLoad.getValue('custrecord_total_pengajuan_dana');
                    var metodePengajuan = recLoad.getValue('custrecord_fund_payment_type');
                    var cekApprovalLevel = recLoad.getValue('custrecord_approval_level');
                    var approvalStatus = recLoad.getValue('custrecord_fund_approval')
                    var showNotif = false;
                    if(cekApprovalLevel && cekApprovalLevel.includes('Pending Setup COA')){
                        showNotif = true
                    }else{
                        if(approvalStatus == '2'){
                            showNotif = true
                        }
                    }

                    var allKeperluan = [];
                    var cekLine = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_fund_head'
                    });
                    if(cekLine > 0){
                        for(var i = 0; i < cekLine; i++){
                            var keperluan = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_fund_head',
                                fieldId : 'name',
                                line : i
                            })
                            if(keperluan){
                                allKeperluan.push(keperluan)
                            }
                        }
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
                    style += ".tg .tg-img-logo{width:150px; height:40px; object-vit:cover;}";
                    style += ".tg .tg-headerrow{align: right;font-size:12px;}";
                    style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
                    style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
                    style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
                    style += ".tg .tg-head_body{align: center;font-size:9px;font-weight: bold; background-color: #EBF7FC;}";
                    style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
                    style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
                    style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
                    style += "</style>";

                    header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
                    header += "<tbody>";
                    header += "</tbody>";
                    header += "</table>";

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";
                    body += "<tr>";
                    body += "<td style='width:35%'></td>"
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:45%'></td>"
                    body += "</tr>";

                    body += "<tr>";
                    if (urlLogo) {
                        body += "<td class='tg-headerlogo' style='width:50%;vertical-align:center; align:left; margin-left:4px;'><div style='display: flex;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
                    }else{
                        body += "<td></td>"
                    }
                    body += "<td></td>"
                    body += "<td style='align:right; font-size:18px; font-weight:bold;'>FORM PENGAJUAN DANA</td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='border-top:1px solid black;' colspan='3'></td>"
                    body += "</tr>";

                    body += "</tbody>"
                    body += "</table>"

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";
                    body += "<tr>";
                    body += "<td style='width:20%'></td>"
                    body += "<td style='width:1%'></td>"
                    body += "<td style='width:34%'></td>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:1%'></td>"
                    body += "<td style='width:24%'></td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='' colspan='4'></td>"
                    body += "<td style='font-weight:bold; align:right;'>Tanngal</td>"
                    body += "<td style='' >:</td>"
                    body += "<td style='border-bottom:1px solid black'>"+date+"</td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='' colspan='4'></td>"
                    body += "<td style='font-weight:bold; align:right;'>No. Form</td>"
                    body += "<td style='' >:</td>"
                    body += "<td style='border-bottom:1px solid black'>"+escapeXmlSymbols(noForm)+"</td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='font-weight:bold; align:right;'>NAMA</td>"
                    body += "<td style='' >:</td>"
                    body += "<td style='border-bottom:1px solid black'>"+escapeXmlSymbols(nameEmp)+"</td>"
                    body += "<td style='' colspan='4'></td>"
                    body += "</tr>";
                    body += "<tr>";
                    body += "<td style='font-weight:bold; align:right;'>DIVISI</td>"
                    body += "<td style='' >:</td>"
                    body += "<td style='border-bottom:1px solid black'>"+escapeXmlSymbols(department)+"</td>"
                    body += "<td style='' colspan='4'></td>"
                    body += "</tr>";

                    body += "<tr>";
                    body += "<td style='font-weight:bold; align:right;'>TOTAL PENGAJUAN</td>"
                    body += "<td style='' >:</td>"
                    body += "<td style='border-bottom:1px solid black'>Rp. "+formatRupiah(totalPengajuan)+"</td>"
                    body += "<td style='' colspan='4'></td>"
                    body += "</tr>";

                    log.debug('allKeperluan', allKeperluan)

                    body += "<tr>";
                    body += "<td style='font-weight:bold; vertical-align:top; align:right;'>KEPERLUAN</td>";
                    body += "<td style='vertical-align:top;'>:</td>";
                    body += "<td colspan='5' style='padding:0;'>";

                    // mulai nested table
                    body += "<table style='width:100%; border-collapse:collapse;'>";

                    allKeperluan.forEach(function(k){
                        body += "<tr>";
                        body += "<td style='border-bottom:1px solid black; padding:2px 0;'>" + escapeXmlSymbols(k) + "</td>";
                        body += "</tr>";
                    });

                    body += "</table>";

                    body += "</td>";
                    body += "</tr>";
                    body += "</tbody>"
                    body += "</table>"

                    body+= "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:10px;\">";
                    body += "<tbody>";
                    body += "<tr>";
                    body += "<td style='width:3%'></td>"
                    body += "<td style='width:10%'></td>"
                    body += "<td style='width:3%'></td>"
                    body += "<td style='width:14%'></td>"
                    body += "<td style='width:14%'></td>"
                    body += "<td style='width:14%'></td>"
                    body += "<td style='width:14%'></td>"
                    body += "<td style='width:14%'></td>"
                    body += "<td style='width:16%'></td>"
                    body += "</tr>";

                    body += "<tr style='height:30px;'>";
                    body += "</tr>";
                    log.debug('metodeTransfer', metodePengajuan)
                    function box(filled){
                        return "<div style='width:14px; height:14px; border:2px solid black; display:inline-block; " +
                            (filled ? "background:black;" : "") +
                            "'></div>";
                    }

                    var isTransfer = metodePengajuan == 1;
                    var isCash = metodePengajuan == 2;
                    body += "<tr>";
                    body += "<td>" + box(isTransfer) + "</td>"
                    body += "<td>TRANSFER</td>"
                    body += "<td></td>"
                    body += "<td style='align:center; border: 1px solid black;' colspan='2'>DIBUAT OLEH</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none;' colspan='2'>DIPERIKSA OLEH</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none;'>DISETUJUI OLEH</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none;'>MENGETAHUI</td>"
                    body += "</tr>";

                    body += "<tr style='height:60px;'>";
                    body += "<td>" + box(isCash) + "</td>"
                    body += "<td>CASH</td>"
                    body += "<td></td>"
                    body += "<td style='align:center; border: 1px solid black; border-top:none; border-bottom:none;'></td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none; border-bottom:none;'></td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none; border-bottom:none;'></td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none; border-bottom:none;'></td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none; border-bottom:none;'></td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none; border-bottom:none;'></td>"
                    body += "</tr>";

                    body += "<tr style=''>";
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td></td>"
                    body += "<td style='align:center; border: 1px solid black; border-top:none;'>"+escapeXmlSymbols(nameEmp)+"</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(approveSPV)+"</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(approveFinance)+"</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(approveAccounting)+"</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(approveFinal)+"</td>"
                    body += "<td style='align:center; border: 1px solid black; border-left:none; border-top:none;'>Mediana Hadiwidjaja</td>"
                    body += "</tr>";

                    body += "</tbody>"
                    body += "</table>"

                    //add by kurnia 28 Jan 2026
                    var remarks = recLoad.getValue('custrecord27')
                    
                    log.debug('condition norif', {remarks : remarks, showNotif : showNotif})
                    if(showNotif == true){
                        body += "<div style='margin-top:20px;'>"
                        body += "<p style='font-size:10px;'>This form does not require a signature as it has been approved by the system.</p>"
                        body += "</div>"
                    }
                    //

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
                    xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm; margin-top:5px; padding-top:5px;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='7%'>";
                    xml += body;
                    xml += "\n</body>\n</pdf>";
        
                    xml = xml.replace(/ & /g, ' &amp; ');
                    response.renderPdf({
                        xmlString: xml
                    });
                }
               
            }
        }catch(e){
            log.debug('error',e)
        }
        return {
            onRequest: onRequest,
        };
    });