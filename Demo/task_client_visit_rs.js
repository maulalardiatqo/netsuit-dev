/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/record", "N/file", "N/https", "N/runtime", "N/format"], /**
 * @param {search} search
 * @param {record} record
 * @param {file} file
 * @param {https} https
 * @param {runtime} runtime
 */ function (search, record, file, https, runtime, format) {
  /**
   * Function called upon sending a GET request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.1
   */

  function convertTo24Hour(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (modifier === "pm" && hours !== "12") {
      hours = parseInt(hours, 10) + 12;
    } else if (modifier === "am" && hours === "12") {
      hours = "00";
    }

    return `${hours}:${minutes}`;
  }

  const padDate = (dateTimeString) => {
    const [datePart, timePart] = dateTimeString.split("T");
    const [year, month, day] = datePart.split("-").map((part) => part.padStart(2, "0"));
    const [hours, minutes, seconds] = timePart.split(":").map((part) => part.padStart(2, "0"));
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  function generateUniqueImageName(fileType) {
    // Generate a timestamp string
    var timestamp = new Date().getTime();

    // Generate a unique identifier (e.g., a random number)
    var uniqueIdentifier = Math.floor(Math.random() * 1000000);

    // Combine timestamp and unique identifier to create a unique name
    var uniqueName = timestamp + "_" + uniqueIdentifier;

    // Determine the file extension based on the original file type
    var fileExtension = "";
    if (fileType.indexOf("jpeg") !== -1) {
      fileExtension = ".jpeg";
    } else if (fileType.indexOf("jpg") !== -1) {
      fileExtension = ".jpg";
    } else if (fileType.indexOf("png") !== -1) {
      fileExtension = ".png";
    } else {
      // Default to '.png' if the file type is not recognized
      fileExtension = ".png";
    }

    // Combine the unique name and file extension
    var uniqueFileName = uniqueName + fileExtension;

    return uniqueFileName;
  }

  function formatTimeOfDay(dateStr) {
    d = new Date();
    dateParts = dateStr.split(":");
    d.setHours(+dateParts[0]);
    d.setMinutes(+dateParts[1]);
    return d;
  }

  function calcCrow(coords1, coords2) {
    var R = 6371000; // Earth's radius in meters
    var dLat = toRad(coords2.lat - coords1.lat);
    var dLon = toRad(coords2.lng - coords1.lng);
    var lat1 = toRad(coords1.lat);
    var lat2 = toRad(coords2.lat);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }

  // Converts numeric degrees to radians
  function toRad(Value) {
    return (Value * Math.PI) / 180;
  }

  function saveJPEGFile(fileName, fileContents) {
    if (fileContents.startsWith("data:image/jpeg;base64")) fileContents = fileContents.substring("data:image/jpeg;base64,".length);

    log.debug("saving file:", `${fileName} : ${fileContents.length} : ${fileContents}`);
    var fileObj = file.create({
      name: fileName,
      fileType: file.Type.JPGIMAGE,
      contents: fileContents,
      folder: 5531,
    });
    fileObj.isOnline = true;
    var fileId = fileObj.save();
    log.debug("file", fileId);
    return fileId;
  }

  function login_email(data) {
    var dataObject = {};
    try {
      var emailInput = data.email;
      var passwordInput = data.password;
      var success = true;
      var employee_photoSearchObj = search.create({
        type: "employee",
        filters: [["email", "is", emailInput]],
        columns: ["internalid", "email", "image", "firstname", "custentity_mobile_access_code"],
      });
      var searchResultCount = employee_photoSearchObj.runPaged().count;
      if (searchResultCount > 0) {
        employee_photoSearchObj.run().each(function (result) {
          let internalID = result.getValue("internalid");
          let imageID = result.getValue("image");
          let firstName = result.getValue("firstname");
          let password = result.getValue("custentity_mobile_access_code");
          if (passwordInput == password) {
            dataObject = {
              empid: internalID,
              firstName: firstName,
            };
          } else {
            success = false;
          }
        });
        if (success) {
          var response = {
            status: "success",
            data: dataObject,
            message: "Email Registered",
          };
        } else {
          var response = {
            status: "failed",
            message: "Access Code Not Match, please contact your account administrator.",
          };
        }
      } else {
        var response = {
          status: "failed",
          message: "Email Not Registered",
        };
      }

      return JSON.stringify(response);
    } catch (e) {
      log.debug("ERROR", "Error : " + e);
      var response = {
        status: "failed",
        message: e,
      };
      return JSON.stringify(response);
    }
  }

  function create_report_visit(data) {
    var dataObject = {};
    try {
      var taskIDInput = data.taskid;
      var empIDInput = data.empid;
      var customerIDInput = data.customerid;
      var statusInput = data.status;
      var satisfiedInput = data.satisfied;
      var caseInput = data.caseid;
      var projectInput = data.projectid;
      var latitudeInput = data.latitude;
      var longitudeInput = data.longitude;
      var descriptionInput = data.description;
      var frImage = data.fr_image;
      var frImagebase64 = data.fr_image_content;
      var internalID = 0;
      var customrecord_task_client_visitSearchObj = search.create({
        type: "customrecord_task_client_visit",
        filters: [["custrecord_tcv_customer_id", "anyof", customerIDInput], "AND", ["custrecord_tcv_task_id", "anyof", taskIDInput]],
        columns: ["internalid", "custrecord_tcv_task_id", "custrecord_tcv_customer_id", "custrecord_tcv_status", "custrecord_tcv_date", "custrecord_tcv_latitude", "custrecord_tcv_longitude", "custrecord_tcv_desc"],
      });
      customrecord_task_client_visitSearchObj.run().each(function (result) {
        internalID = result.getValue("internalid");
      });
      log.debug("internalid", internalID);
      if (internalID == 0) {
        var dataTrans = record.create({
          type: "customrecord_task_client_visit",
          isDynamic: true,
        });
      } else {
        var dataTrans = record.load({
          type: "customrecord_task_client_visit",
          id: internalID,
          isDynamic: true,
        });
      }
      dataTrans.setValue({
        fieldId: "custrecord_tcv_task_id",
        value: taskIDInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_customer_id",
        value: customerIDInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_status",
        value: statusInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_date",
        value: new Date(),
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_latitude",
        value: latitudeInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_employee",
        value: empIDInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_longitude",
        value: longitudeInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_desc",
        value: descriptionInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_is_satisfied",
        value: satisfiedInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_case",
        value: caseInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_tcv_project",
        value: projectInput,
        ignoreFieldChange: true,
      });
      if (frImage) {
        var fileURL = saveJPEGFile(frImage, frImagebase64);
        log.debug("fileURL", fileURL);
        dataTrans.setValue({
          fieldId: "custrecord_tcv_photo",
          value: fileURL,
          ignoreFieldChange: true,
        });
      }
      var saveData = dataTrans.save();

      // cek total customer done
      var customrecord_task_client_visitSearchObj2 = search.create({
        type: "customrecord_task_client_visit",
        filters: [["custrecord_tcv_task_id", "anyof", taskIDInput]],
        columns: ["custrecord_tcv_task_id"],
      });
      var totalTaskDoneVisit = customrecord_task_client_visitSearchObj2.runPaged().count;
      log.debug("customrecord_task_client_visitSearchObj2 result count", totalTaskDoneVisit);
      // end cek total customer done
      // cek total customer to visit on task
      var taskData = record.load({
        type: "task",
        id: taskIDInput,
        isDynamic: false,
      });
      var lineTotalToVisit = taskData.getLineCount({
        sublistId: "contact",
      });
      // end cek total customer to visit on task

      log.debug("lineTotalToVisit", {
        lineTotalToVisit: lineTotalToVisit,
        totalTaskDoneVisit: totalTaskDoneVisit,
      });
      if (lineTotalToVisit == totalTaskDoneVisit) {
        taskData.setValue({
          fieldId: "status",
          value: "COMPLETE",
          ignoreFieldChange: true,
        });
        taskData.save();
      }

      var response = {
        status: "success",
        message: "Record Successfully saved",
      };
      return JSON.stringify(response);
    } catch (e) {
      log.debug("ERROR", "Error : " + e);
      var response = {
        status: "failed",
        message: e,
      };
      return JSON.stringify(response);
    }
  }

  function create_case(data) {
    var dataObject = {};
    try {
      var subjectInput = data.subject;
      var companyInput = data.company;
      var messageInput = data.message;
      var dataTrans = record.create({
        type: "supportcase",
        isDynamic: false,
      });
      dataTrans.setValue({
        fieldId: "title",
        value: subjectInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "company",
        value: companyInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "incomingmessage",
        value: messageInput,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "profile",
        value: "2",
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "emailform",
        value: false,
        ignoreFieldChange: true,
      });

      var saveData = dataTrans.save();
      if (saveData) {
        var response = {
          status: "success",
          message: "Record Successfully saved",
          internalid: saveData,
        };
      } else {
        var response = {
          status: "Error",
          message: "Record Unsuccessfully saved",
          internalid: 0,
        };
      }

      return JSON.stringify(response);
    } catch (e) {
      log.debug("ERROR", "Error : " + e);
      var response = {
        status: "failed",
        message: e,
      };
      return JSON.stringify(response);
    }
  }

  function getTasks(empID) {
    try {
      var dataTasks = [];
      var response = [];
      var taskSearchObj = search.create({
        type: "task",
        filters: [["status", "anyof", "PROGRESS", "NOTSTART"], "AND", ["assigned", "anyof", empID]],
        columns: [
          search.createColumn({
            name: "order",
            sort: search.Sort.ASC,
          }),
          "internalid",
          "title",
          "priority",
          "status",
          "startdate",
          "duedate",
          "accesslevel",
          "assigned",
          "company",
          "message",
        ],
      });
      var searchResultCount = taskSearchObj.runPaged().count;
      log.debug("taskSearchObj result count", searchResultCount);
      taskSearchObj.run().each(function (result) {
        let internalid = result.getValue("internalid");
        let title = result.getValue("title");
        let priority = result.getValue("priority");
        let status = result.getValue("status");
        let duedate = result.getValue("duedate");
        dataTasks.push({
          internalid: internalid,
          taskTitle: title,
          taskPriority: priority,
          taskStatus: status,
          taskDueDate: duedate,
        });
        return true;
      });
      var response = {
        status: "success",
        data: dataTasks,
        total: searchResultCount,
        message: null,
      };
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  function getListProject(empID) {
    try {
      var dataTasks = [];
      var response = [];
      var customrecord_cseg3SearchObj = search.create({
        type: "customrecord_cseg4",
        filters: [],
        columns: ["name", "internalid"],
      });
      var searchResultCount = customrecord_cseg3SearchObj.runPaged().count;
      log.debug("customrecord_cseg3SearchObj result count", searchResultCount);
      customrecord_cseg3SearchObj.run().each(function (result) {
        let internalID = result.getValue("internalid");
        let projectName = result.getValue("name");
        dataTasks.push({
          internalid: internalID,
          name: projectName,
        });
        return true;
      });
      var response = {
        status: "success",
        data: dataTasks,
        total: searchResultCount,
        message: null,
      };
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  function getTasksCompany(taskID) {
    try {
      var dataCompany = [];
      var response = [];
      var customerData = [];
      var taskData = record.load({
        type: "task",
        id: taskID,
        isDynamic: false,
      });
      var lineTotal = taskData.getLineCount({
        sublistId: "contact",
      });
      for (var i = 0; i < lineTotal; i++) {
        var customerID = taskData.getSublistValue({
          sublistId: "contact",
          fieldId: "company",
          line: i,
        });
        customerData.push(customerID);
      }
      var customerSearchObj = search.create({
        type: "customer",
        filters: [["internalid", "anyof", customerData], "AND", ["isdefaultbilling", "is", "T"]],
        columns: ["internalid", "entityid", "companyname", "email", "phone", "altphone", "fax", "contact", "address", "addressee", "address1", "address2", "address3", "city", "zipcode", "country", "state"],
      });
      customerSearchObj.run().each(function (result) {
        var internalid = result.getValue("internalid");
        var addressee = result.getValue("addressee");
        var address = result.getValue("address");
        var entityid = result.getValue("entityid");
        var altname = result.getValue("companyname");
        var email = result.getValue("email");
        var phone = result.getValue("phone");
        var modifiedAddress = address.replace(addressee, "");
        modifiedAddress = modifiedAddress.replace(/\n/g, " ");
        dataCompany.push({
          internalid: internalid,
          companyName: altname,
          companyPhone: phone,
          companyEmail: email,
          companyEntityId: entityid,
          companyAddress: modifiedAddress.trim(),
        });
        return true;
      });

      var response = {
        status: "success",
        data: dataCompany,
        message: null,
      };
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  function getCompanyDetail(companyID) {
    var dataObject = {};
    try {
      var customerSearchObj = search.create({
        type: "customer",
        filters: [["internalid", "anyof", companyID], "AND", ["isdefaultbilling", "is", "T"]],
        columns: ["internalid", "entityid", "companyname", "email", "phone", "altphone", "fax", "contact", "address", "addressee", "address1", "address2", "address3", "city", "zipcode", "country", "state"],
      });
      customerSearchObj.run().each(function (result) {
        var internalid = result.getValue("internalid");
        var addressee = result.getValue("addressee");
        var address = result.getValue("address");
        var entityid = result.getValue("entityid");
        var altname = result.getValue("companyname");
        var email = result.getValue("email");
        var phone = result.getValue("phone");
        var modifiedAddress = address.replace(addressee, "");
        modifiedAddress = modifiedAddress.replace(/\n/g, " ");
        dataObject = {
          internalid: internalid,
          companyName: altname,
          companyPhone: phone,
          companyEmail: email,
          companyEntityId: entityid,
          companyAddress: modifiedAddress.trim(),
        };
      });
      var response = {
        status: "success",
        data: dataObject,
        message: null,
      };
      return JSON.stringify(response);
    } catch (error) {
      return JSON.stringify(error);
    }
  }

  function doGet(requestParams) {
    try {
      var record_type = requestParams.record_type;
      var empID = requestParams.empid;
      var taskID = requestParams.taskid;
      var companyID = requestParams.companyid;
      if (record_type === "tasks") return getTasks(empID);
      else if (record_type === "tasksCompany") return getTasksCompany(taskID);
      else if (record_type === "companyDetail") return getCompanyDetail(companyID);
      else if (record_type === "listProject") return getListProject();
      else return JSON.stringify("No record type selected");
    } catch (e) {
      log.debug("Error Get Method : ", e);
    }
  }

  /**
   * Function called upon sending a PUT request to the RESTlet.
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPut(requestBody) {}

  /**
   * Function called upon sending a POST request to the RESTlet.
   *
   * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
   * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doPost(requestBody) {
    if (requestBody.type === "login_email") {
      log.debug("login_email", true);
      return login_email(requestBody.data);
    } else if (requestBody.type === "create_report_visit") {
      log.debug("create_report_visit", true);
      return create_report_visit(requestBody.data);
    } else if (requestBody.type === "create_case") {
      log.debug("create_case", true);
      return create_case(requestBody.data);
    }
  }

  /**
   * Function called upon sending a DELETE request to the RESTlet.
   *
   * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
   * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
   * @since 2015.2
   */
  function doDelete(requestParams) {}

  return {
    get: doGet,
    put: doPut,
    post: doPost,
    delete: doDelete,
  };
});
