const fs = require('fs');
const format = require('pg-format');
const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'FEC',
  user: 'jslack',
  password: '',
});

// client.connect((err) => {
//   if (err) {
//     console.error('connection error', err.stack)
//   } else {
//     console.log('connected')


//     console.log('hi', getTableColumns())
//   }
// })



client.connect()


// // 1. Get column names
const query = "SELECT column_name FROM information_schema.columns WHERE table_name = 'campaign_finance_data'";

// const getTableColumns = () => {
//   let columns = [];
//   return client.query(query).then(res => {
//     if (res && res.rows) {    
//       res.rows.forEach(val => {
//         console.log('z');
//         columns.push(val.column_name);
//       })

//       return columns;
//     }
//   })
// }

const tableColumns = [
  'CAND_ID',
  'CAND_NAME',
  'CAND_ICI',
  'PTY_CD',
  'CAND_PTY_AFFILIATION',
  'TTL_RECEIPTS',
  'TRANS_FROM_AUTH',
  'TTL_DISB',
  'TRANS_TO_AUTH',
  'COH_BOP',
  'COH_COP',
  'CAND_CONTRIB',
  'CAND_LOANS',
  'OTHER_LOANS',
  'CAND_LOAN_REPAY',
  'OTHER_LOAN_REPAY',
  'DEBTS_OWED_BY',
  'TTL_INDIV_CONTRIB',
  'CAND_OFFICE_ST',
  'CAND_OFFICE_DISTRICT',
  'SPEC_ELECTION',
  'PRIM_ELECTION',
  'RUN_ELECTION',
  'GEN_ELECTION',
  'GEN_ELECTION_PRECENT',
  'OTHER_POL_CMTE_CONTRIB',
  'POL_PTY_CONTRIB',
  'CVG_END_DT',
  'INDIV_REFUNDS',
  'CMTE_REFUNDS'
];




const insertData = async (columns, fileName) => {  
  const allFileContents = fs.readFileSync(`weball/${fileName}`, 'utf-8');
  allFileContents.split(/\r?\n/).forEach(async line =>  {
    // const values = line.split('|');
    let values = [];
    line.split('|').forEach((val, i) => {
      values[i] = val && val.length > 0 ? val : undefined;
    })

    // console.log(`Line from file: ${line}`);
    // console.log(fields, '---', fields.length);
    if (line && values && values.length > 0) {
      // const insert = `INSERT INTO campaign_finance_data("${columns.join('","')}") VALUES(\'${values.join("\',\'")}\')`
      // const insert = 'INSERT INTO campaign_finance_data("CAND_ID") VALUES(\'111111111\') RETURNING *'
      const insert = `INSERT INTO campaign_finance_data_all("${columns.join('","')}") VALUES (%L)`;
      // console.log('insert', format(insert, values));
      
      await client.query(format(insert, values), (err, res) => {
        if (err) {
          console.log(err.stack)
          throw(err);
        } else {
          console.log(res)
        }
      })
    }
  });
}




(async() => {
  await insertData(tableColumns, 'weball24.txt');
})()











////////////// old




// const tableColumns = await getTableColumns();


// // 1. Get column names
// const query = "SELECT column_name FROM information_schema.columns WHERE table_name = 'campaign_finance_data'";

// const getTableColumns = async () =>
//   await client.query(query, (err, res) => {
//     if (!err && res && res.rows) {    
//       res.rows.forEach(val => {
//         console.log('z')
//         columns.push(val.column_name)
//       })
//     }
//   })

// // const tableColumns = await getTableColumns();


// // // Call start
// (async() => {
//   //console.log('before start')
//   // await start();
//   // console.log('after start');
// })()






// const allFileContents = fs.readFileSync('weball/weball12.txt', 'utf-8');
// allFileContents.split(/\r?\n/).forEach(async line =>  {
//   const values = line.split('|')
//   // console.log(`Line from file: ${line}`);
//   // console.log(fields, '---', fields.length);
  
// });
  
  


  // const insert = 'INSERT INTO campaign_finance_data() VALUES($1, $2) RETURNING *'
  // console.log('?');
  // await client.query(insert, values, (err, res) => {
  //   if (err) {
  //     console.log(err.stack)
  //   } else {
  //     console.log(res.rows[0])
  //     // { name: 'brianc', email: 'brian.m.carlson@gmail.com' }
  //   }
  // })
// });


 
// const res = await client.query('SELECT $1::text as message', ['Hello world!'])
// console.log(res.rows[0].message) // Hello world!
// await client.end()