// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var ParseDashboard = require('parse-dashboard');
var path = require('path');
var OneSignalPushAdapter = require('parse-server-onesignal-push-adapter');
var oneSignalPushAdapter = new OneSignalPushAdapter({
  oneSignalAppId: process.env.ONE_SIGNAL_APP_ID || "your-one-signal-app-id",
  oneSignalApiKey: process.env.ONE_SIGNAL_API_KEY || "your-one-signal-api-key"
});

var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  clientKey: process.env.CLIENT_KEY || '', //optional
  masterKey: process.env.MASTER_KEY || '', //Add your master key here. Keep it secret!
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',  // Don't forget to change to https if needed
  fileKey: process.env.FILE_KEY || '',
  javascriptKey: process.env.JAVASCRIPT_API_KEY || '',
  restKey: process.env.REST_API_KEY || '',
  push: {
    adapter: oneSignalPushAdapter
  },
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  },
  push: {
	android: {
		senderId: process.env.GCM_SENDER_ID || '', // The Sender ID of GCM
		apiKey: process.env.GCM_API_KEY || '' // The Server API Key of GCM
	}
  }
});
const dashboard = new ParseDashboard({
  "apps": [
    {   // serverURL, appId, masterKey are same as ParseServer's settings
      "serverURL": process.env.SERVER_URL || 'http://localhost:1337/parse',
      "appId": process.env.APP_ID || 'myAppId',
      "masterKey": process.env.MASTER_KEY || '',
      "appName": process.env.APP_NAME || '',
      "javascriptKey": process.env.JAVASCRIPT_API_KEY || '',
      "restKey": process.env.REST_API_KEY || '',
      "user": process.env.PARSE_DASHBOARD_ADMIN_USERNAME || "username",
      "pass": process.env.PARSE_DASHBOARD_ADMIN_PASSWORD || "password",
      "production": false
    }
  ],
  "users": [
    {
      "user": process.env.PARSE_DASHBOARD_ADMIN_USERNAME || "username",
      "pass": process.env.PARSE_DASHBOARD_ADMIN_PASSWORD || "password"
    }
  ]
}, true);
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);
var dashMountPath = process.env.PARSE_DASHBOARD_MOUNT || '/dashboard';
app.use(dashMountPath, dashboard);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

var port = process.env.PORT || 1337;
var httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
