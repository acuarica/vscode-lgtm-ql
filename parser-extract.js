
const fs = require('fs-extra');
const parserJson = fs.readJSONSync("parser.json")
console.log(parserJson.data)

