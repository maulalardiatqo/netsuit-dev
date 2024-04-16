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
    "N/format",
], function (
    serverWidget,
    search,
    record,
    url,
    runtime,
    currency,
    error,
    config,
    format,
) {
    
    function onRequest(context) {
        try{
            var contextRequest = context.request;
            var form = serverWidget.createForm({
                title: "Report Cash Flow",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            
            var subsFilter = form.addField({
                id: "custpage_subs_option",
                label: "Subsidiary",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "subsidiary",
            });
            subsFilter.isMandatory = true
            var periodFilter = form.addField({
                id: "custpage_period_option",
                label: "Period",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodFilter.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var periodId = context.request.parameters.custpage_period_option;
                var subsId = context.request.parameters.custpage_subs_option;

                var periodNamety;
                var periodNamely;

                var accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodId]
                    ],
                    columns: [
                        search.createColumn({name: "periodname", label: "Name"})
                    ]
                });

                var searchResultCount = accountingperiodSearchObj.runPaged().count;
                log.debug("accountingperiodSearchObj result count", searchResultCount);

                accountingperiodSearchObj.run().each(function(result){
                    var perName = result.getValue({
                        name: 'periodname'
                    });

                    periodNamety = perName;

                    var currentYear = parseInt(periodNamety.split(" ")[1]);
                    var lastYear = currentYear - 1;

                    periodNamely = periodNamety.replace(currentYear, lastYear);

                    return true;
                });

                log.debug('periodNamety', periodNamety);
                log.debug('periodNamely', periodNamely);

                var postingPeriodData = search.create({
                    type: "accountingperiod",
                    filters: [
                    ["periodname", "is", periodNamely]
                ],
                columns: [
                    search.createColumn({
                    name: "periodname",
                    sort: search.Sort.ASC
                    }),
                    "internalid"
                ]
                });
                var searchResultCount = postingPeriodData.runPaged().count;
                var periodIdly;
                postingPeriodData.run().each(function(result) {
                    periodIdly = result.getValue({
                        name: 'internalid'
                    });
                    return true;
                });
                log.debug('periodIdly', periodIdly)
                // load billing this year
                var billingSearch = search.load({id: "customsearch_monthly_review"});
                if (periodId) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var billingtySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingty = billingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('billingty', billingty);
                
                billingSearch.filters.pop(); 
                if (periodIdly) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var billinglySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingly = billinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('billingly', billingly);

                // totalBilling
                var totalbillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalbillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var totalBillingSearchReturn = totalbillingSearch.run().getRange({start: 0, end: 1});
                var totalBilling = totalBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('totalBilling', totalBilling);

                // load cost of billing
                var costOfBilling = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var costOfBillingtySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingty = costOfBillingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('costOfBillingty', costOfBillingty);
                
                costOfBilling.filters.pop(); 
                if (periodIdly) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var costOfBillinglySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingly = costOfBillinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('costOfBillingly', costOfBillingly);

                // total cost of billing
                var totalCostOfBillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalCostOfBillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var totalCostOfBillingSearchReturn = totalCostOfBillingSearch.run().getRange({start: 0, end: 1});
                var totalCostOfBilling = totalCostOfBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('totalCostOfBilling', totalCostOfBilling);
                // load opex
                var opexSearch = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var opextySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexty = opextySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('opexty', opexty);
                
                opexSearch.filters.pop(); 
                if (periodIdly) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var opexlySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexly = opexlySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('opexly', opexly);
            
                var grossProvitRevly = Number(billingly) + Number(costOfBillingly);
                var grossProvitRevty = Number(billingty) + Number(costOfBillingty);
                var grossProvitRevYoy = grossProvitRevly !== 0 ? grossProvitRevty / grossProvitRevly : 0;
                var gpToBillingly = billingly !== 0 ? grossProvitRevly / billingly : 0;
                var gpToBillinglytext = gpToBillingly.toFixed(2) + '%'
                var gpToBillingty = billingty !== 0 ? grossProvitRevty / billingty : 0;
                var gpToBillingtytext = gpToBillingty.toFixed(2) + '%'

                var opexGrossProfitly = Number(opexly) / Number(grossProvitRevly) || 0
                var opexGrossProfitlyText = opexGrossProfitly.toFixed(2) + ' %';

                var opexGrossProfitty = Number(opexty) / Number(grossProvitRevty) || 0
                var opexGrossProfittyText = opexGrossProfitty.toFixed(2) + '%'

                var ebitdaly = Number(grossProvitRevly) - Number(opexly) || 0;
                var ebitdaty = Number(grossProvitRevty) - Number(opexty) || 0;

                var ebitdaGply = Number(ebitdaly) / Number(grossProvitRevly) || 0
                var ebitdaGplyText = ebitdaGply.toFixed(2) + ' %';
                var ebitdaGpty = Number(ebitdaty) / Number(grossProvitRevty) || 0
                var ebitdaGptyText = ebitdaGpty.toFixed(2) + ' %';

                log.debug('data', {ebitdaGplyText : ebitdaGplyText, ebitdaGptyText : ebitdaGptyText})

                
            }
        }catch(e){
            log.debug('error', e.name)
        }
    }
    function createSublist(sublistname, form) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Report Cash Advance",
        });
        sublist_in.addField({
            id: "custpage_sublist_no",
            label: "No Form",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_emp",
            label: "Name Of Employee",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_description",
            label: "Description",
            type: serverWidget.FieldType.TEXT,
        });
    }
    return{
        onRequest : onRequest
    }
});