/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
    "N/ui/serverWidget",
    "N/search",
    "N/record",
    "N/url",
    "N/runtime",
    "N/currency",
    "N/error",
    "N/config",
    "N/encode","N/url","N/redirect","N/xml","N/file","N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    encode,
    url,
    redirect,
    xml,
    file,
    format,
){
    
    function onRequest(context) {
        var form = serverWidget.createForm({
            title: "Download Budget Vendor Report",
        });
        try{
            function getAllResults(s) {
                var results = s.run();
                var searchResults = [];
                var searchid = 0;
                do {
                    var resultslice = results.getRange({
                    start: searchid,
                    end: searchid + 1000
                    });
                    resultslice.forEach(function(slice) {
                        searchResults.push(slice);
                        searchid++;
                    });
                } while (resultslice.length >= 1000);
                return searchResults;
            }
            if (context.request.method === 'GET') {
                var form = serverWidget.createForm({
                    title: "Vendor Budget",
                });
                var filterOption = form.addFieldGroup({
                    id: "filteroption",
                    label: "FILTERS",
                });
                var startDateField = form.addField({
                    id: "custpage_start_date",
                    label: "Start Date",
                    type: serverWidget.FieldType.DATE,
                    container: "filteroption",
                });
            
                // Tambahkan field untuk end date
                var endDateField = form.addField({
                    id: "custpage_end_date",
                    label: "End Date",
                    type: serverWidget.FieldType.DATE,
                    container: "filteroption",
                });
                form.addSubmitButton({
                    label: 'Search'
                });
                context.response.writePage(form);
            }else{
                var startDate = context.request.parameters.custpage_start_date;
                var endDate = context.request.parameters.custpage_end_date;
                if(startDate){
                    startDate = format.format({
                        value: startDate,
                        type: format.Type.DATE
                    });
                }
                if(endDate){
                    endDate = format.format({
                        value: endDate,
                        type: format.Type.DATE
                    });
                }
                
            }
        }catch(e){
            log.debug('error', e);
        }
    }
    return {
        onRequest: onRequest
    };
});