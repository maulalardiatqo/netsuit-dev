/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */

define(["N/task"], function(task) {
  function afterSubmit(context) {
    try {
      if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
        log.debug("Debug", 'after submit');
        var rec = context.newRecord;
        var id = rec.id;

        function executeScheduled() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeployafc_update_stock",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_2() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy6",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_3() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy7",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_4() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy4",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_5() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy5",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_6() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy2",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        function executeScheduled_7() {
          var scriptTask = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: "customscriptafc_update_stock_onhand",
            deploymentId: "customdeploy3",
            params: {
              "custscript_item_trans_id": id
            }
          });

          var scriptTaskId = scriptTask.submit();

          log.debug("scriptTaskId", scriptTaskId);
        }

        executeScheduled();
        executeScheduled_2();
        executeScheduled_3();
        executeScheduled_4();
        executeScheduled_5();
        executeScheduled_6();
        executeScheduled_7();
      }
    } catch (e) {
      err_messages = 'error in after submit ' + e.name + ': ' + e.message;
      log.debug(err_messages);
    }
  }

  return {
    afterSubmit: afterSubmit,
  };
});