/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(["N/ui/serverWidget", "N/config", "N/search", "N/record", "N/ui/message", "N/url", "N/redirect", "N/xml", "N/file", "N/encode", "N/currency", "N/runtime", "N/format"], function(serverWidget, config, search, record, message, url, redirect, xml, file, encode, currency, runtime, format) {
    function onRequest(context){
        var contextRequest = context.request;
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Download Rekap Gaji'
            });
            var period = form.addField({
                id: 'custpage_filter_period',
                type: serverWidget.FieldType.SELECT,
                label: 'Periode Gaji',
                source: 'customrecord_monthly_period_gaji',
            });
            form.addSubmitButton({
                label: 'Download'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            var periodeFilter =  contextRequest.parameters.custpage_filter_period;
            log.debug('period', periodeFilter);
            try{
                var searchPeriodGaji = search.create({
                    type : 'customrecord_monthly_period_gaji',
                    columns : ['internalid', 'name'],
                    filters: [{
                        name: 'internalid',
                        operator: 'is',
                        values: periodeFilter
                    }]
                });
                var searchPeriodGajiset = searchPeriodGaji.run();
                searchPeriodGaji = searchPeriodGajiset.getRange({
                    start : 0,
                    end : 1
                });
                if(searchPeriodGaji.length > 0){
                    var searchPeriodRecord = searchPeriodGaji[0];
                    var namePeriod = searchPeriodRecord.getValue({
                        name : 'name'
                    });
                    log.debug('namePeriod', namePeriod);

                    if(namePeriod){
                        var allData = [];
                        var searchGaji = search.create({
                            type : 'customrecord_gaji',
                            columns : ['custrecord_employee_gaji', 'custrecord_status_gaji', 'custrecord_period_gaji', 'custrecord_gaji_gaji_pokok', 'custrecord_meal_allowance_gaji', 'custrecord_transport_allowance_gaji', 'custrecord_uang_lembur', 'custrecord_jkk', 'custrecord_jkm', 'custrecord_jht', 'custrecord_jp', 'custrecord_jks', 'custrecord_jks_4per', 'custrecord_tunjangan_pph', 'custrecord_total_income_gaji', 'custrecord_pph21', 'custrecord8', 'custrecord_premi_jkm', 'custrecord_premi_jkk', 'custrecord_premi_jht', 'custrecord_premi_jp', 'custrecord_premi_jks', 'custrecord_premi_jks_1per', 'custrecord_potongan', 'custrecord_take_home_pay'],
                            filters : [{
                                name : 'custrecord_period_gaji',
                                operator: 'is',
                                values: namePeriod
                            }]
                        });
                        var searchGajiSet = searchGaji.runPaged().count;
                        log.debug('searchGajiSet', searchGajiSet);
                        searchGaji.run().each(function(row){
                            var employeeId = row.getValue({
                                name : 'custrecord_employee_gaji'
                            });
                            var employeeName = row.getText({
                                name : 'custrecord_employee_gaji'
                            });
                            var status = row.getText({
                                name: 'custrecord_status_gaji'
                            });
                            var gajiPokok = row.getValue({
                                name : 'custrecord_gaji_gaji_pokok'
                            });
                            var meal = row.getValue({
                                name : 'custrecord_meal_allowance_gaji'
                            });
                            var transport = row.getValue({
                                name : 'custrecord_transport_allowance_gaji'
                            });
                            var lembur = row.getValue({
                                name : 'custrecord_uang_lembur'
                            }) || 0;
                            var jkk = row.getValue({
                                name : 'custrecord_jkk'
                            })  || 0;
                            var jkm = row.getValue({
                                name : 'custrecord_jkm'
                            }) || 0;
                            var jht = row.getValue({
                                name : 'custrecord_jht'
                            }) || 0;
                            var jp = row.getValue({
                                name : 'custrecord_jp'
                            }) || 0;
                            var jk5 = row.getValue({
                                name : 'custrecord_jks'
                            }) || 0;
                            var jk4 = row.getValue({
                                name : 'custrecord_jks_4per'
                            }) || 0;
                            var tunjanganpph21 = row.getValue({
                                name : 'custrecord_tunjangan_pph'
                            }) || 0;
                            var totalIncome = row.getValue({
                                name : 'custrecord_total_income_gaji'
                            }) || 0;
                            var pph21Perusahaan = row.getValue({
                                name : 'custrecord_pph21'
                            }) || 0;
                            var pph21karyawan = row.getValue({
                                name : 'custrecord8'
                            }) || 0;
                            var premiJKM = row.getValue({
                                name : 'custrecord_premi_jkm'
                            }) || 0;
                            var premiJKK = row.getValue({
                                name : 'custrecord_premi_jkk'
                            }) || 0;
                            var premiJHT = row.getValue({
                                name: 'custrecord_premi_jht'
                            }) || 0;
                            var premiJP = row.getValue({
                                name : 'custrecord_premi_jp'
                            }) || 0;
                            var premiJKS = row.getValue({
                                name : 'custrecord_premi_jks'
                            }) || 0;
                            var premiJKS1 = row.getValue({
                                name : 'custrecord_premi_jks_1per'
                            }) || 0;
                            var potongan = row.getValue({
                                name : 'custrecord_potongan'
                            }) || 0;
                            var thp = row.getValue({
                                name : 'custrecord_take_home_pay'
                            });
                            allData.push({
                                employeeId : employeeId,
                                employeeName : employeeName,
                                gajiPokok : gajiPokok,
                                status : status,
                                meal : meal,
                                transport : transport,
                                lembur : lembur,
                                jkk : jkk,
                                jkm : jkm,
                                jht : jht,
                                jp : jp,
                                jk5 : jk5,
                                jk4 : jk4,
                                tunjanganpph21 : tunjanganpph21,
                                totalIncome : totalIncome,
                                pph21Perusahaan : pph21Perusahaan,
                                pph21karyawan : pph21karyawan,
                                premiJKK : premiJKK,
                                premiJKM : premiJKM,
                                premiJHT : premiJHT,
                                premiJP : premiJP,
                                premiJKS : premiJKS,
                                premiJKS1 : premiJKS1,
                                potongan : potongan,
                                thp : thp
                            })

                            return true;
                        });
                        log.debug('allData', allData);
                        if(allData.length<=0){
                            var html = `<html>
                            <h3>No Data for this selection!.</h3>
                            <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                            <body></body></html>`;
                            var form_result = serverWidget.createForm({
                                title: "Result Download Rekap Gaji",
                            });
                            form_result.addPageInitMessage({
                                type: message.Type.ERROR,
                                title: "No Data!",
                                message: html,
                            });
                            context.response.writePage(form_result);
                        }else{
                            var xmlStr =
                                '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
                            xmlStr +=
                                '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
                            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
                            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
                            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
                            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
    
                            // Styles
                            xmlStr += "<Styles>";
                            xmlStr += "<Style ss:ID='BC'>";
                            xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                                "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr +=
                                "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='Subtotal'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#FDFDFB' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerStyle'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:Bold='1' ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerStyle1'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:Bold='1' ss:FontName='Calibri' ss:Size='14' />";
                            xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerStyle2'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:Italic='1' ss:FontName='Calibri' ss:Size='11' />";
                            xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerStyle3'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='18' />";
                            xmlStr += "<Interior ss:Color='#FFFFFF' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerTable1'>";
                            xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                            "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#0DBAC7' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerTable2'>";
                            xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                            "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#6EDDF8' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='BNC'>";
                            xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                                "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr +=
                                "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='headerTable3'>";
                            xmlStr += "<Alignment ss:Horizontal='Center' ss:Vertical='Center' />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                            "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#F5D859' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='BNCN'>";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                                "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr +=
                                "<Font ss:Bold='1' ss:Color='#FFFFFF' ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#11AACC' ss:Pattern='Solid' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='NB'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                                "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='NBN'>";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Borders>";
                            xmlStr +=
                                "<Border ss:Position='Left' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Top' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Right' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr +=
                                "<Border ss:Position='Bottom' ss:Color='#000000' ss:LineStyle='Continuous' ss:Weight='1' />";
                            xmlStr += "</Borders>";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "</Style>";
                            xmlStr += "</Styles>";
                            //   End Styles

                             // Sheet Name
                            xmlStr += '<Worksheet ss:Name="+ namePeriod +">';
                             // End Sheet Name
                             // Kolom Excel Header
                            xmlStr +=
                            "<Table>" +
                            "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='50' />" +
                            "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                            "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                            "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='17' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='18' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='19' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='20' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='21' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='22' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='23' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='24' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='25' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='26' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='27' ss:AutoFitWidth='0' ss:Width='280' />" +
                            "<Column ss:Index='28' ss:AutoFitWidth='0' ss:Width='150' />" +
                            "<Column ss:Index='29' ss:AutoFitWidth='0' ss:Width='300' />" +

                            "<Row ss:Index='1' ss:Height='20'>" +
                            '<Cell ss:StyleID="headerStyle1" ss:MergeAcross="4"><Data ss:Type="String">Rekap Gaji Karyawan</Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="headerStyle1"><Data ss:Type="String"></Data></Cell>' +
                            "</Row>";
                            xmlStr += "<Row>" +
                                '<Cell ss:StyleID="headerStyle2" ss:MergeAcross="4"><Data ss:Type="String">Employee Salary Recap</Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle2"><Data ss:Type="String"></Data></Cell>' +
                                "</Row>";

                            xmlStr += "<Row>" +
                                '<Cell ss:StyleID="headerStyle" ss:MergeAcross="4"><Data ss:Type="String">Slip Monthly Salary, '+ namePeriod+'</Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle"><Data ss:Type="String"></Data></Cell>' +
                                "</Row>";

                                xmlStr += "<Row>" +
                                "</Row>";

                                xmlStr += "<Row>" +
                                '<Cell ss:StyleID="headerStyle3" ss:MergeAcross="4"><Data ss:Type="String">CV. Marina Sukses Abadi</Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="headerStyle3"><Data ss:Type="String"></Data></Cell>' +
                                "</Row>";

                                xmlStr += "<Row>" +
                                "</Row>";
                                xmlStr += "<Row ss:Height='25'>" +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">No</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Kode Karyawan</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Nama</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Status Wajib Pajak</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Job Title</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Status Absensi</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Gaji Pokok</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Meal Allowance</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Transport Allowance</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Uang Lembur</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Kecelakaan Kerja</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Kematian</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Hari Tua</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Pensiun</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Kesehatan 5%</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable2"><Data ss:Type="String">Jaminan Kesehatan 4%</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Gross Income</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JKK</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JKM</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JHT</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JP</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JKS</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Premi JKS 1%</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable3"><Data ss:Type="String">Potongan</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">PPh 21 Regular</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">Nett Income (THP)</Data></Cell>' +
                                '<Cell ss:StyleID="headerTable1"><Data ss:Type="String">PPh 21 Regular Di Tanggung Perusahaan</Data></Cell>' +

                                "</Row>";

                                var noM = 0;
                                var totalGajiPokok = 0;
                                var totalMeal = 0;
                                var totalTransport = 0;
                                var totalJKK = 0;
                                var totalJKM = 0;
                                var totalJK5 = 0;
                                var totalJK4 = 0;
                                var totalJHT = 0;
                                var totalJP = 0;
                                var totalGrossIncome = 0;
                                var totalLembur = 0;
                                var totalPremiJKK = 0;
                                var totalPremiJKM = 0;
                                var totalPremiJHT = 0;
                                var totalPremiJP = 0;
                                var totalPremiJKS = 0;
                                var totalPremiJK1 = 0;
                                var totalPotongan = 0;
                                var totalPPh21reg = 0;
                                var totalTHP = 0;
                                var totalPPH21Per = 0;
                                allData.forEach((data)=>{
                                    noM += 1
                                    var employeeId = data.employeeId
                                    var searchEmployee = search.create({
                                        type : 'employee',
                                        columns : ['internalid','entityid', 'title', 'employeestatus', 'employeetype', 'custentity_tipe_ptkp'],
                                        filters : [
                                            {
                                                name: 'internalid',
                                                operator: 'is',
                                                values: employeeId
                                            }
                                        ]
                                    });
                                    var searchEmployeeSet = searchEmployee.run();
                                    searchEmployee = searchEmployeeSet.getRange({
                                        start: 0,
                                        end: 1
                                    });
                                    if(searchEmployee.length>0){
                                        var searchEmployeeRecord = searchEmployee[0];
                                        var tipePTKP = searchEmployeeRecord.getText({
                                            name : 'custentity_tipe_ptkp'
                                        });
                                        var employeeKode = searchEmployeeRecord.getValue({
                                            name : 'entityid'
                                        });
                                        var employeeStatus = searchEmployeeRecord.getValue({
                                            name : 'employeestatus'
                                        });
                                        var employeeTitle= searchEmployeeRecord.getValue({
                                            name : 'title'
                                        });
                                        var employeeType = searchEmployeeRecord.getValue({
                                            name : 'employeetype'
                                        });

                                        var employeeName = data.employeeName;
                                        var gajiPokok = data.gajiPokok
                                        var meal = data.meal
                                        var transport = data.transport
                                        var jkk = data.jkk
                                        var jkm = data.jkm
                                        var jht = data.jht
                                        var jp = data.jp
                                        var jk5 = data.jk5
                                        var jk4 = data.jk4
                                        var tunjanganpph21 = data.tunjanganpph21
                                        var totalIncome = data.totalIncome
                                        var pph21Perusahaan = data.pph21Perusahaan
                                        var pph21karyawan = data.pph21karyawan
                                        var premiJKK = data.premiJKK
                                        var premiJKM = data.premiJKM
                                        var premiJHT = data.premiJHT
                                        var premiJP = data.premiJP
                                        var premiJKS = data.premiJKS
                                        var premiJKS1 = data.premiJKS1
                                        var potongan = data.potongan
                                        var thp = data.thp
                                        var statusAbsensi = data.status
                                        var lembur = data.lembur

                                        // pentotalan
                                        totalGajiPokok = totalGajiPokok + Number(gajiPokok);
                                        totalMeal = totalMeal + Number(meal);
                                        totalTransport = totalTransport + Number(transport);
                                        totalJKK = totalJKK + Number(jkk);
                                        totalJKM = totalJKM + Number(jkm);
                                        totalJHT = totalJHT + Number(jht);
                                        totalJP = totalJP + Number(jp);
                                        totalJK5 = totalJK5 + Number(jk5);
                                        totalJK4 = totalJK4 + Number(jk4);
                                        totalGrossIncome = totalGrossIncome + Number(totalIncome);
                                        totalLembur = totalLembur + Number(lembur);
                                        totalPremiJKK = totalPremiJKK + Number(premiJKK);
                                        totalPremiJKM = totalPremiJKM + Number(premiJKM);
                                        totalPremiJHT = totalPremiJHT + Number(premiJHT);
                                        totalPremiJP = totalPremiJP + Number(premiJP);
                                        totalPremiJKS = totalPremiJKS + Number(premiJKS);
                                        totalPremiJK1 = totalPremiJK1 + Number(premiJKS1);
                                        totalPotongan = totalPotongan + Number(potongan);
                                        totalPPh21reg = totalPPh21reg + Number(pph21karyawan)
                                        totalTHP = totalTHP + Number(thp);
                                        totalPPH21Per = totalPPH21Per + Number(pph21Perusahaan);

                                        xmlStr += "<Row>" +
                                        '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noM + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeKode + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + tipePTKP + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeTitle + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + statusAbsensi + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + gajiPokok + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + meal + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + transport + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + lembur + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jkk + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jkm + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jht + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jp + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jk5 + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + jk4 + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalIncome + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJKK + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJKM + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJHT + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJP + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJKS + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + premiJKS1 + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + potongan + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + pph21karyawan + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + thp + '</Data></Cell>' +
                                        '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + pph21Perusahaan + '</Data></Cell>' +
                                        "</Row>";

                                    }
                                });

                                xmlStr += "<Row>" +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Total</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalGajiPokok+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalMeal+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalTransport+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalLembur+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJKK+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJKM+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJHT+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJP+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJK5+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalJK4+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalGrossIncome+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJKK+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJKM+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJHT+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJP+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJKS+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPremiJK1+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPotongan+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPPh21reg+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalTHP+'</Data></Cell>' +
                                        '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">'+totalPPH21Per+'</Data></Cell>' +
                                        
                                        "</Row>";

                            xmlStr += "</Table></Worksheet>"


                            xmlStr += "</Workbook>";


                            var strXmlEncoded = encode.convert({
                                string: xmlStr,
                                inputEncoding: encode.Encoding.UTF_8,
                                outputEncoding: encode.Encoding.BASE_64,
                            });
                    
                            var objXlsFile = file.create({
                                name: "Rekap Gaji "+ namePeriod +".xls",
                                fileType: file.Type.EXCEL,
                                contents: strXmlEncoded,
                            });
                    
                            context.response.writeFile({
                                file: objXlsFile,
                            });
                        }
                    }
                }
            }catch(e){
                log.debug('error', e);
            }
            
            
        }
    }

    return {
        onRequest: onRequest
    };
});