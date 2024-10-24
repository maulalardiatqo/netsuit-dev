/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message', 'N/runtime'], function (serverWidget, task, search, log, record, message, runtime) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Collection Management'
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            var valueRedord = form.addFieldGroup({
                id: "valueRedord",
                label: "Record",
            });

            var kolektor = form.addField({
                id: 'custpage_kolektor', 
                type: serverWidget.FieldType.SELECT,
                container: "valueRedord",
                label: 'Kolektor'
            });
            kolektor.addSelectOption({
                value: '', 
                text: '-Select-'
            });

            var salesMan = form.addField({
                id: 'custpage_sales', 
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                label: 'Salesman'
            });
            salesMan.addSelectOption({
                value: '', 
                text: '-Select-'
            });

            // search sales rep
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                [
                    ["salesrep","is","T"]
                ],
                columns:
                [
                    search.createColumn({name: "entityid", label: "Name"}),
                    search.createColumn({name: "internalid", label: "Internal ID"})
                ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count",searchResultCount);
            employeeSearchObj.run().each(function(result){
                var nameSales = result.getValue({
                    name: "entityid"
                });
                var idEmp = result.getValue({
                    name: "internalid"
                });
                salesMan.addSelectOption({
                    value: idEmp, 
                    text: nameSales 
                });
                return true;
            });
           

            
            var date_field = form.addField({
                id: 'custpage_date', 
                type: serverWidget.FieldType.DATE,
                container: "filteroption",
                label: 'Due Date'
            });
            function getCurrentDateUTC() {
                const now = new Date();
                const year = now.getUTCFullYear();
                const month = now.getUTCMonth();
                const date = now.getUTCDate();
                const hours = now.getUTCHours();
                const minutes = now.getUTCMinutes();
                const seconds = now.getUTCSeconds();
                const milliseconds = now.getUTCMilliseconds();
            
                return new Date(Date.UTC(year, month, date, hours, minutes, seconds, milliseconds));
            }
            var currDate = getCurrentDateUTC();
            function formatDate(dateString) {
                const options = { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' };
                const date = new Date(dateString);
                return date.toLocaleDateString('en-GB', options);
            }
            log.debug('currDate', currDate)
            date_field.defaultValue = currDate;

            var subsidiary = form.addField({
                id: 'custpage_subsidiary', 
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary',
                container: "filteroption",
                source: 'subsidiary'
            });
            subsidiary.isMandatory = true


            // create sublist
            var sublist = form.addSublist({
                id: 'custpage_sublist',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Orders'
            });
            sublist
            .addField({
                id: "custpage_sublist_item_select",
                label: "Select",
                type: serverWidget.FieldType.CHECKBOX,
            })
            .updateDisplayType({
                displayType: serverWidget.FieldDisplayType.ENTRY,
            });
            sublist.addField({
                id: 'custpage_sublist_date',
                label: 'Date Due',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_type',
                label: 'Type',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_vendor',
                label: 'Vendor',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_refno',
                label: 'Ref No.',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_currency',
                label: 'Currency',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_exc_rate',
                label: 'Exchange Rate',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_org_amt',
                label: 'Original Amount',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_amt_due',
                label: 'Amount Due',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_retur',
                label: 'Retur',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_sales',
                label: 'Salesman',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addField({
                id: 'custpage_sublist_subsidiary',
                label: 'Subsidiary',
                type: serverWidget.FieldType.TEXT
            });
            var reasonOption = sublist.addField({
                id: 'custpage_sublist_reason',
                label: 'Reason (Kenapa Belum Tertagih)',
                type: serverWidget.FieldType.SELECT
            })
            sublist.addField({
                id: 'custpage_sublist_action',
                label: 'Action Plan',
                type: serverWidget.FieldType.TEXT
            });
            sublist.addButton({
                id: "markall",
                label: "Mark All",
                functionName: "markAll",
            });
            sublist.addButton({
                id: "unmarkall",
                label: "Unmark All",
                functionName: "unmarkAll",
            });
            
            var inlineHtml = form.addField({
                id: 'custpage_buttonhtml',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: "filteroption",
            });
            
            inlineHtml.defaultValue = `
                <button type="button" value="Search" onclick="onCustomButtonClick(); return false;" style="margin-top: 10px; padding:5px;">Search</button>
            `;
            form.addSubmitButton({
                label: 'Submit'
            });
            form.addResetButton({
                label: "Clear",
            });
            context.response.writePage(form);
        }else{

        }
    }
    return {
        onRequest: onRequest
    };
});