export async function mergeSnetData(csvDoc, gitHubTxs, databaseTxs) {
    
    async function checkTxs() {
        let transactions = [];
        const csvToObjArray = csvDoc.slice(1).map((row) => {
            return row.reduce((obj, value, index) => {
            obj[csvDoc[0][index]] = value;
            return obj;
          }, {});
        });
        const gitHubToObjArray = gitHubTxs.map((tx) => {
          return tx.contributions.map((contribution) => {
            return {
              ...contribution,
              txid: tx.txid,
              msg: tx.msg,
              mdVersion: tx.mdVersion
            };
          });
        }).flat();
    
        const combinedData = csvToObjArray.map((csvRow) => {
          const gitHubRow = gitHubToObjArray.find((gitHubRow) => {
            if (gitHubRow) { // Check for null or undefined
              let descriptionStr = "";
              if (Array.isArray(gitHubRow.description)) {
                descriptionStr = gitHubRow.description.join(' '); // Join description array into a single string with space as a separator
              }
              else if (Array.isArray(gitHubRow.name)) {
                descriptionStr = gitHubRow.name.join(' '); // Join name array into a single string with space as a separator
              }
              
              return descriptionStr === csvRow['Task Name'];
            }
            return false;
          });
        
          return {
            ...csvRow,
            ...gitHubRow
          };
        });    
        transactions = combinedData;
        return transactions
    }

    let transactions = await checkTxs()
    return transactions;
}