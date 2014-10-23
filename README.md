##core.js
The master process for my personal site. It runs all child processes in `server/processes/` (can be edited on line 108) and provides command-line control over and monitoring of them.
For pretty logging, replace `console.log(a, b, c, ...)` with `process.send([a, b, c, ...])`
A few commands:
- help - list all commands and descriptions
- eval [code] - execute some code
- cplist - list currently running processes
- kill [id] - kill process by name
- start [id] - start process by name (same path as initial run)
- restart [id] - kill and restart process by name
- use [id] - select process
- send [data] - send data to selected process (handle with `process.on("message", fnc)`)
