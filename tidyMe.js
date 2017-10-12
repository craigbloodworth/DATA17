var Promise = require('promise');
var request = require("request");
var async = require("async");

const serverUrl = "https://tableauserver.theinformationlab.co.uk";
var siteId = token = "";

function DifferenceInDays(firstDate, secondDate) {
    return Math.round((secondDate-firstDate)/(1000*60*60*24));
}

var login = function(username, password, site) {
  return new Promise(function(resolve, reject) {

    // INSERT LOGIN REQUEST HERE
    // SET THE siteId AND token GLOBAL VARIABLES

  });
}

var allViews = function() {
  return new Promise(function(resolve, reject) {
    getViews(function(views) {
      resolve(views);
    })
  });
}

var getViews = function(callback, page, results) {
  if (!results) {
    var views = [];
  } else {
    var views = results;
  }
  if (page) {
    // &pageNumber=
  } else {
    // no pageNumber
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
    // To find old workbooks we need to look a the hits to each view
    // We'll then build an array of workbooks and an aggregate of
    // the view stats
    var workbooks = [];
    var workbookStats = [];

    // For each view that we downloaded
    views.forEach(function(view) {

      // Find if the workbook ID belonging to the view is already in
      // the views array
      var i = workbooks.indexOf(view.workbook.id);

      // If it isn't in the workbook array the i variable will be -1
      if (i == -1) {

        // Workbook isn't in the array. Add it for future tests
        workbooks.push(view.workbook.id);

        // Add the workbook ID, its view count and last updated date
        // to the workbook stats array
        workbookStats.push({
          id: view.workbook.id,
          totalViewCount: parseInt(view.usage.totalViewCount),
          lastUpdated: view.updatedAt
        });

      // The i value is not -1 so the workbook has been added to the
      // stats array already
      } else {

        // Grab the workbook stats from the array
        var workbook = workbookStats[i];

        // Update the total view count by adding the view's view count
        workbook.totalViewCount = workbook.totalViewCount + parseInt(view.usage.totalViewCount);

        // Add the updated stats object back to the stats array
        workbookStats[i] = workbook;
      }
    });

    // Now we need to figure out how much each workbook has been used

    // Get today's date
    var today = new Date();

    // Ignore anhthing that's been updated in the last 28 days
    var minAge = 28;

    // Set the minimum view frequency
    var frequency = 1/7;

    // Initialise the array to return
    var rtn = [];

    // For each workbook
    workbookStats.forEach(function(workbook) {

      // Get the last updated date
      var lastUpdated = new Date(workbook.lastUpdated);

      // Calculate the difference in days from the last updated date to today
      var age = DifferenceInDays(lastUpdated, today);

      // Calculate the view frequency as view count / days since update
      var twbFreq = workbook.totalViewCount / age;

      // If over 28 days and workbook view frequency less than 1/7
      if (age > minAge && twbFreq < frequency) {

        // Add it to the return array
        rtn.push(workbook);

      }
    });

    // Return workbooks to be deleted
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

login('username', 'password', 'site')
  .then(allViews)
  .then(views => findDeadWorkbooks(views))
  .then(workbooks => markWorkbookstoDelete(workbooks))
  .then(tagCount => console.log(tagCount))
