const express = require("express");
const app = express();
const reload = require("reload");
const path = require("path");
const mongo = require('mongodb').MongoClient;
const io = require('socket.io')();

//Connection URL.
const url = 'mongodb://localhost:27017';

//Database Name.
const dbName = "testingdb";
const connections = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("port", process.env.PORT || 4000);

app.use(require(path.join(__dirname, "routes/index.js")))

const server = app.listen(app.get("port"), function() {
	console.log("Listening on port: %s ", app.get("port"))
})

io.attach(server)
reload(app);

//Use connect method to connect to the server.
mongo.connect(url, function(err, db) {
	if(err) throw err
	console.log("MondoDB connected...");
	
	const dbase = db.db(dbName);
	const chatCollection = dbase.collection("testing1")

	

	//connect to socket.io.
	io.on("connection", function(socket) {
		connections.push(socket);
		console.log("Currently connedted: %s ", connections.length)

		// var myobj = [
	 //    { name: 'Usman', message: 'Highway 71'},
	 //    { name: 'Peter', message: 'Lowstreet 4'},
	 //    { name: 'Amy', message: 'Apple st 652'},
	 //    { name: 'Hannah', message: 'Mountain 21'},
	 //    { name: 'Michael', message: 'Valley 345'},
	 //    { name: 'Sandy', message: 'Ocean blvd 2'},
	 //    { name: 'Betty', message: 'Green Grass 1'},
	 //    { name: 'Richard', message: 'Sky st 331'},
	 //    { name: 'Susan', message: 'One way 98'},
	 //    { name: 'Vicky', message: 'Yellow Garden 2'},
	 //    { name: 'Ben', message: 'Park Lane 38'},
	 //    { name: 'William', message: 'Central st 954'},
	 //    { name: 'Chuck', message: 'Main Road 989'},
	 //    { name: 'Viola', message: 'Sideway 1633'}
  //   ];

    
	 //    chatCollection.insertMany(myobj, function(err, result) {
	 //    	console.log("Inserted Documents")
	 //    })

		socket.on("disconnect", function(data) {
			connections.splice(connections.indexOf(socket, 1));
		})

		//Create function to send status.
		sendStatus = function(s) {
			socket.emit("status", s);
		}

		//Get chats from mongo collection
		chatCollection.find().limit(100).sort({_id:1}).toArray(function(err, res) {
			if(err) {
				console.log(err)
			} 

			//Emit the messages
			socket.emit("output", res);

			//Handle input events.
			socket.on("input", function(data) {
				let name = data.name;
				let message = data.message;

				//check for name and message.
				if(name === "" || message === "") {
					sendStatus("Please enter a name and a message.");
				} else {
					//Insert message in the database.
					chatCollection.insert({name: name, message: message}, function() {
						io.emit("output", [data]);

						//Send status object.
						sendStatus({
							message: "Message sent!",
							clear: true
						});
					});
				}
			});

			//Handle clear
			socket.on("clear", function(data) {
				//Remove all chats from collection.
				chatCollection.remove({}, function() {
					//Emit cleared
					socket.emit("cleared");
				});
			});
		});
	})
})

