var Promise = require('promise');
var request = require("request");
var async = require("async");

var siteId = token = "";

function DifferenceInDays(firstDate, secondDate) {
    return Math.round((secondDate-firstDate)/(1000*60*60*24));
}

var login = function(username, password) {
  return new Promise(function(resolve, reject) {

    // INSERT LOGIN REQUEST HERE
    // SET THE siteId AND token GLOBAL VARIABLES

  });
}

var getViews = function(callback, page, results) {
  if (!results) {
    var views = [];
  } else {
    var views = results;
  }

  // ADD PAGE TO URL IF IT'S DEFINED
  // INSERT GET VIEWS
  // concat() RESPONSE TO VIEWS ARRAY TO BUILD FINAL VIEWS LIST
  // var pageNumber = parseInt(resp.pagination.pageNumber);
  // var pageSize = parseInt(resp.pagination.pageSize);
  // var totalAvailable = parseInt(resp.pagination.totalAvailable);

}

var findDeadWorkbooks = function(views) {
  return new Promise(function(resolve, reject) {
    var workbooks = [];
    var workbookStats = [];
    views.forEach(function(view) {
      var i = workbooks.indexOf(view.workbook.id);
      if (i == -1) {
        workbooks.push(view.workbook.id);
        workbookStats.push({
          id: view.workbook.id,
          totalViewCount: parseInt(view.usage.totalViewCount),
          lastUpdated: view.updatedAt
        });
      } else {
        var workbook = workbookStats[i];
        workbook.totalViewCount = workbook.totalViewCount + parseInt(view.usage.totalViewCount);
        workbookStats[i] = workbook;
      }
    });
    var today = new Date();
    var minAge = 28;
    var frequency = 1/7;
    var rtn = [];
    workbookStats.forEach(function(workbook) {
      var lastUpdated = new Date(workbook.lastUpdated);
      var age = DifferenceInDays(lastUpdated, today);
      var twbFreq = workbook.totalViewCount / age;
      if (age > minAge && twbFreq < frequency) {
        rtn.push(workbook);
      }
    });
    resolve(rtn);
  });
}

var markWorkbookstoDelete = function(workbooks) {
  return new Promise(function(resolve, reject) {
    var tagCount = 0;
    async.eachSeries(workbooks, function(workbook, callback) {

      // INSERT WORKBOOK TAGGING HERE
      // CALLING callback() AFTER EACH WORKBOOK

      }, function(err) {
        resolve(workbooks.length + " workbooks tagged");
      });
  });
}

process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason);
});

// Here's the workflow we'll run through
// -- Login to the Server
//   |-- Get all the views on the server. This requires pagination getting 100 views per page
//   |-- We use views because it has usage stats. But really we want to look at the workbook level
//      |-- For each view get the workbook ID and aggregate the usage stats for the workbook
//      |-- Then for each workbook calculate its age and average views per DifferenceInDays
//         |-- Take a list of these 'dead' workbooks and tag them with 'Delete'
//            |-- Finally return the number of workbooks tagged

login('username', 'password')
  .then(allViews)
  .then(views => findDeadWorkbooks(views))
  .then(workbooks => markWorkbookstoDelete(workbooks))
  .then(tagCount => console.log(tagCount))
