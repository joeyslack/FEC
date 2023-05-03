// Contributions by individuals file format
// https://www.fec.gov/campaign-finance-data/contributions-individuals-file-description/

const fs = require('fs');
const format = require('pg-format');
const { Client } = require('pg');
const { exit } = require('process');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'FEC',
  user: 'jslack',
  password: '',
});

client.connect()

const tableColumns = [
  'CMTE_ID',
  'AMNDT_IND',
  'RPT_TP',
  'TRANSACTION_PGI',
  'IMAGE_NUM',
  'TRANSACTION_TP',
  'ENTITY_TP',
  'NAME',
  'CITY',
  'STATE',
  'ZIP_CODE',
  'EMPLOYER',
  'OCCUPATION',
  'TRANSACTION_DT',
  'TRANSACTION_AMT',
  'OTHER_ID',
  'TRAN_ID',
  'FILE_NUM',
  'MEMO_CD',
  'MEMO_TEXT',
  'SUB_ID'
];

const insertData = async (columns, fileName) => {
  console.log(`Inserting data from '${fileName}'...`);

  let queryPromises = [];
  // We must use streams due to size of string/input/buffer
  // const rr = fs.createReadStream(`indiv/${fileName}/itcont.txt`);
  const rr = fs.createReadStream(`indiv/${fileName}/by_date/itcont_2016_invalid_dates.txt`);
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
          // Fix dates. Data set has MMDDYYY
          if (i === 13 && val !== null && val && val.length > 0) {
            let [match, mm, dd, yyyy] = val.match(/(\d{2})(\d{2})(\d{4})/);
            values[i] = `${yyyy}-${mm}-${dd}`;
          } else if (i === 13 && !val) {
            values[i] = undefined;
          }
          // All else
          else values[i] = val && val.length > 0 ? val : undefined;
        });

        if (line && values && values.length > 0) {
          batchInsert.push(values);
        }
      }
      // Data cut off from stream, add it to buffer to be collected on next read
      else if (cols.length < tableColumns.length) buffer = line;
    });

    if (batchInsert && batchInsert.length > 0) {
      // contributions_by_individuals
      const insert = `INSERT INTO contributions_by_individuals("${columns.join('","')}") VALUES %L`;
      queryPromises.push(client.query(format(insert, batchInsert)));
    }

    // Not sure if this is really safe or not, 
    // might delete some pending queries?
    try {
      if (global.gc) {global.gc();}
    } catch (e) {
      console.log("`GC Error. node --expose-gc index.js`");
    }
  });

  rr.on('end', () => {
    console.log('File streaming complete. Waiting for query promises to resolve. This may take some time...')
    
    // Execute all query and fulfill promises
    Promise.all(queryPromises).then(res => {
      console.log('All done! Check db before killing this process.');
    });
  });
}

(async() => {
  await insertData(tableColumns, 'indiv16');
})()
