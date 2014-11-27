//include
var	fs=require("fs"),
	rl=require("readline"),
	cp=require("child_process");

//formatting
var	fmt={
	cp_err: "\x1b[31m>>\x1b[39m%s",
	cp_out: "\x1b[32m>>\x1b[39m%s",
	fmt: function(txt) {
		return "  "+txt.replace(/(\r?\n|\r)/g, "$1  ")+"\x1b[39m";
		},
	err: function(txt) {
		return "\x1b[31m"+fmt.fmt(txt);
		},
	out: function(txt) {
		return "\x1b[90m"+fmt.fmt(txt);
		}
	};

//input
var	input=null,
	cli=rl.createInterface(process.stdin, process.stdout);
console.log=function(initial) {
	return function() {
		cli.output.write("\x1b[2K\x1b[3D");
		initial.apply(console, arguments);
		cli._refreshLine();
		};
	}(console.log);
cli.prompt();
cli.on("line", input=function(data) {
	data=data.toString().split(/^(\w+) ?/);
	var	command=data[1];
	data=data[2];
	switch(command) {
		default:
			console.log(fmt.err("invalid command '%s'"), command);
			break;
		case "?":
		case "help":
			console.log(fmt.out(
					"help             this message"+
				"\r\ndir     [path]   directory to load from"+
				"\r\neval    [code]   evaluate code"+
				"\r\nexec    [code]   run shell command"+
				"\r\nlist             list child processes"+
				"\r\nkill    [id]     kill child process"+
				"\r\nstart   [id]     create new child process"+
				"\r\nrestart [id]     restart child process"+
				"\r\nignore  [id]     toggle logging for process"+
				"\r\nuse     [id]     select process to send data to"+
				"\r\nsend    [data]   send data to selected process"
				));
			break;
		case "cd":
		case "dir":
			dir=data;
			console.log(fmt.out("set dir to '%s'"), dir);
			break;
		case "eval":
			try {
				console.log(fmt.out(String(eval(data))));
				}
			catch(error) {
				console.log(fmt.err(error.message));
				}
			break;
		case "exec":
			cp.exec(data, function(error, stdout, stderr) {
				if(error) {
					console.log(fmt.err(error.message));
					}
				else {
					console.log(fmt.out((stdout||stderr).toString()));
					}
				});
			break;
		case "list":
			console.log(fmt.out(Object.keys(cps).join("\r\n")));
			break;
		case "kill":
		case "stop":
			if(cps[data]) {
				cps[data].kill();
				delete cps[data];
				console.log(fmt.out("killing %s..."), data);
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "node":
		case "load":
		case "start":
			if(cps[data]) {
				console.log(fmt.err("already running %s"), data);
				}
			else {
				spawn(data);
				}
			break;
		case "reload":
		case "restart":
			if(cps[data]) {
				var	reuse=usecp===cps[data];
				cps[data].kill();
				console.log(fmt.out("killing %s..."), data);
				spawn(cps[data]._path);
				if(reuse) {
					usecp=cps[data];
					}
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "ignore":
		case "silence":
			if(ignore[data]) {
				ignore[data]=0;
				console.log(fmt.out("%s logging on"), data);
				}
			else {
				ignore[data]=1;
				console.log(fmt.out("%s logging off"), data);
				}
			break;
		case "use":
		case "select":
			if(cps[data]) {
				usecp=cps[data];
				console.log(fmt.out("using %s"), data);
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "send":
			if(usecp) {
				usecp.send(data);
				console.log(fmt.out("cp > %s"), data);
				}
			else {
				console.log(fmt.err("no process selected"));
				}
			break;
		}
	console.log();
	cli.prompt();
	});

//processes
var	dir="",
	cps={},
	ignore={},
	usecp=null;
function spawn(path) {
	var	id=path.replace(/.+\//, "");
	console.log(fmt.out("loading %s..."), id);
	cps[id]=cp.fork(dir+path);
	cps[id]._name=id;
	cps[id]._path=dir+path;
	cps[id].on("exit", event_exit);
	cps[id].on("error", event_error);
	cps[id].on("message", event_message);
	};
function event_exit(code) {
	if(cps[this._name]===this) {
		delete cps[this._name];
		}
	console.log(fmt.cp_err, this._name);
	console.log(fmt.err("killed"));
	console.log();
	}
function event_error(error) {
	console.log(fmt.cp_err, this._name);
	console.log(fmt.err(error.stack));
	console.log();
	};
function event_message(data) {
	if(!ignore[this._name]) {
		data[0]=fmt.out(data[0]);
		console.log(fmt.cp_out, this._name);
		console.log.apply(console, data);
		console.log();
		}
	};
fs.readFile("startup.txt", function(error, data) {
	if(!error) {
		data=data.toString().split(/\r?\n/);
		for(var i=0; i<data.length; ++i) {
			input(data[i]);
			}
		console.log();
		}
	});