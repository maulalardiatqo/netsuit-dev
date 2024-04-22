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
                var lastYearName = 'FY '+lastYear
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

                var yearSearchly = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["periodname", "is", lastYearName]
                    ],
                    columns: ["internalid"]
                });
                var lastYearId;
                yearSearchly.run().each(function(result) {
                    lastYearId = result.getValue({ name: 'internalid' });
                    return true;
                });

                log.debug('lastYearId', lastYearId)
                var startThisYear = new Date(thisYear, 0, 1); 
                var endThisYear = new Date(thisYear, 11, 31);

                var startLastYear = new Date(lastYear, 0, 1); 
                var endLastYear = new Date(lastYear, 11, 31);
                function convertCurr(data){
                    data = format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });

                    return data
                }
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
                
                var billingSearchly = search.load({id: "customsearch_monthly_review"});
                if (periodIdly) billingSearchly.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) billingSearchly.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) billingSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) billingSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var billinglySearch = billingSearchly.run().getRange({start: 0, end: 1});
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
                
                var costOfBillingSearchly = search.load({id: "customsearch_monthly_review_2"});
                if (periodIdly) costOfBillingSearchly.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) costOfBillingSearchly.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) costOfBillingSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) costOfBillingSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var costOfBillinglySearchRetly = costOfBillingSearchly.run().getRange({start: 0, end: 1});
                var costOfBillingly = costOfBillinglySearchRetly[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // total cost of billing
                var totalCostOfBillingSearch = search.load({id: "customsearch_monthly_review_2"});
                if (subsId) totalCostOfBillingSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var totalCostOfBillingSearchReturn = totalCostOfBillingSearch.run().getRange({start: 0, end: 1});
                var totalCostOfBilling = totalCostOfBillingSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                // load opex
                var opexSearch = search.load({id: "customsearch_monthly_review_2_2"});
                if (periodId) opexSearch.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodId}));
                if (subsId) opexSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) opexSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var opextySearch = opexSearch.run().getRange({start: 0, end: 1});
                var opexty = opextySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                var opxSearchLy = search.load({id: "customsearch_monthly_review_2_2"});
                if (periodIdly) opxSearchLy.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) opxSearchLy.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) opxSearchLy.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) opxSearchLy.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var opexlySearch = opxSearchLy.run().getRange({start: 0, end: 1});
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

                var opexGrossProfitty = (opexty !== 0 && grossProvitRevty !== 0) ? Number(opexty) / Number(grossProvitRevty) : 0;
                var opexGrossProfittyText = opexGrossProfitty.toFixed(2) + '%'


                var ebitdaly = Number(grossProvitRevly) - Number(opexly) || 0;
                var ebitdaty = Number(grossProvitRevty) - Number(opexty) || 0;
                var yoyEbitda = (ebitdaty !== 0 && ebitdaly !== 0) ? Number(ebitdaty) / Number(ebitdaly) : 0;
                var yoyEbitdaText = yoyEbitda.toFixed(2) + "%"

                var ebitdaGply =  (ebitdaly !== 0 && grossProvitRevly !== 0) ? Number(ebitdaly) / Number(grossProvitRevly) : 0;
                var ebitdaGplyText = ebitdaGply.toFixed(2) + ' %';
                var ebitdaGpty = (ebitdaty !== 0 && grossProvitRevty !== 0) ? Number(ebitdaty) / Number(grossProvitRevty) : 0;
                var ebitdaGptyText = ebitdaGpty.toFixed(2) + ' %';

                var estimateBill = Number(billingty) + Number(totalBilling)
                var estimateCoss = Number(costOfBillingty) + Number(totalCostOfBilling)
                var estimateRev = Number(estimateBill) + Number(estimateCoss);
                var estimateGp = (estimateRev !== 0 && estimateBill !== 0) ? Number(estimateRev) / Number(estimateBill) : 0;
                var estimateGpText = estimateGp.toFixed(2) + ' %';
                var estimateOpex = Number(opexty) * 12
                var estimateOpextoGrossProfit = (estimateOpex !== 0 && estimateRev !== 0) ? Number(estimateOpex) / Number(estimateRev) : 0; 
                var estimateOpextoGrossProfitText = estimateOpextoGrossProfit.toFixed(2) + '%'
                var estimateEbitda = Number(estimateRev) - Number(estimateOpex);
                var estimateEbitdaGp = (estimateEbitda !== 0 && estimateRev !== 0) ? Number(estimateEbitda) / Number(estimateRev) : 0;
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
                var depreSearchly = search.load({id: "customsearch_monthly_review_2_2_4"});
                if (periodIdly) depreSearchly.filters.push(search.createFilter({name: "postingperiod", operator: search.Operator.ANYOF, values: periodIdly}));
                if (subsId) depreSearchly.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedstartLastYear) depreSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear}));
                if (formattedendLastYear) depreSearchly.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear}));
                var deprelySearch = depreSearchly.run().getRange({start: 0, end: 1});
                var deprely = deprelySearch[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                
                var totalDepreSearch = search.load({id: "customsearch_monthly_review_2_2_4"});
                if (subsId) totalDepreSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (formattedStartThisYear) totalDepreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear}));
                if (formattedEndThisYear) totalDepreSearch.filters.push(search.createFilter({name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear}));
                var totalDepreSearchReturn = totalDepreSearch.run().getRange({start: 0, end: 1});
                var totalDepre = totalDepreSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;
                var nettProfitly = (Number(ebitdaly) + Number(deprely)) * Number(1-Number(taxrate))
                var nettProfitty = (Number(ebitdaty) + Number(deprely)) * (1 - Number(taxrate));
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

                var fyCostOfBillSearch = search.load({id: "customsearchbudgetdefaultview_2"});
                if (subsId) fyCostOfBillSearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (thisYearId) fyCostOfBillSearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: thisYearId}));
                var fyCostOfBillSearchReturn = fyCostOfBillSearch.run().getRange({start: 0, end: 1});
                var fyCostOfBillty = fyCostOfBillSearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

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
                var prosFyRevty = (estimateRev !== 0 && fyCostOfBillty !== 0) ? Number(estimateRev) / Number(fyCostOfBillty) : 0;
                prosFyRevty = convertText(prosFyRevty);
                var prosFyOpexty = (estimateOpex !== 0 && fyOpexty !== 0) ? Number(estimateOpex) / Number(fyOpexty) : 0;
                prosFyOpexty = convertText(prosFyOpexty);
                var prosFyEbitdaty = (estimateEbitda !== 0 && fyEbitdaty !== 0) ? Number(estimateEbitda) / Number(fyEbitdaty) : 0;
                prosFyEbitdaty = convertText(prosFyEbitdaty);
                var prosFyNetProfitty = (netProfitEstimate !== 0 && fyNettProfitty !== 0) ? Number(netProfitEstimate) / Number(fyNettProfitty) : 0;
                prosFyNetProfitty = convertText(prosFyNetProfitty);

                // load FY Bill last year
                var fyBilllySearch = search.load({id: "customsearchbudgetdefaultview"});
                if (subsId) fyBilllySearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (lastYearId) fyBilllySearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: lastYearId}));
                var fyBilllySearchReturn = fyBilllySearch.run().getRange({start: 0, end: 1});
                var fyBillly = fyBilllySearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                var fyCOstBilllySearch = search.load({id: "customsearchbudgetdefaultview_2"});
                if (subsId) fyCOstBilllySearch.filters.push(search.createFilter({name: "subsidiary", operator: search.Operator.IS, values: subsId}));
                if (lastYearId) fyCOstBilllySearch.filters.push(search.createFilter({name: "year", operator: search.Operator.ANYOF, values: lastYearId}));
                var fyCOstBilllySearchReturn = fyCOstBilllySearch.run().getRange({start: 0, end: 1});
                var fyCostOfBillly = fyCOstBilllySearchReturn[0].getValue({
                    name: "amount",
                    summary: "SUM",
                }) || 0;

                var fyRevly = Number(fyBillly) + Number(fyCostOfBillly)
                var fyGply = (fyRevly !== 0 && fyBillly !== 0) ? Number(fyRevly) / Number(fyBillly) : 0;
                fyGply = convertText(fyGply);
                var fyOpexly = Number(opexly) * 12
                var fyOpexGply = (fyOpexly !== 0 && fyRevly !== 0) ? Number(fyOpexly) / Number(fyRevly) : 0;
                fyOpexGply = convertText(fyOpexGply);
                var fyEbitdaly = Number(fyRevly) - Number(fyOpexly)
                var fyEbitdaGply = (fyEbitdaly !== 0 && fyRevly !== 0) ? Number(fyEbitdaly) / Number(fyRevly) : 0;
                fyEbitdaGply = convertText(fyEbitdaGply);
                var fyNettProfitly = (Number(fyEbitdaly) + Number(totalDepre)) * Number(1-Number(taxrate))
                var fyNettProfitGply = (fyNettProfitly !== 0 && fyRevly !== 0) ? Number(fyNettProfitly) / Number(fyRevly) : 0;
                fyNettProfitGply = convertText(fyNettProfitGply);

                var prosFyBillly = (estimateBill !== 0 && fyBillly !== 0) ? Number(estimateBill) / Number(fyBillly) : 0;
                prosFyBillly = convertText(prosFyBillly);
                var prosFyRevly = (estimateRev !== 0 && fyCostOfBillly !== 0) ? Number(estimateRev) / Number(fyCostOfBillly) : 0;
                prosFyRevly = convertText(prosFyRevly);
                var prosFyOpexly = (estimateOpex !== 0 && fyOpexly !== 0) ? Number(estimateOpex) / Number(fyOpexly) : 0;
                prosFyOpexly = convertText(prosFyOpexly);
                var prosFyEbitdaly = (estimateEbitda !== 0 && fyEbitdaly !== 0) ? Number(estimateEbitda) / Number(fyEbitdaly) : 0;
                prosFyEbitdaly = convertText(prosFyEbitdaly);
                var prosFyNetProfitly = (fyNettProfitly !== 0 && fyRevly !== 0) ? Number(fyNettProfitly) / Number(fyRevly) : 0;
                prosFyNetProfitly = convertText(prosFyNetProfitly);

                if(fyBillly){
                    fyBillly = convertCurr(fyBillly)
                }
                if(fyCostOfBillly){
                    fyCostOfBillly = convertCurr(fyCostOfBillly)
                }
                if( fyRevly){
                    fyRevly = convertCurr(fyRevly)
                }
                if(fyOpexly){
                    fyOpexly = convertCurr(fyOpexly)
                }
                if(fyEbitdaly){
                    fyEbitdaly = convertCurr(fyEbitdaly)
                }
                if(fyNettProfitly){
                    fyNettProfitly = convertCurr(fyNettProfitly)
                }
                if(fyBillty){
                    fyBillty = convertCurr(fyBillty);
                }
                if(fyCostOfBillty){
                    fyCostOfBillty = convertCurr(fyCostOfBillty);
                }
                if(fyRevty){
                    fyRevty = convertCurr(fyRevty);
                }
                if(fyOpexty){
                    fyOpexty = convertCurr(fyOpexty)
                }
                if(fyEbitdaty){
                    fyEbitdaty = convertCurr(fyEbitdaty)
                }
                if(fyNettProfitty){
                    fyNettProfitty = convertCurr(fyNettProfitty)
                }
                if (billingly) {
                    billingly = convertCurr(billingly);
                }
                if (billingty) {
                    billingty = convertCurr(billingty);
                }
                if (estimateBill) {
                    estimateBill = convertCurr(estimateBill);
                }
                if (costOfBillingly) {
                    costOfBillingly = convertCurr(costOfBillingly);
                }
                if (costOfBillingty) {
                    costOfBillingty = convertCurr(costOfBillingty);
                }
                if (estimateCoss) {
                    estimateCoss = convertCurr(estimateCoss);
                }
                if (grossProvitRevly) {
                    grossProvitRevly = convertCurr(grossProvitRevly);
                }
                if (grossProvitRevty) {
                    grossProvitRevty = convertCurr(grossProvitRevty);
                }
                if (estimateRev) {
                    estimateRev = convertCurr(estimateRev);
                }
                if (opexly) {
                    opexly = convertCurr(opexly);
                }
                if (opexty) {
                    opexty = convertCurr(opexty);
                }
                if (estimateOpex) {
                    estimateOpex = convertCurr(estimateOpex);
                }
                if (ebitdaly) {
                    ebitdaly = convertCurr(ebitdaly);
                }
                if (ebitdaty) {
                    ebitdaty = convertCurr(ebitdaty);
                }
                if (estimateEbitda) {
                    estimateEbitda = convertCurr(estimateEbitda);
                }
                if (nettProfitly) {
                    nettProfitly = convertCurr(nettProfitly);
                }
                if (nettProfitty) {
                    nettProfitty = convertCurr(nettProfitty);
                }
                if (netProfitEstimate) {
                    netProfitEstimate = convertCurr(netProfitEstimate);
                }
                

                var allData = []
                var currentRecord = createSublist("custpage_sublist_item", form, periodNamety, periodNamely, thisYear, lastYear);
                const sublistData = [
                    { 
                        summary: "Billing", 
                        act_py: billingly || 0, 
                        act_ty: billingty || 0, 
                        yoy: yoyBillingText || 0, 
                        est_fy: estimateBill || 0, 
                        fy_target: fyBillty, 
                        fy_target_p: prosFyBillty,
                        fy_py : fyBillly,
                        fy_py_p : prosFyBillly
                    },
                    { 
                        summary: "Cost of Billing", 
                        act_py: costOfBillingly || 0, 
                        act_ty: costOfBillingty || 0, 
                        yoy: '-', 
                        est_fy: estimateCoss || 0, 
                        fy_target: fyCostOfBillty, 
                        fy_target_p: '-',
                        fy_py : fyCostOfBillly,
                        fy_py_p : '-'
                    },
                    { 
                        summary: "Gross Profit- Revenue", 
                        act_py: grossProvitRevly || 0, 
                        act_ty: grossProvitRevty || 0, 
                        yoy: yoygrossProvitRevText, 
                        est_fy: estimateRev, 
                        fy_target: fyRevty, 
                        fy_target_p: prosFyRevty,
                        fy_py : fyRevly,
                        fy_py_p : prosFyRevly
                    },
                    { 
                        summary: "Gp to Billing", 
                        act_py: gpToBillinglytext || 0, 
                        act_ty: gpToBillingtytext || 0, 
                        yoy: '-', 
                        est_fy: estimateGpText, 
                        fy_target: fyGptyText, 
                        fy_target_p: '-',
                        fy_py : fyGply,
                        fy_py_p : '-' 
                    },
                    { 
                        summary: "Opex", 
                        act_py: opexly || 0, 
                        act_ty: opexty || 0, 
                        yoy: yoyOpexText, 
                        est_fy: estimateOpex, 
                        fy_target: fyOpexty, 
                        fy_target_p: prosFyOpexty,
                        fy_py : fyOpexly,
                        fy_py_p : prosFyOpexly
                    },
                    { 
                        summary: "Head Count", 
                        act_py: '-', 
                        act_ty: '-', 
                        yoy: '-', 
                        est_fy: '-', 
                        fy_target: '-', 
                        fy_target_p: '-',
                        fy_py : '-',
                        fy_py_p : '-' 
                    },
                    { 
                        summary: "Opex to Gross Profit", 
                        act_py: opexGrossProfitlyText || 0, 
                        act_ty: opexGrossProfittyText || 0, 
                        yoy: '-', 
                        est_fy: estimateOpextoGrossProfitText, 
                        fy_target: fyOpexfGptyText, 
                        fy_target_p: '-',
                        fy_py : fyOpexGply,
                        fy_py_p : '-' 
                    },
                    { 
                        summary: "Ebitda", 
                        act_py: ebitdaly || 0, 
                        act_ty: ebitdaty || 0, 
                        yoy: yoyEbitdaText, 
                        est_fy: estimateEbitda, 
                        fy_target: fyEbitdaty, 
                        fy_target_p: prosFyEbitdaty,
                        fy_py : fyEbitdaly,
                        fy_py_p : prosFyEbitdaly
                    },
                    { 
                        summary: "Ebitda to Gross Profit", 
                        act_py: ebitdaGplyText || 0, 
                        act_ty: ebitdaGptyText || 0, 
                        yoy: '-', 
                        est_fy: estimateEbitdaGpText, 
                        fy_target: fyEbitdaGptyText, 
                        fy_target_p: '-',
                        fy_py : fyEbitdaGply,
                        fy_py_p : '-' 
                    },
                    { 
                        summary: "Net Profit", 
                        act_py: nettProfitly || 0, 
                        act_ty: nettProfitty || 0, 
                        yoy: netProvityoyText, 
                        est_fy: netProfitEstimate, 
                        fy_target: fyNettProfitty, 
                        fy_target_p: prosFyNetProfitty,
                        fy_py : fyNettProfitly,
                        fy_py_p : prosFyNetProfitly
                    },
                    { 
                        summary: "Net Profit to Gross Profit", 
                        act_py: netProfittoGplyText || 0, 
                        act_ty: netProfittoGptyText || 0, 
                        yoy: '-', 
                        est_fy: netProfittoGpEstimateText, 
                        fy_target: fyNettProfitGptyText, 
                        fy_target_p: '-',
                        fy_py : fyNettProfitGply,
                        fy_py_p : '-' 
                    },
                ];
                
                sublistData.forEach((data, index) => {
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_summary",
                        value: data.summary,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_act_py",
                        value: data.act_py,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_act_ty",
                        value: data.act_ty,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_yoy",
                        value: data.yoy,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_est_fy",
                        value: data.est_fy,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_fy_target",
                        value: data.fy_target,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_fy_target_p",
                        value: data.fy_target_p,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_fy_py",
                        value: data.fy_py,
                        line: index
                    });
                    currentRecord.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_fy_py_p",
                        value: data.fy_py_p,
                        line: index
                    });
                });

                var listadd1 = form.addFieldGroup({
                    id: "wip",
                    label: "WIP onhand from reconcile file",
                });
                var grossProfitTotal = Number(totalBilling) + Number(totalCostOfBilling)
                if(totalBilling){
                    totalBilling = convertCurr(totalBilling)
                }
                if(totalCostOfBilling){
                    totalCostOfBilling = convertCurr(totalCostOfBilling)
                }
                if(grossProfitTotal){
                    grossProfitTotal = convertCurr(grossProfitTotal)
                }
                var lineItem = createItem("custpage_sublist_add", form, listadd1);
                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_sum",
                    value: 'Billing',
                    line: 0
                });
                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_total",
                    value: totalBilling,
                    line: 0
                });

                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_sum",
                    value: 'cost of billing',
                    line: 1
                });
                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_total",
                    value: totalCostOfBilling,
                    line: 1
                });

                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_sum",
                    value: 'Gross Profit',
                    line: 2
                });
                lineItem.setSublistValue({
                    sublistId: "custpage_sublist_add",
                    id: "custpage_sublist_total",
                    value: grossProfitTotal,
                    line: 2
                });

                if(deprely){
                    deprely = convertCurr(deprely)
                }
                if(deprety){
                    deprety = convertCurr(deprety)
                }
                if(totalDepre){
                    totalDepre = convertCurr(totalDepre)
                }
                var depreLine = createDepre("custpage_sublist_depre", form, periodNamety, periodNamely);
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_summary",
                    value: "total Depreciation per month",
                    line: 0
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_first",
                    value: deprely,
                    line: 0
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_second",
                    value: deprety,
                    line: 0
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_fullyear",
                    value: totalDepre,
                    line: 0
                });

                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_summary",
                    value: "-",
                    line: 1
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_first",
                    value: "-",
                    line: 1
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_second",
                    value: "_",
                    line: 1
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_fullyear",
                    value: "-",
                    line: 1
                });

                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_summary",
                    value: "Tax Rate",
                    line: 2
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_first",
                    value: tax + "%",
                    line: 2
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_second",
                    value: tax + "%",
                    line: 2
                });
                depreLine.setSublistValue({
                    sublistId: "custpage_sublist_depre",
                    id: "custpage_sublist_fullyear",
                    value: "-",
                    line: 2
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
    function createItem(sublistname, form, listadd1){
        var sublist_item = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "WIP onhand from reconcile file",
            container : listadd1
        });
        sublist_item.addField({
            id: "custpage_sublist_sum",
            label: "Summary",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_item.addField({
            id: "custpage_sublist_total",
            label: "Total",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist_item
    }
    function createDepre(sublistname, form, periodNamety, periodNamely){
        var sublist_depre = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Deprecation / Tax Rate"
        });
        sublist_depre.addField({
            id: "custpage_sublist_summary",
            label: "Summary",
            type: serverWidget.FieldType.TEXT,
        });
        sublist_depre.addField({
            id: "custpage_sublist_first",
            label: periodNamely,
            type: serverWidget.FieldType.TEXT,
        });
        sublist_depre.addField({
            id: "custpage_sublist_second",
            label: periodNamety,
            type: serverWidget.FieldType.TEXT,
        });
        sublist_depre.addField({
            id: "custpage_sublist_fullyear",
            label: "Full Year",
            type: serverWidget.FieldType.TEXT,
        });
        return sublist_depre
    }
    return{
        onRequest : onRequest
    }
});