/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
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
        const pageInit = () => {

        };
        return { pageInit };
});
