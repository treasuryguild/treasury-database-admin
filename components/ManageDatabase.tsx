import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'
import { processTxInfo } from '../utils/processTxInfo'
import { processMonthlyBudget } from '../utils/processMonthlyBudget'
import { updateDatabase } from '../utils/updateDatabase'

interface ManageDatabaseProps {
    myVariable: any;
    groupName: string;
    projectName: string;
  }

  const ManageDatabase: React.FC<ManageDatabaseProps> = ({ myVariable, groupName, projectName }) => {
    
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
            <p>Delete and insert all txs at once</p>
            <button onClick={deleteTxs} className="navitems">
            Delete All Txs
            </button>
            <button onClick={insertTxs} className="navitems">
            insert All Txs
            </button>
        </div>
    );
};

export default ManageDatabase;
