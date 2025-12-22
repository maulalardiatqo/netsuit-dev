/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/runtime'], function (runtime) {

    var PREFERRED_VIEW = 'Data PR to PO'; 

    function pageInit() {
        waitForViewInput();
        observeDropdown();
    }

    function waitForViewInput() {
        var retry = 20;
        var interval = setInterval(function () {
            var viewInput = document.querySelector('input[name="inpt_searchid"]');

            if (viewInput) {
                clearInterval(interval);
                handleViewInput(viewInput);
            }

            retry--;
            if (retry <= 0) clearInterval(interval);
        }, 300);
    }

    function handleViewInput(viewInput) {
        if (viewInput.value === 'Default') {
            viewInput.value = PREFERRED_VIEW;
            viewInput.title = PREFERRED_VIEW;

            // trigger internal NS handler
            viewInput.dispatchEvent(new Event('change', { bubbles: true }));
            viewInput.dispatchEvent(new Event('blur', { bubbles: true }));
        }
    }

    // 2️⃣ Hapus "Default" dari dropdown popup
    function observeDropdown() {
        var observer = new MutationObserver(function () {
            var items = document.querySelectorAll('div.dropdownDiv div');

            items.forEach(function (item) {
                if (item.textContent.trim() === 'Default') {
                    item.style.display = 'none';
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    return {
        pageInit: pageInit
    };
});
