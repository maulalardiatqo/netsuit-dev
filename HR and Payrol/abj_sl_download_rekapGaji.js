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
                        name : 'custrecord_take_home_pay'
                    });
                    var period = row.getValue({
                        name : 'custrecord_period_gaji'
                    });
                    allData.push(
                        {
                            employeeName : employeeName,
                            gaji : gaji,
                            period : period
                        }
                    );
                    return true
                });

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
                        xmlStr += "<Interior ss:Color='#FFFF00' ss:Pattern='Solid' />";
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
                        "</Row>";
                        var totalGajiPerBulan = {
                            Jan: 0,
                            Feb: 0,
                            Mar: 0,
                            Apr: 0,
                            Mei: 0,
                            Jun: 0,
                            Jul: 0,
                            Agu: 0,
                            Sep: 0,
                            Okt: 0,
                            Nov: 0,
                            Des: 0,
                        };
                        
                        var noMor = 0;
                        
                        allData.forEach((data) => {
                            var period = data.period;
                            var parts = period.split(' ');
                            
                            var tanggal = parts[0];
                            var bulan = parts[1];
                            var tahun = parts[2];
                            var endDate = new Date(tahun, new Date(Date.parse(bulan + " 1, 2022")).getMonth(), tanggal);
                            
                            var monthNames = [
                              'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                              'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
                            ];
                            
                            var monthIndex = endDate.getMonth();
                            
                            var monthName = monthNames[monthIndex];
                            
                            log.debug('monthName', monthName);
                            var gaji = Number(data.gaji);
                        
                            totalGajiPerBulan[monthName] += gaji;
                            log.debug('totalGajiPerBulan[monthName]', totalGajiPerBulan[monthName])
                        
                            var employeeName = data.employeeName;
                        
                            noMor += 1;
                        
                            xmlStr +=
                                "<Row>" +
                                '<Cell ss:StyleID="NB"><Data ss:Type="String">' + noMor + '</Data></Cell>' +
                                '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                '<Cell ss:StyleID="NBN"><Data ss:Type="String">' + employeeName + '</Data></Cell>' +
                                '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                        
                            for (var month in totalGajiPerBulan) {
                                xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGajiPerBulan[month] + '</Data></Cell>';
                            }
                        
                            xmlStr += "</Row>";
                        });
                        
                        xmlStr +=
                            "<Row>" +
                            '<Cell ss:StyleID="NB"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String">Total</Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>' +
                            '<Cell ss:StyleID="NBN"><Data ss:Type="String"></Data></Cell>';
                        
                        // Menambahkan total gaji per bulan ke dalam kolom yang sesuai
                        for (var month in totalGajiPerBulan) {
                            xmlStr += '<Cell ss:StyleID="NBN"><Data ss:Type="Number">' + totalGajiPerBulan[month] + '</Data></Cell>';
                        }
                        
                        xmlStr += "</Row>";
                        
                        xmlStr += "</Table></Worksheet></Workbook>";
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
                if(methodPeriod == 1){

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
