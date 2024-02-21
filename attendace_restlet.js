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
      folder: 43,
    });
    fileObj.isOnline = true;
    var fileId = fileObj.save();
    log.debug("file", fileId);
    return fileId;
  }

  function work_pattern_employee(empID, day) {
    try {
      var filterData = [];
      var dataObject = {};
      var response = [];
      var customrecord_abj_work_pattern_detailsSearchObj = search.create({
        type: "customrecord_abj_work_pattern_details",
        filters: [["custrecord_wpd_wp_id.custrecord_wp_list_employee", "anyof", empID], "AND", ["custrecord_wpd_day", "is", day]],
        columns: ["custrecord_wpd_day", "custrecord_wpd_status", "custrecord_wpd_timein", "custrecord_wpd_timeout", "custrecord_wpd_type"],
      });
      var searchResultCount = customrecord_abj_work_pattern_detailsSearchObj.runPaged().count;
      customrecord_abj_work_pattern_detailsSearchObj.run().each(function (result) {
        var typeWork = result.getValue("custrecord_wpd_type");
        var timeIN = result.getValue("custrecord_wpd_timein");
        var timeOUT = result.getValue("custrecord_wpd_timeout");

        dataObject = {
          type_work: typeWork,
          time_in: timeIN,
          time_out: timeOUT,
        };
        return true;
      });
      var response = {
        status: "success",
        data: dataObject,
        message: null,
      };
      return JSON.stringify(response);
    } catch (e) {
      return JSON.stringify(e);
    }
  }

  function validate_attendance(empID) {
    try {
      var filterData = [];
      var dataObject = {};
      var response = [];

      var customrecord_abj_locationSearchObj = search.create({
        type: "customrecord_abj_location",
        filters: [["custrecord_ol_list_employee", "anyof", empID]],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
          }),
          "custrecord_ol_address",
          "custrecord_ol_radius",
          "custrecord_ol_latitude",
          "custrecord_ol_longitude",
        ],
      });
      var searchResultCount = customrecord_abj_locationSearchObj.runPaged().count;
      log.debug("customrecord_abj_locationSearchObj result count", searchResultCount);
      customrecord_abj_locationSearchObj.run().each(function (result) {
        radius = result.getValue("custrecord_ol_radius");
        let lat = result.getValue("custrecord_ol_latitude");
        let lng = result.getValue("custrecord_ol_longitude");
        let coords1 = {
          lat: lat,
          lng: lng,
        };
        let coords2 = {
          lat: latitudeCoordinat,
          lng: longitudeCoordinat,
        };
        log.debug("coords1", coords1);
        log.debug("coords2", coords2);
        distance = calcCrow(coords1, coords2);
        address = result.getValue("custrecord_ol_address");
        return true;
      });
      log.debug("distance", {
        distance: distance,
        radius: radius,
      });
      if (distance >= radius) {
        var response = {
          status: "warning",
          message: `You are not within the radius of the office location. Make sure you are within ${radius} meters radius of ${address}`,
        };
        return JSON.stringify(response);
      }
      var response = {
        status: "success",
        data: dataObject,
        message: null,
      };
      return JSON.stringify(response);
    } catch (e) {
      var response = {
        status: "failed",
        message: e.message,
      };
      return JSON.stringify(response);
    }
  }

  function get_employee(empID) {
    try {
      var filterData = [];
      var dataObject = {};
      var response = [];

      var employeeSearchObj = search.create({
        type: "customrecord_employee_photo",
        filters: [["custrecord_ep_emp", "anyof", empID]],
        columns: [
          "custrecord_ep_photo",
          "custrecord_ep_fr_code",
          search.createColumn({
            name: "firstname",
            join: "CUSTRECORD_EP_EMP",
          }),
        ],
      });
      employeeSearchObj.run().each(function (result) {
        var image = result.getValue("custrecord_ep_photo");
        var frCode = result.getValue("custrecord_ep_fr_code");
        var firstName = result.getValue({
          name: "firstname",
          join: "CUSTRECORD_EP_EMP",
        });
        dataObject = {
          image: image,
          frCode: frCode,
          empid: empID,
          firstName: firstName,
        };

        if (image) {
          var fileSearchObj = search.create({
            type: "file",
            filters: [["folder", "anyof", "43"], "AND", ["internalid", "anyof", image]],
            columns: [
              search.createColumn({
                name: "name",
                sort: search.Sort.ASC,
              }),
              "folder",
              "documentsize",
              "url",
              "created",
              "modified",
              "filetype",
            ],
          });
          var searchResultCount = fileSearchObj.runPaged().count;
          fileSearchObj.run().each(function (result) {
            let imageUrl = result.getValue("url");
            dataObject.imageUrl = imageUrl;
            return true;
          });
        }
        return true;
      });

      // LOCATION SEARCH
      var customrecord_abj_locationSearchObj = search.create({
        type: "customrecord_abj_location",
        filters: [["custrecord_ol_list_employee", "anyof", empID]],
        columns: [
          search.createColumn({
            name: "name",
            sort: search.Sort.ASC,
          }),
          "custrecord_ol_address",
          "custrecord_ol_radius",
          "custrecord_ol_latitude",
          "custrecord_ol_longitude",
        ],
      });
      var searchResultCount = customrecord_abj_locationSearchObj.runPaged().count;
      log.debug("customrecord_abj_locationSearchObj result count", searchResultCount);
      customrecord_abj_locationSearchObj.run().each(function (result) {
        let radius = result.getValue("custrecord_ol_radius");
        let lat = result.getValue("custrecord_ol_latitude");
        let lng = result.getValue("custrecord_ol_longitude");
        let address = result.getValue("custrecord_ol_address");
        dataObject.latitude = lat;
        dataObject.longitude = lng;
        dataObject.radius = radius;
        return true;
      });
      // END LOCATION SEARCH

      // WORK PATTERN SEARCH
      let daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      let currentDate = new Date();
      let dayOfWeek = daysOfWeek[currentDate.getUTCDay()];
      log.debug("datee", {
        dayOfWeek: dayOfWeek,
        currentDate: currentDate,
      });
      var customrecord_abj_work_patternSearchObj = search.create({
        type: "customrecord_abj_work_pattern",
        filters: [["custrecord_wp_list_employee", "anyof", empID], "AND", ["custrecord_wpd_wp_id.custrecord_wpd_day", "is", dayOfWeek]],
        columns: [
          "internalid",
          "custrecord_wp_late_tolerance",
          "custrecord_wp_finish_tolerance",
          search.createColumn({
            name: "custrecord_wpd_status",
            join: "CUSTRECORD_WPD_WP_ID",
          }),
          search.createColumn({
            name: "custrecord_wpd_timein",
            join: "CUSTRECORD_WPD_WP_ID",
          }),
          search.createColumn({
            name: "custrecord_wpd_timeout",
            join: "CUSTRECORD_WPD_WP_ID",
          }),
          search.createColumn({
            name: "internalid",
            join: "CUSTRECORD_WPD_WP_ID",
          }),
        ],
      });
      var searchResultCount = customrecord_abj_work_patternSearchObj.runPaged().count;
      log.debug("customrecord_abj_work_patternSearchObj result count", searchResultCount);
      customrecord_abj_work_patternSearchObj.run().each(function (result) {
        let workPatternUsed = result.getValue({
          name: "internalid",
          join: "CUSTRECORD_WPD_WP_ID",
        });
        let lateTolerance = result.getValue("custrecord_wp_late_tolerance");
        let finishTolerance = result.getValue("custrecord_wp_finish_tolerance");
        let workStatus = result.getValue({
          name: "custrecord_wpd_status",
          join: "CUSTRECORD_WPD_WP_ID",
        });
        let workTimeIn = result.getValue({
          name: "custrecord_wpd_timein",
          join: "CUSTRECORD_WPD_WP_ID",
        });
        let workTimeOut = result.getValue({
          name: "custrecord_wpd_timeout",
          join: "CUSTRECORD_WPD_WP_ID",
        });
        dataObject.workPatternUsed = workPatternUsed;
        dataObject.lateTolerance = lateTolerance;
        dataObject.finishTolerance = finishTolerance;
        dataObject.workStatus = workStatus;
        dataObject.workTimeIn = workTimeIn;
        dataObject.workTimeOut = workTimeOut;
        return true;
      });
      // END WORK PATTERN SEARCH

      // Attendance Search
      dataObject.clock_in = false;
      dataObject.clock_out = false;
      dataObject.break_in = false;
      dataObject.break_out = false;
      dataObject.overtime_in = false;
      dataObject.overtime_out = false;
      dataObject.visit_in = false;
      dataObject.visit_out = false;

      var customrecord_abj_attendaceSearchObj = search.create({
        type: "customrecord_abj_attendace",
        filters: [["custrecord_at_employee_id", "anyof", empID], "AND", ["custrecord_at_date", "on", "today"]],
        columns: ["custrecord_at_date", "custrecord_at_category", "custrecord_at_approval_status"],
      });
      var searchResultCount = customrecord_abj_attendaceSearchObj.runPaged().count;
      log.debug("customrecord_abj_attendaceSearchObj result count", searchResultCount);
      customrecord_abj_attendaceSearchObj.run().each(function (result) {
        let categoryAtt = result.getValue("custrecord_at_category");
        let statusAtt = result.getValue("custrecord_at_approval_status");

        if (categoryAtt == "Clock In") {
          dataObject.clock_in = true;
        }
        if (categoryAtt == "Clock Out") {
          dataObject.clock_out = true;
        }
        if (categoryAtt == "Break In") {
          dataObject.break_in = true;
        }
        if (categoryAtt == "Break Out") {
          dataObject.break_out = true;
        }
        if (categoryAtt == "Overtime In" && statusAtt == "Pending Approval") {
          dataObject.overtime_in = true;
        }
        if (categoryAtt == "Overtime Out" && statusAtt == "Pending Approval") {
          dataObject.overtime_out = true;
        }
        if (categoryAtt == "Visit In") {
          dataObject.visit_in = true;
        }
        if (categoryAtt == "Visit Out") {
          dataObject.visit_out = true;
        }
        return true;
      });
      // END Attendance Search

      // Attendance Yesterday
      var customrecord_abj_attendaceSearchObjYtd = search.create({
        type: "customrecord_abj_attendace",
        filters: [["custrecord_at_employee_id", "anyof", "6"], "AND", ["custrecord_at_date", "on", "yesterday"]],
        columns: ["custrecord_at_date", "custrecord_at_category", "custrecord_at_approval_status"],
      });
      var searchResultCount = customrecord_abj_attendaceSearchObjYtd.runPaged().count;
      log.debug("customrecord_abj_attendaceSearchObjYtd result count", searchResultCount);
      var missingClockOut = false;
      var missingBreakout = false;
      var missingOvertimeOut = false;
      var missingVisitOut = false;
      var doClockIn = false;
      var doBreakIn = false;
      var doOvertimeIn = false;
      var doVisitIn = false;
      var arrayAttendanceYst = [];
      customrecord_abj_attendaceSearchObjYtd.run().each(function (result) {
        // .run().each has a limit of 4,000 results
        let categoryAtt = result.getValue("custrecord_at_category");
        let statusAtt = result.getValue("custrecord_at_approval_status");
        if (categoryAtt == "Clock In") {
          doClockIn = true;
        }
        if (categoryAtt == "Break In") {
          doBreakIn = true;
        }
        if (categoryAtt == "Overtime In") {
          doOvertimeIn = true;
        }
        if (categoryAtt == "Visit In") {
          doVisitIn = true;
        }
        arrayAttendanceYst.push(categoryAtt);
        return true;
      });
      // END Attendance Yesterday

      const expectedValues = ["Clock Out", "Break Out", "Overtime Out", "Visit Out"];

      for (const value of expectedValues) {
        if (!arrayAttendanceYst.includes(value)) {
          if (value == "Clock Out" && doClockIn) {
            missingClockOut = true;
          }
          if (value == "Break Out" && doBreakIn) {
            missingBreakout = true;
          }
          if (value == "Overtime Out" && doOvertimeIn) {
            missingOvertimeOut = true;
          }
          if (value == "Visit Out" && doVisitIn) {
            missingVisitOut = true;
          }
        }
      }

      dataObject.missing_clock_out = missingClockOut;
      dataObject.missing_break_out = missingBreakout;
      dataObject.missing_overtime_out = missingOvertimeOut;
      dataObject.missing_visit_out = missingVisitOut;
      // END Attendance Yesterday

      var response = {
        status: "success",
        data: dataObject,
        message: null,
      };
      return JSON.stringify(response);
    } catch (e) {
      var response = {
        status: "failed",
        message: e.message,
      };
      return JSON.stringify(response);
    }
  }

  function get_overtime(empID) {
    try {
      var dataObject = {};
      var response = [];
      let currentDate = new Date();
      var customrecord_overtimeSearchObj = search.create({
        type: "customrecord_overtime",
        filters: [[["custrecord_ov_employee", "anyof", empID]], "AND", [["custrecord_ot_date", "on", "today"]]],
        columns: [
          "internalid",
          "custrecord_ot_date",
          "custrecord_ov_start_time",
          "custrecord_ov_end_time",
          "custrecord_ov_gps_track",
          "custrecord_ov_late_tolerance",
          "custrecord_ov_end_tolerance",
          search.createColumn({
            name: "lastmodified",
            sort: search.Sort.ASC,
          }),
        ],
      });
      var searchResultCount = customrecord_overtimeSearchObj.runPaged().count;
      log.debug("customrecord_overtimeSearchObj result count", searchResultCount);
      if (searchResultCount > 0) {
        customrecord_overtimeSearchObj.run().each(function (result) {
          let startTime = result.getValue("custrecord_ov_start_time");
          let endTime = result.getValue("custrecord_ov_end_time");
          let gpsTrack = result.getValue("custrecord_ov_gps_track");
          let lateTolerance = result.getValue("custrecord_ov_late_tolerance");
          let endTolerance = result.getValue("custrecord_ov_end_tolerance");
          let ovPattern = result.getValue("internalid");
          dataObject = {
            startTime: startTime,
            endTime: endTime,
            empid: empID,
            gpsTrack: gpsTrack,
            lateTolerance: lateTolerance,
            endTolerance: endTolerance,
            ovPattern: ovPattern,
            statusIn: false,
            statusOut: false,
          };
          var customrecord418SearchObj = search.create({
            type: "customrecord418",
            filters: [["custrecord_aos_emp", "anyof", empID], "AND", ["custrecord_aos_pattern", "anyof", ovPattern]],
            columns: [
              search.createColumn({
                name: "scriptid",
                sort: search.Sort.ASC,
              }),
              "custrecord_aos_emp",
              "custrecord_aos_in_status",
              "custrecord_aos_out_status",
              "custrecord_aos_total_hours",
            ],
          });
          customrecord418SearchObj.run().each(function (result2) {
            let statusIn = result2.getValue("custrecord_aos_in_status");
            let statusOut = result2.getValue("custrecord_aos_out_status");
            dataObject.statusIn = statusIn;
            dataObject.statusOut = statusOut;
          });
          return true;
        });
        // LOCATION SEARCH
        var customrecord_abj_locationSearchObj = search.create({
          type: "customrecord_abj_location",
          filters: [["custrecord_ol_list_employee", "anyof", empID]],
          columns: [
            search.createColumn({
              name: "name",
              sort: search.Sort.ASC,
            }),
            "custrecord_ol_address",
            "custrecord_ol_radius",
            "custrecord_ol_latitude",
            "custrecord_ol_longitude",
          ],
        });
        var searchResultCount = customrecord_abj_locationSearchObj.runPaged().count;
        log.debug("customrecord_abj_locationSearchObj result count", searchResultCount);
        customrecord_abj_locationSearchObj.run().each(function (result) {
          let radius = result.getValue("custrecord_ol_radius");
          let lat = result.getValue("custrecord_ol_latitude");
          let lng = result.getValue("custrecord_ol_longitude");
          let address = result.getValue("custrecord_ol_address");
          dataObject.latitude = lat;
          dataObject.longitude = lng;
          dataObject.radius = radius;
          return true;
        });
        // END LOCATION SEARCH

        var response = {
          status: "success",
          data: dataObject,
          message: null,
        };
      } else {
        var response = {
          status: "success",
          data: dataObject,
          message: "no data",
        };
      }

      return JSON.stringify(response);
    } catch (e) {
      var response = {
        status: "failed",
        message: e.message,
      };
      return JSON.stringify(response);
    }
  }

  function create_attendance(data) {
    try {
      var employeeID = data.employeeid;
      var dateAttendance = data.date;
      var typeAttendance = data.type;
      var timeAttendance = formatTimeOfDay(data.time);
      var latitudeCoordinat = data.latitude;
      var longitudeCoordinat = data.longitude;
      var frImage = data.fr_image;
      var frImagebase64 = data.fr_image_content;
      var gpsStatus = data.gps_status;
      var frStatus = data.fr_status;
      var notesAttendance = data.notes;
      var workPatternActive = data.work_pattern_active;
      var statusAttendance = "Approved";
      var approvalStatus = "2"; // Approve
      var categoryAttendance = data.category;

      var dataTrans = record.create({
        type: "customrecord_abj_attendace",
        isDynamic: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_at_employee_id",
        value: employeeID,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_date",
        value: new Date(dateAttendance),
        ignoreFieldChange: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_at_type",
        value: typeAttendance,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_category",
        value: categoryAttendance,
        ignoreFieldChange: true,
      });
      log.debug("timeAttendance", timeAttendance);
      dataTrans.setValue({
        fieldId: "custrecord_at_time",
        value: timeAttendance,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_lat",
        value: latitudeCoordinat,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_lng",
        value: longitudeCoordinat,
        ignoreFieldChange: true,
      });
      if (frImage) {
        var fileURL = saveJPEGFile(frImage, frImagebase64);
        dataTrans.setValue({
          fieldId: "custrecord_at_fr_image",
          value: fileURL,
          ignoreFieldChange: true,
        });
      }
      dataTrans.setValue({
        fieldId: "custrecord_at_gps_status",
        value: gpsStatus,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_fr_status",
        value: frStatus,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_notes",
        value: notesAttendance,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_at_wpd_used",
        value: workPatternActive,
        ignoreFieldChange: true,
      });

      if (notesAttendance == "LATE" || notesAttendance == "CLOCK OUT EARLY" || frStatus == "NOK" || gpsStatus == "NOK") {
        statusAttendance = "Pending Approval";
        approvalStatus = "1"; // 1 is Pending Approval
      }
      dataTrans.setValue({
        fieldId: "custrecord_at_status",
        value: statusAttendance,
        ignoreFieldChange: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_at_approval_status",
        value: approvalStatus,
        ignoreFieldChange: true,
      });

      var saveData = dataTrans.save();

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

  function create_overtime(data) {
    try {
      log.debug("dateAttendance", {
        dateAttendance: data.date,
        timeAttendance: data.time,
      });
      var employeeID = data.employeeid;
      var dateAttendance = data.date;
      var timeAttendance = formatTimeOfDay(data.time);
      var latitudeCoordinat = data.latitude;
      var longitudeCoordinat = data.longitude;
      var frImage = data.fr_image;
      var frImagebase64 = data.fr_image_content;
      var gpsStatus = data.gps_status;
      var frStatus = data.fr_status;
      var notesAttendance = data.notes;
      var ovPattern = data.workPatternUsed;
      log.debug("workPatternUsed", ovPattern);
      var category = data.category;
      var statusAttendance = "Approved";
      var approvalStatus = "2"; // Approve

      var dataTrans = record.create({
        type: "customrecord_attendance_overtime",
        isDynamic: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_ao_employee",
        value: employeeID,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_category",
        value: category,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_date",
        value: new Date(dateAttendance),
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_time",
        value: timeAttendance,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_lat",
        value: latitudeCoordinat,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_lng",
        value: longitudeCoordinat,
        ignoreFieldChange: true,
      });
      if (frImage) {
        var fileURL = saveJPEGFile(frImage, frImagebase64);
        dataTrans.setValue({
          fieldId: "custrecord_ao_fr_image",
          value: fileURL,
          ignoreFieldChange: true,
        });
      }
      dataTrans.setValue({
        fieldId: "custrecord_ao_gps_status",
        value: gpsStatus,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_fr_status",
        value: frStatus,
        ignoreFieldChange: true,
      });
      dataTrans.setValue({
        fieldId: "custrecord_ao_notes",
        value: notesAttendance,
        ignoreFieldChange: true,
      });

      if (notesAttendance == "LATE" || notesAttendance == "OVERTIME OUT EARLY" || frStatus == "NOK" || gpsStatus == "NOK") {
        statusAttendance = "Pending Approval";
        approvalStatus = "1"; // 1 is Pending Approval
      }
      dataTrans.setValue({
        fieldId: "custrecord_ao_status",
        value: statusAttendance,
        ignoreFieldChange: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_ao_approval_status",
        value: approvalStatus,
        ignoreFieldChange: true,
      });

      dataTrans.setValue({
        fieldId: "custrecord_ao_pattern",
        value: ovPattern,
        ignoreFieldChange: true,
      });

      var saveData = dataTrans.save();

      if (saveData && ovPattern) {
        // search record overtime status
        var customrecord418SearchObj = search.create({
          type: "customrecord418",
          filters: [["custrecord_aos_emp", "anyof", employeeID], "AND", ["custrecord_aos_pattern", "anyof", ovPattern]],
          columns: ["internalid", "custrecord_aos_emp", "custrecord_aos_in_status", "custrecord_aos_out_status", "custrecord_aos_total_hours"],
        });
        var searchResultCount = customrecord418SearchObj.runPaged().count;
        log.debug("customrecord418SearchObj result count", searchResultCount);
        if (searchResultCount > 0) {
          var internalid;
          customrecord418SearchObj.run().each(function (result) {
            internalid = result.getValue("internalid");
          });
          var loadPattern = record.load({
            type: "customrecord418",
            id: internalid,
            isDynamic: true,
          });
          if (category == "Overtime In") {
            loadPattern.setValue({
              fieldId: "custrecord_aos_in_status",
              value: true,
              ignoreFieldChange: true,
            });
          } else {
            // loadPattern.setValue({
            //   fieldId: "custrecord_aos_out_status",
            //   value: true,
            //   ignoreFieldChange: true,
            // });
            // search in for counting hours
            var customrecord_attendance_overtimeSearchObj = search.create({
              type: "customrecord_attendance_overtime",
              filters: [["custrecord_ao_pattern", "anyof", ovPattern], "AND", ["custrecord_ao_employee", "anyof", employeeID], "AND", ["custrecord_ao_category", "is", "Overtime In"]],
              columns: ["custrecord_ao_employee", "custrecord_ao_date", "custrecord_ao_time", "custrecord_ao_notes", "custrecord_ao_status", "custrecord_ao_approval_status"],
            });
            var hours = 0;
            var dateINData, timeINData;
            customrecord_attendance_overtimeSearchObj.run().each(function (result) {
              dateINData = result.getValue("custrecord_ao_date") || "";
              timeINData = result.getValue("custrecord_ao_time") || "";
            });
            const timeOut = data.time; // Your time string
            const dateOut = data.date; // Your date string
            const formattedDate = dateOut.split("/").reverse().join("-");
            const dateTimeString = formattedDate + "T" + timeOut + ":00Z";

            const timeIN24h = convertTo24Hour(timeINData);
            const dateIN = dateINData;
            const formattedDateIN = dateIN.split("/").reverse().join("-");
            const dateTimeStringIN = formattedDateIN + "T" + timeIN24h + ":00Z";

            // log.debug("timee", {
            //   dateIN: dateINData,
            //   timeIN: format.parse({ value: dateTimeStringIN, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_JAKARTA }),
            //   dateOUT: data.date,
            //   timeOUT: format.parse({ value: dateTimeString, type: format.Type.DATETIMETZ, timezone: format.Timezone.ASIA_JAKARTA }),
            // });
            const dateTimeStringINUpdate = padDate(dateTimeStringIN);
            const dateTimeStringOUTUpdate = padDate(dateTimeString);
            log.debug("dateTimeStringIN", dateTimeStringINUpdate);
            log.debug("dateTimeStringOUT", dateTimeStringOUTUpdate);
            const timeINParse = new Date(dateTimeStringINUpdate);
            const timeOUTParse = new Date(dateTimeStringOUTUpdate);
            log.debug("parsing", {
              timeINParse: timeINParse,
              timeOUTParse: timeOUTParse,
            });
            // Extracting the time components from NetSuite date objects
            const timeINMilliseconds = timeINParse.getTime();
            const timeOUTMilliseconds = timeOUTParse.getTime();

            // Calculating the difference in milliseconds
            const diffMilliseconds = Math.abs(timeOUTMilliseconds - timeINMilliseconds);
            const diffHours = Math.round(diffMilliseconds / (1000 * 60 * 60));

            log.debug("parsing", {
              timeINParse: timeINParse,
              timeOUTParse: timeOUTParse,
              timeINMilliseconds: timeINMilliseconds,
              timeOUTMilliseconds: timeOUTMilliseconds,
            });

            log.debug("Difference in hours:", diffHours);

            loadPattern.setValue({
              fieldId: "custrecord_aos_total_hours",
              value: diffHours,
              ignoreFieldChange: true,
            });
            // end search in for counting hours
          }
        } else {
          var loadPattern = record.create({
            type: "customrecord418",
            isDynamic: true,
          });
          if (category == "Overtime In") {
            loadPattern.setValue({
              fieldId: "custrecord_aos_in_status",
              value: true,
              ignoreFieldChange: true,
            });
          }
          loadPattern.setValue({
            fieldId: "custrecord_aos_pattern",
            value: ovPattern,
            ignoreFieldChange: true,
          });
        }
        loadPattern.save();
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

  function update_employee_photo(data, empid) {
    try {
      var dataObject = {};
      var photoImageName = data.photo_name;
      var photoImagebase64 = data.photo_base_64;
      var frCode = data.fr_detected_code;
      var customrecord_employee_photoSearchObj = search.create({
        type: "customrecord_employee_photo",
        filters: [["custrecord_ep_emp", "anyof", empid]],
        columns: ["internalid", "custrecord_ep_emp", "custrecord_ep_photo"],
      });
      var saveData;
      var searchResultCount = customrecord_employee_photoSearchObj.runPaged().count;
      if (searchResultCount > 0) {
        customrecord_employee_photoSearchObj.run().each(function (result) {
          let internalID = result.getValue("internalid");
          var dataTrans = record.load({
            type: "customrecord_employee_photo",
            id: internalID,
            isDynamic: true,
          });

          if (photoImagebase64) {
            var fileURL = saveJPEGFile(photoImageName, photoImagebase64);
            dataTrans.setValue({
              fieldId: "custrecord_ep_photo",
              value: fileURL,
              ignoreFieldChange: true,
            });
          }

          dataTrans.setValue({
            fieldId: "custrecord_ep_fr_code",
            value: frCode,
            ignoreFieldChange: true,
          });

          saveData = dataTrans.save();
          return true;
        });
      } else {
        var dataTrans = record.create({
          type: "customrecord_employee_photo",
          isDynamic: true,
        });
        var photoImageName = data.photo_name;
        var photoImagebase64 = data.photo_base_64;

        if (photoImagebase64) {
          var fileURL = saveJPEGFile(photoImageName, photoImagebase64);
          dataTrans.setValue({
            fieldId: "custrecord_ep_photo",
            value: fileURL,
            ignoreFieldChange: true,
          });
        }
        dataTrans.setValue({
          fieldId: "custrecord_ep_fr_code",
          value: frCode,
          ignoreFieldChange: true,
        });

        saveData = dataTrans.save();
      }
      if (saveData) {
        var employee_photoSearchObj = search.create({
          type: "employee",
          filters: [["internalid", "is", empid]],
          columns: ["internalid", "email", "image"],
        });
        var searchResultCount = employee_photoSearchObj.runPaged().count;
        if (searchResultCount > 0) {
          employee_photoSearchObj.run().each(function (result) {
            let imageID = result.getValue("image");
            var fileSearchObj = search.create({
              type: "file",
              filters: [["folder", "anyof", "43"], "AND", ["internalid", "anyof", imageID]],
              columns: [
                search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                }),
                "folder",
                "documentsize",
                "url",
                "created",
                "modified",
                "filetype",
              ],
            });
            var searchResultCount = fileSearchObj.runPaged().count;
            log.debug("fileSearchObj result count", searchResultCount);
            fileSearchObj.run().each(function (result) {
              let imageUrl = result.getValue("url");
              dataObject = {
                profilPicture: imageUrl,
              };
              return true;
            });
          });
        }
      }

      var response = {
        status: "success",
        data: dataObject,
        message: "Data successfully updated",
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
            var fileSearchObj = search.create({
              type: "file",
              filters: [["folder", "anyof", "43"], "AND", ["internalid", "anyof", imageID]],
              columns: [
                search.createColumn({
                  name: "name",
                  sort: search.Sort.ASC,
                }),
                "folder",
                "documentsize",
                "url",
                "created",
                "modified",
                "filetype",
              ],
            });
            var searchResultCount = fileSearchObj.runPaged().count;
            log.debug("fileSearchObj result count", searchResultCount);
            fileSearchObj.run().each(function (result) {
              let imageUrl = result.getValue("url");
              dataObject = {
                empid: internalID,
                firstName: firstName,
                profilPicture: imageUrl,
              };
              return true;
            });
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

  function doGet(requestParams) {
    try {
      var record_type = requestParams.record_type;
      var empID = requestParams.empid;
      var day = requestParams.day;
      if (record_type === "work_pattern_employee") return work_pattern_employee(empID, day);
      else if (record_type === "employee") return get_employee(empID);
      else if (record_type === "validate_attendance") return validate_attendance(empID);
      else if (record_type === "overtime") return get_overtime(empID);
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
    if (requestBody.type === "create_attendance") {
      log.debug("post attendace", true);
      return create_attendance(requestBody.data);
    } else if (requestBody.type === "create_overtime") {
      log.debug("post overtime", true);
      return create_overtime(requestBody.data);
    } else if (requestBody.type === "update_employee_photo") {
      log.debug("update_employee_photo", true);
      return update_employee_photo(requestBody.data, requestBody.employeeid);
    } else if (requestBody.type === "login_email") {
      log.debug("login_email", true);
      return login_email(requestBody.data);
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
