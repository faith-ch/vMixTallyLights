const { Command } = require("commander");
const { ConnectionTCP } = require("node-vmix");
// Import dependencies
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const program = new Command();
let ip;
let comP;
let timeOut;
let vMixConnected = false;
let comPortConnected = false;
let device;
let deviceInterface;
let parser;
let currentValue = 0;
let frequency;
let sentValue;

program
  .name("vMix Tally lights")
  .description(
    "A programm that allows you, to integrate tally lights with vMix."
  )
  .version("1.0.0");

program
  .command("start")
  .description("Starts the aplication")
  .option("-i, --ip <ip addr>", "vMix host IP address", "127.0.0.1")
  .option(
    "-t, --timeout <seconds>",
    "connection timeout for vmix and the tally lights",
    "10"
  )
  .requiredOption(
    "-cp, --comport <comport number>",
    "The comport of the tally lights device"
  )
  .option(
    "-f, --frequency <frequency number>",
    "The frequency on which the data is going to be send",
    "1"
  )
  .action((options) => {
    ip = options.ip;
    comP = options.comport;
    timeOut = options.timeout;
    frequency = options.frequency;
  });
program.parse();

if (!ip.includes(".")) {
  throw new Error("Invalid IP address");
} else {
  ip = ip.split(".");
  if (ip.length != 4) {
    throw new Error("Invalid IP address");
  } else {
    for (let i = 0; i < ip.length; i++) {
      if (!parseInt(ip[i]) && parseInt(ip[i]) != 0) {
        throw new Error(`The value on the ${i + 1} octet is not a number!`);
      }
    }
    for (let i = 0; i < ip.length; i++) {
      if (parseInt(ip[i]) > 255) {
        throw new Error(
          `The value on the ${i + 1}th octet is bigger than 255!`
        );
      }
    }

    ip = `${ip[0]}.${ip[1]}.${ip[2]}.${ip[3]}`;
  }
}

if (!parseInt(comP) && parseInt(comP) != 0) {
  throw new Error(
    `The value of the comport option is not a number! \n PLease specify a valid number for the comport!`
  );
} else {
  comP = parseInt(comP);
}

if (!parseInt(timeOut) && parseInt(timeOut) != 0) {
  throw new Error(
    `The value of the timeOut option is not a number! \n PLease specify a valid number for the timeout!`
  );
} else {
  timeOut = parseInt(timeOut);
}
if (!parseInt(frequency)) {
  throw new Error(
    `The value of the frequency option is not a number Or it is 0 or lower!\n PLease specify a valid number for the frequency!`
  );
} else {
  frequency = parseInt(frequency);
}

async function getDevice() {
  const deviceList = await SerialPort.list();
  deviceList.forEach((devicePort) => {
    if (devicePort.path === `COM${comP}`) {
      device = devicePort;
    }
  });
  if (!device) {
    throw new Error("The com port, that you specifed, does not exist!");
  }
  // Defining the serial port
  deviceInterface = new SerialPort({
    path: device.path,
    baudRate: 9600,
  });

  // The Serial port parser
  parser = new ReadlineParser();
  deviceInterface.pipe(parser);
  // Read the data from the serial port
  connectionTimeout(timeOut, "com");
  start();
  // Write the data to the serial port
}

function start() {
  sendData();
  parser.on("data", (line) => {
    if (!comPortConnected) {
      console.log(line);
      comPortConnected = true;
    } else {
      console.log(line);
    }
  });
}

const connection = new ConnectionTCP(ip);
connectionTimeout(timeOut, "vMix");
connection.on("tally", (tally) => {
  // Your logic here!
  const temp = tally.slice(0, 3);
  const cams = temp.split("");
  if (cams[0] === "1") {
    currentValue = 1;
  } else if (cams[1] === "1") {
    currentValue = 2;
  } else if (cams[2] === "1") {
    currentValue = 3;
  }
});

// Listener for data such as tally
connection.on("data", (data) => {
  if (!vMixConnected) {
    if (data.includes("VERSION")) {
      vMixConnected = true;
    } else {
      throw new Error(data);
    }
  }
});

connection.on("connect", () => {
  connection.send("SUBSCRIBE TALLY");
  getDevice();
});

function connectionTimeout(timeOut, proccess) {
  setTimeout(() => {
    if (!vMixConnected && proccess == "vMix") {
      throw new Error(`vMix connection request timed out!\n `);
    } else if (!comPortConnected && proccess == "com") {
      throw new Error(`Couldn't connect to com port!`);
    }
  }, timeOut * 1000);
}

function sendData() {
  sendData = currentValue;
  deviceInterface.write(`${currentValue}`);
  setInterval(() => {
    sendData = currentValue;
    deviceInterface.write(`${currentValue}`);
  }, frequency * 1000);
}
