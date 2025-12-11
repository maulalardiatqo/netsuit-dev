/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/record', 'N/search', 'N/ui/dialog', 'N/currentRecord', 'N/url', 'N/ui/message'], function(record, search, dialog, currentRecord, url, message) {
    function printPengajuan() {
        var records = currentRecord.get();
        console.log("test in function");
        var id = records.id;
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_pengajuan_dana',
            deploymentId: 'customdeploy_abj_sl_print_pengajuan_dana',
            returnExternalUrl: false
        })
        console.log("id",id);
        console.log("urlpdf", createPDFURL);
        createPDFURL += '&id=' +  id;
            if (createPDFURL) {
                newWindow = window.open(createPDFURL);
            }
    }
    function saveRecord(context) {
        var rec = context.currentRecord;
        var cekApprovalLevel = rec.getValue('custrecord_approval_level');
        console.log('cekApprovalLevel', cekApprovalLevel)
        if(cekApprovalLevel && cekApprovalLevel.includes('Pending Setup COA')){
            console.log('masuk kondisi')
            var cekLine = rec.getLineCount({
                sublistId : 'recmachcustrecord_fund_journal'
            })
            console.log('cekLine', cekLine)
            if(cekLine <= 0){
                alert('please fill journal tab');
                return false
            }else{
                var totalAmountJournal = 0
                var totalAMountHead = rec.getValue('custrecord_fund_total_amt_realisasi')
                var totalDebit = 0;
                var totalCredit = 0;
                for(var i = 0; i < cekLine; i++){
                    var debitAmt = rec.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_j_debit',
                        line : i
                    })
                    if(debitAmt){
                        totalDebit = Number(totalDebit) + Number(debitAmt)
                    }
                    var credit = rec.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_credit',
                        line : i
                    })
                    if(credit){
                        totalCredit = Number(totalCredit) + Number(credit)
                    }
                }
                if(totalDebit != totalCredit){
                    alert('total Debit And Total Credit Must Balance');
                    return false
                }else{
                    if(totalAMountHead != totalDebit){
                        alert('total amount in journal must balance with total amount Realisasi');
                        return false
                    }else{
                        return true
                    }
                }
            }
            
        }
        return true
    }
    function deleteRecord(){
        var confirmDelete = confirm("Apakah Anda yakin ingin menghapus semua data ini?");
        if (!confirmDelete) {
            return; // user cancel
        }
        console.log('triggered')
        var processMsg = message.create({
            title: "Processing",
            message: "On Process. Please wait...",
            type: message.Type.INFORMATION
        });
        processMsg.show();

        setTimeout(function () {

            try {
                var recs = currentRecord.get();
                var id = recs.id;

                var records = record.load({
                    type: 'customrecord_request_for_fund',
                    id: id
                });

                // Ambil child line
                var allIdLine = [];
                var lineReq = records.getLineCount({
                    sublistId: 'recmachcustrecord_fund_head'
                });

                for (var i = 0; i < lineReq; i++) {
                    var idLine = records.getSublistValue({
                        sublistId: 'recmachcustrecord_fund_head',
                        fieldId: 'id',
                        line: i
                    });
                    allIdLine.push(idLine);
                }

                // Ambil journal line
                var allJournalLine = [];
                var journalReq = records.getLineCount({
                    sublistId: 'recmachcustrecord_fund_journal'
                });

                for (var j = 0; j < journalReq; j++) {
                    var idJournal = records.getSublistValue({
                        sublistId: 'recmachcustrecord_fund_journal',
                        fieldId: 'id',
                        line: j
                    });
                    allJournalLine.push(idJournal);
                }

                // Delete anak line
                allIdLine.forEach(function (cid) {
                    try {
                        record.delete({
                            type: 'customrecord_line_request_fund',
                            id: cid
                        });
                    } catch (e) {
                        console.log("Error delete child: ", e);
                    }
                });

                // Delete journal line
                allJournalLine.forEach(function (jid) {
                    try {
                        record.delete({
                            type: 'customrecord_fund_journal_tab',
                            id: jid
                        });
                    } catch (e) {
                        console.log("Error delete journal: ", e);
                    }
                });

                // Delete parent record
                record.delete({
                    type: 'customrecord_request_for_fund',
                    id: id
                });

                // --- HIDE PROCESSING AND SHOW SUCCESS ---
                processMsg.hide();

                var doneMsg = message.create({
                    title: "Completed",
                    message: "Selesai menghapus record!",
                    type: message.Type.CONFIRMATION
                });
                doneMsg.show();

                setTimeout(function () {
                    doneMsg.hide();
                    window.location.reload();
                }, 2000);

            } catch (err) {

                processMsg.hide();

                var errorMsg = message.create({
                    title: "Error",
                    message: "Terjadi error: " + err,
                    type: message.Type.ERROR
                });
                errorMsg.show();

                setTimeout(function () {
                    errorMsg.hide();
                }, 4000);
            }

        }, 300); 
    }
    return{
        saveRecord : saveRecord,
        printPengajuan : printPengajuan,
        deleteRecord : deleteRecord
    }
})