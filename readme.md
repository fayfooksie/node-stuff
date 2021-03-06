##core.js
The master process for my personal site. It runs all child processes in `startup.txt` and provides command-line control over and monitoring of them. Pretty convenient for easy managing and testing (restarting a process as simple as `restart [id]`).

####A few commands
- `help` - list all commands and descriptions
- `eval [code]` - execute some code
- `exec [code]` - run shell command
- `list` - list currently running processes
- `kill [id]` - kill process by name
- `start [id]` - start process by name (same path as initial run)
- `restart [id]` - kill and restart process by name
- `use [id]` - select process
- `send [data]` - send data to selected process (handle with `process.on("message", fnc)`)

####Startup
Commands that run on startup can be defined in `startup.txt` in the current directory, skipping lines between commands. An example startup.txt:
```
start app.js
start site/forum.js
start games/spaceships.js
start games/online-pong.js
```

####Communication
For pretty logging, replace `console.log(a, b, c, ...)` with `process.send([a, b, c, ...])`

Data sent to a process with `send [data]` can be handled with
```javascript
process.on("message", function(data) {
	process.send(["received %s", data]);
	});
```
