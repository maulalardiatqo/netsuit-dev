/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/file', 'N/https', 'N/log'], (search, file, https, log) => {

    const getInputData = (context) => {
        log.debug('Memulai proses', 'Menyiapkan Saved Search Vendor Bill');

        const vendorbillSearchObj = search.create({
            type: "vendorbill",
            settings: [{"name":"consolidationtype","value":"ACCTTYPE"}],
            filters: [
                ["type","anyof","VendBill"], 
                "AND", 
                ["mainline","is","T"], 
                "AND", 
                ["file.internalid","noneof","@NONE@"], 
                "AND", 
                ["taxline","is","F"], 
                "AND", 
                ["cogs","is","F"], 
                "AND", 
                [["numbertext","startswith","BILL"],"OR",["numbertext","startswith","CE"]], 
                "AND", 
                ["custbody_bill_created_by","isnotempty",""]
            ],
            columns: [
                search.createColumn({name: "internalid", label: "Internal ID"}),
                search.createColumn({name: "tranid", label: "Document Number"}),
                search.createColumn({name: "internalid", join: "file", label: "Internal ID"}),
                search.createColumn({name: "folder", join: "file", label: "Folder"}),
                search.createColumn({name: "filetype", join: "file", label: "Type"}),
                search.createColumn({name: "name", join: "file", label: "Name"}),
                search.createColumn({name: "documentsize", join: "file", label: "Size (KB)"})
            ]
        });

        return vendorbillSearchObj; 
    };

    const map = (context) => {
        try {
            const searchResult = JSON.parse(context.value);
            
            const billId = searchResult.values.internalid.value;
            const tranId = searchResult.values.tranid; 
            const fileId = searchResult.values['internalid.file'].value;

            if (!fileId) {
                return;
            }

            let targetFolder = 'bill_from_ns'; 
            if (tranId && tranId.startsWith('CE')) {
                targetFolder = 'claim_expense_form_ns';
            }

            const fileObj = file.load({ id: fileId });
            const fileContent = fileObj.getContents(); 
            let exactFileName = fileObj.name;
            const fileType = fileObj.fileType.toLowerCase();
            const extensionMap = {
                'pdf': '.pdf',
                'jpgimage': '.jpg',
                'jpegimage': '.jpg',
                'pngimage': '.png',
                'word': '.docx',
                'excel': '.xlsx',
                'text': '.txt',
                'csv': '.csv'
            };

            const expectedExtension = extensionMap[fileType] || '';

            if (expectedExtension && !exactFileName.toLowerCase().endsWith(expectedExtension)) {
                exactFileName += expectedExtension;
            }

            const apiUrl = 'https://approvalphintraco.com/netsuite/transfer_file'; 
            // const apiHeaders = {
            //     'Content-Type': 'application/json',
            //     'Authorization': 'Bearer TOKEN_API_ANDA' // Sesuaikan tokennya
            // };
            log.debug('exactFileName', exactFileName)
            const requestBody = JSON.stringify({
                vendorBillId: billId,
                documentNumber: tranId,
                fileId: fileId,
                fileName: exactFileName,
                fileType: fileObj.fileType,
                fileSizeKB: fileObj.size,
                targetFolder: targetFolder, 
                content: fileContent
            });

            const response = https.post({
                url: apiUrl,
                headers: { 'Content-Type': 'application/json' },
                body: requestBody
            });

            if (response.code === 200 || response.code === 201) {
                log.debug('Sukses', `File [${exactFileName}] (Doc: ${tranId}) berhasil dikirim.`);
            } else {
                log.error('Gagal Mengirim', `HTTP ${response.code} pada Dokumen ${tranId}: ${response.body}`);
            }

        } catch (e) {
            log.error('Error di tahap Map', e.message);
        }
    };

    const summarize = (summary) => {
        log.audit('Proses Selesai', 'Menyusun file history...');

        let csvContent = 'Status,Document Number,NetSuite File ID,Error Message\n';
        let totalSukses = 0;
        let totalGagal = 0;

        summary.mapSummary.keys.iterator().each((key) => {
            csvContent += `SUKSES,N/A,${key},\n`;
            totalSukses++;
            return true;
        });

        summary.mapSummary.errors.iterator().each((key, errorObj) => {
            let errorMsg = '';
            try {
                let parsedError = JSON.parse(errorObj);
                errorMsg = parsedError.message || errorObj;
            } catch (e) {
                errorMsg = errorObj;
            }

            errorMsg = errorMsg.replace(/,/g, ' '); 

            csvContent += `GAGAL,N/A,${key},${errorMsg}\n`;
            totalGagal++;
            return true;
        });

        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const historyFile = file.create({
                name: `Transfer_History_${timestamp}.csv`,
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: 11846
            });

            const fileId = historyFile.save();
            log.audit('History Tersimpan', `File history CSV berhasil dibuat dengan ID: ${fileId}. Total Sukses: ${totalSukses}, Total Gagal: ${totalGagal}`);
        } catch (e) {
            log.error('Gagal membuat file history CSV', e.message);
        }
    };

    // Return functions agar dikenali oleh NetSuite Map/Reduce
    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});