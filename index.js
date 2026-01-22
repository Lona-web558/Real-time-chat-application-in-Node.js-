// server.js
var http = require('http');
var fs = require('fs');
var path = require('path');

var clients = [];
var messages = [];

var server = http.createServer(function(req, res) {
  if (req.url === '/') {
    fs.readFile(path.join(__dirname, 'client.html'), function(err, data) {
      if (err) {
        res.writeHead(500);
        res.end('Error loading client.html');
        return;
      }
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
  } else if (req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    clients.push(res);
    
    // Send existing messages to new client
    for (var i = 0; i < messages.length; i++) {
      res.write('data: ' + JSON.stringify(messages[i]) + '\n\n');
    }
    
    req.on('close', function() {
      var index = clients.indexOf(res);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  } else if (req.url === '/send' && req.method === 'POST') {
    var body = '';
    
    req.on('data', function(chunk) {
      body += chunk.toString();
    });
    
    req.on('end', function() {
      var message = JSON.parse(body);
      message.timestamp = new Date().toLocaleTimeString();
      messages.push(message);
      
      // Broadcast to all clients
      for (var i = 0; i < clients.length; i++) {
        clients[i].write('data: ' + JSON.stringify(message) + '\n\n');
      }
      
      res.writeHead(200, {'Content-Type': 'application/json'});
      res.end(JSON.stringify({success: true}));
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

var PORT = 3000;
server.listen(PORT, function() {
  console.log('Chat server running on http://localhost:' + PORT);
});

// client.html (save this as a separate file)
/*
<!DOCTYPE html>
<html>
<head>
  <title>Real-time Chat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 600px;
      margin: 50px auto;
      padding: 20px;
    }
    #messages {
      border: 1px solid #ccc;
      height: 400px;
      overflow-y: auto;
      padding: 10px;
      margin-bottom: 10px;
      background: #f9f9f9;
    }
    .message {
      margin: 10px 0;
      padding: 8px;
      background: white;
      border-radius: 5px;
    }
    .username {
      font-weight: bold;
      color: #0066cc;
    }
    .timestamp {
      font-size: 0.8em;
      color: #666;
      margin-left: 10px;
    }
    #input-area {
      display: flex;
      gap: 10px;
    }
    #username {
      width: 150px;
      padding: 10px;
    }
    #message {
      flex: 1;
      padding: 10px;
    }
    button {
      padding: 10px 20px;
      background: #0066cc;
      color: white;
      border: none;
      cursor: pointer;
    }
    button:hover {
      background: #0052a3;
    }
  </style>
</head>
<body>
  <h1>Real-time Chat Application</h1>
  <div id="messages"></div>
  <div id="input-area">
    <input type="text" id="username" placeholder="Your name" value="Anonymous">
    <input type="text" id="message" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>
  </div>

  <script>
    var messagesDiv = document.getElementById('messages');
    var messageInput = document.getElementById('message');
    var usernameInput = document.getElementById('username');

    var eventSource = new EventSource('/events');

    eventSource.onmessage = function(event) {
      var message = JSON.parse(event.data);
      displayMessage(message);
    };

    function displayMessage(message) {
      var messageElement = document.createElement('div');
      messageElement.className = 'message';
      messageElement.innerHTML = '<span class="username">' + message.username + '</span>' +
                                 '<span class="timestamp">' + message.timestamp + '</span>' +
                                 '<div>' + message.text + '</div>';
      messagesDiv.appendChild(messageElement);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function sendMessage() {
      var text = messageInput.value.trim();
      var username = usernameInput.value.trim() || 'Anonymous';
      
      if (text === '') {
        return;
      }

      var message = {
        username: username,
        text: text
      };

      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/send', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(message));

      messageInput.value = '';
    }

    messageInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  </script>
</body>
</html>
*/