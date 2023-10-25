import React from 'react';
import { useMyVariable } from '../context/MyVariableContext';
import { updateSnetDatabase } from '../utils/updateSnetDatabase';
import { mergeSnetData } from '../utils/mergeSnetData';

const SnetFixComponent = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    
    async function mergeTxs() {
      const csvToObjArray = myVariable.csvDoc.slice(1).map((row: any) => {
        return row.reduce((obj: any, value: any, index: any) => {
        obj[myVariable.csvDoc[0][index]] = value;
        return obj;
      }, {});
    });
    const gitHubToObjArray = myVariable.gitHubTxs.map((tx: any) => {
      return tx.contributions.map((contribution: any) => {
        return {
          ...contribution,
          txid: tx.txid,
          msg: tx.msg,
          mdVersion: tx.mdVersion
        };
      });
    }).flat();

    const combinedData = csvToObjArray.map((csvRow: any) => {
      const gitHubRow = gitHubToObjArray.find((gitHubRow: any) => {
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

    const filteredAndUpdatedCombinedData = combinedData
    .filter((contribution: any) => {
      return contribution.msg && contribution.txid === contribution['Transaction ID'];
    })  // Remove transactions without 'msg' and where txid is not equal to 'Transaction ID'
    .map((contribution: any) => {
      // Only add arrayMap if it doesn't exist
      if (!contribution.arrayMap) {
        // Initialize arrayMap
        contribution.arrayMap = {};
        // Move "Date (task completed)" to arrayMap.date
        contribution.arrayMap.date = [contribution["Date (task completed)"]];
        // Move label array to arrayMap.label
        contribution.arrayMap.label = contribution.label;
        // Move "Sub Group" value to arrayMap.subGroup
        contribution.arrayMap.subGroup = [contribution["Sub Group"]];
      }
      return contribution;
    });
  
    const finalData = filteredAndUpdatedCombinedData.map((contribution: any) => {
      const { 'Task ID': _, ...rest } = contribution;  // Remove "Task ID"
      return rest;
    });  
    
    // Add this block for removing duplicates based on hash
const seenHashes = new Set();
const uniqueFinalData = finalData.filter((contribution: any) => {
  const hash = hashObject(contribution);
  if (seenHashes.has(hash)) {
    return false;
  }
  seenHashes.add(hash);
  return true;
});

// Transform uniqueFinalData back to original transaction format
const contributionsToTransactions = (data: any) => {
  return data.reduce((acc: any, contribution: any) => {
    const { txid, msg, mdVersion } = contribution;

    const existingTransaction = acc.find((trans: any) => trans.txid === txid);

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
const keepKeys = (obj: any, keysToKeep: string[]) => {
  return Object.keys(obj).reduce((newObj: any, key: string) => {
    if (keysToKeep.includes(key)) {
      newObj[key] = obj[key];
    }
    return newObj;
  }, {});
};

// Your existing keysToKeep array
const keysToKeep = ['taskCreator', 'name', 'contributors', 'arrayMap', 'description'];

const filterContributionsInTransactions = (transactions: any[]) => {
  transactions.forEach((transaction: any) => {
    transaction.contributions = transaction.contributions.map((contribution: any) => keepKeys(contribution, keysToKeep));
  });
};

// Sample usage after calling contributionsToTransactions
const transactions = contributionsToTransactions(uniqueFinalData);
filterContributionsInTransactions(transactions);
setMyVariable(prevState => ({
  ...prevState,
  transactions: transactions,
}));
console.log("Transformed Transactions from uniqueFinalData", transactions, uniqueFinalData);
}

    async function test() { 
        console.log("Test 2", myVariable.csvDoc, myVariable.gitHubTxs, myVariable.databaseTxs)
    }

    function hashObject(obj: any) {
      const str = JSON.stringify(obj);
      let hash = 0, i, chr;
      for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }
    
    async function mergeData() {
      let transactions = await mergeSnetData(myVariable.csvDoc, myVariable.gitHubTxs, myVariable.databaseTxs);
      console.log("transactions", transactions)
    }
    async function checkDatabase() {
      let status = await updateSnetDatabase(myVariable.transactions[0], myVariable.transactions[0].txid)
      console.log("database", status)
    }
    async function updateDatabase() {
      console.log("Updating Database")
    }
    async function updateGitHub() {
      console.log("Updating GitHub")
    }
    return (
        <div>
            <h2>This is the Snet Fix component</h2>
            <button onClick={test}>Fix database</button>
            <button onClick={mergeData}>mergeData</button>
            <button onClick={checkDatabase}>checkDatabase</button>
            <button onClick={updateDatabase}>updateDatabase</button>
            <button onClick={updateGitHub}>updateGitHub</button>
        </div>
    );
};

export default SnetFixComponent;
