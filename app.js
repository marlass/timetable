const combinatorics = require('js-combinatorics');
const fs = require('fs');

let timetable;


fs.readFile('./w8_inf_pl_5_2016.json', (err, data) => {
  if (err) throw err;
  timetable = JSON.parse(data);
});



