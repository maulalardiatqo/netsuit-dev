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
            btnRejectSec.style.display = 'none';
        }
        const btnRejectBill = document.getElementById('tr_custpageworkflow286');
        if(btnRejectBill){
            btnRejectBill.style.display = 'none';
        }
        // const btnRejectBill2 = document.getElementById('tr_custpageworkflow291');
        // if(btnRejectBill2){
        //     btnRejectBill2.style.display = 'none';
        // }
        const btnApprovBill = document.getElementById('tr_custpageworkflow299');
        if(btnApprovBill){
            btnApprovBill.style.display = 'none';
        }
        const btnApprovBillSec = document.getElementById('tr_secondarycustpageworkflow299');
        if(btnApprovBillSec){
            btnApprovBillSec.style.display = 'none';
        }
        const btnRejectBillSec = document.getElementById('tr_secondarycustpageworkflow286');
        if(btnRejectBillSec){
            btnRejectBillSec.style.display = 'none';
        }
        //  const btnRejectBillSec2 = document.getElementById('tr_secondarycustpageworkflow291');
        // if(btnRejectBillSec2){
        //     btnRejectBillSec2.style.display = 'none';
        // }
        // TAR
        const btnAppTAR = document.getElementById('custpageworkflow545')
        if(btnAppTAR){
            btnAppTAR.style.display = 'none';
        }
        const btnAppTarSec = document.getElementById('secondarycustpageworkflow545');
        if(btnAppTarSec){
            btnAppTarSec.style.display = 'none';
        }
        const btnRecTAR = document.getElementById('custpageworkflow544');
        if(btnRecTAR){
            btnRecTAR.style.display = 'none';
        }
        const btnRecTARsec = document.getElementById('secondarycustpageworkflow544');
        if(btnRecTARsec){
            btnRecTARsec.style.display = 'none';
        }
        // TER
        const btnAppTer = document.getElementById('custpageworkflow1128');
        if(btnAppTer){
            btnAppTer.style.display = 'none';
        }
        const btnAppTerSec = document.getElementById('secondarycustpageworkflow1128');
        if(btnAppTerSec){
            btnAppTerSec.style.display = 'none';
        }

        const btnRejTer = document.getElementById('custpageworkflow1151');
        if(btnRejTer){
            btnRejTer.style.display = 'none';
        }
         const btnRejTerSec = document.getElementById('secondarycustpageworkflow1151');
        if(btnRejTerSec){
            btnRejTerSec.style.display = 'none';
        }
        // approval FA
        const btnAppFA = document.getElementById('custpageworkflow292');
        console.log('btnAppFA', btnAppFA)
        if(btnAppFA){
            btnAppFA.style.display = 'none';
        }
        const btnRejFA = document.getElementById('custpageworkflow291');
        if(btnRejFA){
            btnRejFA.style.display = 'none';
        }
        const btnAppFASec = document.getElementById('secondarycustpageworkflow292');
        if(btnAppFASec){
            btnAppFASec.style.display = 'none';
        }
        const btnRejFASec = document.getElementById('secondarycustpageworkflow291');
        if(btnRejFASec){
            btnRejFASec.style.display = 'none';
        }

        // expense report
        const btnAppExp = document.getElementById('custpageworkflow340');
        if(btnAppExp){
            btnAppExp.style.display = 'none';
        }
        const btnRejExp = document.getElementById('custpageworkflow341');
        if(btnRejExp){
            btnRejExp.style.display = 'none';
        }
        const btnAppExpSec = document.getElementById('secondarycustpageworkflow340');
        if(btnAppExpSec){
            btnAppExpSec.style.display = 'none';
        }
        const btnRejSec = document.getElementById('secondarycustpageworkflow341');
        if(btnRejSec){
            btnRejSec.style.display = 'none';
        }
        const btnAppExpFa = document.getElementById('custpageworkflow957');
        if(btnAppExpFa){
            btnAppExpFa.style.display = 'none';
        }
        const btnRejExpFa = document.getElementById('custpageworkflow958');
        if(btnRejExpFa){
            btnRejExpFa.style.display = 'none';
        }
        const btnAppExpFaSec = document.getElementById('secondarycustpageworkflow957');
        if(btnAppExpFaSec){
            btnAppExpFaSec.style.display = 'none';
        }
        const btnRejExpFaSec = document.getElementById('secondarycustpageworkflow958');
        if(btnRejExpFaSec){
            btnRejExpFaSec.style.display = 'none';
        }

        // PR
        const btnAppPR = document.getElementById('custpageworkflow879');
        console.log('btnAppPR', btnAppPR)
        if(btnAppPR){
            btnAppPR.style.display = 'none';
        }
        const btnRejPr = document.getElementById('custpageworkflow880');
        if(btnRejPr){
            btnRejPr.style.display = 'none';
        }
        const btnAppPRSec = document.getElementById('secondarycustpageworkflow879');
        if(btnAppPRSec){
            btnAppPRSec.style.display = 'none';
        }
        const btnRejPrSec = document.getElementById('secondarycustpageworkflow880');
        if(btnRejPrSec){
            btnRejPrSec.style.display = 'none';
        }

        const btnAppFAPR = document.getElementById('custpageworkflow885');
         if(btnAppFAPR){
            btnAppFAPR.style.display = 'none';
        }
        const btnRejFAPR = document.getElementById('custpageworkflow886');
         if(btnRejFAPR){
            btnRejFAPR.style.display = 'none';
        }
        const btnAppFAPRSec = document.getElementById('secondarycustpageworkflow885');
         if(btnAppFAPRSec){
            btnAppFAPRSec.style.display = 'none';
        }
        const btnRejFAPRSec = document.getElementById('secondarycustpageworkflow886');
         if(btnRejFAPRSec){
            btnRejFAPRSec.style.display = 'none';
        }

        // TAR
        const appTAR = document.getElementById('custpageworkflow1111');
        console.log('appTAR', appTAR)
        if (appTAR) {
            appTAR.style.display = 'none';
        }
        const rejTAR = document.getElementById('custpageworkflow1125');
        console.log('rejTAR', rejTAR)
        if (rejTAR) {
            rejTAR.style.display = 'none';
        }
        const appSecTAR = document.getElementById('secondarycustpageworkflow1111');
        console.log('appSecTAR', appSecTAR)
        if (appSecTAR) {
            appSecTAR.style.display = 'none';
        }
        const rejSecTAR = document.getElementById('secondarycustpageworkflow1125');
        console.log('rejSecTAR', rejSecTAR)
        if (rejSecTAR) {
            rejSecTAR.style.display = 'none';
        }

        // TOR
        const btnAppFATOR = document.getElementById('custpageworkflow1184');
         if (btnAppFATOR) {
            btnAppFATOR.style.display = 'none';
        }
        const btnRejFATOR = document.getElementById('custpageworkflow1185');
         if (btnRejFATOR) {
            btnRejFATOR.style.display = 'none';
        }
        const btnSecAppFATOR = document.getElementById('secondarycustpageworkflow1184');
         if (btnSecAppFATOR) {
            btnSecAppFATOR.style.display = 'none';
        }
        const btnSecRejFATOR = document.getElementById('secondarycustpageworkflow1185');
         if (btnSecRejFATOR) {
            btnSecRejFATOR.style.display = 'none';
        }

        const btnAppTOR = document.getElementById('custpageworkflow1186');
        if (btnAppTOR) {
            btnAppTOR.style.display = 'none';
        }
        const btnRejTOR = document.getElementById('custpageworkflow1187');
        if (btnRejTOR) {
            btnRejTOR.style.display = 'none';
        }
        const btnSecAppTOR = document.getElementById('secondarycustpageworkflow1186');
        if (btnSecAppTOR) {
            btnSecAppTOR.style.display = 'none';
        }
        const btnSecRejTOR = document.getElementById('secondarycustpageworkflow1187');
        if (btnSecRejTOR) {
            btnSecRejTOR.style.display = 'none';
        }

        // PO finance
        const btnAppFinPO = document.getElementById('custpageworkflow1438');
        if (btnAppFinPO) {
            btnAppFinPO.style.display = 'none';
        }
        const btnRejFinPO = document.getElementById('custpageworkflow1439');
        if (btnRejFinPO) {
            btnRejFinPO.style.display = 'none';
        }
        const btnAppFinPOSec = document.getElementById('secondarycustpageworkflow1438');
        if (btnAppFinPOSec) {
            btnAppFinPOSec.style.display = 'none';
        }
        const btnRejFinPOSec = document.getElementById('secondarycustpageworkflow1439');
        if (btnRejFinPOSec) {
            btnRejFinPOSec.style.display = 'none';
        }

         const btnAppReqPO = document.getElementById('custpageworkflow1757');
        if (btnAppReqPO) {
            btnAppReqPO.style.display = 'none';
        }
        const btnRejbtnAppReqPO= document.getElementById('custpageworkflow1770');
        if (btnRejbtnAppReqPO) {
            btnRejbtnAppReqPO.style.display = 'none';
        }
        const btnAppbtnAppReqPOSec = document.getElementById('secondarycustpageworkflow1757');
        if (btnAppbtnAppReqPOSec) {
            btnAppbtnAppReqPOSec.style.display = 'none';
        }
        const btnRejbtnAppReqPOSec = document.getElementById('secondarycustpageworkflow1770');
        if (btnRejbtnAppReqPOSec) {
            btnRejbtnAppReqPOSec.style.display = 'none';
        }

        const btnAppReqPOFA = document.getElementById('custpageworkflow1764');
        if (btnAppReqPOFA) {
            btnAppReqPOFA.style.display = 'none';
        }
        const btnRejbtnAppReqPOFA= document.getElementById('custpageworkflow1765');
        if (btnRejbtnAppReqPOFA) {
            btnRejbtnAppReqPOFA.style.display = 'none';
        }
        const btnAppbtnAppReqPOSecFA = document.getElementById('secondarycustpageworkflow1764');
        if (btnAppbtnAppReqPOSecFA) {
            btnAppbtnAppReqPOSecFA.style.display = 'none';
        }
        const btnRejbtnAppReqPOSecFA = document.getElementById('secondarycustpageworkflow1765');
        if (btnRejbtnAppReqPOSecFA) {
            btnRejbtnAppReqPOSecFA.style.display = 'none';
        }

         const btnAppPO_1 = document.getElementById('custpageworkflow1818');
        if (btnAppPO_1) {
            btnAppPO_1.style.display = 'none';
        }
        const btnRejbtnAppReqPOFA_1= document.getElementById('custpageworkflow1805');
        if (btnRejbtnAppReqPOFA_1) {
            btnRejbtnAppReqPOFA_1.style.display = 'none';
        }
        const btnAppbtnAppReqPOSecFA_1 = document.getElementById('secondarycustpageworkflow1818');
        if (btnAppbtnAppReqPOSecFA_1) {
            btnAppbtnAppReqPOSecFA_1.style.display = 'none';
        }
        const btnRejbtnAppReqPOSecFA_1 = document.getElementById('secondarycustpageworkflow1805');
        if (btnRejbtnAppReqPOSecFA_1) {
            btnRejbtnAppReqPOSecFA_1.style.display = 'none';
        }
    const pageInit = () => {

    };
    return { pageInit };
});
