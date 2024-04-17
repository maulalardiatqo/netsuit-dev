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
                title: "Monthly Review",
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
                // load billing this year
                var billingSearch = search.load({id: "customsearch_monthly_review"});
                if (periodId) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var billingtySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingty = billingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                billingSearch.filters.pop(); 
                if (periodIdly) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var billinglySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingly = billinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // totalBilling
                var totalbillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalbillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var totalBillingSearchReturn = totalbillingSearch.run().getRange({start: 0, end: 1});
                var totalBilling = totalBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // load cost of billing
                var costOfBilling = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var costOfBillingtySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingty = costOfBillingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                costOfBilling.filters.pop(); 
                if (periodIdly) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var costOfBillinglySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingly = costOfBillinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // total cost of billing
                var totalCostOfBillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalCostOfBillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var totalCostOfBillingSearchReturn = totalCostOfBillingSearch.run().getRange({start: 0, end: 1});
                var totalCostOfBilling = totalCostOfBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                // load opex
                var opexSearch = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var opextySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexty = opextySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                opexSearch.filters.pop(); 
                if (periodIdly) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var opexlySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexly = opexlySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
            
                var grossProvitRevly = Number(billingly) + Number(costOfBillingly);
                var grossProvitRevty = Number(billingty) + Number(costOfBillingty);
                
                var gpToBillingly = billingly !== 0 ? grossProvitRevly / billingly : 0;
                var gpToBillinglytext = gpToBillingly.toFixed(2) + '%'
                var gpToBillingty = billingty !== 0 ? grossProvitRevty / billingty : 0;
                var gpToBillingtytext = gpToBillingty.toFixed(2) + '%'

                var yoyBilling = (billingly !== 0 && billingty !== 0) ? Number(billingty) / Number(billingly) : 0;
                var yoyBillingText = yoyBilling.toFixed(2) + '%'
                var yoygrossProvitRev = grossProvitRevly !== 0 ? grossProvitRevty / grossProvitRevly : 0;
                var yoygrossProvitRevText = yoygrossProvitRev.toFixed(2) + '%';
                var yoyOpex = (yoyBilling !== 0 && yoygrossProvitRev !== 0) ? Number(yoyBilling) / Number(yoygrossProvitRev) : 0;
                var yoyOpexText = yoyOpex.toFixed(2) + '%'

                var opexGrossProfitly = Number(opexly) / Number(grossProvitRevly) || 0
                var opexGrossProfitlyText = opexGrossProfitly.toFixed(2) + ' %';

                var opexGrossProfitty = Number(opexty) / Number(grossProvitRevty) || 0
                var opexGrossProfittyText = opexGrossProfitty.toFixed(2) + '%'


                var ebitdaly = Number(grossProvitRevly) - Number(opexly) || 0;
                var ebitdaty = Number(grossProvitRevty) - Number(opexty) || 0;
                var yoyEbitda = (ebitdaty !== 0 && ebitdaly !== 0) ? Number(ebitdaty) / Number(ebitdaly) : 0;
                var yoyEbitdaText = yoyEbitda.toFixed(2) + "%"

                var ebitdaGply = Number(ebitdaly) / Number(grossProvitRevly) || 0
                var ebitdaGplyText = ebitdaGply.toFixed(2) + ' %';
                var ebitdaGpty = Number(ebitdaty) / Number(grossProvitRevty) || 0
                var ebitdaGptyText = ebitdaGpty.toFixed(2) + ' %';

                var estimateBill = Number(billingty) + Number(totalBilling)
                var estimateCoss = Number(costOfBillingty) + Number(totalCostOfBilling)
                var estimateRev = Number(estimateBill) + Number(estimateCoss);
                var estimateGp = Number(estimateRev) /  Number(estimateBill) || 0;
                var estimateGpText = estimateGp.toFixed(2) + ' %';
                var estimateOpex = Number(opexty) * 12
                var estimateOpextoGrossProfit = Number(estimateOpex) /  Number(estimateRev) || 0;
                var estimateOpextoGrossProfitText = estimateOpextoGrossProfit.toFixed(2) + '%'
                var estimateEbitda = Number(estimateRev) - Number(estimateOpex);
                var estimateEbitdaGp = Number(estimateEbitda) / Number(estimateRev)
                var estimateEbitdaGpText = estimateEbitdaGp.toFixed(2) + '%'

                var depreSearch = search.load({id: "customsearch_monthly_review_2_2_4"});
                if (periodId) depreSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) depreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var depretySearch = depreSearch.run().getRange({start: 0, end: 1});
                var deprety = depretySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                depreSearch.filters.pop(); 
                if (periodIdly) depreSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) depreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var deprelySearch = depreSearch.run().getRange({start: 0, end: 1});
                var deprely = deprelySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                
                var totalDepreSearch = search.load({id: "customsearch_monthly_review_2_2_4"});
                if (subsId) totalDepreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                var totalDepreSearchReturn = totalDepreSearch.run().getRange({start: 0, end: 1});
                var totalDepre = totalDepreSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                var nettProfitly = Number(ebitdaly + deprely) * Number()
                if(billingly){
                    billingly = format.format({
                        value: billingly,
                        type: format.Type.CURRENCY
                    });
                }
                if(billingty){
                    billingty = format.format({
                        value: billingty,
                        type: format.Type.CURRENCY
                    });
                }
                if(estimateBill){
                    estimateBill = format.format({
                        value: estimateBill,
                        type: format.Type.CURRENCY
                    });
                }

                if(costOfBillingly){
                    costOfBillingly = format.format({
                        value: costOfBillingly,
                        type: format.Type.CURRENCY
                    });
                }
                if(costOfBillingty){
                    costOfBillingty = format.format({
                        value: costOfBillingty,
                        type: format.Type.CURRENCY
                    });
                }
                if(estimateCoss){
                    estimateCoss = format.format({
                        value: estimateCoss,
                        type: format.Type.CURRENCY
                    });
                }

                if(grossProvitRevly){
                    grossProvitRevly = format.format({
                        value: grossProvitRevly,
                        type: format.Type.CURRENCY
                    });
                }
                if(grossProvitRevty){
                    grossProvitRevty = format.format({
                        value: grossProvitRevty,
                        type: format.Type.CURRENCY
                    });
                }
                if(estimateRev){
                    estimateRev = format.format({
                        value: estimateRev,
                        type: format.Type.CURRENCY
                    });
                }

                if(opexly){
                    opexly = format.format({
                        value: opexly,
                        type: format.Type.CURRENCY
                    });
                }
                if(opexty){
                    opexty = format.format({
                        value: opexty,
                        type: format.Type.CURRENCY
                    });
                }
                if(estimateOpex){
                    estimateOpex = format.format({
                        value: estimateOpex,
                        type: format.Type.CURRENCY
                    });
                }

                if(ebitdaly){
                    ebitdaly = format.format({
                        value: ebitdaly,
                        type: format.Type.CURRENCY
                    });
                }
                if(ebitdaty){
                    ebitdaty = format.format({
                        value: ebitdaty,
                        type: format.Type.CURRENCY
                    });
                }
                if(estimateEbitda){
                    estimateEbitda = format.format({
                        value: estimateEbitda,
                        type: format.Type.CURRENCY
                    });
                }
                var allData = []
                var currentRecord = createSublist("custpage_sublist_item", form, periodNamety, periodNamely);

                // set sublist line 1
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Billing",
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: billingly || 0,
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: billingty || 0,
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value: yoyBillingText || 0,
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value: estimateBill || 0,
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line: 0,
                });

                // set sublist line 2
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Cost of Billing",
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: costOfBillingly || 0,
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: costOfBillingty || 0,
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value: estimateCoss || 0,
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line: 1
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line: 1
                });

                 // set sublist line 3
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Gross Profit- Revenue",
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: grossProvitRevly || 0,
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: grossProvitRevty || 0,
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  yoygrossProvitRevText,
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateRev,
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 2
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 2
                });

                 // set sublist line 4
                 currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Gp to Billing",
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: gpToBillinglytext || 0,
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: gpToBillingtytext || 0,
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateGpText,
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 3
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 3
                });

                 // set sublist line 5
                 currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Opex",
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: opexly || 0,
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: opexty || 0,
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  yoyOpexText,
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateOpex,
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 4
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 4
                });

                 // set sublist line 6
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Head Count",
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 5
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 5
                });

                // set sublist line 7
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Opex to Gross Profit",
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: opexGrossProfitlyText || 0,
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: opexGrossProfittyText || 0,
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateOpextoGrossProfitText,
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 6
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 6
                });

                // set sublist line 8
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Ebitda",
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: ebitdaly || 0,
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: ebitdaty || 0,
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  yoyEbitdaText,
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateEbitda,
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 7
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 7
                });

                // set sublist line 9
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Ebitda to Gross Profit",
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: ebitdaGplyText || 0,
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: ebitdaGptyText || 0,
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  estimateEbitdaGpText,
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: '-',
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 8
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 8
                });

                allData.push(
                    "periodNamety : " + periodNamety,
                    "periodNamely : " + periodNamely,
                    "billingly: " + billingly,
                    "billingly: " + billingly,
                    "billingty: " + billingty,
                    "yoyBillingText: " + yoyBillingText,
                    "estimateBill: " + estimateBill,
                    "costOfBillingly: " + costOfBillingly,
                    "costOfBillingty: " + costOfBillingty,
                    "estimateCoss: " + estimateCoss,
                    "grossProvitRevly: " + grossProvitRevly,
                    "grossProvitRevty: " + grossProvitRevty,
                    "yoygrossProvitRevText: " + yoygrossProvitRevText,
                    "estimateRev: " + estimateRev,
                    "gpToBillinglytext: " + gpToBillinglytext,
                    "gpToBillingtytext: " + gpToBillingtytext,
                    "estimateGpText: " + estimateGpText,
                    "opexly: " + opexly,
                    "opexty: " + opexty,
                    "yoyOpexText: " + yoyOpexText,
                    "estimateOpex: " + estimateOpex,
                    "ebitdaly: " + ebitdaly,
                    "ebitdaty: " + ebitdaty,
                    "yoyEbitdaText: " + yoyEbitdaText,
                    "estimateEbitda: " + estimateEbitda,
                    "ebitdaGplyText: " + ebitdaGplyText,
                    "ebitdaGptyText: " + ebitdaGptyText,
                    "estimateEbitdaGpText: " + estimateEbitdaGpText
                );
                log.debug('allData',allData);
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Download",
                    functionName: "download( "+JSON.stringify(allData)+")"
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_download_monthly_review.js";
                context.response.writePage(form);
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    function createSublist(sublistname, form, periodNamety, periodNamely) {
        var sublist_in = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Monthly Review",
        });
        sublist_in.addField({
            id: "custpage_sublist_summary",
            label: "Summary",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_act_py",
            label: "Actual " + periodNamely,
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_act_ty",
            label: "Actual " + periodNamety,
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_yoy",
            label: "% YoY",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_est_fy",
            label: "Estimated FY",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_target",
            label: "FY this year target",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_target_p",
            label: "%",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_py",
            label: "FY Previous year",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_py_p",
            label: "%",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist_in;
    }
    return{
        onRequest : onRequest
    }
});