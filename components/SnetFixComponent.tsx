import React from 'react';
import { useMyVariable } from '../context/MyVariableContext'

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
          msg: tx.msg
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
    .filter((transaction: any) => {
      return transaction.msg && transaction.txid === transaction['Transaction ID'];
    })  // Remove transactions without 'msg' and where txid is not equal to 'Transaction ID'
    .map((transaction: any) => {
      // Only add arrayMap if it doesn't exist
      if (!transaction.arrayMap) {
        // Initialize arrayMap
        transaction.arrayMap = {};
        // Move "Date (task completed)" to arrayMap.date
        transaction.arrayMap.date = [transaction["Date (task completed)"]];
        // Move label array to arrayMap.label
        transaction.arrayMap.label = transaction.label;
        // Move "Sub Group" value to arrayMap.subGroup
        transaction.arrayMap.subGroup = [transaction["Sub Group"]];
      }
      return transaction;
    });
  
    const finalData = filteredAndUpdatedCombinedData.map((transaction: any) => {
      const { 'Task ID': _, ...rest } = transaction;  // Remove "Task ID"
      return rest;
    });  
    
    // Add this block for removing duplicates based on hash
const seenHashes = new Set();
const uniqueFinalData = finalData.filter((transaction: any) => {
  const hash = hashObject(transaction);
  if (seenHashes.has(hash)) {
    return false;
  }
  seenHashes.add(hash);
  return true;
});

    console.log("combinedData, filteredAndUpdatedCombinedData, finalData", combinedData, filteredAndUpdatedCombinedData, finalData, uniqueFinalData)
    }

    async function test() { 
        setMyVariable(prevState => ({
            ...prevState,
            transactions: [],
          }));
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
    
    
    return (
        <div>
            <h2>This is the Snet Fix component</h2>
            <button onClick={test}>Fix database</button>
            <button onClick={mergeTxs}>mergeTxs</button>
        </div>
    );
};

export default SnetFixComponent;
