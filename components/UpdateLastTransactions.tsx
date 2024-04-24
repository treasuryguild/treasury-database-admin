import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'
import { processTxInfo } from '../utils/processTxInfo'
import { processMonthlyBudget } from '../utils/processMonthlyBudget'
import { updateDatabase } from '../utils/updateDatabase'

interface UpdateLastTransactionsProps {
    myVariable: any;
    groupName: string;
    projectName: string;
  }

  const UpdateLastTransactions: React.FC<UpdateLastTransactionsProps> = ({ myVariable, groupName, projectName }) => {
    
    console.log("myVariable inside Database management", myVariable)

    async function deleteTxs() {
        const status = await deleteTransactions(myVariable.projectInfo.project_id);
        console.log("deleting txs", status)
    }

    async function insertTxs() {
        console.log("test")
        let txData: any = {};
        let updates: any = {};
        let balanceUpdates: any = {};
        balanceUpdates['monthly_budget_balance'] = {};
        balanceUpdates['wallet_balance_after'] = 0;
      
        console.log("myVariable.transactions", myVariable.transactions);
        console.log("myVariable.transactionInfo", myVariable.transactionInfo);
        // Create a Set to store the transaction IDs from myVariable.transactionInfo
        const existingTxIds = new Set(
          myVariable.transactions.map((tx: any) => tx.transaction_id)
        );
        console.log("existingTxIds", existingTxIds);
        // Filter out the transactions that are already in myVariable.transactionInfo
        const newTransactions = myVariable.transactionInfo.filter(
          (tx: any) => !existingTxIds.has(tx.txInfo.tx_hash) //tx.txInfo.tx_hash
        );
        console.log("newTransactions", newTransactions);
        for (let tx of newTransactions) {
          let data: any = processTxInfo(tx, myVariable);
          let updatedBalances = await processMonthlyBudget(balanceUpdates, data, myVariable);
          balanceUpdates = updatedBalances;
          updates = { ...balanceUpdates, ...data };
      
          txData[tx.tx_id] = {
            ...tx,
            txData: updates,
          };
          console.log("data", data);
          console.log("updatedBalances", updatedBalances);
          console.log("updates", updates);
          console.log("txData", txData);
          let status = await updateDatabase(
            tx.txMetadata.metadata,
            updates.transaction_id,
            myVariable,
            updates
          );
          console.log("inserting txs", status);
        }
      
        console.log("txData", txData);
      }           

    return (
        <div>
            <h2>Database management</h2>
            <p>Insert last few transactions from GitHub</p>
            <button onClick={insertTxs} className="navitems">
            insert last few Txs
            </button>
        </div>
    );
};

export default UpdateLastTransactions;
