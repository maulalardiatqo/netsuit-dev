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
            var rekapOption = form.addField({
                id: 'custpage_rekap_option',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Period'
            });
            rekapOption.addSelectOption({
                value: '',
                text: ''
            });
            rekapOption.addSelectOption({
                value: '1',
                text: 'Bulanan'
            });
            rekapOption.addSelectOption({
                value: '2',
                text: 'Tahunan'
            });
            form.addSubmitButton({
                label: 'Download'
            });
            context.response.writePage(form);
        } else if (context.request.method === 'POST'){
            try{
                var methodPeriod =  contextRequest.parameters.custpage_rekap_option;

                var allData = []
                var searchHistoryGaji = search.load({
                    id : 'customsearch_history_gaji',
                });
                var searchHistoryGajiSet = searchHistoryGaji.runPaged().count;
                searchHistoryGaji.run().each(function(row){
                    var employeeName = row.getText({
                        name : 'custrecord_employee_gaji'
                    });
                    var gaji = row.getValue({
                        name : 'custrecord_gaji_gaji_pokok'
                    });
                    var meal = row.getValue({
                        name : 'custrecord_meal_allowance_gaji'
                    });
                    var transport = row.getValue({
                        name : 'custrecord_transport_allowance_gaji'
                    });
                    var period = row.getValue({
                        name : 'custrecord_period_gaji'
                    });
                    var pph21 = row.getValue({
                        name : 'custrecord8'
                    });
                    var uangLembur = row.getValue({
                        name : 'custrecord_uang_lembur'
                    });
                    var jkk = row.getValue({
                        name : 'custrecord_jkk'
                    });
                    var jkm = row.getValue({
                        name : 'custrecord_jkm'
                    });
                    var jht = row.getValue({
                        name : 'custrecord_jht'
                    });
                    var jp = row.getValue({
                        name : 'custrecord_jp'
                    });
                    var jks5 = row.getValue({
                        name : 'custrecord_jks'
                    });
                    allData.push(
                        {
                            employeeName : employeeName,
                            gaji : gaji,
                            meal : meal,
                            transport : transport,
                            period : period,
                            pph21: pph21
                        }
                    );
                    return true
                });
                if(methodPeriod == 2){
                    if(allData.length<=0){
                        var html = `<html>
                        <h3>No Data for this selection!.</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Result Download Rekap Bank",
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
                            xmlStr += "<Style ss:ID='ColAB'>";
                            xmlStr += "<Alignment />";
                            xmlStr += "<Font ss:FontName='Calibri' ss:Size='12' />";
                            xmlStr += "<Interior ss:Color='#f79925' ss:Pattern='Solid' />";
                            xmlStr += "<NumberFormat ss:Format='Standard' />";
                            xmlStr += "</Style>";
                            xmlStr += "<Style ss:ID='BNC'>";
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
                            xmlStr += '<Worksheet ss:Name="Gaji Pokok(Monthly Salary)">';
                            // End Sheet Name
                            // Kolom Excel Header
                            xmlStr +=
                            "<Table>" +
                            "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                            "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                            "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                            "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Row ss:Index='1' ss:Height='20'>" +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">ID Employee</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Group Personalia</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jan</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Feb</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mar</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Apr</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mei</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jun</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jul</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Agu</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Sep</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Okt</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nov</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Des</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Total</Data></Cell>' +
                            "</Row>";
                            var gajiPerBulan = {};
                            var monthNames = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                            ];
                            var gajiEmploye = {};
                            var totalSemuaGajiKaryawan = 0;
                            allData.forEach((data) => {
                                var period = data.period;
                                var parts = period.split(' ');
                              
                                var tanggal = parts[4];
                                var bulan = parts[5];
                                var tahun = parts[6];
                                var endDate = new Date(tahun, new Date(Date.parse(bulan + " 1," + tahun)).getMonth(), tanggal);
                              
                                var monthIndex = endDate.getMonth();
                                log.debug('monthIndex', monthIndex);
                              
                                var monthName = monthNames[monthIndex];
                              
                                var gaji = Number(data.gaji);
                                if (!gajiPerBulan[data.employeeName]) {
                                  gajiPerBulan[data.employeeName] = {};
                                }
                              
                                gajiPerBulan[data.employeeName][monthName] = gaji;
                                log.debug('gajiPerBulan[data.employeeName][monthName]', gajiPerBulan[data.employeeName][monthName]);
                              
                                if (!gajiEmploye[data.employeeName]) {
                                  gajiEmploye[data.employeeName] = 0;
                                }
                              
                                gajiEmploye[data.employeeName] += gaji;
                                
                                // Menambahkan gaji ke total semua gaji karyawan
                                totalSemuaGajiKaryawan += gaji;
                              });
                              
                              log.debug('gajiEmploye', gajiEmploye);
                              
                              var noMor = 0;
                              for (var employeeName in gajiPerBulan) {
                                noMor += 1;
                              
                                xmlStr += "<Row>" +
                                  '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noMor + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                              
                                for (var i = 0; i < monthNames.length; i++) {
                                  var month = monthNames[i];
                                  var gaji = gajiPerBulan[employeeName][month] || 0;
                                  xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + gaji + '</Data></Cell>';
                                }
                              
                                var totalGaji = gajiEmploye[employeeName] || 0;
                                xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGaji + '</Data></Cell>';
                              
                                xmlStr += "</Row>";
                              }
                              xmlStr += "<Row>" +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              "</Row>";
                              // Tambahkan baris total gaji per bulan
                              xmlStr += "<Row>" +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Total</Data></Cell>';
                              
                              for (var i = 0; i < monthNames.length; i++) {
                                var month = monthNames[i];
                                var totalGajiBulan = 0;
                              
                                for (var employeeName in gajiPerBulan) {
                                  totalGajiBulan += gajiPerBulan[employeeName][month] || 0;
                                }
                              
                                xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalGajiBulan + '</Data></Cell>';
                              }
                            
                              xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalSemuaGajiKaryawan + '</Data></Cell>';
                              
                              xmlStr += "</Row>";
                            
                            xmlStr += "</Table></Worksheet>"
                            // endsheet 1
                            
                            // Sheet 2
                            xmlStr += '<Worksheet ss:Name="Meal Allowance">';
                            // End Sheet Name
                            // Kolom Excel Header
                            xmlStr +=
                            "<Table>" +
                            "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                            "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                            "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                            "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Row ss:Index='1' ss:Height='20'>" +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">ID Employee</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Group Personalia</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jan</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Feb</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mar</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Apr</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mei</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jun</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jul</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Agu</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Sep</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Okt</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nov</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Des</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Total</Data></Cell>' +
                            "</Row>";
                            var gajiPerBulan = {};
                            var monthNames = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                            ];
                            var gajiEmploye = {};
                            var totalSemuaGajiKaryawan = 0;
                            allData.forEach((data) => {
                                var period = data.period;
                                var parts = period.split(' ');
                              
                                var tanggal = parts[4];
                                var bulan = parts[5];
                                var tahun = parts[6];
                                var endDate = new Date(tahun, new Date(Date.parse(bulan + " 1," + tahun)).getMonth(), tanggal);
                              
                                var monthIndex = endDate.getMonth();
                                log.debug('monthIndex', monthIndex);
                              
                                var monthName = monthNames[monthIndex];
                              
                                var gaji = Number(data.meal);
                                if (!gajiPerBulan[data.employeeName]) {
                                  gajiPerBulan[data.employeeName] = {};
                                }
                              
                                gajiPerBulan[data.employeeName][monthName] = gaji;
                                log.debug('gajiPerBulan[data.employeeName][monthName]', gajiPerBulan[data.employeeName][monthName]);
                              
                                if (!gajiEmploye[data.employeeName]) {
                                  gajiEmploye[data.employeeName] = 0;
                                }
                              
                                gajiEmploye[data.employeeName] += gaji;
                                
                                // Menambahkan gaji ke total semua gaji karyawan
                                totalSemuaGajiKaryawan += gaji;
                              });
                              
                              log.debug('gajiEmploye', gajiEmploye);
                              
                              var noMor = 0;
                              for (var employeeName in gajiPerBulan) {
                                noMor += 1;
                              
                                xmlStr += "<Row>" +
                                  '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noMor + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                              
                                for (var i = 0; i < monthNames.length; i++) {
                                  var month = monthNames[i];
                                  var gaji = gajiPerBulan[employeeName][month] || 0;
                                  xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + gaji + '</Data></Cell>';
                                }
                              
                                var totalGaji = gajiEmploye[employeeName] || 0;
                                xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGaji + '</Data></Cell>';
                              
                                xmlStr += "</Row>";
                              }
                              xmlStr += "<Row>" +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              "</Row>";
                              // Tambahkan baris total gaji per bulan
                              xmlStr += "<Row>" +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Total</Data></Cell>';
                              
                              for (var i = 0; i < monthNames.length; i++) {
                                var month = monthNames[i];
                                var totalGajiBulan = 0;
                              
                                for (var employeeName in gajiPerBulan) {
                                  totalGajiBulan += gajiPerBulan[employeeName][month] || 0;
                                }
                              
                                xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalGajiBulan + '</Data></Cell>';
                              }
                            
                              xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalSemuaGajiKaryawan + '</Data></Cell>';
                              
                              xmlStr += "</Row>";
                            
                            xmlStr += "</Table></Worksheet>"
                            // endsheet 2
    
    
    
                              // Sheet 3
                            xmlStr += '<Worksheet ss:Name="Transport Allowance">';
                            // End Sheet Name
                            // Kolom Excel Header
                            xmlStr +=
                            "<Table>" +
                            "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                            "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                            "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                            "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                            "<Row ss:Index='1' ss:Height='20'>" +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">ID Employee</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Group Personalia</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jan</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Feb</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mar</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Apr</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Mei</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jun</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Jul</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Agu</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Sep</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Okt</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Nov</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Des</Data></Cell>' +
                            '<Cell ss:StyleID="BC"><Data ss:Type="String">Total</Data></Cell>' +
                            "</Row>";
                            var gajiPerBulan = {};
                            var monthNames = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                            ];
                            var gajiEmploye = {};
                            var totalSemuaGajiKaryawan = 0;
                            allData.forEach((data) => {
                                var period = data.period;
                                var parts = period.split(' ');
                              
                                var tanggal = parts[4];
                                var bulan = parts[5];
                                var tahun = parts[6];
                                var endDate = new Date(tahun, new Date(Date.parse(bulan + " 1," + tahun)).getMonth(), tanggal);
                              
                                var monthIndex = endDate.getMonth();
                                log.debug('monthIndex', monthIndex);
                              
                                var monthName = monthNames[monthIndex];
                              
                                var gaji = Number(data.transport);
                                if (!gajiPerBulan[data.employeeName]) {
                                  gajiPerBulan[data.employeeName] = {};
                                }
                              
                                gajiPerBulan[data.employeeName][monthName] = gaji;
                                log.debug('gajiPerBulan[data.employeeName][monthName]', gajiPerBulan[data.employeeName][monthName]);
                              
                                if (!gajiEmploye[data.employeeName]) {
                                  gajiEmploye[data.employeeName] = 0;
                                }
                              
                                gajiEmploye[data.employeeName] += gaji;
                                
                                totalSemuaGajiKaryawan += gaji;
                              });
                              
                              log.debug('gajiEmploye', gajiEmploye);
                              
                              var noMor = 0;
                              for (var employeeName in gajiPerBulan) {
                                noMor += 1;
                              
                                xmlStr += "<Row>" +
                                  '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noMor + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                  '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                              
                                for (var i = 0; i < monthNames.length; i++) {
                                  var month = monthNames[i];
                                  var gaji = gajiPerBulan[employeeName][month] || 0;
                                  xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + gaji + '</Data></Cell>';
                                }
                              
                                var totalGaji = gajiEmploye[employeeName] || 0;
                                xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGaji + '</Data></Cell>';
                              
                                xmlStr += "</Row>";
                              }
                              xmlStr += "<Row>" +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                              "</Row>";
                              // Tambahkan baris total gaji per bulan
                              xmlStr += "<Row>" +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Total</Data></Cell>';
                              
                              for (var i = 0; i < monthNames.length; i++) {
                                var month = monthNames[i];
                                var totalGajiBulan = 0;
                              
                                for (var employeeName in gajiPerBulan) {
                                  totalGajiBulan += gajiPerBulan[employeeName][month] || 0;
                                }
                              
                                xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalGajiBulan + '</Data></Cell>';
                              }
                            
                              xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalSemuaGajiKaryawan + '</Data></Cell>';
                              
                              xmlStr += "</Row>";
                            
                            xmlStr += "</Table></Worksheet>"
                            // endsheet3
    
    
                               // Sheet 3
                               xmlStr += '<Worksheet ss:Name="Potongan PPh 21">';
                               // End Sheet Name
                               // Kolom Excel Header
                               xmlStr +=
                               "<Table>" +
                               "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='180' />" +
                               "<Column ss:Index='2' ss:AutoFitWidth='0' ss:Width='130' />" +
                               "<Column ss:Index='3' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='4' ss:AutoFitWidth='0' ss:Width='250' />" +
                               "<Column ss:Index='5' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='6' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='7' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='8' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='9' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='10' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='11' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='12' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='13' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='14' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='15' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Column ss:Index='16' ss:AutoFitWidth='0' ss:Width='100' />" +
                               "<Row ss:Index='1' ss:Height='20'>" +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">No</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">ID Employee</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Nama</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Group Personalia</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Jan</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Feb</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Mar</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Apr</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Mei</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Jun</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Jul</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Agu</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Sep</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Okt</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Nov</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Des</Data></Cell>' +
                               '<Cell ss:StyleID="BC"><Data ss:Type="String">Total</Data></Cell>' +
                               "</Row>";
                               var gajiPerBulan = {};
                               var monthNames = [
                               'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                               'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                               ];
                               var gajiEmploye = {};
                               var totalSemuaGajiKaryawan = 0;
                               allData.forEach((data) => {
                                   var period = data.period;
                                   var parts = period.split(' ');
                                 
                                   var tanggal = parts[4];
                                   var bulan = parts[5];
                                   var tahun = parts[6];
                                   var endDate = new Date(tahun, new Date(Date.parse(bulan + " 1," + tahun)).getMonth(), tanggal);
                                 
                                   var monthIndex = endDate.getMonth();
                                   log.debug('monthIndex', monthIndex);
                                 
                                   var monthName = monthNames[monthIndex];
                                 
                                   var gaji = Number(data.pph21);
                                   if (!gajiPerBulan[data.employeeName]) {
                                     gajiPerBulan[data.employeeName] = {};
                                   }
                                 
                                   gajiPerBulan[data.employeeName][monthName] = gaji;
                                   log.debug('gajiPerBulan[data.employeeName][monthName]', gajiPerBulan[data.employeeName][monthName]);
                                 
                                   if (!gajiEmploye[data.employeeName]) {
                                     gajiEmploye[data.employeeName] = 0;
                                   }
                                 
                                   gajiEmploye[data.employeeName] += gaji;
                                   
                                   totalSemuaGajiKaryawan += gaji;
                                 });
                                 
                                 log.debug('gajiEmploye', gajiEmploye);
                                 
                                 var noMor = 0;
                                 for (var employeeName in gajiPerBulan) {
                                   noMor += 1;
                                 
                                   xmlStr += "<Row>" +
                                     '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noMor + '</Data></Cell>' +
                                     '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                     '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                     '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                                 
                                   for (var i = 0; i < monthNames.length; i++) {
                                     var month = monthNames[i];
                                     var gaji = gajiPerBulan[employeeName][month] || 0;
                                     xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + gaji + '</Data></Cell>';
                                   }
                                 
                                   var totalGaji = gajiEmploye[employeeName] || 0;
                                   xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGaji + '</Data></Cell>';
                                 
                                   xmlStr += "</Row>";
                                 }
                                 xmlStr += "<Row>" +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                 "</Row>";
                                 xmlStr += "<Row>" +
                                   '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                   '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                   '<Cell ss:StyleID="Subtotal"><Data ss:Type="String"></Data></Cell>' +
                                   '<Cell ss:StyleID="Subtotal"><Data ss:Type="String">Total</Data></Cell>';
                                 
                                 for (var i = 0; i < monthNames.length; i++) {
                                   var month = monthNames[i];
                                   var totalGajiBulan = 0;
                                 
                                   for (var employeeName in gajiPerBulan) {
                                     totalGajiBulan += gajiPerBulan[employeeName][month] || 0;
                                   }
                                 
                                   xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalGajiBulan + '</Data></Cell>';
                                 }
                               
                                 xmlStr += '<Cell ss:StyleID="Subtotal"><Data ss:Type="Number">' + totalSemuaGajiKaryawan + '</Data></Cell>';
                                 
                                 xmlStr += "</Row>";
                               
                               xmlStr += "</Table></Worksheet>"
                               // endsheet4
    
                            
                            xmlStr += "</Workbook>";
                            var strXmlEncoded = encode.convert({
                                string: xmlStr,
                                inputEncoding: encode.Encoding.UTF_8,
                                outputEncoding: encode.Encoding.BASE_64,
                            });
                    
                            var objXlsFile = file.create({
                                name: "Rekap Gaji.xls",
                                fileType: file.Type.EXCEL,
                                contents: strXmlEncoded,
                            });
                    
                            context.response.writeFile({
                                file: objXlsFile,
                            });
                        }
                }else if(methodPeriod == 1){
                    var searchRemunasi = search.create({
                        type: 'customrecord_gaji',
                        columns: ['internalid', 'custrecord_employee_gaji', '	custrecord_status_gaji', 'custrecord_period_gaji', 'custrecord_gaji_gaji_pokok', 'custrecord_meal_allowance_gaji', 'custrecord_transport_allowance_gaji', 'custrecord_uang_lembur', 'custrecord_jkk', '	custrecord_jkm', 'custrecord_jht', 'custrecord_jp', 'custrecord_jks','custrecord_jks_4per', 'custrecord_tunjangan_pph', '	custrecord_total_income_gaji', 'custrecord_pph21', 'custrecord8', 'custrecord_premi_jkm', 'custrecord_premi_jkk', 'custrecord_premi_jht', 'custrecord_premi_jp', 'custrecord_premi_jks', 'custrecord_premi_jks_1per', 'custrecord_potongan',],
                    });
                    var searchRemunasiSet = searchRemunasi.runPaged().count;
                    searchRemunasi.run().each(function(row){
                        var employeeId = row.getValue({
                            name : 'custrecord3'
                        });
                        var gajiPokok = row.getValue({
                            name : 'custrecord4'
                        }) || 0;
                        log.debug('gajiPokok', gajiPokok);
                        var tanggalAwalPeriod = row.getValue({
                            name : 'custrecord_remunasi_tanggal_awal_period'
                        });
                        var mealAllowance = row.getValue({
                            name : 'custrecord5'
                        }) || 0;
                        var transportAllowance =row.getValue({
                            name : 'custrecord6'
                        }) || 0;
                        var metodePPH = row.getValue({
                            name :'custrecord_metode_pph_21'
                        }) || 0;
                       
                        var jks = row.getValue({
                            name : 'custrecord_remunasi_jks'
                        }) || 0;
                        var jkm = row.getValue({
                            name : 'custrecord_remunasi_jkm'
                        }) || 0;
                        var jkk = row.getValue({
                            name : 'custrecord_remunasi_jkk'
                        }) || 0;
                        var jht = row.getValue({
                            name : 'custrecord_remunasi_jht'
                        }) || 0;
                        var isJhtPPh21 = row.getValue({
                            name : 'custrecord_is_jht_pphh_21'
                        }) || 0;
                        var isJpPph21 = row.getValue({
                            name : 'custrecord_is_jht_pphh_21'
                        }) || 0;
                        var jp = row.getValue({
                            name : 'custrecord9'
                        }) || 0;
        
        
                        var totalIncome = Number(gajiPokok) + Number(mealAllowance) + Number(transportAllowance);
                        
                        allData.push({
                            employeeId : employeeId,
                            gajiPokok : gajiPokok,
                            mealAllowance : mealAllowance,
                            transportAllowance : transportAllowance,
                            metodePPH : metodePPH,
                            jks : jks,
                            jkm : jkm,
                            jkk : jkk,
                            jht : jht,
                            isJhtPPh21 : isJhtPPh21,
                            isJpPph21 : isJpPph21,
                            jp : jp,
                            totalIncome : totalIncome,
                            tanggalAwalPeriod : tanggalAwalPeriod
        
                        })
                        
                        return true;
                    });

                }else{
                    var html = `<html>
                        <h3>No Data for this selection!.</h3>
                        <input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />
                        <body></body></html>`;
                        var form_result = serverWidget.createForm({
                            title: "Warning",
                        });
                        form_result.addPageInitMessage({
                            type: message.Type.ERROR,
                            title: "Silahkan Pilih Period!",
                            message: html,
                        });
                        context.response.writePage(form_result);
                }
            }catch(e){
                log.debug('error', e)
            }

        }
        
    }

    return {
        onRequest: onRequest
    };
});
