// Import dependencies
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
// Defining the serial port
const port = new SerialPort({
  path: "COM5",
  baudRate: 9600,
});

// The Serial port parser
const parser = new ReadlineParser();
port.pipe(parser);

// Read the data from the serial port
parser.on("data", (line) => console.log(line));

// Write the data to the serial port

setInterval(() => {
  port.write("ROBOT POWER ON");
}, 1000);
