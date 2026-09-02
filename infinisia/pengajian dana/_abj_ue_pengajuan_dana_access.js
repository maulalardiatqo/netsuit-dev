/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/error", "N/record", "N/log"], function (runtime, error, record, log) {
  function beforeLoad(context) {
    if (context.type == context.UserEventType.VIEW) {
      try {
        var rec = context.newRecord;
        var currentUser = runtime.getCurrentUser();
        var currentUserId = currentUser.id;
        var currentUserRole = currentUser.role;

        var allowedRoles = [
          "1012", // ISS Finance SPV
          "1011", // ISS Accounting SPV
          "1009", // ISS Finance and accounting manager
          "1044", // ISS President Director
          "1083", // ISS - Finance Staff (KAS) (FR)
          "1010", // ISS - Finance Staff (KAS)
          "1028", // ISS - Operational Director
          "1076",
          "1077",
          "1081",
          "1083",
          "1084",
          "1079",
          "1078",
          "1085",
          "3", // Administrator
        ];

        var hasRoleAccess =
          allowedRoles.indexOf(currentUserRole.toString()) !== -1;

        // Jika punya role access, langsung izinkan
        if (hasRoleAccess) {
          log.debug("Access Granted", {
            currentUser: currentUserId,
            role: currentUserRole,
            reason: "Role has unlimited access",
          });
          return true;
        }

        // Jika tidak punya role access, cek apakah creator atau approver
        var creator = rec.getValue("custrecord_fund_employee");
        var approvalSpv = rec.getValue("custrecord_iss_approvalspv");
        var approvalFinance = rec.getValue("custrecord20");
        var approvalAccounting = rec.getValue("custrecord21");
        var approvalFinal = rec.getValue("custrecord22");

        // Cek apakah user adalah creator atau salah satu approver
        var isCreator = currentUserId == creator;
        var isApprovalSpv = currentUserId == approvalSpv;
        var isApprovalFinance = currentUserId == approvalFinance;
        var isApprovalAccounting = currentUserId == approvalAccounting;
        var isApprovalFinal = currentUserId == approvalFinal;

        var hasAccess =
          isCreator ||
          isApprovalSpv ||
          isApprovalFinance ||
          isApprovalAccounting ||
          isApprovalFinal;

        log.debug("Access Check", {
          currentUser: currentUserId,
          role: currentUserRole,
          creator: creator,
          hasAccess: hasAccess,
        });

        // Jika tidak punya akses, throw error
        if (!hasAccess) {
          var errorObj = error.create({
            code: "ACCESS_DENIED",
            message:
              "⚠️ Anda tidak memiliki akses untuk melihat transaksi ini.<br><br>",
          });

          throw errorObj.message;
        }
      } catch (e) {
        log.error("Error Access Validation", e);
        throw e;
      }
    }
  }

  function afterSubmit(context) {
    if (context.type == context.UserEventType.EDIT) {
      try {
        var rec = context.newRecord;
        var oldRec = context.oldRecord;

        var cekStatusOld = oldRec.getValue("custrecord_fund_approval");
        var cekStatusNew = rec.getValue("custrecord_fund_approval");

        log.debug("afterSubmit - approval check", {
          cekStatusOld: cekStatusOld,
          cekStatusNew: cekStatusNew,
        });

        // Hanya jalan saat approval berubah dari '1' ke '2'
        if (cekStatusOld == "1" && cekStatusNew == "2") {
          var recordCust = record.load({
            type: "customrecord_request_for_fund",
            id: rec.id,
          });

          var idJe = recordCust.getValue("custrecord_link_journal_entry");
          var summaryStatus = recordCust.getValue("custrecord18");
          var nomorVoucher = recordCust.getValue("custrecord28");

          log.debug("afterSubmit - check Nomor Voucher", {
            idJe: idJe,
            summaryStatus: summaryStatus,
            nomorVoucher: nomorVoucher,
          });

          // Update tranid JE jika Full Approved dan Nomor Voucher terisi
          if (idJe && summaryStatus == "Full Approved" && nomorVoucher) {
            var recJe = record.load({
              type: "journalentry",
              id: idJe,
            });
            recJe.setValue({
              fieldId: "tranid",
              value: nomorVoucher,
            });
            recJe.save();

            log.debug("tranid JE updated", {
              idJe: idJe,
              tranid: nomorVoucher,
            });
          }
        }
      } catch (e) {
        log.error("Error afterSubmit - update tranid JE", e);
      }
    }
  }

  return {
    beforeLoad: beforeLoad,
    afterSubmit: afterSubmit,
  };
});