/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
    function(render, search, record, log, file, http, config, format, email, runtime) {
         function getNameEmp(id){
            var empName = ''
            var searchSvp = search.lookupFields({
                type: "employee",
                id: id,
                columns: ["altname"],
            });
            empName = searchSvp.altname;
            return empName
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
        function formatNumber(num) {
            if (isNaN(num)) return "0.00";
            return Number(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        function onRequest(context) {
            try{
				var logoUrl = '';
				try {
					var logoFile = file.load({
						id: 4714
					});
					logoUrl = logoFile.url;
				} catch(e) {
					log.error('Logo Load Error', e);
				}
					
                var recid = context.request.parameters.recid;
                log.debug('recid', recid)
                if(recid){
                    var recLoad = record.load({
                        type : 'customrecord_tar',
                        id : recid
                    });
                    var nomor = recLoad.getValue('name');
                    var date = recLoad.getValue('custrecord_tar_date');
                    var staffId = recLoad.getValue('custrecord_tar_staf_id');
                    var staffName = recLoad.getText('custrecord_tar_staf_name');
                    var title = recLoad.getValue('custrecord_tar_title');
                    var mobilePhone = recLoad.getValue('custrecord_tar_mobile_phone');
                    var emrContactName = recLoad.getValue('custrecord_tar_emergency_contact_name');
                    var emrContactNo = recLoad.getValue('custrecord_tar_emergency_contact_no');
                    var purpouse = recLoad.getValue('custrecord_tar_purpose');
                    var travelFrom = recLoad.getValue('custrecord_tar_travel_from');
                    var travelTo = recLoad.getValue('custrecord_tar_travel_to');
                    var expDateDepatur = recLoad.getValue('custrecord_tar_expected_date_of_depature');
                    var expDateReturn = recLoad.getValue('custrecord_tar_expected_date_of_return');
                    var numberOfDays = recLoad.getValue('custrecord_tar_number_of_days');
                    var advanceRequest = recLoad.getValue('custrecord_tar_advance_request_amount');
                    var createdby = recLoad.getText('custrecord_tar_created_by');
                    var tarStatus = recLoad.getValue('custrecord_tar_status');
                    
                    var approveSupervisiorBy = recLoad.getText('custrecord_tar_next_approver');
                    var lastApproveManager = recLoad.getText('custrecord_tar_last_apprv_mngr');
                    
                    var formattedDate = format.format({
						value: lastApproveManager,
						type: format.Type.DATETIMETZ,
						timezone: format.Timezone.ASIA_JAKARTA
					});
                    var allDataPassenger = [];
                    var countPassenger = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_link_id_tar'
                    });
                    log.debug('countPassenger', countPassenger)
                    if(countPassenger > 0){
                        for(var j = 0; j< countPassenger; j++){
                            var contactDetail = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_contact_details',
                                line : j
                            })
                             var note = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_notes',
                                line : j
                            })
                             var psType = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_type',
                                line : j
                            })
                            var psTypeV = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_type',
                                line : j
                            })
                            var psNameId = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_passengers_name',
                                line : j
                            })
                            var psName
                            log.debug('psTypeV', psTypeV)
                            if(psTypeV == '1'){
                                psName = getNameEmp(psNameId)
                                log.debug('psName', psName)
                            }else{
                                psName = recLoad.getSublistValue({
                                    sublistId : 'recmachcustrecord_link_id_tar',
                                    fieldId : 'custrecord_ter_pssngr_non_staff',
                                    line : j
                                })
                            }
                            
                            var psStaffId = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_link_id_tar',
                                fieldId : 'custrecord_tar_staff_id',
                                line : j
                            })
                           
                            allDataPassenger.push({
                                contactDetail : contactDetail,
                                note : note,
                                psName : psName,
                                psType : psType,
                                psStaffId : psStaffId
                            })
                        }
                    }
                    var allApprovalBy = [];
                    var approvBudgetHolderat = recLoad.getValue('custrecord_tar_approve_budget_holder')

                    
                    var allDataLine = [];
                    function getInitialNumber(costCenter) {
                        var match = costCenter.match(/^\d+/);
                        return match ? match[0] : '';
                    }
                    var countLine = recLoad.getLineCount({
                        sublistId : 'recmachcustrecord_tar_e_id'
                    });
                    if(countLine > 0){
                        for(var i = 0; i < countLine; i++){
                            var precentage = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_percentage',
                                line : i
                            });
                            var desc = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_memo',
                                line : i
                            });
                            var account = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_account',
                                line : i
                            });
                            var accountCode = getInitialNumber(account)
                            var costCount = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_cost_center',
                                line : i
                            });
                            var costCountry = getInitialNumber(costCount)
                            var project = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_project_code',
                                line : i
                            });
                            var projectCode = getInitialNumber(project)
                            var sofName = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_source_of_funding',
                                line : i
                            });
                            var sof = getInitialNumber(sofName)
                            var deaName = recLoad.getSublistText({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_project_task',
                                line : i
                            });
                            var dea = getInitialNumber(deaName)
                            var estimateCost = recLoad.getSublistValue({
                                sublistId : 'recmachcustrecord_tar_e_id',
                                fieldId : 'custrecord_tare_amount',
                                line : i
                            });
                            var approvalBy = recLoad.getSublistText({
								sublistId : 'recmachcustrecord_tar_e_id',
								fieldId : 'custrecord_tare_approver',
								line : i
							});
							
							if(approvalBy && allApprovalBy.indexOf(approvalBy) === -1){
								allApprovalBy.push(approvalBy);
							}
							
                            allDataLine.push({
                                precentage : precentage,
                                desc : desc,
                                accountCode : accountCode,
                                costCountry : costCountry,
                                projectCode : projectCode,
                                sof : sof,
                                dea : dea,
                                estimateCost : estimateCost
                            })
                        }
                        var approvBudgetHolderBy = allApprovalBy.join(', ');


                        // page print
                        var response = context.response;
                        var xml = "";
                        var header = "";
                        var body = "";
                        var headerHeight = '8%';
                        var style = "";
                        var footer = "";
                        var pdfFile = null;
                        function formatDateToDDMMYYYY(dateObj) {
                            if (!dateObj) return '';

                            // Pastikan input adalah Date object
                            var date = new Date(dateObj);

                            // Ambil komponen tanggal
                            var day = String(date.getDate()).padStart(2, '0');
                            var month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() dimulai dari 0
                            var year = date.getFullYear();

                            // Gabungkan ke format DD/MM/YYYY
                            return `${day}/${month}/${year}`;
                        }
                        var dateFormat = formatDateToDDMMYYYY(date)
                        var expDatedepFormat = formatDateToDDMMYYYY(expDateDepatur)
                        var expDateretFormat = formatDateToDDMMYYYY(expDateReturn)
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
						
						
						// Baris 1: Logo di tengah
						header += "<tr>";
						header += "<td style='width:100%; align:right; vertical-align:middle;'>";
						if(logoUrl) {
							header += "<img src='" + logoUrl.replace(/&/g, '&amp;') + "' style='width:27%; height:27%;' />";
						}
						header += "</td>";
						header += "</tr>";
						
						// Spacing
						
						
						// Baris 2: Judul di tengah
						header += "<tr>";
						header += "<td style='width:100%; align:center; font-weight:bold; font-size:16px;'>Travel Authorization Request</td>";
						header += "</tr>";
						
						
						header += "</tbody>";
						header += "</table>";
						

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";

                        body += "<tr>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:1%;'></td>"
                        body += "<td style='width:84%;'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td>No</td>"
                        body += "<td>:</td>"
                        body += "<td>#"+escapeXmlSymbols(nomor)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td>Date</td>"
                        body += "<td>:</td>"
                        body += "<td>"+dateFormat+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";
                        body += "<tr>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:25%;'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td colspan='5'>Staff Information</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td style='border: 1px solid black;'>Staff ID:</td>"
                        body += "<td style='border: 1px solid black; border-left:none;'>"+escapeXmlSymbols(staffId)+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none;'>Title:</td>"
                        body += "<td style='border: 1px solid black; border-left:none;' colspan='2'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;'>Staff Name:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='2'>"+escapeXmlSymbols(staffName)+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>Mobile Phone:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>"+escapeXmlSymbols(mobilePhone)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;' colspan='2'>Emergency Contact Name:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='3'>"+escapeXmlSymbols(emrContactName)+"/"+escapeXmlSymbols(emrContactNo)+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";
                        body += "<tr>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:10%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:5%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:25%;'></td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td colspan='5'>Travel Information</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td style='border: 1px solid black;'>Purpose:</td>"
                        body += "<td style='border: 1px solid black; border-left:none;' colspan='5'>"+escapeXmlSymbols(purpouse)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;'>Travel from:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='2'>"+escapeXmlSymbols(travelFrom)+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>to:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='2'>"+escapeXmlSymbols(travelTo)+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;' colspan='2'>Expected Date of Departure:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>"+expDatedepFormat+"</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='2'>Expected Date of return:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;'>"+expDateretFormat+"</td>"
                        body += "</tr>"

                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none;'>Number of days:</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none;' colspan='5'>"+escapeXmlSymbols(numberOfDays)+"</td>"
                        body += "</tr>"

                        body += "</tbody>";
                        body += "</table>";
                        log.debug('allDataPassenger', allDataPassenger)
                        if(allDataPassenger.length > 0){
                            body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                            body += "<tbody>";
                            body += "<tr>"
                            body += "<td style='width:5%;'></td>"
                            body += "<td style='width:20%;'></td>"
                            body += "<td style='width:15%;'></td>"
                            body += "<td style='width:15%;'></td>"
                            body += "<td style='width:20%;'></td>"
                            body += "<td style='width:25%;'></td>"
                            body += "</tr>"

                            body += "<tr>"
                            body += "<td colspan='6'>Passengers</td>"
                            body += "</tr>"

                            body += "<tr>"
                            body += "<td style='border: 1px solid black; align:center;'>No</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center;'>Passenger Name</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center;'>Type</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center;'>Staff ID / ID Number</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center;'>Contact Details</td>"
                            body += "<td style='border: 1px solid black; border-left:none; align:center;'>Notes</td>"
                            body += "</tr>"
                            var noPs = 1
                            allDataPassenger.forEach((data)=>{
                                var contactDetail = data.contactDetail
                                var note  = data.note
                                var psName = data.psName
                                var psType = data.psType
                                var psStaffId = data.psStaffId

                                body += "<tr>"
                                body += "<td style='border: 1px solid black; border-top:none; align:center;'>"+noPs+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(psName)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(psType)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(psStaffId)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(contactDetail)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(note)+"</td>"
                                body += "</tr>"
                                noPs ++
                            })

                            body += "</tbody>";
                            body += "</table>";
                        }
                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
                        body += "<tbody>";
                        body += "<tr>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:15%;'></td>"
                        body += "<td style='width:10%;'></td>"
                        body += "<td style='width:10%;'></td>"
                        body += "<td style='width:10%;'></td>"
                        body += "<td style='width:25%;'></td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td colspan='8'>Budget Code and Estimation Cost Information</td>"
                        body += "</tr>"
                        body += "<tr>"
                        body += "<td style='border: 1px solid black; align:center;'>Description</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>Account Code</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>Cost Centre</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>Project Code</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>SoF</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>DEA</td>"
                        body += "<td style='border: 1px solid black; border-left:none; align:center;'>Estimated Cost</td>"
                        body += "</tr>"
                        var totalEstimate = 0
                        if(allDataLine.length > 0){
                            allDataLine.forEach((data)=>{
                                var perctg = data.precentage
                                var desc = data.desc
                                var accountCode = data.accountCode 
                                var costCountry = data.costCountry
                                var projectCode  = data.projectCode 
                                var sof = data.sof 
                                var dea = data.dea 
                                var estimateCost = data.estimateCost
                                totalEstimate = Number(totalEstimate) + (estimateCost)
                                log.debug('data', data)
                                body += "<tr>"
                                body += "<td style='border: 1px solid black; border-top:none; align:center;'>"+escapeXmlSymbols(desc)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(accountCode)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(costCountry)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(projectCode)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(sof)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+escapeXmlSymbols(dea)+"</td>"
                                body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(estimateCost)+"</td>"
                                body += "</tr>"
                            })
                        }
                        body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='6'>Total</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(totalEstimate)+"</td>"
                        body += "</tr>"
                         body += "<tr>"
                        body += "<td style='border: 1px solid black; border-top:none; align:center;' colspan='6'>Advance Request</td>"
                        body += "<td style='border: 1px solid black; border-left:none; border-top:none; align:center;'>"+formatNumber(advanceRequest)+"</td>"
                        body += "</tr>"
                        body += "</tbody>";
                        body += "</table>";

                        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed; font-size:9px;\">";
						body += "<tbody>";
						body += "<tr>"
						body += "<td><i>Created By :</i><b>"+createdby+"</b></td>";
						body += "</tr>"

						// status = 2 (approved)
						if(tarStatus == 2 || tarStatus == '2'){
							body += "<tr>"
							body += "<td><i>Approved Supervisor By :</i><b>"+(approveSupervisiorBy || '')+" at "+(formattedDate || '')+"</b></td>";
							body += "</tr>"
							body += "<tr>"
							body += "<td><i>Approved Budget Holder By :</i><b>"+approvBudgetHolderBy+" at "+formattedDate+"</b></td>";
							body += "</tr>"
						} else {
							body += "<tr>"
							body += "<td><i>Approved Supervisor By :</i><b></b></td>";
							body += "</tr>"
							body += "<tr>"
							body += "<td><i>Approved Budget Holder By :</i><b></b></td>";
							body += "</tr>"
						}

						body += "<tr>"
						body += "<td>Disclaimer:</td>"
						body += "</tr>"
						body += "<tr>"
						body += "<td>All processes are done by the system.</td>"
						body += "</tr>"
						body += "</tbody>";
						body += "</table>";

                        // footer
                        footer += "<table class='tg' style='table-layout: fixed; width: 100%; font-size:8px'>";
                        footer += "<tbody>";
                        footer += "<tr>"
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
                        xml += "</macrolist>";
                        xml += "</head>";

                        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 29.7cm; width: 21cm;' header='nlheader' header-height='" + headerHeight + "' margin-left='0.7cm' margin-right='0.7cm'>";
                        xml += body;
                        xml += footer;

                        xml += "\n</body>\n</pdf>";

                        xml = xml.replace(/ & /g, ' &amp; ');
                        response.renderPdf({
                            xmlString: xml
                        });

                    }
                }
            }catch(e){
                log.error("Error", e);
            }
            
        }
        return {
            onRequest: onRequest,
        };
    }
);
