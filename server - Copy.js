var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');

var TestMode = true; // Will display a Reset Server button right on the page.  Enjoy  ;-)
var PortNum = 8888;
var MimeTypesAry;

/*

  Test URL's:
    http://localhost:8888/list.html
      http://localhost:8888/jobinstr.html?job=0617&ver=001
       (One per folder with diff job and ver  jjjj     vvv)

*/

/*****************************************************************/

http.createServer
(
  function (request, response)
  {
    var path = url.parse(request.url).path; // String:  /index.html?name=Max&favoritefood=pizza
    var pathname = url.parse(request.url).pathname; // String:  /index.html
    var params = qs.parse(url.parse(request.url).query); // Array:  params['name'] = "Max" and params['favoritefood'] = "pizza"

    fs.readFile // Reads the file from disk as specified in the path part of the url (index.html).
    (
      "mime.cfg", // read mime types.
      function (err, data)
      {
        if (err)
        {
          console.log(err);
        }
        var LineAry, currLineAry;
        LineAry = data.toString().split("\r\n");
        for (var i = 0; i < LineAry.length; i++)
        {
          currLineAry = LineAry[i].split("\t");
          MimeTypesAry[currLineAry[0]] = currLineAry[1];
        }
        console.log(MimeTypesAry["jpg"]);
      }
    );

    if (TestMode && params['QuitServer'] == 1) // Reset server if browser hits reset button and in TestMode
    {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write
      (
        "<script> setTimeout('window.open(\""
        + path.replace("?QuitServer=1", "").replace("&QuitServer=1", "")
        + "\", \"_self\")', 200); </script> Reloading..." // , then reload client page after 200ms giving server time to restart.
      );
      response.end();
      process.exit(); // Exits node - don't worry batch file will loop back and reload it.
    }
    else
    {
      fs.readFile // Reads the file from disk as specified in the path part of the url (index.html).
      (
        pathname.substr(1), // index.html (strip away left slash from /index.html).
        function (err, data)
        {
          if (err)
          {
            console.log(err);
            response.writeHead(404, {'Content-Type': 'text/html'});
            response.end();
          }
          else
          {
            var filetext = data.toString();
            response.writeHead(200, {'Content-Type': 'text/html'}); // TODO: must also code for image/gif
            if (TestMode) // Insert reset server button if in TestMode.
            {
              filetext = filetext.replace("<body>", "<body>\n<div id=\"RstBtn\" style=\"position:absolute; top:0px; left:250px; opacity:0.7;\">"
                                                                + "<input type=\"button\" name=\"ResetServer\" value=\"Reset Server\" "
                                                                +    "onclick=\"var q; if (document.location.toString().indexOf('?') == -1) {q='?'} else {q='&'}; window.open(document.location + q + 'QuitServer=1', '_self')\"></div>");
            }                // Warning:  "<Body>" may differ for you if you've changed it in your html file.
            
            response.write
            (
              TransformData( filetext, params, pathname ) // Sends in contents of read file (index.html), parameter array
                                                          //   and the pathname of the file for determining action.  (/index.html)
            );                                            //   Based on both the filename and parameters (eg:  name and favoritefood),
          }                                               //   you can decide how to modify the html contents.

          response.end();
        }
      );
    }
  }
).listen(PortNum);


/*****************************************************************/

function TransformData( TextFromFile, ParmAry, pathname ) // Where you modify the text read from index.html according to
{                                                         //   the params returning the modified results to be served up.
  var NewData = TextFromFile;

  if (pathname == "/list.html")  // Apply different processing "rules" for different file pathname's.
    {
      // Read dir for job-rev folders
      // Read template cut out and replicate the "<!--[[stepline-delim]]-->" chunk n times
      //   For each line, replacing the "{{stepline}}" with the corresponding line in the file.
    }
  else if (pathname == "/jobinstr.html")
    {
      NewData = NewData.replace(new RegExp("{{job}}", 'g'), ParmAry['job']);
      NewData = NewData.replace(new RegExp("{{rev}}", 'g'), ParmAry['rev']);
    }

    NewData += "<br>\n" + pathname;

  return NewData;
}
