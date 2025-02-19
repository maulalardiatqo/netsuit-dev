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
            try {
                var contextRequest = context.request;
                var form = serverWidget.createForm({
                    title: "Monthly Review",
                });

                var filterOption = form.addFieldGroup({
                    id: "filteroption",
                    label: "FILTERS",
                });

                // var inlineHtml = form.addField({
                //     id: 'custpage_inline_html',
                //     type: serverWidget.FieldType.INLINEHTML,
                //     label: 'test'
                // });
                // inlineHtml.defaultValue = '<div style="background-color: lightblue; padding: 10px;">Test Color</div>';

                var subsFilter = form.addField({
                    id: "custpage_subs_option",
                    label: "Subsidiary",
                    type: serverWidget.FieldType.SELECT,
                    container: "filteroption",
                    source: "subsidiary",
                });
                subsFilter.isMandatory = true

                // var periodFilter = form.addField({
                //     id: "custpage_period_option",
                //     label: "Period",
                //     type: serverWidget.FieldType.SELECT,
                //     container: "filteroption",
                //     source: "accountingperiod",
                // });

                // periodFilter.isMandatory = true

                //
                var periodField = form.addField({
                    id: 'custpage_accounting_periodnew',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Select Period',
                    container: "filteroption"
                });
                var periodSearch = search.create({
                    type: 'accountingperiod',
                    columns: ['periodname']
                });
                periodSearch.run().each(function (result) {
                    var periodName = result.getValue({ name: 'periodname' });
                    var idPeriod = result.id;
                    periodField.addSelectOption({ value: idPeriod, text: periodName });

                    return true;
                });
                periodField.isMandatory = true

                var vsPeriodField = form.addField({
                    id: 'custpage_accounting_vsperiodnew',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Select Period Comparation',
                    container: "filteroption"
                });
                var vsPeriodSearch = search.create({
                    type: 'accountingperiod',
                    columns: ['periodname']
                });
                vsPeriodSearch.run().each(function (result) {
                    var vsPeriodName = result.getValue({ name: 'periodname' });
                    var idVsPeriod = result.id;
                    vsPeriodField.addSelectOption({ value: idVsPeriod, text: vsPeriodName });

                    return true;
                });
                vsPeriodField.isMandatory = true

                //

                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const currentDate = new Date();
                const currentMonth = months[currentDate.getMonth()];
                const currentYear = currentDate.getFullYear();
                const previousYear = currentYear - 1;
                const previousFormatted = `${currentMonth} ${previousYear}`;
                log.debug('previousFormatted', previousFormatted)
                var postingPeriodData = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["periodname", "is", previousFormatted]
                    ],
                    columns: ["internalid"]
                });
                var prevPeriodId;
                postingPeriodData.run().each(function (result) {
                    prevPeriodId = result.getValue({ name: 'internalid' });
                    return true;
                });
                log.debug('prevPeriodId', prevPeriodId)
                // var periodComparation = form.addField({
                //     id: "custpage_period_comparation_option",
                //     label: "Period Comparation",
                //     type: serverWidget.FieldType.SELECT,
                //     container: "filteroption",
                //     source: "accountingperiod",
                // });
                // periodComparation.isMandatory = true
                // periodComparation.defaultValue = prevPeriodId
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
                if (context.request.method === 'GET') {
                    context.response.writePage(form);
                } else {
                    // var periodId = context.request.parameters.custpage_period_option;
                    // periodFilter.defaultValue = periodId //untuk di bagian filter

                    var periodId = context.request.parameters.custpage_accounting_periodnew
                    periodField.defaultValue = periodId //untuk di bagian filter

                    // var periodComparationId = context.request.parameters.custpage_period_comparation_option;
                    // periodComparation.defaultValue = periodComparationId //untuk di bagian filter
                    var periodComparationId = context.request.parameters.custpage_accounting_vsperiodnew;
                    vsPeriodField.defaultValue = periodComparationId //untuk di bagian filter
                    log.debug('periodComparationId', periodComparationId)

                    var subsId = context.request.parameters.custpage_subs_option;
                    subsFilter.defaultValue = subsId //untuk di bagian filter

                    var tax = context.request.parameters.custpage_taxrate_option;
                    taxrateFilter.defaultValue = tax //untuk di bagian filter

                    var taxrate = Number(tax) / 100
                    var periodNamety;
                    var periodNamely;
                    var thisYear;
                    var lastYear
                    var endDate;

                    var periodComparationName;
                    var yearComparation;
                    var endDateComparation;

                    var periodComparationSearchObj = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["internalid", "anyof", periodComparationId]
                        ],
                        columns: [
                            search.createColumn({ name: "periodname", sort: search.Sort.DESC }),
                            search.createColumn({ name: "enddate", sort: search.Sort.DESC }),
                        ]
                    })
                    periodComparationSearchObj.run().each(function (result) {
                        endDateComparation = result.getValue({ name: 'enddate' })
                        periodComparationName = result.getValue({ name: 'periodname' })
                        yearComparation = periodComparationName.split(" ")[1]
                        return true;
                    });

                    var dateComparationstart = "01/01/" + yearComparation

                    var accountingperiodSearchObj = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["internalid", "anyof", periodId]
                        ],
                        columns: [
                            search.createColumn({ name: "periodname", sort: search.Sort.DESC }),
                            search.createColumn({ name: "enddate", sort: search.Sort.DESC }),
                        ]
                    });

                    accountingperiodSearchObj.run().each(function (result) {
                        var perName = result.getValue({ name: 'periodname' });
                        periodNamety = perName;

                        var currentYear = parseInt(periodNamety.split(" ")[1]);
                        var prevYear = currentYear - 1;
                        thisYear = currentYear
                        lastYear = prevYear;

                        periodNamely = periodNamety.replace(currentYear, prevYear);
                        endDate = result.getValue({ name: 'enddate' })

                        return true;
                    });

                    var datestart = "01/01/" + periodNamety.split(" ")[1]


                    var postingPeriodData = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "is", periodNamely]
                        ],
                        columns: ["internalid"]
                    });
                    var periodIdly;
                    postingPeriodData.run().each(function (result) {
                        periodIdly = result.getValue({ name: 'internalid' });
                        return true;
                    });

                    var thisYearName = 'FY ' + thisYear;
                    var lastYearName = 'FY ' + lastYear
                    var yearSearchty = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "is", thisYearName]
                        ],
                        columns: ["internalid"]
                    });
                    var thisYearId;
                    yearSearchty.run().each(function (result) {
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
                    yearSearchly.run().each(function (result) {
                        lastYearId = result.getValue({ name: 'internalid' });
                        return true;
                    });

                    var startThisYear = new Date(thisYear, 0, 1);
                    var endThisYear = new Date(thisYear, 11, 31);

                    var startLastYear = new Date(lastYear, 0, 1);
                    var endLastYear = new Date(lastYear, 11, 31);
                    function convertCurr(data) {
                        data = format.format({
                            value: data,
                            type: format.Type.CURRENCY
                        });

                        return data
                    }
                    function convertText(data) {
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

                    // log.debug('formattedStartThisYear', formattedStartThisYear);
                    // log.debug('formattedEndThisYear', formattedEndThisYear);
                    // log.debug('formattedstartLastYear', formattedstartLastYear);
                    // log.debug('formattedendLastYear', formattedendLastYear);


                    var checkPeriodName = periodNamety.split(" ")[0]
                    var checkPeriodComparationName = periodComparationName.split(" ")[0]


                    // load billing this year
                    var billingSearch = search.load({ id: "customsearch_monthly_review" });
                    if (subsId) billingSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        billingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        billingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) billingSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var billingtySearch = billingSearch.run().getRange({ start: 0, end: 1 });
                    var billingty = billingtySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    var billingSearchly = search.load({ id: "customsearch_monthly_review" });
                    if (subsId) billingSearchly.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodComparationName)) {
                        billingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        billingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) billingSearchly.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }
                    // if (formattedstartLastYear) billingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: formattedstartLastYear }));
                    // if (formattedendLastYear) billingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedendLastYear }));
                    var billinglySearch = billingSearchly.run().getRange({ start: 0, end: 1 });
                    var billingly = billinglySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    log.debug('billing last year', billingly)

                    // totalBilling
                    var totalbillingSearch = search.load({ id: "customsearch_monthly_review" });
                    if (subsId) totalbillingSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (formattedStartThisYear) totalbillingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear }));
                    if (formattedEndThisYear) totalbillingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear }));
                    var totalBillingSearchReturn = totalbillingSearch.run().getRange({ start: 0, end: 1 });
                    var totalBilling = totalBillingSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // load cost of billing
                    // var costOfBilling = search.load({ id: "customsearch_monthly_review_2" });
                    var costOfBilling = search.load({ id: "customsearch1182" });
                    if (subsId) costOfBilling.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        costOfBilling.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        costOfBilling.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) costOfBilling.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }
                    var costOfBillingtySearch = costOfBilling.run().getRange({ start: 0, end: 1 });
                    var costOfBillingty = costOfBillingtySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // var costOfBillingSearchly = search.load({ id: "customsearch_monthly_review_2" });
                    var costOfBillingSearchly = search.load({ id: "customsearch1182" });
                    if (subsId) costOfBillingSearchly.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));


                    if (months.includes(checkPeriodComparationName)) {
                        costOfBillingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        costOfBillingSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) costOfBillingSearchly.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var costOfBillinglySearchRetly = costOfBillingSearchly.run().getRange({ start: 0, end: 1 });
                    var costOfBillingly = costOfBillinglySearchRetly[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // total cost of billing
                    // var totalCostOfBillingSearch = search.load({ id: "customsearch_monthly_review_2" });
                    var totalCostOfBillingSearch = search.load({ id: "customsearch1182" });
                    if (subsId) totalCostOfBillingSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (formattedStartThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear }));
                    if (formattedEndThisYear) totalCostOfBillingSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear }));
                    var totalCostOfBillingSearchReturn = totalCostOfBillingSearch.run().getRange({ start: 0, end: 1 });
                    var totalCostOfBilling = totalCostOfBillingSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // load opex
                    var opexSearch = search.load({ id: "customsearch_monthly_review_2_2" });
                    if (subsId) opexSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        opexSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        opexSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) opexSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var opextySearch = opexSearch.run().getRange({ start: 0, end: 1 });
                    var opexty = opextySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    var opxSearchLy = search.load({ id: "customsearch_monthly_review_2_2" });
                    if (subsId) opxSearchLy.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));


                    if (months.includes(checkPeriodComparationName)) {
                        opxSearchLy.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        opxSearchLy.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) opxSearchLy.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var opexlySearch = opxSearchLy.run().getRange({ start: 0, end: 1 });
                    var opexly = opexlySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;


                    //tax expense
                    var savedSearchTaxExp = 'customsearch1184'
                    var taxExpSearch = search.load({ id: 'customsearch1184' });
                    if (subsId) taxExpSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        taxExpSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        taxExpSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) taxExpSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var taxExpSearchTY = taxExpSearch.run().getRange({ start: 0, end: 1 });
                    var taxExpTY = taxExpSearchTY[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;


                    var taxExpSearchLY = search.load({ id: 'customsearch1184' });
                    if (subsId) taxExpSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));


                    if (months.includes(checkPeriodComparationName)) {
                        taxExpSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        taxExpSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) taxExpSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var taxExpSearchforLY = taxExpSearchLY.run().getRange({ start: 0, end: 1 });
                    var taxExpLY = taxExpSearchforLY[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    var grossProvitRevly = Number(billingly) - Number(costOfBillingly);
                    var grossProvitRevty = Number(billingty) - Number(costOfBillingty);

                    var gpToBillingly = billingly !== 0 ? (grossProvitRevly / billingly) * 100 : 0;
                    var gpToBillinglytext = gpToBillingly.toFixed(2) + '%'
                    var gpToBillingty = billingty !== 0 ? (grossProvitRevty / billingty) * 100 : 0;
                    var gpToBillingtytext = gpToBillingty.toFixed(2) + '%'

                    var yoyBilling = (billingly !== 0 && billingty !== 0) ? ((Number(billingty) / Number(billingly)) - 1) * 100 : 0;
                    var yoyBillingText = yoyBilling.toFixed(2) + '%'
                    var yoyCostBilling = (costOfBillingly !== 0 && costOfBillingty !== 0) ? ((Number(costOfBillingty) / Number(costOfBillingly)) - 1) * 100 : 0;
                    var yoyCostBilling = yoyCostBilling.toFixed(2) + '%'


                    var yoygrossProvitRev = grossProvitRevly !== 0 ? ((grossProvitRevty / grossProvitRevly) - 1) * 100 : 0;
                    var yoygrossProvitRevText = yoygrossProvitRev.toFixed(2) + '%';
                    // var yoyOpex = (yoyBilling !== 0 && yoygrossProvitRev !== 0) ? Number(yoyBilling) / Number(yoygrossProvitRev) : 0;
                    var yoyOpex = (opexly !== 0 && opexty !== 0) ? ((Number(opexty) / Number(opexly)) - 1) * 100 : 0
                    var yoyOpexText = yoyOpex.toFixed(2) + '%'

                    var opexGrossProfitly = (Number(opexly) / Number(grossProvitRevly)) * 100 || 0
                    var opexGrossProfitlyText = opexGrossProfitly.toFixed(2) + ' %';

                    var opexGrossProfitty = (opexty !== 0 && grossProvitRevty !== 0) ? (Number(opexty) / Number(grossProvitRevty)) * 100 : 0;
                    var opexGrossProfittyText = opexGrossProfitty.toFixed(2) + '%'


                    var ebitdaly = Number(grossProvitRevly) - Number(opexly) || 0;
                    var ebitdaty = Number(grossProvitRevty) - Number(opexty) || 0;
                    var yoyEbitda = (ebitdaty !== 0 && ebitdaly !== 0) ? ((Number(ebitdaty) / Number(ebitdaly)) - 1) * 100 : 0;
                    var yoyEbitdaText = yoyEbitda.toFixed(2) + "%"

                    var ebitdaGply = (ebitdaly !== 0 && grossProvitRevly !== 0) ? (Number(ebitdaly) / Number(grossProvitRevly)) * 100 : 0;
                    var ebitdaGplyText = ebitdaGply.toFixed(2) + ' %';
                    var ebitdaGpty = (ebitdaty !== 0 && grossProvitRevty !== 0) ? (Number(ebitdaty) / Number(grossProvitRevty)) * 100 : 0;
                    var ebitdaGptyText = ebitdaGpty.toFixed(2) + ' %';
                    var year = periodNamety.split(" ")[1];
                    var endYear = '31/12/' + year;
                    var firstYear = '01/01/' + year;
                    log.debug('endYear', endYear)
                    log.debug('year', year);
                    var pendingBillData = search.load({
                        id: "customsearch1202",
                    });
                    log.debug('endDate', endDate)
                    log.debug('periodNamety', periodNamety)
                    log.debug('subsId', subsId)
                    pendingBillData.filters.push(
                        search.createFilter({
                            name: "subsidiary",
                            operator: search.Operator.IS,
                            values: subsId,
                        })
                    );
                    pendingBillData.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: endDate,
                        })
                    );
                    pendingBillData.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: endYear,
                        })
                    );

                    var pendingBilldataGross = search.load({
                        id: "customsearch1202",
                    });
                    log.debug('endDate', endDate)
                    log.debug('periodNamety', periodNamety)
                    log.debug('subsId', subsId)

                    pendingBilldataGross.filters.push(
                        search.createFilter({
                            name: "subsidiary",
                            operator: search.Operator.IS,
                            values: subsId,
                        })
                    );
                    pendingBilldataGross.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORAFTER,
                            values: firstYear,
                        })
                    );
                    pendingBilldataGross.filters.push(
                        search.createFilter({
                            name: "trandate",
                            operator: search.Operator.ONORBEFORE,
                            values: endDate,
                        })
                    );

                    var WIPGross = 0;
                    var resultPendingGross = pendingBilldataGross.run().getRange({ start: 0, end: 1000 });
                    resultPendingGross.forEach(function(result) {
                        var amount = result.getValue('amount');
                        WIPGross += Number(amount)
                        return true;
                    });

                    var WIP = 0
                    var resultPending = pendingBillData.run().getRange({ start: 0, end: 1000 });
                    resultPending.forEach(function(result) {
                        var amount = result.getValue('amount');
                        WIP += Number(amount)
                        return true;
                    });
                    log.debug('WIP Sisa Year', WIP)

                    //
                    // var estimateBill = Number(billingty) + Number(totalBilling)
                    var estimateBill = Number(billingty) + Number(WIP)

                    // var estimateCoss = Number(costOfBillingty) + Number(totalCostOfBilling)
                    var estimateCoss = Number(costOfBillingty) + Number(WIP)

                    // var estimateRev = Number(estimateBill) - Number(estimateCoss);
                    log.debug('billingty', billingty)
                    log.debug('costOfBillingty', costOfBillingty)
                    var estimateRev = Number(billingty) - Number(costOfBillingty) + Number(WIPGross);

                    var estimateGp = (estimateRev !== 0 && estimateBill !== 0) ? (Number(estimateRev) / Number(estimateBill)) * 100 : 0;
                    var estimateGpText = estimateGp.toFixed(2) + ' %';

                    // var estimateOpex = Number(opexty) * 12
                    var estimateOpex = Number(opexty) + Number(WIP)


                    var estimateOpextoGrossProfit = (estimateOpex !== 0 && estimateRev !== 0) ? (Number(estimateOpex) / Number(estimateRev)) * 100 : 0;
                    var estimateOpextoGrossProfitText = estimateOpextoGrossProfit.toFixed(2) + '%'

                    // var estimateEbitda = Number(estimateRev) - Number(estimateOpex);
                    var estimateEbitda = Number(ebitdaty) + Number(WIP);

                    var estimateEbitdaGp = (estimateEbitda !== 0 && estimateRev !== 0) ? (Number(estimateEbitda) / Number(estimateRev)) * 100 : 0;
                    var estimateEbitdaGpText = estimateEbitdaGp.toFixed(2) + '%'

                    var depreSearch = search.load({ id: "customsearch_monthly_review_2_2_4" });
                    if (subsId) depreSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (months.includes(checkPeriodName)) {
                        depreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        depreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) depreSearch.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var depretySearch = depreSearch.run().getRange({ start: 0, end: 1 });
                    var deprety = depretySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // log.debug('deprety', deprety)


                    var depreSearchly = search.load({ id: "customsearch_monthly_review_2_2_4" });
                    if (subsId) depreSearchly.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodComparationName)) {
                        depreSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        depreSearchly.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) depreSearchly.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var deprelySearch = depreSearchly.run().getRange({ start: 0, end: 1 });
                    var deprely = deprelySearch[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    // log.debug('deprely', deprely)

                    var totalDepreSearch = search.load({ id: "customsearch_monthly_review_2_2_4" });
                    if (subsId) totalDepreSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    // if (formattedStartThisYear) totalDepreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: formattedStartThisYear }));
                    // if (formattedEndThisYear) totalDepreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: formattedEndThisYear }));
                    totalDepreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    totalDepreSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    var totalDepreSearchReturn = totalDepreSearch.run().getRange({ start: 0, end: 1 });
                    var totalDepre = totalDepreSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    ////new net profit (other income + other expenses)

                    //other income this year
                    var otherIncomeSearchTY = search.load({ id: "customsearch1177" });
                    if (subsId) otherIncomeSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        otherIncomeSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        otherIncomeSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) otherIncomeSearchTY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var otherIncomeTY = 0
                    otherIncomeSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherIncomeTY += Number(amount)
                        return true;
                    });
                    otherIncomeTY = otherIncomeTY.toFixed(2)

                    var otherIncomeSearchDepositTY = search.load({ id: "customsearch1183" });
                    if (subsId) otherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        otherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        otherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) otherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var otherIncomeDepositTY = 0
                    otherIncomeSearchDepositTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherIncomeDepositTY += Number(amount)
                        return true;
                    });
                    otherIncomeDepositTY = otherIncomeDepositTY.toFixed(2)

                    //
                    //other income last year
                    var otherIncomeSearchLY = search.load({ id: "customsearch1177" });
                    if (subsId) otherIncomeSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));


                    if (months.includes(checkPeriodComparationName)) {
                        otherIncomeSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        otherIncomeSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) otherIncomeSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }


                    var otherIncomeLY = 0
                    otherIncomeSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherIncomeLY += Number(amount)
                        return true;
                    });
                    otherIncomeLY = otherIncomeLY.toFixed(2)

                    var otherIncomeDepositSearchLY = search.load({ id: "customsearch1183" });
                    if (subsId) otherIncomeDepositSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (months.includes(checkPeriodComparationName)) {
                        otherIncomeDepositSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        otherIncomeDepositSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) otherIncomeDepositSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var otherIncomeDepositLY = 0
                    otherIncomeDepositSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherIncomeDepositLY += Number(amount)
                        return true;
                    });
                    otherIncomeDepositLY = otherIncomeDepositLY.toFixed(2)

                    var totalOtherIncomeTY = Number(otherIncomeTY) + Number(otherIncomeDepositTY)
                    var totalOtherIncomeLY = Number(otherIncomeLY) + Number(otherIncomeDepositLY)

                    //

                    //other expenses last year

                    var otherExpJournalSearchLY = search.load({ id: "customsearch1178" });
                    if (subsId) otherExpJournalSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodComparationName)) {
                        otherExpJournalSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        otherExpJournalSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) otherExpJournalSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var otherExpJournalLY = 0
                    otherExpJournalSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherExpJournalLY += Number(amount)
                        return true;
                    });
                    otherExpJournalLY = otherExpJournalLY.toFixed(2)

                    var otherExpCreditNCheckSearchLY = search.load({ id: "customsearch1180" });
                    if (subsId) otherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodComparationName)) {
                        otherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        otherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) otherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var otherExpCreditNCheckLY = 0
                    otherExpCreditNCheckSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherExpCreditNCheckLY += Number(amount)
                        return true;
                    });
                    otherExpCreditNCheckLY = otherExpCreditNCheckLY.toFixed(2)

                    var otherExpLY = -1 * (Number(otherExpJournalLY) + Number(otherExpCreditNCheckLY))
                    // log.debug('otherExpJournalLY', otherExpJournalLY)
                    // log.debug('otherExpCreditNCheckLY', otherExpCreditNCheckLY)

                    // log.debug('otherExpLY', otherExpLY)

                    // other Expense this year
                    var otherExpJournalSearchTY = search.load({ id: "customsearch1178" });
                    if (subsId) otherExpJournalSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        otherExpJournalSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        otherExpJournalSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) otherExpJournalSearchTY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var otherExpJournalTY = 0
                    otherExpJournalSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherExpJournalTY += Number(amount)
                        return true;
                    });
                    otherExpJournalTY = otherExpJournalTY.toFixed(2)
                    // log.debug('otherExpJournalTY', otherExpJournalTY)


                    var otherExpCreditNCheckSearchTY = search.load({ id: "customsearch1180" });
                    if (subsId) otherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        if (formattedStartThisYear) otherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        if (formattedEndThisYear) otherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) otherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var otherExpCreditNCheckTY = 0
                    otherExpCreditNCheckSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        otherExpCreditNCheckTY += Number(amount)
                        return true;
                    });
                    otherExpCreditNCheckTY = otherExpCreditNCheckTY.toFixed(2)


                    var otherExpTY = -1 * (Number(otherExpJournalTY) + Number(otherExpCreditNCheckTY))

                    //tambahan overheads last year
                    var addOverheadsSearchLY = search.load({ id: "customsearch1181" });
                    if (subsId) addOverheadsSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodComparationName)) {
                        addOverheadsSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: dateComparationstart }));
                        addOverheadsSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDateComparation }));
                    } else {
                        if (periodComparationId) addOverheadsSearchLY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodComparationId }));
                    }

                    var addOverheadsLY = 0
                    addOverheadsSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        addOverheadsLY += Number(amount)
                        return true;
                    });
                    addOverheadsLY = addOverheadsLY.toFixed(2)

                    //tambahan overheads this year
                    var addOverheadsSearchTY = search.load({ id: "customsearch1181" });
                    if (subsId) addOverheadsSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    if (months.includes(checkPeriodName)) {
                        addOverheadsSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: datestart }));
                        addOverheadsSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    } else {
                        if (periodId) addOverheadsSearchTY.filters.push(search.createFilter({ name: "postingperiod", operator: search.Operator.ANYOF, values: periodId }));
                    }

                    var addOverheadsTY = 0
                    addOverheadsSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        addOverheadsTY += Number(amount)
                        return true;
                    });
                    addOverheadsTY = addOverheadsTY.toFixed(2)
                    //



                    //hitung netprofit
                    var totalOverheadsLY = Number(opexly) + Number(deprely) + Number(addOverheadsLY)
                    // log.debug('opexly', opexly)
                    // log.debug('totalOverheadsLY', totalOverheadsLY)
                    var operatingProfitLY = Number(grossProvitRevly) - Number(totalOverheadsLY)
                    // log.debug('operatingProfitLY', operatingProfitLY)

                    var totalOverheadsTY = Number(opexty) + Number(deprety) + Number(addOverheadsTY)
                    // log.debug('opexty', opexty)
                    // log.debug('totalOverheadsTY', totalOverheadsTY)
                    var operatingProfitTY = Number(grossProvitRevty) - Number(totalOverheadsTY)
                    // log.debug('operatingProfitTY', operatingProfitTY)


                    ////

                    // var nettProfitly = (Number(ebitdaly) + Number(deprely)) * Number(1 - Number(taxrate))
                    var nettProfitly = Number(operatingProfitLY) + (Number(otherIncomeLY) + Number(otherIncomeDepositLY)) + Number(otherExpLY)

                    // var nettProfitty = (Number(ebitdaty) + Number(deprely)) * (1 - Number(taxrate));
                    var nettProfitty = Number(operatingProfitTY) + (Number(otherIncomeTY) + Number(otherIncomeDepositTY)) + Number(otherExpTY)

                    var netProvityoy = (nettProfitly !== 0 && nettProfitty !== 0) ? ((Number(nettProfitty) / Number(nettProfitly)) - 1) * 100 : 0;
                    var netProvityoyText = netProvityoy.toFixed(2) + "%";

                    // var netProfitEstimate = (Number(estimateEbitda) + Number(totalDepre)) * Number(1 - Number(taxrate))
                    var netProfitEstimate = Number(nettProfitty) + Number(WIP)

                    var netProfittoGply = (nettProfitly !== 0 && grossProvitRevly !== 0) ? (Number(nettProfitly) / Number(grossProvitRevly)) * 100 : 0;
                    var netProfittoGplyText = netProfittoGply.toFixed(2) + '%';
                    var netProfittoGpty = (nettProfitty !== 0 && grossProvitRevty !== 0) ? (Number(nettProfitty) / Number(grossProvitRevty)) * 100 : 0;
                    var netProfittoGptyText = netProfittoGpty.toFixed(2) + '%';
                    var netProfittoGpEstimate = (netProfitEstimate !== 0 && estimateRev !== 0) ? (Number(netProfitEstimate) / Number(estimateRev)) * 100 : 0;
                    var netProfittoGpEstimateText = netProfittoGpEstimate.toFixed(2) + '%';

                    //Masuk FY this year

                    // load FY Bill This Year
                    // var fyBillSearch = search.load({ id: "customsearchbudgetdefaultview" });
                    // var fyBillSearch = search.load({ id: "customsearch_monthly_review" });
                    var fyBillSearch = search.load({ id: "customsearch1215" });

                    if (subsId) fyBillSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) fyBillSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    // fyBillSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    // fyBillSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamety.split(" ")[1] }));

                    var monthInd = months.indexOf(checkPeriodName)
                    // log.debug('monthInd', monthInd)
                    var fyBillSearchReturn = fyBillSearch.run().getRange({ start: 0, end: 1 });
                    // log.debug('fyBillSearchReturn', fyBillSearchReturn)
                    var amountBudg = fyBillSearchReturn[0].getValue({
                        name: "amount",
                    }) || 0;


                    var fyBillty = (amountBudg / 12) * (monthInd + 1)
                    // log.debug('fyBillty', fyBillty)

                    // var fyCostOfBillSearch = search.load({ id: "customsearchbudgetdefaultview_2" });
                    // var fyCostOfBillSearch = search.load({ id: "customsearch1182" });
                    // var fyCostOfBillSearch = search.load({ id: "customsearch859" });
                    var fyCostOfBillSearch = search.load({ id: "customsearch1225" });
                    if (subsId) fyCostOfBillSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    // fyCostOfBillSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    // fyCostOfBillSearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));
                    // var fyCostOfBillSearchReturn = fyCostOfBillSearch.run().getRange({ start: 0, end: 1 });
                    // var fyCostOfBillty = fyCostOfBillSearchReturn[0].getValue({
                    //     name: "amount",
                    //     summary: "SUM",
                    // }) || 0;
                    if (thisYearId) fyCostOfBillSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    var fyCostOfBillty = 0
                    fyCostOfBillSearch.run().each(function (result) {
                        fyCostOfBillty = result.getValue({
                            name: fyCostOfBillSearch.columns[monthInd + 6]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // var fyCostOfBillty = 0
                    // fyCostOfBillSearch.run().each(function (resultCost) {
                    //     var amountCost = resultCost.getValue({
                    //         name: "amount",
                    //         summary: "SUM",
                    //     })

                    //     fyCostOfBillty += Number(amountCost)

                    //     return true;
                    // });
                    // log.debug('fyCostOfBillty', fyCostOfBillty)

                    //fyaddsOverhead
                    var fyaddOverheadsSearchTY = search.load({ id: "customsearch1181" });
                    if (subsId) fyaddOverheadsSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyaddOverheadsSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    fyaddOverheadsSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));

                    var fyaddOverheadsTY = 0
                    fyaddOverheadsSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyaddOverheadsTY += Number(amount)
                        return true;
                    });
                    fyaddOverheadsTY = fyaddOverheadsTY.toFixed(2)
                    //


                    var fyRevty = Number(fyBillty) - Number(fyCostOfBillty);
                    // log.debug('fyRevty', fyRevty)

                    var fyGpty = (fyRevty !== 0 && fyBillty !== 0) ? (Number(fyRevty) / Number(fyBillty)) * 100 : 0;
                    var fyGptyText = fyGpty.toFixed(2) + '%'

                    // var opexFysearch = search.load({ id: "customsearchbudgetdefaultview_3" });
                    // var opexFysearch = search.load({ id: "customsearch_monthly_review_2_2" });
                    var opexFysearch = search.load({ id: "customsearch1217" });
                    if (subsId) opexFysearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) opexFysearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    // opexFysearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    // opexFysearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamety.split(" ")[1] }));
                    var opexFysearchReturn = opexFysearch.run().getRange({ start: 0, end: 1 });
                    // var fyOpexty = opexFysearchReturn[0].getValue({
                    //     name: "formulacurrency",
                    //     summary: "SUM",
                    // }) || 0;
                    var fyOpexty = 0
                    opexFysearch.run().each(function (resultOpx) {
                        fyOpexty = resultOpx.getValue({
                            name: opexFysearch.columns[monthInd + 5]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // log.debug('fyOpexty', fyOpexty)


                    var fyOpexfGpty = (fyOpexty !== 0 && fyRevty !== 0) ? (Number(fyOpexty) / Number(fyRevty)) * 100 : 0;
                    var fyOpexfGptyText = fyOpexfGpty.toFixed(2) + '%';

                    var fyTotalOverHeadsTY = Number(fyOpexty) + Number(totalDepre) + Number(fyaddOverheadsTY)
                    // log.debug('fyTotalOverHeadsTY', fyTotalOverHeadsTY)
                    var fyOpProfitTY = Number(fyRevty) - fyTotalOverHeadsTY
                    // log.debug('fyOpProfitTY', fyOpProfitTY)

                    //fyOtherIncomeTY & fyOtherIncomeDepoTY
                    var fyotherIncomeSearchTY = search.load({ id: "customsearch1177" });
                    if (subsId) fyotherIncomeSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherIncomeSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    fyotherIncomeSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));

                    var fyOtherIncomeTY = 0
                    fyotherIncomeSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherIncomeTY += Number(amount)
                        return true;
                    });
                    fyOtherIncomeTY = fyOtherIncomeTY.toFixed(2)


                    var fyotherIncomeSearchDepositTY = search.load({ id: "customsearch1183" });
                    if (subsId) fyotherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    fyotherIncomeSearchDepositTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));

                    var fyOtherIncomeDepoTY = 0
                    fyotherIncomeSearchDepositTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherIncomeDepoTY += Number(amount)
                        return true;
                    });
                    fyOtherIncomeDepoTY = fyOtherIncomeDepoTY.toFixed(2)


                    var fyOITY = Number(fyOtherIncomeTY) + Number(fyOtherIncomeDepoTY)
                    log.debug('fyOITY', fyOITY)
                    //

                    //fyOtherExpJournalTY & fyOtherExpCreditNCheckTY
                    var fyotherExpJournalSearchTY = search.load({ id: "customsearch1178" });
                    if (subsId) fyotherExpJournalSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherExpJournalSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    fyotherExpJournalSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));

                    var fyOtherExpJournalTY = 0
                    fyotherExpJournalSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherExpJournalTY += Number(amount)
                        return true;
                    });
                    fyOtherExpJournalTY = fyOtherExpJournalTY.toFixed(2)

                    var fyotherExpCreditNCheckSearchTY = search.load({ id: "customsearch1180" });
                    if (subsId) fyotherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamety.split(" ")[1] }));
                    fyotherExpCreditNCheckSearchTY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: endDate }));

                    var fyOtherExpCreditNCheckTY = 0
                    fyotherExpCreditNCheckSearchTY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherExpCreditNCheckTY += Number(amount)
                        return true;
                    });
                    fyOtherExpCreditNCheckTY = fyOtherExpCreditNCheckTY.toFixed(2)


                    var fyotherExpTY = -1 * (Number(fyOtherExpJournalTY) + Number(fyOtherExpCreditNCheckTY))
                    // log.debug('fyotherExpTY', fyotherExpTY)
                    //


                    var fyEbitdaty = Number(fyRevty) - Number(fyOpexty);
                    var fyEbitdaGpty = (fyEbitdaty !== 0 && fyRevty !== 0) ? (Number(fyEbitdaty) / Number(fyRevty)) * 100 : 0;
                    var fyEbitdaGptyText = fyEbitdaGpty.toFixed(2) + '%';
                    // var fyNettProfitty = (Number(fyEbitdaty) + Number(totalDepre)) * Number(1 - Number(taxrate))

                    //budget depre
                    var budgDepreSearch = search.load({ id: "customsearch1218" });
                    if (subsId) budgDepreSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) budgDepreSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    var fyBudgDepre = 0
                    budgDepreSearch.run().each(function (result) {
                        fyBudgDepre = result.getValue({
                            name: budgDepreSearch.columns[monthInd + 5]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // log.debug('fyBudgDepre', fyBudgDepre)

                    //budget other exp 
                    var budgOtherExSearch = search.load({ id: "customsearch1220" });
                    if (subsId) budgOtherExSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) budgOtherExSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    var fyBudgOtherEx = 0
                    budgOtherExSearch.run().each(function (result) {
                        fyBudgOtherEx = result.getValue({
                            name: budgOtherExSearch.columns[monthInd + 5]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // log.debug('fyBudgOtherEx', fyBudgOtherEx)

                    //budget other income
                    var budgOtherInSearch = search.load({ id: "customsearch1221" });
                    if (subsId) budgOtherInSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) budgOtherInSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    var fyBudgOtherIn = 0
                    budgOtherInSearch.run().each(function (result) {
                        fyBudgOtherIn = result.getValue({
                            name: budgOtherInSearch.columns[monthInd + 5]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // log.debug('fyBudgOtherIn', fyBudgOtherIn)

                    //budget corporate
                    var budgCorpSearch = search.load({ id: "customsearch1219" });
                    if (subsId) budgCorpSearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    if (thisYearId) budgCorpSearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    var fyBudgCorp = 0
                    budgCorpSearch.run().each(function (result) {
                        fyBudgCorp = result.getValue({
                            name: budgCorpSearch.columns[monthInd + 5]
                        });

                        return true;  // Lanjutkan ke hasil berikutnya
                    });
                    // log.debug('fyBudgCorp', fyBudgCorp)



                    var fyNettProfitty = Number(fyEbitdaty) - Number(fyBudgDepre) - Number(fyBudgOtherEx) + Number(fyBudgOtherIn) - Number(fyBudgCorp)
                    // log.debug('fyNettProfitty', fyNettProfitty)

                    var fyNettProfitGpty = (fyNettProfitty !== 0 && fyRevty !== 0) ? (Number(fyNettProfitty) / Number(fyRevty)) * 100 : 0;
                    var fyNettProfitGptyText = fyNettProfitGpty.toFixed(2) + '%';


                    var prosFyBillty = (estimateBill !== 0 && fyBillty !== 0) ? (Number(estimateBill) / Number(fyBillty)) * 100 : 0;
                    prosFyBillty = convertText(prosFyBillty);
                    var prosFyCostBillty = (estimateCoss !== 0 && fyCostOfBillty !== 0) ? (Number(estimateCoss) / Number(fyCostOfBillty)) * 100 : 0;
                    prosFyCostBillty = convertText(prosFyCostBillty);
                    var prosFyRevty = (estimateRev !== 0 && fyRevty !== 0) ? (Number(estimateRev) / Number(fyRevty)) * 100 : 0;
                    prosFyRevty = convertText(prosFyRevty);
                    var prosFyOpexty = (estimateOpex !== 0 && fyOpexty !== 0) ? (Number(estimateOpex) / Number(fyOpexty)) * 100 : 0;
                    prosFyOpexty = convertText(prosFyOpexty);
                    var prosFyEbitdaty = (estimateEbitda !== 0 && fyEbitdaty !== 0) ? (Number(estimateEbitda) / Number(fyEbitdaty)) * 100 : 0;
                    prosFyEbitdaty = convertText(prosFyEbitdaty);
                    var prosFyNetProfitty = (netProfitEstimate !== 0 && fyNettProfitty !== 0) ? (Number(netProfitEstimate) / Number(fyNettProfitty)) * 100 : 0;
                    prosFyNetProfitty = convertText(prosFyNetProfitty);



                    //masuk FY last year
                    // load FY Bill last year
                    // var fyBilllySearch = search.load({ id: "customsearchbudgetdefaultview" });
                    var fyBilllySearch = search.load({ id: "customsearch_monthly_review" });
                    if (subsId) fyBilllySearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    // if (lastYearId) fyBilllySearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: lastYearId }));
                    fyBilllySearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyBilllySearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));
                    var fyBilllySearchReturn = fyBilllySearch.run().getRange({ start: 0, end: 1 });
                    var fyBillly = fyBilllySearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    // var fyCOstBilllySearch = search.load({ id: "customsearchbudgetdefaultview_2" });
                    var fyCOstBilllySearch = search.load({ id: "customsearch1182" });
                    if (subsId) fyCOstBilllySearch.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    // if (lastYearId) fyCOstBilllySearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: lastYearId }));
                    fyCOstBilllySearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyCOstBilllySearch.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));
                    var fyCOstBilllySearchReturn = fyCOstBilllySearch.run().getRange({ start: 0, end: 1 });
                    var fyCostOfBillly = fyCOstBilllySearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    var fyRevly = Number(fyBillly) - Number(fyCostOfBillly)
                    var fyGply = (fyRevly !== 0 && fyBillly !== 0) ? (Number(fyRevly) / Number(fyBillly)) * 100 : 0;
                    fyGply = convertText(fyGply);
                    // var fyOpexly = Number(opexly) * 12

                    var opexFysearchLY = search.load({ id: "customsearch_monthly_review_2_2" });
                    if (subsId) opexFysearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    // if (thisYearId) opexFysearch.filters.push(search.createFilter({ name: "year", operator: search.Operator.ANYOF, values: thisYearId }));
                    opexFysearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    opexFysearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));
                    var opexFysearchLYReturn = opexFysearchLY.run().getRange({ start: 0, end: 1 });
                    var fyOpexly = opexFysearchLYReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    var fyOpexGply = (fyOpexly !== 0 && fyRevly !== 0) ? (Number(fyOpexly) / Number(fyRevly)) * 100 : 0;
                    fyOpexGply = convertText(fyOpexGply);
                    var fyEbitdaly = Number(fyRevly) - Number(fyOpexly)
                    var fyEbitdaGply = (fyEbitdaly !== 0 && fyRevly !== 0) ? (Number(fyEbitdaly) / Number(fyRevly)) * 100 : 0;
                    fyEbitdaGply = convertText(fyEbitdaGply);


                    //fyaddsOverheadLY
                    var fyaddOverheadsSearchLY = search.load({ id: "customsearch1181" });
                    if (subsId) fyaddOverheadsSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyaddOverheadsSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyaddOverheadsSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));

                    var fyaddOverheadsLY = 0
                    fyaddOverheadsSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyaddOverheadsLY += Number(amount)
                        return true;
                    });
                    fyaddOverheadsLY = fyaddOverheadsLY.toFixed(2)
                    //

                    //fyDepreLY
                    var totalDepreSearchLY = search.load({ id: "customsearch_monthly_review_2_2_4" });
                    if (subsId) totalDepreSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));
                    totalDepreSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    totalDepreSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));
                    var totalDepreSearchLYReturn = totalDepreSearchLY.run().getRange({ start: 0, end: 1 });
                    var totalDepreLY = totalDepreSearchLYReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    //

                    var fytotalOverheadsLY = Number(fyOpexly) + Number(totalDepreLY) + Number(fyaddOverheadsLY)
                    log.debug('fytotalOverheadsLY', fytotalOverheadsLY)

                    var fyOpProfitLY = Number(fyRevly) - fytotalOverheadsLY
                    log.debug('fyOpProfitLY', fyOpProfitLY)


                    //fyOtherIncomeLY & fyOtherIncomeDepoLY
                    var fyotherIncomeSearchLY = search.load({ id: "customsearch1177" });
                    if (subsId) fyotherIncomeSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherIncomeSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyotherIncomeSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));

                    var fyOtherIncomeLY = 0
                    fyotherIncomeSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherIncomeLY += Number(amount)
                        return true;
                    });
                    fyOtherIncomeLY = fyOtherIncomeLY.toFixed(2)


                    var fyotherIncomeSearchDepositLY = search.load({ id: "customsearch1183" });
                    if (subsId) fyotherIncomeSearchDepositLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherIncomeSearchDepositLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyotherIncomeSearchDepositLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));

                    var fyOtherIncomeDepoLY = 0
                    fyotherIncomeSearchDepositLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherIncomeDepoLY += Number(amount)
                        return true;
                    });
                    fyOtherIncomeDepoLY = fyOtherIncomeDepoLY.toFixed(2)


                    var fyOILY = Number(fyOtherIncomeLY) + Number(fyOtherIncomeDepoLY)
                    // log.debug('fyOILY', fyOILY)
                    //

                    //fyOtherExpJournalLY & fyOtherExpCreditNCheckLY
                    var fyotherExpJournalSearchLY = search.load({ id: "customsearch1178" });
                    if (subsId) fyotherExpJournalSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherExpJournalSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyotherExpJournalSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));

                    var fyOtherExpJournalLY = 0
                    fyotherExpJournalSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherExpJournalLY += Number(amount)
                        return true;
                    });
                    fyOtherExpJournalLY = fyOtherExpJournalLY.toFixed(2)

                    var fyotherExpCreditNCheckSearchLY = search.load({ id: "customsearch1180" });
                    if (subsId) fyotherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "subsidiary", operator: search.Operator.IS, values: subsId }));

                    fyotherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORAFTER, values: '01/01/' + periodNamely.split(" ")[1] }));
                    fyotherExpCreditNCheckSearchLY.filters.push(search.createFilter({ name: "trandate", operator: search.Operator.ONORBEFORE, values: '31/12/' + periodNamely.split(" ")[1] }));

                    var fyOtherExpCreditNCheckLY = 0
                    fyotherExpCreditNCheckSearchLY.run().each(function (result) {
                        var amount = result.getValue({
                            name: 'amount'
                        })
                        fyOtherExpCreditNCheckLY += Number(amount)
                        return true;
                    });
                    fyOtherExpCreditNCheckLY = fyOtherExpCreditNCheckLY.toFixed(2)


                    var fyotherExpLY = -1 * (Number(fyOtherExpJournalLY) + Number(fyOtherExpCreditNCheckLY))
                    // log.debug('fyotherExpTY', fyotherExpLY)
                    //
                    // var fyNettProfitly = (Number(fyEbitdaly) + Number(totalDepre)) * Number(1 - Number(taxrate))
                    var fyNettProfitly = Number(fyOpProfitLY) + Number(fyOtherIncomeLY) + Number(fyOtherIncomeDepoLY) + Number(fyotherExpLY)

                    var fyNettProfitGply = (fyNettProfitly !== 0 && fyRevly !== 0) ? (Number(fyNettProfitly) / Number(fyRevly)) * 100 : 0;
                    fyNettProfitGply = convertText(fyNettProfitGply);

                    var prosFyBillly = (estimateBill !== 0 && fyBillly !== 0) ? (Number(estimateBill) / Number(fyBillly)) * 100 : 0;
                    prosFyBillly = convertText(prosFyBillly);
                    var prosFyCostBillly = (estimateCoss !== 0 && fyCostOfBillly !== 0) ? (Number(estimateCoss) / Number(fyCostOfBillly)) * 100 : 0;
                    prosFyCostBillly = convertText(prosFyCostBillly);


                    var prosFyRevly = (estimateRev !== 0 && fyRevly !== 0) ? (Number(estimateRev) / Number(fyRevly)) * 100 : 0;
                    prosFyRevly = convertText(prosFyRevly);
                    var prosFyOpexly = (estimateOpex !== 0 && fyOpexly !== 0) ? (Number(estimateOpex) / Number(fyOpexly)) * 100 : 0;
                    prosFyOpexly = convertText(prosFyOpexly);
                    var prosFyEbitdaly = (estimateEbitda !== 0 && fyEbitdaly !== 0) ? (Number(estimateEbitda) / Number(fyEbitdaly)) * 100 : 0;
                    prosFyEbitdaly = convertText(prosFyEbitdaly);
                    var prosFyNetProfitly = (fyNettProfitly !== 0 && fyRevly !== 0) ? (Number(netProfitEstimate) / Number(fyNettProfitly)) * 100 : 0;
                    prosFyNetProfitly = convertText(prosFyNetProfitly);

                    if (fyBillly) {
                        fyBillly = convertCurr(fyBillly)
                    }
                    if (fyCostOfBillly) {
                        fyCostOfBillly = convertCurr(fyCostOfBillly)
                    }
                    if (fyRevly) {
                        fyRevly = convertCurr(fyRevly)
                    }
                    if (fyOpexly) {
                        fyOpexly = convertCurr(fyOpexly)
                    }
                    if (fyEbitdaly) {
                        fyEbitdaly = convertCurr(fyEbitdaly)
                    }
                    if (fyNettProfitly) {
                        fyNettProfitly = convertCurr(fyNettProfitly)
                    }
                    if (fyBillty) {
                        fyBillty = convertCurr(fyBillty);
                    }
                    if (fyCostOfBillty) {
                        fyCostOfBillty = convertCurr(fyCostOfBillty);
                    }
                    if (fyRevty) {
                        fyRevty = convertCurr(fyRevty);
                    }
                    if (fyOpexty) {
                        fyOpexty = convertCurr(fyOpexty)
                    }
                    if (fyEbitdaty) {
                        fyEbitdaty = convertCurr(fyEbitdaty)
                    }
                    if (fyNettProfitty) {
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
                    // var currentRecord = createSublist("custpage_sublist_item", form, periodNamety, periodNamely, thisYear, lastYear);
                    var currentRecord = createSublist("custpage_sublist_item", form, periodNamety, periodComparationName, thisYear, lastYear, months);
                    const sublistData = [
                        {
                            summary: "Billing",
                            act_py: billingly || 0,
                            act_ty: billingty || 0,
                            yoy: yoyBillingText || 0,
                            est_fy: estimateBill || 0,
                            fy_target: fyBillty,
                            fy_target_p: prosFyBillty,
                            fy_py: fyBillly,
                            fy_py_p: prosFyBillly
                        },
                        {
                            summary: "Cost of Billing",
                            act_py: costOfBillingly || 0,
                            act_ty: costOfBillingty || 0,
                            yoy: yoyCostBilling,
                            est_fy: estimateCoss || 0,
                            fy_target: fyCostOfBillty,
                            fy_target_p: prosFyCostBillty,
                            fy_py: fyCostOfBillly,
                            fy_py_p: prosFyCostBillly
                        },
                        {
                            summary: "Gross Profit- Revenue",
                            act_py: grossProvitRevly || 0,
                            act_ty: grossProvitRevty || 0,
                            yoy: yoygrossProvitRevText,
                            est_fy: estimateRev,
                            fy_target: fyRevty,
                            fy_target_p: prosFyRevty,
                            fy_py: fyRevly,
                            fy_py_p: prosFyRevly
                        },
                        {
                            summary: "Gp to Billing",
                            act_py: gpToBillinglytext || 0,
                            act_ty: gpToBillingtytext || 0,
                            yoy: '-',
                            est_fy: estimateGpText,
                            fy_target: fyGptyText,
                            fy_target_p: '-',
                            fy_py: fyGply,
                            fy_py_p: '-'
                        },
                        {
                            summary: "Opex",
                            act_py: opexly || 0,
                            act_ty: opexty || 0,
                            yoy: yoyOpexText,
                            est_fy: estimateOpex,
                            fy_target: fyOpexty,
                            fy_target_p: prosFyOpexty,
                            fy_py: fyOpexly,
                            fy_py_p: prosFyOpexly
                        },
                        {
                            summary: "Head Count",
                            act_py: '-',
                            act_ty: '-',
                            yoy: '-',
                            est_fy: '-',
                            fy_target: '-',
                            fy_target_p: '-',
                            fy_py: '-',
                            fy_py_p: '-'
                        },
                        {
                            summary: "Opex to Gross Profit",
                            act_py: opexGrossProfitlyText || 0,
                            act_ty: opexGrossProfittyText || 0,
                            yoy: '-',
                            est_fy: estimateOpextoGrossProfitText,
                            fy_target: fyOpexfGptyText,
                            fy_target_p: '-',
                            fy_py: fyOpexGply,
                            fy_py_p: '-'
                        },
                        {
                            summary: "Ebitda",
                            act_py: ebitdaly || 0,
                            act_ty: ebitdaty || 0,
                            yoy: yoyEbitdaText,
                            est_fy: estimateEbitda,
                            fy_target: fyEbitdaty,
                            fy_target_p: prosFyEbitdaty,
                            fy_py: fyEbitdaly,
                            fy_py_p: prosFyEbitdaly
                        },
                        {
                            summary: "Ebitda to Gross Profit",
                            act_py: ebitdaGplyText || 0,
                            act_ty: ebitdaGptyText || 0,
                            yoy: '-',
                            est_fy: estimateEbitdaGpText,
                            fy_target: fyEbitdaGptyText,
                            fy_target_p: '-',
                            fy_py: fyEbitdaGply,
                            fy_py_p: '-'
                        },
                        {
                            summary: "Net Profit",
                            act_py: nettProfitly || 0,
                            act_ty: nettProfitty || 0,
                            yoy: netProvityoyText,
                            est_fy: netProfitEstimate,
                            fy_target: fyNettProfitty,
                            fy_target_p: prosFyNetProfitty,
                            fy_py: fyNettProfitly,
                            fy_py_p: prosFyNetProfitly
                        },
                        {
                            summary: "Net Profit to Gross Profit",
                            act_py: netProfittoGplyText || 0,
                            act_ty: netProfittoGptyText || 0,
                            yoy: '-',
                            est_fy: netProfittoGpEstimateText,
                            fy_target: fyNettProfitGptyText,
                            fy_target_p: '-',
                            fy_py: fyNettProfitGply,
                            fy_py_p: '-'
                        },
                    ];

                    sublistData.forEach((data, index) => {
                        var fontWeight = ['bold', 'bold', 'bold', 'normal', 'normal', 'normal', 'normal', 'bold', 'normal', 'bold', 'normal']
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_summary",
                            // value: data.summary,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.summary}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_act_py",
                            // value: data.act_py,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.act_py}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_act_ty",
                            // value: data.act_ty,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.act_ty}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_yoy",
                            // value: data.yoy,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.yoy}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_est_fy",
                            // value: data.est_fy,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.est_fy}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fy_target",
                            // value: data.fy_target,
                            value: `<div style=" padding:7px; font-weight:${fontWeight[index]}">${data.fy_target}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fy_target_p",
                            // value: data.fy_target_p,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.fy_target_p}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fy_py",
                            // value: data.fy_py,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.fy_py}</div>`,
                            line: index
                        });
                        currentRecord.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_fy_py_p",
                            // value: data.fy_py_p,
                            value: `<div style="padding:7px; font-weight:${fontWeight[index]}">${data.fy_py_p}</div>`,
                            line: index
                        });
                    });

                    var listadd1 = form.addFieldGroup({
                        id: "wip",
                        label: "WIP onhand from reconcile file",
                    });
                    var grossProfitTotal = Number(totalBilling) + Number(totalCostOfBilling)
                    if (totalBilling) {
                        totalBilling = convertCurr(totalBilling)
                    }
                    if (totalCostOfBilling) {
                        totalCostOfBilling = convertCurr(totalCostOfBilling)
                    }
                    if (grossProfitTotal) {
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

                    if (deprely) {
                        deprely = convertCurr(deprely)
                    }
                    if (deprety) {
                        deprety = convertCurr(deprety)
                    }
                    if (totalDepre) {
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

                    var totalan = [];
                    var nameAct = [];
                    nameAct.push({
                        periodNamely: periodNamely,
                        periodNamety: periodNamety,
                        thisYear: thisYear,
                        lastYear: lastYear
                    })
                    totalan.push({
                        totalBilling: totalBilling,
                        totalCostOfBilling: totalCostOfBilling,
                        grossProfitTotal: grossProfitTotal,
                        deprely: deprely,
                        deprety: deprety,
                        totalDepre: totalDepre,
                        tax: tax
                    })
                    form.addButton({
                        id: 'custpage_button_po',
                        label: "Export Excel",
                        functionName: "download('" + JSON.stringify(sublistData) + "', '" + JSON.stringify(totalan) + "', '" + JSON.stringify(nameAct) + "')"
                    });
                    form.clientScriptModulePath = "SuiteScripts/abj_cs_download_monthly_review.js";

                    context.response.writePage(form);

                }
            } catch (e) {
                log.debug('error', e)
            }
        }
        function createSublist(sublistname, form, periodNamety, periodComparationName, thisYear, lastYear, months) {
            var sublist_in = form.addSublist({
                id: sublistname,
                type: serverWidget.SublistType.LIST,
                label: "Monthly Review",
            });
            sublist_in.addField({
                id: "custpage_sublist_summary",
                label: "Summary",
                // label: '<span style="color: white; background-color: black;">Summary</span>',
                type: serverWidget.FieldType.TEXT,
            });
            var periodMonth = periodNamety.split(" ")[0]
            var periodMonthComparation = periodComparationName.split(" ")[0]

            if (months.includes(periodMonthComparation)) {
                sublist_in.addField({
                    id: "custpage_sublist_act_py",
                    label: "Actual YTD " + periodComparationName,
                    type: serverWidget.FieldType.TEXT,
                });
            } else {
                sublist_in.addField({
                    id: "custpage_sublist_act_py",
                    label: "Actual " + periodComparationName,
                    type: serverWidget.FieldType.TEXT,
                });
            }

            if (months.includes(periodMonth)) {
                sublist_in.addField({
                    id: "custpage_sublist_act_ty",
                    label: "Actual YTD " + periodNamety,
                    type: serverWidget.FieldType.TEXT,
                });
            } else {
                sublist_in.addField({
                    id: "custpage_sublist_act_ty",
                    label: "Actual " + periodNamety,
                    type: serverWidget.FieldType.TEXT,
                });
            }
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
        function createItem(sublistname, form, listadd1) {
            var sublist_item = form.addSublist({
                id: sublistname,
                type: serverWidget.SublistType.LIST,
                label: "WIP onhand from reconcile file",
                container: listadd1
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
        function createDepre(sublistname, form, periodNamety, periodNamely) {
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
        return {
            onRequest: onRequest
        }
    });