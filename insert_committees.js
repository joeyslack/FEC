// Committee master file list
// https://www.fec.gov/campaign-finance-data/committee-master-file-description/

// const fs = require('fs');
const { promises: fs } = require("fs");
// const { readdir } = from 'node:fs/promises';
const { createReadStream, readdir } = require('node:fs');

const format = require('pg-format');
const { Client } = require('pg');
const { exit } = require('process');
const { error } = require('console');

// TODO: Replace with env variables
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'FEC',
  user: 'jslack',
  password: '',
});

// TODO: Consider connection pooling, and graceful termination
client.connect();

const tableColumns = [
  'CMTE_ID',
  'CMTE_NM',
  'TRES_NM',
  'CMTE_ST1',
  'CMTE_ST2',
  'CMTE_CITY',
  'CMTE_ST',
  'CMTE_ZIP',
  'CMTE_DSGN',
  'CMTE_TP',
  'CMTE_PTY_AFFILIATION',
  'CMTE_FILING_FREQ',
  'ORG_TP',
  'CONNECTED_ORG_NM',
  'CAND_ID'
];

let tasks = [];
let tasksCompletedCount = 0;

const callTasks = () => {
  return tasks.reduce((prev, task) => {
    return prev
      .then(task)
      .catch(err => {
        console.warn('err', err.message);
      });
  }, Promise.resolve());
};

const start = async (dir) => {  
  fs.readdir(dir).then(files => {
    files.forEach(file => {
      console.log('Readdir::', file);
      // Only handle files with valid dates
      if (file.indexOf('invalid_dates.txt') === -1) tasks.push(insertData(tableColumns, dir + '/' + file));
    });

    return callTasks();
  });
  
}


const insertData = async (columns, fileName) => {
  console.log(`Inserting data from '${fileName}'...`);

  let queryPromises = [];
  // We must use streams due to size of string/input/buffer
  // const rr = fs.createReadStream(`indiv/${fileName}/itcont.txt`);
  const rr = createReadStream(`${fileName}`);
  // Buffer is used to add on previous string that might have been incomplete from previous read
  let buffer = "";

  rr.on('readable', () => {
    let z = rr.read();
    let r = buffer + (z ? z.toString() : "");
    buffer = "";
    let batchInsert = [];

    // Read each line
    r.split(/\r?\n/).forEach(async line =>  {
      let values = [];
      // Get column
      let cols = line.split('|');
      
      if (cols.length === tableColumns.length) {        
        cols.forEach((val, i) => {
          values[i] = val && val.length > 0 ? val : undefined;
        });

        if (line && values && values.length > 0) {
          batchInsert.push(values);
        }
      }
      // Data cut off from stream, add it to buffer to be collected on next read
      else if (cols.length < tableColumns.length) buffer = line;
    
    }); // end readable stream

    // Batch insert once per file stream
    if (batchInsert && batchInsert.length > 0) {
      // committees
      const insert = `INSERT INTO committees("${columns.join('","')}") VALUES %L`;
      queryPromises.push(client.query(format(insert, batchInsert)).catch((e) => console.error(e.stack)));
    }

    // Not sure if this is really safe or not, 
    // might delete some pending queries?
    try {
      if (global.gc) { global.gc(); }
    } catch (e) {
      console.log("`GC Error. node --expose-gc index.js`");
    }
  });

  rr.on('end', () => {
    console.log('File streaming complete. Waiting for query promises to resolve. This may take some time...')
    
    // Execute all query and fulfill promises
    Promise.all(queryPromises).then(res => {
      tasksCompletedCount++;
      console.log(`Finished a promise set: ${tasksCompletedCount} of ${tasks.length}`);

      if (tasks.length > 0 && tasksCompletedCount >= tasks.length) {
        console.log('All done! Check db before killing this process...');
      }
    });
  });
}

(async() => {
  if (!process.argv || process.argv.length < 3) {
    throw new Error('Must supply a directory argument');
  }

  // await insertData(tableColumns, 'indiv18');
  await start(`./cm/${process.argv[2]}`);
})()
