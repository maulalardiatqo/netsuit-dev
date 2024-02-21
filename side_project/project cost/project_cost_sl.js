/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search", "N/record", "N/log", "N/file", "N/http", 'N/config', 'N/format', 'N/email', 'N/runtime'],
function(render, search, record, log, file, http, config, format, email, runtime) {
    function formatNumber(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
    function ubahFormatTanggal(tanggal) {
        var tanggalArray = tanggal.split('/');
        var day = parseInt(tanggalArray[0], 10);
        var month = parseInt(tanggalArray[1], 10);
        var year = parseInt(tanggalArray[2], 10);
        var namaBulan = [
            'Januari', 'Februari', 'Maret', 'April',
            'Mei', 'Juni', 'Juli', 'Agustus',
            'September', 'Oktober', 'November', 'Desember'
        ];
        var tanggalFormat = day + ' ' + namaBulan[month - 1] + ' ' + year;
    
        return tanggalFormat;
    }
    function onRequest(context) {
        var recid = context.request.parameters.id;
        log.debug('recId', recid);
        var recProject = record.load({
            type : 'customrecord_project_cost',
            id : recid,
            isDynamic : false,
        })
        var subsidiary = recProject.getValue('custrecord_pc_subsidiary');
        if(subsidiary){
            var subRec = record.load({
                type: 'subsidiary',
                id : subsidiary,
                isDynamic : false,
            });
            var legalName = subRec.getValue('legalname');
            var logo = subRec.getValue('logo');
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
        var noProject =  recProject.getValue('name');
        var dateProject = recProject.getValue('custrecord_pc_date');
        if(dateProject){
            dateProject = format.format({
                value: dateProject,
                type: format.Type.DATE
            });
        }
        dateProject = ubahFormatTanggal(dateProject)
        var customer = recProject.getValue('custrecord_pc_customer');
        var customerName
        if(customer){
            var custRec = record.load({
                type : 'customer',
                id : customer,
                isDynamic : false
            })
            customerName = custRec.getValue('companyname');
            log.debug('className', className);
        }

        var namaProject = recProject.getValue('custrecord_pc_nama_proyek');
        var jenisProject = recProject.getValue('custrecord_pc_jenis_proyek');
        var mulaiProject = recProject.getValue('custrecord_pc_mulai_proyek');
        if(mulaiProject){
            mulaiProject = format.format({
                value: mulaiProject,
                type: format.Type.DATE
            });
        }
        mulaiProject = ubahFormatTanggal(mulaiProject)
        var akhirProject = recProject.getValue('custrecord_pc_akhir_periode_proyek');
        if(akhirProject){
            akhirProject = format.format({
                value: akhirProject,
                type: format.Type.DATE
            });
        }
        akhirProject = ubahFormatTanggal(akhirProject);
        var periodeProject = recProject.getText('custrecord_pc_period')
        var noPks = recProject.getValue('custrecord_pc_nomor_pks');
        var classId = recProject.getValue('custrecord_pc_class');
        var className
        if(classId){
            var recClass = record.load({
                type : 'classification',
                id : classId,
                isDynamic : false
            })
            className = recClass.getValue('name');
            log.debug('className', className);
        }
        var noteProject = recProject.getValue('custrecord_pc_note');

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
        style += ".tg .tg-img-logo{width:65px; height:50px; object-vit:cover;}";

        style += ".tg .tg-headerrow{align: right;font-size:12px;}";
        style += ".tg .tg-headerrow_legalName{align: right;font-size:13px;word-break:break-all; font-weight: bold;}";
        style += ".tg .tg-headerrow_Total{align: right;font-size:16px;word-break:break-all; font-weight: bold;}";
        style += ".tg .tg-headerrow_left{align: left;font-size:12px;}";
        style += ".tg .tg-head_body { text-align: left; font-size: 6px; font-weight: bold; border: 1px solid black; border-collapse: collapse; }";
        style += ".tg .tg-headBody{align: left;font-size:12px; border: 1px solid black;}";
        style += ".tg .tg-b_body{align: left;font-size:12px; border-bottom: solid black 2px;}";
        style += ".tg .tg-f_body{align: right;font-size:14px;border-bottom: solid black 2px;}";
        style += ".tg .tg-foot{font-size:11px; color: #808080; position: absolute; bottom: 0;}";
        style += "</style>";

        header += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;\">";
        header += "<tbody>";
        header += "</tbody>";
        header += "</table>";

        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:14px;font-weight: bold; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:5%'></td>";
        body += "<td style='width:30%'></td>";
        body += "<td style='width:30%'></td>";
        body += "<td style='width:35%'></td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>";
        if (urlLogo) {
            body += "<td rowspan='4' class='tg-headerlogo' style='width:50%;vertical-align:center; align:left;'><div style='display: flex; height:100px; width:150px;'><img class='tg-img-logo' src= '" + urlLogo + "' ></img></div></td>";
        }
        body += "<td style='align: center;'>"+legalName.toUpperCase()+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>";
        body += "<td style='align: center;'>"+className.toUpperCase()+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>";
        body += "<td style='align: center;'>ESTIMASI BIAYA PROYEK</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td></td>";
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";

        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:14px; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='width:12%'></td>";
        body += "<td style='width:2%'></td>";
        body += "<td style='width:81%'></td>";
        body += "</tr>";
        
        body += "<tr>";
        body += "<td style='font-weight: bold'>NO. PROJECT COST</td>";
        body += "<td >:</td>";
        body += "<td>"+noProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>DATE</td>";
        body += "<td >:</td>";
        body += "<td>"+dateProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>CUSTOMER</td>";
        body += "<td >:</td>";
        body += "<td>"+customerName+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>NAMA PROYEK</td>";
        body += "<td >:</td>";
        body += "<td>"+namaProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>JENIS PROYEK</td>";
        body += "<td >:</td>";
        body += "<td>"+jenisProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>PERIOD PROYEK</td>";
        body += "<td >:</td>";
        body += "<td>"+mulaiProject + " s/d " + akhirProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='font-weight: bold'>NOMOR PKS</td>";
        body += "<td >:</td>";
        body += "<td>"+noPks+"</td>";
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";
        
        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:12px; \">";
        body += "<tbody>";

        body += "<tr>";
        body += "<td style='height:10px'></td>";
        body += "</tr>";

        body += "</tbody>";
        body += "</table>";


        body += "<table class='tg' width=\"100%\"  style=\"table-layout:fixed;font-size:12px; \">";
        body += "<tbody>";
        
        body += "<tr>";
        body += "<td style='width:12%'></td>";
        body += "<td style='width:18%'></td>";
        body += "<td style='width:5%'></td>";
        body += "<td style='width:3%'></td>";
        body += "<td style='width:6%'></td>";
        body += "<td style='width:5%'></td>";
        body += "<td style='width:3%'></td>";
        body += "<td style='width:6%'></td>";
        body += "<td style='width:3%'></td>";
        body += "<td style='width:6%'></td>";
        body += "<td style='width:10%'></td>";
        body += "<td style='width:7%'></td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='2' rowspan='3'>Keterangan</td>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='3' rowspan='2'>Estimasih</td>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='3'>Aktual</td>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='2' rowspan='3'>Selisih (+/-)</td>";
        body += "<td style='border: 1px solid black; border-right:none; align:center; font-weight:bold; vertical-align: middle;' rowspan='3'>Keterangan</td>";
        body += "<td style='border: 1px solid black; align:center; font-weight:bold; vertical-align: middle;' rowspan='3'>Persetujuan</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-right:none; border-top:none; align:center; font-weight:bold; vertical-align: middle;' colspan='3'>"+periodeProject+"</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:center; font-weight:bold; vertical-align: middle;'>Unit</td>";
        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='2'>Nominal (Rp)</td>";
        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:center; font-weight:bold; vertical-align: middle;'>Unit</td>";
        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:center; font-weight:bold; vertical-align: middle;' colspan='2'>Nominal (Rp)</td>";
        body += "</tr>";

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-top:none; align:left; font-weight:bold; vertical-align: middle;' colspan='12'>PENDAPATAN</td>";
        body += "</tr>";

        body += getLinePendapatan(context, recProject)

        body += "<tr>";
        body += "<td style='border: 1px solid black; border-top:none; align:left; font-weight:bold; vertical-align: middle;' colspan='12'>PENDAPATAN</td>";
        body += "</tr>";

        body += getLineBiaya(context, recProject)

        body += "</tbody>";
        body += "</table>";

        footer += "<table class='tg' style='table-layout: fixed;'>";
        footer += "<tbody>";
        footer += "<tr class='tg-foot'>";
        footer += "<td style='align:left'></td>"
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
        xml += "<body font-size='10' style='font-family: Tahoma,sans-serif;height: 32cm; width: 48cm;' header='nlheader' header-height='" + headerHeight + "' footer='nlfooter' footer-height='3%'>";
        xml += body;
        xml += "\n</body>\n</pdf>";

        xml = xml.replace(/ & /g, ' &amp; ');
        response.renderPdf({
            xmlString: xml
        });
        
    }
    function getLinePendapatan(context, recProject){
        var lineCount = recProject.getLineCount({
            sublistId: 'recmachcustrecord_pcd_id'
        });
        if(lineCount > 0){
            var body = "";
            var totalEstNominal = 0
            for(var index = 0; index < lineCount; index++){
                var isPendapatan = recProject.getSublistValue({
                    sublistId : 'recmachcustrecord_pcd_id',
                    fieldId : 'custrecord_pcd_pendapatan',
                    line : index,
                })
                if(isPendapatan === true){
                    log.debug('isPendapatan', isPendapatan);
                    var keterangan = recProject.getSublistText({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_keterangan',
                        line : index,
                    })
                    var estUnit = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_estimasi_unit',
                        line : index,
                    })
                    var estNominal = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_estimasi_nominal',
                        line : index,
                    })
                    if(estNominal){
                        totalEstNominal += Number(estNominal);
                    }
                    var actUnit = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_actual_unit',
                        line : index,
                    })
                    var actNominal = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_actual_nominal',
                        line : index,
                    })
                    var selisih = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_selisih',
                        line : index,
                    })
                    var ketLine = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_keterangan_line',
                        line : index,
                    })
                    var persetujuan = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_persetujuan',
                        line : index,
                    })
                    
                    body += "<tr>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:left;'></td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:left;'>"+keterangan+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>"+estUnit+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-left:none; border-right:none; align:right;'>"+formatNumber(estNominal)+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>"+actUnit+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-left:none; border-right:none; align:right;'>"+formatNumber(actNominal)+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+formatNumber(selisih)+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+ketLine+"</td>";
                    body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+persetujuan+"</td>";
                    body += "</tr>";

                }
                
            }
            body += "<tr>";
            body += "<td style='border: 1px solid black; border-top:none; align:left; font-weight:bold; vertical-align: middle;' colspan='12'></td>";
            body += "</tr>";

            body += "<tr>";
            body += "<td style='border: 1px solid black; border-top:none; align:left; font-weight:bold; vertical-align: middle;' colspan='2'>TOTAL PENDAPATAN</td>";
            body += "<td style='border: 1px solid black; border-right:none; border-left:none; border-top:none; align:right; font-weight:bold; vertical-align: middle;' colspan='2'>Rp.</td>";
            body += "<td style='border: 1px solid black; border-left:none; border-right:none; border-top:none; align:right; font-weight:bold; vertical-align: middle;'>"+formatNumber(totalEstNominal)+"</td>";
            body += "<td style='border: 1px solid black; align:left; font-weight:bold; vertical-align: middle; border-top:none;' colspan='7'></td>";
            body += "</tr>";
            return body;
        }
    }
    function getLineBiaya(context, recProject){
        var lineCount = recProject.getLineCount({
            sublistId: 'recmachcustrecord_pcd_id'
        });
        if(lineCount > 0){
            var body = "";
            var totalEstNominal = 0
            var groupedData = {};
            for(var index = 0; index < lineCount; index++){
                var isBiaya = recProject.getSublistValue({
                    sublistId : 'recmachcustrecord_pcd_id',
                    fieldId : 'custrecord_pcd_biaya',
                    line : index,
                });
                if(isBiaya === true){
                    var tyPeBiaya =  recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_type',
                        line : index
                    })
                    if (!groupedData[tyPeBiaya]) {
                        groupedData[tyPeBiaya] = [];
                    }
                    
                    var typeTrans = recProject.getSublistText({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_type',
                        line : index,
                    })
                    var keterangan = recProject.getSublistText({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_keterangan',
                        line : index,
                    })
                    var estUnit = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_estimasi_unit',
                        line : index,
                    })
                    var estNominal = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_estimasi_nominal',
                        line : index,
                    })
                    if(estNominal){
                        totalEstNominal += Number(estNominal);
                    }
                    var actUnit = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_actual_unit',
                        line : index,
                    })
                    var actNominal = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_actual_nominal',
                        line : index,
                    })
                    var selisih = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_selisih',
                        line : index,
                    })
                    var ketLine = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_keterangan_line',
                        line : index,
                    })
                    var persetujuan = recProject.getSublistValue({
                        sublistId : 'recmachcustrecord_pcd_id',
                        fieldId : 'custrecord_pcd_persetujuan',
                        line : index,
                    })
                    var data = {
                        typeTrans : typeTrans,
                        keterangan : keterangan,
                        estUnit : estUnit,
                        estNominal : estNominal,
                        actUnit : actUnit,
                        actNominal : actNominal,
                        selisih : selisih,
                        ketLine : ketLine,
                        persetujuan : persetujuan

                    }
                    groupedData[tyPeBiaya].push(data);
                }
            }
            // log.debug('groupedData', groupedData);
            for (var tyPeBiaya in groupedData) {
                if (groupedData.hasOwnProperty(tyPeBiaya)) {
                    var jumlahData = groupedData[tyPeBiaya].length;
                    // log.debug('jumlahData', jumlahData);
                    var lineGrouped = groupedData[tyPeBiaya];
                    var headerData = lineGrouped[0]
                    var typeTrans = headerData.typeTrans
                    // log.debug('typeTrans', typeTrans);
                    for (var i = 0; i < groupedData[tyPeBiaya].length; i++) {
                        var data = groupedData[tyPeBiaya][i];
                        var keterangan = data.keterangan
                        var estUnit = data.estUnit
                        var estNominal = data.estNominal
                        var actUnit = data.actUnit
                        var actNominal = data.actNominal
                        var selisih = data.selisih
                        var ketLine = data.ketLine
                        var persetujuan = data.persetujuan

                        body += "<tr>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:left;'>"+typeTrans+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:left;'>"+keterangan+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>"+estUnit+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none; border-right:none; align:right;'>"+formatNumber(estNominal)+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>"+actUnit+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none; border-right:none; align:right;'>"+formatNumber(actNominal)+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-right:none; align:right;'>Rp.</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+formatNumber(selisih)+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+ketLine+"</td>";
                        body += "<td style='border: 1px solid black; border-top:none; border-left:none; align:right;'>"+persetujuan+"</td>";
                        body += "</tr>";
                    }

                }
            }
            return body;
        }
    }
    return {
        onRequest: onRequest,
    };
});