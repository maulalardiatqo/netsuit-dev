/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/ui/serverWidget",
  "N/search",
  "N/record",
  "N/ui/message",
  "N/url",
  "N/redirect",
  "N/xml",
  "N/file",
  "N/encode",
], function(
  serverWidget,
  search,
  record,
  message,
  url,
  redirect,
  xml,
  file,
  encode
) {
  function onRequest(context) {
    var contextRequest = context.request;
    if (contextRequest.method === "GET") {
      var form = serverWidget.createForm({
        title: "Income Statement",
      });

      form.addSubmitButton({
        label: "Generate",
      });

      context.response.writePage(form);
    } else {

      try {
        let fileId = 81303;
        var column
        let arrayData = [];
        let fileToProcess = file.load({
          id: fileId
        });
        log.debug("fileToProcess", fileToProcess);
        let iterator = fileToProcess.lines.iterator();
        log.debug("iterator", iterator);
        //Skip the first line (CSV header)
        iterator.each(function() {
          return false;
        });
        iterator.each(function() {
          return false;
        });
        iterator.each(function() {
          return false;
        });
        iterator.each(function() {
          return false;
        });
        iterator.each(function() {
          return false;
        });
        iterator.each(function() {
          return false;
        });
        var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
            xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';

             // Styles
          xmlStr += "<Styles>";
          xmlStr += "<Style ss:ID='BC'>";
          xmlStr += "<Alignment/>";
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
          xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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
          xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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
          xmlStr += "<Interior ss:Color='#215966' ss:Pattern='Solid' />";
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

            xmlStr += '<Worksheet ss:Name="Sheet1">';
            xmlStr += '<Table>';

            xmlStr += "<Column ss:Index='1' ss:AutoFitWidth='0' ss:Width='310' />";

        iterator.each(function(line, i) {
          let lineValues = line.value.split(',');
          log.debug("lineValues lenght", lineValues.length);
          log.debug("lineValues", lineValues);
          let ind1 = lineValues[0];
          let ind2 = lineValues[1];
          log.debug('Index 1', ind1);
          log.debug('Index 2', ind2);
          
          xmlStr += '<Row>';
          lineValues.forEach((data, index) => {

            if(i > 16){
              xmlStr += '<Cell ss:Style="BC"><Data ss:Type="String">' + data + '</Data></Cell>'; 
            }
                 
        
              
            });
          xmlStr += '</Row>';
         
          // let financialRow = lineValues[0];
          // let amount = lineValues[1];
          // let Income = lineValues[2];
          // let expense = lineValues[3];
          // arrayData.push({
          //   financialRow: financialRow,
          //   amount: amount,
          //   Income: Income,
          //   expense: expense
          // });
          return true;
        });

        xmlStr += '</Table></Worksheet></Workbook>';


        log.debug("arrayData", arrayData);

            var strXmlEncoded = encode.convert({
              string: xmlStr,
              inputEncoding: encode.Encoding.UTF_8,
              outputEncoding: encode.Encoding.BASE_64,
            });

        var objXlsFile = file.create({
          
        name: "Income Statement "  + ".xls",
        fileType: file.Type.EXCEL,
        contents: strXmlEncoded,
        });

        context.response.writeFile({
          file: objXlsFile,
        });

      } catch (e) {
        log.debug("error in get report", e.name + ": " + e.message);
      }
    }
  }

  return {
    onRequest: onRequest,
  };
});