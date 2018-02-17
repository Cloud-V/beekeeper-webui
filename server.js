#!/usr/bin/env node
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const path = require('path');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const AsyncWatch = require('async-watch').AsyncWatch;
const app = require('http').createServer(handler);
const io = require('socket.io')(app);
const fs = require('fs');
const net = require('net');
app.listen(9000);

var procData = {
	// Save the current line of code
	codeLine: "",
	// Save current child process data
	processData: "",
	// Receive current child process error
	processError: "",
	// Track the beekeeper process
	proc: undefined,
	// Track the disassembly instructions generated by beekeeper
	parsedDisassembly: "",
	// Data generated by vcd2js
	vcdDump: "",
	// Indeces of breakpoints
	breakPointsArray: []
};

var state = {
	// Whether or not we're in step mode
	step: false,
	// Whether or not we're in stepi mode
	stepi: false,
	// Whether or not the step is the first one
	firstStep: true,
	// Whether or not we're in run mode
	running: false,
	// Count number of steps
	steps: 0,
	// Track the line number currently being executed
	currentLine: 0,
	// Flag to keep track of beekeeper termination
	finished: false,
	// Keep track of whether or not the run has finished
	runningFinished: false,
	// Whether or not there are breakpoints
	breakPointsSet: false
};

var beekeeperData = {
	beekeeperPath: "/usr/local/bin/BeekeeperSupport/",
	socPath: "/usr/local/bin/BeekeeperSupport/Compiler/examplesoc.json",
	makeSocPath: "/usr/local/bin/BeekeeperSupport/makesoc",
	ccPath: "/usr/local/bin/BeekeeperSupport/cc"
}

var userData = {
	codeFileName: "code.c",
	codeCFile: "code.c",
	codeBinFile: "code.c.bin",
	codeTextFile: "./public/data/code-text.js",
	waveformDataFile: "./public/data/waveform-data.js",
	waveformTextFile: "./public/data/waveform-text.js",
	disassemblyTextFile: "./public/data/disassembly.js"
}

/*
The following functions run beekeeper and get everything initialized in order
This is the execution chain, follow it from the top down
*/
// copySoc Calls makeSoc
eventEmitter.on('codeCompiled', copySoc);
// makeSoc Calls build
eventEmitter.on('socCopied', makeSoc);
// build Calls runBeekeeper
eventEmitter.on('socMade', build);
// runBeekeeper Calls setProcessParams
eventEmitter.on('built', runBeekeeper);
// setProcessParams Calls setBeekeeperDataStream
eventEmitter.on('ranBeekeeper', setProcessParams);
// setBeekeeperDataStream Calls finishCompilation
eventEmitter.on('processParamsSet', setBeekeeperDataStream);
// finishCompilation sends returnCompiled signal through socket.io to frontend
eventEmitter.on('dataStreamDefined', function() {socket.emit('returnCompiled');})

/*
The following functions do nothing except communicate with frontend
*/
// codeSaved sends returnSaved signal through socket.io to frontend
eventEmitter.on('codeSaved', function() {socket.emit('returnSaved');});
// finishRun sends returnRun signal through socket.io to frontend
eventEmitter.on('runFinished', finishRun);
// finishStep sends returnStep signal through socket.io to frontend
eventEmitter.on('stepFinished', function() {storeVCD();});
// finishStep sends returnStep signal through socket.io to frontend
eventEmitter.on('stepiFinished', function() {storeVCD();});
// sendExitSignal sends returnStop signal through socket.io to frontend
eventEmitter.on('stopped', function() {socket.emit('returnStop');});

/*
Monitor runningFinished state value for switch.
Only release finishRun() if the value changes.
*/
AsyncWatch(state, 'runningFinished', function(oldValue, newValue){
	// var finish = (function() {
	// 	var executed = false;
	// 	return function() {
	// 		if (!executed) {
	// 			executed = true;
	// 			state['runningFinished'] = true;
	// 			console.log('called');
	// 		}
	// 	};
	// })();
	if (newValue !== oldValue && !newValue) {
		eventEmitter.emit('runFinished');
	}
});

AsyncWatch(procData, 'vcdDump', function(oldValue, newValue){
	if (state.runningFinished){
		socket.emit('returnRun', procData.vcdDump, procData.parsedDisassembly);
	}
	else if (state.step) {
		socket.emit('returnStep', procData.vcdDump, procData.parsedDisassembly, state.currentLine);
	}
	else if (state.stepi) {
		socket.emit('returnStepi', procData.vcdDump, procData.parsedDisassembly, state.currentLine);
	}
	else if (!state.runningFinished && state.breakPointsSet) {
		socket.emit('returnBreak', procData.vcdDump, procData.parsedDisassembly);
	}
});

/*
Catch all exceptions to make sure server doesn't crash
TODO exception handling needs to be done properly
*/
process.on('uncaughtException', function (err) {
	console.error(err);
});
/*
Bind the process exit event to our exit handler
*/
process.on('exit', exitHandler.bind(null,{exit:true}));

// so the program will not close instantly
process.stdin.resume();

/*
HTTP server handler
*/
function handler (req, res) {
	fs.readFile(__dirname + '/public/index.html',
		function (err, data) {
			if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

/*
Handle the process exit
*/
function exitHandler(options, err) {
    if (options.exit) {
		if (typeof(procData.proc) !== 'undefined') {
			procData.proc.kill();
		}
		socket.emit('message', "Exit");
		process.exit();
	}
}

/*
Store the vcd2waveform data in the user data folder
*/
function storeVCD() {
	var child = spawn('./vcd2js.pl', ['dump.vcd']);
	var output = "";
	child.stdout.on('data', (data) => {
		output += data;
	});
	// Only save when process is finished
	child.stdout.on('close', function(code) {
        procData.vcdDump = output;
		child.kill();
    });
}

/*
Helper function to store files on drive
*/
function storeFile(file, text) {
	fs.writeFile(file, text, function(err) {
		if(err) {
			console.log(err);
			socket.emit('error', err);
		}
	});
}

/*
Save user code taken from Ace instance
*/
function saveCode (code) {
	storeFile(userData.codeCFile, code);
	storeFile(userData.codeTextFile, "var code=`" + code + "`;");
	eventEmitter.emit('codeSaved');
}

/*
run cc
*/
function compileCode(code) {
	state['runningFinished'] = false;
	state['run'] = false;
	state['step'] = false;
	state['stepi'] = false;
	procData['processData'] = "";
	procData['parsedDisassembly'] = "";
	saveCode(code);
	global.code = code;
	//
	exec (`${beekeeperData.ccPath} ${userData.codeCFile}`, (error1, stdout1, stderr1) => {
		if (error1 || stderr1) {
			console.error(`cc failed: ${error1}.`);
			socket.emit('message', "Compilation Failed");
		}
		else eventEmitter.emit('codeCompiled');
	});
}

/*
run samplesoc
*/
function copySoc() {
	exec (`cp -f ${beekeeperData.socPath} soc.json`, (error, stdout, stderr) => {
		if (error || stderr) {
			console.error(`Couldn't copy samplesoc: ${error}.`);
			socket.emit('error', error);
		}
		else eventEmitter.emit('socCopied');
	});
}

/*
run makesoc
*/
function makeSoc() {
	exec (`${beekeeperData.makeSocPath} soc.json`, (error, stdout, stderr) => {
		if (error || stderr) {
			console.error(`Couldn't makesoc: ${error}.`);
			socket.emit('error', {error});
		}
		else eventEmitter.emit('socMade');
	});
}

/*
build
*/
function build() {
	exec (`iverilog -o ${userData.codeCFile}.bin_dump/Beekeeper.vvp -I${beekeeperData.beekeeperPath} BFM.v`, (error3, stdout3, stderr3) => {
		if (error3 || stderr3) {
			console.error(`iverilog failed: ${error3}.`);
			socket.emit('error', error3);
		}
		else eventEmitter.emit('built');
	});
}

/*
Initialize the beekeeper process
*/
function runBeekeeper() {
	// If a beekeeper process is running, kill it
	if (procData.proc !== undefined) procData.proc.kill();
	// reset step to false if there was a previous run
	state.step = false;
	state.stepi = false;
	// remove any previous dump
	spawn('rm', ['-f', 'dump.vcd']);
	// vvp -M/usr/local/bin/BeekeeperSupport -mBeekeeper code.c.bin_dump/Beekeeper.vvp
	procData.proc = spawn('vvp', [`-M${beekeeperData.beekeeperPath}`, '-mBeekeeper', `${userData.codeCFile}.bin_dump/Beekeeper.vvp`]);
	eventEmitter.emit('ranBeekeeper');
}

/*
Set the program path for beekeeper and process communication
*/
function setProcessParams() {
	if (procData.proc != undefined) {
		procData.proc.stdin.setEncoding('utf-8');
		// set beekeeper program path
		procData.proc.stdin.write(`${userData.codeBinFile}\n`);
		// NOTE uncomment for debugging
		procData.proc.stdout.pipe(process.stdout);
		eventEmitter.emit('processParamsSet');
	}
}

/*
* TODO simplify this function
* This is where all the interaction with the beekeeper process takes place
*/
function setBeekeeperDataStream() {
	procData.proc.stdout.on('data', (data) => {
		global.data = data;
		global.detected = false;
		// convert data object to string
		data = "" + data;
		if (data.includes('Invalid input')) {
			socket.emit('message', `Sorry, you can't do that!`);
		}
		else if (data.includes('JAL zero, 0')) {
			if (!detected) {
				detected = true;
				procData.parsedDisassembly += data;
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/(?:\r\n|\r|\n)/g, '<br/>');
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/\[.*\](?:\r\n|\r|\n)(beekeeper)(\s)(JAL zero, 0)/g, "<br/>");
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/(JAL zero, 0)/g, "<br/>");
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/(<br\/>){2,}/g, "<br/>");
				state['runningFinished'] = true;
			}
			procData.proc.stdout.pause();
			procData.proc.stdin.pause();
			procData.proc.kill();
		}
		else if (data.includes('Memory') || data.includes('VCD') || data.includes('Targetting') || data.includes('Program') || data.includes('Breakpoint')) {}
		else if (data.includes('Running')) {
			procData.parsedDisassembly += data;
			if (state.stepi) {
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/Running instruction by instruction\.\.\./g, "");
			} else if (state.step) {
				procData.parsedDisassembly += "[0x00000000] : <br/>"
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/Running step by step\.\.\./g, "");
			} else if (state.run) {
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/Running normally\.\.\./g, "");
			}
			storeVCD();
		}
		// If beekeeper is included in output data stream , beekeeper is stepping
		else if (data.includes('beekeeper')) {
			if (state.step || state.stepi) {
				procData.parsedDisassembly += data;
				if (state.step) {
					procData.parsedDisassembly = procData.parsedDisassembly.replace(/(?:\r\n|\r|\n)(\(beekeeper\)\s)/g, " : <br/>");

				} else if (state.stepi) {
					procData.parsedDisassembly = procData.parsedDisassembly.replace(/(?:\r\n|\r|\n)(\(beekeeper\)\s)/g, " : ");
				}
				// The filename is only included if beekeeper is moving to a new line
				if (data.includes(`${userData.codeCFile}`)) {
					procData.parsedDisassembly = procData.parsedDisassembly.replace(/(code.c:)([1-9]+)(\s0x)/g, "0x");
					state.currentLine = parseInt(data.substring(data.indexOf(`${userData.codeCFile}`) + userData.codeCFile.length + 1, data.indexOf("0x")));
				}
			}
			// If not stepping clean up the data by removing addresses and '(beekeeper)'
			else {
				procData.parsedDisassembly += data;
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/(\[.*\]\s)/g, "");
				procData.parsedDisassembly = procData.parsedDisassembly.replace(/(\(beekeeper\)\s)/g, "<br/>");
			}
			// Whether running or stepping, replace new lines with HTML breaks and replace big breaks with small ones
			procData.parsedDisassembly = procData.parsedDisassembly.replace(/(?:\r\n|\r|\n)/g, '<br/>');
			procData.parsedDisassembly = procData.parsedDisassembly.replace(/(<br\/>){2,}/g, "<br/>");
			storeVCD();
		}
		// If data is plain assembly
		else {
			procData.parsedDisassembly += data;
			procData.parsedDisassembly = procData.parsedDisassembly.replace(/(?:\r\n|\r|\n)/g, '<br/>');
			storeVCD();
		}
	});
	eventEmitter.emit('dataStreamDefined');
}

/*
* Store the VCD dump
*/
function finishRun() {
	storeVCD();
}

// Where all socket.io communication to buttonInterface takes place
io.on("connection", function (socket) {
	// make socket object global
	global.socket = socket;

	// Save signal received when save button is pressed
	socket.on('save', function (code) {
		saveCode(code);
		eventEmitter.emit('codeSaved');
	});

	// Compile signal received when compile button is pressed
	socket.on('compile', function (code) {
		compileCode(code);
	});

	// Run signal received when run button is pressed
	socket.on('run', function(code) {
		state.run = true;
		procData.proc.stdin.write('run\n');
	});

	socket.on('continue', function(code) {
		procData.proc.stdin.write('continue\n');
	});

	// Breakpoints signal received when running
	socket.on('breakpoints', function(breakpoints) {
		// If breakpoints are 0 then they're at default and no points were set
		// console.log(breakpoints);
		if (breakpoints === null) {
			state.breakPointsSet = false;
			for (var i = 0; i < procData.breakPointsArray.length; i++) {
				procData.proc.stdin.write(`break ${userData.codeCFile}:${i}\n`);
			}
			procData.breakPointsArray = [];
		}
		if (breakpoints != null && breakpoints.length > 0) {
			state.breakPointsSet = true;
			for (var i = 0; i < breakpoints.length; i++) {
				procData.breakPointsArray.push(breakpoints[i]);
				procData.proc.stdin.write(`break ${userData.codeCFile}:${breakpoints[i]}\n`);
				// console.log(`break ${userData.codeCFile}:${breakpoints[i]}\n`);
			}
		}
	});

	// Step signal received when step button is pressed
	socket.on('step', function(code) {
		state.step = true;
		procData.proc.stdin.write('step\n');
	});

	// Stepi signal received when step instruction button is pressed
	socket.on('stepi', function(code) {
		state.stepi = true;
		procData.proc.stdin.write('stepi\n');
	});

	// Stop signal received when stop button is pressed
	socket.on('stop', function(code) {
		if (procData.proc !== 'undefined') procData.proc.kill();
		// initialize();
		eventEmitter.emit('stopped');
	});
});
