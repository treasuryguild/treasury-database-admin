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
              transactionDate: tx.transactionDate,
              txid: tx.txid,
              msg: tx.msg,
              mdVersion: tx.mdVersion
            };
          });
        }).flat();

        function hashObject(obj) {
          const str = JSON.stringify(obj);
          let hash = 0, i, chr;
          for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
          }
          return hash;
        }

        const finalData = csvToObjArray.map((contribution) => {
          const { 'Task ID': _, 'Rewarded': __, 'ADA': ___, 'AGIX': ____, 'GMBL': _____, ...rest } = contribution;
          return rest;
        }); 
        
        // Add this block for removing duplicates based on hash
        const seenHashes = new Set();
        const uniqueFinalCsvData = finalData.filter((contribution) => {
          const hash = hashObject(contribution);
          if (seenHashes.has(hash)) {
            return false;
          }
          seenHashes.add(hash);
          return true;
        });
    
    
        const combinedData = gitHubToObjArray.map((gitHubRow) => {
          if (!gitHubRow) return null; // Skip if null or undefined
        
          let descriptionStr = "";
        
          if (Array.isArray(gitHubRow.description)) {
            descriptionStr = gitHubRow.description.join(' ');
          } else if (Array.isArray(gitHubRow.name)) {
            descriptionStr = gitHubRow.name.join(' ');
          }
        
          const csvRow = uniqueFinalCsvData.find((csvRow) => {
            return descriptionStr === csvRow['Task Name'];
          });
        
          return {
            ...csvRow,
            ...gitHubRow,
          };
        }).reduce((acc, curr) => {
          if (curr !== null) {
            acc.push(curr);
          }
          return acc;
        }, []); 
        
        const filteredAndUpdatedCombinedData = combinedData
          .filter((contribution) => {
            return contribution.msg;  // Remove transactions without 'msg'
          })
          .map((contribution) => {
            // Only add arrayMap if it doesn't exist
            if (!contribution.arrayMap) {
              // Initialize arrayMap
              contribution.arrayMap = {};
              // Check if "Date (task completed)" exists, if not use transactionDate
              const dateValue = contribution["Date (task completed)"] ? contribution["Date (task completed)"] : contribution.transactionDate;
              // Move date to arrayMap.date
              contribution.arrayMap.date = [dateValue];
              // Move label array to arrayMap.label
              contribution.arrayMap.label = contribution.label;
              
              let subGroup = "no subgroup";
      
              if (contribution["Sub Group"]) {
                subGroup = contribution["Sub Group"];
              } else {
                const descriptionStr = contribution.description ? contribution.description.join(' ') : '';
                const nameStr = contribution.name ? contribution.name.join(' ') : '';
                const combinedStr = `${descriptionStr} ${nameStr}`.toLowerCase();
        
                if (combinedStr.includes("translate into") || combinedStr.includes("verify translation") || combinedStr.includes("translate to")) {
                  subGroup = "ambassador-translator";
                } else if (combinedStr.includes("handling fee") || combinedStr.includes("monthly fee for treasury work")) {
                  subGroup = "treasury-guild";
                }
              }
        
              contribution.arrayMap.subGroup = [subGroup];
            }
            return contribution;
          });

      // Transform uniqueFinalData back to original transaction format
      const contributionsToTransactions = (data) => {
        return data.reduce((acc, contribution) => {
          const { txid, msg, mdVersion } = contribution;
      
          const existingTransaction = acc.find((trans) => trans.txid === txid);
      
          if (existingTransaction) {
            existingTransaction.contributions.push(contribution);
          } else {
            acc.push({
              txid,
              msg: Array.isArray(msg) ? msg : [msg],
              mdVersion: Array.isArray(mdVersion) ? mdVersion : [mdVersion],
              contributions: [contribution],
            });
          }
          
          return acc;
        }, []);
      };

      // Function to keep only certain keys in an object
      const keepKeys = (obj, keysToKeep) => {
        return Object.keys(obj).reduce((newObj, key) => {
          if (keysToKeep.includes(key)) {
            newObj[key] = obj[key];
          }
          return newObj;
        }, {});
      };
      
      // Your existing keysToKeep array
      const keysToKeep = ['taskCreator', 'name', 'contributors', 'arrayMap', 'description'];
      
      const filterContributionsInTransactions = (transactions) => {
        transactions.forEach((transaction) => {
          transaction.contributions = transaction.contributions.map((contribution) => keepKeys(contribution, keysToKeep));
        });
      };
      
      // Sample usage after calling contributionsToTransactions
      transactions = contributionsToTransactions(filteredAndUpdatedCombinedData);
      filterContributionsInTransactions(transactions);
      //console.log("filteredAndUpdatedCombinedData", filteredAndUpdatedCombinedData)
      //transactions = filteredAndUpdatedCombinedData;
      return transactions
    }

    let transactions = await checkTxs()
    return transactions;
}