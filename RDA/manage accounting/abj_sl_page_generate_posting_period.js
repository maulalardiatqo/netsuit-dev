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

                            // kumpulan fungsi
                            function cekYearAP(year) {
                                var accountingperiodSearchObj = search.create({
                                    type: "accountingperiod",
                                    filters: [
                                        ["periodname", "is", year]
                                    ],
                                    columns: [
                                        search.createColumn({name: "periodname", label: "Name"}),
                                        search.createColumn({name: "internalid", label: "Internal ID"}),
                                        search.createColumn({name: "fiscalcalendar", label: "fiscalcalendar"})
                                    ]
                                });
                                var searchResults = accountingperiodSearchObj.run().getRange({ start: 0, end: 1 });
                
                                if (searchResults.length > 0) {
                                    var periodName = searchResults[0].getValue({ name: 'periodname' });
                                    var internalId = searchResults[0].getValue({ name: 'internalid' });
                                    var fiscal = searchResults[0].getValue({name : 'fiscalcalendar'});
                
                                    return {
                                        periodName: periodName,
                                        internalId: internalId
                                    };
                                } else {
                                    return null;
                                }
                            }
                            function cekYearTP(year) {
                                var taxperiodSearchObj = search.create({
                                    type: "taxperiod",
                                    filters: [
                                        ["periodname", "is", year]
                                    ],
                                    columns: [
                                        search.createColumn({name: "periodname", label: "Name"}),
                                        search.createColumn({name: "internalid", label: "Internal ID"}),
                                        search.createColumn({name: "fiscalcalendar", label: "fiscalcalendar"})
                                    ]
                                });
                                var searchResults = taxperiodSearchObj.run().getRange({ start: 0, end: 1 });
                
                                if (searchResults.length > 0) {
                                    var periodName = searchResults[0].getValue({ name: 'periodname' });
                                    var internalId = searchResults[0].getValue({ name: 'internalid' });
                                    var fiscal = searchResults[0].getValue({name : 'fiscalcalendar'});
                
                                    return {
                                        periodName: periodName,
                                        internalId: internalId
                                    };
                                } else {
                                    return null;
                                }
                            }
                            function formatDate(inputDate) {
                                const months = {
                                    Jan: '01',
                                    Feb: '02',
                                    Mar: '03',
                                    Apr: '04',
                                    May: '05',
                                    Jun: '06',
                                    Jul: '07',
                                    Aug: '08',
                                    Sep: '09',
                                    Oct: '10',
                                    Nov: '11',
                                    Dec: '12'
                                };
                            
                                const [day, month, year] = inputDate.split(' ');
                                const formattedDate = `${day}/${months[month]}/${year}`;
                                return formattedDate;
                            }
                            function getYearFromDates(selectedFrom, selectedTo) {
                                function extractYear(dateStr) {
                                    var parts = dateStr.split('/');
                                    return parts[2];
                                }
                            
                                var fromYear = extractYear(selectedFrom);
                                var toYear = extractYear(selectedTo);
                            
                                return {
                                    fromYear: fromYear,
                                    toYear: toYear
                                };
                            }
                            function convertToDateString(dateString) {
                                
                                var dataToreturn = new Date(dateString); 
                                
                                return dataToreturn
                            }
                            function convertToDate(dateString) {
                                var dateParts = dateString.split('/');
                                var dataToreturn = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
                                return dataToreturn
                            }
                            function getStartYear(year) {
                                let startDate = `01/01/${year}`;
                                return startDate
                            }
                            function getEndYear(year){
                                let endDateObj = new Date(year, 11, 31);
                                
                                let endDate = endDateObj.toLocaleDateString('en-GB');
                                return endDate
                            }
                            function formatPeriodDate(periodNamedate) {
                                const dateParts = periodNamedate.split('/');
                                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                const day = dateParts[0];
                                const month = monthNames[parseInt(dateParts[1], 10) - 1]; 
                                const year = dateParts[2];
                                
                                return `${day} ${month} ${year}`;
                            }
                            function createYearAP(periodName, startYear, endYear, fiscalSet){
                                var createRecordYear = record.create({
                                    type: "accountingperiod",
                                    isDynamic: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isyear",
                                    value: true,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isquarter",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "periodname",
                                    value: periodName,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "startdate",
                                    value: startYear,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "enddate",
                                    value: endYear,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "fiscalcalendar",
                                    value: fiscalSet,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isposting",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                            
                                var saveYear = createRecordYear.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true,
                                });
                                return saveYear
                            }
                            function createYearTP(periodName, startYear, endYear, fiscalSet){
                                var createRecordYear = record.create({
                                    type: "taxperiod",
                                    isDynamic: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isyear",
                                    value: true,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isquarter",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "periodname",
                                    value: periodName,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "startdate",
                                    value: startYear,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "enddate",
                                    value: endYear,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "fiscalcalendar",
                                    value: fiscalSet,
                                    ignoreFieldChange: true,
                                });
                                createRecordYear.setValue({
                                    fieldId: "isposting",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                            
                                var saveYear = createRecordYear.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true,
                                });
                                return saveYear
                            }

                            function getMonthAbbreviation(dateStr) {
                                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            
                                var parts = dateStr.split('/');
                                var monthIndex = parseInt(parts[1]) - 1; 
                                return monthNames[monthIndex];
                            }
                            function generateDateRange(selectedFrom, selectedTo) {
                                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            
                                function parseDate(dateStr) {
                                    var parts = dateStr.split('/');
                                    return new Date(parts[2], parts[1] - 1, parts[0]); 
                                }
                            
                                function formatDate(date) {
                                    var day = date.getDate();
                                    var month = monthNames[date.getMonth()];
                                    var year = date.getFullYear();
                                    return `${day} ${month} ${year}`;
                                }
                            
                                var fromDate = parseDate(selectedFrom);
                                var toDate = parseDate(selectedTo);
                            
                                var dateArray = [];
                            
                                while (fromDate <= toDate) {
                                    dateArray.push(formatDate(fromDate));
                                    fromDate.setDate(fromDate.getDate() + 1); 
                                }
                            
                                return dateArray;
                            }
                            function groupByMonth(dateRange, selectedFrom, selectedTo) {
                                var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            
                                function getMonthFromDate(dateStr) {
                                    return dateStr.split(' ')[1]; 
                                }
                            
                                var fromMonth = getMonthAbbreviation(selectedFrom);
                                var toMonth = getMonthAbbreviation(selectedTo);
                            
                                var groupedDates = {
                                    [fromMonth]: [],
                                    [toMonth]: []
                                };
                                dateRange.forEach(function(dateStr) {
                                    var month = getMonthFromDate(dateStr);
                                    if (month === fromMonth) {
                                        groupedDates[fromMonth].push(dateStr);
                                    } else if (month === toMonth) {
                                        groupedDates[toMonth].push(dateStr);
                                    }
                                });
                            
                                return groupedDates;
                            }
                            function createPeriodMonthAP(periodNameMonth, startDateMonth, endDateMonth, saveYear){
                                var createMonth = record.create({
                                    type: "accountingperiod",
                                    isDynamic: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isposting",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isyear",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isquarter",
                                    value: true,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "periodname",
                                    value: periodNameMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "startdate",
                                    value: startDateMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "enddate",
                                    value: endDateMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "fiscalcalendar",
                                    value: fiscalSet,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "parent",
                                    value: saveYear,
                                    ignoreFieldChange: true,
                                });
                                var saveMonth = createMonth.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true,
                                });
                                return saveMonth;
                            }
                            function createPeriodMonthTP(periodNameMonth, startDateMonth, endDateMonth, saveYear){
                                var createMonth = record.create({
                                    type: "taxperiod",
                                    isDynamic: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isposting",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isyear",
                                    value: false,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "isquarter",
                                    value: true,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "periodname",
                                    value: periodNameMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "startdate",
                                    value: startDateMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "enddate",
                                    value: endDateMonth,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "fiscalcalendar",
                                    value: fiscalSet,
                                    ignoreFieldChange: true,
                                });
                                createMonth.setValue({
                                    fieldId: "parent",
                                    value: saveYear,
                                    ignoreFieldChange: true,
                                });
                                var saveMonth = createMonth.save({
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true,
                                });
                                return saveMonth;
                            }
                            function generateDates(monthYear) {
                                const monthNames = [
                                    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                                ];
                                let [monthName, year] = monthYear.split(" ");
                                year = parseInt(year);
                                let monthIndex = monthNames.indexOf(monthName);
                                if (monthIndex === -1) {
                                    throw new Error("Nama bulan tidak valid");
                                }
                                let lastDate = new Date(year, monthIndex + 1, 0).getDate();
                                let dates = [];
                                for (let day = 1; day <= lastDate; day++) {
                                    let dayString = day.toString();
                                    let monthString = (monthIndex + 1).toString().padStart(2, '0');
                                    dates.push(`${dayString}/${monthString}/${year}`);
                                }
                                let startDate = dates[0];  
                                let endDate = dates[dates.length - 1]; 
                            
                                return { dates, startDate, endDate };
                            }
                            function cekDateExist(periodNamedate){
                                var isSet = true
                                var accountingperiodSearchObj = search.create({
                                    type: "accountingperiod",
                                    filters:
                                    [
                                        ["periodname","is", periodNamedate]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "periodname", label: "Name"}),
                                        search.createColumn({name: "internalid", label: "Internal ID"})
                                    ]
                                });
                                var searchResultCount = accountingperiodSearchObj.runPaged().count;
                                if(searchResultCount > 0){
                                    isSet = false
                                }
                                return isSet
                            }
                            function createDatePeiodAP(allDate, saveYear, saveMonth){
                                var isAllExceute = false
                                allDate.forEach(date => {
                                        var periodNamedate = date
                                        var dateConv = formatDate(date);
                                        var stdDate = convertToDate(dateConv);
                                        var endDate = convertToDate(dateConv);
                                        var isSet = cekDateExist(periodNamedate);
                                        log.debug('isSet', isSet)
                                        var parentMont = saveMonth;
                                        log.debug('data', {
                                            periodNamedate: periodNamedate,
                                            stdDate : stdDate,
                                            endDate : endDate,
                                            parentMont : parentMont
                                        })
        
                                        var recCreateDate = record.create({
                                            type: "accountingperiod",
                                            isDynamic: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "periodname",
                                            value: periodNamedate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "startdate",
                                            value : stdDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "enddate",
                                            value : endDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isposting",
                                            value: true,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isyear",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isquarter",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.selectNewLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'fiscalcalendar',
                                            value: 1,  
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'parent',
                                            value: saveMonth, 
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.commitLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                        // finish set line
        
                                        var saveDate = recCreateDate.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        });
                                        if(saveDate){
                                            isAllExceute = true
                                        }
                                        log.debug('saveDate', saveDate)
                                });
                                return isAllExceute
                            }
                            function createDatePeiodTP(allDate, saveYear, saveMonth){
                                log.debug('masuk fungsi ini');
                                log.debug('allDate', allDate)
                                var isAllExceute = false
                                allDate.forEach(date => {
                                        var periodNamedate = date
                                        var dateConv = formatDate(date);
                                        var stdDate = convertToDate(dateConv);
                                        var endDate = convertToDate(dateConv);
        
                                        var parentMont = saveMonth;
                                        log.debug('data', {
                                            periodNamedate: periodNamedate,
                                            stdDate : stdDate,
                                            endDate : endDate,
                                            parentMont : parentMont
                                        })
        
                                        var recCreateDate = record.create({
                                            type: "taxperiod",
                                            isDynamic: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "periodname",
                                            value: periodNamedate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "startdate",
                                            value : stdDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "enddate",
                                            value : endDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isposting",
                                            value: true,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isyear",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isquarter",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.selectNewLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'fiscalcalendar',
                                            value: 1,  
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'parent',
                                            value: saveMonth, 
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.commitLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                        // finish set line
        
                                        var saveDate = recCreateDate.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        });
                                        if(saveDate){
                                            isAllExceute = true
                                        }
                                });
                                return isAllExceute
                            }
                            function getStartAndEndDate(datesInMonth) {
                                if (datesInMonth.length === 0) {
                                    return { startDate: null, endDate: null };
                                }
                            
                                var startDate = datesInMonth[0]; 
                                var endDate = datesInMonth[datesInMonth.length - 1];
                            
                                return { startDate: startDate, endDate: endDate };
                            }
                            function normalizePeriodName(name) {
                                const parts = name.split(' ');
                                const day = parts[0].padStart(2, '0'); 
                                return `${day} ${parts[1]} ${parts[2]}`;
                            }
                            
                            function createDateExistMonthAP(idMonth, allDate){
                                var allName = []
                                var isAllExceute = false
                                var accountingperiodSearchObj = search.create({
                                    type: "accountingperiod",
                                    filters:
                                    [
                                        ["isyear","is","F"], 
                                        "AND", 
                                        ["isquarter","is","F"], 
                                        "AND", 
                                        ["parent","anyof",idMonth]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "periodname", label: "Name"}),
                                        search.createColumn({name: "parent", label: "Parent"}),
                                        search.createColumn({name: "fiscalcalendar", label: "Fiscal Calendar"})
                                    ]
                                });
                                var searchResultCount = accountingperiodSearchObj.runPaged().count;
                                accountingperiodSearchObj.run().each(function(result){
                                    var namePer = result.getValue({
                                        name: "periodname"
                                    });
                                    allName.push(namePer)
                                    return true;
                                });
                                allDate.forEach(date => {
                                    var periodNamedate = date
                                    var normalizedPeriodNamedate = normalizePeriodName(periodNamedate);
                                    if (!allName.map(normalizePeriodName).includes(normalizedPeriodNamedate)) {
                                        isAllExceute = true
                                        var dateConv = formatDate(date);
                                        var stdDate = convertToDate(dateConv);
                                        var endDate = convertToDate(dateConv);
                                        
                                        var recCreateDate = record.create({
                                            type: "accountingperiod",
                                            isDynamic: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "periodname",
                                            value: periodNamedate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "startdate",
                                            value : stdDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "enddate",
                                            value : endDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isposting",
                                            value: true,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isyear",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isquarter",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.selectNewLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'fiscalcalendar',
                                            value: 1,  
                                            ignoreFieldChange: true
                                        });
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'parent',
                                            value: idMonth, 
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.commitLine({
                                            sublistId: 'fiscalcalendars'
                                        });
        
                                        var saveDate = recCreateDate.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        });
        
                                    }
                                });
                                return isAllExceute
                            }
                            function showEerrMessage(context) {
                                var html = "<html><body>";
                                html += "<h3>Warning: Accounting Period Already Exists</h3>";
                                html +=
                                    '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(255, 0, 0); border-color: rgb(255, 0, 0); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                                html += "</body></html>";
                            
                                var form = serverWidget.createForm({
                                    title: "Warning: Accounting Period Already Exists",
                                });
                                
                                form.addPageInitMessage({
                                    type: message.Type.WARNING,
                                    title: "Warning!",
                                    message: html,
                                });
                            
                                context.response.writePage(form);
                            }
                            function showSuccesMessage(context) {
                                var html = "<html><body>";
                                html += "<h3>Create Accounting Period</h3>";
                                html +=
                                    '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(0, 106, 255); border-color: rgb(0, 106, 255); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                                    html += "</body></html>";
                            
                                    var form = serverWidget.createForm({
                                    title: "Success Create Accounting Period",
                                    });
                                form.addPageInitMessage({
                                            type: message.Type.CONFIRMATION,
                                            title: "Success!",
                                            message: html,
                                        });
                                context.response.writePage(form);
                            }
                            function createDateExistMonthTP(idMonth, allDate){
                                var allName = []
                                var isAllExceute = false
                                var taxperiodSearchObj = search.create({
                                    type: "taxperiod",
                                    filters:
                                    [
                                        ["isyear","is","F"], 
                                        "AND", 
                                        ["isquarter","is","F"], 
                                        "AND", 
                                        ["parent","anyof",idMonth]
                                    ],
                                    columns:
                                    [
                                        search.createColumn({name: "periodname", label: "Name"}),
                                        search.createColumn({name: "parent", label: "Parent"}),
                                        search.createColumn({name: "fiscalcalendar", label: "Fiscal Calendar"})
                                    ]
                                });
                                var searchResultCount = taxperiodSearchObj.runPaged().count;
                                taxperiodSearchObj.run().each(function(result){
                                    var namePer = result.getValue({
                                        name: "periodname"
                                    });
                                    allName.push(namePer)
                                    return true;
                                });
                                allDate.forEach(date => {
                                    var periodNamedate = date
                                    var normalizedPeriodNamedate = normalizePeriodName(periodNamedate);
                                    if (!allName.map(normalizePeriodName).includes(normalizedPeriodNamedate)) {
                                        isAllExceute = true
                                        var dateConv = formatDate(date);
                                        var stdDate = convertToDate(dateConv);
                                        var endDate = convertToDate(dateConv);
                                        var recCreateDate = record.create({
                                            type: "taxperiod",
                                            isDynamic: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "periodname",
                                            value: periodNamedate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "startdate",
                                            value : stdDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "enddate",
                                            value : endDate,
                                            ignoreFieldChange : true
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isposting",
                                            value: true,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isyear",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.setValue({
                                            fieldId: "isquarter",
                                            value: false,
                                            ignoreFieldChange: true,
                                        });
                                        recCreateDate.selectNewLine({
                                            sublistId: 'fiscalcalendars'
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'fiscalcalendar',
                                            value: 1,  
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.setCurrentSublistValue({
                                            sublistId: 'fiscalcalendars',
                                            fieldId: 'parent',
                                            value: idMonth, 
                                            ignoreFieldChange: true
                                        });
                                
                                        recCreateDate.commitLine({
                                            sublistId: 'fiscalcalendars'
                                        });
        
                                        var saveDate = recCreateDate.save({
                                            enableSourcing: false,
                                            ignoreMandatoryFields: true,
                                        });
        
                                    }
                                });
                                return isAllExceute
                            }
                            // end of functions
                            var years = getYearFromDates(selectedFrom, selectedTo);
                            var yearForm = years.fromYear
                            var yearTo = years.toYear
                            if(yearForm == yearTo){
                                var showMessage = false
                                // pengecekan prosses
                                var cekYearAPsame = cekYearAP('FY' + ' ' +yearForm);
                                
                                var cekYearTPsame = cekYearTP('FY' + ' ' +yearForm);
                                var periodName = 'FY' + ' ' +yearForm
                                
                                var dateRange = generateDateRange(selectedFrom, selectedTo);
                                var fromMonth = getMonthAbbreviation(selectedFrom);
                                var toMonth = getMonthAbbreviation(selectedTo);

                                // logic
                                var startYear = convertToDate(getStartYear(yearForm));
                                var endYear = convertToDate(getEndYear(yearForm));
                                var fiscalSet = 1

                                // create AP
                                if(!cekYearAPsame){
                                    var saveYearAP = createYearAP(periodName, startYear, endYear, fiscalSet)
                                    if(fromMonth == toMonth){
                                        var periodNameMonth = fromMonth + ' ' + yearForm
                                        var cekDate = generateDates(fromMonth + ' ' + yearForm);
                                        var startDateMonth = convertToDate(cekDate.startDate);
                                        var endDateMonth = convertToDate(cekDate.endDate)

                                        var saveMonthAP = createPeriodMonthAP(periodNameMonth, startDateMonth, endDateMonth, saveYearAP)
                                        var saveDate = createDatePeiodAP(dateRange, saveYearAP, saveMonthAP)
                                        if(saveDate){
                                            showMessage = true
                                        }
                                        
                                    }else{
                                        var groupedDates = groupByMonth(dateRange, selectedFrom, selectedTo);
                                        var datesInFromMonth = groupedDates[fromMonth];
                                        var resultFromMonth = getStartAndEndDate(datesInFromMonth);
                                        var startDateFrom = convertToDateString(resultFromMonth.startDate)
                                        var endDateFrom = convertToDateString(resultFromMonth.endDate)

                                        var datesInToMonth = groupedDates[toMonth];
                                        var resultToMonth = getStartAndEndDate(datesInToMonth);
                                        var startDateTo = convertToDateString(resultToMonth.startDate)
                                        var endDateTo = convertToDateString(resultToMonth.endDate)
                                        var periodNameMonthFirst = fromMonth + ' ' + yearForm
                                        var saveMonthFirstAp = createPeriodMonthAP(periodNameMonthFirst, startDateFrom, endDateFrom, saveYearAP);
                                        var saveDatesatu = createDatePeiodAP(datesInFromMonth, saveYearAP, saveMonthFirstAp)

                                        var periodNameMonthSec = toMonth + ' ' + yearForm
                                        var saveMonthFirstAp = createPeriodMonthAP(periodNameMonthSec, startDateTo, endDateTo, saveYearAP);
                                        var saveDateDua = createDatePeiodAP(datesInToMonth, saveYearAP, saveMonthFirstAp)
                                        if(saveDatesatu && saveDateDua){
                                            showMessage = true
                                        }else{
                                            showMessage = false
                                        }
                                    }
                                }else{
                                    var idYear = cekYearAPsame.internalId
                                    if(fromMonth == toMonth){
                                        var cekMonthAp = cekYearAP(fromMonth + ' ' + yearForm);
                                        
                                        if(cekMonthAp){
                                            var idMonth = cekMonthAp.internalId
                                            var createDate = createDateExistMonthAP(idMonth, dateRange)
                                            
                                        }else{
                                            var periodNameMonth = fromMonth + ' ' + yearForm
                                            var cekDate = generateDates(fromMonth + ' ' + yearForm);
                                            var startDateMonth = convertToDate(cekDate.startDate);
                                            var endDateMonth = convertToDate(cekDate.endDate)

                                            var saveMonthAP = createPeriodMonthAP(periodNameMonth, startDateMonth, endDateMonth, idYear)
                                            var saveDate = createDatePeiodAP(dateRange, idYear, saveMonthAP)
                                            if(saveDate){
                                                showMessage = true
                                            }else{
                                                showMessage = false
                                            }
                                            
                                        }
                                    }else{
                                        var cekMonthApFrom = cekYearAP(fromMonth + ' ' + yearForm);
                                        var groupedDates = groupByMonth(dateRange, selectedFrom, selectedTo);
                                        var datesInFromMonth = groupedDates[fromMonth];
                                        if(cekMonthApFrom){
                                            var idMonth = cekMonthApFrom.internalId
                                            var saveDate = createDateExistMonthAP(idMonth, datesInFromMonth)
                                            if(saveDate){
                                                showMessage = true
                                            }else{
                                                showMessage = false
                                            }
                                        }else{
                                            var resultFromMonth = getStartAndEndDate(datesInFromMonth);
                                            var startDateFrom = convertToDateString(resultFromMonth.startDate)
                                            var endDateFrom = convertToDateString(resultFromMonth.endDate)
                                            var periodNameMonthFirst = fromMonth + ' ' + yearForm
                                            
                                            var saveMonthFirstAp = createPeriodMonthAP(periodNameMonthFirst, startDateFrom, endDateFrom, idYear);
                                            var saveDate = createDatePeiodAP(datesInFromMonth, idYear, saveMonthFirstAp)
                                            if(saveDate){
                                                showMessage = true
                                            }
                                        }
                                        
                                        var cekMonthApTO = cekYearAP(toMonth + ' ' + yearForm);
                                        var datesInToMonth = groupedDates[toMonth];
                                        if(cekMonthApTO){
                                            var idMonth = cekMonthApTO.internalId
                                            var saveDate = createDateExistMonthAP(idMonth, datesInToMonth)
                                            if(saveDate){
                                                showMessage = true
                                            }
                                        }else{
                                            var resultToMonth = getStartAndEndDate(datesInToMonth);
                                            var startDateTo = convertToDateString(resultToMonth.startDate)
                                            var endDateTo = convertToDateString(resultToMonth.endDate);
                                            
    
                                            var periodNameMonthSec = toMonth + ' ' + yearForm
                                            var saveMonthSecAp = createPeriodMonthAP(periodNameMonthSec, startDateTo, endDateTo, idYear);
                                            var saveDate = createDatePeiodAP(datesInToMonth, idYear, saveMonthSecAp)
                                            if(saveDate){
                                                showMessage = true
                                            }
                                        }
                                    }
                                }

                                // create TP
                                if(!cekYearTPsame){
                                    var saveYearTP = createYearTP(periodName, startYear, endYear, fiscalSet)
                                     if(fromMonth == toMonth){
                                        var periodNameMonth = fromMonth + ' ' + yearForm
                                        var cekDate = generateDates(fromMonth + ' ' + yearForm);
                                        var startDateMonth = convertToDate(cekDate.startDate);
                                        var endDateMonth = convertToDate(cekDate.endDate)

                                        var saveMonthAP = createPeriodMonthTP(periodNameMonth, startDateMonth, endDateMonth, saveYearTP)
                                        var saveDate = createDatePeiodTP(dateRange, saveYearTP, saveMonthAP)
                                        if(saveDate){
                                            showMessage = true
                                        }
                                    }else{
                                        var groupedDates = groupByMonth(dateRange, selectedFrom, selectedTo);
                                        var datesInFromMonth = groupedDates[fromMonth];
                                        var resultFromMonth = getStartAndEndDate(datesInFromMonth);
                                        var startDateFrom = convertToDateString(resultFromMonth.startDate)
                                        var endDateFrom = convertToDateString(resultFromMonth.endDate)

                                        var datesInToMonth = groupedDates[toMonth];
                                        var resultToMonth = getStartAndEndDate(datesInToMonth);
                                        var startDateTo = convertToDateString(resultToMonth.startDate)
                                        var endDateTo = convertToDateString(resultToMonth.endDate)
                                        var periodNameMonthFirst = fromMonth + ' ' + yearForm
                                        var saveMonthFirstAp = createPeriodMonthTP(periodNameMonthFirst, startDateFrom, endDateFrom, saveYearTP);
                                        var saveDatesatu = createDatePeiodTP(datesInFromMonth, saveYearTP, saveMonthFirstAp)

                                        var periodNameMonthSec = toMonth + ' ' + yearForm
                                        var saveMonthFirstAp = createPeriodMonthTP(periodNameMonthSec, startDateTo, endDateTo, saveYearTP);
                                        var saveDateDua = createDatePeiodTP(datesInToMonth, saveYearTP, saveMonthFirstAp)
                                        if(saveDatesatu && saveDateDua){
                                            showMessage = true
                                        }
                                    }
                                }else{
                                    var idYearTP = cekYearTPsame.internalId
                                    if(fromMonth == toMonth){
                                        var cekMonthTP = cekYearTP(fromMonth + ' ' + yearForm);
                                        if(cekMonthTP){
                                            var idMonth = cekMonthTP.internalId
                                            var createDate = createDateExistMonthTP(idMonth, dateRange)
                                            if(createDate){
                                                showMessage = true
                                            }
                                        }else{
                                            var periodNameMonth = fromMonth + ' ' + yearForm
                                            var cekDate = generateDates(fromMonth + ' ' + yearForm);
                                            var startDateMonth = convertToDate(cekDate.startDate);
                                            var endDateMonth = convertToDate(cekDate.endDate)

                                            var saveMonthTP = createPeriodMonthTP(periodNameMonth, startDateMonth, endDateMonth, idYearTP)
                                            var createDate = createDatePeiodTP(dateRange, idYearTP, saveMonthTP)
                                            if(createDate){
                                                showMessage = true
                                            }
                                        }
                                    }else{
                                        var cekMonthTpFrom = cekYearTP(fromMonth + ' ' + yearForm);
                                        var groupedDates = groupByMonth(dateRange, selectedFrom, selectedTo);
                                        var datesInFromMonth = groupedDates[fromMonth];
                                        if(cekMonthTpFrom){
                                            var idMonth = cekMonthTpFrom.internalId
                                            createDateExistMonthTP(idMonth, datesInFromMonth)
                                        }else{
                                            
                                            var resultFromMonth = getStartAndEndDate(datesInFromMonth);
                                            var startDateFrom = convertToDateString(resultFromMonth.startDate)
                                            var endDateFrom = convertToDateString(resultFromMonth.endDate)
                                            var periodNameMonthFirst = fromMonth + ' ' + yearForm
                                            
                                            var saveMontFromTP = createPeriodMonthTP(periodNameMonthFirst, startDateFrom, endDateFrom, idYear);
                                            var saveDate = createDatePeiodTP(datesInFromMonth, idYear, saveMontFromTP)
                                            if(saveDate){
                                                showMessage = true
                                            }
                                        }
                                        
                                        var cekMonthTpTO = cekYearTP(toMonth + ' ' + yearForm);
                                        var datesInToMonth = groupedDates[toMonth];
                                        if(cekMonthTpTO){
                                            var idMonth = cekMonthTpTO.internalId
                                            createDateExistMonthTP(idMonth, datesInToMonth)
                                        }else{
                                            var resultToMonth = getStartAndEndDate(datesInToMonth);
                                            var startDateTo = convertToDateString(resultToMonth.startDate)
                                            var endDateTo = convertToDateString(resultToMonth.endDate)
                                            var periodNameMonthSec = toMonth + ' ' + yearForm
                                            var savemonthToTP = createPeriodMonthTP(periodNameMonthSec, startDateTo, endDateTo, idYear);
                                            var saveDate = createDatePeiodTP(datesInToMonth, idYear, savemonthToTP)
                                            if(saveDate){
                                                showMessage = true
                                            }
                                        }
                                        
                                    }
                                }
                                if(showMessage){
                                    showSuccesMessage(context)
                                }else{
                                    showEerrMessage(context)
                                }
                            }else{
                                var html = "<html><body>";
                                html += "<h3>Please select a range within the same year</h3>";
                                html +=
                                    '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(255, 0, 0); border-color: rgb(255, 0, 0); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                                html += "</body></html>";

                                var form = serverWidget.createForm({
                                    title: "Please select a range within the same year",
                                });
                                form.addPageInitMessage({
                                    type: message.Type.WARNING,
                                    title: "Warning!",
                                    message: html,
                                });
                                context.response.writePage(form);
                            }
                        }
                        
                        
                    }
                }else{
                    var html = "<html><body>";
                    html += "<h3>Please Select Month And Year</h3>";
                    html +=
                        '<input style="border: none; color: rgb(255, 255, 255); padding: 8px 30px; margin-top: 15px; cursor: pointer; text-align: center; background-color: rgb(255, 0, 0); border-color: rgb(255, 0, 0); fill: rgb(255, 255, 255); border-radius: 3px; font-weight: bold;" type="button" onclick="window.history.go(-1)" value="OK" />';
                    html += "</body></html>";

                    var form = serverWidget.createForm({
                        title: "Please Select Month And Year",
                    });
                    form.addPageInitMessage({
                        type: message.Type.WARNING,
                        title: "Warning!",
                        message: html,
                    });
                    context.response.writePage(form);
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