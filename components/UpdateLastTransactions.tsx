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
        let txData: any = {}
        let updates: any = {};
        let balanceUpdates: any = {}
        balanceUpdates['monthly_budget_balance'] = {};
        balanceUpdates['wallet_balance_after'] = 0;
    
        for (let idx in myVariable.transactionInfo) {
            let data: any = processTxInfo(myVariable.transactionInfo[idx], myVariable);
            let updatedBalances = await processMonthlyBudget(balanceUpdates, data, myVariable);
            balanceUpdates = updatedBalances;
            updates = { ...balanceUpdates, ...data };
            txData[idx] = {}
            txData[idx] = myVariable.transactionInfo[idx]
            txData[idx]['txData'] = updates
            let status = await updateDatabase(txData[idx].txMetadata.metadata, updates.transaction_id, myVariable, updates);
            console.log("inserting txs", status);
            //console.log("inserting txs", updatedBalances, updates);
        }
        console.log("txData", txData)
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
