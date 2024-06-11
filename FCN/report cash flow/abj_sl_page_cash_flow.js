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
                title: "Cash Flow Operation Projection",
            });
            var filterOption = form.addFieldGroup({
                id: "filteroption",
                label: "FILTERS",
            });
            
            
            var periodFromFilter = form.addField({
                id: "custpage_period_from_option",
                label: "From",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodFromFilter.isMandatory = true
            var periodToFilter = form.addField({
                id: "custpage_period_to_option",
                label: "To",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "accountingperiod",
            });
            periodToFilter.isMandatory = true
            
            var subsFilter = form.addField({
                id: "custpage_subs_option",
                label: "Subsidiary",
                type: serverWidget.FieldType.SELECT,
                container: "filteroption",
                source: "subsidiary",
            });
            subsFilter.isMandatory = true

            form.addSubmitButton({
                label: "Search",
            });
            if(context.request.method === 'GET'){
                context.response.writePage(form);
            }else{
                var periodFrom = context.request.parameters.custpage_period_from_option;
                var periodTo = context.request.parameters.custpage_period_to_option;
                var subsId = context.request.parameters.custpage_subs_option;

                var currentDate = new Date();

                var lastDateThisYear = new Date(currentDate.getFullYear(), 11, 31);
                var lastYear = '01/01/2015'
                var currentYear = (lastDateThisYear.getDate() < 10 ? '0' : '') + lastDateThisYear.getDate() + '/' + ((lastDateThisYear.getMonth() + 1) < 10 ? '0' : '') + (lastDateThisYear.getMonth() + 1) + '/' + lastDateThisYear.getFullYear();
                function convertCurr(data){
                    data = format.format({
                        value: data,
                        type: format.Type.CURRENCY
                    });

                    return data
                }
                function groupByPeriod(allLoan) {
                    const groupedLoans = {};
                    allLoan.forEach(loanList => {
                        loanList.forEach(loan => {
                            const period = loan.periodToset;
                            if (!groupedLoans[period]) {
                                groupedLoans[period] = [];
                            }
                            groupedLoans[period].push(loan);
                        });
                    });
                    return groupedLoans;
                }
                function getMonthsCountAndNames(startDate, endDate) {
                    var startMonth = startDate.getMonth();
                    var endMonth = endDate.getMonth();
                    var startYear = startDate.getFullYear();
                    var endYear = endDate.getFullYear();
                    
                    var monthCount = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
                    var allPeriod = [];
                
                    for (var i = startYear; i <= endYear; i++) {
                        var start = (i === startYear) ? startMonth : 0;
                        var end = (i === endYear) ? endMonth : 11;
                
                        for (var j = start; j <= end; j++) {
                            var monthName = getMonthName(j) + " " + i;
                            allPeriod.push(monthName);
                        }
                    }
                
                    return { count: monthCount, periods: allPeriod };
                }
                
                function getMonthName(monthIndex) {
                    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return monthNames[monthIndex];
                }

                var accountingperiodFromSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodFrom]
                    ],
                    columns: [
                        search.createColumn({ name: "periodname", sort: search.Sort.DESC })
                    ]
                });
                var periodFromName
                accountingperiodFromSearchObj.run().each(function(result) {
                    periodFromName = result.getValue({ name: 'periodname' });

                    return false;
                });

                var accountingperiodToSearchObj = search.create({
                    type: "accountingperiod",
                    filters: [
                        ["internalid", "anyof", periodTo]
                    ],
                    columns: [
                        search.createColumn({ name: "periodname", sort: search.Sort.DESC })
                    ]
                });
                var periodToName
                accountingperiodToSearchObj.run().each(function(result) {
                    periodToName = result.getValue({ name: 'periodname' });

                    return false;
                });
                
                var startPeriod = new Date(periodFromName);
                var endPeriod = new Date(periodToName);

                var result = getMonthsCountAndNames(startPeriod, endPeriod);
                var dataAll = []
                var jumlahPer = result.count;
                var allPeriod = result.periods;
                var allPeriodForLoan = allPeriod
                var dataToSet = []
                var allBeginningBalance = []
                var allOutstanding = []
                var alloutstandingPayable = []
                var alloprasionalExp = []
                var allIdPeriod = []
                var allEndingBalance = []

                var prevEndingBalance = 0
                allPeriod.forEach(function(periodName, index) {
                    function getPreviousMonth(month) {
                        const months = [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                        ];
                        const index = months.indexOf(month);
                        if (index === 0) {
                            return 'Dec';
                        } else {
                            return months[index - 1];
                        }
                    }
                    
                    function getPeriodBeforeName(periodName) {
                        const parts = periodName.split(' ');
                        let month = parts[0];
                        let year = parseInt(parts[1]);
                    
                        if (month === 'Jan') {
                            month = 'Dec';
                            year--;
                        } else {
                            month = getPreviousMonth(month);
                        }
                    
                        return `${month} ${year}`;
                    }

                    const periodBeforeName = getPeriodBeforeName(periodName);
                    log.debug('periodBeforeName', periodBeforeName)

                    function getPeriodIdByName(periodName) {
                        var periodSearch = search.create({
                            type: "accountingperiod",
                            filters: [
                                ["periodname", "is", periodName]
                            ],
                            columns: ["internalid"]
                        });
                    
                        var periodId;
                        periodSearch.run().each(function(result) {
                            periodId = result.getValue({ name: 'internalid' });
                            return false;
                        });
                        return periodId;
                    }
                    
                    var idPeriod = getPeriodIdByName(periodName);
                    var idPeriodBef = getPeriodIdByName(periodBeforeName);
                    
                    var beginningBalance;
                    
                    var beginningBalanceSearch =  search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["posting","is","T"], 
                            "AND", 
                            ["account","anyof","723","224","725","724","240","237","225","241","231","232","226","1883","722","234","227","228","726","229","230","1835","1076","1823","256","257","741","243","258","244","259","260","261","287","1875","288","1877","247","251","245","729","265","1813","727","740","747","252","246","263","738","730","733","743","739","745","746","742","732","249","285","253","1870","264","267","1880","1797","250","254","1817","731","744","1800","1847","728","1845","269","2541","1874","272","273","295","1488","1487","278","275","736","734","735","737","281","274","2308","1828","1830","1831","1832","1833","1843","1844","1850","1851","1852","1853","1854","1855","1862","1882","1892","1893","1890","1891","1829","1990","1995","2001","2005","1991","1996","2002","2006","1992","1997","2003","2007","1993","1998","2008","1994","1999","2009","2010","2540","318","319","320","1889","322","323","324","325","326","327","328","329","330","331","937","938","939","940","1717","1479","1480","1482","1483","1481","1484","1500","1501","1502","1503","1504","2090","2302","2091","2092","527","528","529","530","531","532","533","534","535","536","1478","538","539","540","541","542","543","544","545","546","547","548","550","551","552","553","554","555","556","557","558","559","560","1703","1802","2304","2309","835","836","837","838","839","840","841","842","843","844","845","846","847","848","849","850","1489","594","595","596","597","598","599","600","601","602","1836","561","562","563","564","1856","565","1810","1811","566","567","568","569","570","571","572","573","574","575","576","577","578","579","580","581","978","1533","1534","1535","1536","1719","2093","2094","1276","1376","1377","1378","1379","1380","1381","1382","1383","1822","1384","1385","1386","1857","1387","1388","1389","1390","1391","1392","1393","1394","1801","1395","1396","1806","1809","1398","1805","1808","1399","1804","1807","1397","1812","1821","1825","1864","1866","1859","1537","1538","1539","1540","1541","1542","1543","1544","1545","1546","1547","1548","1549","1815","1816","1600","1824","2293","2294","2318","2319","583","766","767","768","769","770","771","772","1826","774","775","776","1772","1773","777","778","584","585","586","587","588","589","590","591","592","593","1834","385"], 
                            "AND", 
                            ["subsidiary","anyof",subsId], 
                            "AND", 
                            ["postingperiod","abs",idPeriodBef], 
                            "AND", 
                            ["trandate","after",lastYear], 
                            "AND", 
                            ["trandate","before",currentYear]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Amount"
                            })
                        ]
                    });
                
                    var beginningBalanceSearchReturn = beginningBalanceSearch.run().getRange({ start: 0, end: 1 });
                    beginningBalance = beginningBalanceSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                   
                    var beginningBalancetoCOunt = beginningBalance;
                    if (beginningBalance) {
                        beginningBalance = convertCurr(beginningBalance);
                    }
                    var periodToset = periodName.toLowerCase().replace(/\s/g, '_');
                    allIdPeriod.push({ idPeriod: idPeriod, periodToset: periodToset });
                    dataToSet.push(periodToset);
                    allBeginningBalance.push({ beginningBalance: beginningBalance, periodToset: periodToset });

                    var endingBalanceSearch = search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["posting","is","T"], 
                            "AND", 
                            ["account","anyof","723","224","725","724","240","237","225","241","231","232","226","1883","722","234","227","228","726","229","230","1835","1076","1823","256","257","741","243","258","244","259","260","261","287","1875","288","1877","247","251","245","729","265","1813","727","740","747","252","246","263","738","730","733","743","739","745","746","742","732","249","285","253","1870","264","267","1880","1797","250","254","1817","731","744","1800","1847","728","1845","269","2541","1874","272","273","295","1488","1487","278","275","736","734","735","737","281","274","2308","1828","1830","1831","1832","1833","1843","1844","1850","1851","1852","1853","1854","1855","1862","1882","1892","1893","1890","1891","1829","1990","1995","2001","2005","1991","1996","2002","2006","1992","1997","2003","2007","1993","1998","2008","1994","1999","2009","2010","2540","318","319","320","1889","322","323","324","325","326","327","328","329","330","331","937","938","939","940","1717","1479","1480","1482","1483","1481","1484","1500","1501","1502","1503","1504","2090","2302","2091","2092","527","528","529","530","531","532","533","534","535","536","1478","538","539","540","541","542","543","544","545","546","547","548","550","551","552","553","554","555","556","557","558","559","560","1703","1802","2304","2309","835","836","837","838","839","840","841","842","843","844","845","846","847","848","849","850","1489","594","595","596","597","598","599","600","601","602","1836","561","562","563","564","1856","565","1810","1811","566","567","568","569","570","571","572","573","574","575","576","577","578","579","580","581","978","1533","1534","1535","1536","1719","2093","2094","1276","1376","1377","1378","1379","1380","1381","1382","1383","1822","1384","1385","1386","1857","1387","1388","1389","1390","1391","1392","1393","1394","1801","1395","1396","1806","1809","1398","1805","1808","1399","1804","1807","1397","1812","1821","1825","1864","1866","1859","1537","1538","1539","1540","1541","1542","1543","1544","1545","1546","1547","1548","1549","1815","1816","1600","1824","2293","2294","2318","2319","583","766","767","768","769","770","771","772","1826","774","775","776","1772","1773","777","778","584","585","586","587","588","589","590","591","592","593","1834","385"], 
                            "AND", 
                            ["subsidiary","anyof",subsId], 
                            "AND", 
                            ["postingperiod","abs",idPeriod], 
                            "AND", 
                            ["trandate","after",lastYear], 
                            "AND", 
                            ["trandate","before",currentYear]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Amount"
                            })
                        ]
                    });
                
                    var endingBalanceSearchReturn = endingBalanceSearch.run().getRange({ start: 0, end: 1 });
                    var endingBalance = endingBalanceSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;

                    if (endingBalance) {
                        endingBalance = convertCurr(endingBalance);
                    }
                    allEndingBalance.push({endingBalance : endingBalance, periodToset : periodToset})
                   

                    var outstandingSearch = search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["posting","is","T"], 
                            "AND", 
                            ["account","anyof","318","319","320","1889","322","323","324","325","326","327","328","330","329","2302","2092","2091","2090","1504","1503","1502","1501","1500","1484","1481","1483","1482","1480","1479","1717","940","939","938","937","331"], 
                            "AND", 
                            ["subsidiary","anyof",subsId], 
                            "AND", 
                            ["postingperiod","abs",idPeriod], 
                            "AND", 
                            ["trandate","after",lastYear], 
                            "AND", 
                            ["trandate","before",currentYear]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Amount"
                            })
                        ]
                    });
                    var outstandingSearchReturn = outstandingSearch.run().getRange({ start: 0, end: 1 });
                    var outstanding = outstandingSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var outstandingToCount = outstanding;
                    if (outstanding) {
                        outstanding = convertCurr(outstanding);
                    }
                    allOutstanding.push({ outstanding: outstanding, periodToset: periodToset });
                
                    var outstandingPayableSearch = search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["posting","is","T"], 
                            "AND", 
                            ["account","anyof","333","334","954","955","968","969","970","1477","1701","1762","1771","1770","1769","1768","1767","1766","1765","1764","1763"], 
                            "AND", 
                            ["subsidiary","anyof",subsId], 
                            "AND", 
                            ["postingperiod","abs",idPeriod], 
                            "AND", 
                            ["trandate","after",lastYear], 
                            "AND", 
                            ["trandate","before",currentYear]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Amount"
                            })
                        ]
                    });
                    var outstandingPayableSearchReturn = outstandingPayableSearch.run().getRange({ start: 0, end: 1 });
                    var outstandingPayable = outstandingPayableSearchReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var outstandingPayableToCount = outstandingPayable;
                    if (outstandingPayable) {
                        outstandingPayable = convertCurr(outstandingPayable);
                    }
                    alloutstandingPayable.push({ outstandingPayable: outstandingPayable, periodToset: periodToset });
                
                    var oprasionalExpense = search.create({
                        type: "transaction",
                        settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
                        filters:
                        [
                            ["posting","is","T"], 
                            "AND", 
                            ["account","anyof","417","980","418","419","420","421","2290","423","424","425","426","979","428","429","430","432","433","434","435","2291","437","438","1796","439","440","441","442","443","444","445","447","446","448","981","1803","1846","1839","449","450","982","1780","1838","453","455","456","457","458","459","460","461","462","463","464","465","466","467","468","469","470","471","472","986","1798","1849","1860","474","475","476","477","478","2317","480","482","483","484","485","486","487","488","489","490","491","985"], 
                            "AND", 
                            ["subsidiary","anyof",subsId], 
                            "AND", 
                            ["postingperiod","abs",idPeriod], 
                            "AND", 
                            ["trandate","after",lastYear], 
                            "AND", 
                            ["trandate","before",currentYear]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "amount",
                                summary: "SUM",
                                label: "Amount"
                            })
                        ]
                    });
                    var oprasionalExpenseReturn = oprasionalExpense.run().getRange({ start: 0, end: 1 });
                    var oprasionalExp = oprasionalExpenseReturn[0].getValue({
                        name: "amount",
                        summary: "SUM",
                    }) || 0;
                    var oprasionalExpToCount = oprasionalExp;
                    if (oprasionalExp) {
                        oprasionalExp = convertCurr(oprasionalExp);
                    }
                    alloprasionalExp.push({ oprasionalExp: oprasionalExp, periodToset: periodToset });
                
            
                    // var endingBalance = Number(beginningBalancetoCOunt) + Number(outstandingToCount) + Number(outstandingPayableToCount) + Number(oprasionalExpToCount)
                    // allEndingBalance.push({endingBalance : endingBalance, periodToset : periodToset})
                    // prevEndingBalance = endingBalance
                });
                var setList = createList("custpage_sublist_item", form, dataToSet)
                // set beginning
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Beginning balance cash and bank ',
                    line: 0
                });
                allBeginningBalance.forEach(function(data) {
                    var beginningBalance = data.beginningBalance;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: beginningBalance,
                        line: 0
                    });
                
                });

                 // set outstanding receivable
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total outstanding Account Receivable',
                    line: 1
                });
                allOutstanding.forEach(function(data) {
                    var outstanding = data.outstanding;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: outstanding,
                        line: 1
                    });
                
                });
                // set outstanding payable
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total outstanding Account Payable',
                    line: 2
                });
                alloutstandingPayable.forEach(function(data) {
                    var outstandingPayable = data.outstandingPayable;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: outstandingPayable,
                        line: 2
                    });
                
                });

                 // set oprasional expense
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Total operational expenses per month',
                    line: 3
                });
                alloprasionalExp.forEach(function(data) {
                    var oprasionalExp = data.oprasionalExp;
                    var periodToset = data.periodToset;
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: oprasionalExp,
                        line: 3
                    });
                
                });
                var lineIndex = 4
                var allLoan = [];
                var maxLoanCount = 0;
                allIdPeriod.forEach(function (data) {
                    var idPeriod = data.idPeriod;
                    log.debug('idPeriod', idPeriod)
                    log.debug('subsId', subsId)
                    var customrecord641SearchObj = search.create({
                        type: "customrecord641",
                        filters: [["custrecord_mitcf_period", "anyof", idPeriod],"AND", 
                        ["custrecord_mitcf_subsidiary","anyof",subsId]],
                        columns: [
                            search.createColumn({ name: "custrecord_dmitcf_amount", join: "CUSTRECORD_DMITCF_ID", label: "Amount" })
                        ]
                    });

                    var searchResultCount = customrecord641SearchObj.runPaged().count;
                    log.debug('searchResultCount', searchResultCount)
                    if (searchResultCount > maxLoanCount) {
                        maxLoanCount = searchResultCount;
                    }
                });
                log.debug('maxLoanCount', maxLoanCount)
                allIdPeriod.forEach(function (data) {
                    var idPeriod = data.idPeriod;
                    var periodToset = data.periodToset;
                    var dataLoan = [];

                    var customrecord641SearchObj = search.create({
                        type: "customrecord641",
                        filters: [["custrecord_mitcf_period", "anyof", idPeriod]],
                        columns: [
                            search.createColumn({ name: "custrecord_dmitcf_amount", join: "CUSTRECORD_DMITCF_ID", label: "Amount" })
                        ]
                    });

                    customrecord641SearchObj.run().each(function (result) {
                        var loanAmount = result.getValue({
                            name: "custrecord_dmitcf_amount",
                            join: "CUSTRECORD_DMITCF_ID",
                        }) || 0;
                        dataLoan.push({ loanAmount: loanAmount, periodToset: periodToset });
                        return true;
                    });
                    while (dataLoan.length < maxLoanCount) {
                        dataLoan.push({ loanAmount: 0, periodToset: periodToset });
                    }
                    allLoan.push(dataLoan);
                });
                var groupedData = [];
                log.debug('allLoan', allLoan)
                log.debug('allLoan[0].length;', allLoan[0].length)
                for (var i = 0; i < allLoan[0].length; i++) {
                    var group = [];
                    
                    allLoan.forEach(function(loan) {
                        var data = loan[i] || 0;
                        group.push(data);
                    });
                    log.debug('group', group)
                    groupedData.push(group);
                }
                log.debug('groupedData', groupedData)
                groupedData.forEach(function(group) {
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_sum",
                        value: 'Loan',
                        line: lineIndex
                    });
                    group.forEach(function(data) {
                        var loanAmount = data.loanAmount;
                        var periodToset = data.periodToset;
                        if(loanAmount){
                            loanAmount = convertCurr(loanAmount)
                        }
                        setList.setSublistValue({
                            sublistId: "custpage_sublist_item",
                            id: "custpage_sublist_"+periodToset,
                            value: loanAmount || 0,
                            line: lineIndex
                        });
                    });
                    lineIndex++
                });
                let totalLoanByPeriod = {};
                allLoan.forEach(loanArr => {
                    loanArr.forEach(loan => {
                        const periodToset = loan.periodToset;
                        const loanAmount = parseFloat(loan.loanAmount);
                        if (totalLoanByPeriod[periodToset]) {
                            totalLoanByPeriod[periodToset] += loanAmount;
                        } else {
                            totalLoanByPeriod[periodToset] = loanAmount;
                        }
                    });
                });
                // allEndingBalance.forEach(balance => {
                //     const periodToset = balance.periodToset;
                //     if (totalLoanByPeriod[periodToset]) {
                //         balance.endingBalance += totalLoanByPeriod[periodToset];
                //     }
                // });
                
                setList.setSublistValue({
                    sublistId: "custpage_sublist_item",
                    id: "custpage_sublist_sum",
                    value: 'Ending Balance',
                    line: lineIndex
                });
                allEndingBalance.forEach(function(data) {
                    var endingBalance = data.endingBalance;
                    var periodToset = data.periodToset;
                    if(endingBalance){
                        endingBalance = convertCurr(endingBalance)
                    }
                    setList.setSublistValue({
                        sublistId: "custpage_sublist_item",
                        id: "custpage_sublist_"+periodToset,
                        value: endingBalance,
                        line: lineIndex
                    });
                
                });
                dataAll.push({
                    allBeginningBalance : allBeginningBalance,
                    allOutstanding : allOutstanding,
                    alloutstandingPayable : alloutstandingPayable,
                    alloprasionalExp : alloprasionalExp,
                    allLoan : groupedData,
                    allEndingBalance : allEndingBalance
                })
                var idSub = subsId
                form.addButton({
                    id: 'custpage_button_po',
                    label: "Download",
                    functionName: "downloadCachFlow(" + JSON.stringify(dataAll) + ", '" + idSub + "')"
                });
                form.clientScriptModulePath = "SuiteScripts/abj_cs_download_cash_flow.js";
                context.response.writePage(form);
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    function createList(sublistname, form, dataToSet){
        var sublist_item = form.addSublist({
            id: sublistname,
            type: serverWidget.SublistType.LIST,
            label: "Cash Flow Operation Projection",
        });
        sublist_item.addField({
            id: "custpage_sublist_sum",
            label: "Summary",
            type: serverWidget.FieldType.TEXT,
        });
        dataToSet.forEach(function(dataItem, index){
            sublist_item.addField({
                id: "custpage_sublist_"+dataItem,
                label: dataItem,
                type: serverWidget.FieldType.TEXT,
            });
        });
        
        return sublist_item
    }
    return{
        onRequest : onRequest
    }
});