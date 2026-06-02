/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 */
define(['N/file', 'N/log', 'N/runtime', 'N/search', 'N/record'], function(file, log, runtime, search, record) {

    function getInputData() {
        log.debug('Start getInputData');
        try {
            const currentScript = runtime.getCurrentScript();
            const recId = currentScript.getParameter({ name: 'custscript_budget_pash_rec_id' });

            if (!recId) {
                log.error('MISSING_PARAMETER', 'Parameter wajib (recId) tidak ditemukan.');
                return [];
            }
            
            var loadRec = record.load({
                type: 'customrecord_stc_draft_project_budget_he',
                id: recId
            });

            const grandModul = loadRec.getValue('custrecord_stc_grant_module_prj_budg');
            const startPeriod = loadRec.getValue('custrecord_stc_start_date_prj_budg'); 
            const endPeriod = loadRec.getValue('custrecord_stc_end_date_prj_budg');     

            if (!grandModul) {
                log.error('MISSING_GRANT_MODULE', 'Grant Module (Project) tidak ditemukan pada record.');
                return [];
            }

            // =================================================================
            // 1. AMBIL DATA PROJECT TASK (MAIN DATA) + DATA JOIN DARI COMPANY
            // =================================================================
            var allProjectTask = [];
            var projectTaskDataMap = {};

            const projecttaskSearchObj = search.create({
                type: "projecttask",
                filters: [["project", "anyof", grandModul]],
                columns: [
                    search.createColumn({name: "internalid", label: "Internal ID"}),
                    search.createColumn({name: "title", label: "Name"}),
                    search.createColumn({name: "cseg_paactivitycode", label: "Activity Code"}),
                    search.createColumn({name: "cseg_stc_drc_segmen", label: "DRC Segment"}),
                    search.createColumn({name: "cseg_stc_segmentdea", label: "DEA Segment"}),
                    search.createColumn({name: "company", label: "Award Management"}) 
                ]
            });

            projecttaskSearchObj.run().each(function(result) {
                var id = result.getValue({ name: "internalid" });
                
                // PERBAIKAN: Menyembuhkan logika OR (||) mapping agar tidak tertukar/tertimpa data kolom lain
                projectTaskDataMap[id] = {
                    title: result.getValue({ name: "title" }) || '',
                    activityCode: result.getText({ name: "cseg_paactivitycode" }) || result.getValue({ name: "cseg_paactivitycode" }) || '',
                    drcSegment: result.getText({ name: "cseg_stc_drc_segmen" }) || result.getValue({ name: "cseg_stc_drc_segmen" }) || '',
                    deaSegment: result.getText({ name: "cseg_stc_segmentdea" }) || result.getValue({ name: "cseg_stc_segmentdea" }) || '',
                    awardManagement: result.getText({ name: "company" }) || result.getValue({ name: "company"}) || '',
                    projectCode: result.getValue({ name: "company" }) || ''
                };
                
                allProjectTask.push(id);
                return true;
            });

            log.debug('projectTaskDataMap Terperbaiki', projectTaskDataMap);

            if (allProjectTask.length === 0) {
                log.audit('No Project Tasks Found', 'Tidak ada data project task untuk diproses.');
                return [];
            }

            // =================================================================
            // 2. AMBIL DATA EXPENSE REPORT (Untuk Actual Usage Budget YTD)
            // =================================================================
            var expenseMap = {};
            var expenseFilters = [
                ["type", "anyof", "ExpRept"],
                "AND",
                ["projecttask", "anyof", allProjectTask]
            ];
            
            if (startPeriod && endPeriod) {
                if (startPeriod === endPeriod) {
                    expenseFilters.push("AND", ["postingperiod", "abs", startPeriod]);
                }
            } else if (startPeriod) {
                expenseFilters.push("AND", ["postingperiod", "abs", startPeriod]);
            }

            const expensereportSearchObj = search.create({
                type: "expensereport",
                filters: expenseFilters,
                columns: [
                    search.createColumn({name: "projecttask", summary: "GROUP"}),
                    search.createColumn({name: "amount", summary: "SUM"})
                ]
            });

            expensereportSearchObj.run().each(function(result) {
                var cols = result.columns;
                var pTask = result.getValue(cols[0]);
                var sumAmount = Number(result.getValue(cols[1])) || 0;
                expenseMap[pTask.toString()] = sumAmount;
                return true;
            });

            // =================================================================
            // 3. AMBIL DATA PROJECT BUDGET (Untuk Remaining Budget)
            // =================================================================
            var budgetMap = {};
            var budgetFilters = [
                ["amounttype", "anyof", "Cost"],
                "AND",
                ["projecttask", "anyof", allProjectTask]
            ];
            
            // if (startPeriod && endPeriod) {
            //     if (startPeriod === endPeriod) {
            //         budgetFilters.push("AND", ["budgetperiod", "anyof", startPeriod]);
            //     } else {
            //         budgetFilters.push("AND", ["budgetperiod", "between", startPeriod, endPeriod]);
            //     }
            // } else if (startPeriod) {
            //     budgetFilters.push("AND", ["budgetperiod", "anyof", startPeriod]);
            // }

            const projectbudgetSearchObj = search.create({
                type: "projectbudget",
                filters: budgetFilters,
                columns: [
                    search.createColumn({name: "projecttask"}),
                    search.createColumn({name: "eac"}) 
                ]
            });

            projectbudgetSearchObj.run().each(function(result) {
                var pTask = result.getValue({name: "projecttask"});
                var eacVal = Number(result.getValue({name: "eac"})) || 0;
                budgetMap[pTask.toString()] = eacVal;
                return true;
            });

            // =================================================================
            // 4. AMBIL DATA CHART OF ACCOUNTS (CoA) SEBAGAI DATA KEDUA
            // =================================================================
            var coaResults = [];
            const accountSearchObj = search.create({
                type: "account",
                filters: [],
                columns: [
                    search.createColumn({name: "number", label: "Number"}),
                    search.createColumn({name: "name", label: "Name"}),
                    search.createColumn({name: "displayname", label: "Display Name"}),
                    search.createColumn({name: "type", label: "Account Type"}),
                    search.createColumn({name: "description", label: "Description"})
                ]
            });

            accountSearchObj.run().each(function(result) {
                coaResults.push({
                    "Number": result.getValue({name: "number"}) || '',
                    "Name": result.getValue({name: "name"}) || '',
                    "Display Name": result.getValue({name: "displayname"}) || '',
                    "Account Type": result.getText({name: "type"}) || result.getValue({name: "type"}) || '',
                    "Description": result.getValue({name: "description"}) || ''
                });
                return true;
            });

            // =================================================================
            // 5. PACKING SEMUA DATA KE ARRAY UTAMA
            // =================================================================
            var searchResults = [];
            
            allProjectTask.forEach(function(taskId, index) {
                var keyStr = taskId.toString();
                var taskDetails = projectTaskDataMap[keyStr] || {};
                
                var counter = (index + 1).toString().padStart(5, '0');
                var extId = 'recId_' + counter; 

                var rowData = {
                    "dataType": "BUDGET_REPORT",
                    "External ID": extId,
                    "Internal ID": Number(taskId),
                    "Bugdet Phasing Link Header Internal ID": recId,
                    "Project Task": taskDetails.title || '',
                    "DEA Segment": taskDetails.deaSegment || '',
                    "DRC Segment": taskDetails.drcSegment || '',
                    "Activity Code": taskDetails.activityCode || '',
                    "Award Management": taskDetails.awardManagement || '',
                    "Project Code": taskDetails.projectCode || '',
                    "Actual Usage Budget YTD": expenseMap[keyStr] || 0,
                    "Remaining Budget": budgetMap[keyStr] || 0,
                    "Cost Center": "", "SOF": "", "Account Budget": "", 
                    "Category": "", "Cost Category": "", "Requested Amount": 0, "SOF % - Non Project": "", 
                    "SOF % - Project": "", "Total Funded By CAM/ICR/IG": 0, "Quantity": 0, "Unit Cost": 0, 
                    "Unit Value": 0, "Component": "", "Remarks": ""
                };

                for (var p = 1; p <= 60; p++) {
                    rowData["Period " + p] = 0;
                }
                searchResults.push(rowData);
            });

            coaResults.forEach(function(coaRow) {
                coaRow["dataType"] = "COA_REPORT";
                searchResults.push(coaRow);
            });

            return searchResults;

        } catch (error) {
            log.error('Error in getInputData Master Flow', error);
            return [];
        }
    }

    function map(context) {
        var rowValue = JSON.parse(context.value);
        context.write({
            key: rowValue.dataType, 
            value: rowValue
        });
    }

    function reduce(context) {
        var rows = context.values;
        for (var i = 0; i < rows.length; i++) {
            context.write({
                key: context.key,
                value: rows[i]
            });
        }
    }

    function summarize(summary) {
        log.audit('Summarize Stage Started');
        try {
            var budgetRows = [];
            var coaRows = [];

            summary.output.iterator().each(function (key, value) {
                var parsedData = JSON.parse(value);
                if (key === "BUDGET_REPORT") {
                    budgetRows.push(parsedData);
                } else if (key === "COA_REPORT") {
                    coaRows.push(parsedData);
                }
                return true;
            });

            budgetRows.sort(function(a, b) {
                return a["Internal ID"] - b["Internal ID"];
            });

            coaRows.sort(function(a, b) {
                return a["Number"].localeCompare(b["Number"]);
            });

            var budgetHeaders = [
                "External ID", "Bugdet Phasing Link Header Internal ID", "Project Task", "DEA Segment", 
                "DRC Segment", "Cost Center", "Activity Code", "Award Management", "SOF", "Account Budget", 
                "Project Code", "Baseline Budget", "Actual Usage Budget YTD", "Remaining Budget", "Category", "Cost Category", 
                "Requested Amount", "SOF % - Non Project", "SOF % - Project", "Total Funded By CAM/ICR/IG", 
                "Quantity", "Unit Cost", "Unit Value", "Component", "Remarks", "Total Budget will Allocated"
            ];
            
            var periodHeaders = [];
            for (var p = 1; p <= 60; p++) { periodHeaders.push("Period " + p); }
            budgetHeaders = budgetHeaders.concat(periodHeaders);

            // Susun urutan Header Kolom Sheet 2 (Chart of Accounts)
            var coaHeaders = ["Number", "Name", "Display Name", "Account Type", "Description"];

            // =================================================================
            // MEMBANGUN STRUKTUR MULTI-SHEET XML SPREADSHEET
            // =================================================================
            var xml = [];
            xml.push('<?xml version="1.0"?>');
            xml.push('<?mso-application progid="Excel.Sheet"?>');
            xml.push('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ');
            xml.push('xmlns:o="urn:schemas-microsoft-com:office:excel" '); 
            xml.push('xmlns:x="urn:schemas-microsoft-com:office:excel" '); 
            xml.push('xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" '); 
            xml.push('xmlns:html="http://www.w3.org/TR/REC-html40">');
            
            // Definisikan Style Background Abu-abu Keputihan (#EFEFEF)
            xml.push('<Styles>');
            xml.push('  <Style ss:ID="HeaderStyle">');
            xml.push('    <Font ss:Bold="1" ss:Color="#000000"/>');
            xml.push('    <Interior ss:Color="#EFEFEF" ss:Pattern="Solid"/>'); 
            xml.push('    <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>');
            xml.push('  </Style>');
            xml.push('</Styles>');

            // -----------------------------------------------------------------
            // SHEET 1: BUDGET REPORT
            // -----------------------------------------------------------------
            xml.push('<Worksheet ss:Name="Budget Report"><Table> ');
            xml.push('<Row ss:Height="22">');
            for (var h = 0; h < budgetHeaders.length; h++) {
                xml.push('<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">' + escapeXml(budgetHeaders[h]) + '</Data></Cell>');
            }
            xml.push('</Row>');

            budgetRows.forEach(function(rowData) {
                xml.push('<Row>');
                for (var j = 0; j < budgetHeaders.length; j++) {
                    var val = rowData[budgetHeaders[j]];
                    if (val === null || val === undefined) { val = ''; }
                    var type = (typeof val === 'number') ? 'Number' : 'String';
                    xml.push('<Cell><Data ss:Type="' + type + '">' + escapeXml(val.toString()) + '</Data></Cell>');
                }
                xml.push('</Row>');
            });
            xml.push('</Table></Worksheet>');

            // -----------------------------------------------------------------
            // SHEET 2: CHART OF ACCOUNTS (CoA)
            // -----------------------------------------------------------------
            xml.push('<Worksheet ss:Name="Chart of Accounts"><Table>');
            xml.push('<Row ss:Height="22">');
            for (var c = 0; c < coaHeaders.length; c++) {
                xml.push('<Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">' + escapeXml(coaHeaders[c]) + '</Data></Cell>');
            }
            xml.push('</Row>');

            coaRows.forEach(function(rowData) {
                xml.push('<Row>');
                for (var k = 0; k < coaHeaders.length; k++) {
                    var val = rowData[coaHeaders[k]];
                    if (val === null || val === undefined) { val = ''; }
                    xml.push('<Cell><Data ss:Type="String">' + escapeXml(val.toString()) + '</Data></Cell>');
                }
                xml.push('</Row>');
            });
            xml.push('</Table></Worksheet>');

            xml.push('</Workbook>');
            var finalContent = xml.join('\n');

            var currentScript = runtime.getCurrentScript();
            var recordId = currentScript.getParameter({ name: 'custscript_budget_pash_rec_id' }) || '1'; 
            
            var uniqueId = Date.now(); 
            var fileName = 'Budget_Report_' + recordId + '_' + uniqueId + '.xls';
            
            log.debug('Membuat Multi-Sheet Excel via PLAINTEXT', fileName);

            var excelFile = file.create({
                name: fileName,
                fileType: file.Type.PLAINTEXT, 
                contents: finalContent,
                folder: 862 
            });

            var fileId = excelFile.save();
            log.audit('Excel Generated Successfully', 'File ID: ' + fileId + ' dengan nama: ' + fileName);

        } catch (e) {
            log.error('ERROR PADA TAHAP SUMMARIZE MULTI SHEET', e);
        }
    }

    function escapeXml(unsafe) {
        if (!unsafe) return '';
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});