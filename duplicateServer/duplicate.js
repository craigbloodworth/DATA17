var request = require("request");

var serverA = serverB = {
  url : '',
  siteID : '',
  contentUrl: '',
  token : ''
}

var login = function(url, username, password, siteUrl, callback) {
  var options = {
    method: "POST",
    url: url + "/api/2.6/auth/signin",
    headers: {
      "Accept": "application/json"
    },
    body: "<tsRequest>\
            <credentials name='" + username + "' password='" + password + "'>\
            	<site contentUrl='"+siteUrl+"'/>\
            </credentials>\
            </tsRequest>"
  };
  request(options, function(error, response, body) {
    if (error) callback("Error logging in to the server\n" + JSON.stringify(error), null);
    else {
      var creds = JSON.parse(body).credentials;
      siteId = creds.site.id;
      token = creds.token;
      callback(creds);
    }
  });
}

const serverAUrl = "https://tableauserver.theinformationlab.co.uk";
const serverBUrl = "https://tableauserver.theinformationlab.co.uk";

module.exports = {
  init: function(callback) {
    login(serverAUrl, 'zen', 'tableauzen', 'demo', function(creds) {
      var serverA = {
        url : serverAUrl,
        siteID : creds.site.id,
        contentUrl: creds.site.contentUrl,
        token : creds.token
      }
      login(serverBUrl, 'zen', 'tableauzen', 'DATA17', function(creds) {
        var serverB = {
          url : serverBUrl,
          siteID : creds.site.id,
          contentUrl: creds.site.contentUrl,
          token : creds.token
        };
        callback(serverA, serverB);
        })
    });
  },

  checkWorkbooks: function(creds, callback) {
    var options = {
      method: "GET",
      url: creds.url + "/api/2.6/sites/"+creds.siteID+"/workbooks?pageSize=1&sort=updatedAt:desc",
      headers: {"X-Tableau-Auth":creds.token,"Accept":"application/json"},
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      callback(JSON.parse(body).workbooks.workbook)
    });
  }
}
