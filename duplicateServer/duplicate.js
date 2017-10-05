var request = require("request");
var fs = require('fs');
var FormData = require('form-data');

var serverA = serverB = {
  url : '',
  siteID : '',
  contentUrl: '',
  token : ''
}

const apiVersion = "2.7";

var login = function(url, username, password, siteUrl, callback) {
  var options = {
    method: "POST",
    url: url + "/api/"+apiVersion+"/auth/signin",
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

var downloadWorkbook = function(creds, workbookID, callback) {
  var options = {
    method: "GET",
    url: creds.url + "/api/"+apiVersion+"/sites/"+creds.siteID+"/workbooks/"+workbookID+"/content",
    headers: {"X-Tableau-Auth":creds.token},
  };
  // RegExp to extract the filename from Content-Disposition
  var regexp = /filename=\"(.*)\"/gi;

  request(options)
    //.pipe(fs.createWriteStream('temp/'+contentUrl+'.twb'))
    .on('response', function(res) {
      // extract filename
      console.log(res.headers);
      var filename = regexp.exec( res.headers['content-disposition'] )[1];
      console.log(filename);
      // create file write stream
      var fws = fs.createWriteStream( 'temp/' + filename );
      // setup piping
      res.pipe( fws );
      res.on( 'end', function(){
        callback('temp/' + filename);
      });
    })
};

var getDefaultProject = function(creds, callback) {
  var options = {
    method: "GET",
      url: creds.url + "/api/"+apiVersion+"/sites/"+creds.siteID+"/projects?filter=name:eq:Default",
    headers: {"X-Tableau-Auth":creds.token,"Accept":"application/json"},
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
    callback(JSON.parse(body).projects.project[0]);
  });
};

var publishWorkbook = function(creds, filepath, workbookName, projectID, callback) {
  const { URL } = require("url");
  const servURL = new URL(creds.url + "/api/"+apiVersion+"/sites/"+creds.siteID+"/workbooks?overwrite=true");

  if (servURL.port) {
    var servPort = servURL.port;
  } else if (servURL.protocol == "https:") {
    var servPort = 443;
  } else {
    var servPort = 80;
  }

  var fs = require("fs");
  var form = new FormData();
  form.append("request_payload", '<tsRequest><workbook name="'+workbookName+'" ><project id="'+projectID+'" /></workbook></tsRequest>', {contentType: "text/xml"});
  //Replace workbook.twbx with location of workbook or datasource file
  form.append("tableau_workbook", fs.createReadStream(filepath,{contentType: "application/octet-stream"}));
  form.submit(
    {
      protocol: servURL.protocol,
      host: servURL.hostname,
      port: servPort,
      path: servURL.pathname + servURL.search,
      method: 'POST',
      headers: {
          "X-Tableau-Auth": creds.token,
          "Content-Type": "multipart/mixed; boundary=" + form.getBoundary(),
          "Accept":"application/json"
      }
  }, function(err, response) {
        if (err) {
          console.log(err);
        }
        var resp = "";
        response.on("data", function (chunk) {
          resp += chunk;
        });
        response.on("end", function () {
          callback(JSON.parse(resp));
        });
    });
};

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
      url: creds.url + "/api/"+apiVersion+"/sites/"+creds.siteID+"/workbooks?pageSize=1&sort=updatedAt:desc",
      headers: {"X-Tableau-Auth":creds.token,"Accept":"application/json"},
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      callback(JSON.parse(body).workbooks.workbook)
    });
  },

  transferWorkbook: function(source, destination, workbook, callback) {
    downloadWorkbook(source, workbook.id, function(filepath) {
      getDefaultProject(destination, function(project) {
        publishWorkbook(destination, filepath, workbook.name, project.id, function(response) {
          fs.unlink(filepath, function() {
            callback(response);
          });
        });
      })
    });
  }
}
