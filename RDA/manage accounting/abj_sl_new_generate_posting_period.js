/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message'], function (serverWidget, task, search, log, record, message) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            log.debug('masuk')
            var form = serverWidget.createForm({
                title: 'Generate Accounting And Tax Period'
            });
            
            var fromDate = form.addField({
                id: 'custpage_from',
                type: serverWidget.FieldType.DATE,
                label: 'From Date'
            });
            fromDate.isMandatory = true;
            
            var toDate = form.addField({
                id: 'custpage_to',
                type: serverWidget.FieldType.DATE,
                label: 'To Date'
            });
            toDate.isMandatory = true;
            
            form.addSubmitButton({
                label: 'Generate'
            });
            context.response.writePage(form);

        } else {
            try{
                var selectedFrom = context.request.parameters.custpage_from;
                var selectedTo = context.request.parameters.custpage_to;
    
                log.debug('selectedFrom', selectedFrom);
                log.debug('selectedTo', selectedTo);
                if(selectedFrom && selectedTo){
                    function isValidDateRange(selectedFrom, selectedTo) {
                        function parseDate(dateStr) {
                            var parts = dateStr.split('/');
                            return new Date(parts[2], parts[1] - 1, parts[0]); 
                        }
                    
                        var fromDate = parseDate(selectedFrom);
                        var toDate = parseDate(selectedTo);
                    
                        return toDate >= fromDate;
                    }
                    if (!isValidDateRange(selectedFrom, selectedTo)) {
                        var html = "<html><body>";
                        html += "<h3>The To Date field must be greater than or equal to the From Date field.</h3>";
                        html +=
                            '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(255, 0, 0); border-color: rgb(255, 0, 0); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                        html += "</body></html>";

                        var form = serverWidget.createForm({
                            title: "The To Date field must be greater than or equal to the From Date field.",
                        });
                        form.addPageInitMessage({
                            type: message.Type.WARNING,
                            title: "Warning!",
                            message: html,
                        });
                        context.response.writePage(form);
                    } else {
                        function isMoreThan31Days(selectedFrom, selectedTo) {
                            log.debug('masuk fungsi isMore');
                            
                            function parseDate(dateStr) {
                                var parts = dateStr.split('/');
                                return new Date(parts[2], parts[1] - 1, parts[0]);
                            }
                        
                            var fromDate = parseDate(selectedFrom);
                            var toDate = parseDate(selectedTo);
                            
                            var timeDifference = toDate.getTime() - fromDate.getTime();
                            var dayDifference = timeDifference / (1000 * 3600 * 24); 
                            if (dayDifference > 31) {
                                return true; 
                            } else {
                                return false;
                            }
                        }
                        
                        if (isMoreThan31Days(selectedFrom, selectedTo)) {
                            var html = "<html><body>";
                            html += "<h3>The process limit can only be 31 days!</h3>";
                            html +=
                                '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(255, 0, 0); border-color: rgb(255, 0, 0); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                            html += "</body></html>";
                        
                            var form = serverWidget.createForm({
                                title: "The process limit can only be 31 days!",
                            });
                            form.addPageInitMessage({
                                type: message.Type.WARNING,
                                title: "Warning!",
                                message: html,
                            });
                            context.response.writePage(form);
                        }
                        else {

                        }
                    }
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