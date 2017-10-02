var Promise = require('promise');
var request = require("request");
var async = require("async");

var siteId = token = "";

var login = function(username, password) {
  return new Promise(function(resolve, reject) {
    var options = {
      method: "POST",
      url: "https://tableauserver.theinformationlab.co.uk/api/2.6/auth/signin",
      headers: {
        "Accept": "application/json"
      },
      body: "<tsRequest>\
    <credentials name='" + username + "' password='" + password + "'>\
    	<site contentUrl=''/>\
    </credentials>\
    </tsRequest>"
    };

    request(options, function(error, response, body) {
      if (error) reject(error);
      else {
        var creds = JSON.parse(body).credentials;
        siteId = creds.site.id;
        token = creds.token;
        resolve(creds);
      }
    });
  });
}

var getSites = function() {
  return new Promise(function(resolve, reject) {
    var options = {
      method: "GET",
        url: "https://tableauserver.theinformationlab.co.uk/api/2.6/sites",
      headers: {"X-Tableau-Auth":token,"Accept":"application/json"},
    };

    request(options, function (error, response, body) {
      resolve(JSON.parse(body).sites.site);
    });
  });
}

var checkUsers = function(sites) {
  return new Promise(function(resolve, reject) {
    async.eachSeries(sites, function(site, switchsitecallback) {
      if (site.id != siteId) {
        var options = {
          method: "POST",
          url: "https://tableauserver.theinformationlab.co.uk/api/2.6/auth/switchSite",
          headers: {
            "X-Tableau-Auth":token,
            "Accept": "application/json"
          },
          body: "<tsRequest><site contentUrl='"+site.contentUrl+"'/></tsRequest>"
        };
        request(options, function(error, response, body) {
          var creds = JSON.parse(body).credentials;
          siteId = creds.site.id;
          token = creds.token;
          console.log("Site:", creds.site.contentUrl);
          getStaleUsers(function(users) {
            async.eachSeries(users, function(user, callback) {
              var options = {
               method: "PUT",
                 url: "https://tableauserver.theinformationlab.co.uk/api/2.6/sites/"+siteId+"/users/" + user.id,
               headers: {"X-Tableau-Auth":token,"Accept":"application/json"},
               body: "<tsRequest><user siteRole='Unlicensed'/></tsRequest>"
              };

               request(options, function (error, response, body) {
               if (error) throw new Error(error);
               if (JSON.parse(body).user) {
                 console.log("User Unlicensed", JSON.parse(body).user.name);
               } else {
                 console.log(body);
               }
               callback();
               });
            }, function(err) {
              switchsitecallback();
            });
          });
        });
      } else {
        console.log("Site:", site.contentUrl);
        getStaleUsers(function(users) {
          async.eachSeries(users, function(user, callback) {
            var options = {
             method: "PUT",
               url: "https://tableauserver.theinformationlab.co.uk/api/2.6/sites/"+siteId+"/users/" + user.id,
             headers: {"X-Tableau-Auth":token,"Accept":"application/json"},
             body: "<tsRequest><user siteRole='Unlicensed'/></tsRequest>"
            };

             request(options, function (error, response, body) {
             if (error) throw new Error(error);
             console.log("User Unlicensed", JSON.parse(body).user.name);
             callback();
             });
          }, function(err) {
            switchsitecallback();
          });
        });
      }

    });
  });
}

var getStaleUsers = function(callback) {
  var options = {
  method: "GET",
    url: "https://tableauserver.theinformationlab.co.uk/api/2.6/sites/"+siteId+"/users?filter=lastLogin:lt:2017-08-01T00:00:00:00Z",
  headers: {"X-Tableau-Auth":token,"Accept":"application/json"},
};

    request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    callback(JSON.parse(body).users.user);
    });
}

login('craig', 'd0ux%oBWrDxRP@*6aWyTJL')
  .then(getSites)
  .then(sites => checkUsers(sites))
