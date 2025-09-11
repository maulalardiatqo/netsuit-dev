/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    const btn = document.getElementById('tr_custpageworkflow252');
        console.log('btn', btn)
        if (btn) {
            btn.style.display = 'none';
        }
        const btnSec = document.getElementById('tr_secondarycustpageworkflow252');
        if (btnSec) {
            btnSec.style.display = 'none';
        }
        

        

        const btnReject = document.getElementById('tr_custpageworkflow253');
        if(btnReject){
            btnReject.style.display = 'none';
        }
         const btnRejectSec = document.getElementById('tr_secondarycustpageworkflow253');
         console.log('btnRejectSec', btnRejectSec)
        if(btnRejectSec){
            // btnRejectSec.style.display = 'none';
        }
        const btnRejectBill = document.getElementById('tr_custpageworkflow286');
        if(btnRejectBill){
            btnRejectBill.style.display = 'none';
        }
        const btnApprovBill = document.getElementById('tr_custpageworkflow299');
        if(btnApprovBill){
            btnApprovBill.style.display = 'none';
        }
    const pageInit = () => {

    };
    return { pageInit };
});
