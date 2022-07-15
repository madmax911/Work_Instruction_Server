/*

I Max Calcagno am the creator of this simple NodeJS web server tutorial.  I created it to start a micro framework
for a project I'm doing for my employer.  I created this because other tutorials out there I found difficult to
understand mostly because no one ever includes decent (and obvious) test data.  I believe So many people are caught
in this mentality of separation of concerns and hardcore isolation and abstraction that most of the examples I
found were devoid of anything even resembling dummy data.  Things got put into arrays, json and other data structures
but was otherwise hidden from view in the code making it very hard to tell what's test data and what's not.

Dammit!  I want things like favoritefood = pizza, carcolor = black, etc... REAL dummy data, not just more abstract code.

It's astonishing how few nodejs/javascript programmers put some simple obvious test data to show something in action.

****************************************************************************************************************************/

var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var MimeTypesAry = require('./mime.json');

var TestMode = true; // Will display a Reset Server button right on the page.  Enjoy  ;-) -- Max Calcagno
var PortNum = 8005;


http.createServer
(
  function (request, response)
  {
    var path = url.parse(request.url).path; // String:  /index.html?name=Max&favoritefood=pizza&favoritedrink=pepsi
    var pathname = url.parse(request.url).pathname; // String:  /index.html
    if (pathname == "/")
    {
      pathname = "/list.html"; // HACK:  Hard coded for demo. - Must change
    }
    var params = qs.parse(url.parse(request.url).query); // Array:  params['name'] = "Max", etc...

    if (TestMode && params['QuitServer'] == 1) // Reset server if browser hits reset button and in TestMode
    {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write
      (
        "<script> setTimeout('window.open(\""
        + path.replace("?QuitServer=1", "").replace("&QuitServer=1", "")
        + "\", \"_self\")', 200); </script> Reloading..." // , then reload client page
                                                          //   after 200ms giving server time to restart.
      );
      response.end();
      process.exit(); // Exits node - don't worry batch file will loop back and reload it.
    }
    else
    {
      var file_ext = pathname.split(".")[1];
      var file_mime = MimeTypesAry[file_ext];
      var file_mime_type = file_mime.split('/')[0];
      var file_mime_subtype = file_mime.split('/')[1];

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
            var fileText = data.toString();
            response.writeHead(200, {'Content-Type': file_mime});
            
            if (file_mime_type == 'image') // This is sort of like a hierarchial handler for mime types
            {
              response.write(data, 'binary');
            }
            else if (file_mime_type == 'text')
            {
              if (file_mime_subtype == 'html') // ? Possible future use for css and javascript subtypes too ?
              {
                if (TestMode) // Insert reset server button if in TestMode.
                {
                  fileText = fileText.replace("<body>", "<body>\n<div id=\"RstBtn\" "      // Inserts Button after "<body>"
                      + " style=\"position:absolute; top:0px; left:250px; opacity:0.7;\">" //   Warning:  This may change
                      + " <input type=\"button\" name=\"ResetServer\" value=\"Reset Server\" "
                      +    "onclick=\"var q; "
                      +    "  if (document.location.toString().indexOf('?') == -1) {q='?'} "
                      +                                             " else {q='&'}; "
                      +     " window.open(document.location + q + 'QuitServer=1', '_self')\"></div>");
                }
                
                response.write
                (
                  TransformHTML( fileText, params, pathname ) // Sends in contents of read file (index.html), parameter array
                                                              //   and the pathname of the file for determining action.
                                                              //   (/index.html)
                );
              }
              else if (file_mime_subtype == 'css')
              {
                response.write( fileText ); // Serve css
              }
            }
          }
          response.end();
        }
      );  // Nothing goes after this ... it's an async call and this is the callback function, remember?
    }
  }
).listen(PortNum);



/***************************************************************************************************************************/
/*  INFORMATION - about file/parameter handling
------------

URL path & parameters handled:

  http://localhost:8005/list.html
    http://localhost:8005/jobinstr.html?job=0617&ver=001
       
     (One per folder with diff job and ver  jjjj     vvv)
                                                  ^
Parameter meanings:                      ^       ver is the job version number (not cust rev)
                                        job is the 4 digit job number
*/
/***************************************************************************************************************************/
//
function TransformHTML( TextFromFile, ParmAry, pathname ) // Where you modify the text read from index.html according to
{                                                         //   the params returning the modified results to be served up.
  var NewData = TextFromFile;

  if (pathname == "/list.html")  // Apply different processing "rules" for different file pathname's.
  {
    // Read dir for job-ver folders
    // Read template cut out and replicate the "<!--[[stepline-delim]]-->" chunk n times
    //   For each line, replacing the "{{stepline}}" with the corresponding line in the file.
  }
  else if (pathname == "/jobinstr.html")
  {
    NewData = NewData.replace(new RegExp("{{job}}", 'g'), ParmAry['job']);
    NewData = NewData.replace(new RegExp("{{ver}}", 'g'), ParmAry['ver']);

    // Testing
    var SomeAwesomeString = "";
    var items;

    // SomeAwesomeString += "top<br>";

    items = fs.readdirSync("./jobs/" + ParmAry['job'] + "-" + ParmAry['ver'] + "/q-alerts")
    // SomeAwesomeString = items.toString();

    //console.log(items.length);

    var CurrQAlertAry = new Array();

    for (var i=0; i<items.length; i++)
    {
      SomeAwesomeString += items[i] + "<br>";

      CurrQAlertAry[items[i]] = require("./jobs/" + ParmAry['job'] + "-" + ParmAry['ver'] + "/q-alerts/" + items[i] + "/fields.json");
      // console.log(SomeAwesomeString);
    };

    //CurrQAlertAry['a1'] = require("./jobs/6010-001/q-alerts/a1/fields.json");
    //CurrQAlertAry = require("./jobs/6010-001/q-alerts/a1/fields.json");

    SomeAwesomeString = CurrQAlertAry['a1']['alertdate'];
    //console.log(CurrQAlertAry['a1']);

    NewData = NewData.replace(new RegExp("{{stepline}}", 'g'), SomeAwesomeString);
  };

  return NewData;
}
