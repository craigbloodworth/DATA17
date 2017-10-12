var Promise = require('promise');
var request = require("request");
var async = require("async");

const serverUrl = "https://tableauserver.theinformationlab.co.uk";
var siteId = token = "";

function DifferenceInDays(firstDate, secondDate) {
    return Math.round((secondDate-firstDate)/(1000*60*60*24));
}

var login = function(username, password, siteUrl) {
  return new Promise(function(resolve, reject) {
    var options = {
      method: "POST",
      url: serverUrl + "/api/2.6/auth/signin",
      headers: {
        "Accept": "application/json"
      },
      body: "<tsRequest>\
    <credentials name='" + username + "' password='" + password + "'>\
    	<site contentUrl='" + siteUrl + "'/>\
    </credentials>\
    </tsRequest>"
    };

    request(options, function(error, response, body) {
      if (error) reject(error);
      else {
        var creds = JSON.parse(body).credentials;
        siteId = creds.site.id;
        token = creds.token;
        console.log(" > Logged in to site %s with token %s", siteId, token);
        resolve(creds);
      }
    });
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
    var url = serverUrl + "/api/2.6/sites/" + siteId + "/views?includeUsageStatistics=true&pageNumber=" + page;
    console.log(" . > Getting page %s of the views API", page);
  } else {
    var url = serverUrl + "/api/2.6/sites/" + siteId + "/views?includeUsageStatistics=true";
    console.log(" . > Getting page 1 of the views API");
  }
  var options = {
    method: "GET",
    url: url,
    headers: {
      "X-Tableau-Auth": token,
      "Accept": "application/json"
    }
  };
  request(options, function(error, response, body) {
    if (error) reject(error);
    else {
      var resp = JSON.parse(body);
      var viewsArr = resp.views.view;
      views = views.concat(resp.views.view);
      if (parseInt(resp.pagination.pageNumber) * parseInt(resp.pagination.pageSize) < parseInt(resp.pagination.totalAvailable)) {
        getViews(callback, parseInt(resp.pagination.pageNumber) + 1, views);
      } else {
        console.log(" . > Found %s views in total", views.length);
        callback(views);
      }
    }
  });
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
        console.log(" . . > Found a new workbook with %s clicks", view.usage.totalViewCount);
      } else {
        var workbook = workbookStats[i];
        workbook.totalViewCount = workbook.totalViewCount + parseInt(view.usage.totalViewCount);
        workbookStats[i] = workbook;
        console.log(" . . > Workbook %s now has %s clicks", workbook.id, view.usage.totalViewCount);
      }
    });
    console.log(" . . > There are %s workbooks in total on the server", workbookStats.length);
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
    console.log(" . . > of which there are %s dead workbooks", rtn.length);
    resolve(rtn);
  });
}

var markWorkbookstoDelete = function(workbooks) {
  return new Promise(function(resolve, reject) {
    var tagCount = 0;
    async.eachSeries(workbooks, function(workbook, callback) {
      var options = {
        method: "PUT",
        url: serverUrl + "/api/2.6/sites/"+siteId+"/workbooks/"+workbook.id+"/tags",
        headers: {"X-Tableau-Auth":token,"Accept":"application/json"},
        body: "<tsRequest>\
            	<tags>\
            		<tag label='delete' />\
            	</tags>\
             </tsRequest>"
           };

        request(options, function (error, response, body) {
          console.log(" . . . > Marked workbook %s for deletion", workbook.id);
          tagCount += 1;
          callback();
        });
      }, function(err) {
        resolve(tagCount);
      });
  });
}

process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason);
});

login('username', 'password', 'site')
  .then(allViews)
  .then(views => findDeadWorkbooks(views))
  .then(workbooks => markWorkbookstoDelete(workbooks))
  .then(tagCount => console.log(" - - - - All done. %s workbooks marked for deletion",tagCount))
