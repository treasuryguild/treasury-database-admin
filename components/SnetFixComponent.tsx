import React from 'react';
import { useMyVariable } from '../context/MyVariableContext';
import { updateSnetDatabase } from '../utils/updateSnetDatabase';
import { mergeSnetData } from '../utils/mergeSnetData';
import { updateGitHubFile } from '../utils/updateGitHubFile'

const SnetFixComponent = () => {
    const { myVariable, setMyVariable } = useMyVariable();
    
    async function test() { 
        console.log("Test 2", myVariable.csvDoc, myVariable.gitHubTxs, myVariable.databaseTxs)
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
      let transactions = await mergeSnetData(myVariable.csvDoc, myVariable.gitHubTxs, myVariable.databaseTxs);
      const { gitHubTxs, txidToFileMap } = myVariable;
    
      for (const updatedTransaction of transactions) {
        const { filename, sha } = txidToFileMap[updatedTransaction.txid];
        await updateGitHubFile(filename, updatedTransaction, sha);
      }
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
