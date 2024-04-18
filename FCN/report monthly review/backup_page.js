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
            var taxrateFilter = form.addField({
                id: "custpage_taxrate_option",
                label: "Tax Rate",
                type: serverWidget.FieldType.TEXT,
                container: "filteroption",
            });
            taxrateFilter.isMandatory = true
            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var periodId = context.request.parameters.custpage_period_option;
                var subsId = context.request.parameters.custpage_subs_option;
                var tax = context.request.parameters.custpage_taxrate_option;
                var taxrate = Number(tax) / 100
                log.debug('taxrate', taxrate)
                var periodNamety;
                var periodNamely;
                var thisYear;
                var lastYear
                var accountingperiodSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodId]
                    ],
                    columns: [
                        search.createColumn({name: "periodname", sort: search.Sort.DESC})
                    ]
                });
                
                accountingperiodSearchObj.run().each(function(result) {
                    var perName = result.getValue({ name: 'periodname' });
                    periodNamety = perName;
                
                    var currentYear = parseInt(periodNamety.split(" ")[1]);
                    var prevYear = currentYear - 1;
                    thisYear = currentYear
                    lastYear = prevYear;
                
                    periodNamely = periodNamety.replace(currentYear, prevYear);
                
                    return true;
                });
                
                log.debug('periodNamety', periodNamety);
                log.debug('periodNamely', periodNamely);
                
                var postingPeriodData = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["periodname", "is", periodNamely]
                    ],
                    columns: ["internalid"]
                });
                var periodIdly;
                postingPeriodData.run().each(function(result) {
                    periodIdly = result.getValue({ name: 'internalid' });
                    return true;
                });

                var thisYearName = 'FY '+thisYear;
                var yearSearchty = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["periodname", "is", thisYearName]
                    ],
                    columns: ["internalid"]
                });
                var thisYearId;
                yearSearchty.run().each(function(result) {
                    thisYearId = result.getValue({ name: 'internalid' });
                    return true;
                });
                log.debug('thisYearId', thisYearId)
                var startThisYear = new Date(thisYear, 0, 1); 
                var endThisYear = new Date(thisYear, 11, 31);

                var startLastYear = new Date(lastYear, 0, 1); 
                var endLastYear = new Date(lastYear, 11, 31);
                function convertText(data){
                    data = data.toFixed(2) + '%'

                    return data
                }
                function formatDate(date) {
                    var dd = String(date.getDate()).padStart(2, '0'); 
                    var mm = String(date.getMonth() + 1).padStart(2, '0'); 
                    var yyyy = date.getFullYear(); 
                
                    return dd + '/' + mm + '/' + yyyy;
                }
                var formattedStartThisYear = formatDate(startThisYear);
                var formattedEndThisYear = formatDate(endThisYear);

                var formattedstartLastYear = formatDate(startLastYear);
                var formattedendLastYear = formatDate(endLastYear);

                log.debug('formattedstartLastYear', formattedstartLastYear);
                log.debug('formattedendLastYear', formattedendLastYear);

                // load billing this year
                var billingSearch = search.load({id: "customsearch_monthly_review"});
                if (periodId) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) billingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) billingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var billingtySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingty = billingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                billingSearch.filters.pop(); 
                if (periodIdly) billingSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) billingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) billingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) billingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var billinglySearch = billingSearch.run().getRange({start: 0, end: 1});
                var billingly = billinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // totalBilling
                var totalbillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalbillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) totalbillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) totalbillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var totalBillingSearchReturn = totalbillingSearch.run().getRange({start: 0, end: 1});
                var totalBilling = totalBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('totalbilling',totalBilling)

                // load cost of billing
                var costOfBilling = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) costOfBilling.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) costOfBilling.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var costOfBillingtySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingty = costOfBillingtySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                costOfBilling.filters.pop(); 
                if (periodIdly) costOfBilling.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) costOfBilling.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) costOfBilling.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) costOfBilling.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var costOfBillinglySearch = costOfBilling.run().getRange({start: 0, end: 1});
                var costOfBillingly = costOfBillinglySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // total cost of billing
                var totalCostOfBillingSearch = search.load({id: "customsearch_monthly_review"});
                if (subsId) totalCostOfBillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var totalCostOfBillingSearchReturn = totalCostOfBillingSearch.run().getRange({start: 0, end: 1});
                var totalCostOfBilling = totalCostOfBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('totalCostOfBilling', totalCostOfBilling)

                // load opex
                var opexSearch = search.load({id: "customsearch_monthly_review_2"});
                if (periodId) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var opextySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexty = opextySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                opexSearch.filters.pop(); 
                if (periodIdly) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
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
                if (formattedStartThisYear) depreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) depreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var depretySearch = depreSearch.run().getRange({start: 0, end: 1});
                var deprety = depretySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('deprety', deprety)
                depreSearch.filters.pop(); 
                if (periodIdly) depreSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) depreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) depreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) depreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var deprelySearch = depreSearch.run().getRange({start: 0, end: 1});
                var deprely = deprelySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('deprely', deprely)
                
                var totalDepreSearch = search.load({id: "customsearch_monthly_review_2_2_4"});
                if (subsId) totalDepreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) totalDepreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) totalDepreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var totalDepreSearchReturn = totalDepreSearch.run().getRange({start: 0, end: 1});
                var totalDepre = totalDepreSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('totalDepre', totalDepre)
                var nettProfitly = (Number(ebitdaly) + Number(deprely)) * Number(1-Number(taxrate))
                log.debug('dataCount', {ebitdaty: 110955454, deprety: 507208727.66, taxrate: 0.22});
                var nettProfitty = (Number(ebitdaty) + Number(deprely)) * (1 - Number(taxrate));
                log.debug('nettProfitty', nettProfitty);
                var netProvityoy = (nettProfitly !== 0 && nettProfitty !== 0) ? Number(nettProfitty) / Number(nettProfitly) : 0;
                var netProvityoyText = netProvityoy.toFixed(2) + "%";
                var netProfitEstimate = (Number(estimateEbitda) + Number(totalDepre)) * Number(1-Number(taxrate))

                var netProfittoGply = (nettProfitly !== 0 && grossProvitRevly !== 0) ? Number(nettProfitly) / Number(grossProvitRevly) : 0;
                var netProfittoGplyText = netProfittoGply.toFixed(2) + '%';
                var netProfittoGpty = (nettProfitty !== 0 && grossProvitRevty !== 0) ? Number(nettProfitty) / Number(grossProvitRevty) : 0;
                var netProfittoGptyText = netProfittoGpty.toFixed(2) + '%';
                var netProfittoGpEstimate = (netProfitEstimate !== 0 && estimateRev !== 0) ? Number(netProfitEstimate) / Number(estimateRev) : 0;
                var netProfittoGpEstimateText = netProfittoGpEstimate.toFixed(2) + '%';

               
                // load FY Bill This Year
                var fyBillSearch = search.load({id: "customsearchbudgetdefaultview"});
                if (subsId) fyBillSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (thisYearId) fyBillSearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: thisYearId}));
                var fyBillSearchReturn = fyBillSearch.run().getRange({start: 0, end: 1});
                var fyBillty = fyBillSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('fyBillty', fyBillty)

                var fyCostOfBillSearch = search.load({id: "customsearchbudgetdefaultview_2"});
                if (subsId) fyCostOfBillSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (thisYearId) fyCostOfBillSearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: thisYearId}));
                var fyCostOfBillSearchReturn = fyCostOfBillSearch.run().getRange({start: 0, end: 1});
                var fyCostOfBillty = fyCostOfBillSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('fyCostOfBillty', fyCostOfBillty)

                var fyRevty = Number(fyBillty) + Number(fyCostOfBillty);
                var fyGpty = (fyRevty !== 0 && fyBillty !== 0) ? Number(fyRevty) / Number(fyBillty) : 0;
                var fyGptyText = fyGpty.toFixed(2) +  '%'

                var opexFysearch = search.load({id : "customsearchbudgetdefaultview_3"});
                if (subsId) opexFysearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (thisYearId) opexFysearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: thisYearId}));
                var opexFysearchReturn = opexFysearch.run().getRange({start: 0, end: 1});
                var fyOpexty = opexFysearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                log.debug('fyOpexty', fyOpexty)

                var fyOpexfGpty = (fyOpexty !== 0 && fyRevty !== 0) ? Number(fyOpexty) / Number(fyRevty) : 0;
                var fyOpexfGptyText = fyOpexfGpty.toFixed(2) + '%';

                var fyEbitdaty = Number(fyRevty) - Number(fyOpexty);
                var fyEbitdaGpty = (fyEbitdaty !== 0 && fyRevty !== 0) ? Number(fyEbitdaty) / Number(fyRevty) : 0;
                var fyEbitdaGptyText = fyEbitdaGpty.toFixed(2) + '%';
                var fyNettProfitty = (Number(fyEbitdaty) + Number(totalDepre)) * Number(1-Number(taxrate))
                var fyNettProfitGpty = (fyNettProfitty !== 0 && fyRevty !== 0) ? Number(fyNettProfitty) / Number(fyRevty) : 0;
                var fyNettProfitGptyText = fyNettProfitGpty.toFixed(2) + '%';
                

                var prosFyBillty = (estimateBill !== 0 && fyBillty !== 0) ? Number(estimateBill) / Number(fyBillty) : 0;
                prosFyBillty = convertText(prosFyBillty);

                var prosRevty = (estimateRev !== 0 && fyCostOfBillty !== 0) ? Number(estimateRev) / Number(fyCostOfBillty) : 0;
                prosFyBillty = convertText(prosFyBillty);
            
                if(fyBillty){
                    fyBillty = format.format({
                        value: fyBillty,
                        type: format.Type.CURRENCY
                    });
                }
                if(fyCostOfBillty){
                    fyCostOfBillty = format.format({
                        value: fyCostOfBillty,
                        type: format.Type.CURRENCY
                    });
                }
                if(fyRevty){
                    fyRevty = format.format({
                        value: fyRevty,
                        type: format.Type.CURRENCY
                    });
                }

                if(fyOpexty){
                    fyOpexty = format.format({
                        value: fyOpexty,
                        type: format.Type.CURRENCY
                    });
                }

                if(fyEbitdaty){
                    fyEbitdaty = format.format({
                        value: fyEbitdaty,
                        type: format.Type.CURRENCY
                    });
                }

                if(fyNettProfitty){
                    fyNettProfitty = format.format({
                        value: fyNettProfitty,
                        type: format.Type.CURRENCY
                    });
                }

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

                if(nettProfitly){
                    nettProfitly = format.format({
                        value: nettProfitly,
                        type: format.Type.CURRENCY
                    });
                }
                if(nettProfitty){
                    nettProfitty = format.format({
                        value: nettProfitty,
                        type: format.Type.CURRENCY
                    });
                }
                if(netProfitEstimate){
                    netProfitEstimate = format.format({
                        value: netProfitEstimate,
                        type: format.Type.CURRENCY
                    });
                }

                var allData = []
                var currentRecord = createSublist("custpage_sublist_item", form, periodNamety, periodNamely, thisYear, lastYear);

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
                    value: fyBillty,
                    line: 0,
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: prosFyBillty,
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
                    value: fyCostOfBillty,
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
                    value: fyRevty,
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
                    value: fyGpty,
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
                    value: fyOpexty,
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
                    value: fyOpexfGptyText,
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
                    value: fyEbitdaty,
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
                    value: fyEbitdaGptyText,
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

                // set sublist line 10
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Net Profit",
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: nettProfitly || 0,
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: nettProfitty || 0,
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  netProvityoyText,
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  netProfitEstimate,
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: fyNettProfitty,
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 9
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 9
                });

                // set sublist line 11
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_summary",
                    value: "Net Profit to Gross Profit",
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_py",
                    value: netProfittoGplyText || 0,
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_act_ty",
                    value: netProfittoGptyText || 0,
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_yoy",
                    value:  '-',
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_est_fy",
                    value:  netProfittoGpEstimateText,
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target",
                    value: fyNettProfitGptyText,
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_target_p",
                    value: '-',
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py",
                    value: '-',
                    line : 10
                });
                currentRecord.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_fy_py_p",
                    value: '-',
                    line : 10
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
    function createSublist(sublistname, form, periodNamety, periodNamely, thisYear, lastYear) {
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
            label: "FY target " + thisYear,
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_target_p",
            label: "%",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_in.addField({
            id: "custpage_sublist_fy_py",
            label: "FY " + lastYear,
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