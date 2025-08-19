/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/runtime", "N/currentRecord"], 
function (runtime, currentRecord) {
    
    var financialTab = document.getElementById("financialtxt");
    if (financialTab) {
        financialTab.style.display = "none";
    }
    function pageInit(context) {
        console.log('pageInit mode:', context.mode);
        if (['create', 'edit', 'copy'].includes(context.mode)) {
        }
    }


    window.addEventListener("load", function() {
        console.log("window.onload triggered → view mode");
    });

    return {
        pageInit: pageInit
    };
});
