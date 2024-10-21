/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record', 'N/ui/message'], function (serverWidget, task, search, log, record, message) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Generate Tax Period'
            });
            
            var monthField = form.addField({
                id: 'custpage_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Month'
            });
            
            monthField.addSelectOption({
                value: '', 
                text: '-Select-'
            });
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < months.length; i++) {
                monthField.addSelectOption({
                    value: months[i], 
                    text: months[i]    
                });
            }
            
            var yearField = form.addField({
                id: 'custpage_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Year'
            });
            
            yearField.addSelectOption({
                value: '', 
                text: '-Select-'
            });
            
            var currentYear = new Date().getFullYear();
            for (let i = currentYear - 5; i <= currentYear + 10; i++) {
                yearField.addSelectOption({
                    value: i.toString(),
                    text: i.toString()
                });
            }
            
            form.addButton({
                id: 'custpage_delete_button',
                label: 'Delete',
                functionName: 'handleDelete()' 
            });
            
            form.addSubmitButton({
                label: 'Generate'
            });
            form.clientScriptModulePath = "SuiteScripts/abj_cs_delete_accounting_period.js";
            context.response.writePage(form);

        } else {
            try{
                var selectedMonth = context.request.parameters.custpage_month;
                var selectedYear = context.request.parameters.custpage_year;
    
                log.debug('selectedMonth', selectedMonth);
                log.debug('selectedYear', selectedYear);
                if(selectedMonth && selectedYear){
                    function convertToDate(dateString) {
                        var dateParts = dateString.split('/');
                        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
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
                    function cekData(data) {
                        var taxperiodSearchObj = search.create({
                            type: "taxperiod",
                            filters: [
                                ["periodname", "is", data]
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
                            log.debug('fiscal', fiscal)
        
                            log.debug('Period Name:', periodName);
                            log.debug('Internal ID:', internalId);
        
                            return {
                                periodName: periodName,
                                internalId: internalId
                            };
                        } else {
                            log.debug('No results found.');
                            return null;
                        }
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
                            let dayString = day.toString(); // Hilangkan padStart untuk dayString
                            let monthString = (monthIndex + 1).toString().padStart(2, '0');
                            dates.push(`${dayString}/${monthString}/${year}`);
                        }
                        let startDate = dates[0];  
                        let endDate = dates[dates.length - 1]; 
                    
                        return { dates, startDate, endDate };
                    }
                    
                    function createYearPeriod(periodName, startYear, endYear, fiscalSet){
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
                        log.debug('saveYear', saveYear);
                        return saveYear
                    }
                    function createPeriodMonth(periodNameMonth, startDateMonth, endDateMonth, saveYear){
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
                        log.debug('saveMonth', saveMonth)
                        return saveMonth;
                    }
                
                    function createDatePeiod(allDate, saveYear, saveMonth){
                        log.debug('masuk fungsi ini');
                        log.debug('allDate', allDate)
                        allDate.forEach(date => {
                                var periodNamedate = formatPeriodDate(date)
                                log.debug('periodNamedate', periodNamedate)
                                var stdDate = convertToDate(date);
                                var endDate = convertToDate(date);

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
                                log.debug('saveDate', saveDate)
                        });
                    }
                    function normalizePeriodName(name) {
                        const parts = name.split(' ');
                        const day = parts[0].padStart(2, '0'); 
                        return `${day} ${parts[1]} ${parts[2]}`;
                    }
                    function createDateExistMonth(idMonth, allDate){
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
                        log.debug("taxperiodSearchObj result count",searchResultCount);
                        taxperiodSearchObj.run().each(function(result){
                            var namePer = result.getValue({
                                name: "periodname"
                            });
                            allName.push(namePer)
                            return true;
                        });
                        log.debug('allName', allName)
                        allDate.forEach(date => {
                            var periodNamedate = formatPeriodDate(date)
                            var normalizedPeriodNamedate = normalizePeriodName(periodNamedate);
                            if (!allName.map(normalizePeriodName).includes(normalizedPeriodNamedate)) {
                                isAllExceute = true
                                log.debug('periodNamedate', periodNamedate)
                                var stdDate = convertToDate(date);
                                log.debug('stdDate', stdDate)
                                var endDate = convertToDate(date);

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
                                log.debug('saveDate', saveDate)

                            }
                        });
                        return isAllExceute
                    }
                    // endFunction

                    // logic
                    var cekYear = cekData('FY' + ' ' +selectedYear);
                    if(!cekYear || cekYear == '' || cekYear == null){
                        var startYear = convertToDate(getStartYear(selectedYear));
        
                        var endYear = convertToDate(getEndYear(selectedYear));
                        var fiscalSet = 1
                        var periodName = 'FY' + ' ' + selectedYear
                        var saveYear = createYearPeriod(periodName, startYear, endYear, fiscalSet)

                        var cekDate = generateDates(selectedMonth + ' ' + selectedYear);
                        var allDate = cekDate.dates
                        log.debug('allDate', allDate);
                        var startDateMonth = convertToDate(cekDate.startDate)
                        log.debug('startDateMonth', startDateMonth)
                        var endDateMonth = convertToDate(cekDate.endDate)
                        log.debug('endDateMonth', endDateMonth)

                        // create month
                        var periodNameMonth = selectedMonth + ' ' + selectedYear
                        
                        var saveMonth = createPeriodMonth(periodNameMonth, startDateMonth, endDateMonth, saveYear )
                        createDatePeiod(allDate, saveYear, saveMonth)
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
                        

                    }else{
                        var cekMonth = cekData(selectedMonth + ' ' + selectedYear);
                        log.debug('cekMonth', cekMonth)
                        if(cekMonth){
                            idMonth = cekMonth.internalId
                            var cekDate = generateDates(selectedMonth + ' ' + selectedYear);
                            var allDate = cekDate.dates
                            log.debug('allDate', allDate);
                            var cekCreateExist = createDateExistMonth(idMonth, allDate)
                            log.debug('cekCreateExist', cekCreateExist)

                            if(cekCreateExist == false){
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
                            }else{
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
                            
                        }else{
                            log.debug('monthdind Exist, this is the id of year', cekYear.internalId)
                            var saveYear = cekYear.internalId
                            var cekDate = generateDates(selectedMonth + ' ' + selectedYear);
                            var allDate = cekDate.dates
                            log.debug('allDate', allDate);
                            var startDateMonth = convertToDate(cekDate.startDate)
                            log.debug('startDateMonth', startDateMonth)
                            var endDateMonth = convertToDate(cekDate.endDate)
                            log.debug('endDateMonth', endDateMonth)
        
                            // create month
                            var periodNameMonth = selectedMonth + ' ' + selectedYear
                            var saveMonth = createPeriodMonth(periodNameMonth, startDateMonth, endDateMonth, saveYear )
                            log.debug('saveMonth', saveMonth)
                            createDatePeiod(allDate, saveYear, saveMonth);
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