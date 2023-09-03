import React from 'react';
import { deleteTransactions } from '../utils/deleteTransactions'
import { processTxInfo } from '../utils/processTxInfo'
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

    async function updateBalances(updates: any, data: any) {
        let result = {
            'monthly_budget_balance': {},
            'wallet_balance_after': 0
        }
        result = {...updates}
        const adaAmount = parseFloat(data.total_amounts[data.total_tokens.indexOf('ADA')]);
        if (data.tx_type == "Incoming") {
            result['wallet_balance_after'] = result['wallet_balance_after'] + adaAmount
        } else if (data.tx_type == "RewardsWithdrawal") {
            result['wallet_balance_after'] = result['wallet_balance_after'] + adaAmount - (parseFloat(data.fee)/1000000)
        } else {
            result['wallet_balance_after'] = (result['wallet_balance_after'] - (adaAmount + (parseFloat(data.fee)/1000000)))
        }
        console.log("updateBalances", updates, data, result)
        return result;
    }
    
    async function insertTxs() {
        let updates: any = {};
        let balanceUpdates: any = {}
        balanceUpdates['monthly_budget_balance'] = {};
        balanceUpdates['wallet_balance_after'] = 0;
    
        for (let idx in myVariable.transactionInfo) {
            let data: any = processTxInfo(myVariable.transactionInfo[idx], myVariable);
            let updatedBalances = await updateBalances(balanceUpdates, data);
            balanceUpdates = updatedBalances;
            updates = { ...balanceUpdates, ...data };
            console.log("inserting txs", updatedBalances, updates);
        }
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
