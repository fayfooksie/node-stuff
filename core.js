"use strict";

//include
var	fs=require("fs"),
	rl=require("readline"),
	cp=require("child_process");

//format
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
var	cli=rl.createInterface(process.stdin, process.stdout);
console.log=function(initial) {
	return function() {
		cli.output.write("\x1b[2K\x1b[3D");
		initial.apply(console, arguments);
		cli._refreshLine();
		};
	}(console.log);
cli.prompt();
cli.on("line", function(data) {
	data=data.toString().split(/^(\w+) ?/);
	switch(data[1]) {
		default:
			console.log(fmt.err("invalid"));
			break;
		case "help":
			console.log(fmt.out(
					"help             this message"+
				"\r\neval    [code]   evaluate code"+
				"\r\ncplist           list child processes"+
				"\r\nkill    [id]     kill child process"+
				"\r\nstart   [id]     create new child process"+
				"\r\nrestart [id]     restart child process"+
				"\r\nuse     [id]     select process to send data to"+
				"\r\nsend    [data]   send data to selected process"
				));
			break;
		case "eval":
			try {
				console.log(fmt.out(String(eval(data[2]))));
				}
			catch(error) {
				console.log(fmt.err(error.message));
				}
			break;
		case "cplist":
			console.log(fmt.out(Object.keys(cps).join("\r\n")));
			break;
		case "kill":
			if(cps[data[2]]) {
				cps[data[2]].kill();
				delete cps[data[2]];
				console.log(fmt.out("killing %s..."), data[2]);
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "start":
			spawn(data[2]);
			break;
		case "restart":
			if(cps[data[2]]) {
				cps[data[2]].kill();
				console.log(fmt.out("killing %s..."), data[2]);
				spawn(data[2]);
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "use":
			if(cps[data[2]]) {
				usecp=cps[data[2]];
				console.log(fmt.out("using %s"), data[2]);
				}
			else {
				console.log(fmt.err("no such process"));
				}
			break;
		case "send":
			usecp.send(data[2]);
			console.log(fmt.out("cp > %s"), data[2]);
			break;
		}
	console.log();
	cli.prompt();
	});

//processes
var	cps={},
	usecp=null;
function spawn(id) {
	console.log(fmt.out("loading %s..."), id);
	cps[id]=cp.fork("server/processes/"+id);
	cps[id]._name=id;
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
	data[0]=fmt.out(data[0]);
	console.log(fmt.cp_out, this._name);
	console.log.apply(console, data);
	console.log();
	};
fs.readdir("server/processes", function(error, files) {
	for(var i=0; i<files.length; ++i) {
		spawn(files[i]);
		}
	usecp=cps[files[0]];
	console.log();
	});
