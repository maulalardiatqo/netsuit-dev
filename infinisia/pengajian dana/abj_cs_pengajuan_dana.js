/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
        const customLink = document.getElementById('recmachcustrecord_fund_journaltxt');
        const SUBLIST_ID = 'recmachcustrecord_fund_head';
        console.log('customLink', customLink)
        if (customLink) {
            customLink.style.display = 'none';
        }
        const cssStyles = `
                    /* 1. Sembunyikan Link "Edit" (sesuai snippet HTML Anda) */
                    /* Kita targetkan class 'dottedlink' KHUSUS di dalam tabel sublist ini */
                    #${SUBLIST_ID}_splits a.dottedlink {
                        display: none !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }

                    /* 2. Sembunyikan Text "Remove" / "Delete" */
                    /* Biasanya Remove juga memakai class dottedlink atau struktur serupa */
                    #${SUBLIST_ID}_splits .listdelprop,
                    #${SUBLIST_ID}_splits a[onclick*="delete"] {
                        display: none !important;
                    }

                    /* 3. Sembunyikan Tombol Header (New & Attach) */
                    #${SUBLIST_ID}_buttons, #${SUBLIST_ID}_add, #${SUBLIST_ID}_attach {
                        display: none !important;
                    }

                    /* 4. Sembunyikan Link/Label Judul (Request sebelumnya) */
                    #recmachcustrecord_fund_journaltxt {
                        display: none !important;
                    }
                `;

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = cssStyles;
        document.head.appendChild(styleSheet);
   const pageInit = () => {

    };
    return { pageInit };
});
